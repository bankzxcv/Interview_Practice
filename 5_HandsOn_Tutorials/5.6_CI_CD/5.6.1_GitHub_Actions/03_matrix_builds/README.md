# Tutorial 03: Matrix Builds with GitHub Actions

## Objectives

By the end of this tutorial, you will:
- Understand the matrix strategy for parallel job execution
- Test applications across multiple language versions
- Test across different operating systems (Linux, macOS, Windows)
- Use matrix include/exclude for fine-grained control
- Optimize build times with parallel execution
- Handle platform-specific configurations
- Implement fail-fast and continue-on-error strategies

## Prerequisites

- Completion of Tutorials 01 and 02
- Understanding of different OS environments
- Basic knowledge of Python and Node.js version management

## What are Matrix Builds?

Matrix builds allow you to test your code across multiple configurations simultaneously. Instead of creating separate workflow files for each version or OS, you define a matrix of variables, and GitHub Actions automatically creates and runs jobs for each combination.

## Key Concepts

### Matrix Strategy
A way to run the same job with different variable values in parallel.

### Parallel Execution
Multiple jobs running simultaneously to reduce total workflow time.

### Fail-Fast
Strategy that cancels all in-progress jobs if any job fails.

### Matrix Include/Exclude
Fine-grained control over which matrix combinations to run.

## Step-by-Step Instructions

### Step 1: Create a Cross-Platform Application

**File: `app/platform_info.py`**

```python
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
```

**File: `app/test_platform.py`**

```python
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
```

### Step 2: Create Matrix Workflow

**File: `.github/workflows/matrix.yml`**

```yaml
name: Matrix Build

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: Test Python ${{ matrix.python-version }} on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    timeout-minutes: 10

    strategy:
      fail-fast: false  # Don't cancel all jobs if one fails
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        python-version: ['3.9', '3.10', '3.11', '3.12']

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: ${{ matrix.python-version }}

    - name: Display Python version
      run: python --version

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install pytest

    - name: Run platform info
      working-directory: app
      run: python platform_info.py

    - name: Run tests
      working-directory: app
      run: pytest -v test_platform.py
```

### Step 3: Advanced Matrix with Include/Exclude

**File: `.github/workflows/matrix-advanced.yml`**

```yaml
name: Advanced Matrix Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test:
    name: ${{ matrix.name }}
    runs-on: ${{ matrix.os }}
    timeout-minutes: 15

    strategy:
      fail-fast: false
      matrix:
        include:
          # Linux builds with multiple Python versions
          - name: "Linux Python 3.9"
            os: ubuntu-latest
            python-version: '3.9'
            arch: x64

          - name: "Linux Python 3.11"
            os: ubuntu-latest
            python-version: '3.11'
            arch: x64

          - name: "Linux Python 3.12"
            os: ubuntu-latest
            python-version: '3.12'
            arch: x64

          # macOS build
          - name: "macOS Python 3.11"
            os: macos-latest
            python-version: '3.11'
            arch: x64

          # Windows builds
          - name: "Windows Python 3.11"
            os: windows-latest
            python-version: '3.11'
            arch: x64

          # Special configuration for Python 3.12 on Windows
          - name: "Windows Python 3.12"
            os: windows-latest
            python-version: '3.12'
            arch: x64
            experimental: true

    continue-on-error: ${{ matrix.experimental || false }}

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python ${{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: ${{ matrix.python-version }}
        architecture: ${{ matrix.arch }}

    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install pytest

    - name: Run tests
      working-directory: app
      run: pytest -v test_platform.py

    - name: Platform-specific step (Windows)
      if: runner.os == 'Windows'
      run: |
        echo "Running Windows-specific commands"
        systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

    - name: Platform-specific step (Linux)
      if: runner.os == 'Linux'
      run: |
        echo "Running Linux-specific commands"
        uname -a
        lsb_release -a || cat /etc/os-release

    - name: Platform-specific step (macOS)
      if: runner.os == 'macOS'
      run: |
        echo "Running macOS-specific commands"
        sw_vers
```

### Step 4: Node.js Matrix Build

**File: `.github/workflows/node-matrix.yml`**

```yaml
name: Node.js Matrix Build

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: Node ${{ matrix.node-version }} on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    timeout-minutes: 10

    strategy:
      fail-fast: true  # Cancel all if one fails
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: [18, 20, 21]
        # Exclude Node 21 on Windows (example)
        exclude:
          - os: windows-latest
            node-version: 21

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}

    - name: Display Node version
      run: node --version

    - name: Display npm version
      run: npm --version

    - name: Install dependencies (if package.json exists)
      run: |
        if [ -f "package.json" ]; then npm ci; fi
      shell: bash

    - name: Run basic test
      run: node -e "console.log('Node.js ${{ matrix.node-version }} works on ${{ matrix.os }}')"
```

### Step 5: Multi-Dimensional Matrix

**File: `.github/workflows/multi-dimension-matrix.yml`**

```yaml
name: Multi-Dimensional Matrix

on:
  workflow_dispatch:
  push:
    branches: [ main ]

jobs:
  test:
    name: Python ${{ matrix.python }} / Node ${{ matrix.node }} / ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    timeout-minutes: 15

    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest]
        python: ['3.10', '3.11']
        node: [18, 20]

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python ${{ matrix.python }}
      uses: actions/setup-python@v5
      with:
        python-version: ${{ matrix.python }}

    - name: Set up Node.js ${{ matrix.node }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node }}

    - name: Display versions
      run: |
        echo "Python version: $(python --version)"
        echo "Node version: $(node --version)"
        echo "OS: ${{ matrix.os }}"

    - name: Install Python dependencies
      run: |
        python -m pip install --upgrade pip
        pip install pytest

    - name: Run Python tests
      working-directory: app
      run: pytest -v test_platform.py
```

## Verification Steps

### Local Preparation

1. **Test Python code locally:**
   ```bash
   cd app
   python platform_info.py
   pytest test_platform.py
   ```

2. **Validate workflow syntax:**
   ```bash
   # Install actionlint
   brew install actionlint  # macOS
   # or
   sudo apt install actionlint  # Ubuntu

   # Validate workflows
   actionlint .github/workflows/*.yml
   ```

### GitHub Verification

1. **Push and observe matrix execution:**
   ```bash
   git add .
   git commit -m "Add matrix builds"
   git push
   ```

2. **View matrix in GitHub UI:**
   - Navigate to Actions tab
   - Click on workflow run
   - Observe multiple jobs running in parallel
   - Check that each combination executes

3. **Check timing:**
   - Note total workflow duration
   - Compare to sequential execution time
   - Verify parallel execution benefit

## Troubleshooting

### Issue: Matrix job limit exceeded

**Problem:** Too many matrix combinations.

**Solutions:**
```yaml
# Before: 3 OS × 4 Python × 3 Node = 36 jobs
# Reduce combinations:
strategy:
  matrix:
    os: [ubuntu-latest]  # Test thoroughly on one OS
    python: ['3.10', '3.11']  # Reduce versions
```

### Issue: Platform-specific failures

**Problem:** Tests fail on specific OS.

**Solutions:**
```yaml
# Mark as experimental
continue-on-error: ${{ matrix.os == 'windows-latest' }}

# Or skip specific tests
steps:
- name: Skip on Windows
  if: runner.os != 'Windows'
  run: pytest
```

### Issue: Long workflow duration

**Problem:** Matrix builds taking too long.

**Solutions:**
1. Use `fail-fast: true` for quick feedback
2. Reduce matrix combinations
3. Use caching for dependencies
4. Run expensive tests only on Linux

### Issue: Inconsistent results across platforms

**Problem:** Different behavior on different OS.

**Solutions:**
```python
# Use platform-specific logic
import platform

if platform.system() == 'Windows':
    # Windows-specific code
    pass
else:
    # Unix-specific code
    pass
```

## Best Practices

### 1. Start Small, Scale Up
```yaml
# Development: Test on one OS
strategy:
  matrix:
    os: [ubuntu-latest]
    python: ['3.11']

# Production: Full matrix
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    python: ['3.9', '3.10', '3.11', '3.12']
```

### 2. Use Descriptive Job Names
```yaml
name: Test Python ${{ matrix.python-version }} on ${{ matrix.os }}
```

### 3. Set Appropriate fail-fast
```yaml
# For PRs: fail fast for quick feedback
fail-fast: true

# For main branch: complete all tests
fail-fast: false
```

### 4. Use Matrix Variables Consistently
```yaml
strategy:
  matrix:
    python: ['3.10', '3.11']

steps:
- uses: actions/setup-python@v5
  with:
    python-version: ${{ matrix.python }}  # Consistent naming
```

### 5. Cache Dependencies
```yaml
- uses: actions/setup-python@v5
  with:
    python-version: ${{ matrix.python-version }}
    cache: 'pip'  # Cache per matrix combination
```

### 6. Handle Platform Differences
```yaml
- name: Install dependencies
  run: |
    if [ "$RUNNER_OS" == "Windows" ]; then
      choco install something
    elif [ "$RUNNER_OS" == "Linux" ]; then
      sudo apt-get install something
    else
      brew install something
    fi
  shell: bash
```

### 7. Use continue-on-error for Experimental
```yaml
strategy:
  matrix:
    include:
      - python: '3.13-dev'
        experimental: true

continue-on-error: ${{ matrix.experimental || false }}
```

## Advanced Patterns

### Dynamic Matrix from JSON
```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
    - id: set-matrix
      run: |
        echo "matrix={\"os\":[\"ubuntu-latest\",\"macos-latest\"],\"python\":[\"3.10\",\"3.11\"]}" >> $GITHUB_OUTPUT

  test:
    needs: setup
    strategy:
      matrix: ${{ fromJson(needs.setup.outputs.matrix) }}
```

### Conditional Matrix Expansion
```yaml
strategy:
  matrix:
    os: [ubuntu-latest]
    python: ['3.11']
    # Expand matrix only on main branch
    ${{ github.ref == 'refs/heads/main' && fromJSON('{"os":["ubuntu-latest","macos-latest","windows-latest"],"python":["3.9","3.10","3.11","3.12"]}') || fromJSON('{}') }}
```

## Performance Optimization

### Parallel Execution Limits
GitHub Actions has runner limits:
- Free tier: 20 concurrent jobs (Linux), 5 (macOS)
- Pro tier: Higher limits

Calculate matrix size:
```
Total jobs = os × versions × other dimensions
Example: 3 × 4 × 2 = 24 jobs
```

### Optimization Strategies

1. **Reduce unnecessary combinations:**
   ```yaml
   # Instead of 12 jobs (3 OS × 4 Python)
   # Use strategic selection: 5 jobs
   strategy:
     matrix:
       include:
         - os: ubuntu-latest
           python: '3.9'
         - os: ubuntu-latest
           python: '3.12'
         - os: macos-latest
           python: '3.11'
         - os: windows-latest
           python: '3.11'
   ```

2. **Use caching:**
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.cache/pip
       key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
   ```

3. **Fail fast on PRs:**
   ```yaml
   fail-fast: ${{ github.event_name == 'pull_request' }}
   ```

## Summary

You've learned:
- Creating matrix builds for parallel testing
- Testing across multiple Python/Node versions
- Cross-platform testing (Linux, macOS, Windows)
- Using include/exclude for fine-grained control
- Handling platform-specific configurations
- Optimizing build performance
- Best practices for matrix strategies

## Next Steps

Proceed to Tutorial 04: Docker Integration to learn about building and testing Docker containers in your CI/CD pipeline.
