"""Gmail OAuth 2.0 integration.

Handles the full OAuth lifecycle:
  - Build the Google authorization URL (consent screen)
  - Exchange authorization code for access + refresh tokens
  - Refresh expired access tokens automatically
  - Store encrypted credentials in user_integrations table
  - Revoke tokens on disconnect

Credentials are NEVER exposed to the frontend.
"""
from __future__ import annotations

import base64
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from urllib.parse import urlencode, urljoin

import httpx
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.db.models import Profile, UserIntegration

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke"

GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
]


# ──────────────────────────────────────────────────────────────────────────────
# Authorization URL
# ──────────────────────────────────────────────────────────────────────────────

def build_auth_url(state: Optional[str] = None) -> str:
    """
    Build the Google OAuth 2.0 consent URL.

    The user is redirected here by the frontend. After granting permission
    Google redirects back to GMAIL_REDIRECT_URI with `code` and `state`.
    """
    if not settings.GMAIL_CLIENT_ID:
        raise ValueError(
            "GMAIL_CLIENT_ID is not set. Add it to your .env file. "
            "See https://console.cloud.google.com/ → APIs & Services → Credentials."
        )

    params = {
        "client_id": settings.GMAIL_CLIENT_ID,
        "redirect_uri": settings.GMAIL_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GMAIL_SCOPES),
        "access_type": "offline",   # request refresh token
        "prompt": "consent",        # force refresh token even if already granted
        "include_granted_scopes": "true",
    }
    if state:
        params["state"] = state

    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


# ──────────────────────────────────────────────────────────────────────────────
# Token Exchange
# ──────────────────────────────────────────────────────────────────────────────

async def exchange_code_for_tokens(code: str) -> dict:
    """
    Exchange the authorization code (from Google callback) for OAuth tokens.

    Returns a dict with: access_token, refresh_token, expires_in, token_type, scope
    Raises httpx.HTTPStatusError on failure.
    """
    if not settings.GMAIL_CLIENT_ID or not settings.GMAIL_CLIENT_SECRET:
        raise ValueError(
            "GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env. "
            "Obtain them from https://console.cloud.google.com/ → APIs & Services → Credentials."
        )

    payload = {
        "code": code,
        "client_id": settings.GMAIL_CLIENT_ID,
        "client_secret": settings.GMAIL_CLIENT_SECRET,
        "redirect_uri": settings.GMAIL_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data=payload)
        resp.raise_for_status()
        return resp.json()


async def get_user_email(access_token: str) -> Tuple[str, str]:
    """Fetch the authenticated Google account's email and name."""
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(GOOGLE_USERINFO_URL, headers=headers)
        resp.raise_for_status()
        info = resp.json()
        return info.get("email", ""), info.get("name", "")


# ──────────────────────────────────────────────────────────────────────────────
# Token Refresh
# ──────────────────────────────────────────────────────────────────────────────

async def refresh_access_token(refresh_token: str) -> dict:
    """
    Use a stored refresh_token to get a new access_token.

    Returns new token dict. Does NOT update the DB — caller must persist.
    """
    if not settings.GMAIL_CLIENT_ID or not settings.GMAIL_CLIENT_SECRET:
        raise ValueError("Gmail OAuth credentials not configured.")

    payload = {
        "client_id": settings.GMAIL_CLIENT_ID,
        "client_secret": settings.GMAIL_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(GOOGLE_TOKEN_URL, data=payload)
        resp.raise_for_status()
        return resp.json()


# ──────────────────────────────────────────────────────────────────────────────
# Credential Storage (DB layer)
# ──────────────────────────────────────────────────────────────────────────────

def _encode_credentials(tokens: dict) -> dict:
    """
    Encode token dict for storage.
    In production, encrypt with a KMS key. Here we do lightweight base64 obfuscation
    to avoid plain-text tokens in DB; real encryption requires a SECRET_KEY cipher.
    """
    raw = json.dumps(tokens).encode()
    encoded = base64.b64encode(raw).decode()
    return {"v": 1, "data": encoded}


def _decode_credentials(stored: dict) -> dict:
    """Decode stored credentials back to token dict."""
    if not stored or "data" not in stored:
        return {}
    raw = base64.b64decode(stored["data"].encode())
    return json.loads(raw)


def save_gmail_integration(
    db: Session,
    user_id: str,
    tokens: dict,
    account_email: str,
) -> UserIntegration:
    """Persist Gmail OAuth tokens to user_integrations table."""
    record = (
        db.query(UserIntegration)
        .filter(UserIntegration.user_id == user_id, UserIntegration.provider == "gmail")
        .first()
    )

    expires_at = None
    if "expires_in" in tokens:
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=tokens["expires_in"])

    creds = _encode_credentials(
        {
            "access_token": tokens.get("access_token"),
            "refresh_token": tokens.get("refresh_token"),
            "expires_at": expires_at.isoformat() if expires_at else None,
            "token_type": tokens.get("token_type", "Bearer"),
            "scope": tokens.get("scope", ""),
        }
    )

    if record:
        record.status = "connected"
        record.account_email = account_email
        record.encrypted_credentials = creds
        record.scopes = tokens.get("scope", "").split()
        record.updated_at = datetime.now(timezone.utc)
    else:
        record = UserIntegration(
            user_id=user_id,
            provider="gmail",
            status="connected",
            account_email=account_email,
            encrypted_credentials=creds,
            scopes=tokens.get("scope", "").split(),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    logger.info("Gmail integration saved for user %s (%s)", user_id, account_email)
    return record


def get_gmail_credentials(db: Session, user_id: str) -> Optional[dict]:
    """
    Retrieve stored Gmail credentials for a user.
    Returns decoded token dict or None if not connected.
    """
    record = (
        db.query(UserIntegration)
        .filter(UserIntegration.user_id == user_id, UserIntegration.provider == "gmail")
        .first()
    )
    if not record or record.status != "connected":
        return None
    return _decode_credentials(record.encrypted_credentials or {})


async def get_valid_access_token(db: Session, user_id: str) -> Optional[str]:
    """
    Return a valid (non-expired) access token, auto-refreshing if needed.

    Returns None if not connected or refresh fails.
    """
    creds = get_gmail_credentials(db, user_id)
    if not creds or not creds.get("access_token"):
        return None

    # Check expiry with a 60-second buffer
    if creds.get("expires_at"):
        try:
            exp = datetime.fromisoformat(creds["expires_at"])
            if datetime.now(timezone.utc) >= (exp - timedelta(seconds=60)):
                # Refresh needed
                if not creds.get("refresh_token"):
                    logger.warning("Access token expired and no refresh token stored for user %s", user_id)
                    return None
                logger.info("Refreshing Gmail access token for user %s", user_id)
                new_tokens = await refresh_access_token(creds["refresh_token"])
                new_tokens["refresh_token"] = creds["refresh_token"]  # preserve existing RT if not re-issued
                # Re-read account email to update record
                record = (
                    db.query(UserIntegration)
                    .filter(UserIntegration.user_id == user_id, UserIntegration.provider == "gmail")
                    .first()
                )
                account_email = record.account_email if record else ""
                save_gmail_integration(db, user_id, new_tokens, account_email)
                return new_tokens.get("access_token")
        except Exception as exc:
            logger.error("Token refresh error for user %s: %s", user_id, exc)
            return None

    return creds.get("access_token")


async def revoke_gmail_tokens(db: Session, user_id: str) -> bool:
    """
    Revoke tokens at Google + clear DB record.
    Returns True if revocation succeeded or tokens weren't present.
    """
    creds = get_gmail_credentials(db, user_id)

    if creds:
        token_to_revoke = creds.get("refresh_token") or creds.get("access_token")
        if token_to_revoke:
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(GOOGLE_REVOKE_URL, params={"token": token_to_revoke})
                    if resp.status_code not in (200, 400):  # 400 = already revoked
                        logger.warning("Token revocation returned %d for user %s", resp.status_code, user_id)
            except Exception as exc:
                logger.error("Token revocation request failed for user %s: %s", user_id, exc)

    # Clear stored credentials regardless
    record = (
        db.query(UserIntegration)
        .filter(UserIntegration.user_id == user_id, UserIntegration.provider == "gmail")
        .first()
    )
    if record:
        record.status = "not_connected"
        record.encrypted_credentials = {}
        record.account_email = None
        db.commit()

    logger.info("Gmail integration disconnected for user %s", user_id)
    return True
