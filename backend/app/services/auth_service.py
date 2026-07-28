import hmac

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository


class DuplicateEmailError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InvalidBetaAccessCodeError(Exception):
    pass


class AuthService:
    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)

    def register(self, *, email: str, full_name: str, password: str, beta_access_code: str | None = None) -> User:
        configured_code = settings.beta_access_code
        if configured_code and not hmac.compare_digest(beta_access_code or "", configured_code):
            raise InvalidBetaAccessCodeError
        if self.users.get_by_email(email) is not None:
            raise DuplicateEmailError
        return self.users.create(
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
        )

    def authenticate(self, *, email: str, password: str) -> User:
        user = self.users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError
        return user
