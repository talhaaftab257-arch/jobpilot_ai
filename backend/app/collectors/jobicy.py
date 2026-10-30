"""Collector adapter for Jobicy public remote jobs API."""
import logging
from typing import List
from datetime import datetime, timezone
import dateutil.parser
import httpx
from backend.app.collectors.base import BaseCollector, NormalizedJob

logger = logging.getLogger(__name__)


class JobicyCollector(BaseCollector):
    name = "jobicy"
    API_URL = "https://jobicy.com/api/v2/remote-jobs"

    async def fetch_jobs(self, keywords: List[str]) -> List[NormalizedJob]:
        results: List[NormalizedJob] = []
        try:
            params = {"count": 30, "industry": "engineering"}
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(self.API_URL, params=params)
                if res.status_code != 200:
                    logger.warning(f"Jobicy returned status {res.status_code}")
                    return []

                payload = res.json()
                jobs = payload.get("jobs", [])

                for item in jobs:
                    title = item.get("jobTitle", "")
                    company = item.get("companyName", "Unknown Company")
                    url = item.get("url", "")
                    description = item.get("jobDescription", "")
                    location = item.get("jobGeo", "Anywhere")
                    pub_date = item.get("pubDate")

                    if not title or not description or not url:
                        continue

                    try:
                        published_at = dateutil.parser.parse(pub_date)
                        if published_at.tzinfo is None:
                            published_at = published_at.replace(tzinfo=timezone.utc)
                    except Exception:
                        published_at = datetime.now(timezone.utc)

                    region_code = self.resolve_region(None, f"{location} {title} {description}")

                    salary_min = float(item.get("annualSalaryMin")) if item.get("annualSalaryMin") else None
                    salary_max = float(item.get("annualSalaryMax")) if item.get("annualSalaryMax") else None

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
                        salary_currency=item.get("salaryCurrency", "USD"),
                        published_at=published_at,
                        source_name=self.name,
                        external_id=str(item.get("id")),
                        raw_metadata={"job_types": item.get("jobType", [])}
                    )
                    results.append(job)

        except Exception as e:
            logger.error(f"Error fetching from Jobicy: {e}")

        return results
