"""Safe expression evaluator to replace dangerous eval() usage."""

import ast
import operator
from typing import Any, Dict, Optional, Union, Set
from dataclasses import dataclass
import math


@dataclass
class SafeEvalConfig:
    """Configuration for safe expression evaluation."""

    max_string_length: int = 10000
    max_power: int = 1000
    max_iterations: int = 1000000
    allowed_names: Set[str] = None

    def __post_init__(self):
        if self.allowed_names is None:
            self.allowed_names = set()


class SafeExpressionEvaluator:
    """Safe expression evaluator that prevents code injection and dangerous operations."""

    def __init__(self, config: Optional[SafeEvalConfig] = None):
        self.config = config or SafeEvalConfig()

        # Define safe operations
        self.operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.FloorDiv: operator.floordiv,
            ast.Mod: operator.mod,
            ast.Pow: self._safe_power,
            ast.LShift: operator.lshift,
            ast.RShift: operator.rshift,
            ast.BitOr: operator.or_,
            ast.BitXor: operator.xor,
            ast.BitAnd: operator.and_,
            ast.USub: operator.neg,
            ast.UAdd: operator.pos,
            ast.Not: operator.not_,
            ast.Invert: operator.invert,
        }

        self.comparisons = {
            ast.Eq: operator.eq,
            ast.NotEq: operator.ne,
            ast.Lt: operator.lt,
            ast.LtE: operator.le,
            ast.Gt: operator.gt,
            ast.GtE: operator.ge,
            ast.Is: operator.is_,
            ast.IsNot: operator.is_not,
            ast.In: lambda x, y: x in y,
            ast.NotIn: lambda x, y: x not in y,
        }

        self.bool_ops = {
            ast.And: lambda x, y: x and y,
            ast.Or: lambda x, y: x or y,
        }

        # Safe built-in functions
        self.safe_functions = {
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "sum": sum,
            "len": len,
            "int": int,
            "float": float,
            "str": self._safe_str,
            "bool": bool,
            "pow": self._safe_power,
            "sqrt": math.sqrt,
            "ceil": math.ceil,
            "floor": math.floor,
        }

    def _safe_power(self, base: Union[int, float], exp: Union[int, float]) -> Union[int, float]:
        """Safe power operation with limits."""
        if abs(exp) > self.config.max_power:
            raise ValueError(
                f"Exponent {exp} exceeds maximum allowed value {self.config.max_power}"
            )
        return pow(base, exp)

    def _safe_str(self, obj: Any) -> str:
        """Safe string conversion with length limit."""
        result = str(obj)
        if len(result) > self.config.max_string_length:
            raise ValueError(
                f"String length {len(result)} exceeds maximum {self.config.max_string_length}"
            )
        return result

    def evaluate(self, expression: str, variables: Optional[Dict[str, Any]] = None) -> Any:
        """
        Safely evaluate a mathematical or logical expression.

        Args:
            expression: The expression to evaluate
            variables: Dictionary of variable names to values

        Returns:
            The result of the expression

        Raises:
            ValueError: If the expression contains unsafe operations
            SyntaxError: If the expression is malformed
        """
        if not expression or not expression.strip():
            raise ValueError("Empty expression")

        variables = variables or {}

        try:
            # Parse the expression into an AST
            tree = ast.parse(expression, mode="eval")

            # Validate the AST contains only safe operations
            self._validate_ast(tree)

            # Evaluate the expression
            return self._eval_node(tree.body, variables)

        except SyntaxError as e:
            raise SyntaxError(f"Invalid expression syntax: {e}")
        except Exception as e:
            raise ValueError(f"Error evaluating expression: {e}")

    def _validate_ast(self, node: ast.AST):
        """Validate that the AST contains only safe operations."""
        for child in ast.walk(node):
            # Check for dangerous node types
            if isinstance(
                child,
                (
                    ast.Import,
                    ast.ImportFrom,
                    ast.FunctionDef,
                    ast.AsyncFunctionDef,
                    ast.ClassDef,
                    ast.Delete,
                    ast.With,
                    ast.AsyncWith,
                    ast.Raise,
                    ast.Try,
                    ast.Assert,
                    ast.Global,
                    ast.Nonlocal,
                    ast.Lambda,
                    ast.ListComp,
                    ast.SetComp,
                    ast.DictComp,
                    ast.GeneratorExp,
                    ast.Yield,
                    ast.YieldFrom,
                    ast.FormattedValue,
                    ast.JoinedStr,
                ),
            ):
                raise ValueError(f"Unsafe operation: {type(child).__name__}")

            # Check for attribute access (prevents accessing __builtins__, etc.)
            if isinstance(child, ast.Attribute):
                raise ValueError("Attribute access is not allowed")

            # Check for subscript operations that could be dangerous
            if isinstance(child, ast.Subscript) and not isinstance(child.ctx, ast.Load):
                raise ValueError("Only reading subscripts is allowed")

    def _eval_node(self, node: ast.AST, variables: Dict[str, Any]) -> Any:
        """Recursively evaluate an AST node."""

        # Literals
        if isinstance(node, ast.Constant):
            return node.value

        # Variables
        elif isinstance(node, ast.Name):
            name = node.id

            # Check if it's an allowed built-in function
            if name in self.safe_functions:
                return self.safe_functions[name]

            # Check if it's in provided variables
            if name in variables:
                return variables[name]

            # Check if it's an allowed name
            if name in self.config.allowed_names:
                return name

            raise ValueError(f"Undefined variable: {name}")

        # Binary operations
        elif isinstance(node, ast.BinOp):
            left = self._eval_node(node.left, variables)
            right = self._eval_node(node.right, variables)
            return self.operators[type(node.op)](left, right)

        # Unary operations
        elif isinstance(node, ast.UnaryOp):
            operand = self._eval_node(node.operand, variables)
            return self.operators[type(node.op)](operand)

        # Comparisons
        elif isinstance(node, ast.Compare):
            left = self._eval_node(node.left, variables)

            for op, comparator in zip(node.ops, node.comparators):
                right = self._eval_node(comparator, variables)
                if not self.comparisons[type(op)](left, right):
                    return False
                left = right

            return True

        # Boolean operations
        elif isinstance(node, ast.BoolOp):
            values = [self._eval_node(value, variables) for value in node.values]

            if isinstance(node.op, ast.And):
                for value in values:
                    if not value:
                        return False
                return True
            else:  # ast.Or
                for value in values:
                    if value:
                        return True
                return False

        # If expressions (ternary operator)
        elif isinstance(node, ast.IfExp):
            test = self._eval_node(node.test, variables)
            if test:
                return self._eval_node(node.body, variables)
            else:
                return self._eval_node(node.orelse, variables)

        # Function calls
        elif isinstance(node, ast.Call):
            func = self._eval_node(node.func, variables)

            if not callable(func):
                raise ValueError(f"'{func}' is not callable")

            # Only allow safe functions
            if func not in self.safe_functions.values():
                raise ValueError(f"Function not allowed: {func}")

            # Evaluate arguments
            args = [self._eval_node(arg, variables) for arg in node.args]

            # We don't support keyword arguments for simplicity
            if node.keywords:
                raise ValueError("Keyword arguments are not supported")

            return func(*args)

        # Lists
        elif isinstance(node, ast.List):
            return [self._eval_node(item, variables) for item in node.elts]

        # Tuples
        elif isinstance(node, ast.Tuple):
            return tuple(self._eval_node(item, variables) for item in node.elts)

        # Dictionaries
        elif isinstance(node, ast.Dict):
            result = {}
            for key_node, value_node in zip(node.keys, node.values):
                key = self._eval_node(key_node, variables)
                value = self._eval_node(value_node, variables)
                result[key] = value
            return result

        # Subscript (indexing)
        elif isinstance(node, ast.Subscript):
            obj = self._eval_node(node.value, variables)
            index = self._eval_node(node.slice, variables)
            return obj[index]

        else:
            raise ValueError(f"Unsupported operation: {type(node).__name__}")


# Convenience function for simple evaluation
def safe_eval(
    expression: str,
    variables: Optional[Dict[str, Any]] = None,
    config: Optional[SafeEvalConfig] = None,
) -> Any:
    """
    Safely evaluate an expression.

    Args:
        expression: The expression to evaluate
        variables: Dictionary of variable names to values
        config: Optional configuration for the evaluator

    Returns:
        The result of the expression
    """
    evaluator = SafeExpressionEvaluator(config)
    return evaluator.evaluate(expression, variables)
