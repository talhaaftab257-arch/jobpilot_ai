"""Collector adapter for Arbeitnow public job board API (Focus: EU & Remote)."""
import logging
from typing import List
from datetime import datetime, timezone
import httpx
from backend.app.collectors.base import BaseCollector, NormalizedJob

logger = logging.getLogger(__name__)


class ArbeitnowCollector(BaseCollector):
    name = "arbeitnow"
    API_URL = "https://www.arbeitnow.com/api/job-board-api"

    async def fetch_jobs(self, keywords: List[str]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(self.API_URL)
                if res.status_code != 200:
                    logger.warning(f"Arbeitnow returned status {res.status_code}")
                    return []

                payload = res.json()
                data = payload.get("data", [])

                for item in data:
                    title = item.get("title", "")
                    description = item.get("description", "")
                    company = item.get("company_name", "Unknown Company")
                    url = item.get("url", "")
                    location = item.get("location", "")
                    created_at_ts = item.get("created_at")

                    # Parse publication timestamp
                    if isinstance(created_at_ts, (int, float)):
                        published_at = datetime.fromtimestamp(created_at_ts, tz=timezone.utc)
                    else:
                        published_at = datetime.now(timezone.utc)

                    # Determine country and region
                    country_code = "DE" if "germany" in location.lower() or "berlin" in location.lower() else None
                    region_code = self.resolve_region(country_code, f"{location} {title} {description}") or "EU"

                    # Canonical clean URL
                    canonical_url = self.normalize_url(url)
                    if not canonical_url:
                        continue

                    job = NormalizedJob(
                        canonical_url=canonical_url,
                        company_name=company,
                        title=title,
                        location=location,
                        country_code=country_code,
                        region_code=region_code,
                        description=description,
                        work_arrangement="remote" if item.get("remote") else "hybrid",
                        published_at=published_at,
                        source_name=self.name,
                        external_id=item.get("slug"),
                        raw_metadata={"tags": item.get("tags", [])}
                    )
                    results.append(job)

        except Exception as e:
            logger.error(f"Error fetching from Arbeitnow: {e}")

        return results
