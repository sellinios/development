"""Feature extraction module for semantic understanding."""

import numpy as np
from typing import List, Dict, Any, Optional
import logging
from transformers import AutoTokenizer, AutoModel
import torch
from sklearn.feature_extraction.text import TfidfVectorizer
import spacy


class SemanticFeatureExtractor:
    """Extract semantic features from text for better understanding."""

    def __init__(self, model_name: str = "bert-base-uncased"):
        self.logger = logging.getLogger(__name__)

        # Initialize transformers
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModel.from_pretrained(model_name)
            self.model.eval()  # Set to evaluation mode
            self.use_transformer = True
        except Exception as e:
            self.logger.warning(f"Failed to load transformer model: {e}")
            self.use_transformer = False

        # Initialize spaCy
        try:
            self.nlp = spacy.load("en_core_web_sm")
            self.use_spacy = True
        except Exception as e:
            self.logger.warning(f"Failed to load spaCy model: {e}")
            self.use_spacy = False

        # TF-IDF as fallback
        self.tfidf = TfidfVectorizer(max_features=1000, stop_words="english")
        self.tfidf_fitted = False

    def extract_features(self, text: str) -> np.ndarray:
        """
        Extract semantic features from text.

        Args:
            text: Input text

        Returns:
            Feature vector as numpy array
        """
        features = []

        # Get transformer embeddings if available
        if self.use_transformer:
            transformer_features = self._get_transformer_features(text)
            features.append(transformer_features)

        # Get linguistic features if spaCy is available
        if self.use_spacy:
            linguistic_features = self._get_linguistic_features(text)
            features.append(linguistic_features)

        # Get statistical features
        statistical_features = self._get_statistical_features(text)
        features.append(statistical_features)

        # Concatenate all features
        if features:
            return np.concatenate(features)
        else:
            # Return zero vector if no features could be extracted
            return np.zeros(128)

    def _get_transformer_features(self, text: str) -> np.ndarray:
        """Extract features using transformer model."""
        try:
            # Tokenize input
            inputs = self.tokenizer(
                text, return_tensors="pt", truncation=True, padding=True, max_length=512
            )

            # Get embeddings
            with torch.no_grad():
                outputs = self.model(**inputs)

            # Use pooled output or mean of last hidden states
            if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                embeddings = outputs.pooler_output.squeeze().numpy()
            else:
                # Mean pooling over sequence length
                embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

            # Reduce dimensionality if needed
            if embeddings.shape[0] > 256:
                embeddings = embeddings[:256]

            return embeddings

        except Exception as e:
            self.logger.error(f"Error extracting transformer features: {e}")
            return np.zeros(256)

    def _get_linguistic_features(self, text: str) -> np.ndarray:
        """Extract linguistic features using spaCy."""
        try:
            doc = self.nlp(text)

            features = []

            # POS tag distribution
            pos_counts = {}
            for token in doc:
                pos_counts[token.pos_] = pos_counts.get(token.pos_, 0) + 1

            # Normalize and create feature vector
            total_tokens = len(doc)
            pos_tags = ["NOUN", "VERB", "ADJ", "ADV", "PRON", "DET", "PREP", "CONJ", "INTJ"]
            pos_features = [
                pos_counts.get(pos, 0) / total_tokens if total_tokens > 0 else 0 for pos in pos_tags
            ]
            features.extend(pos_features)

            # Dependency relations
            dep_counts = {}
            for token in doc:
                dep_counts[token.dep_] = dep_counts.get(token.dep_, 0) + 1

            # Common dependencies
            dep_types = ["nsubj", "dobj", "iobj", "amod", "advmod", "prep", "pobj", "ROOT"]
            dep_features = [
                dep_counts.get(dep, 0) / total_tokens if total_tokens > 0 else 0
                for dep in dep_types
            ]
            features.extend(dep_features)

            # Named entity counts
            entity_counts = {}
            for ent in doc.ents:
                entity_counts[ent.label_] = entity_counts.get(ent.label_, 0) + 1

            # Common entity types
            entity_types = ["PERSON", "ORG", "GPE", "DATE", "TIME", "MONEY", "PERCENT", "CARDINAL"]
            entity_features = [entity_counts.get(ent, 0) for ent in entity_types]
            features.extend(entity_features)

            # Syntactic complexity
            features.append(len(list(doc.sents)))  # Number of sentences
            features.append(np.mean([len(sent) for sent in doc.sents]))  # Avg sentence length
            features.append(len(doc))  # Total tokens

            return np.array(features, dtype=np.float32)

        except Exception as e:
            self.logger.error(f"Error extracting linguistic features: {e}")
            return np.zeros(28)  # 9 POS + 8 deps + 8 entities + 3 complexity

    def _get_statistical_features(self, text: str) -> np.ndarray:
        """Extract statistical text features."""
        features = []

        # Basic statistics
        features.append(len(text))  # Character count
        features.append(len(text.split()))  # Word count
        features.append(len(text.split("\n")))  # Line count

        # Character type ratios
        if len(text) > 0:
            features.append(sum(c.isalpha() for c in text) / len(text))  # Letter ratio
            features.append(sum(c.isdigit() for c in text) / len(text))  # Digit ratio
            features.append(sum(c.isspace() for c in text) / len(text))  # Whitespace ratio
            features.append(sum(c in ".,!?;:" for c in text) / len(text))  # Punctuation ratio
        else:
            features.extend([0, 0, 0, 0])

        # Word statistics
        words = text.split()
        if words:
            word_lengths = [len(word) for word in words]
            features.append(np.mean(word_lengths))  # Average word length
            features.append(np.std(word_lengths))  # Word length std dev
            features.append(max(word_lengths))  # Max word length
            features.append(min(word_lengths))  # Min word length
        else:
            features.extend([0, 0, 0, 0])

        # Vocabulary richness
        unique_words = set(word.lower() for word in words)
        features.append(len(unique_words) / len(words) if words else 0)  # Type-token ratio

        return np.array(features, dtype=np.float32)

    def get_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate semantic similarity between two texts.

        Args:
            text1: First text
            text2: Second text

        Returns:
            Similarity score between 0 and 1
        """
        # Extract features
        features1 = self.extract_features(text1)
        features2 = self.extract_features(text2)

        # Normalize
        norm1 = np.linalg.norm(features1)
        norm2 = np.linalg.norm(features2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        features1 = features1 / norm1
        features2 = features2 / norm2

        # Cosine similarity
        similarity = np.dot(features1, features2)

        # Ensure in [0, 1] range
        return max(0.0, min(1.0, (similarity + 1) / 2))

    def batch_extract_features(self, texts: List[str]) -> np.ndarray:
        """
        Extract features for multiple texts efficiently.

        Args:
            texts: List of texts

        Returns:
            Feature matrix (num_texts x feature_dim)
        """
        features = []

        for text in texts:
            features.append(self.extract_features(text))

        return np.vstack(features)
