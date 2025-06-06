#!/usr/bin/env python3
"""
Database Access Checker
Ensures only Ermis-Cronos hierarchy accesses the database
"""

import os
import sys
import re
from pathlib import Path


def check_file_for_violations(file_path, relative_path):
    """Check a single file for database access violations"""
    violations = []
    
    # Skip allowed files
    allowed_files = [
        'ermis/ermis_database_adapter.py',
        'common/migrate_databases.py',
        'ades/',  # Test files are lower priority
        '__pycache__',
        '.pyc'
    ]
    
    # Check if this is an allowed file
    for allowed in allowed_files:
        if allowed in str(relative_path):
            return []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
        # Check for forbidden patterns
        forbidden_patterns = [
            (r'import\s+sqlite3', 'Direct SQLite import'),
            (r'from\s+sqlite3', 'Direct SQLite import'),
            (r'from\s+.*cronos_database\s+import', 'Direct CronosDB import'),
            (r'from\s+.*athena_knowledge_base\s+import\s+KnowledgeBase', 'Direct KnowledgeBase import'),
            (r'CronosDB\s*\(', 'Direct CronosDB instantiation'),
            (r'(?<!Unified)KnowledgeBase\s*\(', 'Direct KnowledgeBase instantiation'),  # Allow UnifiedKnowledgeBase
            (r'\.connect\s*\([\'"].*\.db', 'Direct database connection'),
            (r'sqlite3\.connect', 'Direct SQLite connection'),
        ]
        
        for i, line in enumerate(lines, 1):
            # Skip commented lines
            stripped_line = line.strip()
            if stripped_line.startswith('#'):
                continue
                
            for pattern, description in forbidden_patterns:
                if re.search(pattern, line):
                    violations.append({
                        'file': relative_path,
                        'line': i,
                        'violation': description,
                        'code': line.strip()
                    })
                    
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        
    return violations


def check_database_access():
    """Check all Python files for database access violations"""
    print("Database Access Violation Checker")
    print("=" * 70)
    print("\nChecking for components that directly access the database...")
    print("(Only Ermis-Cronos hierarchy should access memory.db)\n")
    
    # Get the core directory
    core_dir = Path(__file__).parent.parent
    
    all_violations = []
    files_checked = 0
    
    # Check all Python files
    for py_file in core_dir.rglob('*.py'):
        # Skip virtual environment
        if 'zeus_env' in str(py_file):
            continue
            
        files_checked += 1
        relative_path = py_file.relative_to(core_dir)
        violations = check_file_for_violations(py_file, relative_path)
        all_violations.extend(violations)
    
    # Group violations by file
    violations_by_file = {}
    for v in all_violations:
        file_path = v['file']
        if file_path not in violations_by_file:
            violations_by_file[file_path] = []
        violations_by_file[file_path].append(v)
    
    # Report results
    if violations_by_file:
        print(f"❌ Found {len(all_violations)} violations in {len(violations_by_file)} files:\n")
        
        # Separate production and test violations
        prod_violations = {}
        test_violations = {}
        
        for file_path, violations in violations_by_file.items():
            if 'ades/' in str(file_path) or 'test' in str(file_path):
                test_violations[file_path] = violations
            else:
                prod_violations[file_path] = violations
        
        # Report production violations (high priority)
        if prod_violations:
            print("🚨 PRODUCTION CODE VIOLATIONS (Must Fix):")
            print("-" * 70)
            for file_path, violations in sorted(prod_violations.items()):
                print(f"\n📄 {file_path}")
                for v in violations:
                    print(f"   Line {v['line']}: {v['violation']}")
                    print(f"   Code: {v['code']}")
        
        # Report test violations (lower priority)
        if test_violations:
            print("\n⚠️  TEST CODE VIOLATIONS (Lower Priority):")
            print("-" * 70)
            for file_path, violations in sorted(test_violations.items()):
                print(f"\n📄 {file_path}")
                for v in violations:
                    print(f"   Line {v['line']}: {v['violation']}")
    else:
        print(f"✅ Success! No database access violations found.")
        print(f"   Checked {files_checked} Python files.")
    
    print("\n" + "=" * 70)
    print("Summary:")
    print(f"  Files checked: {files_checked}")
    print(f"  Total violations: {len(all_violations)}")
    print(f"  Production violations: {sum(len(v) for v in prod_violations.values())}")
    print(f"  Test violations: {sum(len(v) for v in test_violations.values())}")
    
    # Check for memory.db location
    print("\n" + "=" * 70)
    print("Database Status:")
    
    memory_db = core_dir / "cronos" / "memory.db"
    if memory_db.exists():
        size = memory_db.stat().st_size / 1024  # KB
        print(f"  ✅ memory.db exists at: {memory_db}")
        print(f"     Size: {size:.1f} KB")
    else:
        print(f"  ❌ memory.db not found at: {memory_db}")
    
    # Check for old databases
    old_dbs = [
        core_dir.parent / "data" / "cronos.db",
        core_dir.parent / "data" / "zeus.db"
    ]
    
    print("\n  Old databases:")
    for db_path in old_dbs:
        if db_path.exists():
            print(f"  ❌ {db_path.name} still exists at: {db_path}")
            print(f"     This should be removed!")
        else:
            print(f"  ✅ {db_path.name} has been removed")
    
    print("\n" + "=" * 70)
    
    # Return exit code based on production violations
    return 0 if not prod_violations else 1


if __name__ == "__main__":
    exit_code = check_database_access()
    sys.exit(exit_code)