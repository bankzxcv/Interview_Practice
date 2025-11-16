#!/usr/bin/env python3
"""Unit tests for the application."""

from main import greet, calculate

def test_greet():
    """Test the greet function."""
    assert greet("World") == "Hello, World!"
    assert greet("GitLab") == "Hello, GitLab!"
    print("✓ Greet tests passed")

def test_calculate():
    """Test the calculate function."""
    assert calculate(2, 3) == 5
    assert calculate(10, -5) == 5
    print("✓ Calculate tests passed")

if __name__ == "__main__":
    test_greet()
    test_calculate()
    print("All tests passed!")
