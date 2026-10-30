"""Seed initial reference data: 4 regions, 25 countries, and default job sources."""
from backend.app.db.session import SessionLocal
from backend.app.db.models import Region, Country, JobSource, Profile, JobProfile


def seed_database():
    db = SessionLocal()
    try:
        # 1. Seed 4 Regional Buckets
        regions_data = [
            ("PK", "Pakistan", 1),
            ("EU", "Europe", 2),
            ("ASIA", "Asia", 3),
            ("ARAB", "Arab countries", 4),
        ]
        for code, name, priority in regions_data:
            existing = db.query(Region).filter(Region.code == code).first()
            if not existing:
                db.add(Region(code=code, name=name, priority=priority, is_active=True))
            else:
                existing.name = name
                existing.priority = priority
        db.flush()

        # 2. Seed 25 Countries
        countries_data = [
            # Priority 1: PK (1)
            ("PK", "PK", "Pakistan"),
            # Priority 2: EU (9)
            ("DE", "EU", "Germany"),
            ("NL", "EU", "Netherlands"),
            ("IE", "EU", "Ireland"),
            ("GB", "EU", "United Kingdom"),
            ("SE", "EU", "Sweden"),
            ("FR", "EU", "France"),
            ("PL", "EU", "Poland"),
            ("PT", "EU", "Portugal"),
            ("CH", "EU", "Switzerland"),
            # Priority 3: ASIA (7)
            ("SG", "ASIA", "Singapore"),
            ("MY", "ASIA", "Malaysia"),
            ("JP", "ASIA", "Japan"),
            ("KR", "ASIA", "South Korea"),
            ("ID", "ASIA", "Indonesia"),
            ("TH", "ASIA", "Thailand"),
            ("CN", "ASIA", "China"),
            # Priority 4: ARAB (8)
            ("AE", "ARAB", "United Arab Emirates"),
            ("SA", "ARAB", "Saudi Arabia"),
            ("QA", "ARAB", "Qatar"),
            ("OM", "ARAB", "Oman"),
            ("BH", "ARAB", "Bahrain"),
            ("KW", "ARAB", "Kuwait"),
            ("JO", "ARAB", "Jordan"),
            ("EG", "ARAB", "Egypt"),
        ]
        for code, reg_code, name in countries_data:
            existing = db.query(Country).filter(Country.code == code).first()
            if not existing:
                db.add(Country(code=code, region_code=reg_code, name=name, is_active=True))
            else:
                existing.region_code = reg_code
                existing.name = name
        db.flush()

        # 3. Seed Default Job Sources
        sources_data = [
            ("remoteok", "api", 20, False, {"url": "https://remoteok.com/api"}),
            ("arbeitnow", "api", 30, False, {"url": "https://www.arbeitnow.com/api/job-board-api"}),
            ("jobicy", "api", 20, False, {"url": "https://jobicy.com/api/v2/remote-jobs"}),
            ("company_career_page", "browser", 10, False, {"headless": True}),
        ]
        for name, adapter_type, rate_limit, req_auth, cfg in sources_data:
            existing = db.query(JobSource).filter(JobSource.name == name).first()
            if not existing:
                db.add(JobSource(
                    name=name,
                    adapter_type=adapter_type,
                    rate_limit_per_minute=rate_limit,
                    requires_auth=req_auth,
                    config=cfg
                ))
        db.flush()

        # 4. Seed Default Profile
        user = db.query(Profile).first()
        if not user:
            user = Profile(
                full_name="Candidate",
                email="candidate@example.com",
                timezone="Asia/Karachi"
            )
            db.add(user)
            db.flush()

            job_profile = JobProfile(
                user_id=user.id,
                target_titles=[
                    "AI Engineer", "AI/ML Engineer", "Agentic AI Engineer", 
                    "LLM Engineer", "Machine Learning Engineer", "Generative AI Engineer", 
                    "AI Automation Engineer", "Python AI Engineer", "RAG Engineer"
                ],
                target_skills=[
                    "Python", "FastAPI", "LLMs", "RAG", "LangChain", "LangGraph", 
                    "AI agents", "multi-agent systems", "NLP", "vector databases", 
                    "OpenAI API", "AI automation"
                ],
                min_experience_years=0,
                work_arrangements=["remote", "hybrid"],
                min_match_score=75,
                max_job_age_hours=72,
                global_daily_cap=30,
                email_automation_mode="approval",
                is_emergency_paused=False,
                is_dry_run_mode=True
            )
            db.add(job_profile)

        db.commit()
        print("Seeding completed successfully: 4 regions, 25 countries, 4 job sources, default candidate profile.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
