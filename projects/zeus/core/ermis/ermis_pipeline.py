"""
Ermis Pipeline - Multi-Stage Request Processing
Enables complex request processing through configurable pipelines
"""

import time
import logging
from typing import Dict, Any, List, Optional, Callable, Tuple
from dataclasses import dataclass, field
from enum import Enum
from collections import deque
import asyncio
import threading
import uuid


class StageStatus(Enum):
    """Status of a pipeline stage"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    CANCELLED = "cancelled"


class StageType(Enum):
    """Types of pipeline stages"""
    TRANSFORM = "transform"      # Modifies the request data
    VALIDATE = "validate"        # Validates without modification
    ROUTE = "route"             # Determines next destination
    ENRICH = "enrich"           # Adds additional data
    AGGREGATE = "aggregate"      # Combines multiple sources
    FILTER = "filter"           # Filters or reduces data
    BRANCH = "branch"           # Conditional branching
    PARALLEL = "parallel"       # Parallel execution
    SEQUENTIAL = "sequential"   # Sequential execution


@dataclass
class StageResult:
    """Result from a pipeline stage"""
    status: StageStatus
    data: Any
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    duration: float = 0.0


@dataclass
class PipelineStage:
    """Definition of a pipeline stage"""
    name: str
    stage_type: StageType
    handler: Callable[[Dict[str, Any]], StageResult]
    conditions: List[Callable[[Dict[str, Any]], bool]] = field(default_factory=list)
    timeout: float = 5.0
    retry_count: int = 0
    on_error: Optional[Callable[[Exception], StageResult]] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PipelineContext:
    """Context carried through pipeline execution"""
    request_id: str
    original_request: Dict[str, Any]
    current_data: Dict[str, Any]
    sender: str
    stages_completed: List[str] = field(default_factory=list)
    stage_results: Dict[str, StageResult] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    start_time: float = field(default_factory=time.time)


class RequestPipeline:
    """
    Multi-stage request processing pipeline.
    Allows building complex processing flows with stages.
    """
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(__name__)
        self.stages: List[PipelineStage] = []
        self.stage_map: Dict[str, PipelineStage] = {}
        
    def add_stage(self, stage: PipelineStage) -> 'RequestPipeline':
        """Add a stage to the pipeline"""
        self.stages.append(stage)
        self.stage_map[stage.name] = stage
        return self
        
    def remove_stage(self, stage_name: str) -> bool:
        """Remove a stage from the pipeline"""
        if stage_name in self.stage_map:
            stage = self.stage_map[stage_name]
            self.stages.remove(stage)
            del self.stage_map[stage_name]
            return True
        return False
        
    def execute(self, request: Dict[str, Any], sender: str) -> Dict[str, Any]:
        """
        Execute the pipeline on a request.
        
        Args:
            request: The request to process
            sender: The sender of the request
            
        Returns:
            Final processed result
        """
        # Create context
        context = PipelineContext(
            request_id=str(uuid.uuid4()),
            original_request=request.copy(),
            current_data=request.copy(),
            sender=sender
        )
        
        self.logger.info(f"Starting pipeline '{self.name}' for request {context.request_id}")
        
        try:
            # Execute stages sequentially
            for stage in self.stages:
                if not self._should_execute_stage(stage, context):
                    self._record_stage_result(context, stage.name, StageResult(
                        status=StageStatus.SKIPPED,
                        data=context.current_data
                    ))
                    continue
                    
                # Execute stage
                result = self._execute_stage(stage, context)
                
                # Record result
                self._record_stage_result(context, stage.name, result)
                
                # Handle failure
                if result.status == StageStatus.FAILED:
                    return self._handle_pipeline_failure(context, stage, result)
                    
                # Update context data
                if result.data is not None:
                    context.current_data = result.data
                    
            # Pipeline completed successfully
            return self._create_pipeline_response(context, StageStatus.COMPLETED)
            
        except Exception as e:
            self.logger.error(f"Pipeline '{self.name}' failed: {e}")
            return self._create_pipeline_response(
                context, 
                StageStatus.FAILED,
                error=str(e)
            )
    
    def _should_execute_stage(self, stage: PipelineStage, context: PipelineContext) -> bool:
        """Check if a stage should be executed"""
        if not stage.conditions:
            return True
            
        for condition in stage.conditions:
            try:
                if not condition(context.current_data):
                    return False
            except Exception as e:
                self.logger.warning(f"Stage condition failed: {e}")
                return False
                
        return True
    
    def _execute_stage(self, stage: PipelineStage, context: PipelineContext) -> StageResult:
        """Execute a single stage with timeout and retry"""
        start_time = time.time()
        attempts = 0
        last_error = None
        
        while attempts <= stage.retry_count:
            try:
                # Execute with timeout
                if stage.timeout > 0:
                    result = self._execute_with_timeout(
                        stage.handler,
                        context.current_data,
                        stage.timeout
                    )
                else:
                    result = stage.handler(context.current_data)
                    
                # Add duration
                result.duration = time.time() - start_time
                return result
                
            except Exception as e:
                last_error = e
                attempts += 1
                
                if attempts > stage.retry_count:
                    # Use error handler if available
                    if stage.on_error:
                        try:
                            return stage.on_error(e)
                        except:
                            pass
                            
                    return StageResult(
                        status=StageStatus.FAILED,
                        data=context.current_data,
                        error=str(e),
                        duration=time.time() - start_time
                    )
                    
                # Wait before retry
                time.sleep(0.1 * attempts)
        
        return StageResult(
            status=StageStatus.FAILED,
            data=context.current_data,
            error=str(last_error),
            duration=time.time() - start_time
        )
    
    def _execute_with_timeout(self, handler: Callable, data: Dict[str, Any], timeout: float) -> StageResult:
        """Execute handler with timeout"""
        result_container = []
        exception_container = []
        
        def wrapper():
            try:
                result = handler(data)
                result_container.append(result)
            except Exception as e:
                exception_container.append(e)
                
        thread = threading.Thread(target=wrapper)
        thread.daemon = True
        thread.start()
        thread.join(timeout)
        
        if thread.is_alive():
            # Timeout occurred
            return StageResult(
                status=StageStatus.FAILED,
                data=data,
                error=f"Stage timed out after {timeout}s"
            )
            
        if exception_container:
            raise exception_container[0]
            
        return result_container[0] if result_container else StageResult(
            status=StageStatus.FAILED,
            data=data,
            error="No result returned"
        )
    
    def _record_stage_result(self, context: PipelineContext, stage_name: str, result: StageResult):
        """Record stage result in context"""
        context.stages_completed.append(stage_name)
        context.stage_results[stage_name] = result
        
    def _handle_pipeline_failure(self, context: PipelineContext, stage: PipelineStage, result: StageResult) -> Dict[str, Any]:
        """Handle pipeline failure"""
        return self._create_pipeline_response(
            context,
            StageStatus.FAILED,
            error=f"Stage '{stage.name}' failed: {result.error}"
        )
    
    def _create_pipeline_response(self, context: PipelineContext, status: StageStatus, error: Optional[str] = None) -> Dict[str, Any]:
        """Create final pipeline response"""
        duration = time.time() - context.start_time
        
        return {
            'pipeline': self.name,
            'request_id': context.request_id,
            'status': status.value,
            'data': context.current_data,
            'error': error,
            'stages_completed': context.stages_completed,
            'stage_results': {
                name: {
                    'status': result.status.value,
                    'error': result.error,
                    'duration': result.duration
                }
                for name, result in context.stage_results.items()
            },
            'duration': duration,
            'metadata': context.metadata
        }


class PipelineBuilder:
    """Builder for creating pipelines fluently"""
    
    def __init__(self, name: str):
        self.pipeline = RequestPipeline(name)
        
    def transform(self, name: str, handler: Callable, **kwargs) -> 'PipelineBuilder':
        """Add a transform stage"""
        stage = PipelineStage(
            name=name,
            stage_type=StageType.TRANSFORM,
            handler=handler,
            **kwargs
        )
        self.pipeline.add_stage(stage)
        return self
        
    def validate(self, name: str, handler: Callable, **kwargs) -> 'PipelineBuilder':
        """Add a validation stage"""
        stage = PipelineStage(
            name=name,
            stage_type=StageType.VALIDATE,
            handler=handler,
            **kwargs
        )
        self.pipeline.add_stage(stage)
        return self
        
    def enrich(self, name: str, handler: Callable, **kwargs) -> 'PipelineBuilder':
        """Add an enrichment stage"""
        stage = PipelineStage(
            name=name,
            stage_type=StageType.ENRICH,
            handler=handler,
            **kwargs
        )
        self.pipeline.add_stage(stage)
        return self
        
    def filter(self, name: str, handler: Callable, **kwargs) -> 'PipelineBuilder':
        """Add a filter stage"""
        stage = PipelineStage(
            name=name,
            stage_type=StageType.FILTER,
            handler=handler,
            **kwargs
        )
        self.pipeline.add_stage(stage)
        return self
        
    def branch(self, name: str, condition: Callable, true_handler: Callable, false_handler: Callable, **kwargs) -> 'PipelineBuilder':
        """Add a branching stage"""
        def branch_handler(data: Dict[str, Any]) -> StageResult:
            if condition(data):
                return true_handler(data)
            else:
                return false_handler(data)
                
        stage = PipelineStage(
            name=name,
            stage_type=StageType.BRANCH,
            handler=branch_handler,
            **kwargs
        )
        self.pipeline.add_stage(stage)
        return self
        
    def build(self) -> RequestPipeline:
        """Build and return the pipeline"""
        return self.pipeline


class PipelineRegistry:
    """Registry for managing multiple pipelines"""
    
    def __init__(self):
        self.pipelines: Dict[str, RequestPipeline] = {}
        self.logger = logging.getLogger(__name__)
        
    def register(self, pipeline: RequestPipeline):
        """Register a pipeline"""
        self.pipelines[pipeline.name] = pipeline
        self.logger.info(f"Registered pipeline: {pipeline.name}")
        
    def unregister(self, name: str) -> bool:
        """Unregister a pipeline"""
        if name in self.pipelines:
            del self.pipelines[name]
            return True
        return False
        
    def get(self, name: str) -> Optional[RequestPipeline]:
        """Get a pipeline by name"""
        return self.pipelines.get(name)
        
    def execute(self, pipeline_name: str, request: Dict[str, Any], sender: str) -> Dict[str, Any]:
        """Execute a pipeline by name"""
        pipeline = self.get(pipeline_name)
        if not pipeline:
            return {
                'error': f'Pipeline {pipeline_name} not found',
                'status': 'failed'
            }
            
        return pipeline.execute(request, sender)
        
    def list_pipelines(self) -> List[str]:
        """List all registered pipelines"""
        return list(self.pipelines.keys())


# Global pipeline registry
pipeline_registry = PipelineRegistry()


# Pre-built common pipelines
def create_storage_pipeline() -> RequestPipeline:
    """Create a pipeline for storage requests"""
    return (PipelineBuilder("storage_pipeline")
        .validate("security_check", lambda data: StageResult(
            status=StageStatus.COMPLETED,
            data=data
        ))
        .transform("normalize_data", lambda data: StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'normalized': True}
        ))
        .enrich("add_metadata", lambda data: StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'timestamp': time.time(), 'version': 1}
        ))
        .build()
    )


def create_nlp_pipeline() -> RequestPipeline:
    """Create a pipeline for NLP requests"""
    return (PipelineBuilder("nlp_pipeline")
        .validate("input_validation", lambda data: StageResult(
            status=StageStatus.COMPLETED,
            data=data
        ))
        .transform("text_preprocessing", lambda data: StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'text': data.get('text', '').lower().strip()}
        ))
        .enrich("language_detection", lambda data: StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'language': 'en'}
        ))
        .build()
    )


def create_compute_pipeline() -> RequestPipeline:
    """Create a pipeline for compute requests"""
    
    def validate_expression(data: Dict[str, Any]) -> StageResult:
        expression = data.get('expression', '')
        if not expression:
            return StageResult(
                status=StageStatus.FAILED,
                data=data,
                error="No expression provided"
            )
        return StageResult(status=StageStatus.COMPLETED, data=data)
    
    def sanitize_expression(data: Dict[str, Any]) -> StageResult:
        expression = data.get('expression', '')
        # Remove potentially dangerous characters
        sanitized = expression.replace('__', '').replace('import', '')
        return StageResult(
            status=StageStatus.COMPLETED,
            data={**data, 'expression': sanitized}
        )
    
    return (PipelineBuilder("compute_pipeline")
        .validate("expression_validation", validate_expression)
        .transform("expression_sanitization", sanitize_expression)
        .build()
    )


# Register default pipelines
pipeline_registry.register(create_storage_pipeline())
pipeline_registry.register(create_nlp_pipeline())
pipeline_registry.register(create_compute_pipeline())