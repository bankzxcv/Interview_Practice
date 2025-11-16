#!/usr/bin/env python3
"""Simple application for GitLab CI demonstration."""

def greet(name):
    """Return a greeting message."""
    return f"Hello, {name}!"

def calculate(a, b):
    """Perform a simple calculation."""
    return a + b

def main():
    print(greet("GitLab CI"))
    print(f"Calculation result: {calculate(5, 3)}")
    print("Application is running successfully!")

if __name__ == "__main__":
    main()
