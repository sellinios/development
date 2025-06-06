"""
Lightning Compiler - Handles code compilation and optimization
"""

import os
import py_compile
import hashlib
import tempfile
import time
from typing import Dict, Any, Optional
from pathlib import Path

from .lightning_models import (
    CompiledUnit, CompilationRequest, CompilationResult,
    CodeType, OptimizationLevel
)
from .lightning_cache import CacheManager

class LightningCompiler:
    """Main compiler for Lightning system"""
    
    def __init__(self, cache_dir: str = None):
        if cache_dir is None:
            # Default to zeus root/data/lightning
            import os
            zeus_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(zeus_root, "data")
            cache_dir = os.path.join(data_dir, "lightning")
            
        self.cache_dir = cache_dir
        self.cache_manager = CacheManager(cache_dir)
        self._ensure_directories()
        
    def _ensure_directories(self):
        """Ensure Lightning directories exist"""
        dirs = ['cache', 'compiled', 'bytecode', 'native', 'llvm', 'jit']
        for d in dirs:
            Path(self.cache_dir, d).mkdir(parents=True, exist_ok=True)
            
    def compile(self, request: CompilationRequest) -> CompilationResult:
        """Compile code based on request"""
        start_time = time.time()
        
        try:
            # Generate source hash
            source_hash = self._hash_source(request.source_code)
            
            # Check cache first
            cached = self.cache_manager.get_cached(source_hash, request.target_type)
            if cached:
                return CompilationResult(
                    success=True,
                    compiled_unit=cached,
                    compilation_time_ms=0
                )
            
            # Compile based on target type
            if request.target_type == CodeType.BYTECODE:
                result = self._compile_bytecode(request, source_hash)
            elif request.target_type == CodeType.NATIVE:
                result = self._compile_native(request, source_hash)
            elif request.target_type == CodeType.LLVM_IR:
                result = self._compile_llvm(request, source_hash)
            elif request.target_type == CodeType.JIT:
                result = self._compile_jit(request, source_hash)
            else:
                return CompilationResult(
                    success=False,
                    error=f"Unsupported target type: {request.target_type}"
                )
                
            # Calculate compilation time
            compilation_time = (time.time() - start_time) * 1000
            result.compilation_time_ms = compilation_time
            
            # Cache the result if successful
            if result.success and result.compiled_unit:
                self.cache_manager.store(result.compiled_unit)
                
            return result
            
        except Exception as e:
            return CompilationResult(
                success=False,
                error=str(e),
                compilation_time_ms=(time.time() - start_time) * 1000
            )
            
    def _hash_source(self, source: str) -> str:
        """Generate hash of source code"""
        return hashlib.sha256(source.encode()).hexdigest()
        
    def _compile_bytecode(self, request: CompilationRequest, source_hash: str) -> CompilationResult:
        """Compile Python to bytecode"""
        try:
            # Create temporary source file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(request.source_code)
                source_file = f.name
                
            # Compile to bytecode
            output_file = os.path.join(
                self.cache_dir, 'bytecode', f'{source_hash}.pyc'
            )
            
            py_compile.compile(
                source_file,
                cfile=output_file,
                doraise=True,
                optimize=request.optimization_level.value
            )
            
            # Clean up source file
            os.unlink(source_file)
            
            # Create compiled unit
            unit = CompiledUnit(
                id=source_hash[:16],
                source_hash=source_hash,
                code_type=CodeType.BYTECODE,
                optimization_level=request.optimization_level,
                file_path=output_file,
                metadata=request.metadata
            )
            
            return CompilationResult(success=True, compiled_unit=unit)
            
        except py_compile.PyCompileError as e:
            return CompilationResult(success=False, error=str(e))
            
    def _compile_native(self, request: CompilationRequest, source_hash: str) -> CompilationResult:
        """Compile to native code (placeholder)"""
        # This would use Cython, Nuitka, or similar
        return CompilationResult(
            success=False,
            error="Native compilation not yet implemented",
            warnings=["Native compilation requires additional tools"]
        )
        
    def _compile_llvm(self, request: CompilationRequest, source_hash: str) -> CompilationResult:
        """Compile to LLVM IR (placeholder)"""
        # This would use Numba or similar
        return CompilationResult(
            success=False,
            error="LLVM compilation not yet implemented",
            warnings=["LLVM compilation requires Numba or similar"]
        )
        
    def _compile_jit(self, request: CompilationRequest, source_hash: str) -> CompilationResult:
        """JIT compilation (placeholder)"""
        # This would use PyPy's JIT or similar
        return CompilationResult(
            success=False,
            error="JIT compilation not yet implemented",
            warnings=["JIT compilation handled at runtime"]
        )
        
    def get_statistics(self) -> Dict[str, Any]:
        """Get compilation statistics"""
        return self.cache_manager.get_statistics()