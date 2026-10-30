"""Gmail OAuth 2.0 & Integration management API.

Endpoints:
  GET  /integrations          — list all provider connection states
  GET  /integrations/gmail/connect   — return auth URL for consent screen
  GET  /integrations/gmail/callback  — exchange code, store tokens
  GET  /integrations/gmail/status    — check connection status
  POST /integrations/gmail/disconnect — revoke tokens, clear DB record
  GET  /integrations/quota           — today's quota status
  POST /integrations/gmail/test      — send a test email to self (dry_run safe)
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.db.models import UserIntegration, Profile, JobProfile
from backend.app.services.quota import get_quota_status

router = APIRouter(prefix="/integrations", tags=["Integrations"])


# ──────────────────────────────────────────────────────────────────────────────
# List all integrations
# ──────────────────────────────────────────────────────────────────────────────

@router.get("")
def list_integrations(db: Session = Depends(get_db)):
    """List connection states for all system integrations."""
    user = db.query(Profile).first()

    providers = [
        {
            "id": "gmail",
            "name": "Gmail (OAuth 2.0)",
            "description": "Used to send personalized application emails via official Google APIs.",
            "status": "not_connected",
            "account": None,
            "required_for": "Automatic Email Applications",
        },
        {
            "id": "supabase",
            "name": "Supabase PostgreSQL & Storage",
            "description": "Primary relational database and private resume object storage.",
            "status": "connected" if (settings.DATABASE_URL or settings.SUPABASE_URL) else "configuration_required",
            "account": settings.SUPABASE_URL,
            "required_for": "Core Persistence",
        },
        {
            "id": "ai_provider",
            "name": f"AI Engine ({settings.AI_PROVIDER.capitalize()})",
            "description": "Evaluates candidate-to-job match scores.",
            "status": "connected" if settings.OPENAI_API_KEY else "configuration_required",
            "account": settings.OPENAI_MODEL,
            "required_for": "Scoring & Customization",
        },
        {
            "id": "job_sources",
            "name": "Public Job Sources",
            "description": "Arbeitnow, RemoteOK, Jobicy permitted public feeds.",
            "status": "connected",
            "account": "4 Active Adapters",
            "required_for": "Discovery",
        },
    ]

    if user:
        for p in providers:
            record = db.query(UserIntegration).filter(
                UserIntegration.user_id == user.id,
                UserIntegration.provider == p["id"]
            ).first()
            if record:
                p["status"] = record.status
                p["account"] = record.account_email or p["account"]

    return providers


# ──────────────────────────────────────────────────────────────────────────────
# Gmail OAuth connect — returns auth URL
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/gmail/connect")
def connect_gmail():
    """
    Redirect the browser directly to Google's OAuth 2.0 consent screen.
    The frontend calls this via window.location.href, so we issue a 302 redirect.
    """
    try:
        from backend.app.integrations.gmail.oauth import build_auth_url
        from fastapi.responses import RedirectResponse
        auth_url = build_auth_url()
        return RedirectResponse(url=auth_url, status_code=302)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ──────────────────────────────────────────────────────────────────────────────
# Gmail OAuth callback — exchange code for tokens
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/gmail/callback")
async def gmail_callback(
    code: str = Query(None, description="Authorization code from Google"),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    OAuth 2.0 callback endpoint.
    Google redirects here after the user grants permission.
    Exchanges the code for access + refresh tokens, stores them, then
    redirects back to the SPA with ?gmail=success or ?gmail=error.
    """
    from fastapi.responses import RedirectResponse
    import urllib.parse

    # The SPA frontend URL — adjust if running on a different port/domain
    SPA_URL = "http://localhost:5173"

    if error or not code:
        reason = urllib.parse.quote(error or "Authorization code missing")
        return RedirectResponse(
            url=f"{SPA_URL}/?gmail=error&error={reason}&tab=integrations",
            status_code=302
        )

    try:
        from backend.app.integrations.gmail.oauth import (
            exchange_code_for_tokens,
            get_user_email,
            save_gmail_integration,
        )

        # Exchange code → tokens
        tokens = await exchange_code_for_tokens(code)

        # Fetch the connected Google account email
        access_token = tokens.get("access_token", "")
        account_email, account_name = await get_user_email(access_token)

        # Ensure profile exists
        user = db.query(Profile).first()
        if not user:
            user = Profile(
                full_name=account_name or "JobPilot Candidate",
                email=account_email or "candidate@example.com",
            )
            db.add(user)
            db.flush()

        # Persist tokens
        save_gmail_integration(db, str(user.id), tokens, account_email)

        return RedirectResponse(
            url=f"{SPA_URL}/?gmail=success&tab=integrations",
            status_code=302
        )

    except Exception as e:
        reason = urllib.parse.quote(str(e))
        return RedirectResponse(
            url=f"{SPA_URL}/?gmail=error&error={reason}&tab=integrations",
            status_code=302
        )


# ──────────────────────────────────────────────────────────────────────────────
# Gmail status
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/gmail/status")
def gmail_status(db: Session = Depends(get_db)):
    """Check Gmail OAuth connection status."""
    user = db.query(Profile).first()
    if user:
        record = db.query(UserIntegration).filter(
            UserIntegration.user_id == user.id,
            UserIntegration.provider == "gmail"
        ).first()
        if record and record.status == "connected":
            return {
                "connected": True,
                "account_email": record.account_email,
                "scopes": record.scopes or [],
                "last_synced_at": record.updated_at.isoformat() if record.updated_at else None,
            }
    return {"connected": False, "account_email": None, "scopes": []}


# ──────────────────────────────────────────────────────────────────────────────
# Gmail disconnect  (accepts both DELETE and POST for flexibility)
# ──────────────────────────────────────────────────────────────────────────────

async def _do_disconnect(db: Session):
    user = db.query(Profile).first()
    if not user:
        return {"success": True, "message": "No user profile found — nothing to disconnect."}
    try:
        from backend.app.integrations.gmail.oauth import revoke_gmail_tokens
        await revoke_gmail_tokens(db, str(user.id))
    except Exception:
        pass  # Non-fatal: credentials may have already expired
    return {"success": True, "message": "Gmail integration disconnected. Tokens revoked and credentials purged."}


@router.delete("/gmail/disconnect")
async def disconnect_gmail_delete(db: Session = Depends(get_db)):
    """Revoke Gmail tokens at Google and purge stored credentials from DB (DELETE)."""
    return await _do_disconnect(db)


@router.post("/gmail/disconnect")
async def disconnect_gmail_post(db: Session = Depends(get_db)):
    """Revoke Gmail tokens at Google and purge stored credentials from DB (POST fallback)."""
    return await _do_disconnect(db)


# ──────────────────────────────────────────────────────────────────────────────
# Gmail test send  — /gmail/test AND /gmail/test-email alias
# ──────────────────────────────────────────────────────────────────────────────

async def _test_gmail_send(db: Session) -> Dict[str, Any]:
    """Core test-email logic shared by both route aliases."""
    user = db.query(Profile).first()
    if not user:
        raise HTTPException(status_code=404, detail="No user profile found.")

    record = db.query(UserIntegration).filter(
        UserIntegration.user_id == user.id,
        UserIntegration.provider == "gmail",
    ).first()

    if not record or record.status != "connected":
        raise HTTPException(
            status_code=400,
            detail="Gmail is not connected. Use GET /integrations/gmail/connect first."
        )

    if settings.DRY_RUN_MODE:
        return {
            "success": True,
            "dry_run": True,
            "message": (
                "DRY RUN: Test email was prepared but NOT sent. "
                "Set DRY_RUN_MODE=false in .env to enable live sending."
            ),
            "to": record.account_email,
        }

    try:
        from backend.app.integrations.gmail.oauth import get_valid_access_token
        import base64
        from email.mime.text import MIMEText
        import httpx

        access_token = await get_valid_access_token(db, str(user.id))
        if not access_token:
            raise HTTPException(status_code=401, detail="Could not obtain a valid Gmail access token. Reconnect Gmail.")

        msg = MIMEText(
            "This is a test email from JobPilot AI.\n\n"
            "Your Gmail integration is working correctly.\n\n"
            "— JobPilot AI",
            "plain",
            "utf-8"
        )
        msg["To"] = record.account_email
        msg["From"] = "me"
        msg["Subject"] = "✅ JobPilot AI — Gmail Integration Test"

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                json={"raw": raw},
                headers=headers,
            )
            resp.raise_for_status()

        return {
            "success": True,
            "dry_run": False,
            "message": f"Test email sent to {record.account_email}.",
            "to": record.account_email,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test email failed: {str(e)}")


@router.post("/gmail/test")
async def test_gmail_send(db: Session = Depends(get_db)):
    """Send a test email to the connected Gmail account."""
    return await _test_gmail_send(db)


@router.post("/gmail/test-email")
async def test_gmail_send_alias(db: Session = Depends(get_db)):
    """Alias: /gmail/test-email → same as /gmail/test."""
    return await _test_gmail_send(db)


# ──────────────────────────────────────────────────────────────────────────────
# Daily quota status  — /quota AND /quota/status alias
# ──────────────────────────────────────────────────────────────────────────────

def _quota_response(db: Session) -> Dict[str, Any]:
    """Build quota response dict matching the frontend GmailQuota type."""
    from datetime import datetime
    import pytz
    pkt = pytz.timezone("Asia/Karachi")
    today = datetime.now(pkt).date().isoformat()

    user = db.query(Profile).first()
    cap = settings.GLOBAL_DAILY_APPLICATION_LIMIT

    if not user:
        return {
            "date": today,
            "timezone": "Asia/Karachi",
            "used_count": 0,
            "max_limit": cap,
            "remaining": cap,
            "is_exhausted": False,
        }

    raw = get_quota_status(db, str(user.id))

    # Normalise keys from quota service to match GmailQuota interface
    used = raw.get("applications_used", raw.get("used_count", 0))
    return {
        "date": raw.get("date_pkt", today),
        "timezone": raw.get("timezone", "Asia/Karachi"),
        "used_count": used,
        "max_limit": raw.get("cap", raw.get("max_limit", cap)),
        "remaining": raw.get("remaining", cap - used),
        "is_exhausted": raw.get("exhausted", raw.get("is_exhausted", False)),
    }


@router.get("/quota")
def get_quota(db: Session = Depends(get_db)):
    """Return today's application quota status (PKT timezone)."""
    return _quota_response(db)


@router.get("/quota/status")
def get_quota_status_alias(db: Session = Depends(get_db)):
    """Alias: /quota/status → same as /quota."""
    return _quota_response(db)



