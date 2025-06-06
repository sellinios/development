#!/usr/bin/env python3
"""
Teaching Patterns Bootstrap - Zeus Pattern Bootcamp
Teaches Zeus a comprehensive set of useful patterns at startup
"""

from typing import List, Dict, Any


def get_teaching_patterns() -> List[Dict[str, Any]]:
    """
    Returns a list of patterns to teach Zeus using the teach syntax.
    Each pattern includes name, template, parameters, implementation, and description.
    """
    return [
        # Math patterns
        {
            "name": "double",
            "template": "double(x)",
            "parameters": ["x"],
            "implementation": "{x * 2}",
            "description": "doubles a number"
        },
        {
            "name": "triple",
            "template": "triple(x)",
            "parameters": ["x"],
            "implementation": "{x * 3}",
            "description": "triples a number"
        },
        {
            "name": "square",
            "template": "square(x)",
            "parameters": ["x"],
            "implementation": "{x * x}",
            "description": "squares a number"
        },
        {
            "name": "cube",
            "template": "cube(x)",
            "parameters": ["x"],
            "implementation": "{x * x * x}",
            "description": "cubes a number"
        },
        {
            "name": "half",
            "template": "half(x)",
            "parameters": ["x"],
            "implementation": "{x / 2}",
            "description": "halves a number"
        },
        {
            "name": "increment",
            "template": "increment(x)",
            "parameters": ["x"],
            "implementation": "{x + 1}",
            "description": "adds one to a number"
        },
        {
            "name": "decrement",
            "template": "decrement(x)",
            "parameters": ["x"],
            "implementation": "{x - 1}",
            "description": "subtracts one from a number"
        },
        
        # Comparison patterns
        {
            "name": "isPositive",
            "template": "isPositive(x)",
            "parameters": ["x"],
            "implementation": "{x > 0}",
            "description": "checks if a number is positive"
        },
        {
            "name": "isNegative",
            "template": "isNegative(x)",
            "parameters": ["x"],
            "implementation": "{x < 0}",
            "description": "checks if a number is negative"
        },
        {
            "name": "isEven",
            "template": "isEven(x)",
            "parameters": ["x"],
            "implementation": "{x % 2 == 0}",
            "description": "checks if a number is even"
        },
        {
            "name": "isOdd",
            "template": "isOdd(x)",
            "parameters": ["x"],
            "implementation": "{x % 2 != 0}",
            "description": "checks if a number is odd"
        },
        
        # String patterns
        {
            "name": "greet",
            "template": "greet(name)",
            "parameters": ["name"],
            "implementation": '{"Hello, " + name + "!"}',
            "description": "greets a person by name"
        },
        {
            "name": "shout",
            "template": "shout(text)",
            "parameters": ["text"],
            "implementation": '{text.upper() + "!!!"}',
            "description": "converts text to uppercase with exclamation"
        },
        {
            "name": "whisper",
            "template": "whisper(text)",
            "parameters": ["text"],
            "implementation": '{text.lower() + "..."}',
            "description": "converts text to lowercase with ellipsis"
        },
        
        # List patterns
        {
            "name": "first",
            "template": "first(lst)",
            "parameters": ["lst"],
            "implementation": "{lst[0] if lst else None}",
            "description": "gets the first element of a list"
        },
        {
            "name": "last",
            "template": "last(lst)",
            "parameters": ["lst"],
            "implementation": "{lst[-1] if lst else None}",
            "description": "gets the last element of a list"
        },
        {
            "name": "length",
            "template": "length(lst)",
            "parameters": ["lst"],
            "implementation": "{len(lst)}",
            "description": "gets the length of a list or string"
        },
        
        # Logic patterns
        {
            "name": "both",
            "template": "both(a, b)",
            "parameters": ["a", "b"],
            "implementation": "{a and b}",
            "description": "logical AND of two values"
        },
        {
            "name": "either",
            "template": "either(a, b)",
            "parameters": ["a", "b"],
            "implementation": "{a or b}",
            "description": "logical OR of two values"
        },
        {
            "name": "neither",
            "template": "neither(a, b)",
            "parameters": ["a", "b"],
            "implementation": "{not a and not b}",
            "description": "logical NOR of two values"
        },
        
        # Utility patterns
        {
            "name": "between",
            "template": "between(x, low, high)",
            "parameters": ["x", "low", "high"],
            "implementation": "{low <= x <= high}",
            "description": "checks if x is between low and high (inclusive)"
        },
        {
            "name": "clamp",
            "template": "clamp(x, low, high)",
            "parameters": ["x", "low", "high"],
            "implementation": "{max(low, min(x, high))}",
            "description": "clamps x between low and high"
        },
        {
            "name": "percentage",
            "template": "percentage(part, whole)",
            "parameters": ["part", "whole"],
            "implementation": "{(part / whole) * 100 if whole != 0 else 0}",
            "description": "calculates percentage"
        },
        {
            "name": "average",
            "template": "average(a, b)",
            "parameters": ["a", "b"],
            "implementation": "{(a + b) / 2}",
            "description": "calculates average of two numbers"
        },
        {
            "name": "distance",
            "template": "distance(x1, y1, x2, y2)",
            "parameters": ["x1", "y1", "x2", "y2"],
            "implementation": "{((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5}",
            "description": "calculates distance between two points"
        },
        
        # Temperature conversions
        {
            "name": "celsius_to_fahrenheit",
            "template": "celsius_to_fahrenheit(c)",
            "parameters": ["c"],
            "implementation": "{(c * 9/5) + 32}",
            "description": "converts Celsius to Fahrenheit"
        },
        {
            "name": "fahrenheit_to_celsius",
            "template": "fahrenheit_to_celsius(f)",
            "parameters": ["f"],
            "implementation": "{(f - 32) * 5/9}",
            "description": "converts Fahrenheit to Celsius"
        },
        
        # Financial patterns
        {
            "name": "discount",
            "template": "discount(price, percent)",
            "parameters": ["price", "percent"],
            "implementation": "{price * (1 - percent/100)}",
            "description": "applies a percentage discount"
        },
        {
            "name": "tax",
            "template": "tax(amount, rate)",
            "parameters": ["amount", "rate"],
            "implementation": "{amount * (1 + rate/100)}",
            "description": "adds tax to an amount"
        },
        {
            "name": "tip",
            "template": "tip(bill, percent)",
            "parameters": ["bill", "percent"],
            "implementation": "{bill * (percent/100)}",
            "description": "calculates tip amount"
        }
    ]


def bootstrap_teaching_patterns(runtime) -> Dict[str, Any]:
    """
    Bootstrap teaching patterns into Zeus using the runtime's teach_pattern method.
    
    Args:
        runtime: The Zeus runtime instance with teach_pattern method
        
    Returns:
        Summary of bootstrapped patterns
    """
    patterns = get_teaching_patterns()
    success_count = 0
    failed = []
    
    print("\n🎓 Starting Zeus Pattern Bootcamp...")
    print(f"📚 Teaching {len(patterns)} patterns...\n")
    
    for pattern in patterns:
        try:
            # Build teach command string
            params_str = ", ".join(pattern["parameters"])
            teach_cmd = f"teach: {pattern['name']} {{{params_str}}} -> {pattern['implementation']} : {pattern['description']}"
            
            # Teach the pattern
            result = runtime.teach_pattern(teach_cmd)
            
            if "Learned pattern:" in result:
                success_count += 1
                print(f"  ✓ {pattern['name']:<25} - {pattern['description']}")
            else:
                failed.append((pattern['name'], result))
                print(f"  ✗ {pattern['name']:<25} - Failed: {result}")
                
        except Exception as e:
            failed.append((pattern['name'], str(e)))
            print(f"  ✗ {pattern['name']:<25} - Error: {e}")
    
    print(f"\n🎯 Pattern Bootcamp Complete!")
    print(f"  • Learned: {success_count}/{len(patterns)} patterns")
    if failed:
        print(f"  • Failed: {len(failed)} patterns")
        for name, error in failed[:5]:  # Show first 5 failures
            print(f"    - {name}: {error}")
    
    return {
        "total": len(patterns),
        "success": success_count,
        "failed": failed,
        "patterns": [p["name"] for p in patterns if p["name"] not in [f[0] for f in failed]]
    }


def get_pattern_categories() -> Dict[str, List[str]]:
    """Get patterns organized by category"""
    patterns = get_teaching_patterns()
    categories = {
        "Math": [],
        "Logic": [],
        "String": [],
        "List": [],
        "Utility": [],
        "Conversion": [],
        "Financial": []
    }
    
    for p in patterns:
        desc = p["description"]
        name = p["name"]
        
        if "number" in desc or any(op in desc for op in ["doubles", "triples", "squares", "cubes", "halves", "adds", "subtracts"]):
            categories["Math"].append(name)
        elif "checks" in desc or name.startswith("is"):
            categories["Logic"].append(name)
        elif any(s in desc for s in ["text", "greet", "name"]):
            categories["String"].append(name)
        elif "list" in desc:
            categories["List"].append(name)
        elif "convert" in desc:
            categories["Conversion"].append(name)
        elif any(f in desc for f in ["price", "tax", "tip", "discount"]):
            categories["Financial"].append(name)
        else:
            categories["Utility"].append(name)
    
    # Remove empty categories
    return {k: v for k, v in categories.items() if v}


if __name__ == "__main__":
    # For testing - print all patterns organized by category
    patterns = get_teaching_patterns()
    print(f"🎓 Zeus Pattern Bootcamp")
    print(f"📚 {len(patterns)} patterns available\n")
    
    categories = get_pattern_categories()
    for cat, names in sorted(categories.items()):
        print(f"{cat} Patterns ({len(names)}):")
        for name in sorted(names):
            # Find pattern details
            pattern = next(p for p in patterns if p["name"] == name)
            print(f"  • {name:<25} - {pattern['description']}")
        print()