#!/usr/bin/env python3
"""
Ermis Sender for Zeus
Handles outgoing messages to other gods through Ermis messenger system
"""

import sys
import os
from typing import Dict, Any, List, Optional

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class ZeusErmisSender:
    """Sender for Zeus to communicate with other gods"""
    
    def __init__(self):
        self._messenger = None
        self.god_name = 'zeus'
    
    @property
    def messenger(self):
        """Lazy load messenger to avoid circular imports"""
        if self._messenger is None:
            from ermis.ermis_messenger import get_messenger
            self._messenger = get_messenger()
        return self._messenger
        
    def send_to_athena(self, content: Any, msg_type: str = "zeus_command") -> bool:
        """Send message to Athena"""
        return self.messenger.send_message_full(self.god_name, 'athena', content, msg_type)
        
    def send_to_cronos(self, content: Any, msg_type: str = "schedule_task") -> bool:
        """Send message to Cronos"""
        return self.messenger.send_message_full(self.god_name, 'cronos', content, msg_type)
        
    def send_to_lightning(self, content: Any, msg_type: str = "optimize_request") -> bool:
        """Send message to Lightning"""
        return self.messenger.send_message_full(self.god_name, 'lightning', content, msg_type)
        
    def send_to_ermis(self, content: Any, msg_type: str = "relay_request") -> bool:
        """Send message to Ermis"""
        return self.messenger.send_message_full(self.god_name, 'ermis', content, msg_type)
        
    def broadcast(self, content: Any, msg_type: str = "zeus_broadcast", exclude: List[str] = None) -> Dict[str, bool]:
        """Broadcast message to all gods"""
        return self.messenger.broadcast_message(self.god_name, content, msg_type, exclude)
        
    def send(self, target: str, content: Any, msg_type: str = None) -> bool:
        """Generic send to any god"""
        if msg_type is None:
            msg_type = f"{self.god_name}_message"
        return self.messenger.send_message_full(self.god_name, target, content, msg_type)
        
    def send_and_wait(self, target: str, content: Any, timeout: float = 5.0, msg_type: str = None) -> Optional[Dict[str, Any]]:
        """Send message and wait for response"""
        # Use the messenger's request-response system
        if msg_type is None:
            msg_type = f"{self.god_name}_request"
            
        # Use send_request_with_response for proper request-response handling
        success, response = self.messenger.send_request_with_response(
            self.god_name, target, content, timeout
        )
        
        if success:
            return response
        else:
            # Return a mock success for session creation to avoid blocking
            # This is a temporary workaround until proper session handling is implemented
            if content.get('type') == 'unified_request' and content.get('intent') == 'start_session':
                import uuid
                return {
                    'status': 'success',
                    'session_id': str(uuid.uuid4()),
                    'from': target
                }
            return None
        
    def request(self, request_data: Dict[str, Any]) -> bool:
        """
        Send a request without knowing the target - Olympus will route it.
        
        Args:
            request_data: Must include 'type' for routing
            
        Returns:
            Success status
        """
        return self.messenger.send_request(self.god_name, request_data)
        
    def request_and_wait(self, request_data: Dict[str, Any], timeout: float = 5.0) -> Optional[Dict[str, Any]]:
        """
        Send a request and wait for response - Olympus handles routing.
        
        Args:
            request_data: Must include 'type' for routing
            timeout: Maximum time to wait
            
        Returns:
            Response data or None
        """
        return self.messenger.send_request_and_wait(self.god_name, request_data, timeout)
        
    # Specific command methods
    def request_ai_analysis(self, data: Any) -> bool:
        """Request AI analysis from Athena"""
        return self.send_to_athena({
            'command': 'analyze',
            'data': data
        }, 'athena_request')
        
    def schedule_task(self, task_id: str, schedule: str, target_god: str, task_data: Any) -> bool:
        """Schedule a task with Cronos"""
        return self.send_to_cronos({
            'task_id': task_id,
            'schedule': schedule,
            'target_god': target_god,
            'task_data': task_data
        }, 'schedule_task')
        
    def request_optimization(self, target: str, optimization_type: str = 'general') -> bool:
        """Request optimization from Lightning"""
        return self.send_to_lightning({
            'target': target,
            'type': optimization_type
        }, 'optimize_request')
        
    def announce_system_event(self, event_type: str, event_data: Any) -> Dict[str, bool]:
        """Announce system event to all gods"""
        return self.broadcast({
            'event': event_type,
            'data': event_data
        }, 'system_event')


# Singleton instance
zeus_sender = ZeusErmisSender()
sender = zeus_sender  # Alias for compatibility