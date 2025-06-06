"""
Lightning - Machine Code Compilation and Storage
Handles code optimization and compilation through Ermis
"""

# Core components
from .lightning_compiler import LightningCompiler
# Compiler is an alias for LightningCompiler
Compiler = LightningCompiler
from .lightning_cache import CacheManager
from .lightning_models import CompiledUnit, OptimizationLevel
# LightningModel is a base class
class LightningModel:
    """Base model for Lightning components"""
    pass
from .lightning_manager import LightningManager

# Messaging components
from .ermis_receiver import lightning_receiver
from .ermis_sender import lightning_sender

__all__ = [
    # Core
    'Compiler',
    'LightningCompiler',
    'CacheManager',
    'LightningModel',
    'CompiledUnit',
    'OptimizationLevel',
    'LightningManager',
    # Messaging
    'lightning_receiver',
    'lightning_sender'
]