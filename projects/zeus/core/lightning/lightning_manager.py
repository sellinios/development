"""
Lightning Manager - High-level interface for Lightning operations
Communicates only through Ermis
"""

from typing import Any, Dict, Optional
from ermis.ermis_adapters import LightningAdapter
from .lightning_compiler import LightningCompiler
from .lightning_models import CompilationRequest, CodeType, OptimizationLevel

class LightningManager:
    """Manager for Lightning compilation operations"""
    
    def __init__(self, cache=None, compiler=None):
        # Accept cache and compiler for backward compatibility with tests
        self.cache = cache  # Will be used if provided
        self.compiler = compiler or LightningCompiler()
        
        # Check if we should use Ermis (production) or direct mode (tests)
        try:
            from ermis.ermis_adapters import LightningAdapter
            self.ermis = LightningAdapter()  # Lightning uses its own adapter
        except ImportError:
            self.ermis = None  # Test mode
            
        self.component = 'lightning'
        
    def handle_request(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming requests through Ermis"""
        command = message.get('command')
        data = message.get('data', {})
        
        handlers = {
            'compile': self._handle_compile,
            'get_cached': self._handle_get_cached,
            'clear_cache': self._handle_clear_cache,
            'get_stats': self._handle_get_stats,
            'execute': self._handle_execute
        }
        
        handler = handlers.get(command)
        if handler:
            return handler(data)
        else:
            return {'error': f'Unknown command: {command}'}
            
    def _handle_compile(self, data: Dict) -> Dict[str, Any]:
        """Handle compilation request"""
        try:
            # Create compilation request
            request = CompilationRequest(
                source_code=data['source_code'],
                language=data.get('language', 'python'),
                optimization_level=OptimizationLevel(data.get('optimization_level', 2)),
                target_type=CodeType(data.get('target_type', 'bytecode')),
                metadata=data.get('metadata', {})
            )
            
            # Compile
            result = self.compiler.compile(request)
            
            if result.success:
                return {
                    'success': True,
                    'compiled_unit_id': result.compiled_unit.id,
                    'file_path': result.compiled_unit.file_path,
                    'compilation_time_ms': result.compilation_time_ms,
                    'warnings': result.warnings
                }
            else:
                return {
                    'success': False,
                    'error': result.error,
                    'warnings': result.warnings
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
            
    def _handle_get_cached(self, data: Dict) -> Dict[str, Any]:
        """Get cached compilation"""
        source_hash = data.get('source_hash')
        code_type = CodeType(data.get('code_type', 'bytecode'))
        
        cached = self.compiler.cache_manager.get_cached(source_hash, code_type)
        
        if cached:
            return {
                'success': True,
                'found': True,
                'compiled_unit': {
                    'id': cached.id,
                    'file_path': cached.file_path,
                    'optimization_level': cached.optimization_level.value,
                    'created_at': cached.created_at.isoformat(),
                    'execution_count': cached.execution_count
                }
            }
        else:
            return {
                'success': True,
                'found': False
            }
            
    def _handle_clear_cache(self, data: Dict) -> Dict[str, Any]:
        """Clear compilation cache"""
        code_type = data.get('code_type')
        
        if code_type:
            self.compiler.cache_manager.clear_cache(CodeType(code_type))
        else:
            self.compiler.cache_manager.clear_cache()
            
        return {'success': True, 'message': 'Cache cleared'}
        
    def _handle_get_stats(self, data: Dict) -> Dict[str, Any]:
        """Get compilation statistics"""
        stats = self.compiler.get_statistics()
        return {
            'success': True,
            'statistics': stats
        }
        
    def _handle_execute(self, data: Dict) -> Dict[str, Any]:
        """Execute compiled code (placeholder)"""
        # This would execute the compiled code
        # For now, return a placeholder
        return {
            'success': False,
            'error': 'Execution not yet implemented',
            'message': 'Use Python\'s exec or importlib to execute compiled bytecode'
        }
        
    def send_to_ermis(self, content: Any, intended_for: str = None) -> bool:
        """Send message through Ermis"""
        return self.ermis.send_to_ermis(content, intended_for)