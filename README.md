# JobPilot AI — Autonomous AI Job Hunting Agent SaaS

JobPilot AI is a production-grade full-stack platform designed to automate the job search and application lifecycle. It systematically discovers fresh listings, evaluates candidate-to-job match scores, manages regional resumes with deterministic attachment, uncovers verified recruiter contacts, generates tailored application messages, enforces safety gates, and manages a strict daily application quota (maximum 30 applications/day across all regions).

---

## Architecture Overview

```
JobPilot AI
├── apps/web/              # React, Vite, TypeScript, Tailwind CSS Dashboard
├── backend/app/
│   ├── api/v1/            # Versioned FastAPI endpoints
│   ├── core/              # Settings, configuration, security
│   ├── db/                # SQLAlchemy 2.0 models and session management
│   ├── schemas/           # Pydantic v2 schemas
│   ├── services/          # Matching, resume routing, quota reservation
│   ├── integrations/      # Gmail OAuth 2.0 & AI model providers
│   ├── collectors/        # Modular source scrapers and API adapters
│   └── scheduler/         # Background periodic search tasks
├── backend/migrations/
│   └── manual/            # Supabase manual baseline SQL migrations
├── docs/                  # Setup guides, verification queries, architecture
└── backend/tests/         # Automated safety and API test suite
```

---

## 4 Regional Priority Buckets & Resume Mapping

Job applications route deterministically based on country and region:

1. **Pakistan (`PK`)** → Uses **Pakistan CV**
2. **Europe (`EU`)** → Uses **Europe CV** *(Germany, Netherlands, Ireland, UK, Sweden, France, Poland, Portugal, Switzerland)*
3. **Asia (`ASIA`)** → Uses **Asia CV** *(Singapore, Malaysia, Japan, South Korea, Indonesia, Thailand, China)*
4. **Arab Region (`ARAB`)** → Uses **Arab-region CV** *(UAE, Saudi Arabia, Qatar, Oman, Bahrain, Kuwait, Jordan, Egypt)*

---

## Safety & Operational Limits

- **Global Daily Cap:** Strictly **30 applications per day** across all regions combined, calculated in the user's timezone (`Asia/Karachi`).
- **Freshness Filter:** Only processes jobs published within the last **72 hours**.
- **Minimum Match Score:** Default threshold of **75/100** points.
- **Verified Contacts Only:** Only authoritative recruiter/hiring emails are targeted. Unverified leads are marked as `needs_manual_action`.
- **Global Emergency Pause:** Instant kill-switch halts all outbound application dispatches.
- **Dry-Run Mode:** Enabled by default to prevent sending live emails during evaluation.

---

## Quickstart Guide

### 1. Backend Setup

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run seed script for regions, countries, and default settings
python -m backend.app.db.seed

# Start the FastAPI backend server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API documentation will be available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 2. Database Setup (Supabase PostgreSQL)

1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/swsgkfhcqeujbkrngzss](https://supabase.com/dashboard/project/swsgkfhcqeujbkrngzss)
2. Go to **SQL Editor**.
3. Copy and run the script in `backend/migrations/manual/001_initial_schema.sql`.
4. Run `docs/database-verification.sql` to verify that all 17 tables, 4 regions, 25 countries, and storage policies are active.
5. See `docs/supabase-setup.md` for complete details.

### 3. Running Automated Tests

```bash
pytest backend/tests/test_api.py -v
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure your credentials:

```bash
cp .env.example .env
```

Key variables include:
- `DATABASE_URL`: PostgreSQL connection string.
- `SUPABASE_URL` & `SUPABASE_PUBLISHABLE_KEY`: Supabase API configuration.
- `GMAIL_CLIENT_ID` & `GMAIL_CLIENT_SECRET`: Google OAuth credentials.
- `OPENAI_API_KEY`: Model provider key for scoring and tailored email generation.
