#!/usr/bin/env python3
"""
Ermis Receiver for Athena
Handles incoming messages from other gods through Ermis messenger system
"""

import asyncio
import json
from typing import Dict, Any, Callable, Optional
from queue import Queue, Empty
import threading


class AthenaErmisReceiver:
    """Receiver for Athena to handle messages from other gods"""
    
    def __init__(self):
        self.message_queue = Queue()
        self.handlers = {}
        self.running = False
        self.worker_thread = None
        
    def register_handler(self, message_type: str, handler: Callable):
        """Register a handler for specific message types"""
        self.handlers[message_type] = handler
        
    def receive_message(self, message: Dict[str, Any]) -> bool:
        """Receive a message from Ermis"""
        try:
            self.message_queue.put(message)
            return True
        except Exception as e:
            print(f"Error receiving message: {e}")
            return False
            
    def process_messages(self):
        """Process messages from the queue"""
        while self.running:
            try:
                message = self.message_queue.get(timeout=0.1)
                self._handle_message(message)
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
        print(f"Athena received unhandled message: {message}")
        
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
            
    # Athena-specific message handlers
    def handle_zeus_command(self, message: Dict[str, Any]):
        """Handle commands from Zeus"""
        data = message.get('data', {})
        command = data.get('command')
        # Process Zeus command
        print(f"Athena processing Zeus command: {command}")
        
    def handle_learning_update(self, message: Dict[str, Any]):
        """Handle learning updates from pattern recognition"""
        data = message.get('data', {})
        patterns = data.get('patterns', [])
        # Update knowledge base with new patterns
        print(f"Athena updating knowledge with {len(patterns)} new patterns")
        
    def handle_reasoning_request(self, message: Dict[str, Any]):
        """Handle reasoning requests"""
        data = message.get('data', {})
        query = data.get('query')
        # Process reasoning request
        print(f"Athena reasoning about: {query}")
        
    def handle_memory_sync(self, message: Dict[str, Any]):
        """Handle memory synchronization requests"""
        data = message.get('data', {})
        # Sync memory across components
        print(f"Athena syncing memory: {data.get('type', 'full')}")
    
    def handle_system_check(self, message: Dict[str, Any]):
        """Handle system check messages"""
        data = message.get('data', {})
        source = message.get('source', 'unknown')
        
        # Respond to health pings
        if data.get('type') == 'health_ping':
            # In a real implementation, we would send a response back
            # For now, just acknowledge it silently
            pass
            
    def handle_unified_request(self, message: Dict[str, Any]):
        """Handle unified requests from other gods"""
        # These are general requests that might be routed to Athena
        # Handle silently for now
        pass
        
    def handle_learn_from_code(self, message: Dict[str, Any]):
        """Handle pattern learning from Zeus code execution"""
        data = message.get('data', {})
        code = data.get('code', '')
        parsed_ast = data.get('parsed_ast', {})
        result = data.get('result')
        
        # Forward to brain coordinator for pattern detection
        try:
            from .athena_coordinator import BrainCoordinator
            # Get or create coordinator instance
            if not hasattr(self, '_brain_coordinator'):
                self._brain_coordinator = BrainCoordinator()
                
            # Create understanding structure for pattern detector
            understanding = {
                'parsed_ast': parsed_ast,
                'intent': 'code_execution',
                'code': code
            }
            
            # Learn from the interaction
            self._brain_coordinator._learn_from_interaction(code, understanding, result)
            
            # Debug: print pattern summary
            patterns_summary = self._brain_coordinator.pattern_detector.get_pattern_summary()
            total = patterns_summary.get('total_patterns', 0)
            print(f"[Pattern Learning] Total patterns: {total} (persists every 5 commands)")
        except Exception as e:
            print(f"Failed to learn from code pattern: {e}")
            
    def handle_get_usage_patterns(self, message: Dict[str, Any]):
        """Handle request for usage patterns"""
        try:
            from .athena_coordinator import BrainCoordinator
            # Get or create coordinator instance
            if not hasattr(self, '_brain_coordinator'):
                self._brain_coordinator = BrainCoordinator()
                
            patterns = self._brain_coordinator.get_usage_patterns()
            
            # Send response back through Ermis
            # For now, return a mock response
            return {
                'status': 'success',
                'patterns': patterns
            }
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def handle_learn_and_store(self, message: Dict[str, Any]):
        """Handle learn_and_store messages from Olympus storage router"""
        # These are storage router messages that go to both Athena and Cronos
        # Athena validates the pattern, Cronos stores it
        # We can silently acknowledge since the actual pattern learning
        # happens through other handlers
        pass


# Singleton instance
athena_receiver = AthenaErmisReceiver()

# Register default handlers
athena_receiver.register_handler('zeus_command', athena_receiver.handle_zeus_command)
athena_receiver.register_handler('learning_update', athena_receiver.handle_learning_update)
athena_receiver.register_handler('reasoning_request', athena_receiver.handle_reasoning_request)
athena_receiver.register_handler('memory_sync', athena_receiver.handle_memory_sync)
athena_receiver.register_handler('system_check', athena_receiver.handle_system_check)
athena_receiver.register_handler('unified_request', athena_receiver.handle_unified_request)
athena_receiver.register_handler('learn_from_code', athena_receiver.handle_learn_from_code)
athena_receiver.register_handler('get_usage_patterns', athena_receiver.handle_get_usage_patterns)
athena_receiver.register_handler('learn_and_store', athena_receiver.handle_learn_and_store)