"""NaukriGulf Job Search Collector for GCC / Middle East jobs."""
import logging
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional
from bs4 import BeautifulSoup
import httpx

from backend.app.collectors.base import BaseCollector, NormalizedJob
from backend.app.browser.manager import get_stealth_browser

logger = logging.getLogger(__name__)


class NaukriGulfCollector(BaseCollector):
    """Scrapes NaukriGulf for Gulf & Arab region tech jobs (UAE, Saudi, Qatar, etc.)."""
    name: str = "naukrigulf"
    rate_limit_per_minute: int = 15

    async def fetch_jobs(self, keywords: List[str]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        if not keywords:
            return results

        # Focus on top 2 high-priority keywords
        search_terms = keywords[:2]

        # 1. Try fast HTTP request with realistic browser headers first
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        for term in search_terms:
            slug = term.lower().replace(" ", "-")
            url = f"https://www.naukrigulf.com/{slug}-jobs-in-uae"

            try:
                logger.info(f"Fetching NaukriGulf jobs for: {term}")
                async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
                    res = await client.get(url)
                    if res.status_code == 200:
                        soup = BeautifulSoup(res.text, "html.parser")
                        cards = soup.select(".ng-job-tuple, .srp-jobtuple, article, [data-job-id]")
                        if cards:
                            for card in cards[:10]:
                                job = self._parse_card(card, term)
                                if job:
                                    results.append(job)
                            continue
            except Exception as e:
                logger.debug(f"NaukriGulf direct HTTP failed, trying browser: {e}")

            # 2. Fallback to stealth Playwright browser if direct HTTP was protected
            try:
                async with get_stealth_browser(headless=True) as context:
                    page = await context.new_page()
                    logger.info(f"Navigating to NaukriGulf via browser for: {term}")
                    await page.goto(url, wait_until="domcontentloaded", timeout=20000)
                    await page.wait_for_timeout(2000)

                    content = await page.content()
                    soup = BeautifulSoup(content, "html.parser")
                    cards = soup.select(".ng-job-tuple, .srp-jobtuple, article, [data-job-id]")

                    for card in cards[:10]:
                        job = self._parse_card(card, term)
                        if job:
                            results.append(job)
            except Exception as browser_err:
                logger.warning(f"NaukriGulf browser scrape error for '{term}': {browser_err}")

        return results

    def _parse_card(self, card, term: str) -> Optional[NormalizedJob]:
        try:
            title_elem = card.select_one(".job-title, a[title], h2, .title")
            company_elem = card.select_one(".org-name, .company-name, .company, span.org")
            loc_elem = card.select_one(".location, .loc, span[itemprop='addressLocality']")
            exp_elem = card.select_one(".exp, .experience")
            salary_elem = card.select_one(".salary, .sal")
            link_elem = card.select_one("a[href*='job-listings'], a[href*='naukrigulf.com'], a")

            if not title_elem:
                return None

            title = title_elem.get_text(strip=True)
            company = company_elem.get_text(strip=True) if company_elem else "Gulf Employer"
            location = loc_elem.get_text(strip=True) if loc_elem else "Dubai, UAE"

            if link_elem and link_elem.get("href"):
                raw_href = link_elem.get("href")
                if raw_href.startswith("/"):
                    raw_href = "https://www.naukrigulf.com" + raw_href
                canonical_url = self.normalize_url(raw_href)
            else:
                canonical_url = f"https://www.naukrigulf.com/job/{urllib.parse.quote(title)}-{term}"

            salary_text = salary_elem.get_text(strip=True) if salary_elem else None
            exp_text = exp_elem.get_text(strip=True) if exp_elem else ""

            country_code = "AE"
            loc_lower = location.lower()
            if "saudi" in loc_lower or "riyadh" in loc_lower or "jeddah" in loc_lower:
                country_code = "SA"
            elif "qatar" in loc_lower or "doha" in loc_lower:
                country_code = "QA"
            elif "oman" in loc_lower or "muscat" in loc_lower:
                country_code = "OM"
            elif "kuwait" in loc_lower:
                country_code = "KW"
            elif "bahrain" in loc_lower:
                country_code = "BH"

            return NormalizedJob(
                canonical_url=canonical_url,
                company_name=company,
                title=title,
                location=location,
                country_code=country_code,
                region_code="ARAB",
                description=f"{title} at {company}. Location: {location}. Experience required: {exp_text}. Sourced via NaukriGulf.",
                work_arrangement="remote" if "remote" in loc_lower else "onsite",
                published_at=datetime.now(timezone.utc),
                source_name=self.name,
                external_id=canonical_url,
                raw_metadata={"search_term": term, "platform": "naukrigulf", "salary_raw": salary_text}
            )
        except Exception as e:
            logger.debug(f"Error parsing NaukriGulf card: {e}")
            return None
