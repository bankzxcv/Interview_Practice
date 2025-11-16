#!/usr/bin/env python3
"""
Simple Hello World application for GitHub Actions tutorial.
This demonstrates a basic Python application in a CI/CD pipeline.
"""

import sys
from datetime import datetime


def greet(name):
    """Return a greeting message.

    Args:
        name (str): Name to greet

    Returns:
        str: Greeting message
    """
    return f"Hello, {name}!"


def get_system_info():
    """Get basic system information.

    Returns:
        dict: System information
    """
    return {
        "python_version": sys.version,
        "platform": sys.platform,
        "timestamp": datetime.now().isoformat()
    }


def main():
    """Main entry point."""
    print("=" * 50)
    print(greet("GitHub Actions"))
    print("=" * 50)
    print("\nThis is a basic workflow example.")
    print("Demonstrating GitHub Actions CI/CD capabilities.\n")

    # Display system information
    info = get_system_info()
    print("System Information:")
    print(f"  Python Version: {info['python_version'].split()[0]}")
    print(f"  Platform: {info['platform']}")
    print(f"  Timestamp: {info['timestamp']}")

    print("\nWorkflow Step: Running Python application")
    print("Status: SUCCESS")
    print("=" * 50)

    return 0


if __name__ == "__main__":
    sys.exit(main())
