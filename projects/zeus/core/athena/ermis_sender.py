#!/usr/bin/env python3
"""
Ermis Sender for Athena
Handles outgoing messages to other gods through Ermis messenger system
"""

import sys
import os
from typing import Dict, Any, List, Optional

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class AthenaErmisSender:
    """Sender for Athena to communicate with other gods"""
    
    def __init__(self):
        self._messenger = None
        self.god_name = 'athena'
    
    @property
    def messenger(self):
        """Lazy load messenger to avoid circular imports"""
        if self._messenger is None:
            from ermis.ermis_messenger import get_messenger
            self._messenger = get_messenger()
        return self._messenger
        
    def send_to_zeus(self, content: Any, msg_type: str = "athena_response") -> bool:
        """Send message to Zeus"""
        return self.messenger.send_message_full(self.god_name, 'zeus', content, msg_type)
        
    def send_to_cronos(self, content: Any, msg_type: str = "learning_schedule") -> bool:
        """Send message to Cronos"""
        return self.messenger.send_message_full(self.god_name, 'cronos', content, msg_type)
        
    def send_to_lightning(self, content: Any, msg_type: str = "memory_optimize") -> bool:
        """Send message to Lightning"""
        return self.messenger.send_message_full(self.god_name, 'lightning', content, msg_type)
        
    def send_to_ermis(self, content: Any, msg_type: str = "knowledge_share") -> bool:
        """Send message to Ermis"""
        return self.messenger.send_message_full(self.god_name, 'ermis', content, msg_type)
        
    def broadcast(self, content: Any, msg_type: str = "athena_broadcast", exclude: List[str] = None) -> Dict[str, bool]:
        """Broadcast message to all gods"""
        return self.messenger.broadcast_message(self.god_name, content, msg_type, exclude)
        
    def send(self, target: str, content: Any, msg_type: str = None) -> bool:
        """Generic send to any god"""
        if msg_type is None:
            msg_type = f"{self.god_name}_message"
        return self.messenger.send_message_full(self.god_name, target, content, msg_type)
        
    def send_and_wait(self, target: str, content: Any, timeout: float = 5.0) -> Optional[Dict[str, Any]]:
        """Send message and wait for response"""
        # Add a unique request ID
        import uuid
        request_id = str(uuid.uuid4())
        content['request_id'] = request_id
        content['requires_response'] = True
        
        # Send the message
        if not self.send(target, content):
            return None
            
        # Wait for response
        # This is a simplified implementation - in production, we'd use proper async messaging
        import time
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            # Check for response in messenger queue
            # For now, return a mock response
            # TODO: Implement proper response handling in Ermis
            time.sleep(0.1)
            
        # Mock response for now
        return {
            'status': 'success',
            'request_id': request_id,
            'result': {},
            'from': target
        }
    
    def send_request(self, request: Dict[str, Any], target: str) -> Optional[Dict[str, Any]]:
        """Send a request and wait for response (for database operations)"""
        # For now, this is a mock implementation
        # In production, this would properly send through Ermis and wait for response
        import uuid
        request['request_id'] = str(uuid.uuid4())
        request['from'] = self.god_name
        
        # Mock successful response for database operations
        if request.get('type') == 'database_request':
            operation = request.get('data', {}).get('operation')
            if operation in ['store_variable', 'store_pattern', 'store_function', 'store_concept', 'create', 'update', 'delete']:
                return {'success': True}
            elif operation in ['get_variable', 'get_pattern', 'get_function', 'get_concept']:
                # Return mock data
                return {
                    'success': True,
                    'variable': {'name': 'mock', 'value': 42, 'type': 'int'},
                    'pattern': {'name': 'mock', 'implementation': 'mock'},
                    'function': {'name': 'mock', 'body': 'return 42'},
                    'concept': {'id': 'mock', 'name': 'mock'}
                }
            elif operation in ['read', 'query', 'get_all_patterns']:
                # Use the real messenger for database queries
                result = self.messenger.request_and_wait(
                    source=self.god_name,
                    target=target,
                    data=request.get('data', {}),
                    msg_type=request.get('type', 'database_request'),
                    timeout=5.0
                )
                return result
        
        return {'success': False, 'error': 'Mock implementation'}
        
    # Specific command methods
    def report_analysis_complete(self, analysis_id: str, results: Any) -> bool:
        """Report analysis completion to Zeus"""
        return self.send_to_zeus({
            'analysis_id': analysis_id,
            'status': 'complete',
            'results': results
        }, 'analysis_complete')
        
    def share_learning_update(self, patterns: List[Dict], importance: str = 'normal') -> Dict[str, bool]:
        """Share new learning patterns with all gods"""
        return self.broadcast({
            'patterns': patterns,
            'importance': importance
        }, 'learning_update')
        
    def request_memory_optimization(self, memory_type: str, size_mb: float) -> bool:
        """Request memory optimization from Lightning"""
        return self.send_to_lightning({
            'memory_type': memory_type,
            'current_size_mb': size_mb,
            'optimization_needed': True
        }, 'memory_optimize')
        
    def schedule_learning_cycle(self, cycle_type: str, frequency: str) -> bool:
        """Schedule learning cycles with Cronos"""
        return self.send_to_cronos({
            'cycle_type': cycle_type,
            'frequency': frequency,
            'callback_data': {'component': 'learning_module'}
        }, 'learning_schedule')
        
    def share_knowledge_insight(self, insight: Dict[str, Any], target_gods: List[str] = None) -> Dict[str, bool]:
        """Share knowledge insights with specific gods or all"""
        if target_gods:
            results = {}
            for god in target_gods:
                if god != self.god_name:
                    results[god] = self.messenger.send_message_full(
                        self.god_name, god, 
                        {'insight': insight}, 
                        'knowledge_share'
                    )
            return results
        else:
            return self.broadcast({'insight': insight}, 'knowledge_share')


# Singleton instance
athena_sender = AthenaErmisSender()
sender = athena_sender  # Alias for compatibility