"""
Cronos - The Eternal Database
Permanent storage for Zeus system variables, concepts, and knowledge
"""

# Core components
# from .cronos_database import CronosDB  # Deprecated - use Ermis messaging
# Database = CronosDB  # Deprecated
from .cronos_models import Variable, Concept, Relation, CompiledCode
# CronosModel is a base class for all models
class CronosModel:
    """Base class for Cronos models"""
    pass
from .cronos_manager import CronosManager

# Messaging components
from .ermis_receiver import cronos_receiver
from .ermis_sender import cronos_sender

__all__ = [
    # Core
    # 'Database',  # Deprecated
    # 'CronosDB',  # Deprecated
    'CronosModel',
    'Variable',
    'Concept',
    'Relation',
    'CronosManager',
    # Messaging
    'cronos_receiver',
    'cronos_sender'
]