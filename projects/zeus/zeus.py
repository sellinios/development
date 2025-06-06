#!/usr/bin/env python3
"""
Zeus Framework Launcher
"""

import os
import sys
import subprocess

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # ERROR level only
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'  # Disable GPU if not needed

# Suppress absl logging
try:
    import absl.logging
    absl.logging.set_verbosity(absl.logging.ERROR)
except ImportError:
    pass  # absl not available yet

# Get paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ZEUS_ENV = os.path.join(SCRIPT_DIR, "zeus_env")
CORE_DIR = os.path.join(SCRIPT_DIR, "core")

# Check virtual environment
if not os.path.exists(ZEUS_ENV):
    print("Zeus environment not found. Please run core/install.sh first.")
    sys.exit(1)

# Activate virtual environment
activate_script = os.path.join(ZEUS_ENV, "bin", "activate_this.py")
if os.path.exists(activate_script):
    exec(open(activate_script).read(), {'__file__': activate_script})
else:
    # Fallback: modify sys.path
    site_packages = os.path.join(ZEUS_ENV, 'lib', 'python' + '.'.join(map(str, sys.version_info[:2])), 'site-packages')
    sys.path.insert(0, site_packages)

# Add core to path
sys.path.insert(0, CORE_DIR)

# Check if Ades validation is needed
validation_file = os.path.join(SCRIPT_DIR, '.ades_validated')

if not os.path.exists(validation_file) or '--force-test' in sys.argv:
    print("╔══════════════════════════════════════════════╗")
    print("║         ADES VALIDATION REQUIRED             ║")
    print("╚══════════════════════════════════════════════╝")
    
    # Run Ades tests
    os.chdir(os.path.join(CORE_DIR, 'ades'))
    tests = ['black_zeus.py', 'black_athena.py', 'black_cronos.py', 
             'black_ermis.py', 'black_lightning.py', 'black_olympus.py',
             'black_knowledge.py']
    
    all_passed = True
    for test in tests:
        print(f"\n  Running {test}...")
        result = subprocess.run([sys.executable, test], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"    ✓ {test} passed")
        else:
            print(f"    ✗ {test} failed")
            # Show actual errors for debugging
            if '--verbose' in sys.argv or True:  # Always show errors for now
                print("\n    ERROR OUTPUT:")
                stderr_lines = result.stderr.split('\\n')
                # Find the actual error, not TensorFlow warnings
                for i, line in enumerate(stderr_lines):
                    if 'Traceback' in line or 'Error' in line or 'FAILED' in line:
                        print("    " + line)
                        for j in range(i+1, min(i+10, len(stderr_lines))):
                            print("    " + stderr_lines[j])
                        break
            all_passed = False
    
    if all_passed:
        # Create validation file
        with open(validation_file, 'w') as f:
            import datetime
            f.write(f"Validated on {datetime.datetime.now()}\n")
        print("\n✓ All Ades tests passed!")
    else:
        print("\n✗ Ades validation failed!")
        print("Please check your installation.")
        sys.exit(1)

# Run the orchestrator
print("\n╔══════════════════════════════════════════════╗")
print("║           STARTING ZEUS FRAMEWORK            ║")
print("╚══════════════════════════════════════════════╝\n")

# Redirect stderr to devnull for the main execution to suppress late warnings
import contextlib
with contextlib.redirect_stderr(open(os.devnull, 'w')):
    from orchestrator import main
    main()
