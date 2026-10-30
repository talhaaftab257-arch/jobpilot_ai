"""Base interface for modular job collection adapters."""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Iterable
from datetime import datetime
import re
from pydantic import BaseModel, ConfigDict


class NormalizedJob(BaseModel):
    """Normalized schema for raw job listings across all sources."""
    canonical_url: str
    company_name: str
    title: str
    location: Optional[str] = None
    country_code: Optional[str] = None
    region_code: Optional[str] = None
    description: str
    employment_type: Optional[str] = None
    work_arrangement: Optional[str] = "remote"
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: Optional[str] = None
    published_at: datetime
    source_name: str
    external_id: Optional[str] = None
    contacts: List[Dict[str, Any]] = []
    raw_metadata: Dict[str, Any] = {}

    model_config = ConfigDict(arbitrary_types_allowed=True)


def _contains_any(text: str, phrases: Iterable[str]) -> bool:
    """Word/phrase match that avoids 'india' matching 'Indianapolis'."""
    for phrase in phrases:
        p = phrase.lower().strip()
        if not p:
            continue
        if " " in p or "." in p:
            if p in text:
                return True
        else:
            if re.search(rf"(?<![a-z0-9]){re.escape(p)}(?![a-z0-9])", text):
                return True
    return False


class BaseCollector(ABC):
    """Abstract base class for all job source collectors."""
    name: str = "base"
    rate_limit_per_minute: int = 30

    @abstractmethod
    async def fetch_jobs(self, keywords: List[str]) -> List[NormalizedJob]:
        """Fetch and return normalized listings from the source."""
        pass

    @staticmethod
    def normalize_url(url: str) -> str:
        """Strip tracking query parameters (utm_*, ref, etc.) to ensure canonical deduplication."""
        clean = re.sub(r'([?&])(utm_[^&]+|ref=[^&]+|source=[^&]+)', '', url)
        clean = re.sub(r'[?&]+$', '', clean)
        return clean.strip().rstrip('/')

    @staticmethod
    def resolve_region(country_code: Optional[str], text_content: str) -> Optional[str]:
        """
        Map country / location text to PK | EU | ASIA | ARAB.

        Prefer country_code, then LOCATION-LIKE text (pass location + title, not full JD).
        """
        if country_code:
            cc = country_code.upper().strip()
            if cc == "PK":
                return "PK"
            if cc in {"DE", "NL", "IE", "GB", "UK", "SE", "FR", "PL", "PT", "CH", "AT", "BE", "ES", "IT", "DK", "NO", "FI"}:
                return "EU"
            if cc in {"SG", "MY", "JP", "KR", "ID", "TH", "CN", "HK", "VN", "PH", "TW", "IN"}:
                return "ASIA"
            if cc in {"AE", "SA", "QA", "OM", "BH", "KW", "JO", "EG"}:
                return "ARAB"

        txt = (text_content or "").lower()
        if not txt.strip():
            return None

        # Prefer location/title head — callers should not pass full JD
        head = txt[:240]

        pk_loc = [
            "pakistan", "lahore", "karachi", "islamabad", "rawalpindi",
            "faisalabad", "peshawar", "multan", "gujranwala", "rozee.pk",
        ]
        arab_loc = [
            "dubai", "abu dhabi", "sharjah", "uae", "united arab emirates",
            "saudi arabia", "riyadh", "jeddah", "qatar", "doha", "oman",
            "kuwait", "bahrain", "egypt", "cairo", "amman", "jordan",
            "naukrigulf",
        ]
        asia_loc = [
            "singapore", "malaysia", "kuala lumpur", "japan", "tokyo", "osaka",
            "south korea", "seoul", "indonesia", "jakarta", "thailand",
            "bangkok", "shanghai", "beijing", "hong kong", "vietnam",
            "hanoi", "philippines", "manila", "taiwan", "india", "bengaluru",
            "bangalore", "hyderabad", "mumbai", "chennai", "pune", "apac",
            "korea", "china",
        ]
        eu_loc = [
            "germany", "berlin", "munich", "hamburg", "frankfurt", "aachen",
            "magdeburg", "netherlands", "amsterdam", "rotterdam", "ireland",
            "dublin", "united kingdom", "london", "manchester", "sweden",
            "stockholm", "switzerland", "zurich", "geneva", "france", "paris",
            "lyon", "poland", "warsaw", "portugal", "lisbon", "spain", "madrid",
            "barcelona", "italy", "milan", "rome", "austria", "vienna",
            "belgium", "brussels", "denmark", "copenhagen", "norway", "oslo",
            "finland", "helsinki", "emea", "europe", "dach",
        ]

        if _contains_any(head, pk_loc):
            return "PK"
        if _contains_any(head, arab_loc):
            return "ARAB"
        if _contains_any(head, asia_loc):
            return "ASIA"
        if _contains_any(head, eu_loc):
            return "EU"

        return None
