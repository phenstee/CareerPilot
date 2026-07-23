import re

from app.ai.base import BaseAIProvider
from app.models.job import JobPosting
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.schemas.analysis import JobMatchAnalysisOutput, ResumeRewriteSuggestion, ResumeSuggestionsOutput

COMMON_TECH_SKILLS = (
    "Python",
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "FastAPI",
    "SQL",
    "PostgreSQL",
    "Docker",
    "AWS",
    "Machine Learning",
    "Data Structures",
    "Algorithms",
    "REST APIs",
)


class MockAIProvider(BaseAIProvider):
    name = "mock"

    def analyze_job_match(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> JobMatchAnalysisOutput:
        requirement_keywords = _job_keywords(job.description)
        user_skills = _user_skills(profile, resume)
        matching = [skill for skill in COMMON_TECH_SKILLS if skill.lower() in requirement_keywords and skill.lower() in user_skills]
        missing = [skill for skill in COMMON_TECH_SKILLS if skill.lower() in requirement_keywords and skill.lower() not in user_skills]
        score = min(100, max(20, 45 + len(matching) * 8 - len(missing) * 4))
        relevant_items = _relevant_projects_and_experiences(profile, requirement_keywords)
        uncertainties = []
        if resume is None:
            uncertainties.append("No resume has been uploaded, so resume-specific evidence is limited.")
        if profile is None:
            uncertainties.append("No profile has been saved, so the analysis relies only on resume text if available.")
        if not matching:
            uncertainties.append("No explicit skill overlap was detected by the mock analyzer.")

        return JobMatchAnalysisOutput(
            overall_match_score=score,
            score_explanation=(
                f"Mock analysis found {len(matching)} matching skill signal(s) and "
                f"{len(missing)} missing or weak skill signal(s) for {job.title}."
            ),
            matching_skills=matching,
            missing_or_weak_skills=missing[:8],
            relevant_experiences_and_projects=relevant_items,
            important_job_requirements=_title_case_keywords(requirement_keywords)[:10],
            recommended_preparation_priorities=[
                f"Prepare examples showing {skill} in a project or previous role."
                for skill in missing[:5]
            ]
            or ["Review the job description and prepare concise examples for each major responsibility."],
            potential_resume_improvements=[
                f"Make existing {skill} experience easier to find in the resume."
                for skill in matching[:5]
            ]
            or ["Add clearer evidence for the strongest relevant projects already in your profile."],
            portfolio_project_ideas=[
                f"Build a small project that demonstrates {skill} in a realistic workflow."
                for skill in missing[:3]
            ],
            uncertainties=uncertainties,
            supported_facts=[
                f"Profile/resume mentions {skill}." for skill in matching[:8]
            ],
            suggestions_for_improvement=[
                f"Strengthen evidence for {skill} before applying." for skill in missing[:8]
            ],
            unknowns=uncertainties,
        )

    def suggest_resume_tailoring(
        self,
        *,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> ResumeSuggestionsOutput:
        requirement_keywords = _job_keywords(job.description)
        resume_lines = _resume_lines(resume)
        relevant_lines = [
            line
            for line in resume_lines
            if any(keyword in line.lower() for keyword in requirement_keywords)
        ][:8]
        rewrite_source = relevant_lines[:3] or resume_lines[:3]
        rewrites = [
            ResumeRewriteSuggestion(
                original_text=line,
                suggested_text=line,
                rationale="Mock provider preserves factual content; edit this wording manually if you can verify stronger detail.",
            )
            for line in rewrite_source
        ]
        uncertainties = []
        if resume is None:
            uncertainties.append("No resume has been uploaded, so there is no existing resume content to rewrite.")
        if profile is None:
            uncertainties.append("No profile has been saved, so suggestions cannot cross-check projects and experience.")

        return ResumeSuggestionsOutput(
            keywords=_title_case_keywords(requirement_keywords)[:15],
            relevant_existing_resume_content=relevant_lines,
            suggested_rewrites=rewrites,
            missing_information_questions=[
                "Which project best demonstrates the strongest missing job requirement?",
                "Can you add measurable impact for the most relevant project or experience?",
            ],
            application_checklist=[
                "Confirm every resume bullet is factually supported.",
                "Mirror important job keywords only where they match real experience.",
                "Review deadline and follow-up task before applying.",
            ],
            uncertainties=uncertainties,
        )


def _job_keywords(description: str) -> set[str]:
    description_lower = description.lower()
    keywords = {skill.lower() for skill in COMMON_TECH_SKILLS if skill.lower() in description_lower}
    words = re.findall(r"[a-zA-Z][a-zA-Z+#.]{2,}", description_lower)
    keywords.update(word for word in words if word in {"frontend", "backend", "api", "testing", "cloud"})
    return keywords


def _user_skills(profile: CareerProfile | None, resume: Resume | None) -> set[str]:
    text_parts: list[str] = []
    if profile is not None:
        text_parts.extend(skill.name for skill in profile.skills)
        text_parts.extend(project.description for project in profile.projects)
        text_parts.extend(experience.description for experience in profile.experiences)
    if resume is not None:
        text_parts.append(resume.extracted_text)
    joined = " ".join(text_parts).lower()
    return {skill.lower() for skill in COMMON_TECH_SKILLS if skill.lower() in joined}


def _relevant_projects_and_experiences(profile: CareerProfile | None, requirement_keywords: set[str]) -> list[str]:
    if profile is None:
        return []
    items: list[str] = []
    for project in profile.projects:
        haystack = f"{project.name} {project.description} {' '.join(project.technologies)}".lower()
        if any(keyword in haystack for keyword in requirement_keywords):
            items.append(f"Project: {project.name}")
    for experience in profile.experiences:
        haystack = f"{experience.position} {experience.organization} {experience.description}".lower()
        if any(keyword in haystack for keyword in requirement_keywords):
            items.append(f"Experience: {experience.position} at {experience.organization}")
    return items[:8]


def _resume_lines(resume: Resume | None) -> list[str]:
    if resume is None:
        return []
    return [line.strip() for line in resume.extracted_text.splitlines() if line.strip()]


def _title_case_keywords(keywords: set[str]) -> list[str]:
    return sorted(keyword.upper() if keyword == "api" else keyword.title() for keyword in keywords)
