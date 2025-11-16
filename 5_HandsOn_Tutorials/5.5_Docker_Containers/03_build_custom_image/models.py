from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class User:
    """User model"""
    id: int
    username: str
    email: str
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

    def __post_init__(self):
        """Validate data after initialization"""
        if not self.username or len(self.username) < 3:
            raise ValueError("Username must be at least 3 characters")

        if not self.email or '@' not in self.email:
            raise ValueError("Invalid email address")

    def to_dict(self):
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
