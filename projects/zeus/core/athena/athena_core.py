"""
Athena Brain - Refactored modular architecture.

This module provides the main AthenaBrain class that serves as the entry point
for all AI operations in Zeus. It uses a coordinator pattern to delegate work
to specialized modules.
"""

import logging
from typing import Any, Dict, Optional
from .athena_coordinator import BrainCoordinator
from .athena_knowledge_unified import UnifiedKnowledgeBase
from .ermis_sender import athena_sender


class AthenaBrain:
    """
    Central AI brain that coordinates all intelligent operations in Zeus.

    This class provides a high-level interface to the AI capabilities while
    delegating actual work to specialized modules through the BrainCoordinator.
    """

    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the Athena Brain.

        Args:
            model_path: Optional path to pre-trained models
        """
        self.logger = logging.getLogger(__name__)
        self.model_path = model_path or "data/models"

        # Initialize knowledge base with Ermis
        # Note: UnifiedKnowledgeBase uses Ermis for all DB operations
        self.knowledge = UnifiedKnowledgeBase(athena_sender)

        # Initialize brain coordinator with all modules
        self.coordinator = BrainCoordinator(self.knowledge)

        # Keep references for backward compatibility
        self.pattern_learner = self.coordinator.pattern_learner
        self.reasoning = self.coordinator.reasoning

        self.logger.info("AthenaBrain initialized with modular architecture")

    def process(self, input_text: str, context: Dict[str, Any]) -> Any:
        """
        Main processing method that handles natural language input.

        Args:
            input_text: User input text
            context: Context information including variables, history, etc.

        Returns:
            Processing result
        """
        return self.coordinator.process(input_text, context)

    def understand(
        self, input_text: str, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process natural language input and return structured understanding.

        Args:
            input_text: Text to understand
            context: Optional context information

        Returns:
            Dictionary containing understanding results
        """
        return self.coordinator.understanding.understand(input_text, context or {})

    def reason(
        self, understanding: Dict[str, Any], context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Apply reasoning to generate an execution plan.

        Args:
            understanding: Understanding results from the understanding module
            context: Optional context information

        Returns:
            Execution plan
        """
        return self.coordinator.reasoning.generate_plan(understanding, context or {})

    def execute(self, input_text: str, context: Optional[Dict[str, Any]] = None) -> Any:
        """
        Execute a natural language command.

        This is an alias for the process method for backward compatibility.

        Args:
            input_text: Command to execute
            context: Optional context information

        Returns:
            Execution result
        """
        return self.process(input_text, context or {})

    def learn(self, input_text: str, output: Any, feedback: Optional[str] = None):
        """
        Learn from user interactions and feedback.

        Note: Learning is now handled automatically by the coordinator.
        This method is kept for backward compatibility.

        Args:
            input_text: Original input
            output: Generated output
            feedback: Optional user feedback
        """
        if feedback:
            self.logger.info(f"Received feedback: {feedback}")
            # In the future, this could trigger retraining or adjustment

    def teach_pattern(self, pattern_definition: str) -> str:
        """
        Teach a new pattern to the system.

        Args:
            pattern_definition: Pattern definition in the format "pattern_name {params} -> implementation"

        Returns:
            Success or error message
        """
        return self.coordinator.teach_pattern(pattern_definition)

    def get_capabilities(self) -> Dict[str, Any]:
        """
        Get current brain capabilities and statistics.

        Returns:
            Dictionary of capabilities and statistics
        """
        return self.coordinator.get_capabilities()

    def save_model(self, path: str):
        """
        Save trained models to disk.

        Args:
            path: Path to save models
        """
        # In a real implementation, this would save neural network weights
        self.logger.info(f"Model saving not yet implemented. Would save to: {path}")

    def load_model(self, path: str):
        """
        Load pre-trained models from disk.

        Args:
            path: Path to load models from
        """
        # In a real implementation, this would load neural network weights
        self.logger.info(f"Model loading not yet implemented. Would load from: {path}")

    def get_stats(self) -> Dict[str, Any]:
        """
        Get usage statistics.

        Returns:
            Dictionary of statistics
        """
        return {
            "patterns_count": len(self.pattern_learner.patterns),
            "knowledge_entries": (
                self.knowledge.get_stats() if hasattr(self.knowledge, "get_stats") else {}
            ),
            "capabilities": self.get_capabilities(),
        }
