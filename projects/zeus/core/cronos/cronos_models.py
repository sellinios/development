"""
Cronos Data Models - Core structures for permanent storage
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional
from datetime import datetime

@dataclass
class Variable:
    """Persistent variable storage"""
    name: str
    value: Any
    type: str
    scope: str = "global"
    created_at: datetime = None
    updated_at: datetime = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

@dataclass
class Concept:
    """Semantic concept storage"""
    id: str
    name: str
    description: str
    attributes: Dict[str, Any]
    relationships: List[str] = None
    created_at: datetime = None
    confidence: float = 1.0
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.relationships is None:
            self.relationships = []

@dataclass
class Relation:
    """Relationships between concepts"""
    source_id: str
    target_id: str
    relation_type: str
    strength: float = 1.0
    bidirectional: bool = False
    metadata: Dict[str, Any] = None
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

@dataclass
class CompiledCode:
    """Reference to compiled code in Lightning"""
    id: str
    source_code: str
    lightning_ref: str  # Reference to compiled code in Lightning
    optimization_level: int
    created_at: datetime = None
    execution_count: int = 0
    average_runtime: float = 0.0
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()

@dataclass
class Function:
    """User-defined function storage"""
    name: str
    parameters: List[str]
    body: str
    return_type: Optional[str] = None
    created_at: datetime = None
    updated_at: datetime = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

@dataclass
class Pattern:
    """Pattern storage for pattern learning"""
    name: str
    pattern: str
    implementation: Optional[str] = None
    created_at: datetime = None
    usage_count: int = 0
    success_rate: float = 1.0
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

@dataclass
class Session:
    """Session management"""
    session_id: str = None
    user_id: str = None
    start_time: datetime = None
    end_time: Optional[datetime] = None
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.start_time is None:
            self.start_time = datetime.now()
        if self.metadata is None:
            self.metadata = {}
        if self.session_id is None:
            import uuid
            self.session_id = str(uuid.uuid4())

@dataclass
class ScheduledJob:
    """Scheduled job for time-based operations"""
    job_id: str
    task: Dict[str, Any]
    run_time: datetime
    recurring: bool = False
    interval_seconds: Optional[int] = None
    status: str = "pending"  # pending, running, completed, failed
    created_at: datetime = None
    last_run: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()