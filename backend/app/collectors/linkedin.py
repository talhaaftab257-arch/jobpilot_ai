"""LinkedIn Public Job Search Collector via Browser Automation."""
import logging
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional
from bs4 import BeautifulSoup

from backend.app.collectors.base import BaseCollector, NormalizedJob
from backend.app.browser.manager import get_stealth_browser

logger = logging.getLogger(__name__)


class LinkedInCollector(BaseCollector):
    """Scrapes LinkedIn public job listings without requiring credentials."""
    name: str = "linkedin"
    rate_limit_per_minute: int = 15

    async def fetch_jobs(self, keywords: List[str]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        if not keywords:
            return results

        # Top keywords × region locations so PK / ASIA / ARAB are not starved by US remote
        search_terms = keywords[:2]
        location_queries = [
            ("Pakistan", "PK", "PK"),
            ("Singapore", "SG", "ASIA"),
            ("Malaysia", "MY", "ASIA"),
            ("United Arab Emirates", "AE", "ARAB"),
            ("Germany", "DE", "EU"),
            ("", None, None),  # global / remote
        ]

        try:
            async with get_stealth_browser(headless=True) as context:
                page = await context.new_page()

                for term in search_terms:
                    encoded_query = urllib.parse.quote(term)
                    for loc_label, country_code, forced_region in location_queries:
                        loc_param = f"&location={urllib.parse.quote(loc_label)}" if loc_label else "&f_WT=2"
                        # f_TPR=r259200 → last 72 hours
                        url = (
                            f"https://www.linkedin.com/jobs/search?"
                            f"keywords={encoded_query}{loc_param}&f_TPR=r259200&position=1&pageNum=0"
                        )

                        try:
                            logger.info(f"LinkedIn search: {term} @ {loc_label or 'Remote'}")
                            await page.goto(url, wait_until="domcontentloaded", timeout=25000)
                            await page.wait_for_timeout(1800)

                            content = await page.content()
                            soup = BeautifulSoup(content, "html.parser")
                            job_cards = soup.select(".base-card, .job-search-card")
                            logger.info(f"Found {len(job_cards)} LinkedIn cards for {term}/{loc_label or 'remote'}")

                            for card in job_cards[:8]:
                                try:
                                    title_elem = card.select_one(".base-search-card__title, h3")
                                    company_elem = card.select_one(".base-search-card__subtitle, h4")
                                    loc_elem = card.select_one(".job-search-card__location")
                                    link_elem = card.select_one("a.base-card__full-link, a")

                                    if not title_elem or not link_elem:
                                        continue

                                    title = title_elem.get_text(strip=True)
                                    company = company_elem.get_text(strip=True) if company_elem else "Unknown Company"
                                    location = loc_elem.get_text(strip=True) if loc_elem else (loc_label or "Remote")
                                    raw_url = link_elem.get("href", "")
                                    if not raw_url:
                                        continue

                                    canonical_url = self.normalize_url(raw_url)
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
                                        description=f"{title} position at {company}. Location: {location}. Sourced via LinkedIn.",
                                        work_arrangement="remote" if not loc_label else "hybrid",
                                        published_at=datetime.now(timezone.utc),
                                        source_name=self.name,
                                        external_id=canonical_url,
                                        raw_metadata={
                                            "search_term": term,
                                            "platform": "linkedin",
                                            "search_location": loc_label or "remote",
                                        },
                                    )
                                    results.append(job)
                                except Exception as card_err:
                                    logger.debug(f"Error parsing LinkedIn job card: {card_err}")
                        except Exception as page_err:
                            logger.warning(f"Failed LinkedIn search '{term}' @ {loc_label}: {page_err}")

        except Exception as e:
            logger.error(f"LinkedIn collector error: {e}")

        return results
