"""
Athena - The AI Brain of Zeus
A TensorFlow-based intelligent system for natural language programming
"""

# Brain components
from .athena_core import AthenaBrain
# AthenaCore is an alias for AthenaBrain
AthenaCore = AthenaBrain
from .athena_context_manager import ContextManager
from .athena_coordinator import BrainCoordinator
# Coordinator is an alias for BrainCoordinator  
Coordinator = BrainCoordinator
from .athena_execution import ExecutionModule
# ExecutionEngine is an alias for ExecutionModule
ExecutionEngine = ExecutionModule
from .athena_features import SemanticFeatureExtractor
# FeatureExtractor is an alias for SemanticFeatureExtractor
FeatureExtractor = SemanticFeatureExtractor
from .athena_understanding import UnderstandingModule

# Memory components
# Deprecated modules removed - use UnifiedKnowledgeBase through Ermis
from .athena_knowledge_unified import UnifiedKnowledgeBase

# NLP components
from .athena_processor import NLPProcessor

# Reasoning components
from .athena_engine import ReasoningEngine

# Learning components
from .athena_pattern_learner import PatternLearner

# Messaging components
from .ermis_receiver import athena_receiver
from .ermis_sender import athena_sender

__version__ = "2.0.0"
__all__ = [
    # Brain
    "AthenaCore",
    "AthenaBrain",
    "ContextManager",
    "Coordinator",
    "ExecutionEngine",
    "FeatureExtractor",
    "UnderstandingModule",
    # Memory
    "UnifiedKnowledgeBase",
    # NLP
    "NLPProcessor",
    # Reasoning
    "ReasoningEngine",
    # Learning
    "PatternLearner",
    # Messaging
    "athena_receiver",
    "athena_sender"
]
