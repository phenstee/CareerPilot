import re

from app.ai.base import BaseAIProvider
from app.models.job import JobPosting
from app.models.profile import CareerProfile
from app.models.resume import Resume
from app.models.tracker import Application
from app.schemas.analysis import ResumeSuggestionsOutput
from app.schemas.interview import InterviewFeedbackOutput, InterviewGeneratedQuestion, InterviewPrepOutput

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
        user_skills = _user_skills(profile, resume)
        missing = [skill for skill in COMMON_TECH_SKILLS if skill.lower() in requirement_keywords and skill.lower() not in user_skills]
        matching = [skill for skill in COMMON_TECH_SKILLS if skill.lower() in requirement_keywords and skill.lower() in user_skills]
        less_relevant = [
            skill
            for skill in _profile_skill_names(profile)
            if skill.lower() not in requirement_keywords
        ][:8]
        uncertainties = []
        if resume is None:
            uncertainties.append("No resume has been uploaded, so additions are based on profile and job text only.")
        if profile is None:
            uncertainties.append("No profile has been saved, so suggestions cannot cross-check projects and experience.")

        return ResumeSuggestionsOutput(
            keywords=_title_case_keywords(requirement_keywords)[:15],
            relevant_existing_resume_content=relevant_lines,
            suggested_additions=[
                f"Add a truthful bullet, project, or skills line showing {skill} if you have real experience with it."
                for skill in missing[:8]
            ]
            or [
                f"Make your existing {skill} evidence more visible near the top of the resume."
                for skill in matching[:5]
            ]
            or ["Add a concise project or experience bullet that directly supports this job's main responsibilities."],
            less_important_items=[
                f"{skill} appears less central to this posting than the listed job requirements."
                for skill in less_relevant
            ]
            or ["General achievements that do not connect to this job's required skills can be shortened."],
            suggested_rewrites=[],
            missing_information_questions=[
                "Which project best demonstrates the strongest missing job requirement?",
                "Can you add measurable impact for the most relevant project or experience?",
            ],
            application_checklist=[],
            uncertainties=uncertainties,
        )

    def generate_interview_prep(
        self,
        *,
        application: Application,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
    ) -> InterviewPrepOutput:
        requirement_keywords = _job_keywords(job.description)
        user_skills = _user_skills(profile, resume)
        matching = [skill for skill in COMMON_TECH_SKILLS if skill.lower() in requirement_keywords and skill.lower() in user_skills]
        missing = [skill for skill in COMMON_TECH_SKILLS if skill.lower() in requirement_keywords and skill.lower() not in user_skills]
        project_name = profile.projects[0].name if profile and profile.projects else "your most relevant project"
        main_skill = matching[0] if matching else (missing[0] if missing else "the role's core technical requirements")

        return InterviewPrepOutput(
            behavioral_questions=[
                InterviewGeneratedQuestion(
                    category="behavioral",
                    question_text=f"Tell me about a time you had to learn something quickly for {job.title}.",
                    rationale="Tests adaptability and learning habits for an early-career candidate.",
                ),
                InterviewGeneratedQuestion(
                    category="behavioral",
                    question_text="Describe a team situation where communication changed the outcome.",
                    rationale="Connects to collaboration signals that matter in internship interviews.",
                ),
            ],
            technical_questions=[
                InterviewGeneratedQuestion(
                    category="technical",
                    question_text=f"How would you explain your experience with {main_skill} to an interviewer?",
                    rationale="Practices turning a listed skill into a grounded, specific answer.",
                ),
                InterviewGeneratedQuestion(
                    category="technical",
                    question_text="Walk through how you would debug a production issue in a web application.",
                    rationale="Covers practical engineering judgment beyond syntax.",
                ),
            ],
            job_description_questions=[
                InterviewGeneratedQuestion(
                    category="job_description",
                    question_text=f"What parts of the {job.company} posting seem most important, and how would you prove fit?",
                    rationale="Forces the answer to reflect the actual job description.",
                )
            ],
            projects_resume_questions=[
                InterviewGeneratedQuestion(
                    category="projects_resume",
                    question_text=f"Walk me through {project_name}. What tradeoff did you make, and what would you improve?",
                    rationale="Uses the user's own profile/resume evidence instead of inventing experience.",
                )
            ],
            preparation_plan=[
                "Prepare a 60-second summary of your background and interest in this role.",
                f"Choose one concrete example that demonstrates {main_skill}.",
                "Review the job description and map each major requirement to real profile or resume evidence.",
                "Practice explaining one technical tradeoff from a project without reading notes.",
            ],
            strong_topics=[
                f"Existing evidence for {skill}." for skill in matching[:5]
            ]
            or ["Project and coursework examples already saved in CareerPilot."],
            weak_areas=[
                f"Prepare a truthful answer for limited {skill} experience." for skill in missing[:5]
            ]
            or ["Add more measurable outcomes to examples where possible."],
        )

    def evaluate_interview_answer(
        self,
        *,
        application: Application,
        job: JobPosting,
        profile: CareerProfile | None,
        resume: Resume | None,
        question: str,
        answer: str,
    ) -> InterviewFeedbackOutput:
        words = re.findall(r"[a-zA-Z][a-zA-Z'-]+", answer)
        answer_lower = answer.lower()
        requirement_keywords = _job_keywords(job.description)
        mentioned_keywords = [keyword for keyword in requirement_keywords if keyword in answer_lower]
        strong_points = []
        if len(words) >= 45:
            strong_points.append("You gave enough detail for the interviewer to understand the situation.")
        if mentioned_keywords:
            strong_points.append(f"You connected the answer to job-relevant topic(s): {', '.join(_title_case_keywords(set(mentioned_keywords))[:4])}.")
        if any(term in answer_lower for term in ("result", "impact", "learned", "improved", "built")):
            strong_points.append("You included outcome-oriented language.")

        unclear_points = []
        if len(words) < 45:
            unclear_points.append("The answer is brief; add context, your specific action, and the result.")
        if "we " in answer_lower and " i " not in f" {answer_lower} ":
            unclear_points.append("Clarify your individual contribution instead of only describing the team.")

        missing_points = []
        if not mentioned_keywords:
            missing_points.append("Tie the answer back to at least one requirement from the posting.")
        if not any(char.isdigit() for char in answer):
            missing_points.append("Add a measurable result if you have one.")

        return InterviewFeedbackOutput(
            strong_points=strong_points or ["You started with a relevant example."],
            unclear_points=unclear_points,
            missing_points=missing_points,
            stronger_answer_structure=[
                "Situation: one sentence of context.",
                "Task: what you were responsible for.",
                "Action: the technical or interpersonal steps you personally took.",
                "Result: outcome, learning, or measurable impact.",
                f"Relevance: connect the example back to {job.title}.",
            ],
            improved_outline=[
                "Start with the project or situation and why it mattered.",
                "Name the exact technologies, constraints, or people involved.",
                "Explain your personal decision or contribution.",
                "Close with the result and what you would do next time.",
            ],
            overall_feedback="This feedback is based on your typed practice answer and does not claim to be a perfect answer.",
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


def _profile_skill_names(profile: CareerProfile | None) -> list[str]:
    if profile is None:
        return []
    return [skill.name for skill in profile.skills]


def _title_case_keywords(keywords: set[str]) -> list[str]:
    return sorted(keyword.upper() if keyword == "api" else keyword.title() for keyword in keywords)
