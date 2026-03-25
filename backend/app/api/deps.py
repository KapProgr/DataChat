from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User


def get_db_session() -> Session:
    return next(get_db())


async def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Placeholder for Clerk JWT verification.
    For now, we accept a `X-User-Id` header or return None.
    """
    user_id = None
    # In a real implementation you'd decode Clerk JWT here.
    # For the MVP we just skip strict auth.
    if not authorization:
        return None

    # TODO: Integrate real Clerk verification and load/create user in DB
    return None



