"""
Lightning Models - Data structures for compiled code
"""

from enum import Enum
from dataclasses import dataclass
from typing import Dict, Any, Optional
from datetime import datetime

class OptimizationLevel(Enum):
    """Optimization levels for compilation"""
    NONE = 0
    BASIC = 1
    STANDARD = 2
    AGGRESSIVE = 3
    
class CodeType(Enum):
    """Types of compiled code"""
    BYTECODE = "bytecode"      # Python .pyc
    NATIVE = "native"          # .so/.dll
    LLVM_IR = "llvm_ir"        # LLVM intermediate
    JIT = "jit"                # Just-in-time compiled

@dataclass
class CompiledUnit:
    """Represents a compiled code unit"""
    id: str
    source_hash: str
    code_type: CodeType
    optimization_level: OptimizationLevel
    file_path: str
    metadata: Dict[str, Any]
    created_at: datetime = None
    last_accessed: datetime = None
    execution_count: int = 0
    average_runtime_ms: float = 0.0
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.last_accessed is None:
            self.last_accessed = datetime.now()

@dataclass
class CompilationRequest:
    """Request to compile code"""
    source_code: str
    language: str = "python"
    optimization_level: OptimizationLevel = OptimizationLevel.STANDARD
    target_type: CodeType = CodeType.BYTECODE
    metadata: Dict[str, Any] = None
    request_id: Optional[str] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        if self.request_id is None:
            import uuid
            self.request_id = str(uuid.uuid4())

@dataclass
class CompilationResult:
    """Result of compilation"""
    success: bool
    compiled_unit: Optional[CompiledUnit] = None
    error: Optional[str] = None
    warnings: list = None
    compilation_time_ms: float = 0.0
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []