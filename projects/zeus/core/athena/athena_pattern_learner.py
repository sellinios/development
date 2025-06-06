import tensorflow as tf
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass, field
import json
import logging
from datetime import datetime
from common.safe_eval import safe_eval, SafeEvalConfig

try:
    from .athena_features import SemanticFeatureExtractor
except ImportError:
    SemanticFeatureExtractor = None


@dataclass
class Pattern:
    """Represents a learned pattern."""

    name: str
    template: str
    parameters: List[str]
    implementation: str
    examples: List[Dict[str, Any]] = field(default_factory=list)
    confidence: float = 0.5
    usage_count: int = 0
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    last_used: str = field(default_factory=lambda: datetime.now().isoformat())
    embeddings: Optional[np.ndarray] = None


class PatternLearner:
    """
    Neural network-based pattern learning system.
    Learns and generalizes from user-provided examples.
    """

    def __init__(self, knowledge_base=None):
        self.logger = logging.getLogger(__name__)

        # Initialize feature extractor if available
        if SemanticFeatureExtractor:
            try:
                self.feature_extractor = SemanticFeatureExtractor()
                self.use_semantic_features = True
            except Exception as e:
                self.logger.warning(f"Failed to initialize semantic features: {e}")
                self.feature_extractor = None
                self.use_semantic_features = False
        else:
            self.feature_extractor = None
            self.use_semantic_features = False

        # Pattern matching neural network
        self.pattern_encoder = self._build_pattern_encoder()

        # Pattern similarity network
        self.similarity_model = self._build_similarity_model()

        # Pattern generation network
        self.pattern_generator = self._build_pattern_generator()

        # In-memory pattern storage (would be persisted in production)
        self.patterns: Dict[str, Pattern] = {}

        # Learning parameters
        self.min_examples_for_generalization = 3
        self.similarity_threshold = 0.85

        # Knowledge base reference for loading stored patterns
        self.knowledge_base = knowledge_base

        # Load existing patterns from database if available
        if self.knowledge_base:
            self._load_patterns_from_db()

    def _build_pattern_encoder(self) -> tf.keras.Model:
        """Build encoder network for pattern representation."""
        model = tf.keras.Sequential(
            [
                tf.keras.layers.Dense(512, activation="relu"),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(256, activation="relu"),
                tf.keras.layers.Dense(128, activation="relu"),
                tf.keras.layers.Dense(64),  # Pattern embedding dimension
            ]
        )

        model.compile(optimizer="adam", loss="mse")
        return model

    def _build_similarity_model(self) -> tf.keras.Model:
        """Build model for computing pattern similarity."""
        input1 = tf.keras.Input(shape=(64,))
        input2 = tf.keras.Input(shape=(64,))

        # Compute similarity features
        diff = tf.keras.layers.Subtract()([input1, input2])
        mult = tf.keras.layers.Multiply()([input1, input2])

        # Concatenate features
        features = tf.keras.layers.Concatenate()([input1, input2, diff, mult])

        # Process through dense layers
        x = tf.keras.layers.Dense(128, activation="relu")(features)
        x = tf.keras.layers.Dropout(0.3)(x)
        x = tf.keras.layers.Dense(64, activation="relu")(x)
        x = tf.keras.layers.Dense(32, activation="relu")(x)
        similarity = tf.keras.layers.Dense(1, activation="sigmoid")(x)

        model = tf.keras.Model(inputs=[input1, input2], outputs=similarity)
        model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

        return model

    def _build_pattern_generator(self) -> tf.keras.Model:
        """Build generative model for creating new patterns."""
        model = tf.keras.Sequential(
            [
                tf.keras.layers.Dense(128, activation="relu"),
                tf.keras.layers.Dense(256, activation="relu"),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(512, activation="relu"),
                tf.keras.layers.Dense(1024, activation="tanh"),
            ]
        )

        model.compile(optimizer="adam", loss="mse")
        return model

    def learn_pattern(
        self,
        name: str,
        template: str,
        parameters: List[str],
        implementation: str,
        example: Optional[Dict[str, Any]] = None,
    ) -> Pattern:
        """
        Learn a new pattern or update existing one.
        """
        # Check if pattern exists
        if name in self.patterns:
            pattern = self.patterns[name]
            # Update confidence based on reinforcement
            pattern.confidence = min(pattern.confidence + 0.1, 1.0)
            pattern.usage_count += 1
            pattern.last_used = datetime.now().isoformat()
        else:
            # Create new pattern
            pattern = Pattern(
                name=name, template=template, parameters=parameters, implementation=implementation
            )
            self.patterns[name] = pattern

        # Add example if provided
        if example:
            pattern.examples.append(example)

        # Generate embeddings for the pattern
        pattern.embeddings = self._generate_embeddings(pattern)

        # Check for generalization opportunities
        if len(pattern.examples) >= self.min_examples_for_generalization:
            self._attempt_generalization(pattern)

        # Store pattern in database if we have a knowledge base
        if self.knowledge_base:
            pattern_data = {
                "name": pattern.name,
                "template": pattern.template,
                "parameters": pattern.parameters,
                "implementation": pattern.implementation,
                "description": f"Pattern {pattern.name}",
                "category": "learned",
            }
            self.knowledge_base.store_pattern(pattern_data)

        self.logger.info(f"Learned pattern: {name} (confidence: {pattern.confidence:.2f})")
        return pattern

    def extract_pattern(self, input_text: str, output: Any) -> Dict[str, Any]:
        """
        Extract pattern from input-output pair.
        """
        # Tokenize input
        tokens = self._tokenize(input_text)

        # Identify pattern structure
        structure = self._identify_structure(tokens, output)

        # Extract parameters
        parameters = self._extract_parameters(tokens, structure)

        # Generate pattern template
        template = self._generate_template(structure, parameters)

        # Find similar existing patterns
        similar_patterns = self._find_similar_patterns(template)

        if similar_patterns:
            # Merge with most similar pattern
            best_match = similar_patterns[0]
            return self._merge_patterns(best_match, template, parameters)
        else:
            # Create new pattern
            return {
                "name": self._generate_pattern_name(template),
                "template": template,
                "parameters": parameters,
                "implementation": str(output),
                "confidence": 0.5,
            }

    def _tokenize(self, text: str) -> List[str]:
        """Simple tokenization (would use proper NLP tokenizer in production)."""
        import re

        return re.findall(r"\w+|[^\w\s]", text.lower())

    def _identify_structure(self, tokens: List[str], output: Any) -> Dict[str, Any]:
        """Identify the structural pattern in tokens."""
        structure = {"type": "unknown", "components": [], "output_type": type(output).__name__}

        # Identify arithmetic patterns
        if any(
            op in tokens for op in ["+", "-", "*", "/", "add", "subtract", "multiply", "divide"]
        ):
            structure["type"] = "arithmetic"
            structure["components"] = [
                t
                for t in tokens
                if t in ["+", "-", "*", "/", "add", "subtract", "multiply", "divide"]
            ]

        # Identify assignment patterns
        elif "=" in tokens or "is" in tokens or "equals" in tokens:
            structure["type"] = "assignment"

        # Identify function patterns
        elif "def" in tokens or "function" in tokens or "teach" in tokens:
            structure["type"] = "function_definition"

        return structure

    def _extract_parameters(self, tokens: List[str], structure: Dict) -> List[str]:
        """Extract parameters from tokens based on structure."""
        parameters = []

        # Extract numeric parameters
        for i, token in enumerate(tokens):
            if token.replace(".", "").isdigit():
                parameters.append(f"num{len(parameters) + 1}")
            elif token.isalpha() and len(token) == 1:
                parameters.append(token)

        return parameters

    def _generate_template(self, structure: Dict, parameters: List[str]) -> str:
        """Generate pattern template from structure."""
        if structure["type"] == "arithmetic":
            ops = structure["components"]
            if ops:
                return f"{{{parameters[0]}}} {ops[0]} {{{parameters[1]}}}"
        elif structure["type"] == "assignment":
            return f"{{{parameters[0]}}} = {{{parameters[1]}}}"
        elif structure["type"] == "function_definition":
            return f"function {{{parameters[0]}}}({{{parameters[1]}}}) -> result"

        return "unknown_pattern"

    def _generate_embeddings(self, pattern: Pattern) -> np.ndarray:
        """Generate neural embeddings for a pattern."""
        if self.use_semantic_features and self.feature_extractor:
            # Use semantic feature extractor for real embeddings
            text = f"{pattern.name} {pattern.template} {' '.join(pattern.parameters)}"
            embeddings = self.feature_extractor.extract_features(text)

            # Normalize
            norm = np.linalg.norm(embeddings)
            if norm > 0:
                embeddings = embeddings / norm

            return embeddings
        else:
            # Fall back to simple feature-based embeddings
            features = self._pattern_to_features(pattern)

            # Generate embeddings using encoder
            embeddings = self.pattern_encoder.predict(features.reshape(1, -1))
            return embeddings[0]

    def _pattern_to_features(self, pattern: Pattern) -> np.ndarray:
        """Convert pattern to feature vector."""
        # Simplified feature extraction
        features = np.zeros(100)

        # Encode pattern type
        pattern_types = ["arithmetic", "assignment", "function", "conditional", "loop"]
        for i, ptype in enumerate(pattern_types):
            if ptype in pattern.template:
                features[i] = 1.0

        # Encode parameter count
        features[10] = len(pattern.parameters) / 10.0

        # Encode confidence
        features[11] = pattern.confidence

        # Encode usage statistics
        features[12] = pattern.usage_count / 100.0

        return features

    def _find_similar_patterns(self, template: str) -> List[Pattern]:
        """Find patterns similar to the given template."""
        if not self.patterns:
            return []

        # Generate embedding for new template
        temp_pattern = Pattern("temp", template, [], "")
        new_embedding = self._generate_embeddings(temp_pattern)

        # Calculate similarities
        similarities = []
        for name, pattern in self.patterns.items():
            if pattern.embeddings is not None:
                similarity = self._calculate_similarity(new_embedding, pattern.embeddings)
                if similarity > self.similarity_threshold:
                    similarities.append((similarity, pattern))

        # Sort by similarity
        similarities.sort(key=lambda x: x[0], reverse=True)
        return [pattern for _, pattern in similarities]

    def _calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """Calculate similarity between two pattern embeddings."""
        # Use cosine similarity
        dot_product = np.dot(embedding1, embedding2)
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def _merge_patterns(
        self, existing: Pattern, new_template: str, new_parameters: List[str]
    ) -> Dict[str, Any]:
        """Merge new pattern with existing similar pattern."""
        # Update existing pattern with new information
        existing.confidence = min(existing.confidence + 0.05, 1.0)
        existing.usage_count += 1

        return {
            "name": existing.name,
            "template": existing.template,
            "parameters": existing.parameters,
            "implementation": existing.implementation,
            "confidence": existing.confidence,
            "merged": True,
        }

    def _generate_pattern_name(self, template: str) -> str:
        """Generate a name for a new pattern."""
        # Extract key words from template
        words = template.replace("{", "").replace("}", "").split()
        if words:
            return f"pattern_{words[0]}_{len(self.patterns)}"
        return f"pattern_{len(self.patterns)}"

    def _attempt_generalization(self, pattern: Pattern):
        """Attempt to generalize pattern from examples."""
        if len(pattern.examples) < self.min_examples_for_generalization:
            return

        # Extract common structures from examples
        common_structure = self._find_common_structure(pattern.examples)

        # Update pattern if more general structure found
        if common_structure and common_structure != pattern.template:
            pattern.template = common_structure
            pattern.confidence = min(pattern.confidence + 0.1, 1.0)
            self.logger.info(f"Generalized pattern {pattern.name}: {common_structure}")

    def _find_common_structure(self, examples: List[Dict[str, Any]]) -> Optional[str]:
        """Find common structure across examples."""
        # Simplified implementation
        # In production, would use sequence alignment algorithms
        if not examples:
            return None

        # For now, return the first example's structure
        return examples[0].get("template")

    def apply_pattern(self, pattern_name: str, arguments: Dict[str, Any]) -> Any:
        """Apply a learned pattern with given arguments."""
        # Try exact match first
        if pattern_name not in self.patterns:
            # Try fuzzy matching
            pattern_name = self._find_closest_pattern(pattern_name)
            if not pattern_name:
                raise ValueError(f"Unknown pattern: {pattern_name}")

        pattern = self.patterns[pattern_name]
        pattern.usage_count += 1
        pattern.last_used = datetime.now().isoformat()

        # Get the implementation
        implementation = pattern.implementation
        
        # Strip outer curly braces if present
        if implementation.startswith('{') and implementation.endswith('}'):
            implementation = implementation[1:-1]

        # print(f"DEBUG: Applying pattern {pattern_name}")
        # print(f"DEBUG: Pattern parameters: {pattern.parameters}")
        # print(f"DEBUG: Arguments received: {arguments}")
        # print(f"DEBUG: Implementation: {implementation}")

        # Replace parameter placeholders with actual values
        for param in pattern.parameters:
            if param in arguments:
                # Replace {param} with the actual value
                placeholder = f"{{{param}}}"
                value = str(arguments[param])
                implementation = implementation.replace(placeholder, value)
            else:
                # print(f"DEBUG: WARNING - Parameter {param} is missing from arguments!")
                pass

        # print(f"DEBUG: Implementation after substitution: {implementation}")

        # Evaluate the expression with access to other patterns
        try:
            # Create evaluation namespace including the arguments
            eval_namespace = arguments.copy()

            # Add all patterns as callable functions
            for pname, ptrn in self.patterns.items():
                eval_namespace[pname] = lambda *args, p=ptrn, pn=pname: self._call_pattern(pn, args)

            # Use safe evaluator with appropriate configuration
            config = SafeEvalConfig(max_string_length=100000, max_power=1000)

            # Evaluate safely
            evaluated_result = safe_eval(implementation, eval_namespace, config)
            return evaluated_result
        except Exception as e:
            self.logger.error(f"Failed to evaluate pattern result: {e}")
            return f"Error: {e}"

    def _call_pattern(self, pattern_name: str, args: tuple) -> Any:
        """Helper to call a pattern from within another pattern."""
        pattern = self.patterns.get(pattern_name)
        if not pattern:
            return None

        # Map positional arguments to parameter names
        arg_dict = {}
        for i, (param, value) in enumerate(zip(pattern.parameters, args)):
            arg_dict[param] = value

        return self.apply_pattern(pattern_name, arg_dict)

    def _find_closest_pattern(self, name: str) -> Optional[str]:
        """Find closest matching pattern name using fuzzy matching."""
        from difflib import get_close_matches

        pattern_names = list(self.patterns.keys())
        matches = get_close_matches(name, pattern_names, n=1, cutoff=0.6)

        if matches:
            self.logger.info(f"Fuzzy matched '{name}' to pattern '{matches[0]}'")
            return matches[0]

        return None

    def get_pattern_suggestions(self, context: str) -> List[Pattern]:
        """Get pattern suggestions based on context."""
        suggestions = []

        # Generate context embedding
        context_pattern = Pattern("context", context, [], "")
        context_embedding = self._generate_embeddings(context_pattern)

        # Find similar patterns
        for name, pattern in self.patterns.items():
            if pattern.embeddings is not None:
                similarity = self._calculate_similarity(context_embedding, pattern.embeddings)
                if similarity > 0.7:  # Lower threshold for suggestions
                    suggestions.append((similarity, pattern))

        # Sort by similarity and confidence
        suggestions.sort(key=lambda x: x[0] * x[1].confidence, reverse=True)
        return [pattern for _, pattern in suggestions[:5]]  # Top 5 suggestions

    def _load_patterns_from_db(self):
        """Load existing patterns from the knowledge base."""
        try:
            # Direct database access for now
            import sqlite3
            import os
            import json
            
            db_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                'data', 'memory.db'
            )
            
            if not os.path.exists(db_path):
                self.logger.warning(f"Database not found: {db_path}")
                return
                
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("SELECT * FROM patterns")
            rows = cursor.fetchall()
            
            all_patterns = []
            for row in rows:
                pattern_data = {
                    'name': row['name'],
                    'pattern': row['pattern'],
                    'implementation': row['implementation'],
                    'template': row['pattern'],
                    'parameters': [],
                    'description': '',
                    'category': 'user_defined'
                }
                
                # Parse metadata if available
                if row['metadata']:
                    try:
                        metadata = json.loads(row['metadata'])
                        pattern_data['parameters'] = metadata.get('parameters', [])
                        pattern_data['description'] = metadata.get('description', '')
                        pattern_data['category'] = metadata.get('category', 'user_defined')
                    except:
                        pass
                
                all_patterns.append(pattern_data)
            
            conn.close()

            for pattern_data in all_patterns:
                # Convert database row to Pattern object
                pattern = Pattern(
                    name=pattern_data["name"],
                    template=pattern_data["template"],
                    parameters=pattern_data["parameters"],  # Already deserialized
                    implementation=pattern_data["implementation"],
                    confidence=pattern_data.get(
                        "success_rate", 1.0
                    ),  # Use success_rate as confidence
                    usage_count=pattern_data.get("usage_count", 0),
                    created_at=pattern_data.get("created_at", datetime.now().isoformat()),
                )

                # Generate embeddings for the pattern
                pattern.embeddings = self._generate_embeddings(pattern)

                # Store in memory
                self.patterns[pattern.name] = pattern

            self.logger.info(f"Loaded {len(self.patterns)} patterns from database")

        except Exception as e:
            self.logger.warning(f"Failed to load patterns from database: {e}")
