"""
Ermis Response Handler - Manages request-response correlation
Handles async communication between gods
"""

import threading
import time
import uuid
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
import queue


@dataclass
class PendingRequest:
    """Tracks a pending request waiting for response"""
    request_id: str
    sender: str
    timestamp: datetime
    timeout: float
    callback: Optional[Callable] = None
    response_queue: Optional[queue.Queue] = None
    

class ResponseHandler:
    """Manages request-response correlation and async communication"""
    
    def __init__(self):
        self.pending_requests: Dict[str, PendingRequest] = {}
        self.response_queues: Dict[str, queue.Queue] = {}  # god_name -> response queue
        self.lock = threading.Lock()
        self.cleanup_thread = None
        self.running = False
        
    def start(self):
        """Start the response handler"""
        self.running = True
        self.cleanup_thread = threading.Thread(target=self._cleanup_expired_requests)
        self.cleanup_thread.daemon = True
        self.cleanup_thread.start()
        
    def stop(self):
        """Stop the response handler"""
        self.running = False
        if self.cleanup_thread:
            self.cleanup_thread.join(timeout=1)
            
    def register_request(self, request_id: str, sender: str, timeout: float = 5.0,
                        callback: Optional[Callable] = None) -> queue.Queue:
        """
        Register a request that expects a response.
        
        Args:
            request_id: Unique request identifier
            sender: God that sent the request
            timeout: Maximum time to wait for response
            callback: Optional callback for async handling
            
        Returns:
            Queue to wait for response on
        """
        response_queue = queue.Queue(maxsize=1)
        
        with self.lock:
            self.pending_requests[request_id] = PendingRequest(
                request_id=request_id,
                sender=sender,
                timestamp=datetime.now(),
                timeout=timeout,
                callback=callback,
                response_queue=response_queue
            )
            
        return response_queue
        
    def handle_response(self, response: Dict[str, Any]) -> bool:
        """
        Handle an incoming response.
        
        Args:
            response: Response data containing 'request_id'
            
        Returns:
            True if response was matched to a request
        """
        request_id = response.get('request_id')
        if not request_id:
            return False
            
        with self.lock:
            pending = self.pending_requests.get(request_id)
            if not pending:
                return False
                
            # Remove from pending
            del self.pending_requests[request_id]
            
        # Handle callback if provided
        if pending.callback:
            try:
                pending.callback(response)
            except Exception as e:
                print(f"Error in response callback: {e}")
                
        # Put in response queue for sync waiting
        if pending.response_queue:
            try:
                pending.response_queue.put_nowait(response)
            except queue.Full:
                pass
                
        return True
        
    def wait_for_response(self, request_id: str, timeout: float = None) -> Optional[Dict[str, Any]]:
        """
        Wait synchronously for a response.
        
        Args:
            request_id: Request to wait for
            timeout: Override timeout
            
        Returns:
            Response data or None if timeout
        """
        with self.lock:
            pending = self.pending_requests.get(request_id)
            if not pending or not pending.response_queue:
                return None
                
        actual_timeout = timeout or pending.timeout
        
        try:
            response = pending.response_queue.get(timeout=actual_timeout)
            return response
        except queue.Empty:
            # Timeout - remove from pending
            with self.lock:
                if request_id in self.pending_requests:
                    del self.pending_requests[request_id]
            return None
            
    def get_response_queue(self, god_name: str) -> queue.Queue:
        """Get or create response queue for a god"""
        if god_name not in self.response_queues:
            self.response_queues[god_name] = queue.Queue()
        return self.response_queues[god_name]
        
    def _cleanup_expired_requests(self):
        """Background thread to clean up expired requests"""
        while self.running:
            try:
                now = datetime.now()
                expired_ids = []
                
                with self.lock:
                    for request_id, pending in self.pending_requests.items():
                        if now - pending.timestamp > timedelta(seconds=pending.timeout):
                            expired_ids.append(request_id)
                            
                    # Remove expired
                    for request_id in expired_ids:
                        pending = self.pending_requests.pop(request_id)
                        # Put timeout response in queue
                        if pending.response_queue:
                            try:
                                pending.response_queue.put_nowait({
                                    'error': 'Request timeout',
                                    'request_id': request_id,
                                    'timeout': True
                                })
                            except queue.Full:
                                pass
                                
                time.sleep(1)  # Check every second
                
            except Exception as e:
                print(f"Error in cleanup thread: {e}")
                
    def get_pending_count(self) -> int:
        """Get number of pending requests"""
        with self.lock:
            return len(self.pending_requests)
            
    def get_stats(self) -> Dict[str, Any]:
        """Get handler statistics"""
        with self.lock:
            oldest_request = None
            if self.pending_requests:
                oldest = min(self.pending_requests.values(), 
                           key=lambda x: x.timestamp)
                oldest_request = {
                    'request_id': oldest.request_id,
                    'age_seconds': (datetime.now() - oldest.timestamp).total_seconds()
                }
                
            return {
                'pending_requests': len(self.pending_requests),
                'response_queues': len(self.response_queues),
                'oldest_request': oldest_request
            }


# Global response handler instance
response_handler = ResponseHandler()