# Database Migrations

This folder maintains schema migrations for the JobPilot AI backend.

## Structure

- `manual/001_initial_schema.sql`: Executable PostgreSQL SQL script designed for initial baseline execution in the Supabase SQL Editor.
- Subsequent migrations can be tracked and generated with **Alembic**.

## Synchronizing with Alembic

When baseline schema is executed manually via Supabase:
1. Ensure your SQLAlchemy models in `backend/app/db/models.py` reflect the schema exactly.
2. Initialize and stamp Alembic baseline:
   ```bash
   alembic stamp head
   ```
3. For subsequent schema changes, generate autocommit migrations:
   ```bash
   alembic revision --autogenerate -m "describe_change"
   alembic upgrade head
   ```
