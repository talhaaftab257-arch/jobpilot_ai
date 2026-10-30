"""Indeed Job Search Collector via Browser Automation."""
import logging
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional
from bs4 import BeautifulSoup

from backend.app.collectors.base import BaseCollector, NormalizedJob
from backend.app.browser.manager import get_stealth_browser

logger = logging.getLogger(__name__)


class IndeedCollector(BaseCollector):
    """Scrapes Indeed job listings using stealth Playwright browser."""
    name: str = "indeed"
    rate_limit_per_minute: int = 15

    async def fetch_jobs(self, keywords: List[str]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        if not keywords:
            return results

        search_terms = keywords[:2]
        # Indeed hosts: pk.indeed.com for Pakistan, and location param for Asia hubs
        location_queries = [
            ("https://pk.indeed.com", "Pakistan", "PK", "PK"),
            ("https://www.indeed.com.sg", "Singapore", "SG", "ASIA"),
            ("https://www.indeed.com", "Remote", None, None),
        ]

        try:
            async with get_stealth_browser(headless=True) as context:
                page = await context.new_page()

                for term in search_terms:
                    encoded_query = urllib.parse.quote(term)
                    for host, loc_label, country_code, forced_region in location_queries:
                        url = f"{host}/jobs?q={encoded_query}&l={urllib.parse.quote(loc_label)}&fromage=7"

                        try:
                            logger.info(f"Indeed search: {term} @ {loc_label} ({host})")
                            await page.goto(url, wait_until="domcontentloaded", timeout=25000)
                            await page.wait_for_timeout(1800)

                            content = await page.content()
                            soup = BeautifulSoup(content, "html.parser")
                            job_cards = soup.select(".job_seen_beacon, [data-jk], .resultContent")
                            logger.info(f"Found {len(job_cards)} Indeed cards for {term}/{loc_label}")

                            for card in job_cards[:8]:
                                try:
                                    title_elem = card.select_one("h2.jobTitle span, .jobTitle a")
                                    company_elem = card.select_one("[data-testid='company-name'], .companyName")
                                    loc_elem = card.select_one("[data-testid='text-location'], .companyLocation")
                                    link_elem = card.select_one("h2.jobTitle a, a[data-jk]")

                                    if not title_elem:
                                        continue

                                    title = title_elem.get_text(strip=True)
                                    company = company_elem.get_text(strip=True) if company_elem else "Indeed Employer"
                                    location = loc_elem.get_text(strip=True) if loc_elem else loc_label

                                    job_key = card.get("data-jk") or (link_elem.get("data-jk") if link_elem else None)
                                    if job_key:
                                        canonical_url = f"{host}/viewjob?jk={job_key}"
                                    elif link_elem and link_elem.get("href"):
                                        href = link_elem.get("href")
                                        if href.startswith("http"):
                                            canonical_url = self.normalize_url(href)
                                        else:
                                            canonical_url = self.normalize_url(host + href)
                                    else:
                                        continue

                                    region_code = forced_region or self.resolve_region(
                                        country_code, f"{location} {title}"
                                    )

                                    job = NormalizedJob(
                                        canonical_url=canonical_url,
                                        company_name=company,
                                        title=title,
                                        location=location,
                                        country_code=country_code,
                                        region_code=region_code,
                                        description=f"{title} at {company}. Location: {location}. Sourced via Indeed.",
                                        work_arrangement="remote" if loc_label == "Remote" else "hybrid",
                                        published_at=datetime.now(timezone.utc),
                                        source_name=self.name,
                                        external_id=canonical_url,
                                        raw_metadata={
                                            "search_term": term,
                                            "platform": "indeed",
                                            "search_location": loc_label,
                                        },
                                    )
                                    results.append(job)
                                except Exception as card_err:
                                    logger.debug(f"Error parsing Indeed card: {card_err}")
                        except Exception as page_err:
                            logger.warning(f"Failed Indeed search '{term}' @ {loc_label}: {page_err}")

        except Exception as e:
            logger.error(f"Indeed collector error: {e}")

        return results
