"""Tests for platform_info module."""

import pytest
import platform
from platform_info import get_platform_info, get_env_info


def test_get_platform_info():
    """Test platform information retrieval."""
    info = get_platform_info()

    assert "os" in info
    assert "python_version" in info
    assert "architecture" in info

    # Platform should be one of the expected values
    assert info["os"] in ["Linux", "Darwin", "Windows", "Java"]


def test_get_env_info():
    """Test environment information retrieval."""
    info = get_env_info()

    assert "path_separator" in info
    assert "home" in info

    # Path separator should be platform-appropriate
    if platform.system() == "Windows":
        assert info["path_separator"] == ";"
    else:
        assert info["path_separator"] == ":"


@pytest.mark.skipif(
    platform.system() == "Windows",
    reason="Unix-specific test"
)
def test_unix_specific():
    """Test Unix-specific functionality."""
    info = get_platform_info()
    assert info["os"] in ["Linux", "Darwin"]


@pytest.mark.skipif(
    platform.system() != "Windows",
    reason="Windows-specific test"
)
def test_windows_specific():
    """Test Windows-specific functionality."""
    info = get_platform_info()
    assert info["os"] == "Windows"
