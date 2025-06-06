# Suppress TensorFlow and other warnings
import os

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

import warnings

warnings.filterwarnings("ignore")

import sys
import argparse
import readline
import atexit
from pathlib import Path
from typing import Optional
import logging

# Set logging levels to reduce noise
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("tensorflow").setLevel(logging.ERROR)
logging.getLogger("absl").setLevel(logging.ERROR)

from colorama import init, Fore, Style
from .zeus_interpreter import ZeusInterpreter

# Initialize colorama for cross-platform colored output
init()


class ZeusCLI:
    """
    Command-line interface for Zeus programming language.
    """

    def __init__(self, model_path: Optional[str] = None):
        self.logger = logging.getLogger(__name__)

        # Initialize interpreter (it creates its own interfaces)
        self.interpreter = ZeusInterpreter()

        # Setup command history
        self.history_file = Path.home() / ".zeus_history"
        self._setup_history()

        # CLI commands
        self.commands = {
            ".help": self._show_help,
            ".exit": self._exit,
            ".quit": self._exit,
            ".clear": self._clear_screen,
            ".vars": self._list_variables,
            ".functions": self._list_functions,
            ".patterns": self._list_patterns,
            ".save": self._save_session,
            ".load": self._load_session,
            ".stats": self._show_statistics,
            ".explain": self._explain_last,
            ".usage": self._show_usage_patterns,
            ".bootcamp": self._run_pattern_bootcamp,
        }

        # Welcome message
        self._print_welcome()

    def _setup_history(self):
        """Setup command history."""
        try:
            readline.read_history_file(self.history_file)
        except FileNotFoundError:
            pass

        # Save history on exit
        atexit.register(self._save_history)

    def _save_history(self):
        """Save command history."""
        try:
            readline.write_history_file(self.history_file)
        except:
            pass

    def _print_welcome(self):
        """Print welcome message."""
        # Read version from .version file
        version = "2.0.0"  # default
        try:
            version_file = Path(__file__).parent.parent / ".version"
            if version_file.exists():
                version = version_file.read_text().strip()
        except Exception:
            pass
            
        print(f"\n{Fore.CYAN}     ⚡ {Fore.YELLOW}Z E U S{Fore.CYAN} ⚡{Style.RESET_ALL}")
        print(f"{Fore.BLUE}  ━━━━━━━━━━━━━━━━━━━━━━{Style.RESET_ALL}")
        print(f"  {Fore.WHITE}Semantic Programming{Style.RESET_ALL}")
        print(f"     {Fore.WHITE}Language v{version}{Style.RESET_ALL}\n")

        print(f"  {Fore.MAGENTA}◆{Style.RESET_ALL} Natural Language")
        print(f"  {Fore.MAGENTA}◆{Style.RESET_ALL} Pattern Learning")
        print(f"  {Fore.MAGENTA}◆{Style.RESET_ALL} AI-Powered Logic\n")

        print(f"  {Fore.GREEN}.help{Style.RESET_ALL} → commands")
        print(f"  {Fore.GREEN}athena:{Style.RESET_ALL} → AI mode\n")

    def _show_help(self, args: str = ""):
        """Show help information."""
        print(f"\n{Fore.YELLOW}Zeus Commands:{Style.RESET_ALL}")
        print(f"  {Fore.CYAN}.help{Style.RESET_ALL}      - Show this help message")
        print(f"  {Fore.CYAN}.exit{Style.RESET_ALL}      - Exit Zeus")
        print(f"  {Fore.CYAN}.clear{Style.RESET_ALL}     - Clear screen")
        print(f"  {Fore.CYAN}.vars{Style.RESET_ALL}      - List all variables")
        print(f"  {Fore.CYAN}.functions{Style.RESET_ALL} - List all functions")
        print(f"  {Fore.CYAN}.patterns{Style.RESET_ALL}  - List learned patterns")
        print(f"  {Fore.CYAN}.save{Style.RESET_ALL}      - Save session to file")
        print(f"  {Fore.CYAN}.load{Style.RESET_ALL}      - Load session from file")
        print(f"  {Fore.CYAN}.stats{Style.RESET_ALL}     - Show statistics")
        print(f"  {Fore.CYAN}.explain{Style.RESET_ALL}   - Explain last execution")
        print(f"  {Fore.CYAN}.usage{Style.RESET_ALL}     - Show usage patterns")
        print(f"  {Fore.CYAN}.bootcamp{Style.RESET_ALL}  - Run pattern bootcamp")

        print(f"\n{Fore.YELLOW}Language Features:{Style.RESET_ALL}")
        print(f"  • Natural language: {Fore.WHITE}athena: what is 2 + 2{Style.RESET_ALL}")
        print(f"  • Variables: {Fore.WHITE}x = 42{Style.RESET_ALL}")
        print(f"  • Arithmetic: {Fore.WHITE}result = (x + 10) * 2{Style.RESET_ALL}")
        print(f"  • Functions: {Fore.WHITE}sum(1, 2, 3){Style.RESET_ALL}")
        print(f"  • Patterns: {Fore.WHITE}teach: double {{n}} -> {{n}} * 2{Style.RESET_ALL}")
        print()

    def _exit(self, args: str = ""):
        """Exit the CLI."""
        print(f"\n{Fore.YELLOW}Goodbye! Your knowledge has been saved.{Style.RESET_ALL}")
        sys.exit(0)

    def _clear_screen(self, args: str = ""):
        """Clear the screen."""
        os.system("clear" if os.name == "posix" else "cls")

    def _list_variables(self, args: str = ""):
        """List all variables."""
        vars_dict = self.interpreter.list_variables()

        if not vars_dict:
            print(f"{Fore.YELLOW}No variables defined.{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.YELLOW}Variables:{Style.RESET_ALL}")
            for name, value in vars_dict.items():
                print(f"  {Fore.CYAN}{name}{Style.RESET_ALL} = {value}")
        print()

    def _list_functions(self, args: str = ""):
        """List all functions."""
        functions = self.interpreter.runtime.list_functions()

        if not functions:
            print(f"{Fore.YELLOW}No user functions defined.{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.YELLOW}Functions:{Style.RESET_ALL}")
            for func in functions:
                print(f"  {Fore.CYAN}{func}{Style.RESET_ALL}")
        print()

    def _list_patterns(self, args: str = ""):
        """List learned patterns."""
        patterns = self.interpreter.list_patterns()

        if not patterns:
            print(f"{Fore.YELLOW}No patterns learned yet.{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.YELLOW}Learned Patterns:{Style.RESET_ALL}")
            for pattern in patterns:
                print(f"  {Fore.CYAN}{pattern}{Style.RESET_ALL}")
        print()

    def _save_session(self, args: str = ""):
        """Save current session."""
        filename = args.strip() or "zeus_session.json"
        try:
            self.interpreter.save_session(filename)
            print(f"{Fore.GREEN}Session saved to {filename}{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}Error saving session: {e}{Style.RESET_ALL}")

    def _load_session(self, args: str = ""):
        """Load session from file."""
        filename = args.strip() or "zeus_session.json"
        try:
            self.interpreter.load_session(filename)
            print(f"{Fore.GREEN}Session loaded from {filename}{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}Error loading session: {e}{Style.RESET_ALL}")

    def _show_statistics(self, args: str = ""):
        """Show runtime statistics."""
        stats = self.interpreter.runtime.get_statistics()
        kb_stats = stats.get("knowledge_stats", {})

        print(f"\n{Fore.YELLOW}Zeus Statistics:{Style.RESET_ALL}")
        print(f"  Scope depth: {stats['scope_depth']}")
        print(f"  Variables: {stats['variables']}")
        print(f"  Functions: {stats['functions']}")

        print(f"\n{Fore.YELLOW}Knowledge Base:{Style.RESET_ALL}")
        print(f"  Stored variables: {kb_stats.get('variables', 0)}")
        print(f"  Learned patterns: {kb_stats.get('patterns', 0)}")
        print(f"  Knowledge nodes: {kb_stats.get('knowledge_nodes', 0)}")
        print(f"  Conversations: {kb_stats.get('conversations', 0)}")
        print()

    def _explain_last(self, args: str = ""):
        """Explain the last execution."""
        explanation = self.interpreter.explain_last_execution()
        print(f"\n{Fore.YELLOW}Explanation:{Style.RESET_ALL}")
        print(explanation)
        print()

    def _show_usage_patterns(self, args: str = ""):
        """Show learned usage patterns."""
        try:
            # Get usage patterns from Athena
            response = self.interpreter.athena.sender.request_and_wait({
                'type': 'get_usage_patterns'
            }, timeout=2.0)
            
            if response and response.get('status') == 'success':
                patterns = response.get('patterns', {})
                
                print(f"\n{Fore.YELLOW}Learned Usage Patterns:{Style.RESET_ALL}")
                
                # Show pattern types
                if 'pattern_types' in patterns:
                    print(f"\n{Fore.CYAN}Pattern Types:{Style.RESET_ALL}")
                    for ptype, count in patterns['pattern_types'].items():
                        print(f"  {ptype}: {count}")
                
                # Show naming styles
                if 'naming_styles' in patterns:
                    print(f"\n{Fore.CYAN}Naming Conventions:{Style.RESET_ALL}")
                    for style, count in patterns['naming_styles'].items():
                        print(f"  {style}: {count}")
                        
                # Show common variables
                if 'common_variables' in patterns:
                    print(f"\n{Fore.CYAN}Most Used Variables:{Style.RESET_ALL}")
                    for var, count in patterns['common_variables'][:5]:
                        print(f"  {var}: used {count} times")
                        
                # Show most used patterns
                if 'most_used_patterns' in patterns:
                    print(f"\n{Fore.CYAN}Common Patterns:{Style.RESET_ALL}")
                    for pattern_id, count in patterns['most_used_patterns'][:5]:
                        print(f"  {pattern_id}: {count} uses")
                        
                print(f"\n{Fore.GREEN}Total patterns detected: {patterns.get('total_patterns', 0)}{Style.RESET_ALL}")
            else:
                print(f"{Fore.YELLOW}No usage patterns available yet.{Style.RESET_ALL}")
                
        except Exception as e:
            print(f"{Fore.RED}Error getting usage patterns: {e}{Style.RESET_ALL}")
    
    def _run_pattern_bootcamp(self, args: str = ""):
        """Run the pattern bootcamp to teach Zeus common patterns."""
        try:
            from core.bootstrap.teaching_patterns_bootstrap import get_teaching_patterns
            
            patterns = get_teaching_patterns()
            
            print(f"\n{Fore.CYAN}🎓 Zeus Pattern Bootcamp{Style.RESET_ALL}")
            print(f"📚 Teaching {len(patterns)} patterns...\n")
            
            success_count = 0
            failed = []
            
            # Teach each pattern
            for i, pattern in enumerate(patterns, 1):
                try:
                    # Build teach command
                    params_str = ", ".join(pattern["parameters"])
                    teach_cmd = f"teach: {pattern['name']} {{{params_str}}} -> {pattern['implementation']} : {pattern['description']}"
                    
                    # Execute teach command
                    result = self.interpreter.execute(teach_cmd)
                    
                    if result and "Learned pattern:" in str(result):
                        success_count += 1
                        print(f"{Fore.GREEN}  ✓ {pattern['name']:<25}{Style.RESET_ALL} - {pattern['description']}")
                    else:
                        failed.append(pattern['name'])
                        print(f"{Fore.RED}  ✗ {pattern['name']:<25}{Style.RESET_ALL} - Failed")
                        
                except Exception as e:
                    failed.append(pattern['name'])
                    print(f"{Fore.RED}  ✗ {pattern['name']:<25}{Style.RESET_ALL} - Error: {e}")
            
            # Summary
            print(f"\n{Fore.CYAN}🎯 Bootcamp Complete!{Style.RESET_ALL}")
            print(f"  • Learned: {Fore.GREEN}{success_count}/{len(patterns)}{Style.RESET_ALL} patterns")
            if failed:
                print(f"  • Failed: {Fore.RED}{len(failed)}{Style.RESET_ALL} patterns")
                
        except Exception as e:
            print(f"{Fore.RED}Error running pattern bootcamp: {e}{Style.RESET_ALL}")

    def run(self):
        """Run the interactive CLI."""
        while True:
            try:
                # Get input with prompt
                prompt = f"{Fore.GREEN}zeus>{Style.RESET_ALL} "
                user_input = input(prompt).strip()

                if not user_input:
                    continue

                # Check for CLI commands
                if user_input.startswith("."):
                    cmd_parts = user_input.split(maxsplit=1)
                    cmd = cmd_parts[0]
                    args = cmd_parts[1] if len(cmd_parts) > 1 else ""

                    if cmd in self.commands:
                        self.commands[cmd](args)
                    else:
                        print(f"{Fore.RED}Unknown command: {cmd}{Style.RESET_ALL}")
                        print(f"Type {Fore.CYAN}.help{Style.RESET_ALL} for available commands")
                    continue

                # Execute Zeus/Athena code
                result = self.interpreter.execute(user_input)

                # Display result if not None
                if result is not None:
                    if isinstance(result, str) and result.startswith("Error:"):
                        print(f"{Fore.RED}{result}{Style.RESET_ALL}")
                    elif result == "__STATEMENT_EXECUTED__":
                        # Statement executed successfully (like if/while/for), don't show [No output]
                        pass
                    else:
                        print(f"{Fore.WHITE}{result}{Style.RESET_ALL}")
                elif user_input.strip() and not user_input.strip().startswith("."):
                    # If there was input but no result (and it's not a command)
                    print(f"{Fore.YELLOW}[No output]{Style.RESET_ALL}")

            except KeyboardInterrupt:
                print(f"\n{Fore.YELLOW}Use .exit to quit{Style.RESET_ALL}")
            except EOFError:
                self._exit()
            except Exception as e:
                print(f"{Fore.RED}Error: {e}{Style.RESET_ALL}")


def main():
    """Main entry point for Zeus CLI."""
    parser = argparse.ArgumentParser(description="Zeus AI Programming Language")
    parser.add_argument("-m", "--model", help="Path to pre-trained model")
    parser.add_argument("-f", "--file", help="Execute Zeus file")
    parser.add_argument("-c", "--command", help="Execute single command")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")

    args = parser.parse_args()

    # Setup logging
    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.WARNING)

    # Create CLI
    cli = ZeusCLI(model_path=args.model)

    # Execute file if provided
    if args.file:
        try:
            with open(args.file, "r") as f:
                code = f.read()
            result = cli.interpreter.execute(code)
            if result is not None:
                print(result)
        except Exception as e:
            print(f"Error executing file: {e}")
            sys.exit(1)

    # Execute command if provided
    elif args.command:
        result = cli.interpreter.execute(args.command)
        if result is not None:
            print(result)

    # Otherwise run interactive mode
    else:
        cli.run()


if __name__ == "__main__":
    main()
