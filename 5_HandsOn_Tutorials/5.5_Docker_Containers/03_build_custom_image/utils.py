import logging
import os
from datetime import datetime

def setup_logging():
    """Configure application logging"""
    log_level = os.getenv('LOG_LEVEL', 'INFO')

    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    return logging.getLogger(__name__)

def get_timestamp():
    """Get current timestamp in ISO format"""
    return datetime.now().isoformat()

def validate_email(email):
    """Basic email validation"""
    return '@' in email and '.' in email.split('@')[1]

def validate_username(username):
    """Basic username validation"""
    return len(username) >= 3 and username.isalnum()
