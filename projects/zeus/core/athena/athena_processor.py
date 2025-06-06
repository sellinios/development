import re
from typing import Dict, List, Tuple, Any

try:
    import nltk
    import numpy as np
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False
    
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    
try:
    import tensorflow as tf
    from transformers import AutoTokenizer, TFAutoModel
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False


class NLPProcessor:
    """
    Natural Language Processing component using TensorFlow and transformers.
    Handles parsing, intent recognition, and entity extraction.
    """

    def __init__(self, model_name: str = "bert-base-uncased"):
        self.model_name = model_name
        self.spacy_nlp = None
        self.tokenizer = None
        self.model = None
        
        # Download required NLTK data if available
        if NLTK_AVAILABLE:
            try:
                nltk.download("punkt", quiet=True)
                nltk.download("averaged_perceptron_tagger", quiet=True)
                nltk.download("wordnet", quiet=True)
            except:
                pass

        # Load spaCy model if available
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except:
                # Fallback if spaCy model not installed
                self.nlp = None
        else:
            self.nlp = None

        # Load transformer model if available
        if TF_AVAILABLE:
            try:
                import os
                import sys
                from contextlib import redirect_stdout, redirect_stderr

                with open(os.devnull, "w") as devnull:
                    with redirect_stdout(devnull), redirect_stderr(devnull):
                        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
                        self.transformer = TFAutoModel.from_pretrained(model_name)
            except Exception as e:
                # If transformer fails to load, set to None for fallback
                self.tokenizer = None
                self.transformer = None

        # Intent classifier
        self.intent_model = self._build_intent_classifier()

        # Predefined patterns for common programming intents
        self.patterns = {
            "calculate": r"(calculate|compute|find|what is|evaluate)",
            "define": r"(define|create|make|set|let)",
            "teach": r"(teach|learn|remember|pattern)",
            "query": r"(show|display|print|get|retrieve)",
            "conditional": r"(if|when|unless|while)",
            "loop": r"(for|foreach|repeat|iterate)",
            "function": r"(function|method|procedure|def)",
        }

    def process(self, text: str) -> Dict[str, Any]:
        """
        Main entry point for processing natural language text.
        Alias for parse() to maintain backward compatibility.
        """
        return self.parse(text)

    def _build_intent_classifier(self):
        """Build intent classification model."""
        if not TF_AVAILABLE:
            return None
            
        model = tf.keras.Sequential(
            [
                tf.keras.layers.Dense(256, activation="relu"),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(128, activation="relu"),
                tf.keras.layers.Dropout(0.2),
                tf.keras.layers.Dense(32, activation="softmax"),  # 32 intent classes
            ]
        )

        model.compile(
            optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"]
        )

        return model

    def parse(self, text: str) -> Dict[str, Any]:
        """
        Parse natural language text into structured representation.
        """
        # Store original text before preprocessing
        original_text = text.strip()

        # Basic preprocessing - convert to lowercase for analysis
        text = original_text.lower()

        # Extract intent
        intent = self._extract_intent(text)

        # Extract entities
        entities = self._extract_entities(text)

        # Extract semantic features
        features = self._extract_features(text)

        # Identify code patterns
        code_pattern = self._identify_code_pattern(text)

        return {
            "original_text": original_text,  # Keep original case
            "intent": intent,
            "entities": entities,
            "features": features.tolist() if hasattr(features, 'tolist') else features,
            "code_pattern": code_pattern,
            "confidence": self._calculate_parse_confidence(intent, entities),
        }

    def _extract_intent(self, text: str) -> str:
        """Extract the primary intent from text."""
        # Check against known patterns first for quick matching
        for intent, pattern in self.patterns.items():
            if re.search(pattern, text, re.IGNORECASE):
                return intent

        # Use transformer embeddings for complex intent detection
        embeddings = self._get_embeddings(text)

        # Map common programming intents based on keywords and structure
        text_lower = text.lower()

        # Enhanced intent detection based on common patterns
        if any(
            word in text_lower
            for word in ["calculate", "compute", "what is", "evaluate", "+", "-", "*", "/"]
        ):
            return "calculate"
        elif any(word in text_lower for word in ["define", "create", "make", "set", "=", "assign"]):
            return "define"
        elif any(word in text_lower for word in ["teach", "learn", "pattern", "remember"]):
            return "teach"
        elif any(word in text_lower for word in ["show", "display", "print", "list", "get"]):
            return "query"
        elif any(word in text_lower for word in ["if", "when", "unless"]):
            return "conditional"
        elif any(word in text_lower for word in ["for", "foreach", "repeat", "iterate", "loop"]):
            return "loop"
        elif any(word in text_lower for word in ["function", "def", "method", "procedure"]):
            return "function"
        elif any(word in text_lower for word in ["search", "find", "locate", "lookup"]):
            return "search"
        elif any(word in text_lower for word in ["explain", "why", "how", "describe"]):
            return "explain"
        elif any(word in text_lower for word in ["help", "assist", "guide"]):
            return "help"

        # Default to general if no specific intent is detected
        return "general"

    def _extract_entities(self, text: str) -> Dict[str, List[Any]]:
        """Extract entities (variables, numbers, operations) from text."""
        entities = {
            "variables": [],
            "numbers": [],
            "operations": [],
            "strings": [],
            "functions": [],
        }

        # Extract numbers
        numbers = re.findall(r"\b\d+\.?\d*\b", text)
        entities["numbers"] = [float(n) if "." in n else int(n) for n in numbers]

        # Extract quoted strings
        strings = re.findall(r'"([^"]*)"', text) + re.findall(r"'([^']*)'", text)
        entities["strings"] = strings

        # Extract variable names (basic pattern)
        var_pattern = r"\b([a-zA-Z_]\w*)\s*="
        entities["variables"] = re.findall(var_pattern, text)

        # Extract operations
        ops = ["add", "subtract", "multiply", "divide", "average", "sum", "mean"]
        for op in ops:
            if op in text:
                entities["operations"].append(op)

        # Use spaCy for more advanced entity recognition if available
        if self.nlp:
            doc = self.nlp(text)
            for ent in doc.ents:
                if ent.label_ not in entities:
                    entities[ent.label_] = []
                entities[ent.label_].append(ent.text)

        return entities

    def _extract_features(self, text: str):
        """Extract semantic features using transformer."""
        if not TF_AVAILABLE or self.tokenizer is None or self.transformer is None:
            # Return placeholder features if transformer not available
            return [0.1] * 768  # BERT-base hidden size
            
        try:
            inputs = self.tokenizer(
                text, return_tensors="tf", padding=True, truncation=True, max_length=512
            )
            outputs = self.transformer(**inputs)

            # Use pooled output or mean of last hidden states
            features = tf.reduce_mean(outputs.last_hidden_state, axis=1)
            return features.numpy()[0]
        except Exception as e:
            # Return placeholder features if transformer fails
            return np.zeros(768)  # BERT-base hidden size

    def _identify_code_pattern(self, text: str) -> str:
        """Identify the type of code pattern requested."""
        if "average" in text or "mean" in text:
            return "aggregation"
        elif "if" in text or "when" in text:
            return "conditional"
        elif "for each" in text or "for all" in text:
            return "iteration"
        elif "=" in text and not "==" in text:
            return "assignment"
        elif "teach" in text or "pattern" in text:
            return "pattern_definition"
        else:
            return "expression"

    def _get_embeddings(self, text: str):
        """Get text embeddings using transformer."""
        if not TF_AVAILABLE or self.tokenizer is None or self.transformer is None:
            # Return placeholder embeddings if transformer not available
            return [0.0] * 768  # BERT-base hidden size
            
        try:
            inputs = self.tokenizer(
                text, return_tensors="tf", padding=True, truncation=True, max_length=512
            )
            outputs = self.transformer(**inputs)
            if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                return outputs.pooler_output.numpy()[0]
            else:
                # Fallback to mean of last hidden states
                return tf.reduce_mean(outputs.last_hidden_state, axis=1).numpy()[0]
        except Exception as e:
            # Return placeholder embeddings if transformer fails
            return np.zeros(768)  # BERT-base hidden size

    def _calculate_parse_confidence(self, intent: str, entities: Dict) -> float:
        """Calculate confidence score for parsing result."""
        confidence = 0.5

        # Boost confidence if intent is recognized
        if intent != "general":
            confidence += 0.2

        # Boost confidence based on entities found
        total_entities = sum(len(v) for v in entities.values())
        if total_entities > 0:
            confidence += min(0.3, total_entities * 0.05)

        return min(confidence, 1.0)

    def to_code(self, parsed: Dict[str, Any]) -> str:
        """
        Convert parsed natural language to executable code.
        """
        intent = parsed["intent"]
        entities = parsed["entities"]

        if intent == "calculate":
            return self._generate_calculation_code(entities)
        elif intent == "define":
            return self._generate_definition_code(entities)
        elif intent == "teach":
            return self._generate_pattern_code(parsed["original_text"])
        else:
            return f"# Unable to convert: {parsed['original_text']}"

    def _generate_calculation_code(self, entities: Dict) -> str:
        """Generate calculation code from entities."""
        numbers = entities.get("numbers", [])
        operations = entities.get("operations", [])

        if "average" in operations and numbers:
            return f"result = sum({numbers}) / len({numbers})"
        elif "sum" in operations and numbers:
            return f"result = sum({numbers})"
        elif numbers:
            return f"result = {' + '.join(map(str, numbers))}"
        else:
            return "# No calculation found"

    def _generate_definition_code(self, entities: Dict) -> str:
        """Generate variable definition code."""
        variables = entities.get("variables", [])
        numbers = entities.get("numbers", [])
        strings = entities.get("strings", [])

        if variables and numbers:
            return f"{variables[0]} = {numbers[0]}"
        elif variables and strings:
            return f"{variables[0]} = '{strings[0]}'"
        else:
            return "# No definition found"

    def _generate_pattern_code(self, text: str) -> str:
        """Generate pattern teaching code."""
        # Extract pattern name and definition
        match = re.search(r"teach:\s*(\w+)\s*{([^}]+)}\s*->\s*{([^}]+)}", text)
        if match:
            name, params, body = match.groups()
            return f"def {name}({params}):\n    return {body}"
        else:
            return "# Pattern not recognized"
