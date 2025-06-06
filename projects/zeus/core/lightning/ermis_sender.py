#!/usr/bin/env python3
"""
Ermis Sender for Lightning
Handles outgoing messages to other gods through Ermis messenger system
"""

import sys
import os
from typing import Dict, Any, List, Optional
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class LightningErmisSender:
    """Sender for Lightning to communicate with other gods"""
    
    def __init__(self):
        self._messenger = None
        self.god_name = 'lightning'
    
    @property
    def messenger(self):
        """Lazy load messenger to avoid circular imports"""
        if self._messenger is None:
            from ermis.ermis_messenger import get_messenger
            self._messenger = get_messenger()
        return self._messenger
        
    def send_to_zeus(self, content: Any, msg_type: str = "optimization_complete") -> bool:
        """Send message to Zeus"""
        return self.messenger.send_message_full(self.god_name, 'zeus', content, msg_type)
        
    def send_to_athena(self, content: Any, msg_type: str = "cache_update") -> bool:
        """Send message to Athena"""
        return self.messenger.send_message_full(self.god_name, 'athena', content, msg_type)
        
    def send_to_cronos(self, content: Any, msg_type: str = "performance_metrics") -> bool:
        """Send message to Cronos"""
        return self.messenger.send_message_full(self.god_name, 'cronos', content, msg_type)
        
    def send_to_ermis(self, content: Any, msg_type: str = "speed_update") -> bool:
        """Send message to Ermis"""
        return self.messenger.send_message_full(self.god_name, 'ermis', content, msg_type)
        
    def broadcast(self, content: Any, msg_type: str = "lightning_broadcast", exclude: List[str] = None) -> Dict[str, bool]:
        """Broadcast message to all gods"""
        return self.messenger.broadcast_message(self.god_name, content, msg_type, exclude)
        
    # Specific command methods
    def report_optimization_complete(self, optimization_id: str, target: str, improvements: Dict) -> bool:
        """Report optimization completion"""
        return self.send_to_zeus({
            'optimization_id': optimization_id,
            'target': target,
            'improvements': improvements,
            'completed_at': time.time()
        }, 'optimization_complete')
        
    def notify_cache_update(self, cache_type: str, entries_updated: int, hit_rate: float) -> bool:
        """Notify Athena of cache updates"""
        return self.send_to_athena({
            'cache_type': cache_type,
            'entries_updated': entries_updated,
            'new_hit_rate': hit_rate
        }, 'cache_update')
        
    def share_performance_metrics(self, metrics: Dict[str, Any]) -> bool:
        """Share performance metrics with Cronos"""
        return self.send_to_cronos({
            'metrics': metrics,
            'timestamp': time.time(),
            'measurement_period_seconds': 60
        }, 'performance_metrics')
        
    def broadcast_speed_boost(self, boost_type: str, improvement_percentage: float) -> Dict[str, bool]:
        """Broadcast speed improvements to all gods"""
        return self.broadcast({
            'boost_type': boost_type,
            'improvement_percentage': improvement_percentage,
            'effective_immediately': True
        }, 'speed_boost')
        
    def alert_performance_issue(self, component: str, issue_type: str, severity: str = 'medium') -> Dict[str, bool]:
        """Alert all gods about performance issues"""
        return self.broadcast({
            'component': component,
            'issue_type': issue_type,
            'severity': severity,
            'detected_at': time.time()
        }, 'performance_alert')
        
    def provide_compilation_result(self, target_god: str, code_id: str, optimized_code: str, stats: Dict) -> bool:
        """Provide compilation/optimization results"""
        return self.messenger.send_message_full(self.god_name, target_god, {
            'code_id': code_id,
            'optimized_code': optimized_code,
            'optimization_stats': stats,
            'execution_time_reduction': stats.get('time_reduction', 0)
        }, 'compilation_result')


# Singleton instance
lightning_sender = LightningErmisSender()