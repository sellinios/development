"""
Language Patterns Bootstrap
Loads common language patterns and code templates
"""

from typing import Dict, Any, List


class PatternsBootstrap:
    """Loads language patterns into Zeus"""
    
    def __init__(self, ermis_interface):
        self.ermis = ermis_interface
        
    def load(self) -> Dict[str, Any]:
        """Load all language patterns"""
        counts = {
            'greetings': 0,
            'questions': 0,
            'commands': 0,
            'code_patterns': 0
        }
        
        # Load greeting patterns
        patterns = self._get_greeting_patterns()
        for pattern in patterns:
            success = self.ermis.learn('pattern', pattern)
            if success:
                counts['greetings'] += 1
                
        # Load question patterns
        patterns = self._get_question_patterns()
        for pattern in patterns:
            success = self.ermis.learn('pattern', pattern)
            if success:
                counts['questions'] += 1
                
        # Load command patterns
        patterns = self._get_command_patterns()
        for pattern in patterns:
            success = self.ermis.learn('pattern', pattern)
            if success:
                counts['commands'] += 1
                
        # Load code patterns
        patterns = self._get_code_patterns()
        for pattern in patterns:
            success = self.ermis.learn('pattern', pattern)
            if success:
                counts['code_patterns'] += 1
                
        return {
            'status': 'success',
            'counts': counts
        }
        
    def _get_greeting_patterns(self) -> List[Dict[str, Any]]:
        """Get greeting patterns"""
        return [
            {
                'pattern_type': 'greeting',
                'pattern_data': {
                    'name': 'hello_pattern',
                    'template': 'hello {name}',
                    'response': 'Hello {name}! How can I help you?',
                    'variables': ['name']
                }
            },
            {
                'pattern_type': 'greeting',
                'pattern_data': {
                    'name': 'hi_pattern',
                    'template': 'hi {name}',
                    'response': 'Hi {name}! What can I do for you?',
                    'variables': ['name']
                }
            },
            {
                'pattern_type': 'greeting',
                'pattern_data': {
                    'name': 'good_morning_pattern',
                    'template': 'good morning',
                    'response': 'Good morning! Ready to code?',
                    'variables': []
                }
            },
            {
                'pattern_type': 'greeting',
                'pattern_data': {
                    'name': 'goodbye_pattern',
                    'template': 'goodbye',
                    'response': 'Goodbye! Your work has been saved.',
                    'variables': []
                }
            }
        ]
        
    def _get_question_patterns(self) -> List[Dict[str, Any]]:
        """Get question patterns"""
        return [
            {
                'pattern_type': 'question',
                'pattern_data': {
                    'name': 'what_is_pattern',
                    'template': 'what is {thing}',
                    'action': 'lookup_definition',
                    'variables': ['thing']
                }
            },
            {
                'pattern_type': 'question',
                'pattern_data': {
                    'name': 'how_to_pattern',
                    'template': 'how to {action}',
                    'action': 'provide_instructions',
                    'variables': ['action']
                }
            },
            {
                'pattern_type': 'question',
                'pattern_data': {
                    'name': 'value_of_pattern',
                    'template': 'what is the value of {variable}',
                    'action': 'retrieve_value',
                    'variables': ['variable']
                }
            },
            {
                'pattern_type': 'question',
                'pattern_data': {
                    'name': 'calculate_pattern',
                    'template': 'calculate {expression}',
                    'action': 'evaluate_expression',
                    'variables': ['expression']
                }
            }
        ]
        
    def _get_command_patterns(self) -> List[Dict[str, Any]]:
        """Get command patterns"""
        return [
            {
                'pattern_type': 'command',
                'pattern_data': {
                    'name': 'remember_pattern',
                    'template': 'remember that {name} is {value}',
                    'action': 'store_variable',
                    'variables': ['name', 'value']
                }
            },
            {
                'pattern_type': 'command',
                'pattern_data': {
                    'name': 'define_function_pattern',
                    'template': 'define function {name} that {description}',
                    'action': 'create_function',
                    'variables': ['name', 'description']
                }
            },
            {
                'pattern_type': 'command',
                'pattern_data': {
                    'name': 'show_pattern',
                    'template': 'show {thing}',
                    'action': 'display_information',
                    'variables': ['thing']
                }
            },
            {
                'pattern_type': 'command',
                'pattern_data': {
                    'name': 'clear_pattern',
                    'template': 'clear {thing}',
                    'action': 'clear_data',
                    'variables': ['thing']
                }
            }
        ]
        
    def _get_code_patterns(self) -> List[Dict[str, Any]]:
        """Get code generation patterns"""
        return [
            {
                'pattern_type': 'code_template',
                'pattern_data': {
                    'name': 'for_loop_pattern',
                    'template': 'for {var} in range({start}, {end})',
                    'code': 'for {var} in range({start}, {end}):\n    # Loop body',
                    'variables': ['var', 'start', 'end']
                }
            },
            {
                'pattern_type': 'code_template',
                'pattern_data': {
                    'name': 'if_else_pattern',
                    'template': 'if {condition} then {action1} else {action2}',
                    'code': 'if {condition}:\n    {action1}\nelse:\n    {action2}',
                    'variables': ['condition', 'action1', 'action2']
                }
            },
            {
                'pattern_type': 'code_template',
                'pattern_data': {
                    'name': 'list_comprehension_pattern',
                    'template': 'list of {expression} for {var} in {iterable}',
                    'code': '[{expression} for {var} in {iterable}]',
                    'variables': ['expression', 'var', 'iterable']
                }
            },
            {
                'pattern_type': 'code_template',
                'pattern_data': {
                    'name': 'function_definition_pattern',
                    'template': 'function {name} with parameters {params} returns {return_type}',
                    'code': 'def {name}({params}) -> {return_type}:\n    # Function body\n    pass',
                    'variables': ['name', 'params', 'return_type']
                }
            },
            {
                'pattern_type': 'code_template',
                'pattern_data': {
                    'name': 'class_definition_pattern',
                    'template': 'class {name} with attributes {attributes}',
                    'code': 'class {name}:\n    def __init__(self):\n        # Initialize attributes\n        pass',
                    'variables': ['name', 'attributes']
                }
            },
            {
                'pattern_type': 'code_template',
                'pattern_data': {
                    'name': 'try_except_pattern',
                    'template': 'try {action} except {error_type}',
                    'code': 'try:\n    {action}\nexcept {error_type} as e:\n    # Handle error\n    pass',
                    'variables': ['action', 'error_type']
                }
            }
        ]