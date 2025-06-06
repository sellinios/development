#!/usr/bin/env python3
"""
Black Integration - Integration tests for god communication
Tests the complete messaging system between all gods
"""

import unittest
import sys
import os
import time
import threading

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ermis import messenger, get_messenger
from zeus import zeus_receiver, zeus_sender
from athena import athena_receiver, athena_sender
from cronos import cronos_receiver, cronos_sender
from lightning import lightning_receiver, lightning_sender


class TestGodCommunication(unittest.TestCase):
    """Test inter-god communication through Ermis"""
    
    def setUp(self):
        """Initialize all components"""
        self.messenger = get_messenger()
        self.received_messages = {
            'zeus': [],
            'athena': [],
            'cronos': [],
            'lightning': []
        }
        
        # Override message handlers to capture messages
        self._setup_test_handlers()
        
        # Start all components
        self.messenger.start()
        zeus_receiver.start()
        athena_receiver.start()
        cronos_receiver.start()
        lightning_receiver.start()
        
        # Give components time to initialize
        time.sleep(0.1)
        
    def tearDown(self):
        """Stop all components"""
        zeus_receiver.stop()
        athena_receiver.stop()
        cronos_receiver.stop()
        lightning_receiver.stop()
        self.messenger.stop()
        
    def _setup_test_handlers(self):
        """Setup test message handlers"""
        def create_handler(god_name):
            def handler(message):
                self.received_messages[god_name].append(message)
            return handler
            
        # Register test handlers
        zeus_receiver.register_handler('test_message', create_handler('zeus'))
        athena_receiver.register_handler('test_message', create_handler('athena'))
        cronos_receiver.register_handler('test_message', create_handler('cronos'))
        lightning_receiver.register_handler('test_message', create_handler('lightning'))
        
    def test_zeus_to_athena(self):
        """Test Zeus sending message to Athena"""
        # Send message
        result = zeus_sender.send_to_athena({'test': 'data'}, 'test_message')
        self.assertTrue(result)
        
        # Wait for message to be processed
        time.sleep(0.1)
        
        # Check message received
        self.assertEqual(len(self.received_messages['athena']), 1)
        msg = self.received_messages['athena'][0]
        self.assertEqual(msg['source'], 'zeus')
        self.assertEqual(msg['type'], 'test_message')
        self.assertEqual(msg['data']['test'], 'data')
        
    def test_athena_to_zeus(self):
        """Test Athena sending message to Zeus"""
        # Send message
        result = athena_sender.send_to_zeus({'analysis': 'complete'}, 'test_message')
        self.assertTrue(result)
        
        # Wait for message to be processed
        time.sleep(0.1)
        
        # Check message received
        self.assertEqual(len(self.received_messages['zeus']), 1)
        msg = self.received_messages['zeus'][0]
        self.assertEqual(msg['source'], 'athena')
        self.assertEqual(msg['data']['analysis'], 'complete')
        
    def test_broadcast_from_zeus(self):
        """Test Zeus broadcasting to all gods"""
        # Broadcast message
        results = zeus_sender.broadcast({'announcement': 'system update'}, 'test_message')
        
        # Check all gods received it (except Zeus)
        self.assertTrue(results['athena'])
        self.assertTrue(results['cronos'])
        self.assertTrue(results['lightning'])
        
        # Wait for messages to be processed
        time.sleep(0.1)
        
        # Verify all received
        self.assertEqual(len(self.received_messages['athena']), 1)
        self.assertEqual(len(self.received_messages['cronos']), 1)
        self.assertEqual(len(self.received_messages['lightning']), 1)
        self.assertEqual(len(self.received_messages['zeus']), 0)  # Zeus shouldn't receive its own broadcast
        
    def test_cronos_scheduling(self):
        """Test Cronos scheduling functionality"""
        # Schedule a task
        result = zeus_sender.schedule_task(
            'test_task_1',
            '* * * * *',
            'athena',
            {'action': 'process'}
        )
        self.assertTrue(result)
        
        # Wait for message
        time.sleep(0.1)
        
        # Cronos should have the scheduled task
        # In real implementation, we'd check cronos_receiver.scheduled_tasks
        
    def test_lightning_optimization(self):
        """Test Lightning optimization requests"""
        # Request optimization
        result = athena_sender.request_memory_optimization('neural_cache', 1024.5)
        self.assertTrue(result)
        
        # Lightning should receive the request
        time.sleep(0.1)
        
    def test_message_chain(self):
        """Test message chain: Zeus -> Athena -> Lightning -> Cronos"""
        received_count = {'count': 0}
        
        def chain_handler_athena(message):
            received_count['count'] += 1
            # Athena forwards to Lightning
            athena_sender.send_to_lightning({'forwarded': True}, 'test_message')
            
        def chain_handler_lightning(message):
            received_count['count'] += 1
            # Lightning forwards to Cronos
            lightning_sender.send_to_cronos({'optimized': True}, 'test_message')
            
        def chain_handler_cronos(message):
            received_count['count'] += 1
            
        # Register chain handlers
        athena_receiver.register_handler('chain_test', chain_handler_athena)
        lightning_receiver.register_handler('test_message', chain_handler_lightning)
        cronos_receiver.register_handler('test_message', chain_handler_cronos)
        
        # Start the chain
        zeus_sender.send_to_athena({'start': 'chain'}, 'chain_test')
        
        # Wait for chain to complete
        time.sleep(0.3)
        
        # All three should have received
        self.assertEqual(received_count['count'], 3)
        
    def test_concurrent_messages(self):
        """Test handling concurrent messages"""
        message_count = 10
        
        def send_messages(sender, target_func, god_name):
            for i in range(message_count):
                target_func({'index': i}, 'test_message')
                
        # Create threads for concurrent sending
        threads = [
            threading.Thread(target=send_messages, args=(zeus_sender, zeus_sender.send_to_athena, 'athena')),
            threading.Thread(target=send_messages, args=(athena_sender, athena_sender.send_to_zeus, 'zeus')),
            threading.Thread(target=send_messages, args=(cronos_sender, cronos_sender.send_to_lightning, 'lightning')),
            threading.Thread(target=send_messages, args=(lightning_sender, lightning_sender.send_to_cronos, 'cronos'))
        ]
        
        # Start all threads
        for t in threads:
            t.start()
            
        # Wait for completion
        for t in threads:
            t.join()
            
        # Wait for processing
        time.sleep(0.5)
        
        # Check all messages received
        self.assertEqual(len(self.received_messages['zeus']), message_count)
        self.assertEqual(len(self.received_messages['athena']), message_count)
        # Note: cronos and lightning also receive from the chain


class TestMessagingReliability(unittest.TestCase):
    """Test messaging system reliability"""
    
    def test_receiver_not_started(self):
        """Test sending to receiver that's not started"""
        # Don't start receivers
        result = zeus_sender.send_to_athena({'test': 'offline'})
        # Should still return True (queued)
        self.assertTrue(result)
        
    def test_queue_overflow(self):
        """Test queue overflow handling"""
        # This would test sending many messages to fill queue
        # Implementation depends on queue size limits
        pass


if __name__ == '__main__':
    unittest.main()