#!/usr/bin/env python3
"""
Black Cronos - Test suite for Cronos component
"""

import unittest
import sys
import os
import tempfile
import shutil

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cronos.cronos_database import CronosDB
from cronos.cronos_manager import CronosManager
from cronos.cronos_models import (
    Variable, Concept, Relation, CompiledCode,
    Function, Pattern, Session, ScheduledJob
)


class TestCronosCore(unittest.TestCase):
    """Test Cronos core functionality"""
    
    def setUp(self):
        # Create temporary directory for test data
        self.test_dir = tempfile.mkdtemp()
        self.test_db_path = os.path.join(self.test_dir, "test_cronos.db")
        
        self.database = CronosDB(self.test_db_path)
        self.manager = CronosManager()
        
    def tearDown(self):
        """Clean up test directory"""
        self.database.close()
        shutil.rmtree(self.test_dir)
    
    def test_initialization(self):
        """Test Cronos initialization"""
        self.assertIsNotNone(self.database)
        self.assertIsNotNone(self.manager)
    
    def test_data_directory_structure(self):
        """Test that Cronos uses data/ directory correctly"""
        # Test default path uses data/cronos.db
        default_db = CronosDB()
        expected_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data", "memory.db"
        )
        self.assertEqual(default_db.db_path, expected_path)
        default_db.close()
        
    def test_database_operations(self):
        """Test database CRUD operations"""
        # Test variable storage
        var = Variable(name="test_var", value=42, type="int")
        success = self.database.store_variable(var)
        self.assertTrue(success)
        
        # Test variable retrieval
        retrieved = self.database.get_variable("test_var")
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.name, "test_var")
        self.assertEqual(retrieved.value, 42)
        
        # Test concept storage
        concept = Concept(
            id="test_concept_1",
            name="test_concept",
            description="A test concept",
            attributes={"type": "test", "priority": 1}
        )
        success = self.database.store_concept(concept)
        self.assertTrue(success)
        
        # Test concept retrieval
        retrieved_concept = self.database.get_concept("test_concept_1")
        self.assertIsNotNone(retrieved_concept)
        self.assertEqual(retrieved_concept.name, "test_concept")
    
    def test_manager_scheduling(self):
        """Test scheduling functionality"""
        # Test job scheduling - schedule_job expects job_id, task dict, and run_time
        from datetime import datetime, timedelta
        
        job_id = "test_job"
        task = {"action": "test", "data": {"message": "Hello"}}
        run_time = datetime.now() + timedelta(minutes=5)
        
        success = self.manager.schedule_job(job_id, task, run_time)
        self.assertTrue(success)
        
        # Test getting next run time
        next_run = self.manager.get_next_run_time(job_id)
        self.assertIsNotNone(next_run)
        self.assertEqual(next_run, run_time)
        
        # Test job cancellation
        success = self.manager.cancel_job(job_id)
        self.assertTrue(success)
    
    def test_models(self):
        """Test Cronos models"""
        # Test Variable model
        var = Variable(name="test_var", value=42, type="int")
        self.assertEqual(var.name, "test_var")
        self.assertEqual(var.value, 42)
        self.assertEqual(var.type, "int")
        
        # Test Concept model
        concept = Concept(
            id="concept_1",
            name="test_concept",
            description="A test concept",
            attributes={"key": "value"}
        )
        self.assertEqual(concept.name, "test_concept")
        self.assertEqual(concept.id, "concept_1")
        
        # Test Function model
        func = Function(
            name="test_func",
            parameters=["a", "b"],
            body="return a + b",
            return_type="int"
        )
        self.assertEqual(func.name, "test_func")
        self.assertEqual(len(func.parameters), 2)
        
        # Test Pattern model
        pattern = Pattern(
            name="test_pattern",
            pattern="\\d+",
            implementation="[0-9]+"
        )
        self.assertEqual(pattern.name, "test_pattern")
    
    def test_time_operations(self):
        """Test time-based operations"""
        # Test getting next run time when no jobs are scheduled
        next_run = self.manager.get_next_run_time()
        self.assertIsNone(next_run)  # Should be None when no jobs scheduled
        
        # Schedule a job and test next run time
        from datetime import datetime, timedelta
        job_id = "time_test_job"
        task = {"action": "test"}
        run_time = datetime.now() + timedelta(hours=1)
        
        self.manager.schedule_job(job_id, task, run_time)
        next_run = self.manager.get_next_run_time()
        self.assertIsNotNone(next_run)
        self.assertEqual(next_run, run_time)
    
    def test_no_hardcoded_knowledge(self):
        """Test that Cronos has no hardcoded knowledge"""
        # Test that database starts empty
        variables = self.database.read("variables")
        self.assertEqual(len(variables), 0, "Variables table should start empty")
        
        concepts = self.database.read("concepts")
        self.assertEqual(len(concepts), 0, "Concepts table should start empty")
        
        # Test that no built-in functions exist
        funcs = self.database.read("functions")
        self.assertEqual(len(funcs), 0, "No hardcoded functions should exist")
        
        # Test that no built-in patterns exist
        patterns = self.database.read("patterns")
        self.assertEqual(len(patterns), 0, "No hardcoded patterns should exist")
        
        # Verify that knowledge must be explicitly added
        var = Variable(name="pi", value=3.14159, type="float")
        self.database.store_variable(var)
        
        retrieved = self.database.get_variable("pi")
        self.assertIsNotNone(retrieved, "Explicitly added knowledge should be retrievable")
        
        # Test that non-existent knowledge returns None
        non_existent = self.database.get_variable("e")
        self.assertIsNone(non_existent, "Non-existent knowledge should return None")


class TestCronosKnowledgeIsolation(unittest.TestCase):
    """Test that Cronos maintains knowledge isolation"""
    
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.test_db_path = os.path.join(self.test_dir, "test_cronos.db")
        self.database = CronosDB(self.test_db_path)
        
    def tearDown(self):
        self.database.close()
        shutil.rmtree(self.test_dir)
        
    def test_session_isolation(self):
        """Test that sessions are isolated"""
        # Create two sessions
        session1 = Session(user_id="user1")
        session2 = Session(user_id="user2")
        
        # Add variable to session1
        var1 = Variable(name="x", value=10, type="int", scope="session:user1")
        self.database.store_variable(var1)
        
        # Add variable to session2
        var2 = Variable(name="x", value=20, type="int", scope="session:user2")
        self.database.store_variable(var2)
        
        # Verify isolation by scope
        vars1 = self.database.read("variables", {"scope": "session:user1"})
        self.assertEqual(len(vars1), 1)
        self.assertEqual(vars1[0]["value"], 10)
        
        vars2 = self.database.read("variables", {"scope": "session:user2"})
        self.assertEqual(len(vars2), 1)
        self.assertEqual(vars2[0]["value"], 20)
        
    def test_no_implicit_knowledge_sharing(self):
        """Test that knowledge is not implicitly shared"""
        # Add concept
        concept = Concept(
            id="math_pi",
            name="pi",
            description="Mathematical constant",
            attributes={"value": 3.14159}
        )
        self.database.store_concept(concept)
        
        # Verify it's not automatically available as a variable
        var = self.database.get_variable("pi")
        self.assertIsNone(var, "Concepts should not automatically become variables")
        
        # Verify explicit retrieval works
        retrieved_concept = self.database.get_concept("math_pi")
        self.assertIsNotNone(retrieved_concept)
        self.assertEqual(retrieved_concept.name, "pi")


if __name__ == '__main__':
    unittest.main()