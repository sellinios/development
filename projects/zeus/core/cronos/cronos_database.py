"""
Cronos Database - Legacy database implementation

DEPRECATED: This module is being phased out in favor of ErmisDatabaseAdapter.
New code should use cronos_unified.py which goes through Ermis.

NOTE: This module has direct database access which was allowed ONLY because
it's part of the Cronos module. All other modules must access the database
through Ermis messaging, not by importing this module directly.

The proper flow is: Component -> Ermis -> Olympus -> Cronos -> ErmisDatabaseAdapter
"""

import sqlite3
import json
import pickle
from typing import Any, Dict, List, Optional
from pathlib import Path
from datetime import datetime
from .cronos_models import Variable, Concept, Relation, CompiledCode

class CronosDB:
    """Main database interface for Cronos"""
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            # Default to memory.db in data folder
            import os
            zeus_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(zeus_root, "data")
            os.makedirs(data_dir, exist_ok=True)
            db_path = os.path.join(data_dir, "memory.db")
            
        self.db_path = db_path
        self.conn = None
        self._init_database()
        
    def _init_database(self):
        """Initialize database tables"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        
        # Variables table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS variables (
                name TEXT PRIMARY KEY,
                value BLOB,
                type TEXT,
                scope TEXT DEFAULT 'global',
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                metadata TEXT
            )
        """)
        
        # Concepts table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS concepts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                attributes TEXT,
                relationships TEXT,
                created_at TIMESTAMP,
                confidence REAL DEFAULT 1.0
            )
        """)
        
        # Relations table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS relations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id TEXT,
                target_id TEXT,
                relation_type TEXT,
                strength REAL DEFAULT 1.0,
                bidirectional INTEGER DEFAULT 0,
                metadata TEXT,
                created_at TIMESTAMP,
                FOREIGN KEY (source_id) REFERENCES concepts(id),
                FOREIGN KEY (target_id) REFERENCES concepts(id)
            )
        """)
        
        # Compiled code references
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS compiled_code (
                id TEXT PRIMARY KEY,
                source_code TEXT,
                lightning_ref TEXT,
                optimization_level INTEGER,
                created_at TIMESTAMP,
                execution_count INTEGER DEFAULT 0,
                average_runtime REAL DEFAULT 0.0
            )
        """)
        
        # Functions table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS functions (
                name TEXT PRIMARY KEY,
                parameters TEXT,
                body TEXT,
                return_type TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                metadata TEXT
            )
        """)
        
        # Patterns table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS patterns (
                name TEXT PRIMARY KEY,
                pattern TEXT,
                implementation TEXT,
                created_at TIMESTAMP,
                usage_count INTEGER DEFAULT 0,
                success_rate REAL DEFAULT 1.0,
                metadata TEXT
            )
        """)
        
        # Sessions table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                user_id TEXT,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                metadata TEXT
            )
        """)
        
        # Scheduled jobs table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_jobs (
                job_id TEXT PRIMARY KEY,
                task TEXT,
                run_time TIMESTAMP,
                recurring INTEGER DEFAULT 0,
                interval_seconds INTEGER,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP,
                last_run TIMESTAMP
            )
        """)
        
        self.conn.commit()
        
    def store_variable(self, var: Variable) -> bool:
        """Store a variable in the database"""
        try:
            serialized_value = pickle.dumps(var.value)
            metadata_json = json.dumps(var.metadata)
            
            self.conn.execute("""
                INSERT OR REPLACE INTO variables 
                (name, value, type, scope, created_at, updated_at, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (var.name, serialized_value, var.type, var.scope,
                  var.created_at, var.updated_at, metadata_json))
            
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error storing variable: {e}")
            return False
            
    def get_variable(self, name: str) -> Optional[Variable]:
        """Retrieve a variable from the database"""
        cursor = self.conn.execute(
            "SELECT * FROM variables WHERE name = ?", (name,)
        )
        row = cursor.fetchone()
        
        if row:
            return Variable(
                name=row['name'],
                value=pickle.loads(row['value']),
                type=row['type'],
                scope=row['scope'],
                created_at=row['created_at'],
                updated_at=row['updated_at'],
                metadata=json.loads(row['metadata'])
            )
        return None
        
    def store_concept(self, concept: Concept) -> bool:
        """Store a concept in the database"""
        try:
            attrs_json = json.dumps(concept.attributes)
            rels_json = json.dumps(concept.relationships)
            
            self.conn.execute("""
                INSERT OR REPLACE INTO concepts
                (id, name, description, attributes, relationships, created_at, confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (concept.id, concept.name, concept.description,
                  attrs_json, rels_json, concept.created_at, concept.confidence))
            
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error storing concept: {e}")
            return False
            
    def get_concept(self, concept_id: str) -> Optional[Concept]:
        """Retrieve a concept from the database"""
        cursor = self.conn.execute(
            "SELECT * FROM concepts WHERE id = ?", (concept_id,)
        )
        row = cursor.fetchone()
        
        if row:
            return Concept(
                id=row['id'],
                name=row['name'],
                description=row['description'],
                attributes=json.loads(row['attributes']),
                relationships=json.loads(row['relationships']),
                created_at=row['created_at'],
                confidence=row['confidence']
            )
        return None
        
    def store_compiled_code(self, code: CompiledCode) -> bool:
        """Store compiled code reference"""
        try:
            self.conn.execute("""
                INSERT OR REPLACE INTO compiled_code
                (id, source_code, lightning_ref, optimization_level, 
                 created_at, execution_count, average_runtime)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (code.id, code.source_code, code.lightning_ref,
                  code.optimization_level, code.created_at,
                  code.execution_count, code.average_runtime))
            
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error storing compiled code: {e}")
            return False
            
    def create(self, table: str, data: Dict[str, Any]) -> bool:
        """Generic create method for any table"""
        try:
            columns = ', '.join(data.keys())
            placeholders = ', '.join(['?' for _ in data])
            query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
            
            self.conn.execute(query, list(data.values()))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error creating record in {table}: {e}")
            return False
    
    def read(self, table: str, conditions: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Generic read method for any table"""
        try:
            query = f"SELECT * FROM {table}"
            params = []
            
            if conditions:
                where_clauses = [f"{k} = ?" for k in conditions.keys()]
                query += " WHERE " + " AND ".join(where_clauses)
                params = list(conditions.values())
            
            cursor = self.conn.execute(query, params)
            columns = [col[0] for col in cursor.description]
            
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            return results
        except Exception as e:
            print(f"Error reading from {table}: {e}")
            return []
    
    def update(self, table: str, data: Dict[str, Any], conditions: Dict[str, Any]) -> bool:
        """Generic update method for any table"""
        try:
            set_clauses = [f"{k} = ?" for k in data.keys()]
            where_clauses = [f"{k} = ?" for k in conditions.keys()]
            
            query = f"UPDATE {table} SET {', '.join(set_clauses)} WHERE {' AND '.join(where_clauses)}"
            params = list(data.values()) + list(conditions.values())
            
            self.conn.execute(query, params)
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error updating {table}: {e}")
            return False
    
    def delete(self, table: str, conditions: Dict[str, Any]) -> bool:
        """Generic delete method for any table"""
        try:
            where_clauses = [f"{k} = ?" for k in conditions.keys()]
            query = f"DELETE FROM {table} WHERE {' AND '.join(where_clauses)}"
            
            self.conn.execute(query, list(conditions.values()))
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error deleting from {table}: {e}")
            return False
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()