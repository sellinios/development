#!/usr/bin/env python3
"""
Ermis Sender for Cronos
Handles outgoing messages to other gods through Ermis messenger system
"""

import sys
import os
from typing import Dict, Any, List, Optional
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class CronosErmisSender:
    """Sender for Cronos to communicate with other gods"""
    
    def __init__(self):
        self._messenger = None
        self.god_name = 'cronos'
    
    @property
    def messenger(self):
        """Lazy load messenger to avoid circular imports"""
        if self._messenger is None:
            from ermis.ermis_messenger import get_messenger
            self._messenger = get_messenger()
        return self._messenger
        
    def send_to_zeus(self, content: Any, msg_type: str = "cronos_notification") -> bool:
        """Send message to Zeus"""
        return self.messenger.send_message_full(self.god_name, 'zeus', content, msg_type)
        
    def send_to_athena(self, content: Any, msg_type: str = "scheduled_task") -> bool:
        """Send message to Athena"""
        return self.messenger.send_message_full(self.god_name, 'athena', content, msg_type)
        
    def send_to_lightning(self, content: Any, msg_type: str = "timing_optimize") -> bool:
        """Send message to Lightning"""
        return self.messenger.send_message_full(self.god_name, 'lightning', content, msg_type)
        
    def send_to_ermis(self, content: Any, msg_type: str = "time_sync") -> bool:
        """Send message to Ermis"""
        return self.messenger.send_message_full(self.god_name, 'ermis', content, msg_type)
        
    def broadcast(self, content: Any, msg_type: str = "cronos_broadcast", exclude: List[str] = None) -> Dict[str, bool]:
        """Broadcast message to all gods"""
        return self.messenger.broadcast_message(self.god_name, content, msg_type, exclude)
    
    def send_response(self, target: str, response: Dict[str, Any], response_id: str) -> bool:
        """Send a response back to a requester"""
        return self.messenger.send_response(self.god_name, target, response_id, response)
        
    # Specific command methods
    def notify_task_complete(self, task_id: str, target_god: str, result: Any = None) -> bool:
        """Notify that a scheduled task is complete"""
        return self.messenger.send_message_full(self.god_name, target_god, {
            'task_id': task_id,
            'status': 'complete',
            'completed_at': datetime.now().isoformat(),
            'result': result
        }, 'task_complete')
        
    def trigger_scheduled_task(self, target_god: str, task_data: Any) -> bool:
        """Trigger a scheduled task on target god"""
        return self.messenger.send_message_full(self.god_name, target_god, {
            'triggered_at': datetime.now().isoformat(),
            'task_data': task_data
        }, 'scheduled_task')
        
    def broadcast_time_sync(self) -> Dict[str, bool]:
        """Broadcast time synchronization to all gods"""
        return self.broadcast({
            'current_time': datetime.now().isoformat(),
            'timezone': 'UTC',
            'sync_type': 'periodic'
        }, 'time_sync')
        
    def notify_timer_expired(self, timer_id: str, callback_god: str, callback_data: Any) -> bool:
        """Notify that a timer has expired"""
        return self.messenger.send_message_full(self.god_name, callback_god, {
            'timer_id': timer_id,
            'expired_at': datetime.now().isoformat(),
            'callback_data': callback_data
        }, 'timer_expired')
        
    def request_timing_optimization(self, operation: str, current_duration_ms: float) -> bool:
        """Request timing optimization from Lightning"""
        return self.send_to_lightning({
            'operation': operation,
            'current_duration_ms': current_duration_ms,
            'optimization_goal': 'reduce_latency'
        }, 'timing_optimize')
        
    def announce_schedule_change(self, schedule_type: str, change_details: Dict) -> Dict[str, bool]:
        """Announce schedule changes to all gods"""
        return self.broadcast({
            'schedule_type': schedule_type,
            'change_details': change_details,
            'effective_from': datetime.now().isoformat()
        }, 'schedule_change')


# Singleton instance
cronos_sender = CronosErmisSender()