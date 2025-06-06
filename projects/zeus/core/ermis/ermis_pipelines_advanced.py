"""
Advanced Pipeline Definitions
Complex multi-stage processing pipelines for Zeus
"""

import time
import re
from typing import Dict, Any
from .ermis_pipeline import PipelineBuilder, StageResult, StageStatus, pipeline_registry
from .ermis_security import security_validator


def create_learning_pipeline():
    """
    Create an advanced learning pipeline that:
    1. Validates the pattern
    2. Extracts features
    3. Classifies the pattern type
    4. Enriches with metadata
    5. Routes to appropriate storage
    """
    
    def validate_pattern(data: Dict[str, Any]) -> StageResult:
        """Validate the pattern structure"""
        pattern_type = data.get('pattern_type', '')
        pattern_data = data.get('pattern_data', {})
        
        if not pattern_type:
            return StageResult(
                status=StageStatus.FAILED,
                data=data,
                error="Pattern type is required"
            )
            
        if not isinstance(pattern_data, dict):
            return StageResult(
                status=StageStatus.FAILED,
                data=data,
                error="Pattern data must be a dictionary"
            )
            
        return StageResult(status=StageStatus.COMPLETED, data=data)
    
    def extract_features(data: Dict[str, Any]) -> StageResult:
        """Extract features from the pattern"""
        pattern_data = data.get('pattern_data', {})
        
        features = {
            'has_variables': bool(pattern_data.get('variables', [])),
            'variable_count': len(pattern_data.get('variables', [])),
            'has_template': 'template' in pattern_data,
            'has_code': 'code' in pattern_data,
            'pattern_length': len(pattern_data.get('template', '')),
            'complexity': 'simple' if len(pattern_data.get('variables', [])) <= 2 else 'complex'
        }
        
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'features': features}
        )
    
    def classify_pattern(data: Dict[str, Any]) -> StageResult:
        """Classify the pattern into categories"""
        pattern_type = data.get('pattern_type', '')
        features = data.get('features', {})
        
        # Determine storage strategy
        if pattern_type == 'code_template':
            category = 'permanent'
            priority = 'high'
        elif features.get('complexity') == 'complex':
            category = 'permanent'
            priority = 'medium'
        else:
            category = 'cache'
            priority = 'low'
            
        classification = {
            'category': category,
            'priority': priority,
            'requires_validation': features.get('has_code', False)
        }
        
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'classification': classification}
        )
    
    def enrich_metadata(data: Dict[str, Any]) -> StageResult:
        """Add metadata for tracking and versioning"""
        metadata = {
            'created_at': time.time(),
            'version': 1,
            'source': data.get('source', 'unknown'),
            'classification': data.get('classification', {}),
            'features': data.get('features', {}),
            'tags': []
        }
        
        # Add tags based on pattern type
        pattern_type = data.get('pattern_type', '')
        if pattern_type:
            metadata['tags'].append(pattern_type)
            
        # Add tags based on features
        if data.get('features', {}).get('has_code'):
            metadata['tags'].append('executable')
            
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'metadata': metadata}
        )
    
    return (PipelineBuilder("learning_pipeline")
        .validate("pattern_validation", validate_pattern)
        .transform("feature_extraction", extract_features)
        .transform("pattern_classification", classify_pattern)
        .enrich("metadata_enrichment", enrich_metadata)
        .build()
    )


def create_code_analysis_pipeline():
    """
    Create a pipeline for analyzing code before execution:
    1. Security scan
    2. Complexity analysis
    3. Dependency check
    4. Performance estimation
    """
    
    def security_scan(data: Dict[str, Any]) -> StageResult:
        """Perform security scan on code"""
        code = data.get('code', '') or data.get('expression', '')
        
        # Use security validator
        validation_result = security_validator._validate_code_safety({'code': code})
        
        if not validation_result.valid:
            return StageResult(
                status=StageStatus.FAILED,
                data=data,
                error=validation_result.reason
            )
            
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'security_scan': 'passed'}
        )
    
    def analyze_complexity(data: Dict[str, Any]) -> StageResult:
        """Analyze code complexity"""
        code = data.get('code', '') or data.get('expression', '')
        
        # Simple complexity metrics
        lines = code.count('\n') + 1
        has_loops = any(keyword in code for keyword in ['for', 'while'])
        has_conditions = any(keyword in code for keyword in ['if', 'else', 'elif'])
        has_functions = 'def ' in code or 'lambda' in code
        has_classes = 'class ' in code
        
        complexity_score = sum([
            lines > 10,
            has_loops,
            has_conditions,
            has_functions,
            has_classes
        ])
        
        complexity = {
            'lines': lines,
            'has_loops': has_loops,
            'has_conditions': has_conditions,
            'has_functions': has_functions,
            'has_classes': has_classes,
            'score': complexity_score,
            'level': 'simple' if complexity_score <= 1 else 'moderate' if complexity_score <= 3 else 'complex'
        }
        
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'complexity': complexity}
        )
    
    def check_dependencies(data: Dict[str, Any]) -> StageResult:
        """Check for external dependencies"""
        code = data.get('code', '') or data.get('expression', '')
        
        # Find imports
        import_pattern = r'(?:import|from)\s+(\w+)'
        imports = re.findall(import_pattern, code)
        
        # Check for built-in modules only
        builtin_modules = {
            'math', 'random', 'datetime', 'time', 'json', 're',
            'collections', 'itertools', 'functools', 'operator'
        }
        
        external_imports = [imp for imp in imports if imp not in builtin_modules]
        
        dependencies = {
            'imports': imports,
            'external_imports': external_imports,
            'has_external': bool(external_imports),
            'safe': not external_imports
        }
        
        if external_imports:
            return StageResult(
                status=StageStatus.FAILED,
                data=data,
                error=f"External imports not allowed: {', '.join(external_imports)}"
            )
            
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'dependencies': dependencies}
        )
    
    def estimate_performance(data: Dict[str, Any]) -> StageResult:
        """Estimate performance characteristics"""
        complexity = data.get('complexity', {})
        
        # Simple heuristic-based estimation
        if complexity.get('level') == 'simple':
            estimated_time = 'fast'
            recommended_cache = False
        elif complexity.get('level') == 'moderate':
            estimated_time = 'moderate'
            recommended_cache = True
        else:
            estimated_time = 'slow'
            recommended_cache = True
            
        performance = {
            'estimated_time': estimated_time,
            'recommended_cache': recommended_cache,
            'optimization_hints': []
        }
        
        # Add optimization hints
        if complexity.get('has_loops'):
            performance['optimization_hints'].append('Consider list comprehensions for simple loops')
        if complexity.get('lines', 0) > 50:
            performance['optimization_hints'].append('Consider breaking into smaller functions')
            
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'performance': performance}
        )
    
    return (PipelineBuilder("code_analysis_pipeline")
        .validate("security_scan", security_scan)
        .transform("complexity_analysis", analyze_complexity)
        .validate("dependency_check", check_dependencies)
        .enrich("performance_estimation", estimate_performance)
        .build()
    )


def create_data_processing_pipeline():
    """
    Create a pipeline for processing data requests:
    1. Validate data format
    2. Transform data types
    3. Apply business rules
    4. Optimize for storage
    """
    
    def validate_format(data: Dict[str, Any]) -> StageResult:
        """Validate data format and structure"""
        request_data = data.get('data', {})
        
        if not isinstance(request_data, dict):
            return StageResult(
                status=StageStatus.FAILED,
                data=data,
                error="Data must be a dictionary"
            )
            
        # Check for required fields based on intent
        intent = data.get('intent', '')
        if intent == 'store':
            if 'name' not in request_data or 'value' not in request_data:
                return StageResult(
                    status=StageStatus.FAILED,
                    data=data,
                    error="Store requests require 'name' and 'value' fields"
                )
                
        return StageResult(status=StageStatus.COMPLETED, data=data)
    
    def transform_types(data: Dict[str, Any]) -> StageResult:
        """Transform data types for consistency"""
        request_data = data.get('data', {})
        
        # Ensure consistent types
        transformed = {}
        for key, value in request_data.items():
            if isinstance(value, (list, tuple)):
                # Convert to list
                transformed[key] = list(value)
            elif isinstance(value, set):
                # Convert to list for JSON serialization
                transformed[key] = list(value)
            elif hasattr(value, '__dict__'):
                # Convert objects to dict
                transformed[key] = value.__dict__
            else:
                transformed[key] = value
                
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'data': transformed}
        )
    
    def apply_business_rules(data: Dict[str, Any]) -> StageResult:
        """Apply business rules and constraints"""
        request_data = data.get('data', {})
        intent = data.get('intent', '')
        
        # Apply rules based on intent
        if intent == 'store':
            name = request_data.get('name', '')
            
            # Reserved names
            if name.startswith('__') and name.endswith('__'):
                return StageResult(
                    status=StageStatus.FAILED,
                    data=data,
                    error="Cannot use reserved names (double underscores)"
                )
                
            # Size limits
            import sys
            value_size = sys.getsizeof(request_data.get('value', ''))
            if value_size > 1024 * 1024:  # 1MB limit
                return StageResult(
                    status=StageStatus.FAILED,
                    data=data,
                    error=f"Value too large: {value_size} bytes"
                )
                
        return StageResult(status=StageStatus.COMPLETED, data=data)
    
    def optimize_storage(data: Dict[str, Any]) -> StageResult:
        """Optimize data for storage"""
        request_data = data.get('data', {})
        
        # Add storage hints
        storage_hints = {
            'compress': False,
            'index': False,
            'cache': True,
            'ttl': None
        }
        
        # Check if data should be compressed
        import json
        try:
            json_size = len(json.dumps(request_data))
            if json_size > 10240:  # 10KB
                storage_hints['compress'] = True
        except:
            pass
            
        # Check if temporary
        name = request_data.get('name', '')
        if name.startswith('_') or name.startswith('tmp_'):
            storage_hints['ttl'] = 3600  # 1 hour
            storage_hints['cache'] = True
        else:
            storage_hints['index'] = True
            
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'storage_hints': storage_hints}
        )
    
    return (PipelineBuilder("data_processing_pipeline")
        .validate("format_validation", validate_format)
        .transform("type_transformation", transform_types)
        .validate("business_rules", apply_business_rules)
        .enrich("storage_optimization", optimize_storage)
        .build()
    )


# Register advanced pipelines
def register_advanced_pipelines():
    """Register all advanced pipelines"""
    pipeline_registry.register(create_learning_pipeline())
    pipeline_registry.register(create_code_analysis_pipeline())
    pipeline_registry.register(create_data_processing_pipeline())
    
    # Create composite pipeline for complex operations
    def create_composite_pipeline():
        """Pipeline that combines multiple sub-pipelines"""
        
        def route_to_subpipeline(data: Dict[str, Any]) -> StageResult:
            """Route to appropriate sub-pipeline based on content"""
            intent = data.get('intent', '')
            
            if intent == 'learn':
                # Execute learning pipeline
                result = pipeline_registry.execute('learning_pipeline', data, data.get('sender', 'unknown'))
                return StageResult(
                    status=StageStatus.COMPLETED if result.get('status') == 'completed' else StageStatus.FAILED,
                    data=result.get('data', data),
                    error=result.get('error')
                )
            elif 'code' in data or 'expression' in data:
                # Execute code analysis pipeline
                result = pipeline_registry.execute('code_analysis_pipeline', data, data.get('sender', 'unknown'))
                return StageResult(
                    status=StageStatus.COMPLETED if result.get('status') == 'completed' else StageStatus.FAILED,
                    data=result.get('data', data),
                    error=result.get('error')
                )
            else:
                # Default data processing
                result = pipeline_registry.execute('data_processing_pipeline', data, data.get('sender', 'unknown'))
                return StageResult(
                    status=StageStatus.COMPLETED if result.get('status') == 'completed' else StageStatus.FAILED,
                    data=result.get('data', data),
                    error=result.get('error')
                )
        
        return (PipelineBuilder("composite_pipeline")
            .branch("route_to_subpipeline", 
                    lambda data: True,  # Always true, routing is in handler
                    route_to_subpipeline,
                    lambda data: StageResult(status=StageStatus.COMPLETED, data=data))
            .build()
        )
    
    pipeline_registry.register(create_composite_pipeline())


# Register on import
register_advanced_pipelines()