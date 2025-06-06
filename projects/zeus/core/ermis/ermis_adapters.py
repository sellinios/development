"""
Ermis Adapters - Communication interfaces for each component
"""

from .ermis_messenger import get_messenger, Message
from typing import Any, Optional

class ZeusAdapter:
    """Adapter for Zeus to communicate only with Ermis"""
    
    def __init__(self):
        self.messenger = get_messenger()
        self.component = 'zeus'
        
    def send_to_ermis(self, content: Any, intended_for: str = None) -> bool:
        """Send message to Ermis (who will route it appropriately)"""
        message = {
            'content': content,
            'intended_for': intended_for  # Ermis will decide routing
        }
        return self.messenger.send_message_full(self.component, 'ermis', message)
        
    def receive(self, timeout: Optional[float] = None) -> Optional[Message]:
        """Receive messages from Ermis"""
        return self.messenger.receive_message(self.component, timeout)

class AthenaAdapter:
    """Adapter for Athena to communicate only with Ermis"""
    
    def __init__(self):
        self.messenger = get_messenger()
        self.component = 'athena'
        
    def send_to_ermis(self, content: Any, intended_for: str = None) -> bool:
        """Send message to Ermis (who will route it appropriately)"""
        message = {
            'content': content,
            'intended_for': intended_for  # Ermis will decide routing
        }
        return self.messenger.send_message_full(self.component, 'ermis', message)
        
    def receive(self, timeout: Optional[float] = None) -> Optional[Message]:
        """Receive messages from Ermis"""
        return self.messenger.receive_message(self.component, timeout)

class CronosAdapter:
    """Adapter for Cronos to communicate only with Ermis"""
    
    def __init__(self):
        self.messenger = get_messenger()
        self.component = 'cronos'
        
    def send_to_ermis(self, content: Any, intended_for: str = None) -> bool:
        """Send message to Ermis (who will route it appropriately)"""
        message = {
            'content': content,
            'intended_for': intended_for  # Ermis will decide routing
        }
        return self.messenger.send_message_full(self.component, 'ermis', message)
        
    def receive(self, timeout: Optional[float] = None) -> Optional[Message]:
        """Receive messages from Ermis"""
        return self.messenger.receive_message(self.component, timeout)

class LightningAdapter:
    """Adapter for Lightning to communicate only with Ermis"""
    
    def __init__(self):
        self.messenger = get_messenger()
        self.component = 'lightning'
        
    def send_to_ermis(self, content: Any, intended_for: str = None) -> bool:
        """Send message to Ermis (who will route it appropriately)"""
        message = {
            'content': content,
            'intended_for': intended_for  # Ermis will decide routing
        }
        return self.messenger.send_message_full(self.component, 'ermis', message)
        
    def receive(self, timeout: Optional[float] = None) -> Optional[Message]:
        """Receive messages from Ermis"""
        return self.messenger.receive_message(self.component, timeout)

class ErmisAdapter:
    """Ermis can communicate with all components"""
    
    def __init__(self):
        self.messenger = get_messenger()
        self.component = 'ermis'
        
    def send_to_zeus(self, content: Any) -> bool:
        """Send message to Zeus"""
        return self.messenger.send_message_full(self.component, 'zeus', content)
        
    def send_to_athena(self, content: Any) -> bool:
        """Send message to Athena"""
        return self.messenger.send_message_full(self.component, 'athena', content)
        
    def send_to_cronos(self, content: Any) -> bool:
        """Send message to Cronos"""
        return self.messenger.send_message_full(self.component, 'cronos', content)
        
    def send_to_lightning(self, content: Any) -> bool:
        """Send message to Lightning"""
        return self.messenger.send_message_full(self.component, 'lightning', content)
        
    def receive(self, timeout: Optional[float] = None) -> Optional[Message]:
        """Receive messages from any component"""
        return self.messenger.receive_message(self.component, timeout)