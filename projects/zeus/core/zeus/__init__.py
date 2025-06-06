"""
Zeus - AI-Powered Semantic Programming Language
Core engine and runtime
"""

# Core components
from .zeus_interpreter import ZeusInterpreter
from .zeus_parser import ZeusParser
from .zeus_runtime import ZeusRuntime
# Runtime is an alias for ZeusRuntime
Runtime = ZeusRuntime
from .zeus_evaluator import ZeusEvaluator
# Evaluator is an alias for ZeusEvaluator
Evaluator = ZeusEvaluator
from .zeus_exceptions import ZeusError
# Note: ZeusCLI is not imported here to avoid circular imports
# Import it directly when needed: from zeus.zeus_cli import ZeusCLI

# Performance and utilities
from .zeus_performance import PerformanceMonitor
from .zeus_health import HealthMonitor
# HealthChecker is an alias for HealthMonitor
HealthChecker = HealthMonitor
from .zeus_regex_cache import RegexCache
from common.safe_eval import SafeExpressionEvaluator
# SafeEvaluator is an alias for SafeExpressionEvaluator
SafeEvaluator = SafeExpressionEvaluator

# Messaging components
from .ermis_receiver import zeus_receiver
from .ermis_sender import zeus_sender

__version__ = "2.0.0"
__all__ = [
    # Core
    "ZeusInterpreter",
    "ZeusParser", 
    "Runtime",
    "ZeusRuntime",
    "Evaluator",
    "ZeusEvaluator",
    "ZeusError",
    # Utilities
    "PerformanceMonitor",
    "HealthChecker",
    "RegexCache",
    "SafeEvaluator",
    # Messaging
    "zeus_receiver",
    "zeus_sender"
]
