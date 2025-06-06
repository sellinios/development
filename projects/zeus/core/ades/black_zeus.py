#!/usr/bin/env python3
"""
Black Zeus - Test suite for Zeus component
"""

import unittest
import sys
import os
import time
import asyncio

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from zeus import (
    ZeusInterpreter,
    ZeusParser,
    Runtime,
    Evaluator,
    ZeusError,
    PerformanceMonitor,
    HealthChecker,
    RegexCache,
    SafeEvaluator
)
from zeus.zeus_cli import ZeusCLI as CLI


class TestZeusCore(unittest.TestCase):
    """Test Zeus core functionality"""
    
    def setUp(self):
        self.interpreter = ZeusInterpreter()
        self.parser = ZeusParser()
        self.runtime = Runtime()
        self.evaluator = Evaluator()
    
    def test_initialization(self):
        """Test Zeus core initialization"""
        self.assertIsNotNone(self.interpreter)
        self.assertIsNotNone(self.parser)
        self.assertIsNotNone(self.runtime)
        self.assertIsNotNone(self.evaluator)
    
    def test_interpreter_basic(self):
        """Test basic interpreter functionality"""
        result = self.interpreter.evaluate("2 + 2")
        self.assertEqual(result, 4)
    
    def test_parser_syntax(self):
        """Test parser with various syntax"""
        ast = self.parser.parse("x = 10")
        self.assertIsNotNone(ast)
    
    def test_runtime_execution(self):
        """Test runtime execution"""
        self.runtime.execute("x = 5")
        result = self.runtime.get_variable("x")
        self.assertEqual(result, 5)
    
    def test_evaluator(self):
        """Test expression evaluator"""
        result = self.evaluator.evaluate("10 * 2 + 5")
        self.assertEqual(result, 25)
    
    def test_performance_monitor(self):
        """Test performance monitoring"""
        monitor = PerformanceMonitor()
        monitor.start_monitoring("test")
        time.sleep(0.1)
        metrics = monitor.stop_monitoring("test")
        self.assertIn("duration", metrics)
    
    def test_health_checker(self):
        """Test health checking"""
        health = HealthChecker()
        status = health.check_status()
        self.assertIsNotNone(status)
    
    def test_regex_cache(self):
        """Test regex caching"""
        cache = RegexCache()
        pattern = cache.get_pattern(r"\d+")
        self.assertIsNotNone(pattern)
    
    def test_safe_eval(self):
        """Test safe evaluation"""
        safe_eval = SafeEvaluator()
        result = safe_eval.evaluate("2 + 2")
        self.assertEqual(result, 4)
    
    def test_cli_interface(self):
        """Test CLI interface"""
        cli = CLI()
        self.assertIsNotNone(cli)
    
    def test_error_handling(self):
        """Test error handling"""
        with self.assertRaises(ZeusError):
            self.evaluator.evaluate("1 / 0")


if __name__ == '__main__':
    unittest.main()