#!/usr/bin/env python3
"""
Ermis Receiver for Cronos
Handles incoming messages from other gods through Ermis messenger system
"""

import asyncio
import json
from typing import Dict, Any, Callable, Optional
from queue import Queue, Empty
import threading
from datetime import datetime, timedelta
from .cronos_unified import UnifiedCronosManager


class CronosErmisReceiver:
    """Receiver for Cronos to handle messages from other gods"""
    
    def __init__(self):
        self.message_queue = Queue()
        self.handlers = {}
        self.running = False
        self.worker_thread = None
        self.scheduled_tasks = {}
        # Initialize unified Cronos manager
        self.cronos_manager = UnifiedCronosManager()
        
    def register_handler(self, message_type: str, handler: Callable):
        """Register a handler for specific message types"""
        self.handlers[message_type] = handler
        
    def receive_message(self, message: Dict[str, Any]) -> bool:
        """Receive a message from Ermis"""
        try:
            # Add timestamp if not present
            if 'timestamp' not in message:
                message['timestamp'] = datetime.now().isoformat()
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
        print(f"Cronos received unhandled message: {message}")
        
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
            
    # Cronos-specific message handlers
    def handle_schedule_task(self, message: Dict[str, Any]):
        """Handle task scheduling requests"""
        data = message.get('data', {})
        task_id = data.get('task_id')
        schedule = data.get('schedule')  # cron expression or datetime
        target_god = data.get('target_god')
        task_data = data.get('task_data')
        
        # Schedule the task
        self.scheduled_tasks[task_id] = {
            'schedule': schedule,
            'target': target_god,
            'data': task_data,
            'created': datetime.now()
        }
        print(f"Cronos scheduled task {task_id} for {target_god}")
        
    def handle_cancel_task(self, message: Dict[str, Any]):
        """Handle task cancellation requests"""
        data = message.get('data', {})
        task_id = data.get('task_id')
        
        if task_id in self.scheduled_tasks:
            del self.scheduled_tasks[task_id]
            print(f"Cronos cancelled task {task_id}")
        
    def handle_time_query(self, message: Dict[str, Any]):
        """Handle time-related queries"""
        data = message.get('data', {})
        query_type = data.get('query_type')
        
        if query_type == 'current_time':
            response = {'time': datetime.now().isoformat()}
        elif query_type == 'scheduled_tasks':
            response = {'tasks': list(self.scheduled_tasks.keys())}
        else:
            response = {'error': 'Unknown query type'}
            
        print(f"Cronos responding to time query: {response}")
        
    def handle_timer_request(self, message: Dict[str, Any]):
        """Handle timer/delay requests"""
        data = message.get('data', {})
        duration = data.get('duration', 0)  # in seconds
        callback_god = data.get('callback_god')
        callback_data = data.get('callback_data')
        
        # Set up timer
        timer_id = f"timer_{datetime.now().timestamp()}"
        print(f"Cronos setting timer {timer_id} for {duration}s")
    
    def handle_system_check(self, message: Dict[str, Any]):
        """Handle system check messages"""
        data = message.get('data', {})
        source = message.get('source', 'unknown')
        
        # Respond to health pings
        if data.get('type') == 'health_ping':
            # In a real implementation, we would send a response back
            # For now, just acknowledge it silently
            pass
    
    def handle_database_request(self, message: Dict[str, Any]):
        """Handle database requests through the unified manager"""
        # Forward entire message to unified manager
        result = self.cronos_manager.handle_ermis_request(message)
        
        # Send response back through Ermis if there's a response_id
        source = message.get('source', 'unknown')
        response_id = message.get('response_id')
        
        if response_id and hasattr(self, 'sender'):
            # Send response back
            from .ermis_sender import cronos_sender
            cronos_sender.send_response(source, result, response_id)
        
        return result
        
    def handle_store_and_cache(self, message: Dict[str, Any]):
        """Handle store and cache requests"""
        data = message.get('data', {})
        
        # Extract the actual data from nested structure
        if 'data' in data:
            actual_data = data['data']
        else:
            actual_data = data
            
        name = actual_data.get('name')
        value = actual_data.get('value')
        metadata = actual_data.get('metadata', {})
        
        # Store in Cronos database
        result = self.cronos_manager.handle_ermis_request({
            'type': 'store_variable',
            'data': {
                'name': name,
                'value': value,
                'metadata': metadata
            }
        })
        
        # Silently handle without printing unless error
        if not result.get('success', False):
            print(f"⚠️  Cronos failed to store {name}: {result.get('error', 'Storage failed')}")
            
    def handle_cache(self, message: Dict[str, Any]):
        """Handle cache-only requests (usually for Lightning but routed through Cronos)"""
        # This is typically handled by Lightning, but Cronos can log it
        pass
        
    def handle_query_functions(self, message: Dict[str, Any]):
        """Handle function query requests"""
        # Cronos can respond with available database functions
        pass
        
    def handle_unified_request(self, message: Dict[str, Any]):
        """Handle unified requests from other gods"""
        # These are general requests that might be routed to Cronos
        pass
    
    def handle_learn_and_store(self, message: Dict[str, Any]):
        """Handle learn_and_store messages from Olympus storage router"""
        # These are storage router messages that go to both Athena and Cronos
        # Cronos handles the storage part
        data = message.get('data', {})
        
        # Extract pattern data - it's nested
        if 'data' in data:
            data = data['data']
            
        # The actual pattern is in pattern_data.pattern
        if 'pattern_data' in data and 'pattern' in data['pattern_data']:
            pattern_info = data['pattern_data']['pattern']
        else:
            return
            
        # Store pattern in database
        if pattern_info:
            # Forward as store_pattern request
            result = self.cronos_manager.handle_ermis_request({
                'type': 'store_pattern',
                'data': pattern_info
            })
            
            # Silently handle unless error
            if not result.get('success', False):
                print(f"⚠️  Cronos failed to store pattern: {result.get('error', 'Storage failed')}")


# Singleton instance
cronos_receiver = CronosErmisReceiver()

# Register default handlers
cronos_receiver.register_handler('schedule_task', cronos_receiver.handle_schedule_task)
cronos_receiver.register_handler('cancel_task', cronos_receiver.handle_cancel_task)
cronos_receiver.register_handler('time_query', cronos_receiver.handle_time_query)
cronos_receiver.register_handler('timer_request', cronos_receiver.handle_timer_request)
cronos_receiver.register_handler('system_check', cronos_receiver.handle_system_check)
cronos_receiver.register_handler('database_request', cronos_receiver.handle_database_request)
cronos_receiver.register_handler('store_and_cache', cronos_receiver.handle_store_and_cache)
cronos_receiver.register_handler('cache', cronos_receiver.handle_cache)
cronos_receiver.register_handler('query_functions', cronos_receiver.handle_query_functions)
cronos_receiver.register_handler('unified_request', cronos_receiver.handle_unified_request)
cronos_receiver.register_handler('learn_and_store', cronos_receiver.handle_learn_and_store)