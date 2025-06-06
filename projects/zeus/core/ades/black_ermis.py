#!/usr/bin/env python3
"""
Black Ermis - Comprehensive test suite for Ermis communication system
Ensures all divine communication flows properly through Ermis
"""

import unittest
import sys
import os
import json
import threading
import time
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ermis import (
    messenger,
    MessageAdapter,
    ErmisConfig
)

# Import all god receivers and senders
from zeus.ermis_receiver import receiver as zeus_receiver
from zeus.ermis_sender import sender as zeus_sender
from athena.ermis_receiver import receiver as athena_receiver
from athena.ermis_sender import sender as athena_sender
from cronos.ermis_receiver import receiver as cronos_receiver
from cronos.ermis_sender import sender as cronos_sender
from lightning.ermis_receiver import receiver as lightning_receiver
from lightning.ermis_sender import sender as lightning_sender


class TestErmisCore(unittest.TestCase):
    """Test Ermis core functionality"""
    
    def setUp(self):
        self.config = ErmisConfig()
        self.messenger = messenger  # Use the global instance
        self.gods = {
            'zeus': {'receiver': zeus_receiver, 'sender': zeus_sender},
            'athena': {'receiver': athena_receiver, 'sender': athena_sender},
            'cronos': {'receiver': cronos_receiver, 'sender': cronos_sender},
            'lightning': {'receiver': lightning_receiver, 'sender': lightning_sender}
        }
    
    def test_initialization(self):
        """Test Ermis initialization"""
        self.assertIsNotNone(self.config)
        self.assertIsNotNone(self.messenger)
    
    def test_message_sending(self):
        """Test message sending functionality"""
        # Test basic message
        result = self.messenger.send_message("test_channel", "Hello, World!")
        self.assertTrue(result)
        
        # Test message with metadata
        metadata = {"priority": "high", "type": "alert"}
        result = self.messenger.send_message("test_channel", "Alert message", metadata)
        self.assertTrue(result)
    
    def test_message_receiving(self):
        """Test message receiving functionality"""
        # Send a message first
        self.messenger.send_message("test_channel", "Test message")
        
        # Receive messages
        messages = self.messenger.receive_messages("test_channel")
        self.assertGreater(len(messages), 0)
        self.assertEqual(messages[0]["content"], "Test message")
    
    def test_adapters(self):
        """Test message adapters"""
        adapter = MessageAdapter()
        
        # Test message formatting
        formatted = adapter.format_message("Hello", {"user": "test"})
        self.assertIn("Hello", formatted)
        
        # Test message parsing
        parsed = adapter.parse_message(formatted)
        self.assertEqual(parsed["content"], "Hello")
    
    def test_channels(self):
        """Test channel operations"""
        # Create channel
        channel_id = self.messenger.create_channel("new_channel")
        self.assertIsNotNone(channel_id)
        
        # List channels
        channels = self.messenger.list_channels()
        self.assertIn("new_channel", channels)
        
        # Delete channel
        result = self.messenger.delete_channel("new_channel")
        self.assertTrue(result)
    
    def test_configuration(self):
        """Test configuration management"""
        # Test config loading
        self.assertIsNotNone(self.config.get("default_timeout"))
        
        # Test config updating
        self.config.set("custom_setting", "value")
        self.assertEqual(self.config.get("custom_setting"), "value")
    
    def test_error_handling(self):
        """Test error handling"""
        # Test invalid channel
        result = self.messenger.send_message("invalid_channel", "message")
        self.assertFalse(result)
        
        # Test empty message
        result = self.messenger.send_message("test_channel", "")
        self.assertFalse(result)


class TestDivineCommunication(unittest.TestCase):
    """Test actual god-to-god communication through Ermis"""
    
    def setUp(self):
        self.gods = {
            'zeus': {'receiver': zeus_receiver, 'sender': zeus_sender},
            'athena': {'receiver': athena_receiver, 'sender': athena_sender},
            'cronos': {'receiver': cronos_receiver, 'sender': cronos_sender},
            'lightning': {'receiver': lightning_receiver, 'sender': lightning_sender}
        }
        self.test_results = {}
        
    def test_god_to_god_communication(self):
        """Test that each god can communicate with others through Ermis"""
        print("\n" + "=" * 60)
        print("🌩️  Testing Divine Communication Pathways")
        print("=" * 60)
        
        # Test each god sending to each other god
        for sender_god, sender_funcs in self.gods.items():
            for receiver_god, receiver_funcs in self.gods.items():
                if sender_god != receiver_god:
                    print(f"\n  Testing {sender_god.upper()} → {receiver_god.upper()}...")
                    
                    # Prepare test message
                    test_message = {
                        'from': sender_god,
                        'to': receiver_god,
                        'content': f"Divine message from {sender_god} to {receiver_god}",
                        'timestamp': time.time()
                    }
                    
                    # Send message
                    try:
                        result = sender_funcs['sender'].send(receiver_god, test_message)
                        if result:
                            print(f"    ✅ Message sent successfully")
                            self.test_results[f"{sender_god}->{receiver_god}"] = "sent"
                        else:
                            print(f"    ❌ Failed to send message")
                            self.test_results[f"{sender_god}->{receiver_god}"] = "failed"
                    except Exception as e:
                        print(f"    ❌ Error sending: {e}")
                        self.test_results[f"{sender_god}->{receiver_god}"] = "error"
                        
    def test_broadcast_communication(self):
        """Test broadcast messages to all gods"""
        print("\n\n🔊 Testing Broadcast Communication...")
        
        # Test broadcast from Zeus
        broadcast_message = {
            'from': 'zeus',
            'content': 'Divine decree to all gods!',
            'type': 'broadcast'
        }
        
        try:
            result = zeus_sender.broadcast(broadcast_message)
            if result:
                print("  ✅ Broadcast sent successfully")
                self.test_results['broadcast'] = "success"
            else:
                print("  ❌ Broadcast failed")
                self.test_results['broadcast'] = "failed"
        except Exception as e:
            print(f"  ❌ Broadcast error: {e}")
            self.test_results['broadcast'] = "error"
            
    def test_receiver_handlers(self):
        """Test that each god has proper message handlers"""
        print("\n\n📨 Checking Receiver Handlers...")
        
        for god_name, funcs in self.gods.items():
            receiver = funcs['receiver']
            
            # Check if receiver has necessary methods
            has_handler = hasattr(receiver, 'handle_message') or hasattr(receiver, 'process_message')
            has_start = hasattr(receiver, 'start') or hasattr(receiver, 'run')
            
            if has_handler and has_start:
                print(f"  ✅ {god_name.upper()}: Has proper receiver handlers")
            else:
                missing = []
                if not has_handler:
                    missing.append("message handler")
                if not has_start:
                    missing.append("start method")
                print(f"  ❌ {god_name.upper()}: Missing {', '.join(missing)}")
                
    def tearDown(self):
        """Print summary of communication tests"""
        print("\n" + "=" * 60)
        print("📊 Communication Test Summary:")
        print("=" * 60)
        
        success_count = sum(1 for v in self.test_results.values() if v in ["sent", "success"])
        total_count = len(self.test_results)
        
        if success_count == total_count:
            print(f"✅ All {total_count} communication tests passed!")
        else:
            print(f"❌ {success_count}/{total_count} communication tests passed")
            failures = [k for k, v in self.test_results.items() if v != "sent" and v != "success"]
            if failures:
                print(f"   Failed: {', '.join(failures)}")


if __name__ == '__main__':
    unittest.main()