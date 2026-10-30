"""Manual test script to trigger the live discovery pipeline across sources."""
import asyncio
from backend.app.db.session import SessionLocal
from backend.app.db.models import Profile
from backend.app.workflows.discovery_pipeline import run_discovery_pipeline

async def main():
    db = SessionLocal()
    try:
        user = db.query(Profile).first()
        if not user:
            print("No candidate profile found.")
            return

        print("Initiating live multi-source discovery (Arbeitnow, RemoteOK, Jobicy)...")
        res = await run_discovery_pipeline(db, str(user.id), dry_run=True)
        print("\n=== LIVE DISCOVERY PIPELINE RUN RESULTS ===")
        print(f"Total Jobs Discovered: {res.jobs_discovered}")
        print(f"Duplicates Handled: {res.jobs_deduplicated}")
        print(f"Eligible Qualified Leads (>= 75 score): {res.jobs_eligible}")
        print(f"Errors encountered: {len(res.errors)}")
        print("\nTop Qualified Job Matches:")
        for job in res.eligible_jobs[:5]:
            print(f"- [{job['region'] or 'GLOBAL'}] {job['title']} at {job['company']} (Score: {job['score']}/100)")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
