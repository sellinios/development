#!/usr/bin/env python3
"""
Black - Python code standards checker for Zeus framework
"""

import ast
import os
import sys
from typing import List, Tuple, Dict, Any
import re


class CodeStandardsChecker:
    """Check Python code against Zeus framework standards"""
    
    def __init__(self):
        self.errors = []
        self.warnings = []
        
    def check_file(self, filepath: str) -> Tuple[List[str], List[str]]:
        """Check a single Python file for standards compliance"""
        self.errors = []
        self.warnings = []
        
        with open(filepath, 'r') as f:
            content = f.read()
            
        # Parse AST
        try:
            tree = ast.parse(content)
        except SyntaxError as e:
            self.errors.append(f"Syntax error in {filepath}: {e}")
            return self.errors, self.warnings
            
        # Run checks
        self._check_imports(tree, filepath)
        self._check_naming_conventions(tree, filepath)
        self._check_docstrings(tree, filepath)
        self._check_line_length(content, filepath)
        self._check_whitespace(content, filepath)
        self._check_type_hints(tree, filepath)
        
        return self.errors, self.warnings
    
    def _check_imports(self, tree: ast.AST, filepath: str):
        """Check import statements are properly organized"""
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                imports.append(node)
        
        # Check import grouping
        if imports:
            last_import_type = None
            for imp in imports:
                if isinstance(imp, ast.ImportFrom) and imp.module:
                    if imp.module.startswith('.'):
                        import_type = 'relative'
                    elif any(imp.module.startswith(m) for m in ['zeus', 'athena', 'cronos', 'ermis', 'lightning']):
                        import_type = 'internal'
                    else:
                        import_type = 'external'
                else:
                    import_type = 'standard'
                
                if last_import_type and import_type != last_import_type:
                    if (last_import_type, import_type) not in [('standard', 'external'), ('external', 'internal'), ('internal', 'relative')]:
                        self.warnings.append(f"{filepath}:{imp.lineno}: Import groups should be ordered: standard, external, internal, relative")
                
                last_import_type = import_type
    
    def _check_naming_conventions(self, tree: ast.AST, filepath: str):
        """Check naming conventions"""
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                if not re.match(r'^[A-Z][a-zA-Z0-9]*$', node.name):
                    self.errors.append(f"{filepath}:{node.lineno}: Class '{node.name}' should use CamelCase")
            
            elif isinstance(node, ast.FunctionDef):
                if not re.match(r'^[a-z_][a-z0-9_]*$', node.name):
                    self.errors.append(f"{filepath}:{node.lineno}: Function '{node.name}' should use snake_case")
            
            elif isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
                # Check for constants
                parent = getattr(node, 'parent', None)
                if parent and isinstance(parent, ast.Assign):
                    if node.id.isupper() and not re.match(r'^[A-Z][A-Z0-9_]*$', node.id):
                        self.errors.append(f"{filepath}:{node.lineno}: Constant '{node.id}' should use UPPER_CASE")
    
    def _check_docstrings(self, tree: ast.AST, filepath: str):
        """Check for missing docstrings"""
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
                if not ast.get_docstring(node):
                    self.warnings.append(f"{filepath}:{node.lineno}: Missing docstring for '{node.name}'")
    
    def _check_line_length(self, content: str, filepath: str):
        """Check line length (max 120 characters)"""
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            if len(line) > 120:
                self.warnings.append(f"{filepath}:{i}: Line exceeds 120 characters ({len(line)} chars)")
    
    def _check_whitespace(self, content: str, filepath: str):
        """Check whitespace issues"""
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            if line.endswith(' '):
                self.warnings.append(f"{filepath}:{i}: Trailing whitespace")
            
            if '\t' in line:
                self.errors.append(f"{filepath}:{i}: Tab character found (use spaces)")
    
    def _check_type_hints(self, tree: ast.AST, filepath: str):
        """Check for missing type hints"""
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                # Skip __init__ and private methods
                if node.name.startswith('_'):
                    continue
                
                # Check return type hint
                if not node.returns:
                    self.warnings.append(f"{filepath}:{node.lineno}: Missing return type hint for '{node.name}'")
                
                # Check parameter type hints
                for arg in node.args.args:
                    if not arg.annotation and arg.arg != 'self':
                        self.warnings.append(f"{filepath}:{node.lineno}: Missing type hint for parameter '{arg.arg}' in '{node.name}'")


def check_directory(directory: str) -> Dict[str, Tuple[List[str], List[str]]]:
    """Check all Python files in a directory"""
    checker = CodeStandardsChecker()
    results = {}
    
    for root, dirs, files in os.walk(directory):
        # Skip __pycache__ and other hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
        
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                errors, warnings = checker.check_file(filepath)
                if errors or warnings:
                    results[filepath] = (errors, warnings)
    
    return results


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python black.py <directory_or_file>")
        sys.exit(1)
    
    target = sys.argv[1]
    
    if os.path.isfile(target):
        checker = CodeStandardsChecker()
        errors, warnings = checker.check_file(target)
        
        if errors:
            print("ERRORS:")
            for error in errors:
                print(f"  {error}")
        
        if warnings:
            print("\nWARNINGS:")
            for warning in warnings:
                print(f"  {warning}")
        
        if not errors and not warnings:
            print("✓ No issues found")
    
    elif os.path.isdir(target):
        results = check_directory(target)
        
        if results:
            total_errors = 0
            total_warnings = 0
            
            for filepath, (errors, warnings) in results.items():
                print(f"\n{filepath}:")
                
                if errors:
                    print("  ERRORS:")
                    for error in errors:
                        print(f"    {error}")
                    total_errors += len(errors)
                
                if warnings:
                    print("  WARNINGS:")
                    for warning in warnings:
                        print(f"    {warning}")
                    total_warnings += len(warnings)
            
            print(f"\nTotal: {total_errors} errors, {total_warnings} warnings")
        else:
            print("✓ No issues found")
    
    else:
        print(f"Error: {target} is not a valid file or directory")
        sys.exit(1)


if __name__ == '__main__':
    main()