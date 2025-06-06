"""
Lightning Cache Manager - Manages compiled code cache
"""

import os
import json
import pickle
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

from .lightning_models import CompiledUnit, CodeType

class CacheManager:
    """Manages Lightning's cache of compiled code"""
    
    def __init__(self, cache_dir: Optional[str] = None):
        if cache_dir is None:
            # Use default cache directory in zeus root/data/lightning
            zeus_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(zeus_root, 'data')
            cache_dir = os.path.join(data_dir, 'lightning', 'cache')
        
        # Ensure cache directory exists
        os.makedirs(cache_dir, exist_ok=True)
        
        self.cache_dir = cache_dir
        self.index_file = os.path.join(cache_dir, 'cache_index.json')
        self.index = self._load_index()
        
    def _load_index(self) -> Dict[str, Any]:
        """Load cache index from disk"""
        if os.path.exists(self.index_file):
            try:
                with open(self.index_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
        
    def _save_index(self):
        """Save cache index to disk"""
        with open(self.index_file, 'w') as f:
            json.dump(self.index, f, indent=2, default=str)
            
    def get_cached(self, source_hash: str, code_type: CodeType) -> Optional[CompiledUnit]:
        """Get cached compiled unit if exists"""
        key = f"{source_hash}_{code_type.value}"
        
        if key in self.index:
            cache_data = self.index[key]
            file_path = cache_data['file_path']
            
            # Check if file still exists
            if os.path.exists(file_path):
                # Update access time
                cache_data['last_accessed'] = datetime.now().isoformat()
                cache_data['access_count'] = cache_data.get('access_count', 0) + 1
                self._save_index()
                
                # Reconstruct CompiledUnit
                return CompiledUnit(
                    id=cache_data['id'],
                    source_hash=source_hash,
                    code_type=CodeType(cache_data['code_type']),
                    optimization_level=cache_data['optimization_level'],
                    file_path=file_path,
                    metadata=cache_data.get('metadata', {}),
                    created_at=datetime.fromisoformat(cache_data['created_at']),
                    last_accessed=datetime.now(),
                    execution_count=cache_data.get('execution_count', 0)
                )
            else:
                # File missing, remove from index
                del self.index[key]
                self._save_index()
                
        return None
        
    def store(self, unit: CompiledUnit):
        """Store compiled unit in cache"""
        key = f"{unit.source_hash}_{unit.code_type.value}"
        
        self.index[key] = {
            'id': unit.id,
            'source_hash': unit.source_hash,
            'code_type': unit.code_type.value,
            'optimization_level': unit.optimization_level.value,
            'file_path': unit.file_path,
            'metadata': unit.metadata,
            'created_at': unit.created_at.isoformat(),
            'last_accessed': unit.last_accessed.isoformat(),
            'execution_count': unit.execution_count,
            'access_count': 1
        }
        
        self._save_index()
        
    def clear_cache(self, code_type: Optional[CodeType] = None):
        """Clear cache, optionally filtered by code type"""
        if code_type:
            # Clear specific type
            keys_to_remove = [
                k for k in self.index.keys() 
                if k.endswith(f"_{code_type.value}")
            ]
            for key in keys_to_remove:
                file_path = self.index[key]['file_path']
                if os.path.exists(file_path):
                    os.unlink(file_path)
                del self.index[key]
        else:
            # Clear all
            for cache_data in self.index.values():
                file_path = cache_data['file_path']
                if os.path.exists(file_path):
                    os.unlink(file_path)
            self.index = {}
            
        self._save_index()
        
    def get_statistics(self) -> Dict[str, Any]:
        """Get cache statistics"""
        stats = {
            'total_entries': len(self.index),
            'by_type': {},
            'total_size_bytes': 0,
            'most_accessed': None,
            'oldest_entry': None,
            'newest_entry': None
        }
        
        # Count by type and calculate sizes
        for cache_data in self.index.values():
            # Handle both compiled units and simple cache entries
            if 'code_type' in cache_data:
                code_type = cache_data['code_type']
                stats['by_type'][code_type] = stats['by_type'].get(code_type, 0) + 1
            elif cache_data.get('type') == 'simple_cache':
                stats['by_type']['simple'] = stats['by_type'].get('simple', 0) + 1
            
            # Add file size if exists
            file_path = cache_data['file_path']
            if os.path.exists(file_path):
                stats['total_size_bytes'] += os.path.getsize(file_path)
                
        # Find most accessed
        if self.index:
            most_accessed = max(
                self.index.items(),
                key=lambda x: x[1].get('access_count', 0)
            )
            stats['most_accessed'] = most_accessed[0]
            
            # Find oldest/newest
            sorted_by_date = sorted(
                self.index.items(),
                key=lambda x: x[1]['created_at']
            )
            stats['oldest_entry'] = sorted_by_date[0][0]
            stats['newest_entry'] = sorted_by_date[-1][0]
            
        return stats
    
    def set(self, key: str, value: Any):
        """Simple key-value cache setter for test compatibility"""
        # Store as a simple pickle file
        file_path = os.path.join(self.cache_dir, f"simple_{key}.pkl")
        with open(file_path, 'wb') as f:
            pickle.dump(value, f)
        
        # Update index for tracking
        self.index[f"simple_{key}"] = {
            'file_path': file_path,
            'created_at': datetime.now().isoformat(),
            'type': 'simple_cache'
        }
        self._save_index()
    
    def get(self, key: str, default=None) -> Any:
        """Simple key-value cache getter for test compatibility"""
        file_path = os.path.join(self.cache_dir, f"simple_{key}.pkl")
        
        if os.path.exists(file_path):
            try:
                with open(file_path, 'rb') as f:
                    return pickle.load(f)
            except:
                return default
        return default