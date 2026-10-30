"""Collector adapter for RemoteOK public API."""
import logging
from typing import List
from datetime import datetime, timezone
import dateutil.parser
import httpx
from backend.app.collectors.base import BaseCollector, NormalizedJob

logger = logging.getLogger(__name__)


class RemoteOKCollector(BaseCollector):
    name = "remoteok"
    API_URL = "https://remoteok.com/api"

    async def fetch_jobs(self, keywords: List[str]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        try:
            headers = {"User-Agent": "JobPilot-AI-Agent/1.0 (Job Hunting Assistant)"}
            async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
                res = await client.get(self.API_URL)
                if res.status_code != 200:
                    logger.warning(f"RemoteOK returned status {res.status_code}")
                    return []

                data = res.json()
                # First element in RemoteOK is usually legal notice
                items = data[1:] if len(data) > 1 and isinstance(data[0], dict) and "legal" in data[0] else data

                for item in items:
                    if not isinstance(item, dict):
                        continue

                    title = item.get("position", "")
                    company = item.get("company", "Unknown Company")
                    url = item.get("url") or f"https://remoteok.com/l/{item.get('id')}"
                    description = item.get("description", "")
                    location = item.get("location", "Worldwide Remote")
                    date_str = item.get("date")

                    if not title or not description:
                        continue

                    # Parse timestamp
                    try:
                        published_at = dateutil.parser.isoparse(date_str)
                        if published_at.tzinfo is None:
                            published_at = published_at.replace(tzinfo=timezone.utc)
                    except Exception:
                        published_at = datetime.now(timezone.utc)

                    region_code = self.resolve_region(None, f"{location} {title} {description}")

                    # Extract salary if provided
                    salary_min = float(item.get("salary_min")) if item.get("salary_min") else None
                    salary_max = float(item.get("salary_max")) if item.get("salary_max") else None

                    canonical_url = self.normalize_url(url)
                    job = NormalizedJob(
                        canonical_url=canonical_url,
                        company_name=company,
                        title=title,
                        location=location,
                        country_code=None,
                        region_code=region_code,
                        description=description,
                        work_arrangement="remote",
                        salary_min=salary_min,
                        salary_max=salary_max,
                        salary_currency="USD",
                        published_at=published_at,
                        source_name=self.name,
                        external_id=str(item.get("id")),
                        raw_metadata={"tags": item.get("tags", [])}
                    )
                    results.append(job)

        except Exception as e:
            logger.error(f"Error fetching from RemoteOK: {e}")

        return results
