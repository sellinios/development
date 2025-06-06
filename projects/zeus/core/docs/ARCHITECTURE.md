# Zeus System Architecture

## Overview

Zeus is a cognitive programming language with a distributed architecture inspired by Greek mythology. Each component is named after a Greek god and has specific responsibilities.

## System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         ZEUS CLI                            │
│                    (User Interface)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                        ERMIS                                │
│                  (Message Router)                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Queues: zeus, athena, cronos, lightning, olympus   │  │
│  └─────────────────────────────────────────────────────┘  │
└──────┬───────────┬───────────┬───────────┬─────────────────┘
       │           │           │           │
┌──────▼────┐ ┌────▼────┐ ┌───▼────┐ ┌────▼─────┐
│   ZEUS    │ │ ATHENA  │ │ CRONOS │ │LIGHTNING │
│Interpreter│ │AI Brain │ │Storage │ │Compiler  │
└───────────┘ └─────────┘ └────────┘ └──────────┘
```

## Component Details

### 1. Zeus (Interpreter)
**Location**: `core/zeus/`
**Purpose**: Main language interpreter and runtime
**Key Files**:
- `zeus_interpreter.py` - Main interpreter loop
- `zeus_parser.py` - Language parser
- `zeus_evaluator.py` - Expression evaluator
- `zeus_runtime.py` - Runtime environment

### 2. Athena (AI Brain)
**Location**: `core/athena/`
**Purpose**: Natural language understanding and pattern learning
**Key Files**:
- `athena_coordinator.py` - Brain coordinator
- `athena_pattern_learner.py` - Pattern learning system
- `athena_processor.py` - NLP processor
- `athena_engine.py` - Reasoning engine

### 3. Cronos (Storage)
**Location**: `core/cronos/`
**Purpose**: Persistent storage and knowledge management
**Key Files**:
- `cronos_database.py` - Database interface
- `cronos_models.py` - Data models
- `cronos_manager.py` - Storage manager
**Database**: `data/memory.db` (SQLite)

### 4. Ermis (Messenger)
**Location**: `core/ermis/`
**Purpose**: Inter-component communication
**Key Files**:
- `ermis_messenger.py` - Core messaging system
- `ermis_olympus.py` - Message routing (Olympus)
- `ermis_security.py` - Security and validation
- `ermis_database_adapter.py` - Database operations routing

### 5. Lightning (Compiler)
**Location**: `core/lightning/`
**Purpose**: JIT compilation and optimization
**Key Files**:
- `lightning_compiler.py` - Main compiler
- `lightning_manager.py` - Compilation manager
- `lightning_cache.py` - Compiled code cache

### 6. Ades (Testing)
**Location**: `core/ades/`
**Purpose**: Testing and validation framework
**Key Files**:
- `black_*.py` - Test suites for each component

## Data Flow

### Pattern Teaching Flow
```
1. User: teach: pattern_name {params} -> {implementation}
2. Zeus: Parses teach command
3. Zeus → Ermis: Send learn_pattern message
4. Ermis → Athena: Route to pattern learner
5. Athena → Ermis: Store pattern request
6. Ermis → Cronos: Save to database
7. Response flows back through Ermis
```

### Pattern Execution Flow
```
1. User: pattern_name(args)
2. Zeus: Parse and identify pattern call
3. Zeus → PatternLearner: Apply pattern
4. PatternLearner: Retrieve from memory/database
5. SafeEval: Execute implementation
6. Result returns to user
```

## Database Schema

### Patterns Table
```sql
CREATE TABLE patterns (
    name TEXT PRIMARY KEY,
    pattern TEXT,            -- Template like "add(a, b)"
    implementation TEXT,     -- Python expression "{a + b}"
    created_at TIMESTAMP,
    usage_count INTEGER,
    success_rate REAL,
    metadata TEXT           -- JSON with description, params
);
```

### Other Tables
- `sessions` - User sessions
- `variables` - Stored variables
- `functions` - User-defined functions
- `context` - Execution context
- `learning` - Learning data

## Communication Protocol

### Message Format
```python
{
    "type": "request_type",
    "from": "sender_god",
    "to": "target_god",
    "data": {
        # Request-specific data
    },
    "request_id": "uuid",
    "timestamp": "iso_timestamp"
}
```

### Request Types
- `learn_pattern` - Teach new pattern
- `execute_code` - Run code
- `store_variable` - Save variable
- `retrieve_pattern` - Get pattern
- `nlp_request` - Natural language processing

## Security Model

### Permission Levels
1. **PUBLIC** - No restrictions (health checks)
2. **RESTRICTED** - Requires validation (storage)
3. **SENSITIVE** - Additional checks (patterns)
4. **CRITICAL** - Full audit (code execution)

### Authorized Operations
- Zeus: `execute_code`, `learn_pattern`, `store`
- Athena: `learn_pattern`, `nlp_request`, `store_pattern`
- Cronos: Database operations
- Lightning: Compilation operations

## File Structure
```
zeus/
├── core/
│   ├── zeus/          # Interpreter
│   ├── athena/        # AI Brain
│   ├── cronos/        # Storage
│   ├── ermis/         # Messaging
│   ├── lightning/     # Compiler
│   └── ades/          # Testing
├── data/
│   └── memory.db      # SQLite database
├── teaching/
│   ├── teach.txt      # Pattern definitions
│   └── teach_patterns_to_db.py
└── zeus.py            # Main entry point
```

## Future Architecture (Compiler)

### Planned Compilation Pipeline
```
.zeus file → Parser → AST → Type Inference → IR → 
    ├→ LLVM → Native Code
    ├→ C → GCC → Shared Library
    └→ WebAssembly → Browser
```

This will enable 0.001ms execution for compiled patterns while maintaining the interpreted mode for learning and development.