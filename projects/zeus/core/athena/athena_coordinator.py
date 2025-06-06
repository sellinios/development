"""Coordinator module that orchestrates different brain components."""

import logging
from typing import Dict, Any, Optional
from .athena_processor import NLPProcessor
from .athena_engine import ReasoningEngine
from .athena_pattern_learner import PatternLearner
# from .athena_knowledge_base import KnowledgeBase  # Deprecated
from .athena_knowledge_unified import UnifiedKnowledgeBase
from .ermis_sender import athena_sender
from .athena_understanding import UnderstandingModule
from .athena_execution import ExecutionModule
from .athena_pattern_detector import PatternDetector


class BrainCoordinator:
    """Coordinates different modules of the Athena brain."""

    def __init__(self, knowledge_base: Optional[UnifiedKnowledgeBase] = None):
        self.logger = logging.getLogger(__name__)

        # Initialize knowledge base
        # Use unified knowledge base that goes through Ermis
        self.knowledge = knowledge_base or UnifiedKnowledgeBase(athena_sender)

        # Initialize modules
        self.nlp_processor = NLPProcessor()
        self.understanding = UnderstandingModule(self.nlp_processor)
        self.reasoning = ReasoningEngine()
        self.execution = ExecutionModule()
        self.pattern_learner = PatternLearner(self.knowledge)
        self.pattern_detector = PatternDetector(self.knowledge)

        self.logger.info("Brain coordinator initialized")

    def process(self, input_text: str, context: Dict[str, Any]) -> Any:
        """
        Main processing pipeline for natural language input.

        Args:
            input_text: User input text
            context: Context information

        Returns:
            Processing result
        """
        self.logger.info(f"Processing input: {input_text}")

        # Step 1: Understand the input
        understanding = self.understanding.understand(input_text, context)
        self.logger.debug(f"Understanding result: {understanding}")

        # Step 2: Check for learned patterns
        pattern_result = self._try_patterns(input_text, understanding)
        if pattern_result is not None:
            self.logger.info("Applied learned pattern")
            return pattern_result

        # Step 3: Reason about the request
        plan = self.reasoning.generate_plan(understanding, context)
        self.logger.debug(f"Generated plan: {plan}")

        # Step 4: Execute the plan
        result = self.execution.execute_plan(plan, context)
        self.logger.info(f"Execution result: {result} (type: {type(result)})")

        # Step 5: Learn from the interaction
        self._learn_from_interaction(input_text, understanding, result)

        return result

    def _try_patterns(self, input_text: str, understanding: Dict[str, Any]) -> Optional[Any]:
        """Try to apply learned patterns."""
        # Check if any pattern matches
        suggestions = self.pattern_learner.get_pattern_suggestions(input_text)

        if suggestions:
            # Try the best matching pattern
            best_pattern = suggestions[0]
            try:
                # Extract arguments based on pattern
                args = self._extract_pattern_args(input_text, best_pattern)
                if args:
                    return self.pattern_learner.apply_pattern(best_pattern.name, args)
            except Exception as e:
                self.logger.debug(f"Pattern application failed: {e}")

        return None

    def _extract_pattern_args(self, input_text: str, pattern) -> Optional[Dict[str, Any]]:
        """Extract arguments for a pattern from input text."""
        # This is a simplified implementation
        # In a real system, you'd use more sophisticated matching
        template_parts = pattern.template.split()
        input_parts = input_text.split()

        if len(template_parts) != len(input_parts):
            return None

        args = {}
        for template_part, input_part in zip(template_parts, input_parts):
            if template_part.startswith("{") and template_part.endswith("}"):
                param_name = template_part[1:-1]
                args[param_name] = input_part

        return args if args else None

    def _learn_from_interaction(self, input_text: str, understanding: Dict[str, Any], result: Any):
        """Learn from the interaction for future use."""
        # Store the interaction context
        self.knowledge.store_context("last_input", input_text)
        self.knowledge.store_context("last_understanding", understanding)
        self.knowledge.store_context("last_result", result)

        # Analyze patterns structurally (no semantic assumptions)
        if 'parsed_ast' in understanding:
            self.pattern_detector.analyze_interaction(
                input_text, 
                understanding['parsed_ast'],
                result
            )
            
            # Check if we should suggest patterns
            suggestions = self.pattern_detector.get_suggestions(
                input_text,
                understanding.get('parsed_ast', {})
            )
            
            if suggestions:
                self.logger.debug(f"Pattern suggestions: {suggestions}")

    def teach_pattern(self, pattern_def: str) -> str:
        """Teach a new pattern to the system."""
        try:
            self.pattern_learner.teach_pattern(pattern_def)
            return "Pattern learned successfully!"
        except Exception as e:
            return f"Failed to learn pattern: {e}"

    def get_capabilities(self) -> Dict[str, Any]:
        """Get current brain capabilities."""
        return {
            "patterns_learned": len(self.pattern_learner.patterns),
            "patterns_detected": self.pattern_detector.get_pattern_summary(),
            "understanding_intents": [
                "calculation",
                "explanation",
                "creation",
                "search",
                "comparison",
                "general",
            ],
            "execution_actions": ["calculate", "explain", "search", "create"],
            "nlp_features": (
                self.nlp_processor.get_capabilities()
                if hasattr(self.nlp_processor, "get_capabilities")
                else {}
            ),
            "reasoning_methods": (
                self.reasoning.get_methods() if hasattr(self.reasoning, "get_methods") else []
            ),
        }
        
    def get_usage_patterns(self) -> Dict[str, Any]:
        """Get learned usage patterns without semantic assumptions"""
        return self.pattern_detector.get_pattern_summary()
