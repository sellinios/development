"""Performance monitoring and optimization utilities."""

import time
import functools
from typing import Dict, List, Callable, Any, Optional
from collections import defaultdict
import threading
import logging


class PerformanceMonitor:
    """Monitor and track performance metrics."""

    def __init__(self):
        self._metrics: Dict[str, List[float]] = defaultdict(list)
        self._call_counts: Dict[str, int] = defaultdict(int)
        self._lock = threading.Lock()
        self.logger = logging.getLogger(__name__)

    def record_metric(self, name: str, value: float):
        """Record a performance metric."""
        with self._lock:
            self._metrics[name].append(value)
            self._call_counts[name] += 1

    def get_stats(self, name: Optional[str] = None) -> Dict[str, Any]:
        """Get performance statistics."""
        with self._lock:
            if name:
                if name not in self._metrics:
                    return {}

                values = self._metrics[name]
                return {
                    "name": name,
                    "count": self._call_counts[name],
                    "total": sum(values),
                    "average": sum(values) / len(values) if values else 0,
                    "min": min(values) if values else 0,
                    "max": max(values) if values else 0,
                }
            else:
                # Return all stats
                stats = {}
                for metric_name in self._metrics:
                    stats[metric_name] = self.get_stats(metric_name)
                return stats

    def clear(self, name: Optional[str] = None):
        """Clear metrics."""
        with self._lock:
            if name:
                self._metrics.pop(name, None)
                self._call_counts.pop(name, None)
            else:
                self._metrics.clear()
                self._call_counts.clear()

    def timer(self, name: str):
        """Context manager for timing operations."""
        return Timer(self, name)
    
    def start_monitoring(self, name: str):
        """Start monitoring a named operation."""
        # Store start time in a temporary dict
        if not hasattr(self, '_start_times'):
            self._start_times = {}
        self._start_times[name] = time.perf_counter()
    
    def stop_monitoring(self, name: str) -> Dict[str, Any]:
        """Stop monitoring and return metrics."""
        if not hasattr(self, '_start_times') or name not in self._start_times:
            raise ValueError(f"Monitoring for '{name}' was not started")
        
        start_time = self._start_times.pop(name)
        duration = (time.perf_counter() - start_time) * 1000  # Convert to ms
        
        # Record the metric
        self.record_metric(name, duration)
        
        # Return metrics
        return {
            "duration": duration,
            "name": name,
            "unit": "ms"
        }


class Timer:
    """Context manager for timing operations."""

    def __init__(self, monitor: PerformanceMonitor, name: str):
        self.monitor = monitor
        self.name = name
        self.start_time = None

    def __enter__(self):
        self.start_time = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = time.perf_counter() - self.start_time
        self.monitor.record_metric(self.name, elapsed * 1000)  # Convert to ms


# Global performance monitor
_monitor = PerformanceMonitor()


def timed(name: Optional[str] = None):
    """Decorator to time function execution."""

    def decorator(func: Callable) -> Callable:
        metric_name = name or f"{func.__module__}.{func.__name__}"

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                elapsed = time.perf_counter() - start
                _monitor.record_metric(metric_name, elapsed * 1000)

        return wrapper

    return decorator


def profile_method(cls):
    """Class decorator to profile all methods."""
    for attr_name in dir(cls):
        attr = getattr(cls, attr_name)
        if callable(attr) and not attr_name.startswith("_"):
            setattr(cls, attr_name, timed(f"{cls.__name__}.{attr_name}")(attr))
    return cls


# Convenience functions
def record_metric(name: str, value: float):
    """Record a metric to the global monitor."""
    _monitor.record_metric(name, value)


def get_performance_stats(name: Optional[str] = None) -> Dict[str, Any]:
    """Get performance statistics from the global monitor."""
    return _monitor.get_stats(name)


def clear_performance_metrics(name: Optional[str] = None):
    """Clear performance metrics from the global monitor."""
    _monitor.clear(name)


def timer(name: str):
    """Get a timer context manager."""
    return _monitor.timer(name)


class MemoryTracker:
    """Track memory usage patterns."""

    def __init__(self):
        self._allocations: Dict[str, int] = defaultdict(int)
        self._deallocations: Dict[str, int] = defaultdict(int)
        self._peak_usage: Dict[str, int] = defaultdict(int)
        self._current_usage: Dict[str, int] = defaultdict(int)
        self._lock = threading.Lock()

    def track_allocation(self, category: str, size: int):
        """Track memory allocation."""
        with self._lock:
            self._allocations[category] += 1
            self._current_usage[category] += size
            self._peak_usage[category] = max(
                self._peak_usage[category], self._current_usage[category]
            )

    def track_deallocation(self, category: str, size: int):
        """Track memory deallocation."""
        with self._lock:
            self._deallocations[category] += 1
            self._current_usage[category] = max(0, self._current_usage[category] - size)

    def get_memory_stats(self) -> Dict[str, Dict[str, int]]:
        """Get memory usage statistics."""
        with self._lock:
            stats = {}
            for category in self._allocations:
                stats[category] = {
                    "allocations": self._allocations[category],
                    "deallocations": self._deallocations[category],
                    "current_usage": self._current_usage[category],
                    "peak_usage": self._peak_usage[category],
                }
            return stats


# Global memory tracker
_memory_tracker = MemoryTracker()


def track_memory_allocation(category: str, size: int):
    """Track a memory allocation."""
    _memory_tracker.track_allocation(category, size)


def track_memory_deallocation(category: str, size: int):
    """Track a memory deallocation."""
    _memory_tracker.track_deallocation(category, size)


def get_memory_stats() -> Dict[str, Dict[str, int]]:
    """Get memory usage statistics."""
    return _memory_tracker.get_memory_stats()
