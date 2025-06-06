#!/usr/bin/env python3
"""
Zeus AI - Intelligent Programming Language
Full version with all AI features
"""

import os
import sys
import subprocess

# Get the directory containing this script
script_dir = os.path.dirname(os.path.abspath(__file__))
venv_python = os.path.join(script_dir, 'zeus_env', 'bin', 'python')

# Check if virtual environment exists
if not os.path.exists(venv_python):
    print("Virtual environment not found. Please run ./install.sh first.")
    sys.exit(1)

# Create environment with all suppressions
env = os.environ.copy()
env['TF_CPP_MIN_LOG_LEVEL'] = '3'
env['TF_ENABLE_ONEDNN_OPTS'] = '0'
env['CUDA_VISIBLE_DEVICES'] = '-1'
env['GRPC_VERBOSITY'] = 'ERROR'
env['ABSL_MIN_LOG_LEVEL'] = '3'
env['TF_CPP_MIN_VLOG_LEVEL'] = '3'

# Run Zeus with stderr redirected for the first few seconds
try:
    # Start the process with stderr redirected to DEVNULL
    with open(os.devnull, 'w') as devnull:
        process = subprocess.Popen(
            [venv_python, '-m', 'zeus.interface.cli'],
            env=env,
            stderr=devnull,
            stdout=None,
            stdin=None
        )
        
        # Wait a moment for initialization
        import time
        time.sleep(2)
        
        # Now let it run normally
        process.stderr = None
        process.wait()
        
except KeyboardInterrupt:
    print("\nGoodbye!")
    sys.exit(0)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)