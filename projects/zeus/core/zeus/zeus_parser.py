import re
import ast
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
import logging
from .zeus_regex_cache import cached_match, cached_search, cached_findall


@dataclass
class ASTNode:
    """Base class for Zeus AST nodes."""

    node_type: str
    value: Any = None
    children: List["ASTNode"] = None

    def __post_init__(self):
        if self.children is None:
            self.children = []


class ZeusParser:
    """
    Parser for Zeus language that handles both traditional syntax and AI-enhanced constructs.
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Token patterns - order matters!
        self.token_patterns = {
            "NUMBER": r"\d+\.?\d*",
            "STRING": r'"[^"]*"|\'[^\']*\'',
            "KEYWORD": r"\b(if|else|while|for|def|return|athena|teach|pattern|in|do|then)\b",  # Must come before IDENTIFIER
            "LOGICAL": r"\b(and|or|not)\b",  # Must come before IDENTIFIER
            "IDENTIFIER": r"[a-zA-Z_]\w*",
            "COMPARISON": r"==|!=|<=|>=|<|>",  # Must come before ASSIGN
            "ASSIGN": r"=",
            "PLUS": r"\+",
            "MINUS": r"-",
            "MULTIPLY": r"\*",
            "DIVIDE": r"/",
            "LPAREN": r"\(",
            "RPAREN": r"\)",
            "LBRACKET": r"\[",
            "RBRACKET": r"\]",
            "COMMA": r",",
            "COLON": r":",
            "NEWLINE": r"\n",
            "WHITESPACE": r"[ \t]+",
            "COMMENT": r"#.*",
        }

        # Compile regex patterns
        self.token_regex = self._compile_token_regex()

    def _compile_token_regex(self) -> re.Pattern:
        """Compile all token patterns into a single regex."""
        pattern_strings = []
        for name, pattern in self.token_patterns.items():
            pattern_strings.append(f"(?P<{name}>{pattern})")
        return re.compile("|".join(pattern_strings))

    def parse(self, code: str) -> Dict[str, Any]:
        """
        Parse Zeus code into an abstract syntax tree.
        """
        try:
            # Tokenize
            tokens = self._tokenize(code)

            # Remove whitespace and comments
            tokens = [t for t in tokens if t["type"] not in ["WHITESPACE", "COMMENT"]]

            if not tokens:
                return None

            # Parse based on first token
            result = self._parse_statement(tokens)
            # Clean up internal fields
            if result is None:
                return None
            return self._clean_ast(result)

        except SyntaxError:
            # Re-raise syntax errors for proper error handling
            raise
        except Exception as e:
            self.logger.error(f"Parse error: {e}")
            return {"error": str(e)}

    def _clean_ast(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Clean AST node by removing internal tracking fields."""
        if not isinstance(node, dict):
            return node

        # Create a copy without internal fields
        cleaned = {}
        for key, value in node.items():
            if key == "tokens_consumed":
                continue

            # Recursively clean nested nodes
            if isinstance(value, dict):
                cleaned[key] = self._clean_ast(value)
            elif isinstance(value, list):
                cleaned[key] = [
                    self._clean_ast(item) if isinstance(item, dict) else item for item in value
                ]
            else:
                cleaned[key] = value

        return cleaned

    def _tokenize(self, code: str) -> List[Dict[str, Any]]:
        """Tokenize the input code."""
        tokens = []

        for match in self.token_regex.finditer(code):
            token_type = match.lastgroup
            token_value = match.group()

            tokens.append({"type": token_type, "value": token_value, "position": match.start()})

        return tokens

    def _parse_statement(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse a single statement."""
        if not tokens:
            return None

        first_token = tokens[0]

        # Check for keywords
        if first_token["type"] == "KEYWORD":
            keyword = first_token["value"]

            if keyword == "if":
                return self._parse_if_statement(tokens)
            elif keyword == "while":
                return self._parse_while_statement(tokens)
            elif keyword == "for":
                return self._parse_for_statement(tokens)
            elif keyword == "def":
                return self._parse_function_definition(tokens)
            elif keyword == "athena":
                return self._parse_athena_command(tokens)
            elif keyword in ["teach", "pattern"]:
                return self._parse_pattern_definition(tokens)

        # Check for assignment
        if len(tokens) >= 3 and tokens[1]["type"] == "ASSIGN":
            return self._parse_assignment(tokens)

        # Check for pattern/function call without parentheses
        if first_token["type"] == "IDENTIFIER" and len(tokens) > 1:
            # Check if following tokens could be arguments (not operators)
            if tokens[1]["type"] not in [
                "PLUS",
                "MINUS",
                "MULTIPLY",
                "DIVIDE",
                "COMPARISON",
                "LOGICAL",
                "ASSIGN",
                "LPAREN",  # Function calls should not be pattern calls
            ]:
                return self._parse_pattern_call(tokens)

        # Otherwise, parse as expression
        return self._parse_expression(tokens)

    def _parse_assignment(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse variable assignment."""
        if tokens[0]["type"] != "IDENTIFIER":
            raise SyntaxError(f"Expected identifier, got {tokens[0]['value']}")

        variable = tokens[0]["value"]

        # Parse the expression after '='
        expr_tokens = tokens[2:]  # Skip variable and '='
        expression = self._parse_expression(expr_tokens)

        return {"type": "assignment", "variable": variable, "expression": expression}

    def _parse_expression(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse mathematical or logical expression."""
        if not tokens:
            raise SyntaxError("Empty expression")

        # Simple expression parser (can be extended with proper precedence)
        return self._parse_logical_expr(tokens)

    def _parse_logical_expr(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse logical operations (and, or)."""
        left = self._parse_comparison_expr(tokens)

        i = self._find_consumed_tokens(tokens, left)
        while (
            i < len(tokens)
            and tokens[i]["type"] == "LOGICAL"
            and tokens[i]["value"] in ["and", "or"]
        ):
            op = tokens[i]
            i += 1

            remaining_tokens = tokens[i:]
            right = self._parse_comparison_expr(remaining_tokens)

            left = {"type": "binary_op", "operator": op["value"], "left": left, "right": right}

            i += self._find_consumed_tokens(remaining_tokens, right)

        # Set tokens consumed on the final result
        left["tokens_consumed"] = i
        return left

    def _parse_comparison_expr(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse comparison operations."""
        left = self._parse_additive_expr(tokens)

        i = self._find_consumed_tokens(tokens, left)
        if i < len(tokens) and tokens[i]["type"] == "COMPARISON":
            op = tokens[i]
            i += 1

            remaining_tokens = tokens[i:]
            right = self._parse_additive_expr(remaining_tokens)

            left = {"type": "binary_op", "operator": op["value"], "left": left, "right": right}

            i += self._find_consumed_tokens(remaining_tokens, right)

        # Set tokens consumed on the final result
        left["tokens_consumed"] = i
        return left

    def _parse_additive_expr(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse addition and subtraction."""
        left = self._parse_multiplicative_expr(tokens)

        i = self._find_consumed_tokens(tokens, left)
        while i < len(tokens) and tokens[i]["type"] in ["PLUS", "MINUS"]:
            op = tokens[i]
            i += 1

            remaining_tokens = tokens[i:]
            right = self._parse_multiplicative_expr(remaining_tokens)

            left = {"type": "binary_op", "operator": op["value"], "left": left, "right": right}

            i += self._find_consumed_tokens(remaining_tokens, right)

        # Set tokens consumed on the final result
        left["tokens_consumed"] = i
        return left

    def _parse_multiplicative_expr(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse multiplication and division."""
        left = self._parse_primary_expr(tokens)

        i = self._find_consumed_tokens(tokens, left)
        while i < len(tokens) and tokens[i]["type"] in ["MULTIPLY", "DIVIDE"]:
            op = tokens[i]
            i += 1

            remaining_tokens = tokens[i:]
            right = self._parse_primary_expr(remaining_tokens)

            left = {"type": "binary_op", "operator": op["value"], "left": left, "right": right}

            i += self._find_consumed_tokens(remaining_tokens, right)

        # Set tokens consumed on the final result
        left["tokens_consumed"] = i
        return left

    def _parse_primary_expr(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse primary expressions (numbers, strings, identifiers, parentheses)."""
        if not tokens:
            raise SyntaxError("Expected expression")

        token = tokens[0]

        # Handle unary 'not'
        if token["type"] == "LOGICAL" and token["value"] == "not":
            operand_tokens = tokens[1:]
            operand = self._parse_primary_expr(operand_tokens)
            return {
                "type": "unary_op",
                "operator": "not",
                "operand": operand,
                "tokens_consumed": 1 + operand.get("tokens_consumed", 1),
            }

        # Handle unary minus for negative numbers
        if token["type"] == "MINUS" and len(tokens) > 1 and tokens[1]["type"] == "NUMBER":
            value = (
                float(tokens[1]["value"]) if "." in tokens[1]["value"] else int(tokens[1]["value"])
            )
            return {"type": "literal", "value": -value, "tokens_consumed": 2}

        if token["type"] == "NUMBER":
            value = float(token["value"]) if "." in token["value"] else int(token["value"])
            return {"type": "literal", "value": value, "tokens_consumed": 1}

        elif token["type"] == "STRING":
            # Remove quotes
            value = token["value"][1:-1]
            return {"type": "literal", "value": value, "tokens_consumed": 1}

        elif token["type"] == "IDENTIFIER":
            # Check for boolean literals
            if token["value"].lower() in ["true", "false"]:
                value = token["value"].lower() == "true"
                return {"type": "literal", "value": value, "tokens_consumed": 1}
            # Check if it's a function call
            elif len(tokens) > 1 and tokens[1]["type"] == "LPAREN":
                return self._parse_function_call(tokens)
            else:
                return {"type": "identifier", "name": token["value"], "tokens_consumed": 1}

        elif token["type"] == "LPAREN":
            # Parse parenthesized expression
            expr_tokens = self._extract_until_matching_paren(tokens[1:])
            expr = self._parse_expression(expr_tokens)
            # Return the inner expression directly, but track tokens consumed
            expr["tokens_consumed"] = len(expr_tokens) + 2  # Include parentheses
            return expr

        elif token["type"] == "LBRACKET":
            # Parse list literal
            list_tokens = self._extract_until_matching_bracket(tokens[1:])
            elements = self._parse_list_elements(list_tokens)
            return {
                "type": "list",
                "elements": elements,
                "tokens_consumed": len(list_tokens) + 2,  # Include brackets
            }

        else:
            raise SyntaxError(f"Unexpected token: {token['value']}")

    def _parse_function_call(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse function call."""
        func_name = tokens[0]["value"]

        # Extract arguments between parentheses
        args_tokens = self._extract_until_matching_paren(tokens[2:])
        arguments = self._parse_arguments(args_tokens)

        return {
            "type": "function_call",
            "name": func_name,
            "arguments": arguments,
            "tokens_consumed": len(args_tokens) + 3,  # name + ( + args + )
        }

    def _parse_arguments(self, tokens: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse function arguments."""
        arguments = []

        if not tokens:
            return arguments

        # Split by commas
        current_arg_tokens = []
        paren_depth = 0

        for token in tokens:
            if token["type"] == "LPAREN":
                paren_depth += 1
            elif token["type"] == "RPAREN":
                paren_depth -= 1
            elif token["type"] == "COMMA" and paren_depth == 0:
                if current_arg_tokens:
                    arguments.append(self._parse_expression(current_arg_tokens))
                    current_arg_tokens = []
                continue

            current_arg_tokens.append(token)

        # Don't forget the last argument
        if current_arg_tokens:
            arguments.append(self._parse_expression(current_arg_tokens))

        return arguments

    def _parse_if_statement(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse if statement."""
        if not tokens or tokens[0]["value"] != "if":
            raise SyntaxError("Expected 'if' keyword")

        i = 1  # Skip 'if'

        # Find 'then' or ':' to delimit condition
        # Also handle parenthesized conditions
        condition_end = -1
        paren_depth = 0
        
        for j in range(i, len(tokens)):
            # Track parentheses depth
            if tokens[j]["type"] == "LPAREN":
                paren_depth += 1
            elif tokens[j]["type"] == "RPAREN":
                paren_depth -= 1
                # If we close all parentheses and this is a condition in parens, 
                # the next token starts the then branch
                if paren_depth == 0 and j > i:
                    condition_end = j + 1
                    break
            elif paren_depth == 0:
                # Only check for delimiters when not inside parentheses
                if (tokens[j]["type"] == "KEYWORD" and tokens[j]["value"] == "then") or tokens[j]["type"] == "COLON":
                    condition_end = j
                    break

        if condition_end == -1:
            # No explicit delimiter found
            # For non-parenthesized conditions, try to find where condition ends
            # by looking for function calls or other statements
            for j in range(i, len(tokens)):
                # If we find a function call token (identifier followed by parenthesis)
                # and we're not in the middle of an expression, that's likely the then branch
                if (j + 1 < len(tokens) and 
                    tokens[j]["type"] == "IDENTIFIER" and 
                    tokens[j+1]["type"] == "LPAREN" and
                    j > i + 2):  # At least have a minimal condition
                    condition_end = j
                    break
            
            if condition_end == -1:
                # Still no delimiter, use all remaining tokens as condition
                condition_end = len(tokens)

        # Parse condition
        condition_tokens = tokens[i:condition_end]
        if not condition_tokens:
            raise SyntaxError("Expected condition after 'if'")

        condition = self._parse_expression(condition_tokens)

        # Skip 'then' or ':' if present
        i = condition_end
        if i < len(tokens) and (
            (tokens[i]["type"] == "KEYWORD" and tokens[i]["value"] == "then")
            or tokens[i]["type"] == "COLON"
        ):
            i += 1

        # Parse then branch
        # For now, parse a single expression as the then branch
        then_branch = None
        else_branch = None

        # Find 'else' keyword
        else_index = -1
        for j in range(i, len(tokens)):
            if tokens[j]["type"] == "KEYWORD" and tokens[j]["value"] == "else":
                else_index = j
                break

        if else_index != -1:
            # Parse then branch up to else
            then_tokens = tokens[i:else_index]
            if then_tokens:
                then_branch = self._parse_statement(then_tokens)

            # Parse else branch
            else_tokens = tokens[else_index + 1 :]
            if else_tokens:
                else_branch = self._parse_statement(else_tokens)
        else:
            # No else branch, parse remaining as then branch
            then_tokens = tokens[i:]
            if then_tokens:
                then_branch = self._parse_statement(then_tokens)

        return {
            "type": "if_statement",
            "condition": condition,
            "then_branch": then_branch,
            "else_branch": else_branch,
        }

    def _parse_while_statement(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse while loop."""
        if not tokens or tokens[0]["value"] != "while":
            raise SyntaxError("Expected 'while' keyword")

        i = 1  # Skip 'while'

        # Find 'do' or ':' to delimit condition
        condition_end = -1
        for j in range(i, len(tokens)):
            if (tokens[j]["type"] == "KEYWORD" and tokens[j]["value"] == "do") or tokens[j][
                "type"
            ] == "COLON":
                condition_end = j
                break

        if condition_end == -1:
            # No explicit do/colon, use all remaining tokens as condition
            condition_end = len(tokens)

        # Parse condition
        condition_tokens = tokens[i:condition_end]
        if not condition_tokens:
            raise SyntaxError("Expected condition after 'while'")

        condition = self._parse_expression(condition_tokens)

        # Skip 'do' or ':' if present
        i = condition_end
        if i < len(tokens) and (
            (tokens[i]["type"] == "KEYWORD" and tokens[i]["value"] == "do")
            or tokens[i]["type"] == "COLON"
        ):
            i += 1

        # Parse body (for now, single statement)
        body = None
        if i < len(tokens):
            body_tokens = tokens[i:]
            body = [self._parse_statement(body_tokens)]

        return {"type": "while_loop", "condition": condition, "body": body}

    def _parse_for_statement(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse for loop."""
        if not tokens or tokens[0]["value"] != "for":
            raise SyntaxError("Expected 'for' keyword")

        i = 1  # Skip 'for'

        # Parse iterator variable
        if i >= len(tokens) or tokens[i]["type"] != "IDENTIFIER":
            raise SyntaxError("Expected iterator variable after 'for'")

        iterator = tokens[i]["value"]
        i += 1

        # Expect 'in' keyword
        if i >= len(tokens) or tokens[i]["value"] != "in":
            raise SyntaxError("Expected 'in' after iterator variable")
        i += 1

        # Find 'do' or ':' to delimit iterable
        iterable_end = -1
        for j in range(i, len(tokens)):
            if (tokens[j]["type"] == "KEYWORD" and tokens[j]["value"] == "do") or tokens[j][
                "type"
            ] == "COLON":
                iterable_end = j
                break

        if iterable_end == -1:
            # No explicit do/colon, use all remaining tokens as iterable
            iterable_end = len(tokens)

        # Parse iterable expression
        iterable_tokens = tokens[i:iterable_end]
        if not iterable_tokens:
            raise SyntaxError("Expected iterable after 'in'")

        iterable = self._parse_expression(iterable_tokens)

        # Skip 'do' or ':' if present
        i = iterable_end
        if i < len(tokens) and (
            (tokens[i]["type"] == "KEYWORD" and tokens[i]["value"] == "do")
            or tokens[i]["type"] == "COLON"
        ):
            i += 1

        # Parse body (for now, single statement)
        body = None
        if i < len(tokens):
            body_tokens = tokens[i:]
            body = [self._parse_statement(body_tokens)]

        return {"type": "for_loop", "iterator": iterator, "iterable": iterable, "body": body}

    def _parse_function_definition(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse function definition."""
        if not tokens or tokens[0]["value"] != "def":
            raise SyntaxError("Expected 'def' keyword")

        i = 1  # Skip 'def'

        # Parse function name
        if i >= len(tokens) or tokens[i]["type"] != "IDENTIFIER":
            raise SyntaxError("Expected function name after 'def'")

        name = tokens[i]["value"]
        i += 1

        # Parse parameters
        parameters = []
        if i < len(tokens) and tokens[i]["type"] == "LPAREN":
            i += 1  # Skip '('

            # Extract parameters
            while i < len(tokens) and tokens[i]["type"] != "RPAREN":
                if tokens[i]["type"] == "IDENTIFIER":
                    parameters.append(tokens[i]["value"])
                    i += 1

                    # Skip comma if present
                    if i < len(tokens) and tokens[i]["type"] == "COMMA":
                        i += 1
                elif tokens[i]["type"] == "COMMA":
                    raise SyntaxError("Unexpected comma in parameter list")
                else:
                    raise SyntaxError(f"Expected parameter name, got {tokens[i]['value']}")

            if i >= len(tokens):
                raise SyntaxError("Missing closing parenthesis")

            i += 1  # Skip ')'

        # Skip ':' if present
        if i < len(tokens) and tokens[i]["type"] == "COLON":
            i += 1

        # Parse body (for now, single expression)
        body = None
        if i < len(tokens):
            body_tokens = tokens[i:]
            body = [self._parse_statement(body_tokens)]

        return {"type": "function_definition", "name": name, "parameters": parameters, "body": body}

    def _parse_athena_command(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse Athena AI command."""
        # Reconstruct the command text after 'athena'
        command_tokens = tokens[1:]
        command_text = " ".join(token["value"] for token in command_tokens)

        return {"type": "athena_command", "command": command_text}

    def _parse_pattern_definition(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse pattern teaching definition."""
        # Reconstruct the pattern definition
        pattern_text = " ".join(token["value"] for token in tokens)

        return {"type": "pattern_definition", "definition": pattern_text}

    def _extract_until_matching_paren(self, tokens: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract tokens until matching closing parenthesis."""
        result = []
        paren_depth = 1

        for token in tokens:
            if token["type"] == "LPAREN":
                paren_depth += 1
            elif token["type"] == "RPAREN":
                paren_depth -= 1
                if paren_depth == 0:
                    break

            result.append(token)

        return result

    def _find_consumed_tokens(self, tokens: List[Dict[str, Any]], parsed: Dict[str, Any]) -> int:
        """Find how many tokens were consumed by parsing."""
        # Get tokens consumed, defaulting to 1 if not present
        consumed = parsed.get("tokens_consumed", 1)
        return consumed

    def _extract_until_matching_bracket(self, tokens: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Extract tokens until matching closing bracket."""
        result = []
        bracket_depth = 1

        for token in tokens:
            if token["type"] == "LBRACKET":
                bracket_depth += 1
            elif token["type"] == "RBRACKET":
                bracket_depth -= 1
                if bracket_depth == 0:
                    break

            result.append(token)

        return result

    def _parse_list_elements(self, tokens: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Parse list elements separated by commas."""
        if not tokens:
            return []

        elements = []
        current_element_tokens = []
        bracket_depth = 0

        for token in tokens:
            if token["type"] == "LBRACKET":
                bracket_depth += 1
            elif token["type"] == "RBRACKET":
                bracket_depth -= 1
            elif token["type"] == "COMMA" and bracket_depth == 0:
                if current_element_tokens:
                    elements.append(self._parse_expression(current_element_tokens))
                    current_element_tokens = []
                continue

            current_element_tokens.append(token)

        # Don't forget the last element
        if current_element_tokens:
            elements.append(self._parse_expression(current_element_tokens))

        return elements

    def _parse_pattern_call(self, tokens: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse pattern/function call without parentheses (e.g., 'double 5' or 'double square 3')."""
        func_name = tokens[0]["value"]

        # print(f"DEBUG: Parsing pattern call: {func_name}")
        # print(f"DEBUG: All tokens: {[t['value'] for t in tokens]}")

        # If there's only one token, it's a pattern call with no arguments
        if len(tokens) == 1:
            return {"type": "function_call", "name": func_name, "arguments": []}

        # Collect arguments (all remaining tokens)
        arguments = []
        i = 1
        while i < len(tokens):
            if tokens[i]["type"] == "COMMA":
                i += 1
                continue

            # Check if the argument might be another pattern call
            if tokens[i]["type"] == "IDENTIFIER" and i + 1 < len(tokens):
                # Look ahead to see if this is a nested pattern call
                j = i + 1
                nested_tokens = [tokens[i]]

                # Collect tokens for potential nested pattern
                while j < len(tokens) and tokens[j]["type"] not in [
                    "COMMA",
                    "PLUS",
                    "MINUS",
                    "MULTIPLY",
                    "DIVIDE",
                ]:
                    nested_tokens.append(tokens[j])
                    j += 1

                # Parse as nested pattern call
                if len(nested_tokens) > 1:
                    nested_call = self._parse_pattern_call(nested_tokens)
                    arguments.append(nested_call)
                    i = j
                    continue

            # Parse single token as expression
            # For pattern calls, each space-separated token is a separate argument
            if tokens[i]["type"] in ["STRING", "NUMBER", "IDENTIFIER"]:
                # Single token as argument
                arg_token = tokens[i]
                # print(f"DEBUG: Processing single arg token: {arg_token['value']}")

                if arg_token["type"] == "IDENTIFIER":
                    # Check if it might be a variable reference
                    arguments.append(
                        {"type": "function_call", "name": arg_token["value"], "arguments": []}
                    )
                else:
                    # Parse as literal expression
                    arguments.append(self._parse_expression([arg_token]))
                i += 1
            else:
                # Collect tokens for complex expression
                arg_tokens = []
                while i < len(tokens) and tokens[i]["type"] != "COMMA":
                    if tokens[i]["type"] in ["PLUS", "MINUS", "MULTIPLY", "DIVIDE", "COMPARISON"]:
                        # Include operator and continue collecting
                        arg_tokens.append(tokens[i])
                        i += 1
                    else:
                        arg_tokens.append(tokens[i])
                        i += 1
                        break  # Single token unless it's part of expression

                if arg_tokens:
                    # print(f"DEBUG: Processing expression tokens: {[t['value'] for t in arg_tokens]}")
                    arguments.append(self._parse_expression(arg_tokens))

        # print(f"DEBUG: Parsed arguments: {len(arguments)} args")
        return {"type": "function_call", "name": func_name, "arguments": arguments}
