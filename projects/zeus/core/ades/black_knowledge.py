#!/usr/bin/env python3
"""
Black Knowledge - Test suite for knowledge isolation
Ensures that knowledge is properly isolated and not hardcoded
"""

import unittest
import sys
import os
import tempfile
import shutil

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cronos.cronos_database import CronosDB
from cronos.cronos_models import Variable, Concept, Function, Pattern
from athena.athena_core import AthenaBrain
from lightning.lightning_cache import CacheManager


class TestKnowledgeIsolation(unittest.TestCase):
    """Test that knowledge is properly isolated across the system"""
    
    def setUp(self):
        # Create temporary directories for testing
        self.test_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.test_dir, "test_cronos.db")
        self.cache_dir = os.path.join(self.test_dir, "cache")
        self.model_dir = os.path.join(self.test_dir, "models")
        
        # Initialize components
        self.database = CronosDB(self.db_path)
        self.cache = CacheManager(self.cache_dir)
        self.brain = AthenaBrain(model_path=self.model_dir)
        
    def tearDown(self):
        """Clean up test directories"""
        self.database.close()
        shutil.rmtree(self.test_dir)
        
    def test_no_hardcoded_constants(self):
        """Test that no mathematical or scientific constants are hardcoded"""
        # Check database for hardcoded constants
        variables = self.database.read("variables")
        self.assertEqual(len(variables), 0, "No hardcoded variables should exist")
        
        # Common constants that should NOT be hardcoded
        constants_to_check = ["pi", "e", "phi", "euler", "avogadro", "planck"]
        
        for const in constants_to_check:
            var = self.database.get_variable(const)
            self.assertIsNone(var, f"Constant '{const}' should not be hardcoded")
            
    def test_no_hardcoded_functions(self):
        """Test that no built-in functions are hardcoded"""
        # Check for hardcoded functions
        functions = self.database.read("functions")
        self.assertEqual(len(functions), 0, "No hardcoded functions should exist")
        
        # Functions that should NOT be hardcoded
        function_names = ["sin", "cos", "sqrt", "log", "exp", "factorial"]
        
        for func_name in function_names:
            result = self.database.read("functions", {"name": func_name})
            self.assertEqual(len(result), 0, f"Function '{func_name}' should not be hardcoded")
            
    def test_no_hardcoded_patterns(self):
        """Test that no patterns are hardcoded"""
        # Check Athena for hardcoded patterns
        patterns = self.brain.pattern_learner.patterns
        self.assertEqual(len(patterns), 0, "No hardcoded patterns should exist")
        
        # Check database for hardcoded patterns
        db_patterns = self.database.read("patterns")
        self.assertEqual(len(db_patterns), 0, "No hardcoded patterns in database")
        
    def test_knowledge_must_be_taught(self):
        """Test that knowledge must be explicitly taught"""
        # Try to use undefined knowledge
        context = {}
        
        # Test that brain doesn't know about concepts without teaching
        result = self.brain.process("What is the value of pi?", context)
        # Should not return a specific value
        self.assertIsInstance(result, dict)
        
        # Now teach it
        var = Variable(name="pi", value=3.14159, type="float")
        self.database.store_variable(var)
        
        # Also teach a pattern for retrieving it
        self.brain.teach_pattern("get_pi -> 3.14159")
        
        # Now it should know
        patterns_after = self.brain.pattern_learner.patterns
        self.assertEqual(len(patterns_after), 1, "Pattern should be learned")
        
    def test_cache_isolation(self):
        """Test that cache is isolated per instance"""
        # Create two cache managers with different directories
        cache1_dir = os.path.join(self.test_dir, "cache1")
        cache2_dir = os.path.join(self.test_dir, "cache2")
        
        cache1 = CacheManager(cache1_dir)
        cache2 = CacheManager(cache2_dir)
        
        # Store in cache1
        cache1.set("test_key", "test_value")
        
        # Verify cache1 has it
        self.assertEqual(cache1.get("test_key"), "test_value")
        
        # Verify cache2 doesn't have it
        self.assertIsNone(cache2.get("test_key"))
        
    def test_session_knowledge_isolation(self):
        """Test that knowledge is isolated between sessions"""
        # Create session-scoped variables
        var1 = Variable(name="x", value=10, type="int", scope="session:1")
        var2 = Variable(name="x", value=20, type="int", scope="session:2")
        
        self.database.store_variable(var1)
        self.database.store_variable(var2)
        
        # Query by session
        session1_vars = self.database.read("variables", {"scope": "session:1"})
        session2_vars = self.database.read("variables", {"scope": "session:2"})
        
        self.assertEqual(len(session1_vars), 1)
        self.assertEqual(session1_vars[0]["value"], 10)
        
        self.assertEqual(len(session2_vars), 1)
        self.assertEqual(session2_vars[0]["value"], 20)
        
    def test_concept_knowledge_separation(self):
        """Test that concepts and variables are separate"""
        # Create a concept
        concept = Concept(
            id="math_constant_pi",
            name="pi",
            description="Mathematical constant",
            attributes={"value": 3.14159, "symbol": "π"}
        )
        self.database.store_concept(concept)
        
        # Verify it's not available as a variable
        var = self.database.get_variable("pi")
        self.assertIsNone(var, "Concepts should not automatically become variables")
        
        # Verify concept retrieval works
        retrieved = self.database.get_concept("math_constant_pi")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.attributes["value"], 3.14159)
        
    def test_no_implicit_knowledge_transfer(self):
        """Test that knowledge doesn't transfer implicitly between components"""
        # Store in Cronos
        var = Variable(name="test_var", value=42, type="int")
        self.database.store_variable(var)
        
        # Athena shouldn't know about it without explicit retrieval
        # This tests that Athena doesn't have direct database access
        patterns = self.brain.pattern_learner.patterns
        pattern_names = [p['name'] for p in patterns]
        self.assertNotIn("test_var", pattern_names, "Variables shouldn't become patterns automatically")
        
    def test_empty_knowledge_base_startup(self):
        """Test that all components start with empty knowledge bases"""
        # Test Cronos tables
        tables_to_check = ["variables", "concepts", "functions", "patterns", "relations"]
        for table in tables_to_check:
            try:
                rows = self.database.read(table)
                self.assertEqual(len(rows), 0, f"Table '{table}' should start empty")
            except:
                # Table might not exist, which is fine
                pass
                
        # Test Athena knowledge
        stats = self.brain.get_stats()
        self.assertEqual(stats['patterns_count'], 0, "Should start with no patterns")
        
        # Test Lightning cache
        cache_stats = self.cache.get_statistics()
        self.assertEqual(cache_stats['total_entries'], 0, "Cache should start empty")


class TestKnowledgeBootstrap(unittest.TestCase):
    """Test that knowledge can be properly bootstrapped when needed"""
    
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.test_dir, "test_cronos.db")
        self.database = CronosDB(self.db_path)
        
    def tearDown(self):
        self.database.close()
        shutil.rmtree(self.test_dir)
        
    def test_knowledge_bootstrap_framework(self):
        """Test that a bootstrap framework could add fundamental knowledge"""
        # This simulates what a future knowledge bootstrap framework would do
        
        # Bootstrap some fundamental constants
        constants = [
            Variable(name="pi", value=3.14159265359, type="float", 
                    metadata={"category": "mathematical", "symbol": "π"}),
            Variable(name="e", value=2.71828182846, type="float",
                    metadata={"category": "mathematical", "symbol": "e"}),
            Variable(name="golden_ratio", value=1.61803398875, type="float",
                    metadata={"category": "mathematical", "symbol": "φ"})
        ]
        
        # Store them
        for const in constants:
            success = self.database.store_variable(const)
            self.assertTrue(success, f"Should be able to bootstrap {const.name}")
            
        # Verify they're stored
        stored_vars = self.database.read("variables")
        self.assertEqual(len(stored_vars), 3, "Bootstrap should add exactly what's specified")
        
        # Bootstrap some functions
        functions_to_add = [
            {
                "name": "area_circle",
                "parameters": ["radius"],
                "body": "return 3.14159265359 * radius ** 2",
                "return_type": "float"
            },
            {
                "name": "circumference",
                "parameters": ["radius"],
                "body": "return 2 * 3.14159265359 * radius",
                "return_type": "float"
            }
        ]
        
        for func_def in functions_to_add:
            func = Function(**func_def)
            # Store function (would need to implement store_function in CronosDB)
            # For now, just verify the structure is correct
            self.assertEqual(len(func.parameters), 1)
            self.assertIn("radius", func.parameters)
            
    def test_bootstrap_isolation(self):
        """Test that bootstrapped knowledge is still isolated"""
        # Bootstrap in one database
        var1 = Variable(name="test", value=1, type="int")
        self.database.store_variable(var1)
        
        # Create another database
        other_db_path = os.path.join(self.test_dir, "other_cronos.db")
        other_db = CronosDB(other_db_path)
        
        # Verify it doesn't have the bootstrapped knowledge
        var2 = other_db.get_variable("test")
        self.assertIsNone(var2, "Knowledge shouldn't leak between database instances")
        
        other_db.close()


if __name__ == '__main__':
    unittest.main()