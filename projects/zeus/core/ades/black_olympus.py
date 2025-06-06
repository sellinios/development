#!/usr/bin/env python3
"""
Black Olympus - Divine Separation Test
Ensures gods maintain proper boundaries and communicate only through Ermis
Now also tests Olympus routing system
"""

import os
import sys
import ast
import importlib.util
from pathlib import Path
from typing import Set, Dict, List, Tuple

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Olympus for testing
from ermis.ermis_olympus import olympus, Domain

class OlympusInspector:
    """Inspects the divine assembly for proper separation"""
    
    def __init__(self):
        self.core_dir = Path(__file__).parent.parent
        self.zeus_root = self.core_dir.parent
        self.gods = ["zeus", "athena", "cronos", "lightning"]
        self.violations = []
        self.ermis_usage = {}
        
    def check_imports(self, file_path: Path, god_name: str) -> List[str]:
        """Check if a file imports other gods directly"""
        violations = []
        
        try:
            with open(file_path, 'r') as f:
                tree = ast.parse(f.read(), filename=str(file_path))
                
            for node in ast.walk(tree):
                # Check import statements
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        for other_god in self.gods:
                            if other_god != god_name and other_god in alias.name:
                                violations.append(
                                    f"{file_path.name}: Direct import of {other_god} "
                                    f"(import {alias.name})"
                                )
                                
                # Check from imports
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        # Skip relative imports (they're within the same god)
                        if node.level > 0:  # Relative import
                            continue
                            
                        for other_god in self.gods:
                            if other_god != god_name:
                                # Check if it's actually importing from another god's directory
                                # Not just a file that contains the god's name
                                if (node.module == other_god or 
                                    node.module.startswith(f"{other_god}.") or
                                    (other_god in node.module and f"{god_name}_{other_god}" not in node.module)):
                                    imported_items = [alias.name for alias in node.names]
                                    violations.append(
                                        f"{file_path.name}: Direct import from {other_god} "
                                        f"(from {node.module} import {', '.join(imported_items)})"
                                    )
                                
        except Exception as e:
            violations.append(f"{file_path.name}: Error parsing file - {e}")
            
        return violations
    
    def check_ermis_usage(self, file_path: Path, god_name: str) -> Dict[str, List[str]]:
        """Check if the file uses Ermis for communication"""
        ermis_imports = []
        ermis_calls = []
        
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                tree = ast.parse(content, filename=str(file_path))
                
            for node in ast.walk(tree):
                # Check for Ermis imports
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if 'ermis' in alias.name.lower():
                            ermis_imports.append(alias.name)
                            
                elif isinstance(node, ast.ImportFrom):
                    if node.module and 'ermis' in node.module.lower():
                        imported_items = [alias.name for alias in node.names]
                        ermis_imports.extend(imported_items)
                
                # Check for send/receive patterns
                elif isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Attribute):
                        if node.func.attr in ['send', 'receive', 'send_message', 'receive_message']:
                            # Get line number for context
                            line_num = getattr(node, 'lineno', 0)
                            ermis_calls.append(f"Line {line_num}: {node.func.attr}()")
                            
        except Exception as e:
            pass
            
        return {
            'imports': ermis_imports,
            'calls': ermis_calls
        }
    
    def inspect_god(self, god_name: str) -> Tuple[List[str], Dict[str, Dict]]:
        """Inspect a god's directory for violations"""
        god_dir = self.core_dir / god_name
        violations = []
        ermis_usage = {}
        
        if not god_dir.exists():
            return violations, ermis_usage
            
        # Check all Python files in the god's directory
        for py_file in god_dir.glob("*.py"):
            # Skip __init__.py and ermis files
            if py_file.name in ['__init__.py', 'ermis_receiver.py', 'ermis_sender.py']:
                continue
                
            # Check for direct imports of other gods
            file_violations = self.check_imports(py_file, god_name)
            violations.extend(file_violations)
            
            # Check for Ermis usage
            usage = self.check_ermis_usage(py_file, god_name)
            if usage['imports'] or usage['calls']:
                ermis_usage[py_file.name] = usage
                
        return violations, ermis_usage
    
    def check_ermis_files(self) -> Dict[str, bool]:
        """Verify each god has proper Ermis files"""
        ermis_status = {}
        
        for god in self.gods:
            god_dir = self.core_dir / god
            receiver_exists = (god_dir / "ermis_receiver.py").exists()
            sender_exists = (god_dir / "ermis_sender.py").exists()
            
            ermis_status[god] = {
                'receiver': receiver_exists,
                'sender': sender_exists,
                'complete': receiver_exists and sender_exists
            }
            
        return ermis_status
    
    def test_olympus_routing(self) -> Tuple[bool, List[str]]:
        """Test the Olympus routing system"""
        issues = []
        
        # Test request type mappings
        test_requests = [
            {'type': 'parse_expression', 'expected': 'zeus'},
            {'type': 'nlp_request', 'expected': 'athena'},
            {'type': 'store_variable', 'expected': 'cronos'},
            {'type': 'optimize_code', 'expected': 'lightning'},
            {'type': 'unknown_type', 'expected_fallback': True}
        ]
        
        for test in test_requests:
            primary, _ = olympus.route_request(test)
            if 'expected' in test and primary != test['expected']:
                issues.append(f"Request type '{test['type']}' routed to {primary}, expected {test['expected']}")
            elif 'expected_fallback' in test and primary is None:
                issues.append(f"Request type '{test['type']}' has no routing")
                
        # Test domain responsibilities
        expected_domains = {
            'zeus': [Domain.LANGUAGE, Domain.EVALUATION],
            'athena': [Domain.INTELLIGENCE, Domain.NLP],
            'cronos': [Domain.TIME, Domain.DATABASE, Domain.KNOWLEDGE, Domain.PATTERNS],
            'lightning': [Domain.PERFORMANCE, Domain.CACHE, Domain.COMPILATION]
        }
        
        for god, expected in expected_domains.items():
            actual_domains = olympus.get_god_domains(god)
            for domain in expected:
                if domain not in actual_domains:
                    issues.append(f"{god} should handle {domain.value} domain")
                    
        return len(issues) == 0, issues
        
    def check_olympus_usage(self, file_path: Path) -> Dict[str, List[str]]:
        """Check if file uses Olympus routing methods"""
        olympus_calls = []
        
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                tree = ast.parse(content, filename=str(file_path))
                
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if isinstance(node.func, ast.Attribute):
                        # Check for Olympus routing methods
                        if node.func.attr in ['request', 'request_and_wait']:
                            line_num = getattr(node, 'lineno', 0)
                            olympus_calls.append(f"Line {line_num}: {node.func.attr}()")
                            
        except Exception:
            pass
            
        return {'olympus_calls': olympus_calls}
    
    def check_data_separation(self) -> Tuple[bool, List[str]]:
        """Check that runtime data is not in core directory"""
        issues = []
        
        # Check for database files in core
        for db_file in self.core_dir.rglob("*.db"):
            issues.append(f"Database file found in core: {db_file.relative_to(self.core_dir)}")
            
        # Check for cache directories in core (except test cache)
        cache_dirs = ["cache", "compiled", "bytecode", "llvm", "jit", "native"]
        for cache_dir in cache_dirs:
            for found_dir in self.core_dir.rglob(cache_dir):
                if "test" not in str(found_dir).lower():
                    issues.append(f"Cache directory found in core: {found_dir.relative_to(self.core_dir)}")
                    
        # Check that data directory exists in zeus root
        data_dir = self.zeus_root / "data"
        if not data_dir.exists():
            issues.append("Data directory not found in zeus root")
        else:
            # Check data directory structure
            expected_structure = {
                "cronos.db": "file",
                "lightning": "dir",
                "lightning/cache": "dir",
                "lightning/compiled": "dir",
                "lightning/bytecode": "dir",
                "lightning/llvm": "dir",
                "lightning/jit": "dir",
                "lightning/native": "dir"
            }
            
            for path, expected_type in expected_structure.items():
                full_path = data_dir / path
                if expected_type == "file":
                    # File doesn't need to exist but directory should
                    pass
                elif expected_type == "dir":
                    if not full_path.exists():
                        issues.append(f"Missing data directory: data/{path}")
                        
        return len(issues) == 0, issues
    
    def run_inspection(self):
        """Run the complete Olympus inspection"""
        print("=" * 60)
        print("⚡ BLACK OLYMPUS - Divine Separation Test ⚡")
        print("=" * 60)
        
        all_violations = []
        all_ermis_usage = {}
        
        # Check each god
        print("\n🔍 Inspecting Divine Boundaries...")
        for god in self.gods:
            violations, ermis_usage = self.inspect_god(god)
            if violations:
                all_violations.extend(violations)
            if ermis_usage:
                all_ermis_usage[god] = ermis_usage
                
        # Check Ermis files
        print("\n📨 Checking Ermis Communication System...")
        ermis_status = self.check_ermis_files()
        
        # Report violations
        if all_violations:
            print("\n❌ VIOLATIONS FOUND:")
            print("-" * 40)
            for violation in all_violations:
                print(f"  ⚠️  {violation}")
        else:
            print("\n✅ No direct god-to-god imports found!")
            
        # Report Ermis status
        print("\n📊 Ermis Communication Status:")
        print("-" * 40)
        for god, status in ermis_status.items():
            if status['complete']:
                print(f"  ✅ {god.upper()}: Has both receiver and sender")
            else:
                missing = []
                if not status['receiver']:
                    missing.append("receiver")
                if not status['sender']:
                    missing.append("sender")
                print(f"  ❌ {god.upper()}: Missing {', '.join(missing)}")
                
        # Report Ermis usage
        if all_ermis_usage:
            print("\n💬 Ermis Usage Detected:")
            print("-" * 40)
            for god, files in all_ermis_usage.items():
                print(f"\n  {god.upper()}:")
                for filename, usage in files.items():
                    print(f"    📄 {filename}:")
                    if usage['imports']:
                        print(f"      • Imports: {', '.join(usage['imports'])}")
                    if usage['calls']:
                        for call in usage['calls'][:3]:  # Show first 3 calls
                            print(f"      • {call}")
                        if len(usage['calls']) > 3:
                            print(f"      • ... and {len(usage['calls']) - 3} more calls")
                            
        # Test Olympus routing
        print("\n⚡ Testing Olympus Routing System...")
        print("-" * 40)
        olympus_passed, routing_issues = self.test_olympus_routing()
        
        if olympus_passed:
            print("  ✅ Olympus routing is correctly configured")
        else:
            print("  ❌ Olympus routing issues found:")
            for issue in routing_issues:
                print(f"     • {issue}")
                
        # Check for Olympus usage
        olympus_usage = {}
        for god in self.gods:
            god_dir = self.core_dir / god
            if god_dir.exists():
                for py_file in god_dir.glob("*.py"):
                    usage = self.check_olympus_usage(py_file)
                    if usage['olympus_calls']:
                        if god not in olympus_usage:
                            olympus_usage[god] = {}
                        olympus_usage[god][py_file.name] = usage
                        
        if olympus_usage:
            print("\n🏛️  Olympus Routing Usage:")
            print("-" * 40)
            for god, files in olympus_usage.items():
                print(f"\n  {god.upper()}:")
                for filename, usage in files.items():
                    print(f"    📄 {filename}:")
                    for call in usage['olympus_calls']:
                        print(f"      • {call}")
                        
        # Test data separation
        print("\n📂 Testing Data Directory Separation...")
        print("-" * 40)
        data_passed, data_issues = self.check_data_separation()
        
        if data_passed:
            print("  ✅ Runtime data properly separated from core")
        else:
            print("  ❌ Data separation issues found:")
            for issue in data_issues:
                print(f"     • {issue}")
                            
        # Final verdict
        print("\n" + "=" * 60)
        if not all_violations and all(s['complete'] for s in ermis_status.values()) and olympus_passed and data_passed:
            print("✅ OLYMPUS TEST PASSED - Divine separation maintained!")
            print("   All gods communicate properly through Ermis.")
            print("   Olympus routing system is properly configured.")
            print("   Runtime data properly separated from core.")
            return True
        else:
            print("❌ OLYMPUS TEST FAILED - Divine order violated!")
            if all_violations:
                print(f"   Found {len(all_violations)} direct import violations.")
            incomplete_gods = [g for g, s in ermis_status.items() if not s['complete']]
            if incomplete_gods:
                print(f"   Gods missing Ermis files: {', '.join(incomplete_gods)}")
            if not olympus_passed:
                print(f"   Olympus routing has {len(routing_issues)} issues.")
            if not data_passed:
                print(f"   Data separation has {len(data_issues)} issues.")
            return False


def main():
    """Run the Black Olympus test"""
    inspector = OlympusInspector()
    success = inspector.run_inspection()
    
    print("\n💡 Remember:")
    print("   • Gods must not import each other directly")
    print("   • All communication must go through Ermis")
    print("   • Each god needs ermis_receiver.py and ermis_sender.py")
    print("   • Olympus routes requests based on domain knowledge")
    print("   • Gods can send requests without knowing the target")
    print("   • Runtime data belongs in data/, not in core/")
    print("=" * 60)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()