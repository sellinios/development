"""
Zeus-Athena Interface using Ermis
Provides a clean interface for Zeus to communicate with Athena through Ermis
"""

import logging
from typing import Any, Dict, Optional
from .ermis_sender import sender as zeus_sender

class AthenaInterface:
    """
    Interface for Zeus to communicate with Athena through Ermis.
    Replaces direct imports of AthenaBrain.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.sender = zeus_sender
        
    def process_natural_language(self, text: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send natural language for processing - Olympus will route to appropriate god"""
        message = {
            'type': 'nlp_request',
            'text': text,
            'context': context or {}
        }
        
        # Let Olympus route the request
        response = self.sender.request_and_wait(message)
        
        if response and response.get('status') == 'success':
            return response.get('result', {})
        else:
            self.logger.warning(f"Failed to get NLP response from Athena: {response}")
            return {
                'intent': 'unknown',
                'confidence': 0.0,
                'entities': [],
                'suggestions': []
            }
            
    def get_suggestions(self, partial_input: str, context: Dict[str, Any] = None) -> list:
        """Get code suggestions - Olympus will route to appropriate god"""
        message = {
            'type': 'suggestion_request',
            'input': partial_input,
            'context': context or {}
        }
        
        response = self.sender.request_and_wait(message)
        
        if response and response.get('status') == 'success':
            return response.get('suggestions', [])
        return []
        
    def learn_pattern(self, pattern: str, implementation: str, metadata: Dict[str, Any] = None):
        """Send a pattern for learning - Olympus will route to appropriate god"""
        message = {
            'type': 'learn_pattern',
            'pattern': pattern,
            'implementation': implementation,
            'metadata': metadata or {}
        }
        
        # Fire and forget - no need to wait
        self.sender.request(message)
        
    def get_help(self, topic: str) -> str:
        """Get help on a topic - Olympus will route to appropriate god"""
        message = {
            'type': 'help_request',
            'topic': topic
        }
        
        response = self.sender.request_and_wait(message)
        
        if response and response.get('status') == 'success':
            return response.get('help_text', 'No help available.')
        return 'Unable to get help from Athena.'
        
    def get_patterns(self) -> Dict[str, Any]:
        """Get learned patterns from Athena"""
        message = {
            'type': 'get_patterns'
        }
        
        response = self.sender.request_and_wait(message)
        
        if response and response.get('status') == 'success':
            return response.get('patterns', {})
        return {}
        
    def execute(self, command: str, context: Dict[str, Any] = None) -> Any:
        """Execute a command through Athena"""
        message = {
            'type': 'execute_command',
            'command': command,
            'context': context or {}
        }
        
        response = self.sender.request_and_wait(message)
        
        if response and response.get('status') == 'success':
            return response.get('result')
        else:
            return f"Unable to execute command: {response.get('error', 'Unknown error') if response else 'No response'}"