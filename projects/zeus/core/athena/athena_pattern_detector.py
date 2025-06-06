"""
Automatic Pattern Detector for Athena
Learns structural patterns from usage without semantic assumptions
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from collections import defaultdict, Counter
from datetime import datetime
import json
import logging


class StructuralPattern:
    """Represents a structural pattern without semantic meaning"""
    
    def __init__(self, pattern_type: str, structure: str):
        self.pattern_type = pattern_type  # 'if_statement', 'assignment', 'function_call'
        self.structure = structure  # Abstract structure like 'if <var> <op> <num> <action>'
        self.examples = []  # Concrete examples
        self.usage_count = 0
        self.last_seen = None
        self.variations = defaultdict(int)  # Track variations
        
    def add_example(self, example: Dict[str, Any]):
        """Add a concrete example of this pattern"""
        self.examples.append({
            'code': example.get('code', ''),
            'timestamp': datetime.now().isoformat(),
            'context': example.get('context', {})
        })
        self.usage_count += 1
        self.last_seen = datetime.now()
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            'pattern_type': self.pattern_type,
            'structure': self.structure,
            'usage_count': self.usage_count,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'examples': self.examples[-5:],  # Keep last 5 examples
            'variations': dict(self.variations)
        }


class PatternDetector:
    """Detects and learns structural patterns from user interactions"""
    
    def __init__(self, knowledge_base=None):
        self.logger = logging.getLogger(__name__)
        self.patterns = {}  # pattern_id -> StructuralPattern
        self.sequence_tracker = []  # Track command sequences
        self.variable_usage = defaultdict(list)  # Track how variables are used
        self.naming_patterns = Counter()  # Track naming conventions
        self.knowledge_base = knowledge_base  # For persistence
        
    def analyze_interaction(self, code: str, parsed_ast: Dict[str, Any], result: Any):
        """Analyze an interaction to detect patterns"""
        try:
            # Track the command
            self.sequence_tracker.append({
                'code': code,
                'type': parsed_ast.get('type', 'unknown'),
                'timestamp': datetime.now().isoformat()
            })
            
            # Keep only last 100 commands
            if len(self.sequence_tracker) > 100:
                self.sequence_tracker = self.sequence_tracker[-100:]
            
            # Detect patterns based on AST type
            ast_type = parsed_ast.get('type', '')
            
            if ast_type == 'if_statement':
                self._analyze_if_pattern(code, parsed_ast)
            elif ast_type == 'assignment':
                self._analyze_assignment_pattern(code, parsed_ast)
            elif ast_type == 'function_call':
                self._analyze_function_call_pattern(code, parsed_ast)
                
            # Track variable usage patterns
            self._track_variable_usage(parsed_ast)
            
            # Detect sequence patterns
            self._detect_sequence_patterns()
            
            # Persist patterns periodically (every 5 interactions)
            if len(self.sequence_tracker) % 5 == 0:
                self._persist_patterns()
            
        except Exception as e:
            self.logger.debug(f"Pattern analysis error: {e}")
            
    def _analyze_if_pattern(self, code: str, ast: Dict[str, Any]):
        """Analyze if statement patterns"""
        condition = ast.get('condition', {})
        
        # Extract structural elements
        structure = self._extract_if_structure(condition, ast)
        pattern_id = f"if_{structure}"
        
        if pattern_id not in self.patterns:
            self.patterns[pattern_id] = StructuralPattern('if_statement', structure)
            
        self.patterns[pattern_id].add_example({
            'code': code,
            'condition_type': condition.get('type', ''),
            'has_else': ast.get('else_branch') is not None
        })
        
    def _extract_if_structure(self, condition: Dict[str, Any], ast: Dict[str, Any]) -> str:
        """Extract abstract structure from if statement"""
        structures = []
        
        # Condition structure
        if condition.get('type') == 'binary_op':
            left_type = self._get_node_type(condition.get('left', {}))
            right_type = self._get_node_type(condition.get('right', {}))
            op = condition.get('operator', '?')
            structures.append(f"{left_type}_{op}_{right_type}")
        else:
            structures.append(condition.get('type', 'unknown'))
            
        # Action structure
        then_branch = ast.get('then_branch', {})
        if then_branch:
            then_type = then_branch.get('type', 'unknown')
            structures.append(f"then_{then_type}")
            
        if ast.get('else_branch'):
            structures.append("with_else")
            
        return "_".join(structures)
        
    def _get_node_type(self, node: Dict[str, Any]) -> str:
        """Get simplified node type"""
        node_type = node.get('type', 'unknown')
        if node_type == 'identifier':
            return 'var'
        elif node_type == 'literal':
            value_type = type(node.get('value', '')).__name__
            if value_type in ['int', 'float']:
                return 'num'
            elif value_type == 'str':
                return 'str'
            else:
                return value_type
        else:
            return node_type
            
    def _analyze_assignment_pattern(self, code: str, ast: Dict[str, Any]):
        """Analyze assignment patterns"""
        var_name = ast.get('variable', '')
        value_node = ast.get('expression', {}) or ast.get('value', {})
        
        # Track naming patterns
        self._analyze_variable_name(var_name)
        
        # Track assignment patterns
        value_type = self._get_node_type(value_node)
        pattern_id = f"assign_{value_type}"
        
        if pattern_id not in self.patterns:
            self.patterns[pattern_id] = StructuralPattern('assignment', f"var = {value_type}")
            
        self.patterns[pattern_id].add_example({'code': code, 'variable': var_name})
        
    def _analyze_variable_name(self, var_name: str):
        """Analyze variable naming patterns"""
        if not var_name:
            return
            
        # Detect casing style
        if '_' in var_name:
            self.naming_patterns['snake_case'] += 1
        elif var_name != var_name.lower() and var_name != var_name.upper():
            if var_name[0].isupper():
                self.naming_patterns['PascalCase'] += 1
            else:
                self.naming_patterns['camelCase'] += 1
        elif var_name.isupper():
            self.naming_patterns['UPPER_CASE'] += 1
        else:
            self.naming_patterns['lowercase'] += 1
            
        # Track common prefixes/suffixes
        if var_name.startswith(('tmp_', 'temp_', '_')):
            self.naming_patterns['temp_prefix'] += 1
        if var_name.endswith(('_count', '_total', '_sum')):
            self.naming_patterns['aggregate_suffix'] += 1
            
    def _analyze_function_call_pattern(self, code: str, ast: Dict[str, Any]):
        """Analyze function call patterns"""
        func_name = ast.get('name', '')
        arg_count = len(ast.get('arguments', []))
        
        pattern_id = f"call_{func_name}_args{arg_count}"
        
        if pattern_id not in self.patterns:
            self.patterns[pattern_id] = StructuralPattern(
                'function_call', 
                f"{func_name}({arg_count} args)"
            )
            
        self.patterns[pattern_id].add_example({'code': code})
        
    def _track_variable_usage(self, ast: Dict[str, Any]):
        """Track how variables are used in the code"""
        # Recursively find all variable references
        variables = self._extract_variables(ast)
        
        for var_name, context in variables:
            self.variable_usage[var_name].append({
                'context': context,
                'timestamp': datetime.now().isoformat()
            })
            
    def _extract_variables(self, node: Dict[str, Any], context: str = '') -> List[Tuple[str, str]]:
        """Recursively extract variable references"""
        variables = []
        
        if isinstance(node, dict):
            if node.get('type') == 'identifier':
                var_name = node.get('name', '')
                if var_name:
                    variables.append((var_name, context))
                    
            # Recurse through child nodes
            for key, value in node.items():
                if key in ['left', 'right', 'expression', 'value', 'condition', 
                          'then_branch', 'else_branch', 'arguments']:
                    child_context = f"{context}.{key}" if context else key
                    if isinstance(value, dict):
                        variables.extend(self._extract_variables(value, child_context))
                    elif isinstance(value, list):
                        for item in value:
                            if isinstance(item, dict):
                                variables.extend(self._extract_variables(item, child_context))
                                
        return variables
        
    def _detect_sequence_patterns(self):
        """Detect common command sequences"""
        if len(self.sequence_tracker) < 2:
            return
            
        # Look for common pairs
        for i in range(len(self.sequence_tracker) - 1):
            cmd1 = self.sequence_tracker[i]
            cmd2 = self.sequence_tracker[i + 1]
            
            # Pattern: assignment followed by condition check
            if (cmd1['type'] == 'assignment' and 
                cmd2['type'] == 'if_statement'):
                # Extract variable from assignment and condition
                # This is a common pattern worth tracking
                pattern_id = 'assign_then_check'
                if pattern_id not in self.patterns:
                    self.patterns[pattern_id] = StructuralPattern(
                        'sequence',
                        'assignment -> if_statement'
                    )
                self.patterns[pattern_id].add_example({
                    'cmd1': cmd1['code'],
                    'cmd2': cmd2['code']
                })
                
    def get_suggestions(self, current_code: str, current_ast: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get suggestions based on learned patterns"""
        suggestions = []
        
        # Based on current AST type, suggest likely next commands
        ast_type = current_ast.get('type', '')
        
        if ast_type == 'assignment':
            # Look for assign_then_check pattern
            if 'assign_then_check' in self.patterns:
                pattern = self.patterns['assign_then_check']
                if pattern.usage_count > 2:  # Used at least 3 times
                    suggestions.append({
                        'type': 'next_command',
                        'suggestion': 'Consider checking the variable with an if statement',
                        'confidence': min(0.9, pattern.usage_count / 10.0)
                    })
                    
        # Suggest based on naming patterns
        if self.naming_patterns:
            most_common_style = self.naming_patterns.most_common(1)[0][0]
            suggestions.append({
                'type': 'style',
                'suggestion': f'Your preferred naming style appears to be {most_common_style}',
                'confidence': 0.7
            })
            
        return suggestions
        
    def get_pattern_summary(self) -> Dict[str, Any]:
        """Get summary of learned patterns"""
        return {
            'total_patterns': len(self.patterns),
            'pattern_types': Counter(p.pattern_type for p in self.patterns.values()),
            'most_used_patterns': sorted(
                [(pid, p.usage_count) for pid, p in self.patterns.items()],
                key=lambda x: x[1],
                reverse=True
            )[:10],
            'naming_styles': dict(self.naming_patterns),
            'common_variables': sorted(
                [(var, len(uses)) for var, uses in self.variable_usage.items()],
                key=lambda x: x[1],
                reverse=True
            )[:10],
            'sequence_count': len(self.sequence_tracker)
        }
        
    def _persist_patterns(self):
        """Persist learned patterns to database"""
        if not self.knowledge_base:
            return
            
        try:
            # Store each pattern with high usage
            for pattern_id, pattern in self.patterns.items():
                if pattern.usage_count >= 2:  # Only persist patterns used at least twice
                    # Create pattern data for storage
                    pattern_data = {
                        'name': f'auto_{pattern_id}',
                        'pattern': pattern.structure,
                        'template': pattern.structure,
                        'description': f'Auto-detected {pattern.pattern_type} pattern',
                        'category': pattern.pattern_type,
                        'usage_count': pattern.usage_count,
                        'examples': json.dumps(pattern.examples[-3:]),  # Keep last 3 examples
                        'metadata': json.dumps({
                            'auto_detected': True,
                            'last_seen': pattern.last_seen.isoformat() if pattern.last_seen else None,
                            'variations': dict(pattern.variations)
                        })
                    }
                    
                    # Store through knowledge base
                    self.knowledge_base.store_pattern(
                        f'auto_{pattern_id}',
                        pattern.structure,
                        json.dumps(pattern_data)
                    )
                    
            self.logger.debug(f"Persisted {len(self.patterns)} patterns to database")
        except Exception as e:
            self.logger.debug(f"Failed to persist patterns: {e}")