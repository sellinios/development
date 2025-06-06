from typing import Any, Dict, List, Optional
import logging
import json
from .zeus_ermis_interface import ZeusErmisInterface


class ZeusRuntime:
    """
    Runtime environment for Zeus language execution.
    Manages variables, functions, scopes, and communicates through Ermis.
    Olympus decides where data is stored (cache, database, etc.)
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Unified interface - Zeus only talks to Ermis
        self.ermis = ZeusErmisInterface()

        # Scope stack (list of dictionaries)
        self.scopes = [{}]  # Global scope

        # User-defined functions (in-memory cache)
        self.functions = {}

        # Athena brain reference (will be set by interpreter)
        self.athena_brain = None
        
        # Knowledge base reference (will be set when Athena is ready)
        self.knowledge = None

        # Load functions from storage
        self._load_functions()

        # Track if patterns have been bootstrapped
        self._patterns_bootstrapped = False

        self.logger.info("Zeus runtime initialized")

    def set_athena_interface(self, interface):
        """Set reference to Athena interface for AI operations through Ermis."""
        self.athena_interface = interface
        
    def set_athena_components(self, brain_coordinator, knowledge_base):
        """Set Athena brain and knowledge base references."""
        self.athena_brain = brain_coordinator
        self.knowledge = knowledge_base
        
        # Don't auto-bootstrap, let user run .bootcamp if they want
        # self.bootstrap_patterns()

    def push_scope(self):
        """Push a new scope onto the stack."""
        self.scopes.append({})

    def pop_scope(self):
        """Pop the current scope from the stack."""
        if len(self.scopes) > 1:
            self.scopes.pop()
        else:
            raise RuntimeError("Cannot pop global scope")

    def get_variable(self, name: str) -> Any:
        """Get variable value, checking scopes from innermost to outermost."""
        # Check local scopes first
        for scope in reversed(self.scopes):
            if name in scope:
                return scope[name]

        # Check storage through Ermis
        value = self.ermis.retrieve(name)
        if value is not None:
            # Cache in global scope for performance
            self.scopes[0][name] = value
            return value

        raise NameError(f"Variable '{name}' is not defined")

    def has_variable(self, name: str) -> bool:
        """Check if variable exists in any scope."""
        # Check local scopes first
        for scope in reversed(self.scopes):
            if name in scope:
                return True

        # Check storage through Ermis
        value = self.ermis.retrieve(name)
        return value is not None

    def set_variable(self, name: str, value: Any):
        """Set variable in current scope and persist to knowledge base."""
        # Set in current scope
        self.scopes[-1][name] = value

        # Persist through Ermis (only if in global scope)
        if len(self.scopes) == 1:
            self.ermis.store(name, value, {'type': 'variable'})

    def define_function(self, name: str, definition: Dict[str, Any]):
        """Define a user function."""
        self.functions[name] = definition

        # Store through Ermis
        if "parameters" in definition and "body" in definition:
            body_str = (
                json.dumps(definition["body"])
                if isinstance(definition["body"], list)
                else str(definition["body"])
            )
            self.ermis.store(name, {
                'parameters': definition["parameters"],
                'body': body_str,
                'return_type': definition.get("return_type")
            }, {'type': 'function'})

        self.logger.info(f"Defined function: {name}")

    def get_function(self, name: str) -> Optional[Dict[str, Any]]:
        """Get function definition."""
        return self.functions.get(name)

    def apply_pattern(self, pattern_name: str, arguments: Dict[str, Any]) -> Any:
        """Apply a learned pattern."""
        if not self.athena_brain:
            raise RuntimeError("Athena brain not initialized")

        return self.athena_brain.pattern_learner.apply_pattern(pattern_name, arguments)

    def execute_athena_command(self, command: str) -> Any:
        """Execute an Athena AI command."""
        if not self.athena_brain:
            raise RuntimeError("Athena brain not initialized")

        return self.athena_brain.execute(command)

    def teach_pattern(self, definition: str) -> str:
        """Teach a new pattern to Athena."""
        if not self.athena_brain:
            raise RuntimeError("Athena brain not initialized")

        # Parse pattern definition
        import re

        pattern_match = re.match(
            r"(?:teach:|pattern:)\s*(\w+)\s*\{([^}]+)\}\s*->\s*\{([^}]+)\}(?:\s*:\s*(.+))?",
            definition,
            re.IGNORECASE,
        )

        if not pattern_match:
            return "Invalid pattern syntax"

        name, params, implementation, description = pattern_match.groups()

        # Parse parameters - ensure no extra spaces
        parameters = [p.strip() for p in params.split(",") if p.strip()]

        # print(f"DEBUG: Teaching pattern: {name}")
        # print(f"DEBUG: Parameters string: '{params}'")
        # print(f"DEBUG: Parsed parameters: {parameters}")
        # print(f"DEBUG: Implementation: '{implementation}'")

        # Learn the pattern
        self.athena_brain.pattern_learner.learn_pattern(
            name, f"{name}({params})", parameters, implementation
        )

        # Store in knowledge base
        pattern = {
            "name": name,
            "template": f"{name}({params})",
            "parameters": parameters,
            "implementation": implementation,
        }
        self.knowledge.store_pattern(pattern)

        return f"Learned pattern: {name}"

    def list_variables(self) -> Dict[str, Any]:
        """List all variables in current context."""
        all_vars = {}

        # Collect from all scopes
        for scope in self.scopes:
            all_vars.update(scope)

        return all_vars

    def list_functions(self) -> List[str]:
        """List all defined functions."""
        return list(self.functions.keys())

    def clear_variables(self):
        """Clear all variables (except in global scope)."""
        if len(self.scopes) > 1:
            self.scopes[-1].clear()

    def get_statistics(self) -> Dict[str, Any]:
        """Get runtime statistics."""
        return {
            "scope_depth": len(self.scopes),
            "variables": len(self.list_variables()),
            "functions": len(self.functions),
            # Request statistics through Ermis if needed
            # "knowledge_stats": self.ermis.request('query', {'query_type': 'statistics'}),
        }
    
    def execute(self, code: str) -> Any:
        """
        Execute Zeus code in this runtime.
        This method provides compatibility with test expectations.
        """
        # Import here to avoid circular dependency
        from .zeus_parser import ZeusParser
        from .zeus_evaluator import ZeusEvaluator
        
        parser = ZeusParser()
        evaluator = ZeusEvaluator()
        
        # Parse the code
        parsed = parser.parse(code)
        if parsed.get("error"):
            raise RuntimeError(f"Parse error: {parsed['error']}")
        
        # Evaluate it
        return evaluator.evaluate_ast(parsed, self)

    def _load_functions(self):
        """Load functions from storage through Ermis."""
        try:
            # Query for all functions through Ermis
            functions = self.ermis.query('list_functions', {})
            if functions:
                for func_data in functions:
                    name = func_data.get('name')
                    if name and func_data.get('body'):
                        # Reconstruct function definition
                        body = (
                            json.loads(func_data["body"])
                            if func_data["body"].startswith("[")
                            else func_data["body"]
                        )
                        self.functions[name] = {
                            "name": name,
                            "parameters": func_data.get("parameters", []),
                            "body": body,
                            "type": "function_definition",
                        }

            self.logger.info(f"Loaded {len(self.functions)} functions from storage")
        except Exception as e:
            self.logger.warning(f"Failed to load functions: {e}")
    
    def bootstrap_patterns(self):
        """Bootstrap teaching patterns if not already done."""
        if self._patterns_bootstrapped:
            return
            
        try:
            # Only bootstrap if we have both knowledge base and athena brain
            if self.knowledge and self.athena_brain:
                from core.bootstrap.teaching_patterns_bootstrap import bootstrap_teaching_patterns
                result = bootstrap_teaching_patterns(self)
                self._patterns_bootstrapped = True
                self.logger.info(f"Pattern bootstrap complete: {result['success']}/{result['total']} patterns")
            else:
                self.logger.debug("Delaying pattern bootstrap until Athena is ready")
                
        except Exception as e:
            self.logger.warning(f"Failed to bootstrap patterns: {e}")
