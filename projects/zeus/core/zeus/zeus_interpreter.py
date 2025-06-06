import ast
import re
from typing import Any, Dict, List, Optional, Union
import logging
from .zeus_parser import ZeusParser
from .zeus_evaluator import ZeusEvaluator
from .zeus_runtime import ZeusRuntime
from .zeus_athena_interface import AthenaInterface


class ZeusInterpreter:
    """
    Main interpreter that coordinates between Zeus language and Athena through Ermis.
    Handles both traditional code execution and natural language processing.
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Initialize components
        self.athena = AthenaInterface()  # Interface to Athena through Ermis
        self.parser = ZeusParser()
        self.evaluator = ZeusEvaluator()
        self.runtime = ZeusRuntime()  # Uses Cronos for knowledge
        
        # Set athena interface reference in runtime
        self.runtime.set_athena_interface(self.athena)
        
        # Initialize pattern support
        self._initialize_pattern_support()

        # Session state
        self.session_id = self._generate_session_id()
        self.context = {}
        self.last_result = None  # Track last computation result
        self.conversation_history = []  # Track conversation for context

        # Create session through Ermis
        self.runtime.ermis.start_session({'session_id': self.session_id})
        
        # Cache for compiled/parsed code
        self.cache = {}
        self._cache_size_limit = 100

        self.logger.info(f"Zeus interpreter initialized (session: {self.session_id})")

    def execute(self, code: str) -> Any:
        """
        Execute Zeus code or natural language commands.
        """
        import time

        start_time = time.time()

        try:
            # Strip and normalize input
            original_code = code.strip()
            code = original_code

            if not code:
                return None

            # Add to conversation history
            self.conversation_history.append({"type": "input", "content": original_code})

            # Handle context-aware commands
            code = self._resolve_context(code)

            # Handle "expression = ?" pattern
            if code.endswith(" = ?"):
                # Remove the " = ?" and evaluate the expression
                code = code[:-4].strip()

            # Check if it's a natural language command
            if self._is_natural_language(code):
                result = self._execute_natural_language(code)
            # Check if it's a pattern teaching command
            elif self._is_pattern_teaching(code):
                result = self._teach_pattern(code)
            # Otherwise, parse and execute as Zeus code
            else:
                result = self._execute_zeus_code(code)

            # Store result for context
            if result is not None:
                self.last_result = result
                self.conversation_history.append({"type": "output", "content": result})

                # Record execution in database
                import time

                execution_time = time.time() - start_time if "start_time" in locals() else None
                # Record execution through runtime's Cronos interface
                execution_data = {
                    'code': original_code,
                    'result': str(result),
                    'execution_type': self._determine_execution_type(code),
                    'success': True,
                    'execution_time_ms': execution_time * 1000 if execution_time else None,
                }
                self.runtime.set_variable(f'_exec_{len(self.conversation_history)}', execution_data)

                # Store context
                self.runtime.set_variable("last_result", result)

            # Update session activity
            # Session activity is automatically tracked by Cronos

            return result

        except Exception as e:
            self.logger.error(f"Execution error: {e}")
            return f"Error: {str(e)}"

    def _is_natural_language(self, code: str) -> bool:
        """Check if input is natural language command."""
        # Check for explicit Athena commands
        if code.lower().startswith(("athena:", "athena ", "ask:", "tell me")):
            return True

        # Don't treat simple arithmetic or pattern calls as natural language
        # Check if it's a pattern call (identifier followed by numbers/identifiers)
        import re

        pattern_call = re.match(r"^\w+\s+[\d\w,\s]+$", code.strip())
        if pattern_call:
            return False

        # Check if it's arithmetic expression
        arithmetic_pattern = re.match(r"^[\d\s\+\-\*\/\(\)\.]+$", code.strip())
        if arithmetic_pattern:
            return False

        # Check for question-like natural language
        if any(
            word in code.lower() for word in ["what", "how", "why", "when", "where", "who", "which"]
        ):
            return True

        # Otherwise, it's not natural language
        return False

    def _is_pattern_teaching(self, code: str) -> bool:
        """Check if input is a pattern teaching command."""
        return code.lower().startswith("teach:") or "pattern:" in code.lower()

    def _execute_natural_language(self, command: str) -> Any:
        """Execute natural language command using Athena."""
        # Remove command prefixes
        prefixes = ["athena:", "athena ", "ask:", "tell me"]
        for prefix in prefixes:
            if command.lower().startswith(prefix):
                command = command[len(prefix) :].strip()
                break

        # Create context with runtime and pattern info
        context = {
            "variables": self.context,
            "patterns": self.athena.get_patterns(),
            "_runtime": self.runtime
        }
        
        # Use Athena to understand and execute
        result = self.athena.execute(command, context)

        # Store conversation in knowledge base if method exists
        # Store conversation in runtime
        conversation_entry = {'command': command, 'result': str(result)}
        self.runtime.set_variable(f'_conversation_{len(self.conversation_history)}', conversation_entry)

        return result

    def _teach_pattern(self, command: str) -> str:
        """Teach a new pattern to the system."""
        # Parse pattern definition
        pattern_match = re.match(
            r"teach:\s*(\w+)\s*\{([^}]+)\}\s*->\s*(.+?)(?:\s*:\s*(.+))?$",
            command,
            re.IGNORECASE,
        )

        if not pattern_match:
            return "Invalid pattern syntax. Use: teach: name {params} -> {implementation} : description"

        name, params, implementation, description = pattern_match.groups()

        # Parse parameters
        parameters = [p.strip() for p in params.split(",")]

        # Clean implementation - keep the expression as is, pattern learner will handle substitution
        implementation = implementation.strip()

        # Create pattern
        pattern = {
            "name": name,
            "template": f"{name}({params})",
            "parameters": parameters,
            "implementation": implementation,
            "description": description or f"Pattern {name}",
        }

        # Learn the pattern
        self.athena.learn_pattern(
            pattern["template"], implementation, {"name": name, "parameters": parameters}
        )

        # Store pattern through Ermis
        self.runtime.ermis.learn('pattern', {
            'name': name,
            'pattern': pattern
        })

        return f"Learned pattern: {name}"

    def _execute_zeus_code(self, code: str) -> Any:
        """Execute traditional Zeus code."""
        # Parse the code
        parsed = self.parser.parse(code)

        if parsed.get("error"):
            return f"Parse error: {parsed['error']}"

        # Evaluate the parsed code
        result = self.evaluator.evaluate_ast(parsed, self.runtime)

        # Update context
        if parsed.get("type") == "assignment":
            var_name = parsed.get("variable")
            if var_name:
                self.context[var_name] = result
                # Store in persistent knowledge base through runtime
                self.runtime.set_variable(var_name, result)

        # Send pattern information to Athena for learning
        self._notify_athena_about_pattern(code, parsed, result)

        return result

    def _generate_session_id(self) -> str:
        """Generate unique session ID."""
        import uuid

        return str(uuid.uuid4())

    def get_variable(self, name: str) -> Any:
        """Get variable value from context or knowledge base."""
        # Check local context first
        if name in self.context:
            return self.context[name]

        # Check knowledge base
        # Get variable through runtime
        var_data = self.runtime.get_variable(name)
        if var_data:
            value, var_type = var_data
            self.context[name] = value  # Cache locally
            return value

        raise NameError(f"Variable '{name}' not found")

    def set_variable(self, name: str, value: Any):
        """Set variable in context and knowledge base."""
        self.context[name] = value
        self.runtime.set_variable(name, value)

    def list_variables(self) -> Dict[str, Any]:
        """List all variables in current context."""
        return self.context.copy()

    def list_patterns(self) -> List[str]:
        """List all learned patterns."""
        patterns = self.athena.get_patterns()
        return list(patterns.keys())

    def explain_last_execution(self) -> str:
        """Explain the reasoning behind the last execution."""
        # This would retrieve the last reasoning from Athena
        return "Explanation of last execution (to be implemented)"

    def correct_last_output(self, correction: str):
        """Correct the last output for learning."""
        # Store correction in knowledge base
        # This helps Athena learn from mistakes
        self.logger.info(f"Correction received: {correction}")

    def _resolve_context(self, code: str) -> str:
        """Resolve contextual references like 'it', 'that', 'last result'."""
        import re

        # Handle "it" or "that" references
        if re.search(r"\b(it|that)\b", code, re.IGNORECASE):
            if self.last_result is not None:
                # Replace "it" or "that" with the last result
                code = re.sub(r"\b(it|that)\b", str(self.last_result), code, flags=re.IGNORECASE)

        # Handle "last result" or "previous result"
        if re.search(r"\b(last|previous)\s+result\b", code, re.IGNORECASE):
            if self.last_result is not None:
                code = re.sub(
                    r"\b(last|previous)\s+result\b",
                    str(self.last_result),
                    code,
                    flags=re.IGNORECASE,
                )

        # Handle "last" or "previous" without "result"
        if re.search(r"\b(last|previous)\b", code, re.IGNORECASE) and "result" not in code:
            if self.last_result is not None:
                code = re.sub(
                    r"\b(last|previous)\b", str(self.last_result), code, flags=re.IGNORECASE
                )

        return code

    def _determine_execution_type(self, code: str) -> str:
        """Determine the type of execution for tracking."""
        if self._is_pattern_teaching(code):
            return "pattern_definition"
        elif "=" in code and not "==" in code:
            return "assignment"
        elif any(op in code for op in ["+", "-", "*", "/", "%"]):
            return "arithmetic"
        elif code.lower().startswith("athena:"):
            return "natural_language"
        elif any(code.startswith(p) for p in self.list_patterns()):
            return "pattern_call"
        else:
            return "general"
            
    def _notify_athena_about_pattern(self, code: str, parsed_ast: Dict[str, Any], result: Any):
        """Notify Athena about executed code for pattern learning"""
        try:
            # Send pattern learning request to Athena
            message = {
                'type': 'learn_from_code',
                'code': code,
                'parsed_ast': parsed_ast,
                'result': result,
                'context': {
                    'variables': self.context,
                    'session_id': self.session_id
                }
            }
            
            # Send to Athena directly using the sender
            from .ermis_sender import zeus_sender
            zeus_sender.send_to_athena(message, 'learn_from_code')
        except Exception as e:
            self.logger.debug(f"Failed to notify Athena about pattern: {e}")

    def save_session(self, path: str):
        """Save current session state."""
        import json

        session_data = {
            "session_id": self.session_id,
            "context": self.context,
            "patterns": self.list_patterns(),
        }
        with open(path, "w") as f:
            json.dump(session_data, f, indent=2)

    def load_session(self, path: str):
        """Load session state."""
        import json

        with open(path, "r") as f:
            session_data = json.load(f)

        self.session_id = session_data.get("session_id", self.session_id)
        self.context = session_data.get("context", {})

        # Restore variables to knowledge base through runtime
        for name, value in self.context.items():
            self.runtime.set_variable(name, value)
    
    def evaluate(self, code: str) -> Any:
        """
        Evaluate Zeus code (alias for execute for compatibility).
        """
        return self.execute(code)
    
    def analyze_code(self, code: str) -> Dict[str, Any]:
        """
        Analyze code without executing it.
        Returns analysis results including AST, detected patterns, and potential issues.
        """
        analysis = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "ast": None,
            "type": None,
            "variables_used": [],
            "functions_called": []
        }
        
        try:
            # Strip and normalize input
            code = code.strip()
            if not code:
                analysis["valid"] = False
                analysis["errors"].append("Empty code")
                return analysis
            
            # Determine code type
            if self._is_natural_language(code):
                analysis["type"] = "natural_language"
            elif self._is_pattern_teaching(code):
                analysis["type"] = "pattern_teaching"
            else:
                analysis["type"] = "zeus_code"
                
                # Parse the code
                parsed = self.parser.parse(code)
                analysis["ast"] = parsed
                
                if parsed.get("error"):
                    analysis["valid"] = False
                    analysis["errors"].append(f"Parse error: {parsed['error']}")
                else:
                    # Extract information from AST
                    self._analyze_ast(parsed, analysis)
            
            return analysis
            
        except Exception as e:
            analysis["valid"] = False
            analysis["errors"].append(str(e))
            return analysis
    
    def _analyze_ast(self, node: Dict[str, Any], analysis: Dict[str, Any]):
        """Recursively analyze AST node to extract information."""
        if not isinstance(node, dict):
            return
            
        node_type = node.get("type")
        
        if node_type == "identifier":
            name = node.get("name")
            if name and name not in analysis["variables_used"]:
                analysis["variables_used"].append(name)
        
        elif node_type == "function_call":
            func_name = node.get("name")
            if func_name and func_name not in analysis["functions_called"]:
                analysis["functions_called"].append(func_name)
            # Analyze arguments
            for arg in node.get("arguments", []):
                self._analyze_ast(arg, analysis)
        
        elif node_type == "assignment":
            var_name = node.get("variable")
            if var_name and var_name not in analysis["variables_used"]:
                analysis["variables_used"].append(var_name)
            # Analyze value expression
            value_node = node.get("expression") or node.get("value")
            if value_node:
                self._analyze_ast(value_node, analysis)
        
        # Recursively analyze child nodes
        for key, value in node.items():
            if key in ["left", "right", "operand", "expression", "condition", 
                      "then_branch", "else_branch", "body", "elements", "items"]:
                if isinstance(value, dict):
                    self._analyze_ast(value, analysis)
                elif isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict):
                            self._analyze_ast(item, analysis)
    
    def evaluate_expression(self, expression: str) -> Any:
        """
        Evaluate a single expression and return the result.
        Unlike execute(), this expects a pure expression without side effects.
        """
        # Check cache first
        cache_key = f"expr:{expression}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Parse as an expression
            parsed = self.parser.parse(expression)
            
            if parsed.get("error"):
                raise ValueError(f"Parse error: {parsed['error']}")
            
            # Evaluate without recording in history or database
            result = self.evaluator.evaluate_ast(parsed, self.runtime)
            
            # Cache the result
            if len(self.cache) < self._cache_size_limit:
                self.cache[cache_key] = result
            
            return result
            
        except Exception as e:
            raise ValueError(f"Expression evaluation error: {str(e)}")
    
    def validate_syntax(self, code: str) -> Dict[str, Any]:
        """
        Validate syntax without executing the code.
        Returns validation result with any syntax errors.
        """
        validation = {
            "valid": True,
            "errors": [],
            "warnings": []
        }
        
        try:
            # Strip and normalize
            code = code.strip()
            if not code:
                validation["valid"] = False
                validation["errors"].append("Empty code")
                return validation
            
            # Check if it's Zeus code (not natural language)
            if not self._is_natural_language(code) and not self._is_pattern_teaching(code):
                # Parse the code
                parsed = self.parser.parse(code)
                
                if parsed.get("error"):
                    validation["valid"] = False
                    validation["errors"].append(f"Syntax error: {parsed['error']}")
                else:
                    # Additional validation checks
                    self._validate_ast(parsed, validation)
            
            return validation
            
        except Exception as e:
            validation["valid"] = False
            validation["errors"].append(f"Validation error: {str(e)}")
            return validation
    
    def _validate_ast(self, node: Dict[str, Any], validation: Dict[str, Any]):
        """Perform additional validation on AST."""
        if not isinstance(node, dict):
            return
            
        node_type = node.get("type")
        
        # Check for common issues
        if node_type == "binary_op":
            op = node.get("operator")
            if op == "/" or op == "//":
                # Check for potential division by zero
                right = node.get("right", {})
                if right.get("type") == "literal" and right.get("value") == 0:
                    validation["warnings"].append("Potential division by zero")
        
        # Recursively validate child nodes
        for key, value in node.items():
            if isinstance(value, dict):
                self._validate_ast(value, validation)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        self._validate_ast(item, validation)
    
    def _initialize_pattern_support(self):
        """Initialize pattern support by creating a minimal pattern infrastructure."""
        try:
            # Create a minimal brain coordinator and pattern learner
            from core.athena.athena_coordinator import BrainCoordinator
            from core.athena.athena_knowledge_unified import UnifiedKnowledgeBase
            from core.zeus.ermis_sender import zeus_sender
            
            # Create knowledge base
            knowledge = UnifiedKnowledgeBase(zeus_sender)
            
            # Create brain coordinator
            brain = BrainCoordinator(knowledge)
            
            # Set it in the runtime
            self.runtime.set_athena_components(brain, knowledge)
            
            self.logger.info("Pattern support initialized")
            
        except Exception as e:
            self.logger.warning(f"Failed to initialize pattern support: {e}")
