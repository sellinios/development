"""
Olympus - Divine Routing System
Knows which god handles what domain and routes messages accordingly
Now with integrated security and validation layer
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from enum import Enum
from .ermis_security import security_validator, ValidationResult

class Domain(Enum):
    """Divine domains of responsibility"""
    # Core domains
    LANGUAGE = "language"           # Zeus - Language parsing and execution
    INTELLIGENCE = "intelligence"   # Athena - AI and natural language understanding
    TIME = "time"                  # Cronos - Scheduling and time management
    PERFORMANCE = "performance"     # Lightning - Optimization and caching
    MESSAGING = "messaging"         # Ermis - Communication
    
    # Data domains
    DATABASE = "database"          # Cronos - Persistent storage
    KNOWLEDGE = "knowledge"        # Cronos - Knowledge base
    PATTERNS = "patterns"          # Cronos - Pattern storage
    CACHE = "cache"               # Lightning - Performance cache
    
    # Processing domains
    NLP = "nlp"                   # Athena - Natural language processing
    EVALUATION = "evaluation"      # Zeus - Code evaluation
    COMPILATION = "compilation"    # Lightning - Code compilation
    LEARNING = "learning"         # Athena - Machine learning
    
    # Meta domains
    STORAGE = "storage"           # Intelligent storage routing
    VALIDATION = "validation"     # Data validation
    
    # System domains
    ORCHESTRATION = "orchestration" # Orchestrator - System coordination
    COMMON = "common"              # Common utilities
    HEALTH = "health"             # System health monitoring

@dataclass
class RoutingRule:
    """Defines how to route requests for a domain"""
    domain: Domain
    primary_god: str
    fallback_gods: List[str] = None
    description: str = ""

class Olympus:
    """
    Divine routing system that knows which god handles what.
    Gods send requests to Olympus, and Olympus routes them to the appropriate god.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.routing_table = self._initialize_routing_table()
        self.request_type_mapping = self._initialize_request_types()
        
    def _initialize_routing_table(self) -> Dict[Domain, RoutingRule]:
        """Initialize the divine routing table"""
        return {
            # Language and execution
            Domain.LANGUAGE: RoutingRule(
                Domain.LANGUAGE, "zeus", 
                description="Language parsing, syntax, execution"
            ),
            Domain.EVALUATION: RoutingRule(
                Domain.EVALUATION, "zeus",
                description="Code evaluation and execution"
            ),
            
            # Intelligence and NLP
            Domain.INTELLIGENCE: RoutingRule(
                Domain.INTELLIGENCE, "athena",
                description="AI operations, understanding, suggestions"
            ),
            Domain.NLP: RoutingRule(
                Domain.NLP, "athena",
                description="Natural language processing"
            ),
            Domain.LEARNING: RoutingRule(
                Domain.LEARNING, "athena", ["cronos"],
                description="Machine learning and pattern learning"
            ),
            
            # Time and persistence
            Domain.TIME: RoutingRule(
                Domain.TIME, "cronos",
                description="Scheduling, time management"
            ),
            Domain.DATABASE: RoutingRule(
                Domain.DATABASE, "cronos",
                description="Database operations"
            ),
            Domain.KNOWLEDGE: RoutingRule(
                Domain.KNOWLEDGE, "cronos",
                description="Knowledge storage and retrieval"
            ),
            Domain.PATTERNS: RoutingRule(
                Domain.PATTERNS, "cronos", ["athena"],
                description="Pattern storage and management"
            ),
            
            # Performance
            Domain.PERFORMANCE: RoutingRule(
                Domain.PERFORMANCE, "lightning",
                description="Performance optimization"
            ),
            Domain.CACHE: RoutingRule(
                Domain.CACHE, "lightning",
                description="Caching operations"
            ),
            Domain.COMPILATION: RoutingRule(
                Domain.COMPILATION, "lightning",
                description="Code compilation and optimization"
            ),
            
            # System
            Domain.MESSAGING: RoutingRule(
                Domain.MESSAGING, "ermis",
                description="Inter-god communication"
            ),
            Domain.ORCHESTRATION: RoutingRule(
                Domain.ORCHESTRATION, "orchestrator",
                description="System-wide coordination"
            ),
            Domain.COMMON: RoutingRule(
                Domain.COMMON, "common",
                description="Shared utilities"
            ),
            Domain.HEALTH: RoutingRule(
                Domain.HEALTH, "zeus", ["orchestrator"],
                description="System health monitoring"
            ),
        }
        
    def _initialize_request_types(self) -> Dict[str, Domain]:
        """Map request types to domains"""
        return {
            # Language operations
            "parse_expression": Domain.LANGUAGE,
            "evaluate_code": Domain.EVALUATION,
            "execute_code": Domain.EVALUATION,
            "validate_syntax": Domain.LANGUAGE,
            
            # Intelligence operations
            "nlp_request": Domain.NLP,
            "suggestion_request": Domain.INTELLIGENCE,
            "help_request": Domain.INTELLIGENCE,
            "analyze": Domain.INTELLIGENCE,
            "understand": Domain.NLP,
            
            # Database operations
            "store_variable": Domain.DATABASE,
            "get_variable": Domain.DATABASE,
            "store_function": Domain.DATABASE,
            "get_function": Domain.DATABASE,
            "database_request": Domain.DATABASE,
            "store_concept": Domain.DATABASE,
            "get_concept": Domain.DATABASE,
            "start_session": Domain.KNOWLEDGE,
            "end_session": Domain.KNOWLEDGE,
            
            # Pattern operations
            "store_pattern": Domain.PATTERNS,
            "get_pattern": Domain.PATTERNS,
            "get_all_patterns": Domain.PATTERNS,
            "learn_pattern": Domain.LEARNING,
            "record_learning": Domain.LEARNING,
            "learn_from_code": Domain.LEARNING,
            "get_usage_patterns": Domain.LEARNING,
            
            # Time operations
            "schedule_task": Domain.TIME,
            "cancel_task": Domain.TIME,
            "get_schedule": Domain.TIME,
            
            # Performance operations
            "optimize_code": Domain.COMPILATION,
            "cache_result": Domain.CACHE,
            "get_cached": Domain.CACHE,
            "compile_code": Domain.COMPILATION,
            
            # System operations
            "health_check": Domain.HEALTH,
            "system_status": Domain.ORCHESTRATION,
            "broadcast": Domain.MESSAGING,
            
            # Generic intents (Zeus unified interface)
            "store": Domain.DATABASE,
            "retrieve": Domain.DATABASE,
            "compute": Domain.EVALUATION,
            "learn": Domain.LEARNING,
            "query": Domain.DATABASE,
        }
        
    def route_request(self, request: Dict[str, Any]) -> Tuple[str, Optional[List[str]]]:
        """
        Route a request to the appropriate god(s).
        
        Args:
            request: Request containing 'type' and other data
            
        Returns:
            Tuple of (primary_target, fallback_targets)
        """
        request_type = request.get('type')
        
        # First, try to route by request type
        if request_type in self.request_type_mapping:
            domain = self.request_type_mapping[request_type]
            rule = self.routing_table[domain]
            return rule.primary_god, rule.fallback_gods
            
        # If no specific type, try to infer from content
        domain = self._infer_domain(request)
        if domain:
            rule = self.routing_table[domain]
            return rule.primary_god, rule.fallback_gods
            
        # Default routing based on sender (if they're asking for help)
        sender = request.get('from')
        if sender == 'zeus':
            return 'athena', None  # Zeus asks Athena for help
        elif sender == 'athena':
            return 'cronos', None  # Athena asks Cronos for data
        elif sender == 'cronos':
            return 'zeus', None    # Cronos asks Zeus for execution
        elif sender == 'lightning':
            return 'zeus', None    # Lightning asks Zeus for code
            
        # Ultimate fallback
        return 'orchestrator', None
    
    def secure_route_request(self, request: Dict[str, Any], sender: str) -> Tuple[Optional[str], Optional[List[str]], ValidationResult]:
        """
        Securely route a request with validation.
        
        Args:
            request: Request containing 'type' and other data
            sender: The god sending the request
            
        Returns:
            Tuple of (primary_target, fallback_targets, validation_result)
        """
        # Validate request first
        validation_result = security_validator.validate_request(request, sender)
        
        if not validation_result.valid:
            self.logger.warning(f"Request from {sender} failed validation: {validation_result.reason}")
            return None, None, validation_result
        
        # Use sanitized request for routing
        sanitized_request = validation_result.sanitized_data or request
        
        # Get routing
        primary, fallbacks = self.route_request(sanitized_request)
        
        return primary, fallbacks, validation_result
        
    def _infer_domain(self, request: Dict[str, Any]) -> Optional[Domain]:
        """Infer domain from request content"""
        content = str(request).lower()
        
        # Keywords to domain mapping
        keyword_domains = {
            ('parse', 'syntax', 'code', 'execute', 'eval'): Domain.LANGUAGE,
            ('ai', 'understand', 'suggest', 'nlp', 'natural'): Domain.INTELLIGENCE,
            ('store', 'save', 'database', 'persist'): Domain.DATABASE,
            ('pattern', 'learn', 'training'): Domain.PATTERNS,
            ('schedule', 'time', 'cron', 'delay'): Domain.TIME,
            ('optimize', 'compile', 'performance'): Domain.PERFORMANCE,
            ('cache', 'cached', 'memoize'): Domain.CACHE,
            ('health', 'status', 'monitor'): Domain.HEALTH,
        }
        
        for keywords, domain in keyword_domains.items():
            if any(keyword in content for keyword in keywords):
                return domain
                
        return None
        
    def get_god_domains(self, god_name: str) -> List[Domain]:
        """Get all domains a god is responsible for"""
        domains = []
        for domain, rule in self.routing_table.items():
            if rule.primary_god == god_name:
                domains.append(domain)
            elif rule.fallback_gods and god_name in rule.fallback_gods:
                domains.append(domain)  # Include fallback responsibilities
        return domains
        
    def get_domain_info(self, domain: Domain) -> RoutingRule:
        """Get information about a domain"""
        return self.routing_table.get(domain)
        
    def add_custom_route(self, request_type: str, domain: Domain):
        """Add a custom request type to domain mapping"""
        self.request_type_mapping[request_type] = domain
        self.logger.info(f"Added custom route: {request_type} -> {domain.value}")

class StorageRouter:
    """
    Intelligent storage routing decisions.
    Determines whether data should be cached, stored permanently, or rejected.
    Now with integrated validation.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def route_storage_request(self, intent: str, data: Dict[str, Any], sender: Optional[str] = None) -> Dict[str, Any]:
        """
        Route storage requests intelligently with validation.
        
        Args:
            intent: The intent (store, retrieve, etc.)
            data: The data to process
            sender: Optional sender for validation
            
        Returns:
            Routing decision with target and additional instructions
        """
        # Validate storage request if sender provided
        if sender:
            validation_request = {
                'type': f'storage_{intent}',
                'intent': intent,
                'data': data
            }
            validation_result = security_validator.validate_request(validation_request, sender)
            if not validation_result.valid:
                return {
                    'target': None, 
                    'error': f'Validation failed: {validation_result.reason}',
                    'validation_failed': True
                }
            # Use sanitized data
            if validation_result.sanitized_data:
                data = validation_result.sanitized_data.get('data', data)
        
        if intent == 'store':
            return self._route_store_request(data)
        elif intent == 'retrieve':
            return self._route_retrieve_request(data)
        elif intent == 'query':
            return self._route_query_request(data)
        elif intent == 'learn':
            return self._route_learn_request(data)
        else:
            return {'target': None, 'error': f'Unknown storage intent: {intent}'}
    
    def _route_store_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Determine where to store data"""
        name = data.get('name', '')
        value = data.get('value')
        metadata = data.get('metadata', {})
        data_type = metadata.get('type', 'variable')
        
        # Temporary calculations (start with underscore)
        if name.startswith('_'):
            return {
                'target': 'lightning',
                'action': 'cache',
                'ttl': 3600  # 1 hour TTL
            }
        
        # Functions always go to permanent storage
        if data_type == 'function':
            return {
                'target': 'cronos',
                'action': 'store_function',
                'validate': True
            }
        
        # Patterns need validation first
        if data_type == 'pattern':
            return {
                'targets': ['athena', 'cronos'],
                'action': 'validate_and_store',
                'cache': True  # Also cache in Lightning
            }
        
        # Session data goes to cache
        if 'session' in name or metadata.get('session_id'):
            return {
                'target': 'lightning',
                'action': 'session_cache',
                'ttl': 7200  # 2 hour TTL
            }
        
        # Large data should be evaluated
        if self._is_large_data(value):
            return {
                'target': 'lightning',
                'action': 'cache',
                'compress': True
            }
        
        # Default: permanent storage with cache
        return {
            'targets': ['cronos', 'lightning'],
            'action': 'store_and_cache'
        }
    
    def _route_retrieve_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Determine where to retrieve data from"""
        name = data.get('name', '')
        
        # Check cache first for performance
        return {
            'targets': ['lightning', 'cronos'],
            'action': 'retrieve_cascade',
            'cache_on_miss': True
        }
    
    def _route_query_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Route query requests"""
        query_type = data.get('query_type', '')
        
        if query_type == 'list_functions':
            return {
                'target': 'cronos',
                'action': 'query_functions'
            }
        elif query_type in ['statistics', 'metrics']:
            return {
                'targets': ['lightning', 'cronos'],
                'action': 'aggregate_stats'
            }
        else:
            return {
                'target': 'cronos',
                'action': 'general_query'
            }
    
    def _route_learn_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Route learning requests"""
        pattern_type = data.get('pattern_type', '')
        
        return {
            'targets': ['athena', 'cronos'],
            'action': 'learn_and_store',
            'validate': True,
            'cache': True
        }
    
    def _is_large_data(self, value: Any) -> bool:
        """Check if data is considered large"""
        import sys
        try:
            size = sys.getsizeof(value)
            return size > 1024 * 10  # 10KB threshold
        except:
            return False
    
    def _is_temporary(self, data: Dict[str, Any]) -> bool:
        """Check if data is temporary"""
        name = data.get('name', '')
        metadata = data.get('metadata', {})
        
        return (
            name.startswith('_') or
            name.startswith('tmp_') or
            metadata.get('temporary', False) or
            'temp' in name.lower()
        )


# Singleton instances
olympus = Olympus()
storage_router = StorageRouter()