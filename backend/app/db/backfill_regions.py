"""Re-tag jobs using location + title only (not full JD — avoids false positives)."""
from collections import Counter
from sqlalchemy.orm import joinedload
from backend.app.db.session import SessionLocal
from backend.app.db.models import Job
from backend.app.collectors.base import BaseCollector


def _source_region(source_name: str | None) -> str | None:
    s = (source_name or "").lower()
    if "rozee" in s:
        return "PK"
    if "naukrigulf" in s or "naukri" in s:
        return "ARAB"
    return None


def main() -> None:
    db = SessionLocal()
    try:
        jobs = db.query(Job).options(joinedload(Job.source)).all()
        before = Counter((j.region_code or "null") for j in jobs)
        print("before", dict(before), "total", len(jobs))

        changed = 0
        for j in jobs:
            source_name = j.source.name if j.source else None
            # Prefer collector source hints, then location+title
            resolved = _source_region(source_name)
            if not resolved:
                text = f"{j.location or ''} {j.title or ''}"
                resolved = BaseCollector.resolve_region(j.country_code, text)

            if resolved != j.region_code:
                j.region_code = resolved
                changed += 1

        db.commit()
        after = Counter((j.region_code or "null") for j in db.query(Job).all())
        print("changed", changed)
        print("after", dict(after))

        print("\nPK samples:")
        for j in db.query(Job).filter(Job.region_code == "PK").limit(20):
            print(" -", (j.title or "(empty)")[:65], "|", j.location, "|", j.country_code)

        print("\nASIA samples:")
        for j in db.query(Job).filter(Job.region_code == "ASIA").limit(20):
            print(" -", (j.title or "(empty)")[:65], "|", j.location, "|", j.country_code)
    finally:
        db.close()


if __name__ == "__main__":
    main()
