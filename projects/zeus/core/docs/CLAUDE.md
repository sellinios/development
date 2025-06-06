# Claude Development Guide for Zeus

## Project Overview

Zeus is a cognitive programming language that combines traditional programming with natural language understanding and pattern learning. It's designed to be teachable and can learn new patterns dynamically.

## Key Commands

### Running Zeus
```bash
# Run Zeus CLI (currently has timeout issues)
python zeus.py

# Teach patterns directly to database
cd teaching
python teach_patterns_to_db.py
```

### Testing
```bash
# Run individual component tests
python core/ades/black_zeus.py
python core/ades/black_athena.py

# Check patterns in database
python -c "import sqlite3; conn = sqlite3.connect('data/memory.db'); print(conn.execute('SELECT COUNT(*) FROM patterns').fetchone()[0], 'patterns loaded')"
```

## Important Context

### Current State
- ✅ 161 patterns successfully loaded in database
- ✅ Pattern learning and execution working
- ⚠️ Zeus CLI has session initialization timeout (Ermis issue)
- ⚠️ Some patterns fail due to safe_eval restrictions

### Recent Fixes
1. Fixed imports: `BrainCoordinator` and `UnifiedKnowledgeBase`
2. Added `learn_pattern` permission to Ermis security
3. Created direct database pattern teaching solution
4. Fixed Zeus ermis_sender timeout issue

## Key Files to Know

### Pattern System
- `teaching/teach.txt` - Pattern definitions (154 patterns)
- `teaching/teach_patterns_to_db.py` - Direct DB loader
- `core/athena/athena_pattern_learner.py` - Pattern learning logic

### Core Components
- `core/zeus/zeus_interpreter.py` - Main interpreter
- `core/ermis/ermis_messenger.py` - Message routing
- `core/cronos/cronos_database.py` - Storage layer
- `data/memory.db` - SQLite database with patterns

## Common Tasks

### Adding New Patterns
1. Add to `teaching/teach.txt`:
   ```
   teach: pattern_name {param1, param2} -> {implementation} : description
   ```
2. Run: `python teaching/teach_patterns_to_db.py`

### Debugging Pattern Issues
```python
# Check if pattern exists
import sqlite3
conn = sqlite3.connect('data/memory.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM patterns WHERE name = ?", ('pattern_name',))
print(cursor.fetchone())
```

### Testing Patterns
```python
from core.athena.athena_pattern_learner import PatternLearner
from core.athena.athena_knowledge_unified import UnifiedKnowledgeBase
from core.athena.ermis_sender import athena_sender

kb = UnifiedKnowledgeBase(athena_sender)
learner = PatternLearner(kb)
result = learner.apply_pattern("add", {"a": 5, "b": 3})
print(result)  # Should print 8
```

## Known Issues & Workarounds

### 1. Zeus CLI Timeout
**Issue**: `self.runtime.ermis.start_session()` times out
**Workaround**: Use direct pattern teaching script instead of Zeus CLI

### 2. Safe Eval Restrictions
**Issue**: Some patterns fail (recursion, string methods)
**Examples**:
- `factorial` - uses recursion (not allowed)
- `upper/lower` - attribute access blocked
**Workaround**: Rewrite patterns without restricted features

### 3. Pattern Loading
**Issue**: Patterns only in memory during script execution
**Solution**: All patterns now stored in database and auto-load

## Development Guidelines

### When Adding Features
1. Check existing patterns first - many operations already implemented
2. Test with direct database access before trying through Zeus CLI
3. Add security permissions if creating new message types

### When Debugging
1. Check Ermis message flow - most issues are routing problems
2. Verify database has expected data
3. Use component test files (black_*.py) to isolate issues

### Code Style
- Follow existing patterns in codebase
- Add docstrings for new functions
- Update ARCHITECTURE.md for significant changes

## Future Work Priorities

1. **Fix Ermis session management** - Blocking Zeus CLI
2. **Improve safe_eval** - Allow more Python features
3. **Build compiler** - For 0.001ms execution
4. **Natural language integration** - Connect patterns to NLP

## Useful Debugging Commands

```bash
# Check Ermis queues
ps aux | grep orchestrator

# Monitor database changes
watch -n 1 'sqlite3 data/memory.db "SELECT COUNT(*) FROM patterns"'

# Test pattern execution
python -c "from core.athena.athena_pattern_learner import PatternLearner; print('PatternLearner loaded successfully')"
```

## Contact & Resources

- Pattern definitions: `teaching/teach.txt`
- Architecture docs: `ARCHITECTURE.md`
- Roadmap: `ROADMAP.md`
- Vision: `VISION.md`