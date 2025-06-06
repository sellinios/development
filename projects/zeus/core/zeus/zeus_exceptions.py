"""Custom exceptions for Zeus language."""

from typing import Optional, Any


class ZeusError(Exception):
    """Base exception for all Zeus errors."""

    pass


class ZeusSyntaxError(ZeusError):
    """Raised when Zeus code has syntax errors."""

    def __init__(self, message: str, line: Optional[int] = None, column: Optional[int] = None):
        self.line = line
        self.column = column
        super().__init__(message)

    def __str__(self):
        if self.line is not None:
            return f"Syntax error at line {self.line}: {super().__str__()}"
        return f"Syntax error: {super().__str__()}"


class ZeusRuntimeError(ZeusError):
    """Raised during Zeus code execution."""

    def __init__(self, message: str, context: Optional[str] = None):
        self.context = context
        super().__init__(message)

    def __str__(self):
        if self.context:
            return f"Runtime error in {self.context}: {super().__str__()}"
        return f"Runtime error: {super().__str__()}"


class ZeusNameError(ZeusRuntimeError):
    """Raised when a variable or function is not found."""

    def __init__(self, name: str):
        self.name = name
        super().__init__(f"Undefined variable or function: '{name}'")


class ZeusTypeError(ZeusRuntimeError):
    """Raised when an operation is performed on wrong types."""

    def __init__(self, operation: str, expected: str, got: Any):
        self.operation = operation
        self.expected = expected
        self.got = type(got).__name__
        super().__init__(f"Type error in {operation}: expected {expected}, got {self.got}")


class ZeusValueError(ZeusRuntimeError):
    """Raised when a value is invalid for an operation."""

    pass


class ZeusIndexError(ZeusRuntimeError):
    """Raised when an index is out of bounds."""

    pass


class ZeusKeyError(ZeusRuntimeError):
    """Raised when a dictionary key is not found."""

    pass


class ZeusDivisionByZeroError(ZeusRuntimeError):
    """Raised when division by zero is attempted."""

    def __init__(self):
        super().__init__("Division by zero")


class ZeusPatternError(ZeusError):
    """Raised when pattern matching or learning fails."""

    pass


class ZeusSecurityError(ZeusError):
    """Raised when a security violation is detected."""

    pass


class ZeusTimeoutError(ZeusError):
    """Raised when execution takes too long."""

    def __init__(self, timeout: float):
        self.timeout = timeout
        super().__init__(f"Execution timed out after {timeout} seconds")


class ZeusMemoryError(ZeusError):
    """Raised when memory limits are exceeded."""

    pass
