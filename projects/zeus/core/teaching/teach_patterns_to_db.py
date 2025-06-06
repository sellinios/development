#!/usr/bin/env python3
"""
Teach patterns directly to the database, bypassing Ermis
"""

import os
import sys
import re
import sqlite3
import json
from datetime import datetime

# Add paths
script_dir = os.path.dirname(os.path.abspath(__file__))
core_dir = os.path.dirname(script_dir)  # Go up one level to core/
project_root = os.path.dirname(core_dir)  # Go up one more level to project root
sys.path.insert(0, project_root)
sys.path.insert(0, core_dir)

def parse_teach_pattern(pattern_str):
    """Parse a teach pattern string"""
    # Pattern: teach: name {params} -> {implementation} : description
    match = re.match(r'teach:\s*(\w+)\s*\{([^}]*)\}\s*->\s*\{([^}]*)\}\s*:\s*(.*)', pattern_str)
    if match:
        name = match.group(1)
        params = [p.strip() for p in match.group(2).split(',') if p.strip()]
        implementation = match.group(3).strip()
        description = match.group(4).strip()
        return name, params, implementation, description
    return None, None, None, None

def main():
    print("🎓 Teaching Patterns Directly to Database")
    print("=" * 50)
    
    # Connect to database
    db_path = os.path.join(project_root, 'data', 'memory.db')
    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return 1
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current patterns
    cursor.execute("SELECT COUNT(*) FROM patterns")
    current_count = cursor.fetchone()[0]
    print(f"Current patterns in database: {current_count}")
    
    # Get existing pattern names
    cursor.execute("SELECT name FROM patterns")
    existing_patterns = {row[0] for row in cursor.fetchall()}
    
    # Read teach.txt from same directory as script
    teach_file = os.path.join(script_dir, 'teach.txt')
    if not os.path.exists(teach_file):
        print(f"❌ teach.txt not found at {teach_file}")
        return 1
    
    with open(teach_file, 'r') as f:
        lines = f.readlines()
    
    # Parse patterns
    patterns_to_add = []
    for line in lines:
        line = line.strip()
        if line.startswith('teach:') and '->' in line:
            name, params, implementation, description = parse_teach_pattern(line)
            if name and name not in existing_patterns:
                patterns_to_add.append({
                    'name': name,
                    'params': params,
                    'implementation': implementation,
                    'description': description,
                    'template': f"{name}({', '.join(params)})"
                })
    
    print(f"\nPatterns to add: {len(patterns_to_add)}")
    
    # Add patterns to database
    success_count = 0
    for pattern in patterns_to_add:
        try:
            # Prepare metadata
            metadata = {
                'description': pattern['description'],
                'parameters': pattern['params'],
                'category': 'taught'
            }
            
            cursor.execute("""
                INSERT INTO patterns (name, pattern, implementation, 
                                    created_at, usage_count, success_rate, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                pattern['name'],
                pattern['template'],
                pattern['implementation'],
                datetime.now().isoformat(),
                0,
                0.0,
                json.dumps(metadata)
            ))
            
            success_count += 1
            print(f"✅ Added: {pattern['name']}")
            
        except Exception as e:
            print(f"❌ Failed to add {pattern['name']}: {e}")
    
    # Commit changes
    conn.commit()
    
    # Verify
    cursor.execute("SELECT COUNT(*) FROM patterns")
    new_count = cursor.fetchone()[0]
    
    print(f"\n" + "=" * 50)
    print(f"✅ Successfully added {success_count} patterns")
    print(f"📊 Total patterns in database: {new_count}")
    
    # Show some examples
    print(f"\nSample patterns in database:")
    cursor.execute("SELECT name, pattern FROM patterns ORDER BY name LIMIT 10")
    for name, pattern in cursor.fetchall():
        print(f"  - {name}: {pattern}")
    
    conn.close()
    
    print(f"\n✨ Done! Patterns are now permanently stored in the database.")

if __name__ == "__main__":
    sys.exit(main())