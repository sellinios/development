"""
Unified Knowledge Base for Athena - Uses Ermis for all database operations
This replaces direct SQLite access with Ermis messaging
"""

import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import logging
from pathlib import Path


class UnifiedKnowledgeBase:
    """
    Knowledge base that uses Ermis for all database operations.
    No direct database access - everything goes through messaging.
    """

    def __init__(self, ermis_sender):
        self.logger = logging.getLogger(__name__)
        self.ermis_sender = ermis_sender
        self.current_session_id = None
        self.logger.info("Unified Knowledge Base initialized with Ermis")

    # Session Management
    def create_session(self, session_id: str) -> str:
        """Create a new session."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'create',
                'data': {
                    'table': 'sessions',
                    'record': {
                        'id': session_id,
                        'started_at': datetime.now().isoformat(),
                        'last_active': datetime.now().isoformat(),
                        'context': '{}',
                        'total_commands': 0,
                        'total_patterns_created': 0
                    }
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            self.current_session_id = session_id
            return session_id
        return None

    def update_session_activity(self, session_id: str):
        """Update session last activity timestamp."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'update',
                'data': {
                    'table': 'sessions',
                    'updates': {
                        'last_active': datetime.now().isoformat(),
                        'total_commands': 'total_commands + 1'  # This needs special handling
                    },
                    'conditions': {'id': session_id}
                }
            }
        }
        
        self.ermis_sender.send_request(request, 'cronos')

    # Pattern Management
    def store_pattern(self, pattern: Dict[str, Any]):
        """Store a new pattern with metadata."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'store_pattern',
                'data': {
                    'name': pattern['name'],
                    'pattern': pattern.get('template', f"{pattern['name']}()"),
                    'implementation': pattern['implementation'],
                    'metadata': {
                        'parameters': pattern.get('parameters', []),
                        'description': pattern.get('description', ''),
                        'category': pattern.get('category', 'general'),
                        'created_by_session': self.current_session_id
                    }
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            self.logger.info(f"Stored pattern: {pattern['name']}")

    def get_pattern(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieve a pattern by name."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'get_pattern',
                'data': {'name': name}
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            return response.get('pattern')
        return None

    def list_patterns(self, category: str = None) -> List[Dict[str, Any]]:
        """List all patterns, optionally filtered by category."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'read',
                'data': {
                    'table': 'patterns',
                    'conditions': {'category': category} if category else {}
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            return response.get('results', [])
        return []

    def get_all_patterns_data(self) -> List[Dict[str, Any]]:
        """Get all pattern data in a single query."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'get_all_patterns',
                'data': {}
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            patterns = response.get('patterns', response.get('results', []))
            # Process patterns to deserialize metadata
            for pattern in patterns:
                if 'metadata' in pattern and isinstance(pattern['metadata'], str):
                    try:
                        metadata = json.loads(pattern['metadata'])
                        pattern['parameters'] = metadata.get('parameters', [])
                        pattern['description'] = metadata.get('description', '')
                        pattern['category'] = metadata.get('category', 'general')
                    except:
                        pattern['parameters'] = []
            return patterns
        return []

    # Variable Management
    def store_variable(self, name: str, value: Any, var_type: str = None, scope: str = "global"):
        """Store or update a variable."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'store_variable',
                'data': {
                    'name': name,
                    'value': value,
                    'type': var_type or type(value).__name__,
                    'scope': scope,
                    'metadata': {
                        'session_id': self.current_session_id
                    }
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            self.logger.debug(f"Stored variable: {name} = {value} (scope: {scope})")

    def get_variable(self, name: str, scope: str = None) -> Optional[Tuple[Any, str]]:
        """Retrieve a variable value and type."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'get_variable',
                'data': {
                    'name': name,
                    'scope': scope,
                    'session_id': self.current_session_id
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            var = response.get('variable')
            if var:
                return var['value'], var['type']
        return None

    # Execution Tracking
    def record_execution(
        self,
        input_code: str,
        output_result: Any,
        execution_type: str = "general",
        success: bool = True,
        error_message: str = None,
        execution_time_ms: float = None,
    ):
        """Record an execution in history."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'create',
                'data': {
                    'table': 'executions',
                    'record': {
                        'session_id': self.current_session_id,
                        'input_code': input_code,
                        'output_result': json.dumps(output_result) if output_result is not None else None,
                        'execution_type': execution_type,
                        'success': 1 if success else 0,
                        'error_message': error_message,
                        'execution_time_ms': execution_time_ms,
                        'timestamp': datetime.now().isoformat()
                    }
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        return response.get('id') if response and response.get('success') else None

    # Learning and Corrections
    def store_correction(
        self,
        original_input: str,
        original_output: str,
        corrected_output: str,
        correction_type: str = "error",
        pattern_id: int = None,
    ):
        """Store a correction for learning."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'create',
                'data': {
                    'table': 'learning',
                    'record': {
                        'session_id': self.current_session_id,
                        'original_input': original_input,
                        'original_output': original_output,
                        'corrected_output': corrected_output,
                        'correction_type': correction_type,
                        'pattern_id': pattern_id,
                        'applied': 0,
                        'timestamp': datetime.now().isoformat()
                    }
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            self.logger.info("Stored correction for learning")

    # Context Management
    def store_context(self, context_type: str, context_value: Any):
        """Store context information."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'create',
                'data': {
                    'table': 'context',
                    'record': {
                        'session_id': self.current_session_id,
                        'context_type': context_type,
                        'context_value': json.dumps(context_value),
                        'timestamp': datetime.now().isoformat()
                    }
                }
            }
        }
        
        self.ermis_sender.send_request(request, 'cronos')

    def get_context(self, context_type: str = None) -> List[Dict[str, Any]]:
        """Retrieve context information."""
        conditions = {'session_id': self.current_session_id}
        if context_type:
            conditions['context_type'] = context_type
            
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'read',
                'data': {
                    'table': 'context',
                    'conditions': conditions
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            results = []
            for row in response.get('results', []):
                results.append({
                    'type': row['context_type'],
                    'value': json.loads(row['context_value']),
                    'timestamp': row['timestamp']
                })
            return results
        return []

    # Function Management
    def store_function(
        self,
        name: str,
        parameters: List[str],
        body: str,
        return_type: str = None,
        docstring: str = None,
    ):
        """Store a user-defined function."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'store_function',
                'data': {
                    'name': name,
                    'parameters': parameters,
                    'body': body,
                    'return_type': return_type,
                    'metadata': {
                        'docstring': docstring,
                        'session_id': self.current_session_id
                    }
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            self.logger.info(f"Stored function: {name}")

    def get_function(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieve a function by name."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'get_function',
                'data': {'name': name}
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            return response.get('function')
        return None

    def list_functions(self) -> List[str]:
        """List all function names."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'read',
                'data': {
                    'table': 'functions',
                    'conditions': {}
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            return [func['name'] for func in response.get('results', [])]
        return []

    # Statistics and Analytics
    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive statistics."""
        # This would require multiple Ermis requests
        # For now, return a simplified version
        stats = {
            'message': 'Statistics through Ermis not fully implemented',
            'session_id': self.current_session_id
        }
        return stats

    def get_execution_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get recent execution history."""
        request = {
            'type': 'database_request',
            'data': {
                'operation': 'query',
                'data': {
                    'query': 'SELECT input_code, output_result, execution_type, success, timestamp FROM executions WHERE session_id = ? ORDER BY timestamp DESC LIMIT ?',
                    'params': [self.current_session_id, limit]
                }
            }
        }
        
        response = self.ermis_sender.send_request(request, 'cronos')
        if response and response.get('success'):
            return response.get('results', [])
        return []

    def close(self):
        """Close connection (no-op for Ermis-based implementation)."""
        self.logger.info("Unified Knowledge Base closed")