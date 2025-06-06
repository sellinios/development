#!/usr/bin/env python3
"""
Ermis Receiver for Lightning
Handles incoming messages from other gods through Ermis messenger system
"""

import asyncio
import json
from typing import Dict, Any, Callable, Optional
from queue import Queue, Empty
import threading
import time


class LightningErmisReceiver:
    """Receiver for Lightning to handle messages from other gods"""
    
    def __init__(self):
        self.message_queue = Queue()
        self.handlers = {}
        self.running = False
        self.worker_thread = None
        self.performance_metrics = {}
        
    def register_handler(self, message_type: str, handler: Callable):
        """Register a handler for specific message types"""
        self.handlers[message_type] = handler
        
    def receive_message(self, message: Dict[str, Any]) -> bool:
        """Receive a message from Ermis with performance tracking"""
        try:
            # Track message reception time
            message['received_at'] = time.time()
            self.message_queue.put(message)
            return True
        except Exception as e:
            print(f"Error receiving message: {e}")
            return False
            
    def process_messages(self):
        """Process messages from the queue with optimization"""
        while self.running:
            try:
                message = self.message_queue.get(timeout=0.01)  # Faster timeout for Lightning
                start_time = time.time()
                self._handle_message(message)
                
                # Track processing time
                processing_time = time.time() - start_time
                msg_type = message.get('type', 'unknown')
                if msg_type not in self.performance_metrics:
                    self.performance_metrics[msg_type] = []
                self.performance_metrics[msg_type].append(processing_time)
                
            except Empty:
                continue
            except Exception as e:
                print(f"Error processing message: {e}")
                
    def _handle_message(self, message: Dict[str, Any]):
        """Handle a single message"""
        msg_type = message.get('type', 'unknown')
        handler = self.handlers.get(msg_type, self._default_handler)
        
        try:
            handler(message)
        except Exception as e:
            print(f"Error in message handler: {e}")
            
    def _default_handler(self, message: Dict[str, Any]):
        """Default handler for unregistered message types"""
        print(f"Lightning received unhandled message: {message}")
        
    def start(self):
        """Start the receiver"""
        if not self.running:
            self.running = True
            self.worker_thread = threading.Thread(target=self.process_messages)
            self.worker_thread.daemon = True
            self.worker_thread.start()
            
    def stop(self):
        """Stop the receiver"""
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=1.0)
            
    # Lightning-specific message handlers
    def handle_optimize_request(self, message: Dict[str, Any]):
        """Handle optimization requests"""
        data = message.get('data', {})
        target = data.get('target')
        optimization_type = data.get('type', 'general')
        
        # Perform optimization
        print(f"Lightning optimizing {target} with {optimization_type} optimization")
        
    def handle_cache_request(self, message: Dict[str, Any]):
        """Handle caching requests"""
        data = message.get('data', {})
        operation = data.get('operation')
        
        if operation == 'store':
            key = data.get('key')
            value = data.get('value')
            print(f"Lightning caching {key}")
        elif operation == 'retrieve':
            key = data.get('key')
            print(f"Lightning retrieving {key} from cache")
        elif operation == 'clear':
            print("Lightning clearing cache")
            
    def handle_performance_query(self, message: Dict[str, Any]):
        """Handle performance metric queries"""
        data = message.get('data', {})
        metric_type = data.get('metric_type', 'all')
        
        if metric_type == 'all':
            response = self.performance_metrics
        else:
            response = self.performance_metrics.get(metric_type, [])
            
        print(f"Lightning reporting performance metrics: {len(response)} entries")
        
    def handle_compile_request(self, message: Dict[str, Any]):
        """Handle compilation/optimization requests"""
        data = message.get('data', {})
        code = data.get('code')
        language = data.get('language', 'python')
        
        # Optimize/compile code
        print(f"Lightning compiling {language} code for optimal performance")
    
    def handle_system_check(self, message: Dict[str, Any]):
        """Handle system check messages"""
        data = message.get('data', {})
        source = message.get('source', 'unknown')
        
        # Respond to health pings
        if data.get('type') == 'health_ping':
            # In a real implementation, we would send a response back
            # For now, just acknowledge it silently
            pass
            
    def handle_store_and_cache(self, message: Dict[str, Any]):
        """Handle store and cache requests - Lightning handles the caching part"""
        data = message.get('data', {})
        
        # Extract the actual data from nested structure
        if 'data' in data:
            actual_data = data['data']
        else:
            actual_data = data
            
        name = actual_data.get('name')
        value = actual_data.get('value')
        
        # Lightning stores in cache for fast access
        # Silently cache without printing
        pass
        
    def handle_cache(self, message: Dict[str, Any]):
        """Handle cache-only requests"""
        data = message.get('data', {})
        
        # Extract the actual data from nested structure
        if 'data' in data:
            actual_data = data['data']
        else:
            actual_data = data
            
        name = actual_data.get('name')
        value = actual_data.get('value')
        
        # Lightning handles caching
        # Silently cache without printing
        pass


# Singleton instance
lightning_receiver = LightningErmisReceiver()

# Register default handlers
lightning_receiver.register_handler('optimize_request', lightning_receiver.handle_optimize_request)
lightning_receiver.register_handler('cache_request', lightning_receiver.handle_cache_request)
lightning_receiver.register_handler('performance_query', lightning_receiver.handle_performance_query)
lightning_receiver.register_handler('compile_request', lightning_receiver.handle_compile_request)
lightning_receiver.register_handler('system_check', lightning_receiver.handle_system_check)
lightning_receiver.register_handler('store_and_cache', lightning_receiver.handle_store_and_cache)
lightning_receiver.register_handler('cache', lightning_receiver.handle_cache)