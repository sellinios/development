"""Context management for enhanced understanding and memory."""

import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from collections import deque
import json
import numpy as np
from dataclasses import dataclass, field
# from .athena_knowledge_base import KnowledgeBase  # Deprecated
from .athena_knowledge_unified import UnifiedKnowledgeBase
from .ermis_sender import athena_sender


@dataclass
class ConversationTurn:
    """Represents a single turn in the conversation."""
    timestamp: datetime
    input_text: str
    intent: str
    entities: Dict[str, Any]
    result: Any
    context_snapshot: Dict[str, Any]
    success: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage."""
        return {
            "timestamp": self.timestamp.isoformat(),
            "input_text": self.input_text,
            "intent": self.intent,
            "entities": self.entities,
            "result": str(self.result),
            "context_snapshot": self.context_snapshot,
            "success": self.success
        }


@dataclass
class UserProfile:
    """Represents a user's interaction profile."""
    user_id: str
    first_seen: datetime
    last_seen: datetime
    interaction_count: int = 0
    preferred_patterns: List[str] = field(default_factory=list)
    common_topics: Dict[str, int] = field(default_factory=dict)
    skill_level: str = "beginner"  # beginner, intermediate, advanced
    
    def update_from_interaction(self, intent: str, entities: Dict[str, Any]):
        """Update profile based on interaction."""
        self.last_seen = datetime.now()
        self.interaction_count += 1
        
        # Track common topics
        for entity_type, values in entities.items():
            for value in values:
                topic_key = f"{entity_type}:{value}"
                self.common_topics[topic_key] = self.common_topics.get(topic_key, 0) + 1
        
        # Adjust skill level based on complexity
        if self.interaction_count > 50 and len(self.preferred_patterns) > 10:
            self.skill_level = "advanced"
        elif self.interaction_count > 20 and len(self.preferred_patterns) > 5:
            self.skill_level = "intermediate"


class ContextManager:
    """Manages conversation context and memory across sessions."""
    
    def __init__(self, knowledge_base: Optional[UnifiedKnowledgeBase] = None):
        self.logger = logging.getLogger(__name__)
        # Use unified knowledge base that goes through Ermis
        self.knowledge = knowledge_base or UnifiedKnowledgeBase(athena_sender)
        
        # Conversation history (limited to last 50 turns)
        self.conversation_history: deque[ConversationTurn] = deque(maxlen=50)
        
        # Active context
        self.current_context = {
            "variables": {},
            "functions": {},
            "patterns": {},
            "topics": set(),
            "current_task": None,
            "user_profile": None
        }
        
        # Short-term memory (last 10 items)
        self.short_term_memory: deque[Dict[str, Any]] = deque(maxlen=10)
        
        # Load persistent data
        self._load_from_knowledge_base()
    
    def _load_from_knowledge_base(self):
        """Load persisted context from knowledge base."""
        try:
            # Load conversation history
            history_data = self.knowledge.get_context("conversation_history")
            if history_data:
                history_list = json.loads(history_data)
                for turn_data in history_list[-50:]:  # Keep last 50
                    turn = ConversationTurn(
                        timestamp=datetime.fromisoformat(turn_data["timestamp"]),
                        input_text=turn_data["input_text"],
                        intent=turn_data["intent"],
                        entities=turn_data["entities"],
                        result=turn_data["result"],
                        context_snapshot=turn_data.get("context_snapshot", {}),
                        success=turn_data.get("success", True)
                    )
                    self.conversation_history.append(turn)
            
            # Load user profiles
            profiles_data = self.knowledge.get_context("user_profiles")
            if profiles_data:
                self.user_profiles = json.loads(profiles_data)
            else:
                self.user_profiles = {}
                
        except Exception as e:
            self.logger.warning(f"Failed to load context from knowledge base: {e}")
    
    def get_relevant_context(self, input_text: str, intent: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        """Get context relevant to the current input."""
        context = {
            "current": self.current_context.copy(),
            "history": [],
            "related_patterns": [],
            "suggested_next_actions": [],
            "user_skill_level": "beginner"
        }
        
        # Get recent relevant history
        relevant_history = self._find_relevant_history(input_text, intent, entities)
        context["history"] = [
            {
                "input": turn.input_text,
                "result": turn.result,
                "timestamp": turn.timestamp.isoformat()
            }
            for turn in relevant_history
        ]
        
        # Find related patterns from history
        context["related_patterns"] = self._find_related_patterns(intent, entities)
        
        # Suggest next actions based on history
        context["suggested_next_actions"] = self._suggest_next_actions(intent, entities)
        
        # Add user profile info
        if self.current_context.get("user_profile"):
            profile = self.current_context["user_profile"]
            context["user_skill_level"] = profile.skill_level
            context["common_topics"] = sorted(
                profile.common_topics.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]
        
        return context
    
    def _find_relevant_history(self, input_text: str, intent: str, entities: Dict[str, Any], max_results: int = 5) -> List[ConversationTurn]:
        """Find relevant conversation history."""
        relevant = []
        
        # Score each historical turn by relevance
        scored_turns = []
        for turn in self.conversation_history:
            score = 0.0
            
            # Intent match
            if turn.intent == intent:
                score += 0.5
            
            # Entity overlap
            for entity_type, values in entities.items():
                if entity_type in turn.entities:
                    overlap = set(values) & set(turn.entities[entity_type])
                    if overlap:
                        score += 0.3 * len(overlap) / len(values)
            
            # Text similarity (simple word overlap)
            input_words = set(input_text.lower().split())
            turn_words = set(turn.input_text.lower().split())
            if input_words and turn_words:
                overlap = input_words & turn_words
                score += 0.2 * len(overlap) / len(input_words)
            
            if score > 0:
                scored_turns.append((score, turn))
        
        # Sort by score and return top results
        scored_turns.sort(key=lambda x: x[0], reverse=True)
        return [turn for _, turn in scored_turns[:max_results]]
    
    def _find_related_patterns(self, intent: str, entities: Dict[str, Any]) -> List[str]:
        """Find patterns that might be relevant."""
        patterns = []
        
        # Look for patterns used in similar contexts
        for turn in self.conversation_history:
            if turn.intent == intent and turn.success:
                # Check if this turn used a pattern
                if "pattern" in turn.context_snapshot:
                    pattern_name = turn.context_snapshot["pattern"]
                    if pattern_name not in patterns:
                        patterns.append(pattern_name)
        
        return patterns[:5]  # Limit to 5 suggestions
    
    def _suggest_next_actions(self, intent: str, entities: Dict[str, Any]) -> List[str]:
        """Suggest possible next actions based on history."""
        suggestions = []
        
        # Find what users typically do after this type of action
        next_actions = {}
        history_list = list(self.conversation_history)
        
        for i in range(len(history_list) - 1):
            if history_list[i].intent == intent:
                next_turn = history_list[i + 1]
                action_key = f"{next_turn.intent}: {next_turn.input_text[:30]}..."
                next_actions[action_key] = next_actions.get(action_key, 0) + 1
        
        # Sort by frequency
        sorted_actions = sorted(next_actions.items(), key=lambda x: x[1], reverse=True)
        suggestions = [action for action, _ in sorted_actions[:3]]
        
        return suggestions
    
    def add_turn(self, input_text: str, intent: str, entities: Dict[str, Any], 
                 result: Any, success: bool = True):
        """Add a conversation turn to history."""
        turn = ConversationTurn(
            timestamp=datetime.now(),
            input_text=input_text,
            intent=intent,
            entities=entities,
            result=result,
            context_snapshot=self.current_context.copy(),
            success=success
        )
        
        self.conversation_history.append(turn)
        
        # Update short-term memory
        self.short_term_memory.append({
            "input": input_text,
            "result": result,
            "timestamp": turn.timestamp
        })
        
        # Update user profile
        if self.current_context.get("user_profile"):
            self.current_context["user_profile"].update_from_interaction(intent, entities)
        
        # Persist to knowledge base periodically
        if len(self.conversation_history) % 10 == 0:
            self._save_to_knowledge_base()
    
    def _save_to_knowledge_base(self):
        """Save context to knowledge base."""
        try:
            # Save conversation history
            history_data = [turn.to_dict() for turn in self.conversation_history]
            self.knowledge.store_context("conversation_history", json.dumps(history_data))
            
            # Save user profiles
            if hasattr(self, 'user_profiles'):
                self.knowledge.store_context("user_profiles", json.dumps(self.user_profiles))
                
        except Exception as e:
            self.logger.error(f"Failed to save context: {e}")
    
    def update_variable(self, name: str, value: Any):
        """Update a variable in context."""
        self.current_context["variables"][name] = value
        
    def update_function(self, name: str, definition: Dict[str, Any]):
        """Update a function in context."""
        self.current_context["functions"][name] = definition
        
    def update_pattern(self, name: str, pattern: Dict[str, Any]):
        """Update a pattern in context."""
        self.current_context["patterns"][name] = pattern
        
    def add_topic(self, topic: str):
        """Add a topic to current context."""
        self.current_context["topics"].add(topic)
    
    def set_current_task(self, task: str):
        """Set the current task being worked on."""
        self.current_context["current_task"] = task
    
    def get_summary(self) -> Dict[str, Any]:
        """Get a summary of the current context."""
        return {
            "conversation_length": len(self.conversation_history),
            "variables_defined": len(self.current_context["variables"]),
            "functions_defined": len(self.current_context["functions"]),
            "patterns_learned": len(self.current_context["patterns"]),
            "topics_discussed": list(self.current_context["topics"])[:10],
            "current_task": self.current_context["current_task"],
            "recent_interactions": [
                {
                    "input": turn.input_text,
                    "intent": turn.intent,
                    "time_ago": (datetime.now() - turn.timestamp).total_seconds()
                }
                for turn in list(self.conversation_history)[-5:]
            ]
        }
    
    def clear_short_term_memory(self):
        """Clear short-term memory."""
        self.short_term_memory.clear()
    
    def reset_context(self):
        """Reset the current context while preserving history."""
        self.current_context = {
            "variables": {},
            "functions": {},
            "patterns": {},
            "topics": set(),
            "current_task": None,
            "user_profile": self.current_context.get("user_profile")  # Preserve user profile
        }