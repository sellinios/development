#!/usr/bin/env python3
"""
Black Lightning - Test suite for Lightning component
"""

import unittest
import sys
import os
import tempfile
import shutil

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from lightning.lightning_cache import CacheManager
from lightning.lightning_compiler import LightningCompiler
from lightning.lightning_manager import LightningManager
from lightning.lightning_models import (
    CompiledUnit, CompilationRequest, CompilationResult,
    CodeType, OptimizationLevel
)


class TestLightningCore(unittest.TestCase):
    """Test Lightning core functionality"""
    
    def setUp(self):
        # Create temporary directory for test cache
        self.test_dir = tempfile.mkdtemp()
        self.cache_dir = os.path.join(self.test_dir, "lightning")
        os.makedirs(self.cache_dir, exist_ok=True)
        
        self.cache = CacheManager(self.cache_dir)
        self.compiler = LightningCompiler(self.cache_dir)
        self.manager = LightningManager(self.cache, self.compiler)
        
    def tearDown(self):
        """Clean up test directory"""
        shutil.rmtree(self.test_dir)
    
    def test_initialization(self):
        """Test Lightning manager initialization"""
        self.assertIsNotNone(self.manager)
        self.assertIsNotNone(self.cache)
        self.assertIsNotNone(self.compiler)
    
    def test_data_directory_structure(self):
        """Test that Lightning uses data/lightning directory correctly"""
        # Test default path uses data/lightning
        default_cache = CacheManager()
        expected_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data", "lightning", "cache"
        )
        self.assertEqual(default_cache.cache_dir, expected_path)
        
    def test_cache_system(self):
        """Test caching functionality"""
        # Test basic cache operations
        self.cache.set('test_key', 'test_value')
        value = self.cache.get('test_key')
        self.assertEqual(value, 'test_value')
        
        # Test cache statistics
        stats = self.cache.get_statistics()
        self.assertIsInstance(stats, dict)
        self.assertIn('total_entries', stats)
    
    def test_compiler(self):
        """Test compiler functionality"""
        # Test compilation request
        request = CompilationRequest(
            source_code="def test(): return 42",
            target_type=CodeType.BYTECODE,
            optimization_level=OptimizationLevel.NONE
        )
        
        result = self.compiler.compile(request)
        self.assertIsInstance(result, CompilationResult)
        self.assertTrue(result.success)
        self.assertIsNotNone(result.compiled_unit)
    
    def test_models(self):
        """Test Lightning models"""
        # Test CompiledUnit model
        unit = CompiledUnit(
            id="test_unit",
            source_hash="abc123",
            code_type=CodeType.BYTECODE,
            optimization_level=OptimizationLevel.BASIC,
            file_path="/tmp/test.pyc",
            metadata={"test": True}
        )
        self.assertEqual(unit.id, "test_unit")
        self.assertEqual(unit.code_type, CodeType.BYTECODE)
        
        # Test CompilationRequest model
        request = CompilationRequest(
            source_code="print('hello')",
            target_type=CodeType.BYTECODE
        )
        self.assertIsNotNone(request.request_id)
        self.assertEqual(request.optimization_level, OptimizationLevel.STANDARD)  # Default is STANDARD
    
    def test_performance(self):
        """Test performance optimization"""
        # Test that Lightning components are optimized
        import time
        start = time.time()
        # Simulate some operations
        for i in range(100):
            self.cache.set(f'key_{i}', f'value_{i}')
        end = time.time()
        
        # Should complete quickly
        self.assertLess(end - start, 1.0)
        
        # Test cache retrieval performance
        start = time.time()
        for i in range(100):
            value = self.cache.get(f'key_{i}')
            self.assertEqual(value, f'value_{i}')
        end = time.time()
        
        # Retrieval should be even faster
        self.assertLess(end - start, 0.5)
        
    def test_no_hardcoded_optimizations(self):
        """Test that Lightning has no hardcoded optimizations"""
        # Check cache starts empty
        stats = self.cache.get_statistics()
        self.assertEqual(stats['total_entries'], 0, "Cache should start empty")
        
        # Check compiler has no pre-compiled code
        compiler_stats = self.compiler.get_statistics()
        self.assertEqual(compiler_stats['total_entries'], 0, "No pre-compiled code should exist")
        
        # Test that optimizations must be explicitly requested
        request = CompilationRequest(
            source_code="def slow_func(): return sum(range(1000))",
            target_type=CodeType.BYTECODE,
            optimization_level=OptimizationLevel.NONE
        )
        
        result = self.compiler.compile(request)
        self.assertTrue(result.success)
        # Should not be optimized unless requested
        self.assertEqual(result.compiled_unit.optimization_level, OptimizationLevel.NONE)


class TestLightningIsolation(unittest.TestCase):
    """Test that Lightning maintains proper isolation"""
    
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        shutil.rmtree(self.test_dir)
        
    def test_cache_isolation(self):
        """Test that different cache instances are isolated"""
        cache1_dir = os.path.join(self.test_dir, "cache1")
        cache2_dir = os.path.join(self.test_dir, "cache2")
        
        cache1 = CacheManager(cache1_dir)
        cache2 = CacheManager(cache2_dir)
        
        # Store in cache1
        cache1.set("shared_key", "value1")
        
        # Cache2 should not have it
        self.assertIsNone(cache2.get("shared_key"))
        
        # Store different value in cache2
        cache2.set("shared_key", "value2")
        
        # Values should remain isolated
        self.assertEqual(cache1.get("shared_key"), "value1")
        self.assertEqual(cache2.get("shared_key"), "value2")
        
    def test_compiler_isolation(self):
        """Test that compiler instances are isolated"""
        compiler1 = LightningCompiler(os.path.join(self.test_dir, "compiler1"))
        compiler2 = LightningCompiler(os.path.join(self.test_dir, "compiler2"))
        
        # Compile with compiler1
        request = CompilationRequest(
            source_code="def test1(): return 1",
            target_type=CodeType.BYTECODE
        )
        result1 = compiler1.compile(request)
        
        # Compiler2 should not have this cached
        stats2 = compiler2.get_statistics()
        self.assertEqual(stats2['total_entries'], 0)
        
        # Compiler1 should have it cached
        stats1 = compiler1.get_statistics()
        self.assertEqual(stats1['total_entries'], 1)


if __name__ == '__main__':
    unittest.main()