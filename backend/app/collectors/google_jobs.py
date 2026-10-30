"""Google Search for Jobs Collector via Browser Automation."""
import logging
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional
from bs4 import BeautifulSoup

from backend.app.collectors.base import BaseCollector, NormalizedJob
from backend.app.browser.manager import get_stealth_browser

logger = logging.getLogger(__name__)


class GoogleJobsCollector(BaseCollector):
    """Scrapes Google Search Jobs (Google for Jobs) indexing Greenhouse, Lever, Workday."""
    name: str = "google_jobs"
    rate_limit_per_minute: int = 15

    async def fetch_jobs(self, keywords: List[str]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        if not keywords:
            return results

        search_terms = keywords[:2]

        try:
            async with get_stealth_browser(headless=True) as context:
                page = await context.new_page()

                for term in search_terms:
                    encoded_query = urllib.parse.quote(f"{term} jobs remote")
                    # ibp=htl;jobs opens Google's native Jobs UI
                    url = f"https://www.google.com/search?q={encoded_query}&ibp=htl;jobs"

                    try:
                        logger.info(f"Navigating to Google Search Jobs: {term}")
                        await page.goto(url, wait_until="domcontentloaded", timeout=25000)
                        await page.wait_for_timeout(2500)

                        content = await page.content()
                        soup = BeautifulSoup(content, "html.parser")

                        # Google Jobs UI item selectors
                        job_cards = soup.select("[data-share-url], li.pEHgKc, div.gws-plugins-horizon-jobs__tl-lif")
                        if not job_cards:
                            # Fallback generic container
                            job_cards = soup.select("li[jsname], div.whs-card")

                        logger.info(f"Found {len(job_cards)} Google Jobs for keyword: {term}")

                        for card in job_cards[:10]:
                            try:
                                # Title
                                title_elem = card.select_one("[role='heading'], .BjJfJf, .KLsYvd, div.sMn82")
                                # Company
                                comp_elem = card.select_one(".vNEEBe, .nJlQNd, div.tNxQIb")
                                # Location
                                loc_elem = card.select_one(".Qk80nd, div.s2gQvd")
                                # Apply link or share url
                                share_url = card.get("data-share-url")
                                link_elem = card.select_one("a[href^='http']")

                                if not title_elem:
                                    continue

                                title = title_elem.get_text(strip=True)
                                company = comp_elem.get_text(strip=True) if comp_elem else "Hiring Company"
                                location = loc_elem.get_text(strip=True) if loc_elem else "Remote"

                                if share_url:
                                    canonical_url = self.normalize_url(share_url)
                                elif link_elem and link_elem.get("href"):
                                    canonical_url = self.normalize_url(link_elem.get("href"))
                                else:
                                    canonical_url = f"https://www.google.com/search?q={encoded_query}#job-{len(results)}"

                                region_code = self.resolve_region(None, f"{location} {title}")

                                job = NormalizedJob(
                                    canonical_url=canonical_url,
                                    company_name=company,
                                    title=title,
                                    location=location,
                                    region_code=region_code,
                                    description=f"{title} position at {company}. Location: {location}. Sourced via Google Search Jobs.",
                                    work_arrangement="remote",
                                    published_at=datetime.now(timezone.utc),
                                    source_name=self.name,
                                    external_id=canonical_url,
                                    raw_metadata={"search_term": term, "platform": "google_jobs"}
                                )
                                results.append(job)
                            except Exception as card_err:
                                logger.debug(f"Error parsing Google job item: {card_err}")
                    except Exception as page_err:
                        logger.warning(f"Failed to fetch Google Search Jobs for '{term}': {page_err}")

        except Exception as e:
            logger.error(f"Google Jobs collector error: {e}")

        return results
