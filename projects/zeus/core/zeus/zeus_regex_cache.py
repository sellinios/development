"""Regex pattern caching for improved performance."""

import re
from typing import Dict, Pattern, Optional
import threading


class RegexCache:
    """Thread-safe regex pattern cache."""

    def __init__(self, max_size: int = 1000):
        self._cache: Dict[str, Pattern] = {}
        self._access_order = []
        self._lock = threading.Lock()
        self.max_size = max_size
        self.hits = 0
        self.misses = 0

    def get_pattern(self, pattern: str, flags: int = 0) -> Pattern:
        """Get a compiled regex pattern from cache or compile and cache it."""
        cache_key = f"{pattern}:{flags}"

        with self._lock:
            if cache_key in self._cache:
                # Move to end (LRU)
                self._access_order.remove(cache_key)
                self._access_order.append(cache_key)
                self.hits += 1
                return self._cache[cache_key]

            # Cache miss
            self.misses += 1

            # Compile pattern
            compiled = re.compile(pattern, flags)

            # Add to cache
            if len(self._cache) >= self.max_size:
                # Remove least recently used
                lru_key = self._access_order.pop(0)
                del self._cache[lru_key]

            self._cache[cache_key] = compiled
            self._access_order.append(cache_key)

            return compiled

    def search(self, pattern: str, string: str, flags: int = 0) -> Optional[re.Match]:
        """Search using a cached pattern."""
        compiled = self.get_pattern(pattern, flags)
        return compiled.search(string)

    def match(self, pattern: str, string: str, flags: int = 0) -> Optional[re.Match]:
        """Match using a cached pattern."""
        compiled = self.get_pattern(pattern, flags)
        return compiled.match(string)

    def findall(self, pattern: str, string: str, flags: int = 0) -> list:
        """Find all matches using a cached pattern."""
        compiled = self.get_pattern(pattern, flags)
        return compiled.findall(string)

    def sub(self, pattern: str, repl: str, string: str, count: int = 0, flags: int = 0) -> str:
        """Substitute using a cached pattern."""
        compiled = self.get_pattern(pattern, flags)
        return compiled.sub(repl, string, count)

    def split(self, pattern: str, string: str, maxsplit: int = 0, flags: int = 0) -> list:
        """Split using a cached pattern."""
        compiled = self.get_pattern(pattern, flags)
        return compiled.split(string, maxsplit)

    def clear(self):
        """Clear the cache."""
        with self._lock:
            self._cache.clear()
            self._access_order.clear()
            self.hits = 0
            self.misses = 0

    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics."""
        with self._lock:
            total = self.hits + self.misses
            hit_rate = (self.hits / total * 100) if total > 0 else 0
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "hits": self.hits,
                "misses": self.misses,
                "total": total,
                "hit_rate": hit_rate,
            }


# Global regex cache instance
_regex_cache = RegexCache()


# Convenience functions that use the global cache
def cached_search(pattern: str, string: str, flags: int = 0) -> Optional[re.Match]:
    """Search using the global regex cache."""
    return _regex_cache.search(pattern, string, flags)


def cached_match(pattern: str, string: str, flags: int = 0) -> Optional[re.Match]:
    """Match using the global regex cache."""
    return _regex_cache.match(pattern, string, flags)


def cached_findall(pattern: str, string: str, flags: int = 0) -> list:
    """Find all matches using the global regex cache."""
    return _regex_cache.findall(pattern, string, flags)


def cached_sub(pattern: str, repl: str, string: str, count: int = 0, flags: int = 0) -> str:
    """Substitute using the global regex cache."""
    return _regex_cache.sub(pattern, repl, string, count, flags)


def cached_split(pattern: str, string: str, maxsplit: int = 0, flags: int = 0) -> list:
    """Split using the global regex cache."""
    return _regex_cache.split(pattern, string, maxsplit, flags)


def get_cache_stats() -> Dict[str, int]:
    """Get global cache statistics."""
    return _regex_cache.get_stats()


def clear_cache():
    """Clear the global regex cache."""
    _regex_cache.clear()
