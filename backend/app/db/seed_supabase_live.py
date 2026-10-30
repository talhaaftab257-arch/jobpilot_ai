"""Seeds reference data directly into the live Supabase project via REST API."""
import os
import httpx

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://swsgkfhcqeujbkrngzss.supabase.co/rest/v1")
SECRET_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

headers = {
    "apikey": SECRET_KEY,
    "Authorization": f"Bearer {SECRET_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

def seed_live_supabase():
    # 1. Seed 4 Regions
    regions = [
        {"code": "PK", "name": "Pakistan", "priority": 1, "is_active": True},
        {"code": "EU", "name": "Europe", "priority": 2, "is_active": True},
        {"code": "ASIA", "name": "Asia", "priority": 3, "is_active": True},
        {"code": "ARAB", "name": "Arab countries", "priority": 4, "is_active": True},
    ]
    r_reg = httpx.post(f"{SUPABASE_URL}/regions", json=regions, headers=headers)
    print("Seeding Regions:", r_reg.status_code)

    # 2. Seed 25 Countries
    countries = [
        # PK
        {"code": "PK", "region_code": "PK", "name": "Pakistan", "is_active": True},
        # EU
        {"code": "DE", "region_code": "EU", "name": "Germany", "is_active": True},
        {"code": "NL", "region_code": "EU", "name": "Netherlands", "is_active": True},
        {"code": "IE", "region_code": "EU", "name": "Ireland", "is_active": True},
        {"code": "GB", "region_code": "EU", "name": "United Kingdom", "is_active": True},
        {"code": "SE", "region_code": "EU", "name": "Sweden", "is_active": True},
        {"code": "FR", "region_code": "EU", "name": "France", "is_active": True},
        {"code": "PL", "region_code": "EU", "name": "Poland", "is_active": True},
        {"code": "PT", "region_code": "EU", "name": "Portugal", "is_active": True},
        {"code": "CH", "region_code": "EU", "name": "Switzerland", "is_active": True},
        # ASIA
        {"code": "SG", "region_code": "ASIA", "name": "Singapore", "is_active": True},
        {"code": "MY", "region_code": "ASIA", "name": "Malaysia", "is_active": True},
        {"code": "JP", "region_code": "ASIA", "name": "Japan", "is_active": True},
        {"code": "KR", "region_code": "ASIA", "name": "South Korea", "is_active": True},
        {"code": "ID", "region_code": "ASIA", "name": "Indonesia", "is_active": True},
        {"code": "TH", "region_code": "ASIA", "name": "Thailand", "is_active": True},
        {"code": "CN", "region_code": "ASIA", "name": "China", "is_active": True},
        # ARAB
        {"code": "AE", "region_code": "ARAB", "name": "United Arab Emirates", "is_active": True},
        {"code": "SA", "region_code": "ARAB", "name": "Saudi Arabia", "is_active": True},
        {"code": "QA", "region_code": "ARAB", "name": "Qatar", "is_active": True},
        {"code": "OM", "region_code": "ARAB", "name": "Oman", "is_active": True},
        {"code": "BH", "region_code": "ARAB", "name": "Bahrain", "is_active": True},
        {"code": "KW", "region_code": "ARAB", "name": "Kuwait", "is_active": True},
        {"code": "JO", "region_code": "ARAB", "name": "Jordan", "is_active": True},
        {"code": "EG", "region_code": "ARAB", "name": "Egypt", "is_active": True},
    ]
    r_cou = httpx.post(f"{SUPABASE_URL}/countries", json=countries, headers=headers)
    print("Seeding Countries:", r_cou.status_code)

    # 3. Seed Job Sources
    sources = [
        {"name": "remoteok", "adapter_type": "api", "rate_limit_per_minute": 20, "requires_auth": False, "config": {"url": "https://remoteok.com/api"}},
        {"name": "arbeitnow", "adapter_type": "api", "rate_limit_per_minute": 30, "requires_auth": False, "config": {"url": "https://www.arbeitnow.com/api/job-board-api"}},
        {"name": "jobicy", "adapter_type": "api", "rate_limit_per_minute": 20, "requires_auth": False, "config": {"url": "https://jobicy.com/api/v2/remote-jobs"}},
        {"name": "company_career_page", "adapter_type": "browser", "rate_limit_per_minute": 10, "requires_auth": False, "config": {"headless": True}}
    ]
    r_src = httpx.post(f"{SUPABASE_URL}/job_sources", json=sources, headers=headers)
    print("Seeding Job Sources:", r_src.status_code)

if __name__ == "__main__":
    seed_live_supabase()
