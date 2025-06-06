#!/usr/bin/env python3
"""
Ermis Receiver for Zeus
Handles incoming messages from other gods through Ermis messenger system
"""

import asyncio
import json
import os
from typing import Dict, Any, Callable, Optional
from queue import Queue, Empty
import threading


class ZeusErmisReceiver:
    """Receiver for Zeus to handle messages from other gods"""
    
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
        msg_type = message.get('type', 'unknown')
        
        # Handle error responses more gracefully
        if msg_type == 'error_response':
            error_data = message.get('data', {})
            error_msg = error_data.get('error', 'Unknown error')
            print(f"⚠️  Warning: {error_msg}")
        
        # Log other unhandled messages only in debug mode
        elif os.getenv('ZEUS_DEBUG') == '1':
            print(f"Debug: Zeus received message type '{msg_type}'")
        
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
            
    # Zeus-specific message handlers
    def handle_athena_request(self, message: Dict[str, Any]):
        """Handle AI processing requests from Athena"""
        data = message.get('data', {})
        # Process AI request
        print(f"Zeus processing Athena request: {data}")
        
    def handle_cronos_schedule(self, message: Dict[str, Any]):
        """Handle scheduling requests from Cronos"""
        data = message.get('data', {})
        # Process scheduling
        print(f"Zeus scheduling task from Cronos: {data}")
        
    def handle_lightning_optimize(self, message: Dict[str, Any]):
        """Handle optimization requests from Lightning"""
        data = message.get('data', {})
        # Process optimization
        print(f"Zeus optimizing with Lightning: {data}")
    
    def handle_system_check(self, message: Dict[str, Any]):
        """Handle system check messages"""
        data = message.get('data', {})
        source = message.get('source', 'unknown')
        
        # Respond to health pings
        if data.get('type') == 'health_ping':
            # In a real implementation, we would send a response back
            # For now, just acknowledge it silently
            pass


# Singleton instance
zeus_receiver = ZeusErmisReceiver()

# Register default handlers
zeus_receiver.register_handler('athena_request', zeus_receiver.handle_athena_request)
zeus_receiver.register_handler('cronos_schedule', zeus_receiver.handle_cronos_schedule)
zeus_receiver.register_handler('lightning_optimize', zeus_receiver.handle_lightning_optimize)
zeus_receiver.register_handler('system_check', zeus_receiver.handle_system_check)