"""
Mathematics Knowledge Bootstrap
Loads fundamental mathematical constants and functions
"""

import math
from typing import Dict, Any, List


class MathematicsBootstrap:
    """Loads mathematical knowledge into Zeus"""
    
    def __init__(self, ermis_interface):
        self.ermis = ermis_interface
        
    def load(self) -> Dict[str, Any]:
        """Load all mathematical knowledge"""
        counts = {
            'constants': 0,
            'functions': 0,
            'patterns': 0
        }
        
        # Load constants
        constants = self._get_mathematical_constants()
        for name, value, description in constants:
            success = self.ermis.store(name, value, {
                'type': 'constant',
                'category': 'mathematics',
                'description': description,
                'immutable': True
            })
            if success:
                counts['constants'] += 1
                
        # Load mathematical functions
        functions = self._get_mathematical_functions()
        for func_data in functions:
            success = self.ermis.store(func_data['name'], func_data, {
                'type': 'function',
                'category': 'mathematics',
                'builtin': True
            })
            if success:
                counts['functions'] += 1
                
        # Load mathematical patterns
        patterns = self._get_mathematical_patterns()
        for pattern_data in patterns:
            success = self.ermis.learn('pattern', pattern_data)
            if success:
                counts['patterns'] += 1
                
        return {
            'status': 'success',
            'counts': counts
        }
        
    def _get_mathematical_constants(self) -> List[tuple]:
        """Get fundamental mathematical constants"""
        return [
            # Basic constants
            ('pi', math.pi, 'Ratio of circle circumference to diameter'),
            ('e', math.e, "Euler's number - base of natural logarithm"),
            ('tau', math.tau, 'Tau = 2π'),
            
            # Golden ratio and related
            ('phi', (1 + math.sqrt(5)) / 2, 'Golden ratio'),
            ('golden_ratio', (1 + math.sqrt(5)) / 2, 'Golden ratio (alias)'),
            
            # Square roots
            ('sqrt2', math.sqrt(2), 'Square root of 2'),
            ('sqrt3', math.sqrt(3), 'Square root of 3'),
            ('sqrt5', math.sqrt(5), 'Square root of 5'),
            
            # Logarithms
            ('ln2', math.log(2), 'Natural logarithm of 2'),
            ('ln10', math.log(10), 'Natural logarithm of 10'),
            ('log2e', math.log2(math.e), 'Log base 2 of e'),
            ('log10e', math.log10(math.e), 'Log base 10 of e'),
            
            # Euler-Mascheroni constant
            ('euler_gamma', 0.5772156649015329, 'Euler-Mascheroni constant'),
            
            # Catalan's constant
            ('catalan', 0.915965594177219015054603514932384110774, "Catalan's constant"),
            
            # Infinity and special values
            ('infinity', float('inf'), 'Positive infinity'),
            ('neg_infinity', float('-inf'), 'Negative infinity'),
            ('nan', float('nan'), 'Not a number'),
        ]
        
    def _get_mathematical_functions(self) -> List[Dict[str, Any]]:
        """Get mathematical function definitions"""
        return [
            # Arithmetic functions
            {
                'name': 'add',
                'parameters': ['a', 'b'],
                'body': 'return a + b',
                'description': 'Addition',
                'return_type': 'number'
            },
            {
                'name': 'subtract',
                'parameters': ['a', 'b'],
                'body': 'return a - b',
                'description': 'Subtraction',
                'return_type': 'number'
            },
            {
                'name': 'multiply',
                'parameters': ['a', 'b'],
                'body': 'return a * b',
                'description': 'Multiplication',
                'return_type': 'number'
            },
            {
                'name': 'divide',
                'parameters': ['a', 'b'],
                'body': 'return a / b if b != 0 else float("inf")',
                'description': 'Division with zero check',
                'return_type': 'number'
            },
            
            # Power functions
            {
                'name': 'square',
                'parameters': ['x'],
                'body': 'return x ** 2',
                'description': 'Square of a number',
                'return_type': 'number'
            },
            {
                'name': 'cube',
                'parameters': ['x'],
                'body': 'return x ** 3',
                'description': 'Cube of a number',
                'return_type': 'number'
            },
            {
                'name': 'power',
                'parameters': ['base', 'exponent'],
                'body': 'return base ** exponent',
                'description': 'Exponentiation',
                'return_type': 'number'
            },
            
            # Trigonometric functions
            {
                'name': 'degrees_to_radians',
                'parameters': ['degrees'],
                'body': 'return degrees * 3.14159265359 / 180',
                'description': 'Convert degrees to radians',
                'return_type': 'number'
            },
            {
                'name': 'radians_to_degrees',
                'parameters': ['radians'],
                'body': 'return radians * 180 / 3.14159265359',
                'description': 'Convert radians to degrees',
                'return_type': 'number'
            },
            
            # Geometry functions
            {
                'name': 'circle_area',
                'parameters': ['radius'],
                'body': 'return 3.14159265359 * radius ** 2',
                'description': 'Area of a circle',
                'return_type': 'number'
            },
            {
                'name': 'circle_circumference',
                'parameters': ['radius'],
                'body': 'return 2 * 3.14159265359 * radius',
                'description': 'Circumference of a circle',
                'return_type': 'number'
            },
            {
                'name': 'sphere_volume',
                'parameters': ['radius'],
                'body': 'return (4/3) * 3.14159265359 * radius ** 3',
                'description': 'Volume of a sphere',
                'return_type': 'number'
            },
            {
                'name': 'sphere_surface_area',
                'parameters': ['radius'],
                'body': 'return 4 * 3.14159265359 * radius ** 2',
                'description': 'Surface area of a sphere',
                'return_type': 'number'
            },
            
            # Utility functions
            {
                'name': 'abs',
                'parameters': ['x'],
                'body': 'return x if x >= 0 else -x',
                'description': 'Absolute value',
                'return_type': 'number'
            },
            {
                'name': 'sign',
                'parameters': ['x'],
                'body': 'return 1 if x > 0 else (-1 if x < 0 else 0)',
                'description': 'Sign of a number',
                'return_type': 'number'
            },
            {
                'name': 'max',
                'parameters': ['a', 'b'],
                'body': 'return a if a > b else b',
                'description': 'Maximum of two numbers',
                'return_type': 'number'
            },
            {
                'name': 'min',
                'parameters': ['a', 'b'],
                'body': 'return a if a < b else b',
                'description': 'Minimum of two numbers',
                'return_type': 'number'
            },
            
            # Factorial
            {
                'name': 'factorial',
                'parameters': ['n'],
                'body': '''
result = 1
for i in range(1, int(n) + 1):
    result *= i
return result
'''.strip(),
                'description': 'Factorial of n',
                'return_type': 'number'
            }
        ]
        
    def _get_mathematical_patterns(self) -> List[Dict[str, Any]]:
        """Get mathematical expression patterns"""
        return [
            {
                'pattern_type': 'mathematical_expression',
                'pattern_data': {
                    'name': 'quadratic_formula',
                    'template': 'x = (-b ± sqrt(b² - 4ac)) / 2a',
                    'description': 'Quadratic formula for ax² + bx + c = 0',
                    'variables': ['a', 'b', 'c']
                }
            },
            {
                'pattern_type': 'mathematical_expression',
                'pattern_data': {
                    'name': 'pythagorean_theorem',
                    'template': 'c² = a² + b²',
                    'description': 'Pythagorean theorem',
                    'variables': ['a', 'b', 'c']
                }
            },
            {
                'pattern_type': 'mathematical_expression',
                'pattern_data': {
                    'name': 'distance_formula',
                    'template': 'd = sqrt((x₂ - x₁)² + (y₂ - y₁)²)',
                    'description': 'Distance between two points',
                    'variables': ['x1', 'y1', 'x2', 'y2']
                }
            }
        ]