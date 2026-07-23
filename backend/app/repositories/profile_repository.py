from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.profile import CareerProfile


class ProfileRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_user_id(self, user_id: str) -> CareerProfile | None:
        statement = (
            select(CareerProfile)
            .options(
                selectinload(CareerProfile.skills),
                selectinload(CareerProfile.projects),
                selectinload(CareerProfile.experiences),
            )
            .where(CareerProfile.user_id == user_id)
        )
        return self.db.scalar(statement)

    def add(self, profile: CareerProfile) -> CareerProfile:
        self.db.add(profile)
        return profile

    def save(self, profile: CareerProfile) -> CareerProfile:
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return self.get_by_user_id(profile.user_id) or profile
