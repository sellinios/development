"""
Ermis Security & Validation Layer
Ensures data integrity, validates requests, and enforces security policies
"""

import hashlib
import time
import re
import logging
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass
from enum import Enum
import json


class SecurityLevel(Enum):
    """Security levels for different operations"""
    PUBLIC = "public"          # No restrictions
    RESTRICTED = "restricted"  # Requires validation
    SENSITIVE = "sensitive"    # Requires additional checks
    CRITICAL = "critical"      # Requires full validation and audit


class ValidationResult:
    """Result of validation check"""
    def __init__(self, valid: bool, reason: str = "", sanitized_data: Any = None):
        self.valid = valid
        self.reason = reason
        self.sanitized_data = sanitized_data


@dataclass
class SecurityPolicy:
    """Security policy for a specific operation"""
    operation: str
    level: SecurityLevel
    allowed_gods: Set[str]
    rate_limit: int  # requests per minute
    size_limit: int  # bytes
    requires_audit: bool = False
    custom_validators: List[str] = None


class SecurityValidator:
    """
    Core security and validation component.
    Validates all requests before they are processed.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.WARNING)  # Only log warnings and above
        self.policies = self._initialize_policies()
        self.rate_limiter = RateLimiter()
        self.audit_log = []
        
        # Dangerous patterns that should be blocked
        self.dangerous_patterns = [
            r'__import__',
            r'exec\s*\(',
            r'eval\s*\(',
            r'compile\s*\(',
            r'globals\s*\(',
            r'locals\s*\(',
            r'__builtins__',
            r'__class__',
            r'__subclasses__',
            r'__code__',
            r'os\.',
            r'subprocess\.',
            r'open\s*\(',
            r'file\s*\(',
        ]
        
        # Allowed characters for identifiers
        self.identifier_pattern = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')
        
        # Maximum sizes
        self.MAX_STRING_LENGTH = 10000
        self.MAX_LIST_SIZE = 1000
        self.MAX_DICT_SIZE = 500
        self.MAX_RECURSION_DEPTH = 10
        
    def _initialize_policies(self) -> Dict[str, SecurityPolicy]:
        """Initialize security policies for different operations"""
        return {
            # Code execution - most restrictive
            'execute_code': SecurityPolicy(
                'execute_code',
                SecurityLevel.CRITICAL,
                {'zeus'},
                rate_limit=60,
                size_limit=10240,
                requires_audit=True,
                custom_validators=['validate_code_safety']
            ),
            
            # Storage operations
            'store_variable': SecurityPolicy(
                'store_variable',
                SecurityLevel.RESTRICTED,
                {'zeus', 'athena', 'cronos', 'lightning'},
                rate_limit=100,
                size_limit=102400
            ),
            
            'store_function': SecurityPolicy(
                'store_function',
                SecurityLevel.SENSITIVE,
                {'zeus', 'athena'},
                rate_limit=30,
                size_limit=10240,
                requires_audit=True,
                custom_validators=['validate_function_definition']
            ),
            
            # Pattern operations
            'store_pattern': SecurityPolicy(
                'store_pattern',
                SecurityLevel.SENSITIVE,
                {'athena', 'cronos'},
                rate_limit=50,
                size_limit=5120,
                custom_validators=['validate_pattern_structure']
            ),
            
            # Generic storage operations (Zeus unified interface)
            'store': SecurityPolicy(
                'store',
                SecurityLevel.RESTRICTED,
                {'zeus', 'athena', 'cronos', 'lightning'},
                rate_limit=100,
                size_limit=102400
            ),
            
            # Storage router operations (with storage_ prefix)
            'storage_store': SecurityPolicy(
                'storage_store',
                SecurityLevel.RESTRICTED,
                {'zeus', 'athena', 'cronos', 'lightning'},
                rate_limit=100,
                size_limit=102400
            ),
            
            'storage_retrieve': SecurityPolicy(
                'storage_retrieve',
                SecurityLevel.PUBLIC,
                {'zeus', 'athena', 'cronos', 'lightning'},
                rate_limit=500,
                size_limit=1024
            ),
            
            'storage_query': SecurityPolicy(
                'storage_query',
                SecurityLevel.PUBLIC,
                {'zeus', 'athena', 'cronos', 'lightning'},
                rate_limit=500,
                size_limit=1024
            ),
            
            'storage_learn': SecurityPolicy(
                'storage_learn',
                SecurityLevel.RESTRICTED,
                {'zeus', 'athena', 'cronos'},
                rate_limit=50,
                size_limit=5120
            ),
            
            # Pattern learning operations
            'learn_pattern': SecurityPolicy(
                'learn_pattern',
                SecurityLevel.RESTRICTED,
                {'zeus', 'athena'},
                rate_limit=50,
                size_limit=10240
            ),
            
            # Retrieval operations - less restrictive
            'retrieve': SecurityPolicy(
                'retrieve',
                SecurityLevel.PUBLIC,
                {'zeus', 'athena', 'cronos', 'lightning'},
                rate_limit=1000,
                size_limit=1024
            ),
            
            # Query operations
            'query': SecurityPolicy(
                'query',
                SecurityLevel.PUBLIC,
                {'zeus', 'athena', 'cronos', 'lightning'},
                rate_limit=500,
                size_limit=1024
            ),
            
            # System operations
            'broadcast': SecurityPolicy(
                'broadcast',
                SecurityLevel.SENSITIVE,
                {'ermis', 'orchestrator'},
                rate_limit=10,
                size_limit=1024,
                requires_audit=True
            ),
            
            # Health checks
            'health_check': SecurityPolicy(
                'health_check',
                SecurityLevel.PUBLIC,
                {'zeus', 'athena', 'cronos', 'lightning', 'ermis', 'orchestrator'},
                rate_limit=100,
                size_limit=256
            ),
            
            # NLP operations
            'nlp_request': SecurityPolicy(
                'nlp_request',
                SecurityLevel.RESTRICTED,
                {'zeus', 'athena', 'cronos'},
                rate_limit=100,
                size_limit=10240
            ),
        }
    
    def validate_request(self, request: Dict[str, Any], sender: str) -> ValidationResult:
        """
        Validate a request before processing.
        
        Args:
            request: The request to validate
            sender: The god sending the request
            
        Returns:
            ValidationResult with validation status and sanitized data
        """
        try:
            # Extract request details
            request_type = request.get('type', '')
            intent = request.get('intent', '')
            operation = request_type or intent
            
            # Get security policy
            policy = self._get_policy(operation)
            
            # Basic validation
            if not self._validate_sender(sender, policy):
                return ValidationResult(False, f"Sender {sender} not authorized for {operation}")
            
            # Rate limiting
            if not self.rate_limiter.check_rate(sender, operation, policy.rate_limit):
                return ValidationResult(False, f"Rate limit exceeded for {operation}")
            
            # Size validation
            if not self._validate_size(request, policy.size_limit):
                return ValidationResult(False, f"Request size exceeds limit of {policy.size_limit} bytes")
            
            # Data validation
            sanitized_data = self._sanitize_data(request.get('data', {}))
            if sanitized_data is None:
                return ValidationResult(False, "Invalid data structure")
            
            # Custom validators - use original data since code might be in there
            if policy.custom_validators:
                for validator_name in policy.custom_validators:
                    validator_result = self._run_custom_validator(validator_name, request.get('data', {}))
                    if not validator_result.valid:
                        return validator_result
            
            # Audit if required
            if policy.requires_audit:
                self._audit_request(sender, operation, request)
            
            # Return sanitized request
            sanitized_request = request.copy()
            sanitized_request['data'] = sanitized_data
            
            return ValidationResult(True, "Request validated", sanitized_request)
            
        except Exception as e:
            self.logger.error(f"Validation error: {e}")
            return ValidationResult(False, f"Validation error: {str(e)}")
    
    def _get_policy(self, operation: str) -> SecurityPolicy:
        """Get security policy for operation"""
        # Try exact match first
        if operation in self.policies:
            return self.policies[operation]
        
        # Try to find partial match
        for policy_op, policy in self.policies.items():
            if policy_op in operation or operation in policy_op:
                return policy
        
        # Default restrictive policy
        return SecurityPolicy(
            operation,
            SecurityLevel.RESTRICTED,
            set(),
            rate_limit=10,
            size_limit=1024
        )
    
    def _validate_sender(self, sender: str, policy: SecurityPolicy) -> bool:
        """Validate sender is allowed for operation"""
        return sender in policy.allowed_gods
    
    def _validate_size(self, data: Any, limit: int) -> bool:
        """Validate data size"""
        import sys
        try:
            size = sys.getsizeof(json.dumps(data) if isinstance(data, dict) else str(data))
            return size <= limit
        except:
            return False
    
    def _sanitize_data(self, data: Any, depth: int = 0) -> Any:
        """
        Sanitize data recursively.
        Returns None if data is dangerous.
        """
        if depth > self.MAX_RECURSION_DEPTH:
            return None
            
        if isinstance(data, str):
            return self._sanitize_string(data)
        elif isinstance(data, (int, float, bool)):
            return data
        elif isinstance(data, list):
            if len(data) > self.MAX_LIST_SIZE:
                return None
            return [self._sanitize_data(item, depth + 1) for item in data]
        elif isinstance(data, dict):
            if len(data) > self.MAX_DICT_SIZE:
                return None
            sanitized = {}
            for key, value in data.items():
                if not isinstance(key, str) or not self._is_safe_key(key):
                    continue
                sanitized_value = self._sanitize_data(value, depth + 1)
                if sanitized_value is not None:
                    sanitized[key] = sanitized_value
            return sanitized
        elif data is None:
            return None
        else:
            # Unknown type - convert to string for safety
            return str(data)[:self.MAX_STRING_LENGTH]
    
    def _sanitize_string(self, text: str) -> Optional[str]:
        """Sanitize string data"""
        if len(text) > self.MAX_STRING_LENGTH:
            return text[:self.MAX_STRING_LENGTH]
        
        # Check for dangerous patterns
        for pattern in self.dangerous_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                self.logger.warning(f"Blocked dangerous pattern: {pattern}")
                return None
                
        return text
    
    def _is_safe_key(self, key: str) -> bool:
        """Check if dictionary key is safe"""
        return (
            isinstance(key, str) and
            len(key) < 100 and
            not key.startswith('__') and
            not any(danger in key for danger in ['exec', 'eval', '__'])
        )
    
    def _run_custom_validator(self, validator_name: str, data: Any) -> ValidationResult:
        """Run custom validator"""
        validators = {
            'validate_code_safety': self._validate_code_safety,
            'validate_function_definition': self._validate_function_definition,
            'validate_pattern_structure': self._validate_pattern_structure,
        }
        
        validator = validators.get(validator_name)
        if validator:
            return validator(data)
        
        return ValidationResult(True, "No validator found")
    
    def _validate_code_safety(self, data: Dict[str, Any]) -> ValidationResult:
        """Validate code is safe to execute"""
        code = data.get('code', '') or data.get('expression', '')
        
        if not isinstance(code, str):
            return ValidationResult(False, "Code must be a string")
        
        # Check for dangerous patterns
        for pattern in self.dangerous_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                return ValidationResult(False, f"Dangerous pattern detected: {pattern}")
        
        # Check for system access attempts
        system_patterns = [
            r'import\s+os',
            r'import\s+sys',
            r'import\s+subprocess',
            r'from\s+os',
            r'from\s+sys',
        ]
        
        for pattern in system_patterns:
            if re.search(pattern, code, re.IGNORECASE):
                return ValidationResult(False, f"System access not allowed")
        
        return ValidationResult(True, "Code validated")
    
    def _validate_function_definition(self, data: Dict[str, Any]) -> ValidationResult:
        """Validate function definition"""
        name = data.get('name', '')
        parameters = data.get('parameters', [])
        body = data.get('body', '')
        
        # Validate name
        if not isinstance(name, str) or not self.identifier_pattern.match(name):
            return ValidationResult(False, "Invalid function name")
        
        # Check for dangerous function names
        if name.startswith('__') or name.endswith('__'):
            return ValidationResult(False, "Function names cannot start or end with double underscores")
        
        # Validate parameters
        if not isinstance(parameters, list):
            return ValidationResult(False, "Parameters must be a list")
        
        for param in parameters:
            if not isinstance(param, str) or not self.identifier_pattern.match(param):
                return ValidationResult(False, f"Invalid parameter name: {param}")
        
        # Validate body
        body_result = self._validate_code_safety({'code': body})
        if not body_result.valid:
            return ValidationResult(False, f"Invalid function body: {body_result.reason}")
        
        return ValidationResult(True, "Function validated")
    
    def _validate_pattern_structure(self, data: Dict[str, Any]) -> ValidationResult:
        """Validate pattern structure"""
        pattern_type = data.get('pattern_type', '')
        pattern_data = data.get('pattern_data', {})
        
        if not pattern_type:
            return ValidationResult(False, "Pattern type required")
        
        if not isinstance(pattern_data, dict):
            return ValidationResult(False, "Pattern data must be a dictionary")
        
        # Validate required fields based on pattern type
        required_fields = {
            'greeting': ['name', 'template'],
            'question': ['name', 'template', 'action'],
            'command': ['name', 'template', 'action'],
            'code_template': ['name', 'template', 'code'],
        }
        
        fields = required_fields.get(pattern_type, ['name', 'template'])
        
        for field in fields:
            if field not in pattern_data:
                return ValidationResult(False, f"Missing required field: {field}")
        
        return ValidationResult(True, "Pattern validated")
    
    def _audit_request(self, sender: str, operation: str, request: Dict[str, Any]):
        """Audit request for security tracking"""
        audit_entry = {
            'timestamp': time.time(),
            'sender': sender,
            'operation': operation,
            'request_id': request.get('request_id', 'unknown'),
            'hash': self._hash_request(request)
        }
        self.audit_log.append(audit_entry)
        
        # Keep only last 1000 entries
        if len(self.audit_log) > 1000:
            self.audit_log = self.audit_log[-1000:]
    
    def _hash_request(self, request: Dict[str, Any]) -> str:
        """Create hash of request for audit trail"""
        try:
            request_str = json.dumps(request, sort_keys=True)
            return hashlib.sha256(request_str.encode()).hexdigest()[:16]
        except:
            return "unhashable"
    
    def get_audit_log(self, sender: Optional[str] = None, operation: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get audit log entries"""
        entries = self.audit_log
        
        if sender:
            entries = [e for e in entries if e['sender'] == sender]
        
        if operation:
            entries = [e for e in entries if e['operation'] == operation]
        
        return entries


class RateLimiter:
    """Rate limiting for security"""
    
    def __init__(self):
        self.requests = {}  # {key: [(timestamp, count)]}
        self.window = 60  # 1 minute window
    
    def check_rate(self, sender: str, operation: str, limit: int) -> bool:
        """Check if rate limit is exceeded"""
        key = f"{sender}:{operation}"
        now = time.time()
        
        # Clean old entries
        if key in self.requests:
            self.requests[key] = [
                (ts, count) for ts, count in self.requests[key]
                if now - ts < self.window
            ]
        else:
            self.requests[key] = []
        
        # Count requests in window
        total = sum(count for ts, count in self.requests[key])
        
        if total >= limit:
            return False
        
        # Add this request
        self.requests[key].append((now, 1))
        return True
    
    def reset(self, sender: Optional[str] = None):
        """Reset rate limiter"""
        if sender:
            keys_to_remove = [k for k in self.requests if k.startswith(f"{sender}:")]
            for key in keys_to_remove:
                del self.requests[key]
        else:
            self.requests.clear()


# Global security validator instance
security_validator = SecurityValidator()