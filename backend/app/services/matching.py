"""Deterministic match scoring and eligibility engine for JobPilot AI."""
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
import re
from backend.app.collectors.base import NormalizedJob
from backend.app.db.models import JobProfile


class MatchScoreResult:
    def __init__(
        self,
        overall_score: float,
        title_score: float,
        skills_score: float,
        experience_score: float,
        location_score: float,
        salary_score: float,
        freshness_score: float,
        is_eligible: bool,
        matching_skills: List[str],
        missing_skills: List[str],
        explanation: str,
        disqualification_reason: str = None
    ):
        self.overall_score = round(overall_score, 2)
        self.title_score = round(title_score, 2)
        self.skills_score = round(skills_score, 2)
        self.experience_score = round(experience_score, 2)
        self.location_score = round(location_score, 2)
        self.salary_score = round(salary_score, 2)
        self.freshness_score = round(freshness_score, 2)
        self.is_eligible = is_eligible
        self.matching_skills = matching_skills
        self.missing_skills = missing_skills
        self.explanation = explanation
        self.disqualification_reason = disqualification_reason


def evaluate_job_match(job: NormalizedJob, profile: JobProfile) -> MatchScoreResult:
    """Calculates a transparent 100-point match score across the 6 required dimensions."""
    now = datetime.now(timezone.utc)
    target_titles = [t.lower() for t in (profile.target_titles or [])]
    target_skills = [s.lower() for s in (profile.target_skills or [])]
    text_content = f"{job.title} {job.description}".lower()

    # 1. Title & Role Alignment (Max 25 pts)
    title_lower = job.title.lower()
    title_score = 0.0
    for target in target_titles:
        if target in title_lower:
            title_score = 25.0
            break
        # Partial token match
        tokens = target.split()
        matched_tokens = sum(1 for tok in tokens if tok in title_lower)
        partial = (matched_tokens / len(tokens)) * 20.0
        if partial > title_score:
            title_score = partial

    # 2. Technical Skills Alignment (Max 30 pts)
    matching_skills = []
    missing_skills = []
    for skill in target_skills:
        # Match as whole word/phrase
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_content):
            matching_skills.append(skill)
        else:
            missing_skills.append(skill)

    skill_ratio = len(matching_skills) / max(1, len(target_skills))
    skills_score = min(30.0, skill_ratio * 40.0)  # Scaling factor so having 75% of target skills gives full 30 pts

    # 3. Experience & Seniority (Max 15 pts)
    exp_score = 15.0
    min_exp = profile.min_experience_years if profile.min_experience_years is not None else 0
    if min_exp <= 2:
        if any(w in title_lower for w in ["principal", "director", "vp", "head of", "staff engineer"]):
            exp_score = 5.0
    elif "senior" in title_lower or "lead" in title_lower:
        exp_score = 15.0

    # 4. Location & Work Arrangement (Max 10 pts)
    loc_score = 0.0
    arr = (job.work_arrangement or "remote").lower()
    allowed_arrangements = [a.lower() for a in (profile.work_arrangements or ["remote", "hybrid"])]
    if arr in allowed_arrangements or "remote" in arr:
        loc_score = 10.0
    else:
        loc_score = 4.0

    # 5. Salary Alignment (Max 10 pts)
    salary_score = 8.0
    if job.salary_min and profile.min_salary:
        if float(job.salary_min) >= float(profile.min_salary):
            salary_score = 10.0
        else:
            salary_score = 4.0

    # 6. Posting Freshness (Max 10 pts)
    age_hours = (now - job.published_at).total_seconds() / 3600.0
    if age_hours <= 24:
        freshness_score = 10.0
    elif age_hours <= 48:
        freshness_score = 8.0
    elif age_hours <= 72:
        freshness_score = 5.0
    else:
        freshness_score = 0.0

    overall = title_score + skills_score + exp_score + loc_score + salary_score + freshness_score

    # Hard eligibility checks
    is_eligible = True
    disqualification = None

    max_age = profile.max_job_age_hours if profile.max_job_age_hours is not None else 72
    min_score = profile.min_match_score if profile.min_match_score is not None else 75

    if age_hours > max_age:
        is_eligible = False
        disqualification = f"Posting exceeds freshness limit ({int(age_hours)}h > {max_age}h)"
    elif overall < min_score:
        is_eligible = False
        disqualification = f"Score {int(overall)} is below minimum threshold of {min_score}"

    explanation = (
        f"Evaluated match: Title score {int(title_score)}/25, Skills {int(skills_score)}/30 "
        f"({len(matching_skills)} skills matched), Seniority {int(exp_score)}/15, "
        f"Location {int(loc_score)}/10, Freshness {int(freshness_score)}/10."
    )

    return MatchScoreResult(
        overall_score=overall,
        title_score=title_score,
        skills_score=skills_score,
        experience_score=exp_score,
        location_score=loc_score,
        salary_score=salary_score,
        freshness_score=freshness_score,
        is_eligible=is_eligible,
        matching_skills=[s.title() for s in matching_skills],
        missing_skills=[s.title() for s in missing_skills[:6]],
        explanation=explanation,
        disqualification_reason=disqualification
    )
