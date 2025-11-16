"""
Secure configuration management.
"""

import os
from typing import Optional


class Config:
    """Application configuration from environment variables."""

    def __init__(self):
        self.api_key = self._get_secret("API_KEY")
        self.database_url = self._get_secret("DATABASE_URL")
        self.secret_key = self._get_secret("SECRET_KEY")

    @staticmethod
    def _get_secret(key: str, default: Optional[str] = None) -> str:
        """
        Get secret from environment variable.

        Args:
            key: Environment variable name
            default: Default value if not found

        Returns:
            Secret value

        Raises:
            ValueError: If required secret is missing
        """
        value = os.environ.get(key, default)
        if value is None:
            raise ValueError(f"Required secret {key} not found")
        return value

    def __repr__(self):
        """Safe representation that doesn't expose secrets."""
        return f"Config(api_key=*****, database_url=*****, secret_key=*****)"


# Example usage
def main():
    try:
        config = Config()
        print("Configuration loaded successfully")
        print(config)  # Safe to print
    except ValueError as e:
        print(f"Configuration error: {e}")
        raise


if __name__ == "__main__":
    main()
