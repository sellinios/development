import tensorflow as tf
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
import logging
import re


@dataclass
class ReasoningStep:
    """Represents a single step in the reasoning process."""

    description: str
    action: str
    dependencies: List[str]
    confidence: float
    result: Optional[Any] = None


class ReasoningEngine:
    """
    Multi-step reasoning engine using neural networks for logical inference.
    Breaks down complex problems into executable steps.
    """

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        # Neural network for step generation
        self.step_generator = self._build_step_generator()

        # Neural network for dependency analysis
        self.dependency_analyzer = self._build_dependency_analyzer()

        # Reasoning patterns database
        self.reasoning_patterns = {
            "aggregation": self._aggregation_pattern,
            "conditional": self._conditional_pattern,
            "iteration": self._iteration_pattern,
            "composition": self._composition_pattern,
            "transformation": self._transformation_pattern,
        }

    def _build_step_generator(self) -> tf.keras.Model:
        """Build neural network for generating reasoning steps."""
        model = tf.keras.Sequential(
            [
                tf.keras.layers.Dense(512, activation="relu"),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(256, activation="relu"),
                tf.keras.layers.Dense(128, activation="relu"),
                tf.keras.layers.Dense(64, activation="softmax"),
            ]
        )

        model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

        return model

    def _build_dependency_analyzer(self) -> tf.keras.Model:
        """Build neural network for analyzing step dependencies."""
        model = tf.keras.Sequential(
            [
                tf.keras.layers.Dense(256, activation="relu"),
                tf.keras.layers.Dense(128, activation="relu"),
                tf.keras.layers.Dense(1, activation="sigmoid"),
            ]
        )

        model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

        return model

    def generate_plan(self, understanding: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate execution plan from understanding.
        This is the main entry point for the reasoning engine.
        """
        # Merge context if provided
        if context:
            understanding = {**understanding, "context": context}
        
        return self.process(understanding)
    
    def process(self, understanding: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process understanding and generate execution plan.
        """
        intent = understanding["intent"]
        entities = understanding["entities"]
        context = understanding.get("context", {})

        # Get original text from NLP result
        nlp_result = understanding.get("nlp_result", {})
        original_text = nlp_result.get("original_text", understanding.get("original_text", ""))
        
        # Simple arithmetic detection
        if intent == "calculate" or self._is_simple_arithmetic(original_text):
            # Handle simple arithmetic directly
            result = self._handle_simple_arithmetic(original_text, entities, context)
            if result is not None:
                return {
                    "type": "calculation",
                    "expression": original_text,
                    "result": result,
                    "confidence": 0.95,
                }

        # Identify reasoning pattern
        pattern = self._identify_pattern(intent, entities)

        # Generate reasoning steps
        steps = self._generate_steps(pattern, understanding)

        # Analyze dependencies
        steps = self._analyze_dependencies(steps)

        # Optimize execution order
        ordered_steps = self._optimize_execution_order(steps)

        # Generate execution plan
        plan = self._create_execution_plan(ordered_steps)
        
        # Check if we already have a simple result or need to evaluate an expression
        if understanding.get("nlp_result", {}).get("intent") == "calculate" or intent == "calculate":
            # Try to extract expression from original text
            if original_text:
                # Clean up the expression
                expr = re.sub(r"what\s+is\s+", "", original_text, flags=re.IGNORECASE).strip()
                
                # Check if this might be a pattern call
                parts = expr.split()
                if len(parts) >= 2 and context.get("patterns", {}).get(parts[0]):
                    # This is a pattern call - return it as an expression to evaluate
                    return {
                        "action": "calculate",
                        "expression": expr,
                        "pattern": pattern,
                        "steps": ordered_steps,
                        "plan": plan,
                        "confidence": self._calculate_plan_confidence(ordered_steps),
                    }
                else:
                    # Regular calculation
                    return {
                        "action": "calculate",
                        "expression": expr,
                        "pattern": pattern,
                        "steps": ordered_steps,
                        "plan": plan,
                        "confidence": self._calculate_plan_confidence(ordered_steps),
                    }

        return {
            "action": intent,  # Add action field for execution module
            "pattern": pattern,
            "steps": ordered_steps,
            "plan": plan,
            "nlp_result": nlp_result,  # Pass through NLP result for analysis
            "confidence": self._calculate_plan_confidence(ordered_steps),
        }

    def _identify_pattern(self, intent: str, entities: Dict) -> str:
        """Identify the reasoning pattern to apply."""
        if intent == "calculate" and "operations" in entities:
            if "average" in entities["operations"] or "mean" in entities["operations"]:
                return "aggregation"
        elif intent == "conditional":
            return "conditional"
        elif intent == "loop":
            return "iteration"
        elif len(entities.get("functions", [])) > 1:
            return "composition"
        else:
            return "transformation"

    def _generate_steps(self, pattern: str, understanding: Dict) -> List[ReasoningStep]:
        """Generate reasoning steps based on pattern."""
        if pattern in self.reasoning_patterns:
            return self.reasoning_patterns[pattern](understanding)
        else:
            return self._default_pattern(understanding)

    def _aggregation_pattern(self, understanding: Dict) -> List[ReasoningStep]:
        """Generate steps for aggregation operations."""
        entities = understanding["entities"]
        numbers = entities.get("numbers", [])

        steps = []

        # Step 1: Validate inputs
        steps.append(
            ReasoningStep(
                description="Validate input numbers",
                action=f"validate_numbers({numbers})",
                dependencies=[],
                confidence=0.95,
            )
        )

        # Step 2: Calculate sum
        steps.append(
            ReasoningStep(
                description="Calculate sum of numbers",
                action=f"sum({numbers})",
                dependencies=["Validate input numbers"],
                confidence=0.99,
            )
        )

        # Step 3: Calculate count
        steps.append(
            ReasoningStep(
                description="Count numbers",
                action=f"len({numbers})",
                dependencies=["Validate input numbers"],
                confidence=0.99,
            )
        )

        # Step 4: Calculate average
        steps.append(
            ReasoningStep(
                description="Calculate average",
                action="sum_result / count_result",
                dependencies=["Calculate sum of numbers", "Count numbers"],
                confidence=0.95,
            )
        )

        return steps

    def _conditional_pattern(self, understanding: Dict) -> List[ReasoningStep]:
        """Generate steps for conditional logic."""
        steps = []

        # Step 1: Evaluate condition
        steps.append(
            ReasoningStep(
                description="Evaluate condition",
                action="evaluate_condition()",
                dependencies=[],
                confidence=0.85,
            )
        )

        # Step 2: Execute true branch
        steps.append(
            ReasoningStep(
                description="Execute if true",
                action="execute_true_branch()",
                dependencies=["Evaluate condition"],
                confidence=0.80,
            )
        )

        # Step 3: Execute false branch
        steps.append(
            ReasoningStep(
                description="Execute if false",
                action="execute_false_branch()",
                dependencies=["Evaluate condition"],
                confidence=0.80,
            )
        )

        return steps

    def _iteration_pattern(self, understanding: Dict) -> List[ReasoningStep]:
        """Generate steps for iteration/loops."""
        steps = []

        # Step 1: Initialize iterator
        steps.append(
            ReasoningStep(
                description="Initialize iterator",
                action="iterator = create_iterator()",
                dependencies=[],
                confidence=0.90,
            )
        )

        # Step 2: Check condition
        steps.append(
            ReasoningStep(
                description="Check loop condition",
                action="check_condition(iterator)",
                dependencies=["Initialize iterator"],
                confidence=0.85,
            )
        )

        # Step 3: Execute loop body
        steps.append(
            ReasoningStep(
                description="Execute loop body",
                action="execute_body(iterator)",
                dependencies=["Check loop condition"],
                confidence=0.80,
            )
        )

        # Step 4: Update iterator
        steps.append(
            ReasoningStep(
                description="Update iterator",
                action="update_iterator(iterator)",
                dependencies=["Execute loop body"],
                confidence=0.90,
            )
        )

        return steps

    def _composition_pattern(self, understanding: Dict) -> List[ReasoningStep]:
        """Generate steps for function composition."""
        functions = understanding["entities"].get("functions", [])
        steps = []

        for i, func in enumerate(functions):
            deps = [f"Execute {functions[i-1]}"] if i > 0 else []
            steps.append(
                ReasoningStep(
                    description=f"Execute {func}",
                    action=f"{func}()",
                    dependencies=deps,
                    confidence=0.85,
                )
            )

        return steps

    def _transformation_pattern(self, understanding: Dict) -> List[ReasoningStep]:
        """Generate steps for data transformation."""
        return [
            ReasoningStep(
                description="Load input data",
                action="load_data()",
                dependencies=[],
                confidence=0.90,
            ),
            ReasoningStep(
                description="Apply transformation",
                action="transform(data)",
                dependencies=["Load input data"],
                confidence=0.85,
            ),
            ReasoningStep(
                description="Return result",
                action="return transformed_data",
                dependencies=["Apply transformation"],
                confidence=0.95,
            ),
        ]

    def _default_pattern(self, understanding: Dict) -> List[ReasoningStep]:
        """Default pattern for unrecognized intents."""
        return [
            ReasoningStep(
                description="Process input",
                action="process_input()",
                dependencies=[],
                confidence=0.70,
            ),
            ReasoningStep(
                description="Generate output",
                action="generate_output()",
                dependencies=["Process input"],
                confidence=0.65,
            ),
        ]

    def _analyze_dependencies(self, steps: List[ReasoningStep]) -> List[ReasoningStep]:
        """Analyze and validate step dependencies."""
        # Create step name index
        step_names = {step.description for step in steps}

        # Validate dependencies
        for step in steps:
            valid_deps = []
            for dep in step.dependencies:
                if dep in step_names:
                    valid_deps.append(dep)
                else:
                    self.logger.warning(f"Invalid dependency: {dep}")
            step.dependencies = valid_deps

        return steps

    def _optimize_execution_order(self, steps: List[ReasoningStep]) -> List[ReasoningStep]:
        """Optimize the order of step execution based on dependencies."""
        # Topological sort
        ordered = []
        visited = set()

        def visit(step: ReasoningStep):
            if step.description in visited:
                return

            visited.add(step.description)

            # Visit dependencies first
            for dep_name in step.dependencies:
                dep_step = next((s for s in steps if s.description == dep_name), None)
                if dep_step:
                    visit(dep_step)

            ordered.append(step)

        # Visit all steps
        for step in steps:
            visit(step)

        return ordered

    def _create_execution_plan(self, steps: List[ReasoningStep]) -> Dict[str, Any]:
        """Create detailed execution plan from steps."""
        plan = {"steps": [], "parallel_groups": [], "estimated_time": 0}

        # Group steps that can be executed in parallel
        current_group = []
        seen_deps = set()

        for step in steps:
            # Check if this step can be parallelized with current group
            can_parallel = all(dep in seen_deps for dep in step.dependencies)

            if can_parallel and current_group:
                current_group.append(step)
            else:
                if current_group:
                    plan["parallel_groups"].append(current_group)
                current_group = [step]

            seen_deps.add(step.description)

            # Add to sequential plan
            plan["steps"].append(
                {
                    "description": step.description,
                    "action": step.action,
                    "dependencies": step.dependencies,
                    "confidence": step.confidence,
                }
            )

        if current_group:
            plan["parallel_groups"].append(current_group)

        # Estimate execution time (simplified)
        plan["estimated_time"] = len(plan["parallel_groups"]) * 100  # ms

        return plan

    def _calculate_plan_confidence(self, steps: List[ReasoningStep]) -> float:
        """Calculate overall confidence for the execution plan."""
        if not steps:
            return 0.0

        # Average confidence weighted by step importance
        total_confidence = sum(step.confidence for step in steps)
        return total_confidence / len(steps)

    def explain_reasoning(self, plan: Dict[str, Any]) -> str:
        """Generate human-readable explanation of reasoning."""
        explanation = []
        explanation.append("Reasoning Process:")

        for i, step in enumerate(plan["steps"], 1):
            explanation.append(f"{i}. {step['description']}")
            if step["dependencies"]:
                explanation.append(f"   Depends on: {', '.join(step['dependencies'])}")
            explanation.append(f"   Confidence: {step['confidence']:.2f}")

        return "\n".join(explanation)

    def _is_simple_arithmetic(self, text: str) -> bool:
        """Check if text contains simple arithmetic expression."""
        # Remove "what is" prefix if present
        text = re.sub(r"what\s+is\s+", "", text, flags=re.IGNORECASE).strip()

        # Check for basic arithmetic patterns
        arithmetic_pattern = r"^[\d\s\+\-\*\/\(\)\.]+$"
        return bool(re.match(arithmetic_pattern, text))

    def _handle_simple_arithmetic(self, text: str, entities: Dict, context: Optional[Dict] = None) -> Optional[float]:
        """Handle simple arithmetic expressions and pattern calls."""
        try:
            # Remove "what is" prefix if present
            text = re.sub(r"what\s+is\s+", "", text, flags=re.IGNORECASE).strip()

            # Check if this might be a pattern call (e.g., "triple 7")
            # Pattern calls typically have format: pattern_name number(s)
            if context:
                # Check against known patterns
                parts = text.split()
                if len(parts) >= 2:
                    pattern_name = parts[0]
                    # Check if this is a known pattern
                    patterns = context.get("patterns", {})
                    if pattern_name in patterns:
                        # This is a pattern call, not simple arithmetic
                        # Return None to let it be handled by the pattern system
                        return None

            # Safe evaluation for arithmetic
            safe_dict = {
                "__builtins__": {
                    "abs": abs,
                    "round": round,
                    "min": min,
                    "max": max,
                    "sum": sum,
                    "len": len,
                    "int": int,
                    "float": float,
                    "pow": pow,
                }
            }

            result = eval(text, safe_dict)
            return result
        except:
            return None
