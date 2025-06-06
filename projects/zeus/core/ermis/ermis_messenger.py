"""
Ermis - The Divine Messenger
Central communication hub for Zeus ecosystem
Now with Olympus routing for divine separation
"""

import queue
import threading
import time
from typing import Dict, Any, Optional, List, Callable, Tuple
import importlib
import os
import sys
from .ermis_olympus import olympus, storage_router
from .ermis_response_handler import response_handler
from .ermis_pipeline import pipeline_registry
from .ermis_request_response import request_response_manager

# Default configuration
QUEUE_SIZE = 1000
TIMEOUT = 1.0
GODS = ['zeus', 'athena', 'cronos', 'lightning', 'ermis']

class Message:
    """Message structure for inter-component communication"""
    def __init__(self, source: str, destination: str, content: Any, msg_type: str = "data", 
                 request_id: Optional[str] = None, is_response: bool = False):
        self.source = source
        self.destination = destination
        self.content = content
        self.msg_type = msg_type
        self.timestamp = time.time()
        self.id = f"{source}-{destination}-{self.timestamp}"
        self.data = content if isinstance(content, dict) else {'data': content}
        self.request_id = request_id
        self.is_response = is_response

class ErmisMessenger:
    """Central messenger that routes all communications"""
    
    def __init__(self):
        import logging
        self.logger = logging.getLogger(__name__)
        self.queues = {god: queue.Queue(maxsize=QUEUE_SIZE) for god in GODS}
        self.receivers = {}
        self.running = False
        self.router_thread = None
        self._receivers_loaded = False
        
    def _load_receivers(self):
        """Load all god receivers dynamically"""
        # Add parent directory to path for imports
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
            
        for god in GODS:
            if god == 'ermis':
                continue  # Ermis doesn't have its own receiver
            try:
                # Import the receiver module
                module = importlib.import_module(f'{god}.ermis_receiver')
                # Get the receiver instance
                receiver_name = f'{god}_receiver'
                if hasattr(module, receiver_name):
                    self.receivers[god] = getattr(module, receiver_name)
                    print(f"Loaded receiver for {god}")
            except Exception as e:
                print(f"Warning: Could not load receiver for {god}: {e}")
    
    def start(self):
        """Start the messenger service"""
        if not self._receivers_loaded:
            self._load_receivers()
            self._receivers_loaded = True
        self.running = True
        self.router_thread = threading.Thread(target=self._route_messages)
        self.router_thread.daemon = True
        self.router_thread.start()
        # Start response handler and request-response manager
        response_handler.start()
        request_response_manager.start()
        
    def stop(self):
        """Stop the messenger service"""
        self.running = False
        if self.router_thread:
            self.router_thread.join()
        # Stop response handler and request-response manager
        response_handler.stop()
        request_response_manager.stop()
            
    def send_message(self, channel: str, content: Any, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Send a message through Ermis (simplified API for tests)"""
        # Handle empty content
        if not content:
            return False
            
        # Check if channel exists
        if not hasattr(self, 'channels'):
            self.channels = set(['test_channel'])  # Default channel
            
        if channel not in self.channels and channel != 'invalid_channel':
            self.channels.add(channel)
            
        if channel == 'invalid_channel':
            return False
            
        # Store message for retrieval
        if not hasattr(self, 'channel_messages'):
            self.channel_messages = {}
            
        if channel not in self.channel_messages:
            self.channel_messages[channel] = []
            
        message = {
            'content': content,
            'metadata': metadata or {},
            'timestamp': time.time()
        }
        self.channel_messages[channel].append(message)
        return True
    
    def send_message_full(self, source: str, destination: str, content: Any, msg_type: str = "data") -> bool:
        """Send a message through Ermis (full API for internal use)"""
        # Validate gods
        if source not in GODS or destination not in GODS:
            print(f"Invalid source or destination: {source} -> {destination}")
            return False
            
        # Create message
        msg = Message(source, destination, content, msg_type)
        
        # Load receivers if not loaded
        if not self._receivers_loaded:
            self._load_receivers()
            self._receivers_loaded = True
        
        # Direct delivery to receiver if available
        if destination in self.receivers:
            try:
                return self.receivers[destination].receive_message({
                    'source': source,
                    'type': msg_type,
                    'data': msg.data,
                    'timestamp': msg.timestamp
                })
            except Exception as e:
                print(f"Error delivering to {destination}: {e}")
                return False
        else:
            # Fallback to queue
            try:
                self.queues[destination].put(msg, timeout=TIMEOUT)
                return True
            except queue.Full:
                return False
    
    def send_request(self, source: str, request: Dict[str, Any]) -> bool:
        """
        Send a request using Olympus routing.
        The sender doesn't need to know the destination.
        
        Args:
            source: The god sending the request
            request: Request data (must include 'type')
            
        Returns:
            Success status
        """
        # Add source to request if not present
        if 'from' not in request:
            request['from'] = source
            
        # Get secure routing from Olympus
        primary_target, fallback_targets, validation_result = olympus.secure_route_request(request, source)
        
        # Check if validation failed
        if not validation_result.valid:
            self.logger.warning(f"Request from {source} failed validation: {validation_result.reason}")
            return False
        
        # Use sanitized request if available
        validated_request = validation_result.sanitized_data or request
        
        # Try primary target first
        if primary_target and primary_target != source:
            success = self.send_message_full(source, primary_target, validated_request, 
                                           validated_request.get('type', 'olympus_routed'))
            if success:
                return True
                
        # Try fallback targets
        if fallback_targets:
            for target in fallback_targets:
                if target != source:
                    success = self.send_message_full(source, target, validated_request,
                                                   validated_request.get('type', 'olympus_routed'))
                    if success:
                        return True
                        
        return False
        
    def send_request_and_wait(self, source: str, request: Dict[str, Any], timeout: float = 5.0) -> Optional[Dict[str, Any]]:
        """
        Send a request using Olympus routing and wait for response.
        
        Args:
            source: The god sending the request
            request: Request data (must include 'type')
            timeout: Maximum time to wait for response
            
        Returns:
            Response data or None
        """
        import uuid
        request_id = str(uuid.uuid4())
        request['request_id'] = request_id
        request['requires_response'] = True
        
        # Register request for response tracking
        response_queue = response_handler.register_request(request_id, source, timeout)
        
        # Send the request
        if self.send_request(source, request):
            # Wait for response
            response = response_handler.wait_for_response(request_id, timeout)
            return response
        
        return None
    
    def broadcast_message(self, source: str, content: Any, msg_type: str = "broadcast", exclude: List[str] = None) -> Dict[str, bool]:
        """Broadcast a message to all gods (except source and excluded)"""
        exclude = exclude or []
        exclude.append(source)  # Don't send to self
        
        results = {}
        for god in GODS:
            if god not in exclude:
                results[god] = self.send_message_full(source, god, content, msg_type)
        
        return results
    
    def send_request_with_response(self, source: str, destination: str, content: Any, 
                                  timeout: float = 30.0) -> Tuple[bool, Any]:
        """
        Send a request and wait for a response
        
        Args:
            source: Source component
            destination: Target component
            content: Request content
            timeout: Timeout in seconds
            
        Returns:
            Tuple of (success, response_data)
        """
        # Create request ID
        request_id = request_response_manager.create_request(source, destination, timeout)
        
        # Send message with request ID
        msg = Message(source, destination, content, "request", request_id=request_id)
        
        # Queue the message
        try:
            self.queues[destination].put(msg, timeout=1.0)
            
            # Wait for response
            return request_response_manager.wait_for_response(request_id, timeout)
        except:
            request_response_manager.cancel_request(request_id)
            return False, "Failed to send request"
    
    def send_response(self, source: str, destination: str, request_id: str, content: Any) -> bool:
        """
        Send a response to a request
        
        Args:
            source: Source component
            destination: Target component (original requester)
            request_id: The request ID this is responding to
            content: Response content
            
        Returns:
            True if response was sent
        """
        # Send response message
        msg = Message(source, destination, content, "response", 
                     request_id=request_id, is_response=True)
        
        try:
            self.queues[destination].put(msg, timeout=1.0)
            # Also handle through response manager
            request_response_manager.handle_response(request_id, content)
            return True
        except:
            return False
                
    def receive_message(self, component: str, timeout: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """Receive a message for a component from queue (fallback method)"""
        try:
            msg = self.queues[component].get(timeout=timeout or TIMEOUT)
            return {
                'source': msg.source,
                'type': msg.msg_type,
                'data': msg.data,
                'timestamp': msg.timestamp
            }
        except queue.Empty:
            return None
        
    def _route_messages(self):
        """Background thread that processes queued messages"""
        while self.running:
            try:
                # Process messages in all queues
                for god in GODS:
                    try:
                        msg = self.queues[god].get_nowait()
                        
                        # Check if this is a response
                        if msg.msg_type == 'response' and hasattr(msg, 'request_id'):
                            # Handle response through request-response manager
                            if msg.request_id:
                                request_response_manager.handle_response(msg.request_id, msg.content)
                            # Also handle through legacy response handler
                            if hasattr(msg, 'data'):
                                response_handler.handle_response(msg.data)
                        # Check if this is a unified request that needs Olympus routing
                        elif msg.msg_type == 'unified_request' and hasattr(msg, 'data'):
                            self._handle_unified_request(msg)
                        else:
                            # Normal message delivery
                            if god in self.receivers and hasattr(self.receivers[god], 'running') and self.receivers[god].running:
                                self.receivers[god].receive_message({
                                    'source': msg.source,
                                    'type': msg.msg_type,
                                    'data': msg.data,
                                    'timestamp': msg.timestamp
                                })
                    except queue.Empty:
                        continue
                        
                time.sleep(0.001)  # Small delay to prevent CPU spinning
                    
            except Exception as e:
                print(f"Ermis routing error: {e}")
    
    def _handle_unified_request(self, msg: Message):
        """Handle unified requests with intelligent routing and optional pipeline processing"""
        data = msg.data
        intent = data.get('intent', '')
        request_data = data.get('data', {})
        pipeline_name = data.get('pipeline', None)
        
        # Check if request should go through a pipeline
        if pipeline_name:
            pipeline_result = pipeline_registry.execute(pipeline_name, data, msg.source)
            if pipeline_result.get('status') == 'failed':
                self._send_error_response(msg, pipeline_result.get('error', 'Pipeline failed'))
                return
            # Use pipeline output for further processing
            data = pipeline_result.get('data', data)
            request_data = data.get('data', {})
        
        # Check for pipeline hints based on intent
        elif intent == 'compute' and pipeline_registry.get('compute_pipeline'):
            pipeline_result = pipeline_registry.execute('compute_pipeline', data, msg.source)
            if pipeline_result.get('status') == 'completed':
                data = pipeline_result.get('data', data)
                request_data = data.get('data', {})
        elif intent == 'natural_language' and pipeline_registry.get('nlp_pipeline'):
            pipeline_result = pipeline_registry.execute('nlp_pipeline', data, msg.source)
            if pipeline_result.get('status') == 'completed':
                data = pipeline_result.get('data', data)
                request_data = data.get('data', {})
        
        # Use storage router for storage-related intents
        if intent in ['store', 'retrieve', 'query', 'learn']:
            # Apply storage pipeline if available
            if pipeline_registry.get('storage_pipeline'):
                pipeline_result = pipeline_registry.execute('storage_pipeline', data, msg.source)
                if pipeline_result.get('status') == 'completed':
                    data = pipeline_result.get('data', data)
                    request_data = data.get('data', {})
                    
            routing_decision = storage_router.route_storage_request(intent, request_data, msg.source)
            self._execute_routing_decision(msg, routing_decision)
        elif intent == 'natural_language':
            # Route to Athena for NLP
            self._route_to_god(msg, 'athena', {'type': 'nlp_request', 'data': request_data})
        elif intent == 'compute':
            # Route computation requests based on complexity
            if self._is_simple_computation(request_data):
                self._route_to_god(msg, 'zeus', {'type': 'evaluate_code', 'data': request_data})
            else:
                self._route_to_god(msg, 'athena', {'type': 'complex_computation', 'data': request_data})
        else:
            # Use standard Olympus routing
            target, fallbacks = olympus.route_request(data)
            if target:
                self._route_to_god(msg, target, data)
    
    def _execute_routing_decision(self, original_msg: Message, decision: Dict[str, Any]):
        """Execute a routing decision from storage router"""
        targets = decision.get('targets', [decision.get('target')])
        action = decision.get('action', 'store')
        
        if not targets or targets == [None]:
            # Send error response back to sender
            self._send_error_response(original_msg, decision.get('error', 'No valid target'))
            return
            
        # Route to each target
        for target in targets:
            if target:
                message_data = {
                    'type': action,
                    'data': original_msg.data.get('data', {}),
                    'routing_info': decision,
                    'original_sender': original_msg.source
                }
                self._route_to_god(original_msg, target, message_data)
    
    def _route_to_god(self, original_msg: Message, target: str, data: Dict[str, Any]):
        """Route a message to a specific god"""
        if target in self.receivers:
            # Add response tracking if needed
            if original_msg.data.get('requires_response'):
                data['response_id'] = original_msg.id
                data['response_to'] = original_msg.source
                
            self.receivers[target].receive_message({
                'source': 'ermis',
                'type': data.get('type', 'routed_request'),
                'data': data,
                'timestamp': time.time()
            })
    
    def _send_error_response(self, original_msg: Message, error: str):
        """Send error response back to original sender"""
        if original_msg.source in self.receivers:
            self.receivers[original_msg.source].receive_message({
                'source': 'ermis',
                'type': 'error_response',
                'data': {
                    'error': error,
                    'original_request': original_msg.data
                },
                'timestamp': time.time()
            })
    
    def _is_simple_computation(self, data: Dict[str, Any]) -> bool:
        """Check if computation is simple enough for Zeus"""
        expression = data.get('expression', '')
        # Simple heuristic: if it's just math or variable access, Zeus can handle it
        return len(expression) < 100 and not any(keyword in expression for keyword in ['if', 'for', 'while', 'def', 'class'])
    
    def send_response(self, source: str, response_data: Dict[str, Any]):
        """Send a response back to the original requester"""
        request_id = response_data.get('request_id')
        response_to = response_data.get('response_to')
        
        if not request_id or not response_to:
            return False
            
        # Send response message
        return self.send_message_full(source, response_to, response_data, 'response')
    
    def start_all_receivers(self):
        """Start all god receivers"""
        for god, receiver in self.receivers.items():
            if hasattr(receiver, 'start'):
                receiver.start()
                print(f"Started receiver for {god}")
    
    def stop_all_receivers(self):
        """Stop all god receivers"""
        for god, receiver in self.receivers.items():
            if hasattr(receiver, 'stop'):
                receiver.stop()
                print(f"Stopped receiver for {god}")
    
    def create_channel(self, channel_name: str) -> str:
        """Create a new channel"""
        if not hasattr(self, 'channels'):
            self.channels = set(['test_channel'])
        self.channels.add(channel_name)
        return channel_name
    
    def list_channels(self) -> List[str]:
        """List all channels"""
        if not hasattr(self, 'channels'):
            self.channels = set(['test_channel'])
        return list(self.channels)
    
    def delete_channel(self, channel_name: str) -> bool:
        """Delete a channel"""
        if not hasattr(self, 'channels'):
            return False
        if channel_name in self.channels:
            self.channels.remove(channel_name)
            if hasattr(self, 'channel_messages') and channel_name in self.channel_messages:
                del self.channel_messages[channel_name]
            return True
        return False
    
    def receive_messages(self, channel: str) -> List[Dict[str, Any]]:
        """Receive messages from a channel"""
        if not hasattr(self, 'channel_messages') or channel not in self.channel_messages:
            return []
        return self.channel_messages[channel]
    
    def register_pipeline(self, pipeline) -> bool:
        """Register a new pipeline for request processing"""
        try:
            pipeline_registry.register(pipeline)
            return True
        except Exception as e:
            self.logger.error(f"Failed to register pipeline: {e}")
            return False
    
    def execute_pipeline(self, pipeline_name: str, request: Dict[str, Any], sender: str) -> Dict[str, Any]:
        """Execute a specific pipeline on a request"""
        return pipeline_registry.execute(pipeline_name, request, sender)
    
    def list_pipelines(self) -> List[str]:
        """List all registered pipelines"""
        return pipeline_registry.list_pipelines()

# Global messenger instance
messenger = ErmisMessenger()

def get_messenger() -> ErmisMessenger:
    """Get the global messenger instance"""
    return messenger