"""
Zeus-Ermis Unified Interface
Zeus communicates ONLY through Ermis - Olympus decides routing
"""

import logging
from typing import Any, Dict, Optional, List
from .ermis_sender import sender as zeus_sender


class ZeusErmisInterface:
    """
    Unified interface for Zeus to communicate with the divine assembly.
    All requests go through Ermis, and Olympus decides the routing.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.sender = zeus_sender
        self.session_id = None
        
    def request(self, intent: str, data: Dict[str, Any], wait_for_response: bool = True) -> Optional[Dict[str, Any]]:
        """
        Send a unified request through Ermis.
        Olympus will decide how to route it.
        
        Args:
            intent: The intent of the request (store, retrieve, compute, learn, etc.)
            data: The data associated with the request
            wait_for_response: Whether to wait for a response
            
        Returns:
            Response from the divine assembly, or None if fire-and-forget
        """
        message = {
            'type': 'unified_request',
            'intent': intent,
            'data': data,
            'session_id': self.session_id,
            'from': 'zeus'
        }
        
        if wait_for_response:
            # Send as unified request to Ermis queue for intelligent routing
            return self.sender.send_and_wait('ermis', message, msg_type='unified_request')
        else:
            # Send as unified request to Ermis queue
            self.sender.send('ermis', message, msg_type='unified_request')
            return None
            
    def start_session(self, context: Dict[str, Any] = None) -> str:
        """Start a new session"""
        response = self.request('start_session', {'context': context or {}})
        
        if response and response.get('status') == 'success':
            self.session_id = response.get('session_id')
            return self.session_id
        return None
        
    def end_session(self):
        """End the current session"""
        if self.session_id:
            self.request('end_session', {}, wait_for_response=False)
            self.session_id = None
            
    def store(self, name: str, value: Any, metadata: Dict[str, Any] = None) -> bool:
        """Store a value - Olympus decides where (cache, database, etc.)"""
        response = self.request('store', {
            'name': name,
            'value': value,
            'metadata': metadata or {}
        })
        
        return response and response.get('status') == 'success'
        
    def retrieve(self, name: str) -> Any:
        """Retrieve a value - Olympus decides where to look"""
        response = self.request('retrieve', {'name': name})
        
        if response and response.get('status') == 'success':
            return response.get('value')
        return None
        
    def compute(self, expression: str, context: Dict[str, Any] = None) -> Any:
        """Request computation - Olympus decides who handles it"""
        response = self.request('compute', {
            'expression': expression,
            'context': context or {}
        })
        
        if response and response.get('status') == 'success':
            return response.get('result')
        return None
        
    def learn(self, pattern_type: str, pattern_data: Dict[str, Any]) -> bool:
        """Request learning - Olympus routes to appropriate god"""
        response = self.request('learn', {
            'pattern_type': pattern_type,
            'pattern_data': pattern_data
        })
        
        return response and response.get('status') == 'success'
        
    def query(self, query_type: str, query_data: Dict[str, Any]) -> Any:
        """General query - Olympus determines the handler"""
        response = self.request('query', {
            'query_type': query_type,
            'query_data': query_data
        })
        
        if response and response.get('status') == 'success':
            return response.get('result')
        return None
        
    def natural_language(self, text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process natural language - Olympus routes to Athena"""
        response = self.request('natural_language', {
            'text': text,
            'context': context or {}
        })
        
        if response and response.get('status') == 'success':
            return response.get('result', {})
        return {}