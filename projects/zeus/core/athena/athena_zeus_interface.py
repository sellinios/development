"""
Athena-Zeus Interface using Ermis
Provides a clean interface for Athena to communicate with Zeus through Ermis
"""

import logging
from typing import Any, Dict, Optional
from .ermis_sender import sender as athena_sender

class ZeusInterface:
    """
    Interface for Athena to communicate with Zeus through Ermis.
    Replaces direct imports of Zeus modules.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.sender = athena_sender
        
    def evaluate_code(self, code: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Send code to Zeus for evaluation"""
        message = {
            'type': 'evaluate_code',
            'code': code,
            'context': context or {},
            'from': 'athena'
        }
        
        # Send to Zeus through Ermis
        response = self.sender.send_and_wait('zeus', message)
        
        if response and response.get('status') == 'success':
            return response.get('result', None)
        else:
            self.logger.warning(f"Failed to evaluate code through Zeus: {response}")
            return None
            
    def parse_expression(self, expression: str) -> Dict[str, Any]:
        """Send expression to Zeus for parsing"""
        message = {
            'type': 'parse_expression',
            'expression': expression,
            'from': 'athena'
        }
        
        response = self.sender.send_and_wait('zeus', message)
        
        if response and response.get('status') == 'success':
            return response.get('ast', None)
        return None
        
    def execute_zeus_code(self, code: str, variables: Dict[str, Any] = None) -> Any:
        """Execute Zeus code with given variables"""
        message = {
            'type': 'execute_code',
            'code': code,
            'variables': variables or {},
            'from': 'athena'
        }
        
        response = self.sender.send_and_wait('zeus', message)
        
        if response and response.get('status') == 'success':
            return response.get('result', None)
        else:
            raise RuntimeError(f"Zeus execution failed: {response.get('error', 'Unknown error')}")