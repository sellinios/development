import operator
from typing import Any, Dict, List, Optional, Union
import logging
import math
from .zeus_exceptions import (
    ZeusRuntimeError,
    ZeusTypeError,
    ZeusValueError,
    ZeusDivisionByZeroError,
    ZeusSyntaxError,
)
from .zeus_runtime import ZeusRuntime


class ZeusEvaluator:
    """
    Evaluates parsed Zeus AST nodes and executes code.
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self._parser = None  # Lazy load parser to avoid circular import

        # Built-in functions
        self.builtins = {
            "print": print,
            "len": len,
            "range": range,
            "sum": sum,
            "max": max,
            "min": min,
            "abs": abs,
            "round": round,
            "int": int,
            "float": float,
            "str": str,
            "list": list,
            "dict": dict,
            "set": set,
            "tuple": tuple,
            "type": type,
            "sqrt": math.sqrt,
            "pow": pow,
            "sin": math.sin,
            "cos": math.cos,
            "tan": math.tan,
            "log": math.log,
            "exp": math.exp,
        }

        # Binary operators
        self.binary_ops = {
            "+": operator.add,
            "-": operator.sub,
            "*": operator.mul,
            "/": operator.truediv,
            "//": operator.floordiv,
            "%": operator.mod,
            "**": operator.pow,
            "==": operator.eq,
            "!=": operator.ne,
            "<": operator.lt,
            ">": operator.gt,
            "<=": operator.le,
            ">=": operator.ge,
            "and": operator.and_,
            "or": operator.or_,
        }

        # Unary operators
        self.unary_ops = {
            "-": operator.neg,
            "+": operator.pos,
            "not": operator.not_,
        }

    def evaluate_ast(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """
        Evaluate an AST node and return the result.
        """
        if node is None:
            return None

        node_type = node.get("type")

        # Handle errors
        if node.get("error"):
            raise RuntimeError(node["error"])

        # Dispatch based on node type
        if node_type == "empty":
            return None

        elif node_type == "literal":
            return node["value"]

        elif node_type == "identifier":
            return self._evaluate_identifier(node, runtime)

        elif node_type == "assignment":
            return self._evaluate_assignment(node, runtime)

        elif node_type == "binary_op":
            return self._evaluate_binary_op(node, runtime)

        elif node_type == "unary_op":
            return self._evaluate_unary_op(node, runtime)

        elif node_type == "function_call":
            return self._evaluate_function_call(node, runtime)

        elif node_type == "parenthesized":
            return self.evaluate_ast(node["expression"], runtime)

        elif node_type == "if_statement":
            return self._evaluate_if_statement(node, runtime)

        elif node_type == "while_loop":
            return self._evaluate_while_loop(node, runtime)

        elif node_type == "for_loop":
            return self._evaluate_for_loop(node, runtime)

        elif node_type == "function_definition":
            return self._evaluate_function_definition(node, runtime)

        elif node_type == "athena_command":
            return self._evaluate_athena_command(node, runtime)

        elif node_type == "pattern_definition":
            return self._evaluate_pattern_definition(node, runtime)

        elif node_type == "list":
            return self._evaluate_list(node, runtime)

        elif node_type == "dict":
            return self._evaluate_dict(node, runtime)

        else:
            raise RuntimeError(f"Unknown node type: {node_type}")

    def _evaluate_identifier(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate identifier (variable or function reference)."""
        name = node["name"]

        # Check runtime variables first (allows shadowing builtins)
        try:
            return runtime.get_variable(name)
        except NameError:
            # Check builtins as fallback
            if name in self.builtins:
                return self.builtins[name]
            return f"Error: Variable '{name}' is not defined"

    def _evaluate_assignment(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate variable assignment."""
        variable = node["variable"]
        # Support both "expression" and "value" for backwards compatibility
        value_node = node.get("expression") or node.get("value")
        if not value_node:
            raise RuntimeError("Assignment must have either 'expression' or 'value'")
        value = self.evaluate_ast(value_node, runtime)

        # Set in runtime
        runtime.set_variable(variable, value)

        # Return the assigned value
        return value

    def _evaluate_binary_op(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate binary operation."""
        left = self.evaluate_ast(node["left"], runtime)
        right = self.evaluate_ast(node["right"], runtime)
        op = node["operator"]

        if op in self.binary_ops:
            try:
                return self.binary_ops[op](left, right)
            except ZeroDivisionError:
                raise ZeusDivisionByZeroError()
            except TypeError as e:
                raise ZeusTypeError(op, "compatible types", left)
            except Exception as e:
                raise ZeusRuntimeError(f"Error in {op} operation: {e}", context=op)
        else:
            raise ZeusValueError(f"Unknown operator: {op}")

    def _evaluate_unary_op(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate unary operation."""
        operand = self.evaluate_ast(node["operand"], runtime)
        op = node["operator"]

        if op in self.unary_ops:
            return self.unary_ops[op](operand)
        else:
            raise RuntimeError(f"Unknown unary operator: {op}")

    def _evaluate_function_call(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate function call."""
        func_name = node["name"]
        arguments = node.get("arguments", [])

        # Evaluate arguments
        evaluated_args = []
        for arg in arguments:
            # Special handling for pattern calls that might be identifiers
            if (
                isinstance(arg, dict)
                and arg.get("type") == "function_call"
                and not arg.get("arguments")
            ):
                # This might be a variable reference that was parsed as a function call
                var_name = arg["name"]
                if runtime.has_variable(var_name):
                    evaluated_args.append(runtime.get_variable(var_name))
                else:
                    # Not a variable, evaluate normally
                    evaluated_args.append(self.evaluate_ast(arg, runtime))
            else:
                evaluated_args.append(self.evaluate_ast(arg, runtime))

        # Check if it's a builtin function
        if func_name in self.builtins:
            func = self.builtins[func_name]
            try:
                return func(*evaluated_args)
            except Exception as e:
                raise RuntimeError(f"Error calling {func_name}: {e}")

        # Check if it's a user-defined function
        func = runtime.get_function(func_name)
        if func:
            return self._call_user_function(func, evaluated_args, runtime)

        # Check if it's a learned pattern
        try:
            # Try to apply as a pattern (will use fuzzy matching internally)
            if runtime.athena_brain:
                # First check if it's an exact match
                if func_name in runtime.athena_brain.pattern_learner.patterns:
                    pattern = runtime.athena_brain.pattern_learner.patterns[func_name]
                else:
                    # Try fuzzy matching
                    matched_name = runtime.athena_brain.pattern_learner._find_closest_pattern(
                        func_name
                    )
                    if matched_name:
                        pattern = runtime.athena_brain.pattern_learner.patterns[matched_name]
                        func_name = matched_name
                    else:
                        raise RuntimeError(f"Unknown function: {func_name}")

                # print(f"DEBUG: Found pattern {func_name}")
                # print(f"DEBUG: Pattern parameters: {pattern.parameters}")
                # print(f"DEBUG: Evaluated args: {evaluated_args}")
                # print(f"DEBUG: Number of params: {len(pattern.parameters)}, Number of args: {len(evaluated_args)}")

                # Map arguments to parameter names
                pattern_args = {}
                for i, (param, arg) in enumerate(zip(pattern.parameters, evaluated_args)):
                    pattern_args[param] = arg
                    # print(f"DEBUG: Mapping arg {i}: {param} = {arg}")

                # Check if we have all parameters mapped
                if len(evaluated_args) < len(pattern.parameters):
                    # print(f"DEBUG: WARNING - Not enough arguments! Expected {len(pattern.parameters)}, got {len(evaluated_args)}")
                    pass

                # print(f"DEBUG: Pattern {func_name} called with args: {pattern_args}")
                return runtime.apply_pattern(func_name, pattern_args)
        except Exception as e:
            # Log the error for debugging
            # print(f"DEBUG: Pattern application failed: {e}")
            import traceback

            traceback.print_exc()
            raise

    def _call_user_function(
        self, func: Dict[str, Any], args: List[Any], runtime: "ZeusRuntime"
    ) -> Any:
        """Call user-defined function."""
        # Check if it's a builtin/Python function
        if func.get("type") == "builtin" and "function" in func:
            python_func = func["function"]
            if callable(python_func):
                try:
                    return python_func(*args)
                except Exception as e:
                    raise RuntimeError(f"Error calling function: {e}")

        # Otherwise it's a Zeus function with parameters and body
        # Create new scope
        runtime.push_scope()

        try:
            # Bind arguments to parameters
            params = func.get("parameters", [])
            for i, param in enumerate(params):
                if i < len(args):
                    runtime.set_variable(param, args[i])
                else:
                    # Default to None for missing arguments
                    runtime.set_variable(param, None)

            # Execute function body
            result = None
            for statement in func.get("body", []):
                result = self.evaluate_ast(statement, runtime)

                # Check for return statement
                if isinstance(statement, dict) and statement.get("type") == "return":
                    result = self.evaluate_ast(statement["value"], runtime)
                    break

            return result

        finally:
            # Restore previous scope
            runtime.pop_scope()

    def _evaluate_if_statement(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate if statement."""
        condition = self.evaluate_ast(node["condition"], runtime)

        if condition:
            if node.get("then_branch"):
                result = self.evaluate_ast(node["then_branch"], runtime)
                # If the branch executed successfully, return the result or a marker
                return result if result is not None else "__STATEMENT_EXECUTED__"
        else:
            if node.get("else_branch"):
                result = self.evaluate_ast(node["else_branch"], runtime)
                return result if result is not None else "__STATEMENT_EXECUTED__"

        # Return a marker when condition was false and no else branch
        return "__STATEMENT_EXECUTED__"

    def _evaluate_while_loop(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate while loop."""
        result = None

        while self.evaluate_ast(node["condition"], runtime):
            if node.get("body"):
                for statement in node["body"]:
                    result = self.evaluate_ast(statement, runtime)

                    # Check for break/continue
                    if isinstance(statement, dict):
                        if statement.get("type") == "break":
                            return result
                        elif statement.get("type") == "continue":
                            break

        return result

    def _evaluate_for_loop(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate for loop."""
        iterator_name = node["iterator"]
        iterable = self.evaluate_ast(node["iterable"], runtime)
        result = None

        # Don't create a new scope for the loop body
        # This allows assignments in the loop to affect the outer scope
        for item in iterable:
            runtime.set_variable(iterator_name, item)

            if node.get("body"):
                for statement in node["body"]:
                    result = self.evaluate_ast(statement, runtime)

                    # Check for break/continue
                    if isinstance(statement, dict):
                        if statement.get("type") == "break":
                            return result
                        elif statement.get("type") == "continue":
                            break

        return result

    def _evaluate_function_definition(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate function definition."""
        func_name = node["name"]

        # Store function in runtime
        runtime.define_function(func_name, node)

        return f"Function {func_name} defined"

    def _evaluate_athena_command(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate Athena AI command."""
        command = node["command"]

        # Use runtime's Athena brain to execute
        return runtime.execute_athena_command(command)

    def _evaluate_pattern_definition(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Any:
        """Evaluate pattern teaching definition."""
        definition = node["definition"]

        # Use runtime to teach pattern
        return runtime.teach_pattern(definition)

    def _evaluate_list(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> List[Any]:
        """Evaluate list literal."""
        elements = node.get("elements", [])
        return [self.evaluate_ast(elem, runtime) for elem in elements]

    def _evaluate_dict(self, node: Dict[str, Any], runtime: "ZeusRuntime") -> Dict[str, Any]:
        """Evaluate dictionary literal."""
        items = node.get("items", [])
        result = {}

        for key_node, value_node in items:
            key = self.evaluate_ast(key_node, runtime)
            value = self.evaluate_ast(value_node, runtime)
            result[key] = value

        return result
    
    def evaluate(self, code_or_node: Union[str, Dict[str, Any]], runtime: Optional["ZeusRuntime"] = None) -> Any:
        """
        Evaluate Zeus code or AST node.
        
        If a string is provided, parse it first.
        If runtime is not provided, create a temporary one.
        """
        # Handle string input
        if isinstance(code_or_node, str):
            if self._parser is None:
                from .zeus_parser import ZeusParser
                self._parser = ZeusParser()
            
            parsed = self._parser.parse(code_or_node)
            if parsed.get("error"):
                raise ZeusSyntaxError(parsed['error'])
            node = parsed
        else:
            node = code_or_node
        
        # Handle missing runtime
        if runtime is None:
            from .zeus_runtime import ZeusRuntime
            runtime = ZeusRuntime()
        
        # Call the original evaluate method
        return self.evaluate_ast(node, runtime)
