from __future__ import annotations

import hashlib
import json
from typing import Any

from app.models.job import JobPosting
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.tracker import Application


def analysis_fingerprint(
    *,
    analysis_type: str,
    job: JobPosting,
    profile: CareerProfile | None,
    resume: Resume | None,
    application: Application | None = None,
    role_analysis_id: str | None = None,
    role_analysis_result: dict[str, Any] | None = None,
) -> str:
    payload = {
        "analysis_type": analysis_type,
        "job": {
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "job_url": job.job_url,
            "employment_type": job.employment_type,
            "description": job.description,
            "notes": job.notes,
        },
        "profile": _profile_payload(profile),
        "resume": _resume_payload(resume),
        "application": _application_payload(application),
        "role_analysis_id": role_analysis_id,
        "role_analysis_result": role_analysis_result,
    }
    serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _profile_payload(profile: CareerProfile | None) -> dict[str, Any] | None:
    if profile is None:
        return None
    return {
        "full_name": profile.full_name,
        "school": profile.school,
        "program": profile.program,
        "graduation_year": profile.graduation_year,
        "target_roles": profile.target_roles,
        "preferred_locations": profile.preferred_locations,
        "technical_skills": sorted(skill.name for skill in profile.skills if skill.category == "technical"),
        "soft_skills": sorted(skill.name for skill in profile.skills if skill.category == "soft"),
        "projects": [
            {
                "name": project.name,
                "description": project.description,
                "technologies": project.technologies,
                "link": project.link,
                "start_date": project.start_date,
                "end_date": project.end_date,
            }
            for project in sorted(profile.projects, key=lambda item: item.name)
        ],
        "experiences": [
            {
                "organization": experience.organization,
                "position": experience.position,
                "description": experience.description,
                "start_date": experience.start_date,
                "end_date": experience.end_date,
            }
            for experience in sorted(profile.experiences, key=lambda item: (item.organization, item.position))
        ],
    }


def _resume_payload(resume: Resume | None) -> dict[str, Any] | None:
    if resume is None:
        return None
    return {
        "id": resume.id,
        "filename": resume.filename,
        "uploaded_at": resume.uploaded_at,
        "extracted_text": resume.extracted_text,
    }


def _application_payload(application: Application | None) -> dict[str, Any] | None:
    if application is None:
        return None
    return {
        "stage": application.stage,
        "date_applied": application.date_applied,
        "deadline": application.deadline,
        "follow_up_date": application.follow_up_date,
        "notes": application.notes,
        "important_contacts": application.important_contacts,
        "next_action": application.next_action,
    }
