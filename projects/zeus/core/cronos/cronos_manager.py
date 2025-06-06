"""
Cronos Manager - High-level interface for Cronos operations
Communicates only through Ermis
"""

from typing import Any, Dict, Optional
from datetime import datetime, timedelta
from .cronos_models import Variable, Concept, CompiledCode
from .ermis_sender import cronos_sender

class CronosManager:
    """Manager for Cronos database operations"""
    
    def __init__(self):
        # No direct database access - everything through Ermis
        self.component = 'cronos'
        self.scheduled_jobs = {}  # Store scheduled jobs in memory
        self.sender = cronos_sender
        
    def handle_request(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming requests through Ermis"""
        command = message.get('command')
        data = message.get('data', {})
        
        handlers = {
            'store_variable': self._handle_store_variable,
            'get_variable': self._handle_get_variable,
            'store_concept': self._handle_store_concept,
            'get_concept': self._handle_get_concept,
            'store_compiled': self._handle_store_compiled,
            'query': self._handle_query
        }
        
        handler = handlers.get(command)
        if handler:
            return handler(data)
        else:
            return {'error': f'Unknown command: {command}'}
            
    def _handle_store_variable(self, data: Dict) -> Dict[str, Any]:
        """Store a variable"""
        var = Variable(
            name=data['name'],
            value=data['value'],
            type=data.get('type', type(data['value']).__name__),
            scope=data.get('scope', 'global'),
            metadata=data.get('metadata', {})
        )
        
        # Send storage request through Ermis
        message = {
            'operation': 'storage_store',
            'table': 'variables',
            'data': {
                'name': var.name,
                'value': var.value,
                'type': var.type,
                'scope': var.scope,
                'metadata': var.metadata,
                'created_at': var.created_at.isoformat(),
                'updated_at': var.updated_at.isoformat()
            }
        }
        
        response = self.sender.request_and_wait(message)
        success = response and response.get('success', False)
        
        return {
            'success': success,
            'variable': var.name if success else None
        }
        
    def _handle_get_variable(self, data: Dict) -> Dict[str, Any]:
        """Retrieve a variable"""
        # Send retrieval request through Ermis
        message = {
            'operation': 'storage_retrieve',
            'table': 'variables',
            'filters': {'name': data['name']}
        }
        
        response = self.sender.request_and_wait(message)
        
        if response and response.get('success') and response.get('data'):
            var_data = response['data'][0] if response['data'] else None
            if var_data:
                return {
                    'success': True,
                    'variable': {
                        'name': var_data['name'],
                        'value': var_data['value'],
                        'type': var_data['type'],
                        'scope': var_data['scope'],
                        'metadata': var_data['metadata']
                    }
                }
        
        return {'success': False, 'error': 'Variable not found'}
        
    def _handle_store_concept(self, data: Dict) -> Dict[str, Any]:
        """Store a concept"""
        concept = Concept(
            id=data['id'],
            name=data['name'],
            description=data.get('description', ''),
            attributes=data.get('attributes', {}),
            relationships=data.get('relationships', []),
            confidence=data.get('confidence', 1.0)
        )
        
        # Send storage request through Ermis
        message = {
            'operation': 'storage_store',
            'table': 'concepts',
            'data': {
                'id': concept.id,
                'name': concept.name,
                'description': concept.description,
                'attributes': concept.attributes,
                'relationships': concept.relationships,
                'confidence': concept.confidence,
                'created_at': concept.created_at.isoformat()
            }
        }
        
        response = self.sender.request_and_wait(message)
        success = response and response.get('success', False)
        
        return {
            'success': success,
            'concept_id': concept.id if success else None
        }
        
    def _handle_get_concept(self, data: Dict) -> Dict[str, Any]:
        """Retrieve a concept"""
        # Send retrieval request through Ermis
        message = {
            'operation': 'storage_retrieve',
            'table': 'concepts',
            'filters': {'id': data['id']}
        }
        
        response = self.sender.request_and_wait(message)
        
        if response and response.get('success') and response.get('data'):
            concept_data = response['data'][0] if response['data'] else None
            if concept_data:
                return {
                    'success': True,
                    'concept': {
                        'id': concept_data['id'],
                        'name': concept_data['name'],
                        'description': concept_data['description'],
                        'attributes': concept_data['attributes'],
                        'relationships': concept_data['relationships'],
                        'confidence': concept_data['confidence']
                    }
                }
        
        return {'success': False, 'error': 'Concept not found'}
        
    def _handle_store_compiled(self, data: Dict) -> Dict[str, Any]:
        """Store compiled code reference"""
        code = CompiledCode(
            id=data['id'],
            source_code=data['source_code'],
            lightning_ref=data['lightning_ref'],
            optimization_level=data.get('optimization_level', 0)
        )
        
        # Send storage request through Ermis
        message = {
            'operation': 'storage_store',
            'table': 'compiled_code',
            'data': {
                'id': code.id,
                'source_code': code.source_code,
                'lightning_ref': code.lightning_ref,
                'optimization_level': code.optimization_level,
                'created_at': code.created_at.isoformat(),
                'execution_count': code.execution_count,
                'average_runtime': code.average_runtime
            }
        }
        
        response = self.sender.request_and_wait(message)
        success = response and response.get('success', False)
        
        return {
            'success': success,
            'code_id': code.id if success else None,
            'lightning_ref': code.lightning_ref if success else None
        }
        
    def _handle_query(self, data: Dict) -> Dict[str, Any]:
        """Handle custom queries"""
        # This would handle more complex queries
        # For now, return a placeholder
        return {
            'success': True,
            'results': [],
            'message': 'Query functionality to be implemented'
        }
        
    def send_to_ermis(self, content: Any, intended_for: str = None) -> bool:
        """Send message through Ermis"""
        return self.sender.send(content, intended_for)
    
    def schedule_job(self, job_id: str, task: Dict[str, Any], run_time: datetime) -> bool:
        """Schedule a job to run at a specific time"""
        try:
            # Store job in memory (in production, this would use the database)
            self.scheduled_jobs[job_id] = {
                'task': task,
                'run_time': run_time,
                'status': 'scheduled',
                'created_at': datetime.now()
            }
            
            # Store in database for persistence
            job_data = {
                'job_id': job_id,
                'task': str(task),  # Convert dict to string for storage
                'run_time': run_time.isoformat(),
                'status': 'scheduled',
                'created_at': datetime.now().isoformat()
            }
            
            # Note: In the new architecture, database operations go through Ermis
            # For now, just return True since we've stored in memory
            # TODO: Send database request through Ermis
            return True
        except Exception as e:
            print(f"Error scheduling job: {e}")
            return False
    
    def cancel_job(self, job_id: str) -> bool:
        """Cancel a scheduled job"""
        try:
            # Remove from memory
            if job_id in self.scheduled_jobs:
                del self.scheduled_jobs[job_id]
            
            # Note: In the new architecture, database operations go through Ermis
            # For now, just return True since we've updated memory
            # TODO: Send database request through Ermis
            return True
        except Exception as e:
            print(f"Error cancelling job: {e}")
            return False
    
    def get_next_run_time(self, job_id: str = None) -> Optional[datetime]:
        """Get the next run time for a specific job or the earliest job"""
        try:
            if job_id:
                # Get specific job
                if job_id in self.scheduled_jobs:
                    job = self.scheduled_jobs[job_id]
                    if job['status'] == 'scheduled':
                        return job['run_time']
                
                # TODO: Check database through Ermis if not in memory
                # For now, return None if not in memory
                return None
            else:
                # Get earliest scheduled job
                next_time = None
                
                # Check memory first
                for job in self.scheduled_jobs.values():
                    if job['status'] == 'scheduled':
                        if next_time is None or job['run_time'] < next_time:
                            next_time = job['run_time']
                
                # TODO: Also check database through Ermis
                # For now, only check memory
                
                return next_time
                
        except Exception as e:
            print(f"Error getting next run time: {e}")
            return None