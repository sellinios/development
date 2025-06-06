#!/usr/bin/env python3
"""
Divine Orchestrator - Initializes and coordinates all gods
Main entry point for the Zeus framework
"""

import sys
import os
import io
import contextlib

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import signal
import threading
import time
from typing import Dict, Any

# Temporarily suppress stderr during imports
@contextlib.contextmanager
def suppress_stderr():
    """Temporarily suppress stderr output"""
    old_stderr = sys.stderr
    sys.stderr = io.StringIO()
    try:
        yield
    finally:
        sys.stderr = old_stderr

# Import all gods with stderr suppression for TensorFlow warnings
with suppress_stderr():
    from zeus import (
        ZeusInterpreter, 
        zeus_receiver, 
        zeus_sender
    )
    from zeus.zeus_cli import ZeusCLI as CLI
    from athena import (
        AthenaCore,
        athena_receiver,
        athena_sender
    )
    from cronos import (
        CronosManager,
        cronos_receiver,
        cronos_sender
    )
    from lightning import (
        LightningManager,
        lightning_receiver,
        lightning_sender
    )
    from ermis import (
        messenger,
        get_messenger
    )


class DivineOrchestrator:
    """Orchestrates all gods in the Zeus framework"""
    
    def __init__(self):
        self.running = False
        self.components = {}
        self.threads = []
        
    def initialize_gods(self):
        """Initialize all god components"""
        print("⚡ Initializing the Divine Assembly...")
        
        # Initialize core components
        print("  • Zeus (King of Gods)...")
        with suppress_stderr():
            self.components['zeus'] = {
                'interpreter': ZeusInterpreter(),
                'receiver': zeus_receiver,
                'sender': zeus_sender,
                'cli': None  # CLI initialized separately
            }
        
        print("  • Athena (Goddess of Wisdom)...")
        with suppress_stderr():
            self.components['athena'] = {
                'core': AthenaCore(),
                'receiver': athena_receiver,
                'sender': athena_sender
            }
        
        print("  • Cronos (God of Time)...")
        with suppress_stderr():
            self.components['cronos'] = {
                'manager': CronosManager(),
                'receiver': cronos_receiver,
                'sender': cronos_sender
            }
        
        print("  • Lightning (God of Speed)...")
        with suppress_stderr():
            self.components['lightning'] = {
                'manager': LightningManager(),
                'receiver': lightning_receiver,
                'sender': lightning_sender
            }
        
        print("  • Ermis (Divine Messenger)...")
        with suppress_stderr():
            self.components['ermis'] = {
                'messenger': get_messenger()
            }
        
        print("✓ All gods initialized")
        
    def start_messaging_system(self):
        """Start the Ermis messaging system"""
        print("\n📨 Starting divine communication system...")
        
        # Start Ermis
        messenger.start()
        print("  • Ermis messenger started")
        
        # Start all receivers
        messenger.start_all_receivers()
        print("  • All receivers activated")
        
        print("✓ Communication system online")
        
    def perform_system_checks(self):
        """Perform system health checks"""
        print("\n🔍 Performing system checks...")
        
        # Test messaging between gods
        print("  • Testing Zeus → Athena communication...")
        result = zeus_sender.send_to_athena({'type': 'health_check'}, 'system_check')
        if result:
            print("    ✓ Communication successful")
        else:
            print("    ✗ Communication failed")
            
        # Test other paths
        print("  • Testing broadcast capability...")
        results = athena_sender.broadcast({'type': 'health_ping'}, 'system_check')
        success_count = sum(1 for r in results.values() if r)
        print(f"    ✓ Broadcast reached {success_count}/{len(results)} gods")
        
        print("✓ System checks complete")
        
    def start_cli(self):
        """Start the Zeus CLI"""
        print("\n🖥️  Starting Zeus CLI...")
        with suppress_stderr():
            cli = CLI()
        self.components['zeus']['cli'] = cli
        
        # Check for command-line execution mode
        import sys
        if len(sys.argv) > 2 and sys.argv[1] == '-c':
            # Execute command and exit
            command = sys.argv[2]
            result = cli.interpreter.execute(command)
            if result is not None:
                print(result)
            return
        
        # Run CLI in main thread
        try:
            cli.run()
        except KeyboardInterrupt:
            print("\n⚡ Zeus CLI interrupted")
            
    def start(self):
        """Start the orchestrator"""
        self.running = True
        
        print("=" * 60)
        print("⚡ ZEUS FRAMEWORK - Divine Assembly ⚡")
        print("=" * 60)
        
        # Initialize all components
        self.initialize_gods()
        
        # Start messaging system
        self.start_messaging_system()
        
        # Perform system checks
        self.perform_system_checks()
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        print("\n✨ Zeus Framework is ready!")
        print("=" * 60)
        
        # Start CLI (blocks until exit)
        self.start_cli()
        
    def stop(self):
        """Stop the orchestrator"""
        if not self.running:
            return
            
        print("\n⚡ Shutting down Zeus Framework...")
        self.running = False
        
        # Stop all receivers
        print("  • Stopping receivers...")
        messenger.stop_all_receivers()
        
        # Stop messenger
        print("  • Stopping Ermis...")
        messenger.stop()
        
        print("✓ Zeus Framework stopped")
        print("Farewell from Mount Olympus! ⚡")
        
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.stop()
        sys.exit(0)
        
    def send_system_announcement(self, message: str):
        """Send system-wide announcement"""
        zeus_sender.announce_system_event('announcement', {'message': message})


def main():
    """Main entry point"""
    orchestrator = DivineOrchestrator()
    
    try:
        orchestrator.start()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        orchestrator.stop()
        sys.exit(1)
    finally:
        orchestrator.stop()


if __name__ == '__main__':
    main()