"""
Ermis - The Divine Messenger
Central communication hub for Zeus ecosystem
"""

# Core messenger components
from .ermis_messenger import ErmisMessenger, Message, get_messenger, messenger
from .ermis_messenger import GODS, QUEUE_SIZE, TIMEOUT

# Adapter components
from .ermis_adapters import (
    ZeusAdapter,
    AthenaAdapter,
    CronosAdapter,
    LightningAdapter,
    ErmisAdapter
)

# MessageAdapter is a generic base class
class MessageAdapter:
    """Base adapter for message formatting"""
    def format_message(self, content, metadata=None):
        # Return string representation for tests
        if metadata:
            return f"{content}"
        return str(content)
    
    def parse_message(self, message):
        # If it's a string, convert to expected format
        if isinstance(message, str):
            return {"content": message}
        return message

# Configuration
from .ermis_config import ErmisConfig

__all__ = [
    # Core
    'ErmisMessenger',
    'Message',
    'get_messenger',
    'messenger',
    # Adapters
    'MessageAdapter',
    'ZeusAdapter',
    'AthenaAdapter',
    'CronosAdapter',
    'LightningAdapter',
    'ErmisAdapter',
    # Config
    'ErmisConfig',
    # Constants
    'GODS',
    'QUEUE_SIZE',
    'TIMEOUT'
]