"""Rozee.pk Job Search Collector for Pakistan market jobs."""
import logging
import re
import urllib.parse
from datetime import datetime, timezone
from typing import List
from bs4 import BeautifulSoup
import httpx

from backend.app.collectors.base import BaseCollector, NormalizedJob

logger = logging.getLogger(__name__)


class RozeeCollector(BaseCollector):
    """Scrapes Rozee.pk for Pakistan region tech jobs (Lahore, Karachi, Islamabad)."""
    name: str = "rozee_pk"
    rate_limit_per_minute: int = 15

    async def fetch_jobs(self, keywords: List[str]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        # Always include Pakistan-relevant search terms for this collector
        search_terms = list(dict.fromkeys(
            (keywords[:3] if keywords else []) + ["AI Engineer", "Python", "Software Engineer"]
        ))[:4]

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        async with httpx.AsyncClient(timeout=20.0, headers=headers, follow_redirects=True) as client:
            for term in search_terms:
                encoded = urllib.parse.quote(term)
                urls = [
                    f"https://www.rozee.pk/job/jsearch/q/{encoded}",
                    f"https://www.rozee.pk/job/jsearch/q/{encoded}/lc/Pakistan",
                ]
                for url in urls:
                    try:
                        logger.info(f"Fetching Rozee.pk jobs for: {term} → {url}")
                        res = await client.get(url)
                        if res.status_code != 200:
                            logger.warning(f"Rozee.pk HTTP {res.status_code} for {url}")
                            continue
                        results.extend(self._parse_html(res.text, term))
                    except Exception as e:
                        logger.warning(f"Rozee.pk fetch error for '{term}': {e}")

        # Deduplicate by URL
        seen = set()
        unique: List[NormalizedJob] = []
        for job in results:
            if job.canonical_url in seen:
                continue
            seen.add(job.canonical_url)
            unique.append(job)
        return unique[:40]

    def _parse_html(self, html: str, term: str) -> List[NormalizedJob]:
        soup = BeautifulSoup(html, "html.parser")
        out: List[NormalizedJob] = []

        cards = soup.select(
            ".job, .job-item, .job_card, .s-job, [data-job-id], "
            ".jlist, .job-list-item, article.job, div.btr, .jobBox"
        )
        # Fallback: any anchor that looks like a job detail link
        if not cards:
            anchors = soup.select("a[href*='/job/'], a[href*='rozee.pk/job']")
            for a in anchors[:20]:
                title = a.get_text(strip=True)
                href = a.get("href") or ""
                if not title or len(title) < 4:
                    continue
                if href.startswith("/"):
                    href = "https://www.rozee.pk" + href
                if "jsearch" in href:
                    continue
                out.append(self._make_job(title, "Pakistan Employer", "Pakistan", href, term))
            return out

        for card in cards[:15]:
            try:
                title_elem = card.select_one(
                    ".title a, .job-title a, h2 a, h3 a, a[title], a.job-title, a"
                )
                if not title_elem:
                    continue
                title = title_elem.get_text(strip=True)
                if not title or len(title) < 3:
                    continue

                comp_elem = card.select_one(".company, .c-name, span.cname, .cname, .org")
                loc_elem = card.select_one(".location, .city, .loc, .jloc")
                company = comp_elem.get_text(strip=True) if comp_elem else "Pakistan Employer"
                location = loc_elem.get_text(strip=True) if loc_elem else "Pakistan"
                if "pakistan" not in location.lower() and not re.search(
                    r"lahore|karachi|islamabad|rawalpindi|faisalabad|peshawar|multan",
                    location.lower(),
                ):
                    location = f"{location}, Pakistan" if location else "Pakistan"

                href = title_elem.get("href", "") or ""
                if href.startswith("/"):
                    href = "https://www.rozee.pk" + href
                if not href or "jsearch" in href:
                    href = f"https://www.rozee.pk/job/{urllib.parse.quote(term)}-{len(out)}"

                out.append(self._make_job(title, company, location, href, term))
            except Exception as card_err:
                logger.debug(f"Error parsing Rozee job card: {card_err}")
        return out

    def _make_job(
        self, title: str, company: str, location: str, href: str, term: str
    ) -> NormalizedJob:
        canonical_url = self.normalize_url(href)
        return NormalizedJob(
            canonical_url=canonical_url,
            company_name=company or "Pakistan Employer",
            title=title,
            location=location or "Pakistan",
            country_code="PK",
            region_code="PK",
            description=f"{title} at {company} in {location}. Sourced via Rozee.pk.",
            work_arrangement="hybrid" if "hybrid" in title.lower() else "onsite",
            published_at=datetime.now(timezone.utc),
            source_name=self.name,
            external_id=canonical_url,
            raw_metadata={"search_term": term, "platform": "rozee_pk"},
        )
