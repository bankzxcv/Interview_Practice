"""
Platform information utility.
Demonstrates cross-platform compatibility.
"""

import sys
import platform
import os


def get_platform_info():
    """Get detailed platform information."""
    return {
        "os": platform.system(),
        "os_version": platform.release(),
        "architecture": platform.machine(),
        "python_version": sys.version,
        "python_implementation": platform.python_implementation(),
        "processor": platform.processor() or "Unknown",
    }


def get_env_info():
    """Get environment information."""
    return {
        "path_separator": os.pathsep,
        "path": os.environ.get("PATH", ""),
        "home": os.environ.get("HOME") or os.environ.get("USERPROFILE", ""),
    }


def print_info():
    """Print all system information."""
    print("=" * 60)
    print("PLATFORM INFORMATION")
    print("=" * 60)

    platform_info = get_platform_info()
    for key, value in platform_info.items():
        print(f"{key:20}: {value}")

    print("\n" + "=" * 60)
    print("ENVIRONMENT INFORMATION")
    print("=" * 60)

    env_info = get_env_info()
    for key, value in env_info.items():
        if key == "path":
            print(f"{key:20}: [PATH VARIABLE]")
        else:
            print(f"{key:20}: {value}")

    print("=" * 60)


if __name__ == "__main__":
    print_info()
