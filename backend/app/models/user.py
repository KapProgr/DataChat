from datetime import datetime
from typing import Optional

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    clerk_id = Column(Text, unique=True, nullable=False, index=True)
    email = Column(Text, nullable=False, index=True)
    name = Column(Text, nullable=True)
    subscription_tier = Column(
        String(32), nullable=False, default="free"
    )  # free, pro, enterprise
    stripe_customer_id: Optional[str] = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )



