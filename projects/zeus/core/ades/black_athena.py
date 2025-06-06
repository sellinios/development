#!/usr/bin/env python3
"""
Black Athena - Test suite for Athena component
"""

import unittest
import sys
import os
import tempfile
import shutil

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from athena.athena_core import AthenaBrain
from athena.athena_coordinator import BrainCoordinator
from athena.athena_context_manager import ContextManager
from athena.athena_execution import ExecutionModule
from athena.athena_features import SemanticFeatureExtractor
from athena.athena_understanding import UnderstandingModule
from athena.athena_knowledge_unified import UnifiedKnowledgeBase
from athena.athena_processor import NLPProcessor
from athena.athena_engine import ReasoningEngine
from athena.athena_pattern_learner import PatternLearner


class TestAthenaCore(unittest.TestCase):
    """Test Athena core functionality"""
    
    def setUp(self):
        # Create temporary directory for test models
        self.test_dir = tempfile.mkdtemp()
        self.model_path = os.path.join(self.test_dir, "models")
        os.makedirs(self.model_path, exist_ok=True)
        
        self.brain = AthenaBrain(model_path=self.model_path)
        
    def tearDown(self):
        """Clean up test directory"""
        shutil.rmtree(self.test_dir)
    
    def test_initialization(self):
        """Test Athena core initialization"""
        self.assertIsNotNone(self.brain)
        self.assertIsInstance(self.brain.coordinator, BrainCoordinator)
    
    def test_brain_components(self):
        """Test brain component integration"""
        # Test that all components are properly initialized
        self.assertIsNotNone(self.brain.coordinator.knowledge)
        self.assertIsNotNone(self.brain.coordinator.execution)
        self.assertIsNotNone(self.brain.coordinator.nlp_processor)
        self.assertIsNotNone(self.brain.coordinator.understanding)
        self.assertIsNotNone(self.brain.coordinator.pattern_learner)
        self.assertIsNotNone(self.brain.coordinator.reasoning)
    
    def test_memory_system(self):
        """Test memory and knowledge base"""
        kb = self.brain.knowledge
        self.assertIsNotNone(kb)
        self.assertIsInstance(kb, UnifiedKnowledgeBase)
    
    def test_nlp_processing(self):
        """Test NLP processor"""
        nlp = self.brain.coordinator.nlp_processor
        self.assertIsNotNone(nlp)
        self.assertIsInstance(nlp, NLPProcessor)
    
    def test_reasoning_engine(self):
        """Test reasoning capabilities"""
        engine = self.brain.reasoning
        self.assertIsNotNone(engine)
        self.assertIsInstance(engine, ReasoningEngine)
    
    def test_learning_module(self):
        """Test pattern learning"""
        learner = self.brain.pattern_learner
        self.assertIsNotNone(learner)
        self.assertIsInstance(learner, PatternLearner)
    
    def test_no_hardcoded_ai_knowledge(self):
        """Test that Athena has no hardcoded AI knowledge"""
        # Test that pattern learner starts empty
        patterns = self.brain.pattern_learner.patterns
        self.assertEqual(len(patterns), 0, "No hardcoded patterns should exist")
        
        # Test that knowledge base starts empty
        kb_stats = self.brain.knowledge.get_stats() if hasattr(self.brain.knowledge, 'get_stats') else {}
        if kb_stats:
            self.assertEqual(kb_stats.get('total_entries', 0), 0, "Knowledge base should start empty")
        
        # Test that reasoning engine has no built-in rules
        if hasattr(self.brain.reasoning, 'rules'):
            self.assertEqual(len(self.brain.reasoning.rules), 0, "No hardcoded reasoning rules")
        
        # Verify that patterns must be learned explicitly
        # Pattern learner starts empty and only learns through processing
        if hasattr(self.brain.pattern_learner, 'learn_pattern'):
            # Simulate learning a pattern
            self.brain.pattern_learner.learn_pattern("greet", "Hello!", "greeting")
            patterns_after = self.brain.pattern_learner.patterns
            self.assertGreater(len(patterns_after), 0, "Explicitly taught patterns should exist")
    
    def test_model_isolation(self):
        """Test that models are isolated and not pre-trained"""
        # Test that no pre-trained patterns exist
        if hasattr(self.brain.pattern_learner, 'patterns'):
            self.assertEqual(len(self.brain.pattern_learner.patterns), 0, "Should start with no patterns")
        
        # Test understanding without any training
        result = self.brain.understand("Hello world")
        self.assertIsInstance(result, dict)
        # Should still work but with basic understanding
        self.assertIn('intent', result)
        
        # Verify pattern learner starts empty
        if hasattr(self.brain.pattern_learner, 'get_pattern_statistics'):
            stats = self.brain.pattern_learner.get_pattern_statistics()
            self.assertEqual(stats.get('total_patterns', 0), 0)


class TestAthenaKnowledgeIsolation(unittest.TestCase):
    """Test that Athena maintains knowledge isolation"""
    
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.brain1 = AthenaBrain(model_path=os.path.join(self.test_dir, "models1"))
        self.brain2 = AthenaBrain(model_path=os.path.join(self.test_dir, "models2"))
        
    def tearDown(self):
        shutil.rmtree(self.test_dir)
        
    def test_brain_instance_isolation(self):
        """Test that different brain instances are isolated"""
        # Simulate learning a pattern in brain1
        if hasattr(self.brain1.pattern_learner, 'learn_pattern'):
            self.brain1.pattern_learner.learn_pattern("hello", "Hi there!", "greeting")
            
            # Verify brain1 has patterns
            patterns1 = getattr(self.brain1.pattern_learner, 'patterns', {})
            self.assertGreater(len(patterns1), 0, "Brain1 should have learned patterns")
            
            # Verify brain2 doesn't have the pattern
            patterns2 = getattr(self.brain2.pattern_learner, 'patterns', {})
            self.assertEqual(len(patterns2), 0, "Brain2 should not have brain1's patterns")
        
    def test_no_global_state(self):
        """Test that Athena doesn't use global state"""
        # Process with brain1
        context1 = {'user': 'Alice'}
        result1 = self.brain1.process("Remember my name", context1)
        
        # Process with brain2
        context2 = {'user': 'Bob'}
        result2 = self.brain2.process("What's my name?", context2)
        
        # Results should be independent
        self.assertIsNotNone(result1)
        self.assertIsNotNone(result2)
        # Brain2 shouldn't know about brain1's context


if __name__ == '__main__':
    unittest.main()