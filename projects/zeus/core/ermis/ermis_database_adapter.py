"""
Ermis Database Adapter - Unified database operations handler
All database operations go through this adapter via Ermis messages
"""

import sqlite3
import json
import pickle
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
import os
import threading


class ErmisDatabaseAdapter:
    """Unified database adapter for all Ermis-routed database operations"""
    
    def __init__(self):
        # Use memory.db in data folder as per architecture
        zeus_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_dir = os.path.join(zeus_root, "data")
        os.makedirs(data_dir, exist_ok=True)
        self.db_path = os.path.join(data_dir, "memory.db")
        
        # Thread lock for database operations
        self._lock = threading.Lock()
        
        self.conn = None
        self._init_database()
        
    def _init_database(self):
        """Initialize database tables"""
        # Enable multi-threading support for SQLite
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
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
    
    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle database requests from Ermis"""
        operation = request.get('operation', '')
        data = request.get('data', {})
        
        try:
            if operation == 'store_variable':
                return self._store_variable(data)
            elif operation == 'get_variable':
                return self._get_variable(data)
            elif operation == 'store_concept':
                return self._store_concept(data)
            elif operation == 'get_concept':
                return self._get_concept(data)
            elif operation == 'store_pattern':
                return self._store_pattern(data)
            elif operation == 'get_pattern':
                return self._get_pattern(data)
            elif operation == 'get_all_patterns':
                return self._get_all_patterns(data)
            elif operation == 'store_function':
                return self._store_function(data)
            elif operation == 'get_function':
                return self._get_function(data)
            elif operation == 'create':
                return self._create(data)
            elif operation == 'read':
                return self._read(data)
            elif operation == 'update':
                return self._update(data)
            elif operation == 'delete':
                return self._delete(data)
            elif operation == 'query':
                return self._query(data)
            else:
                return {
                    'success': False,
                    'error': f'Unknown operation: {operation}'
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _store_variable(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Store a variable"""
        try:
            name = data['name']
            value = data['value']
            var_type = data.get('type', type(value).__name__)
            scope = data.get('scope', 'global')
            metadata = data.get('metadata', {})
            
            serialized_value = pickle.dumps(value)
            metadata_json = json.dumps(metadata)
            now = datetime.now().isoformat()
            
            with self._lock:
                self.conn.execute("""
                    INSERT OR REPLACE INTO variables 
                    (name, value, type, scope, created_at, updated_at, metadata)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (name, serialized_value, var_type, scope, now, now, metadata_json))
                
                self.conn.commit()
            
            return {'success': True, 'name': name}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_variable(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve a variable"""
        try:
            name = data['name']
            cursor = self.conn.execute(
                "SELECT * FROM variables WHERE name = ?", (name,)
            )
            row = cursor.fetchone()
            
            if row:
                return {
                    'success': True,
                    'variable': {
                        'name': row['name'],
                        'value': pickle.loads(row['value']),
                        'type': row['type'],
                        'scope': row['scope'],
                        'created_at': row['created_at'],
                        'updated_at': row['updated_at'],
                        'metadata': json.loads(row['metadata'])
                    }
                }
            return {'success': False, 'error': f'Variable {name} not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _store_concept(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Store a concept"""
        try:
            concept_id = data['id']
            name = data['name']
            description = data.get('description', '')
            attributes = data.get('attributes', {})
            relationships = data.get('relationships', [])
            confidence = data.get('confidence', 1.0)
            
            attrs_json = json.dumps(attributes)
            rels_json = json.dumps(relationships)
            now = datetime.now().isoformat()
            
            self.conn.execute("""
                INSERT OR REPLACE INTO concepts
                (id, name, description, attributes, relationships, created_at, confidence)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (concept_id, name, description, attrs_json, rels_json, now, confidence))
            
            self.conn.commit()
            return {'success': True, 'id': concept_id}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_concept(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve a concept"""
        try:
            concept_id = data['id']
            cursor = self.conn.execute(
                "SELECT * FROM concepts WHERE id = ?", (concept_id,)
            )
            row = cursor.fetchone()
            
            if row:
                return {
                    'success': True,
                    'concept': {
                        'id': row['id'],
                        'name': row['name'],
                        'description': row['description'],
                        'attributes': json.loads(row['attributes']),
                        'relationships': json.loads(row['relationships']),
                        'created_at': row['created_at'],
                        'confidence': row['confidence']
                    }
                }
            return {'success': False, 'error': f'Concept {concept_id} not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _store_pattern(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Store a pattern"""
        try:
            name = data['name']
            pattern = data['pattern']
            implementation = data.get('implementation', '')
            metadata = data.get('metadata', {})
            
            metadata_json = json.dumps(metadata)
            now = datetime.now().isoformat()
            
            with self._lock:
                self.conn.execute("""
                    INSERT OR REPLACE INTO patterns
                    (name, pattern, implementation, created_at, metadata)
                    VALUES (?, ?, ?, ?, ?)
                """, (name, pattern, implementation, now, metadata_json))
                
                self.conn.commit()
            
            return {'success': True, 'name': name}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_pattern(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve a pattern"""
        try:
            name = data['name']
            cursor = self.conn.execute(
                "SELECT * FROM patterns WHERE name = ?", (name,)
            )
            row = cursor.fetchone()
            
            if row:
                return {
                    'success': True,
                    'pattern': {
                        'name': row['name'],
                        'pattern': row['pattern'],
                        'implementation': row['implementation'],
                        'created_at': row['created_at'],
                        'usage_count': row['usage_count'],
                        'success_rate': row['success_rate'],
                        'metadata': json.loads(row['metadata'])
                    }
                }
            return {'success': False, 'error': f'Pattern {name} not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_all_patterns(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve all patterns"""
        try:
            with self._lock:
                cursor = self.conn.execute("SELECT * FROM patterns")
                rows = cursor.fetchall()
            
            patterns = []
            for row in rows:
                pattern = {
                    'name': row['name'],
                    'pattern': row['pattern'],
                    'implementation': row['implementation'],
                    'template': row['pattern'],  # template is same as pattern
                    'created_at': row['created_at'],
                    'usage_count': row['usage_count'],
                    'success_rate': row['success_rate']
                }
                
                # Parse metadata if available
                if row['metadata']:
                    try:
                        metadata = json.loads(row['metadata'])
                        pattern.update(metadata)
                    except:
                        pass
                
                patterns.append(pattern)
            
            return {'success': True, 'patterns': patterns}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _store_function(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Store a function"""
        try:
            name = data['name']
            parameters = data.get('parameters', [])
            body = data['body']
            return_type = data.get('return_type', 'Any')
            metadata = data.get('metadata', {})
            
            params_json = json.dumps(parameters)
            metadata_json = json.dumps(metadata)
            now = datetime.now().isoformat()
            
            self.conn.execute("""
                INSERT OR REPLACE INTO functions
                (name, parameters, body, return_type, created_at, updated_at, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (name, params_json, body, return_type, now, now, metadata_json))
            
            self.conn.commit()
            return {'success': True, 'name': name}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_function(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Retrieve a function"""
        try:
            name = data['name']
            cursor = self.conn.execute(
                "SELECT * FROM functions WHERE name = ?", (name,)
            )
            row = cursor.fetchone()
            
            if row:
                return {
                    'success': True,
                    'function': {
                        'name': row['name'],
                        'parameters': json.loads(row['parameters']),
                        'body': row['body'],
                        'return_type': row['return_type'],
                        'created_at': row['created_at'],
                        'updated_at': row['updated_at'],
                        'metadata': json.loads(row['metadata'])
                    }
                }
            return {'success': False, 'error': f'Function {name} not found'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generic create operation"""
        try:
            table = data['table']
            record = data['record']
            
            columns = ', '.join(record.keys())
            placeholders = ', '.join(['?' for _ in record])
            query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"
            
            self.conn.execute(query, list(record.values()))
            self.conn.commit()
            return {'success': True, 'table': table}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _read(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generic read operation"""
        try:
            table = data['table']
            conditions = data.get('conditions', {})
            
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
            
            return {'success': True, 'results': results}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _update(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generic update operation"""
        try:
            table = data['table']
            updates = data['updates']
            conditions = data['conditions']
            
            set_clauses = [f"{k} = ?" for k in updates.keys()]
            where_clauses = [f"{k} = ?" for k in conditions.keys()]
            
            query = f"UPDATE {table} SET {', '.join(set_clauses)} WHERE {' AND '.join(where_clauses)}"
            params = list(updates.values()) + list(conditions.values())
            
            self.conn.execute(query, params)
            self.conn.commit()
            return {'success': True, 'table': table}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _delete(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generic delete operation"""
        try:
            table = data['table']
            conditions = data['conditions']
            
            where_clauses = [f"{k} = ?" for k in conditions.keys()]
            query = f"DELETE FROM {table} WHERE {' AND '.join(where_clauses)}"
            
            self.conn.execute(query, list(conditions.values()))
            self.conn.commit()
            return {'success': True, 'table': table}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _query(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a raw query (read-only)"""
        try:
            query = data['query']
            params = data.get('params', [])
            
            # Only allow SELECT queries
            if not query.strip().upper().startswith('SELECT'):
                return {'success': False, 'error': 'Only SELECT queries are allowed'}
            
            cursor = self.conn.execute(query, params)
            columns = [col[0] for col in cursor.description]
            
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            
            return {'success': True, 'results': results}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()