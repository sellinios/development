"""Natural language understanding component."""

import logging
from typing import Dict, Any, Optional
import numpy as np
from .athena_processor import NLPProcessor


class UnderstandingModule:
    """Handles natural language understanding tasks."""

    def __init__(self, nlp_processor: Optional[NLPProcessor] = None):
        self.nlp = nlp_processor or NLPProcessor()
        self.logger = logging.getLogger(__name__)

    def understand(self, text: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Understand the user's input and extract structured information.

        Args:
            text: Input text to understand
            context: Context information

        Returns:
            Dictionary containing understanding results
        """
        # Handle empty or None text
        if not text or not text.strip():
            return {
                "intent": "general",
                "entities": {},
                "sentiment": {"positive": 0.5, "negative": 0.5, "neutral": 1.0},
                "query_type": "statement",
                "nlp_result": {"original_text": "", "intent": "general", "entities": {}, "features": [], "code_pattern": "expression", "confidence": 0.0},
                "confidence": 0.0,
            }
        
        # Process with NLP
        nlp_result = self.nlp.process(text)
        
        # Ensure nlp_result is a dict (handle error cases)
        if not isinstance(nlp_result, dict):
            nlp_result = {
                "original_text": text,
                "intent": "general",
                "entities": {},
                "features": [],
                "code_pattern": "expression",
                "confidence": 0.0
            }

        # Extract intent and entities
        intent = self._extract_intent(nlp_result)
        entities = self._extract_entities(nlp_result)

        # Analyze sentiment
        sentiment = self._analyze_sentiment(nlp_result)

        # Determine query type
        query_type = self._determine_query_type(text, nlp_result)

        return {
            "intent": intent,
            "entities": entities,
            "sentiment": sentiment,
            "query_type": query_type,
            "nlp_result": nlp_result,
            "confidence": self._calculate_confidence(nlp_result),
        }

    def _extract_intent(self, nlp_result: Dict[str, Any]) -> str:
        """Extract the primary intent from NLP results."""
        # Check for specific keywords
        # Use 'original_text' first, fallback to 'text'
        text_lower = nlp_result.get("original_text", nlp_result.get("text", "")).lower()

        if any(word in text_lower for word in ["calculate", "compute", "solve"]):
            return "calculation"
        elif any(word in text_lower for word in ["explain", "what is", "describe"]):
            return "explanation"
        elif any(word in text_lower for word in ["analyze", "analyse", "pattern", "sequence", "predict"]):
            return "analysis"
        elif any(word in text_lower for word in ["create", "make", "generate"]):
            return "creation"
        elif any(word in text_lower for word in ["find", "search", "locate"]):
            return "search"
        elif any(word in text_lower for word in ["compare", "difference"]):
            return "comparison"
        else:
            return "general"

    def _extract_entities(self, nlp_result: Dict[str, Any]) -> Dict[str, Any]:
        """Extract entities from NLP results."""
        entities = {}

        # Handle case where entities might be a dict or list
        nlp_entities = nlp_result.get("entities", {})
        if isinstance(nlp_entities, dict):
            # Already in dict format from NLPProcessor
            return nlp_entities
        
        # Extract from NLP entities if it's a list
        for entity in nlp_entities if isinstance(nlp_entities, list) else []:
            entity_type = entity.get("label", "UNKNOWN")
            entity_text = entity.get("text", "")

            if entity_type not in entities:
                entities[entity_type] = []
            entities[entity_type].append(entity_text)

        return entities

    def _analyze_sentiment(self, nlp_result: Dict[str, Any]) -> Dict[str, float]:
        """Analyze sentiment from NLP results."""
        # Simple sentiment based on tokens
        positive_words = {"good", "great", "excellent", "wonderful", "amazing"}
        negative_words = {"bad", "terrible", "awful", "horrible", "poor"}

        # Get text and tokenize if no tokens provided
        tokens = nlp_result.get("tokens", [])
        if not tokens:
            text = nlp_result.get("original_text", nlp_result.get("text", ""))
            tokens = text.split() if text else []
        tokens = [t.lower() for t in tokens]

        positive_count = sum(1 for token in tokens if token in positive_words)
        negative_count = sum(1 for token in tokens if token in negative_words)

        total = positive_count + negative_count
        if total == 0:
            return {"positive": 0.5, "negative": 0.5, "neutral": 1.0}

        return {
            "positive": positive_count / total,
            "negative": negative_count / total,
            "neutral": 1.0 - (positive_count + negative_count) / len(tokens),
        }

    def _determine_query_type(self, text: str, nlp_result: Dict[str, Any]) -> str:
        """Determine the type of query."""
        # Check POS tags for patterns
        pos_tags = nlp_result.get("pos_tags", [])
        
        # If no POS tags, use simple heuristics
        if not pos_tags:
            text_lower = text.lower().strip()
            question_words = ["what", "when", "where", "who", "why", "how"]
            if text.strip().endswith("?") or any(text_lower.startswith(w) for w in question_words):
                return "question"
            elif any(text_lower.startswith(v) for v in ["show", "display", "get", "find", "calculate", "compute"]):
                return "command"
            else:
                return "statement"

        # Question patterns
        if text.strip().endswith("?") or any(
            tag[0].lower() in ["what", "when", "where", "who", "why", "how"] for tag in pos_tags
        ):
            return "question"

        # Command patterns (imperatives)
        if pos_tags and pos_tags[0][1] == "VB":  # Verb at start
            return "command"

        # Statement
        return "statement"

    def _calculate_confidence(self, nlp_result: Dict[str, Any]) -> float:
        """Calculate confidence score for understanding."""
        # Get confidence from nlp_result if available
        if "confidence" in nlp_result:
            return nlp_result["confidence"]
        
        # Simple confidence based on entity recognition
        entities = nlp_result.get("entities", {})
        if isinstance(entities, dict):
            # Count total entities across all types
            entity_count = sum(len(v) if isinstance(v, list) else 1 for v in entities.values())
        else:
            entity_count = len(entities) if isinstance(entities, list) else 0
        
        if entity_count == 0:
            return 0.5

        # Higher confidence with more recognized entities
        return min(0.5 + entity_count * 0.1, 1.0)
