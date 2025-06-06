"""
Ermis Configuration - Central messaging hub
"""

import os
from typing import Dict, Any


class ErmisConfig:
    """Configuration for Ermis messaging system"""
    
    def __init__(self):
        self.config = {
            # Message queue settings
            'queue_size': int(os.getenv('ERMIS_QUEUE_SIZE', '1000')),
            'timeout': float(os.getenv('ERMIS_TIMEOUT', '30.0')),
            
            # Performance settings
            'batch_size': int(os.getenv('ERMIS_BATCH_SIZE', '10')),
            'worker_threads': int(os.getenv('ERMIS_WORKERS', '4')),
            
            # Reliability settings
            'retry_attempts': int(os.getenv('ERMIS_RETRY_ATTEMPTS', '3')),
            'retry_delay': float(os.getenv('ERMIS_RETRY_DELAY', '0.5')),
            
            # Monitoring settings
            'enable_metrics': os.getenv('ERMIS_METRICS', 'true').lower() == 'true',
            'metrics_interval': int(os.getenv('ERMIS_METRICS_INTERVAL', '60')),
            
            # Security settings
            'enable_encryption': os.getenv('ERMIS_ENCRYPTION', 'false').lower() == 'true',
            'max_message_size': int(os.getenv('ERMIS_MAX_MESSAGE_SIZE', '1048576')),  # 1MB
            
            # Default settings
            'default_timeout': 1.0,
            'enable_logging': True
        }
        
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        return self.config.get(key, default)
        
    def set(self, key: str, value: Any):
        """Set configuration value"""
        self.config[key] = value
        
    def update(self, updates: Dict[str, Any]):
        """Update multiple configuration values"""
        self.config.update(updates)
        
    def get_queue_config(self) -> Dict[str, Any]:
        """Get queue-specific configuration"""
        return {
            'maxsize': self.config['queue_size'],
            'timeout': self.config['timeout']
        }
        
    def get_performance_config(self) -> Dict[str, Any]:
        """Get performance-specific configuration"""
        return {
            'batch_size': self.config['batch_size'],
            'worker_threads': self.config['worker_threads']
        }
        
    def get_reliability_config(self) -> Dict[str, Any]:
        """Get reliability-specific configuration"""
        return {
            'retry_attempts': self.config['retry_attempts'],
            'retry_delay': self.config['retry_delay']
        }
        
    def validate(self) -> bool:
        """Validate configuration"""
        # Check required settings
        required = ['queue_size', 'timeout', 'default_timeout']
        for key in required:
            if key not in self.config:
                return False
                
        # Check value ranges
        if self.config['queue_size'] <= 0:
            return False
        if self.config['timeout'] <= 0:
            return False
        if self.config['worker_threads'] <= 0:
            return False
            
        return True