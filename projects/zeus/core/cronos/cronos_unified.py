"""
Unified Cronos Manager - Handles all database operations through Ermis
This replaces direct database access with the unified database adapter
"""

from typing import Any, Dict, Optional, List
from datetime import datetime
import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ermis.ermis_database_adapter import ErmisDatabaseAdapter


class UnifiedCronosManager:
    """
    Unified manager for Cronos that handles all database operations.
    Uses the ErmisDatabaseAdapter for all database access.
    """
    
    def __init__(self):
        self.component = 'cronos'
        self.db_adapter = ErmisDatabaseAdapter()
        self.scheduled_jobs = {}  # In-memory cache
        
    def handle_ermis_request(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle incoming requests from Ermis.
        This is the main entry point for all database operations.
        """
        request_type = message.get('type')
        data = message.get('data', {})
        
        # Route database requests to the adapter
        if request_type == 'database_request':
            return self.db_adapter.handle_request(data)
            
        # Handle all Cronos requests
        handlers = {
            'schedule_task': self._handle_schedule_task,
            'cancel_task': self._handle_cancel_task,
            'get_schedule': self._handle_get_schedule,
            'time_query': self._handle_time_query,
            'store_variable': self._handle_store_variable,
            'get_variable': self._handle_get_variable,
            'store_concept': self._handle_store_concept,
            'get_concept': self._handle_get_concept,
            'store_compiled': self._handle_store_compiled,
            'store_pattern': self._handle_store_pattern,
            'get_pattern': self._handle_get_pattern,
            'get_all_patterns': self._handle_get_all_patterns,
        }
        
        handler = handlers.get(request_type)
        if handler:
            return handler(data)
        
        return {
            'success': False,
            'error': f'Unknown request type: {request_type}'
        }
    
    def _handle_schedule_task(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle task scheduling requests."""
        try:
            job_id = data.get('job_id')
            task = data.get('task')
            run_time = data.get('run_time')
            recurring = data.get('recurring', False)
            interval_seconds = data.get('interval_seconds')
            
            # Store in memory
            self.scheduled_jobs[job_id] = {
                'task': task,
                'run_time': run_time,
                'recurring': recurring,
                'interval_seconds': interval_seconds,
                'status': 'scheduled',
                'created_at': datetime.now().isoformat()
            }
            
            # Persist to database
            db_request = {
                'operation': 'create',
                'data': {
                    'table': 'scheduled_jobs',
                    'record': {
                        'job_id': job_id,
                        'task': json.dumps(task),
                        'run_time': run_time,
                        'recurring': 1 if recurring else 0,
                        'interval_seconds': interval_seconds,
                        'status': 'scheduled',
                        'created_at': datetime.now().isoformat()
                    }
                }
            }
            
            result = self.db_adapter.handle_request(db_request)
            return {
                'success': result.get('success', False),
                'job_id': job_id if result.get('success') else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_cancel_task(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle task cancellation requests."""
        try:
            job_id = data.get('job_id')
            
            # Update in memory
            if job_id in self.scheduled_jobs:
                self.scheduled_jobs[job_id]['status'] = 'cancelled'
            
            # Update in database
            db_request = {
                'operation': 'update',
                'data': {
                    'table': 'scheduled_jobs',
                    'updates': {'status': 'cancelled'},
                    'conditions': {'job_id': job_id}
                }
            }
            
            result = self.db_adapter.handle_request(db_request)
            return {
                'success': result.get('success', False),
                'job_id': job_id if result.get('success') else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_get_schedule(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Get scheduled tasks."""
        try:
            job_id = data.get('job_id')
            
            if job_id:
                # Get specific job
                if job_id in self.scheduled_jobs:
                    return {
                        'success': True,
                        'job': self.scheduled_jobs[job_id]
                    }
                    
                # Check database if not in memory
                db_request = {
                    'operation': 'read',
                    'data': {
                        'table': 'scheduled_jobs',
                        'conditions': {'job_id': job_id}
                    }
                }
                
                result = self.db_adapter.handle_request(db_request)
                if result.get('success') and result.get('results'):
                    return {
                        'success': True,
                        'job': result['results'][0]
                    }
            else:
                # Get all scheduled jobs
                db_request = {
                    'operation': 'read',
                    'data': {
                        'table': 'scheduled_jobs',
                        'conditions': {'status': 'scheduled'}
                    }
                }
                
                result = self.db_adapter.handle_request(db_request)
                return {
                    'success': result.get('success', False),
                    'jobs': result.get('results', [])
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_time_query(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle time-related queries."""
        query_type = data.get('query_type')
        
        if query_type == 'current_time':
            return {
                'success': True,
                'time': datetime.now().isoformat()
            }
        elif query_type == 'scheduled_tasks':
            # Get list of scheduled task IDs
            scheduled = [
                job_id for job_id, job in self.scheduled_jobs.items()
                if job['status'] == 'scheduled'
            ]
            return {
                'success': True,
                'tasks': scheduled
            }
        elif query_type == 'next_run_time':
            # Get the next scheduled run time
            next_time = None
            next_job = None
            
            for job_id, job in self.scheduled_jobs.items():
                if job['status'] == 'scheduled':
                    job_time = datetime.fromisoformat(job['run_time'])
                    if next_time is None or job_time < next_time:
                        next_time = job_time
                        next_job = job_id
                        
            return {
                'success': True,
                'next_run_time': next_time.isoformat() if next_time else None,
                'job_id': next_job
            }
        else:
            return {
                'success': False,
                'error': f'Unknown query type: {query_type}'
            }
    
    def _handle_store_variable(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle variable storage requests."""
        try:
            db_request = {
                'operation': 'store_variable',
                'data': {
                    'name': data.get('name'),
                    'value': data.get('value'),
                    'type': data.get('type', 'unknown'),
                    'metadata': data.get('metadata', {}),
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
            }
            
            result = self.db_adapter.handle_request(db_request)
            return {
                'success': result.get('success', False),
                'variable': data.get('name') if result.get('success') else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_get_variable(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle variable retrieval requests."""
        try:
            db_request = {
                'operation': 'get_variable',
                'data': {
                    'name': data.get('name')
                }
            }
            
            result = self.db_adapter.handle_request(db_request)
            if result.get('success') and result.get('results'):
                var_data = result['results'][0]
                return {
                    'success': True,
                    'variable': var_data
                }
            
            return {
                'success': False,
                'error': 'Variable not found'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_store_concept(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle concept storage requests."""
        try:
            db_request = {
                'operation': 'store_concept',
                'data': {
                    'id': data.get('id'),
                    'name': data.get('name'),
                    'description': data.get('description', ''),
                    'attributes': data.get('attributes', {}),
                    'relationships': data.get('relationships', []),
                    'confidence': data.get('confidence', 1.0),
                    'created_at': datetime.now().isoformat()
                }
            }
            
            result = self.db_adapter.handle_request(db_request)
            return {
                'success': result.get('success', False),
                'concept_id': data.get('id') if result.get('success') else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_get_concept(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle concept retrieval requests."""
        try:
            db_request = {
                'operation': 'get_concept',
                'data': {
                    'id': data.get('id')
                }
            }
            
            result = self.db_adapter.handle_request(db_request)
            if result.get('success') and result.get('results'):
                concept_data = result['results'][0]
                return {
                    'success': True,
                    'concept': concept_data
                }
            
            return {
                'success': False,
                'error': 'Concept not found'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_store_compiled(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle compiled code storage requests."""
        try:
            db_request = {
                'operation': 'store_compiled',
                'data': {
                    'id': data.get('id'),
                    'source_code': data.get('source_code'),
                    'lightning_ref': data.get('lightning_ref'),
                    'optimization_level': data.get('optimization_level', 0),
                    'created_at': datetime.now().isoformat(),
                    'execution_count': data.get('execution_count', 0),
                    'average_runtime': data.get('average_runtime', 0.0)
                }
            }
            
            result = self.db_adapter.handle_request(db_request)
            return {
                'success': result.get('success', False),
                'code_id': data.get('id') if result.get('success') else None,
                'lightning_ref': data.get('lightning_ref') if result.get('success') else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_store_pattern(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pattern storage requests."""
        try:
            
            # The pattern field should be the template
            db_request = {
                'operation': 'store_pattern',
                'data': {
                    'name': data.get('name'),
                    'pattern': data.get('template', data.get('pattern', '')),  # Use template as pattern
                    'implementation': data.get('implementation', ''),
                    'metadata': {
                        'description': data.get('description', ''),
                        'category': data.get('category', 'user_defined'),
                        'parameters': data.get('parameters', [])
                    }
                }
            }
            
            
            result = self.db_adapter.handle_request(db_request)
            return {
                'success': result.get('success', False),
                'pattern_name': data.get('name') if result.get('success') else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_get_pattern(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle pattern retrieval requests."""
        try:
            db_request = {
                'operation': 'get_pattern',
                'data': {
                    'name': data.get('name')
                }
            }
            
            result = self.db_adapter.handle_request(db_request)
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_get_all_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle request to get all patterns."""
        try:
            db_request = {
                'operation': 'get_all_patterns',
                'data': {}
            }
            
            result = self.db_adapter.handle_request(db_request)
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def close(self):
        """Close database connection."""
        self.db_adapter.close()