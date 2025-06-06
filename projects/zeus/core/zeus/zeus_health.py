"""Health monitoring and diagnostics for Zeus."""

import os
import sys
import platform
import psutil
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
from pathlib import Path


class HealthMonitor:
    """Monitor system health and performance."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.start_time = datetime.now()
        self._checks = {
            "system": self.check_system,
            "memory": self.check_memory,
            "disk": self.check_disk,
            "database": self.check_database,
            "models": self.check_models,
            "dependencies": self.check_dependencies,
        }

    def get_health_status(self) -> Dict[str, Any]:
        """Get overall health status."""
        status = {
            "timestamp": datetime.now().isoformat(),
            "uptime": str(datetime.now() - self.start_time),
            "status": "healthy",
            "checks": {},
        }

        # Run all health checks
        for name, check_func in self._checks.items():
            try:
                check_result = check_func()
                status["checks"][name] = check_result

                # Update overall status
                if check_result["status"] == "error":
                    status["status"] = "error"
                elif check_result["status"] == "warning" and status["status"] == "healthy":
                    status["status"] = "warning"
            except Exception as e:
                self.logger.error(f"Health check '{name}' failed: {e}")
                status["checks"][name] = {"status": "error", "error": str(e)}
                status["status"] = "error"

        return status

    def check_system(self) -> Dict[str, Any]:
        """Check system information."""
        return {
            "status": "healthy",
            "platform": platform.platform(),
            "python_version": sys.version,
            "cpu_count": os.cpu_count(),
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "pid": os.getpid(),
        }

    def check_memory(self) -> Dict[str, Any]:
        """Check memory usage."""
        memory = psutil.virtual_memory()
        process = psutil.Process()
        process_memory = process.memory_info()

        status = "healthy"
        if memory.percent > 90:
            status = "error"
        elif memory.percent > 80:
            status = "warning"

        return {
            "status": status,
            "system": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
            },
            "process": {
                "rss": process_memory.rss,
                "vms": process_memory.vms,
                "percent": process.memory_percent(),
            },
        }

    def check_disk(self) -> Dict[str, Any]:
        """Check disk usage."""
        # Check the disk where data is stored
        data_path = Path("data").resolve()

        try:
            disk = psutil.disk_usage(str(data_path))

            status = "healthy"
            if disk.percent > 90:
                status = "error"
            elif disk.percent > 80:
                status = "warning"

            return {
                "status": status,
                "path": str(data_path),
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent,
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def check_database(self) -> Dict[str, Any]:
        """Check database health."""
        # Check for memory.db in data folder
        import os
        zeus_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        data_dir = os.path.join(zeus_root, "data")
        db_path = Path(os.path.join(data_dir, "memory.db"))

        if not db_path.exists():
            return {"status": "warning", "message": "Database not found", "path": str(db_path)}

        try:
            db_size = db_path.stat().st_size

            # Check if database is too large
            status = "healthy"
            if db_size > 1_000_000_000:  # 1GB
                status = "warning"

            return {
                "status": status,
                "path": str(db_path),
                "size": db_size,
                "modified": datetime.fromtimestamp(db_path.stat().st_mtime).isoformat(),
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def check_models(self) -> Dict[str, Any]:
        """Check if models are available."""
        model_path = Path("data/models")

        if not model_path.exists():
            return {
                "status": "warning",
                "message": "Models directory not found",
                "path": str(model_path),
            }

        model_files = list(model_path.glob("*.h5")) + list(model_path.glob("*.pt"))

        return {
            "status": "healthy" if model_files else "warning",
            "path": str(model_path),
            "model_count": len(model_files),
            "models": [f.name for f in model_files],
        }

    def check_dependencies(self) -> Dict[str, Any]:
        """Check if critical dependencies are available."""
        dependencies = {
            "tensorflow": False,
            "torch": False,
            "transformers": False,
            "spacy": False,
            "nltk": False,
        }

        for dep in dependencies:
            try:
                __import__(dep)
                dependencies[dep] = True
            except ImportError:
                pass

        missing = [dep for dep, available in dependencies.items() if not available]

        return {
            "status": "error" if missing else "healthy",
            "dependencies": dependencies,
            "missing": missing,
        }

    def get_metrics(self) -> Dict[str, Any]:
        """Get performance metrics."""
        process = psutil.Process()

        return {
            "timestamp": datetime.now().isoformat(),
            "cpu": {
                "percent": process.cpu_percent(interval=0.1),
                "times": process.cpu_times()._asdict(),
            },
            "memory": {
                "rss": process.memory_info().rss,
                "vms": process.memory_info().vms,
                "percent": process.memory_percent(),
            },
            "io": {
                "read_count": process.io_counters().read_count,
                "write_count": process.io_counters().write_count,
                "read_bytes": process.io_counters().read_bytes,
                "write_bytes": process.io_counters().write_bytes,
            },
            "threads": process.num_threads(),
            "connections": len(process.connections()),
        }

    def check_status(self) -> Dict[str, Any]:
        """Check system status (alias for get_health_status)."""
        return self.get_health_status()
    
    def diagnose_issue(self, error: Exception) -> Dict[str, Any]:
        """Diagnose common issues."""
        diagnosis = {"error": str(error), "type": type(error).__name__, "suggestions": []}

        error_str = str(error).lower()

        # Memory issues
        if "memory" in error_str or isinstance(error, MemoryError):
            diagnosis["suggestions"].extend(
                [
                    "Reduce batch size or model size",
                    "Increase system memory",
                    "Enable memory optimization in configuration",
                ]
            )

        # Import errors
        elif isinstance(error, ImportError):
            diagnosis["suggestions"].extend(
                [
                    "Run: pip install -r requirements.txt",
                    "Check virtual environment activation",
                    f'Install missing module: {error.name if hasattr(error, "name") else "unknown"}',
                ]
            )

        # Database errors
        elif "database" in error_str or "sqlite" in error_str:
            diagnosis["suggestions"].extend(
                [
                    "Check database file permissions",
                    "Ensure database directory exists",
                    "Try resetting database: make db-reset",
                ]
            )

        # Model errors
        elif "model" in error_str or "tensor" in error_str:
            diagnosis["suggestions"].extend(
                [
                    "Check if models are downloaded",
                    "Verify model compatibility",
                    "Try reinstalling TensorFlow/PyTorch",
                ]
            )

        return diagnosis


# Global health monitor
_monitor: Optional[HealthMonitor] = None


def get_health_monitor() -> HealthMonitor:
    """Get the global health monitor instance."""
    global _monitor
    if _monitor is None:
        _monitor = HealthMonitor()
    return _monitor


def check_health() -> Dict[str, Any]:
    """Quick health check."""
    monitor = get_health_monitor()
    return monitor.get_health_status()


def get_metrics() -> Dict[str, Any]:
    """Get current metrics."""
    monitor = get_health_monitor()
    return monitor.get_metrics()


def diagnose(error: Exception) -> Dict[str, Any]:
    """Diagnose an error."""
    monitor = get_health_monitor()
    return monitor.diagnose_issue(error)
