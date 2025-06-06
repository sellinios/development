"""
Knowledge Bootstrap Framework
Main coordinator for loading fundamental knowledge into Zeus
"""

import logging
from typing import Dict, Any, List, Optional

# Use conditional imports to support both module and package usage
try:
    from .mathematics_bootstrap import MathematicsBootstrap
    from .patterns_bootstrap import PatternsBootstrap
    from .physics_bootstrap import PhysicsBootstrap
except ImportError:
    # For direct module testing
    import mathematics_bootstrap
    import patterns_bootstrap
    import physics_bootstrap
    MathematicsBootstrap = mathematics_bootstrap.MathematicsBootstrap
    PatternsBootstrap = patterns_bootstrap.PatternsBootstrap
    PhysicsBootstrap = physics_bootstrap.PhysicsBootstrap


class KnowledgeBootstrap:
    """
    Coordinates loading of fundamental knowledge into the Zeus system.
    Uses the unified Ermis interface to store knowledge intelligently.
    """
    
    def __init__(self, ermis_interface=None):
        self.logger = logging.getLogger(__name__)
        self.ermis = ermis_interface
        
        # Initialize domain bootstrappers when ermis is set
        self.math_bootstrap = None
        self.patterns_bootstrap = None
        self.physics_bootstrap = None
        
        self.loaded_domains = set()
        
        # Initialize bootstrappers if ermis provided
        if self.ermis:
            self._init_bootstrappers()
    
    def set_ermis_interface(self, ermis_interface):
        """Set the Ermis interface and initialize bootstrappers"""
        self.ermis = ermis_interface
        self._init_bootstrappers()
    
    def _init_bootstrappers(self):
        """Initialize domain bootstrappers with ermis interface"""
        if self.ermis:
            self.math_bootstrap = MathematicsBootstrap(self.ermis)
            self.patterns_bootstrap = PatternsBootstrap(self.ermis)
            self.physics_bootstrap = PhysicsBootstrap(self.ermis)
        
    def bootstrap_all(self, verbose: bool = True) -> Dict[str, Any]:
        """
        Load all fundamental knowledge domains.
        
        Args:
            verbose: Print progress messages
            
        Returns:
            Summary of loaded knowledge
        """
        if not self.ermis:
            raise RuntimeError("Ermis interface not set. Call set_ermis_interface() first.")
            
        if not self.math_bootstrap:
            self._init_bootstrappers()
            
        if verbose:
            print("🎓 Zeus Knowledge Bootstrap")
            print("=" * 40)
            
        results = {}
        
        # Bootstrap each domain
        domains = [
            ('mathematics', self.math_bootstrap),
            ('patterns', self.patterns_bootstrap),
            ('physics', self.physics_bootstrap)
        ]
        
        for domain_name, bootstrapper in domains:
            if verbose:
                print(f"\n📚 Loading {domain_name.title()}...")
                
            try:
                result = bootstrapper.load()
                results[domain_name] = result
                self.loaded_domains.add(domain_name)
                
                if verbose:
                    self._print_domain_summary(domain_name, result)
                    
            except Exception as e:
                self.logger.error(f"Failed to load {domain_name}: {e}")
                results[domain_name] = {'status': 'failed', 'error': str(e)}
                if verbose:
                    print(f"   ❌ Failed: {e}")
                    
        if verbose:
            print("\n" + "=" * 40)
            print(f"✅ Bootstrap Complete! Loaded {len(self.loaded_domains)} domains")
            
        return results
        
    def bootstrap_domain(self, domain: str) -> Dict[str, Any]:
        """Load a specific knowledge domain"""
        bootstrappers = {
            'mathematics': self.math_bootstrap,
            'patterns': self.patterns_bootstrap,
            'physics': self.physics_bootstrap
        }
        
        if domain not in bootstrappers:
            raise ValueError(f"Unknown domain: {domain}")
            
        bootstrapper = bootstrappers[domain]
        result = bootstrapper.load()
        self.loaded_domains.add(domain)
        
        return result
        
    def verify_knowledge(self) -> Dict[str, Any]:
        """Verify that bootstrapped knowledge is accessible"""
        verification = {}
        
        # Test retrieving some key constants
        test_items = [
            ('pi', 'mathematics'),
            ('e', 'mathematics'),
            ('c', 'physics'),
            ('greeting_pattern', 'patterns')
        ]
        
        for item_name, domain in test_items:
            value = self.ermis.retrieve(item_name)
            verification[item_name] = {
                'domain': domain,
                'found': value is not None,
                'value': value
            }
            
        return verification
        
    def _print_domain_summary(self, domain: str, result: Dict[str, Any]):
        """Print summary of loaded domain"""
        if result.get('status') == 'success':
            counts = result.get('counts', {})
            total = sum(counts.values())
            print(f"   ✓ Loaded {total} items:")
            for category, count in counts.items():
                print(f"     • {category}: {count}")
        else:
            print(f"   ❌ Failed to load {domain}")
            
    def get_loaded_domains(self) -> List[str]:
        """Get list of loaded domains"""
        return list(self.loaded_domains)
        
    def clear_knowledge(self, domain: str = None):
        """Clear knowledge (for testing purposes)"""
        # This would need to be implemented with care
        # For now, just log the intent
        self.logger.warning(f"Clear knowledge requested for domain: {domain or 'all'}")
        
    def export_knowledge(self, filepath: str):
        """Export bootstrapped knowledge to file"""
        # Future enhancement: export knowledge for backup/sharing
        pass
        
    def import_knowledge(self, filepath: str):
        """Import knowledge from file"""
        # Future enhancement: import custom knowledge sets
        pass