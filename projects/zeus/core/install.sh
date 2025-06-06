#!/bin/bash

# Zeus Core Installation Script
# This creates a fresh Zeus installation with the new structure

set -e  # Exit on error

# Get paths first
CORE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ZEUS_ROOT="$(dirname "$CORE_DIR")"

echo "╔══════════════════════════════════════════════╗"
echo "║          ZEUS CORE INSTALLATION              ║"
echo "╚══════════════════════════════════════════════╝"

# Version management
VERSION_FILE="$CORE_DIR/.version"
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$VERSION_FILE")
    # Parse version components
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
    # Increment patch version
    PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$PATCH"
else
    # First installation
    NEW_VERSION="0.0.1"
fi

echo -e "\nInstalling Zeus Framework v$NEW_VERSION"
echo "$NEW_VERSION" > "$VERSION_FILE"

echo -e "\nCore directory: $CORE_DIR"
echo "Zeus root: $ZEUS_ROOT"

# Step 1: Clean up - Fresh start (preserve persistent data)
echo -e "\n[1/8] Fresh start - Cleaning up old files..."
cd "$ZEUS_ROOT"

# Preserve persistent data
PRESERVE_ITEMS=("core" "data")

for item in *; do
    # Check if item should be preserved
    should_preserve=false
    for preserve in "${PRESERVE_ITEMS[@]}"; do
        if [ "$item" = "$preserve" ]; then
            should_preserve=true
            break
        fi
    done
    
    if [ "$should_preserve" = false ] && [ -e "$item" ]; then
        echo "  Removing $item..."
        rm -rf "$item"
    else
        echo "  Preserving $item..."
    fi
done

# Clean up garbage files in core directory
echo "  Cleaning up core directory..."
cd "$CORE_DIR"
rm -rf zeus_framework.egg-info zeus_main.py .pytest_cache __pycache__
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Step 2: Create virtual environment in zeus root
echo -e "\n[2/8] Creating virtual environment..."
cd "$ZEUS_ROOT"
python3.12 -m venv zeus_env
source zeus_env/bin/activate

# Step 3: Install dependencies
echo -e "\n[3/8] Installing dependencies..."
pip install --upgrade pip
pip install -r "$CORE_DIR/resources/requirements.txt"

# Download NLP data
echo "  Downloading NLP models..."
python -c "
import nltk
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('wordnet', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
"
python -m spacy download en_core_web_sm

# Step 4: Create zeus.py in root
echo -e "\n[4/8] Creating zeus.py executable..."
cat > "$ZEUS_ROOT/zeus.py" << 'EOF'
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
EOF

chmod +x "$ZEUS_ROOT/zeus.py"

# Step 5: Set up data directory structure
echo -e "\n[5/8] Setting up data directory..."
DATA_DIR="$ZEUS_ROOT/data"
if [ ! -d "$DATA_DIR" ]; then
    echo "  Creating data directory structure..."
    mkdir -p "$DATA_DIR"
fi

# Set up Lightning cache in data directory
LIGHTNING_DIR="$DATA_DIR/lightning"
if [ ! -d "$LIGHTNING_DIR" ]; then
    echo "  Creating Lightning cache directories..."
    mkdir -p "$LIGHTNING_DIR/cache"
    mkdir -p "$LIGHTNING_DIR/compiled"
    mkdir -p "$LIGHTNING_DIR/bytecode"
    mkdir -p "$LIGHTNING_DIR/llvm"
    mkdir -p "$LIGHTNING_DIR/jit"
    mkdir -p "$LIGHTNING_DIR/native"
else
    echo "  Lightning cache preserved"
    # Ensure all subdirectories exist
    mkdir -p "$LIGHTNING_DIR/cache"
    mkdir -p "$LIGHTNING_DIR/compiled"
    mkdir -p "$LIGHTNING_DIR/bytecode"
    mkdir -p "$LIGHTNING_DIR/llvm"
    mkdir -p "$LIGHTNING_DIR/jit"
    mkdir -p "$LIGHTNING_DIR/native"
fi

# Create data README
cat > "$DATA_DIR/README.md" << 'EOF'
# Zeus Framework Runtime Data

This directory contains all runtime data for the Zeus framework.

## Structure:
- `cronos.db` - Persistent knowledge database (managed by Cronos)
  - Variables, functions, patterns
  - Session history
  - Learned concepts and relations
  
- `lightning/` - Performance cache (managed by Lightning)
  - `cache/` - Cached bytecode and intermediate representations
  - `compiled/` - Native machine code libraries
  - `bytecode/` - Python bytecode (.pyc)
  - `llvm/` - LLVM intermediate representation
  - `jit/` - Just-in-time compiled hot paths
  - `native/` - Platform-specific machine code

## Important:
- This data is preserved between Zeus framework reinstalls
- Do NOT commit this directory to version control
- Back up cronos.db to preserve your learned patterns and functions
EOF

# Step 6: Create Python package files
echo -e "\n[6/8] Setting up Python packages..."

# Create __init__.py for ades
cat > "$CORE_DIR/ades/__init__.py" << 'EOF'
"""
Ades - Testing Framework for Zeus
Formerly known as Black Zeus
"""

__all__ = ['black', 'black_zeus', 'black_athena', 'black_cronos', 
           'black_ermis', 'black_lightning', 'black_integration']
EOF

# Create setup.py
cat > "$ZEUS_ROOT/setup.py" << EOF
from setuptools import setup, find_packages

setup(
    name="zeus-framework",
    version="$NEW_VERSION",
    packages=find_packages(where="core"),
    package_dir={"": "core"},
    python_requires=">=3.8",
    install_requires=[
        "tensorflow>=2.0.0",
        "numpy",
        "nltk",
        "spacy",
        "sqlalchemy",
        "click"
    ],
    entry_points={
        'console_scripts': [
            'zeus=orchestrator:main',
        ],
    },
)
EOF

# Install in development mode
cd "$ZEUS_ROOT"
pip install -e .

# Clean up build artifacts from core directory
echo "  Cleaning build artifacts from core..."
rm -rf "$CORE_DIR/zeus_framework.egg-info"
find "$CORE_DIR" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find "$CORE_DIR" -name "*.pyc" -delete 2>/dev/null || true

# Step 7: Verify components with new structure
echo -e "\n[7/8] Verifying components..."

# Check gods
gods=("zeus" "athena" "cronos" "ermis" "lightning" "ades")
for god in "${gods[@]}"; do
    if [ -d "$CORE_DIR/$god" ]; then
        # Check for key files in new structure
        case $god in
            "zeus")
                [ -f "$CORE_DIR/$god/zeus_interpreter.py" ] && echo "  ✓ $god module verified" || echo "  ✗ $god missing zeus_interpreter.py"
                ;;
            "athena")
                [ -f "$CORE_DIR/$god/athena_core.py" ] && echo "  ✓ $god module verified" || echo "  ✗ $god missing athena_core.py"
                ;;
            "cronos")
                [ -f "$CORE_DIR/$god/cronos_manager.py" ] && echo "  ✓ $god module verified" || echo "  ✗ $god missing cronos_manager.py"
                ;;
            "ermis")
                [ -f "$CORE_DIR/$god/ermis_messenger.py" ] && echo "  ✓ $god module verified" || echo "  ✗ $god missing ermis_messenger.py"
                ;;
            "lightning")
                [ -f "$CORE_DIR/$god/lightning_manager.py" ] && echo "  ✓ $god module verified" || echo "  ✗ $god missing lightning_manager.py"
                ;;
            "ades")
                [ -f "$CORE_DIR/$god/black.py" ] && echo "  ✓ $god module verified" || echo "  ✗ $god missing black.py"
                ;;
        esac
    else
        echo "  ✗ $god module missing from core!"
        exit 1
    fi
done

# Create .gitignore
cat > "$ZEUS_ROOT/.gitignore" << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
zeus_env/
venv/
ENV/
env/

# Distribution
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Zeus specific
.ades_validated
.version
*.log
*.db
cronos.db
lightning/cache/
lightning/compiled/
core/zeus_framework.egg-info/
core/zeus_main.py
core/.pytest_cache/
core/.version

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
EOF

# Step 8: Final message
echo -e "\n[8/8] Installation complete!"

echo -e "\n╔══════════════════════════════════════════════╗"
echo "║         INSTALLATION SUCCESSFUL!             ║"
printf "║         Zeus Framework v%-21s║\n" "$NEW_VERSION"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "To run Zeus:"
echo "  1. Activate environment: source $ZEUS_ROOT/zeus_env/bin/activate"
echo "  2. Run Zeus: python $ZEUS_ROOT/zeus.py"
echo "     Or simply: $ZEUS_ROOT/zeus.py"
echo ""
echo "Divine Architecture:"
echo ""
echo "              ╔═════════════════════════════╗"
echo "              ║         OLYMPUS             ║"
echo "              ║   (Divine Routing System)   ║"
echo "              ╚══════════════╤══════════════╝"
echo "                             │"
echo "              ╔══════════════╧══════════════╗"
echo "              ║          ERMIS              ║"
echo "              ║  (Central Message Router)   ║"
echo "              ╚═══╤═══════╤═══════╤═══════╤═╝"
echo "                  │       │       │       │"
echo "              ┌───┴───┬───┴───┬───┴───┬───┴───┐"
echo "              │       │       │       │       │"
echo "         ╔════╧═══╗ ╔═╧══════╗ ╔═╧══════╗ ╔═╧═══════╗"
echo "         ║  ZEUS  ║ ║ ATHENA ║ ║ CRONOS ║ ║LIGHTNING║"
echo "         ╚════════╝ ╚════════╝ ╚════════╝ ╚═════════╝"
echo ""
echo "Communication Flow:"
echo "  • Gods send requests without knowing the target"
echo "  • Olympus routes based on request type/domain"
echo "  • Ermis delivers messages between gods"
echo ""
echo "Each god has:"
echo "  • ermis_receiver.py - Receives messages"
echo "  • ermis_sender.py - Sends messages"
echo "  • Domain-specific responsibilities"
echo ""
echo "Testing Framework: Ades (in core/ades/)"
echo "  • black.py - Code standards checker"
echo "  • black_*.py - Component tests"
echo "  • black_olympus.py - Validates divine separation"
echo ""
echo "Note: Ades tests will run on first execution."
echo ""

# Final cleanup to ensure core directory stays clean
find "$CORE_DIR" -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find "$CORE_DIR" -name "*.pyc" -delete 2>/dev/null || true