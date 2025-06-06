"""
Ermis Request-Response System
Handles correlated request-response messaging with timeouts
"""

import uuid
import time
import threading
from typing import Dict, Any, Optional, Callable, Tuple
from dataclasses import dataclass
from queue import Queue, Empty
import logging

@dataclass
class PendingRequest:
    """Represents a pending request waiting for response"""
    request_id: str
    source: str
    destination: str
    request_time: float
    timeout: float
    response_queue: Queue
    callback: Optional[Callable] = None

class RequestResponseManager:
    """Manages request-response correlation and timeouts"""
    
    def __init__(self, default_timeout: float = 30.0):
        self.default_timeout = default_timeout
        self.pending_requests: Dict[str, PendingRequest] = {}
        self.lock = threading.Lock()
        self.cleanup_interval = 5.0  # Cleanup expired requests every 5 seconds
        self.running = False
        self.cleanup_thread = None
        self.logger = logging.getLogger(__name__)
        
    def start(self):
        """Start the cleanup thread"""
        if not self.running:
            self.running = True
            self.cleanup_thread = threading.Thread(target=self._cleanup_expired, daemon=True)
            self.cleanup_thread.start()
            
    def stop(self):
        """Stop the cleanup thread"""
        self.running = False
        if self.cleanup_thread:
            self.cleanup_thread.join(timeout=1.0)
            
    def create_request(self, source: str, destination: str, 
                      timeout: Optional[float] = None,
                      callback: Optional[Callable] = None) -> str:
        """
        Create a new request and return its ID
        
        Args:
            source: Source component
            destination: Target component
            timeout: Request timeout in seconds
            callback: Optional callback for async responses
            
        Returns:
            Request ID
        """
        request_id = str(uuid.uuid4())
        timeout = timeout or self.default_timeout
        
        pending = PendingRequest(
            request_id=request_id,
            source=source,
            destination=destination,
            request_time=time.time(),
            timeout=timeout,
            response_queue=Queue(maxsize=1),
            callback=callback
        )
        
        with self.lock:
            self.pending_requests[request_id] = pending
            
        return request_id
        
    def wait_for_response(self, request_id: str, timeout: Optional[float] = None) -> Tuple[bool, Any]:
        """
        Wait for a response to a request
        
        Args:
            request_id: The request ID to wait for
            timeout: Override timeout for this wait
            
        Returns:
            Tuple of (success, response_data)
        """
        with self.lock:
            pending = self.pending_requests.get(request_id)
            
        if not pending:
            return False, "Request not found"
            
        # Use provided timeout or request's timeout
        wait_timeout = timeout or pending.timeout
        remaining_time = wait_timeout - (time.time() - pending.request_time)
        
        if remaining_time <= 0:
            self._remove_request(request_id)
            return False, "Request timed out"
            
        try:
            response = pending.response_queue.get(timeout=remaining_time)
            self._remove_request(request_id)
            return True, response
        except Empty:
            self._remove_request(request_id)
            return False, "Request timed out"
            
    def handle_response(self, request_id: str, response_data: Any) -> bool:
        """
        Handle a response for a pending request
        
        Args:
            request_id: The request ID this response is for
            response_data: The response data
            
        Returns:
            True if response was delivered, False otherwise
        """
        with self.lock:
            pending = self.pending_requests.get(request_id)
            
        if not pending:
            self.logger.warning(f"Received response for unknown request: {request_id}")
            return False
            
        # Check if request expired
        if time.time() - pending.request_time > pending.timeout:
            self._remove_request(request_id)
            return False
            
        # Deliver response
        try:
            pending.response_queue.put_nowait(response_data)
            
            # Call callback if provided
            if pending.callback:
                try:
                    pending.callback(response_data)
                except Exception as e:
                    self.logger.error(f"Error in response callback: {e}")
                    
            return True
        except:
            return False
            
    def _remove_request(self, request_id: str):
        """Remove a request from pending"""
        with self.lock:
            self.pending_requests.pop(request_id, None)
            
    def _cleanup_expired(self):
        """Background thread to cleanup expired requests"""
        while self.running:
            current_time = time.time()
            expired_requests = []
            
            with self.lock:
                for request_id, pending in self.pending_requests.items():
                    if current_time - pending.request_time > pending.timeout:
                        expired_requests.append(request_id)
                        
            # Remove expired requests
            for request_id in expired_requests:
                self._remove_request(request_id)
                self.logger.debug(f"Cleaned up expired request: {request_id}")
                
            time.sleep(self.cleanup_interval)
            
    def get_pending_count(self) -> int:
        """Get count of pending requests"""
        with self.lock:
            return len(self.pending_requests)
            
    def cancel_request(self, request_id: str) -> bool:
        """Cancel a pending request"""
        return self._remove_request(request_id) is not None

# Global instance
request_response_manager = RequestResponseManager()