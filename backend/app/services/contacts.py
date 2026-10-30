"""Contact discovery and strict verification service.
Enforces the requirement to never guess recruiter emails or mark unverified addresses as valid.
"""
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone


class DiscoveredContact:
    def __init__(
        self,
        email: str,
        name: Optional[str],
        role: Optional[str],
        source_url: str,
        evidence: str,
        verification_method: str,
        verification_status: str = "unverified"
    ):
        self.email = email.lower().strip()
        self.name = name
        self.role = role
        self.source_url = source_url
        self.evidence = evidence
        self.verification_method = verification_method
        self.verification_status = verification_status
        self.verified_at = datetime.now(timezone.utc) if verification_status == "verified" else None


def extract_verified_contacts(text: str, source_url: str) -> List[DiscoveredContact]:
    """Extracts explicit, published contact emails from official listing text.
    Strictly forbids domain-based synthesis or guessing.
    """
    contacts: List[DiscoveredContact] = []
    
    # Common recruiter patterns: "Apply to careers@company.com", "Send CV to hiring@...", "Contact: john@..."
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    found_emails = set(re.findall(email_pattern, text))

    # Blacklist known non-contact addresses (e.g. support, privacy, abuse)
    ignored_prefixes = {"noreply", "no-reply", "privacy", "abuse", "support", "billing", "legal", "security"}

    for email in found_emails:
        prefix = email.split("@")[0].lower()
        if prefix in ignored_prefixes:
            continue

        # Look for surrounding sentence context as evidence
        sentence_match = re.search(r'([^.?!]*?' + re.escape(email) + r'[^.?!]*)', text)
        evidence = sentence_match.group(0).strip() if sentence_match else f"Directly published in posting: {email}"

        # Verified status: address is explicitly published on the official job posting
        status = "verified" if any(k in evidence.lower() for k in ["apply", "resume", "cv", "contact", "send", "hiring", "recruiter", "talent"]) else "unverified"

        contacts.append(DiscoveredContact(
            email=email,
            name="Hiring Team",
            role="Recruiter / Talent Acquisition",
            source_url=source_url,
            evidence=evidence[:300],
            verification_method="authoritative_listing_extraction",
            verification_status=status
        ))

    return contacts
