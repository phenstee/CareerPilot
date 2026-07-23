from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import normalize_email
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: str) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).where(User.email == normalize_email(email))
        return self.db.scalar(statement)

    def create(self, *, email: str, full_name: str, password_hash: str) -> User:
        user = User(
            email=normalize_email(email),
            full_name=full_name.strip(),
            password_hash=password_hash,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
