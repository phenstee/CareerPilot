from sqlalchemy.orm import Session

from app.models.profile import CareerProfile, Experience, Project, Skill
from app.repositories.profile_repository import ProfileRepository
from app.schemas.profile import ProfileResponse, ProfileUpsertRequest


class ProfileService:
    def __init__(self, db: Session) -> None:
        self.repository = ProfileRepository(db)

    def get_profile_response(self, user_id: str) -> ProfileResponse:
        profile = self.repository.get_by_user_id(user_id)
        if profile is None:
            return empty_profile_response()
        return serialize_profile(profile)

    def upsert_profile(self, user_id: str, payload: ProfileUpsertRequest) -> ProfileResponse:
        profile = self.repository.get_by_user_id(user_id)
        if profile is None:
            profile = CareerProfile(user_id=user_id)
            self.repository.add(profile)

        profile.full_name = payload.full_name
        profile.school = payload.school
        profile.program = payload.program
        profile.graduation_year = payload.graduation_year
        profile.target_roles = payload.target_roles
        profile.preferred_locations = payload.preferred_locations
        profile.coursework = payload.coursework
        profile.career_goals = payload.career_goals

        profile.skills = [
            Skill(name=name, category="technical") for name in payload.technical_skills
        ] + [Skill(name=name, category="soft") for name in payload.soft_skills]
        profile.projects = [
            Project(
                name=project.name,
                description=project.description,
                technologies=project.technologies,
                link=project.link,
                start_date=project.start_date,
                end_date=project.end_date,
            )
            for project in payload.projects
        ]
        profile.experiences = [
            Experience(
                organization=experience.organization,
                position=experience.position,
                description=experience.description,
                start_date=experience.start_date,
                end_date=experience.end_date,
            )
            for experience in payload.experiences
        ]

        saved = self.repository.save(profile)
        return serialize_profile(saved)


def empty_profile_response() -> ProfileResponse:
    return ProfileResponse(
        id=None,
        full_name="",
        school="",
        program="",
        graduation_year=None,
        target_roles=[],
        preferred_locations=[],
        technical_skills=[],
        soft_skills=[],
        coursework=[],
        career_goals="",
        projects=[],
        experiences=[],
    )


def serialize_profile(profile: CareerProfile) -> ProfileResponse:
    return ProfileResponse(
        id=profile.id,
        full_name=profile.full_name,
        school=profile.school,
        program=profile.program,
        graduation_year=profile.graduation_year,
        target_roles=profile.target_roles,
        preferred_locations=profile.preferred_locations,
        technical_skills=[skill.name for skill in profile.skills if skill.category == "technical"],
        soft_skills=[skill.name for skill in profile.skills if skill.category == "soft"],
        coursework=profile.coursework,
        career_goals=profile.career_goals,
        projects=list(profile.projects),
        experiences=list(profile.experiences),
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
