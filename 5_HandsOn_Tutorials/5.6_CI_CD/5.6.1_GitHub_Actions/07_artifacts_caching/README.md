# Tutorial 07: Artifacts & Caching in GitHub Actions

## Objectives

By the end of this tutorial, you will:
- Upload and download build artifacts
- Implement dependency caching strategies
- Cache npm, pip, Maven, and Gradle dependencies
- Share data between workflow jobs
- Store test reports and logs
- Optimize workflow performance
- Understand artifact retention policies
- Use cache keys effectively

## Prerequisites

- Completion of Tutorials 01-06
- Understanding of build processes
- Knowledge of package managers (npm, pip, etc.)

## Key Concepts

### Artifacts
Files or collections of files produced during a workflow run that can be downloaded or shared between jobs.

### Cache
Reusable data (like dependencies) that speeds up subsequent workflow runs.

### Cache Key
Unique identifier for cached data, typically based on file hashes.

### Retention Period
How long artifacts and caches are stored (default: 90 days for artifacts).

## Step-by-Step Instructions

### Step 1: Basic Artifact Usage

**File: `.github/workflows/artifacts.yml`**

```yaml
name: Artifacts Demo

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Create build artifacts
      run: |
        mkdir -p build
        echo "Build output" > build/output.txt
        echo "Build timestamp: $(date)" > build/timestamp.txt

    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-artifacts
        path: |
          build/
          !build/*.tmp
        retention-days: 30

    - name: Create test reports
      run: |
        mkdir -p test-results
        echo "Test results" > test-results/results.xml

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: test-results
        path: test-results/
        retention-days: 7

  use-artifacts:
    needs: build
    runs-on: ubuntu-latest

    steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: build-artifacts
        path: ./downloaded

    - name: List artifacts
      run: |
        ls -R ./downloaded
        cat ./downloaded/build/output.txt

    - name: Use artifacts in deployment
      run: |
        echo "Deploying artifacts..."
        # Deployment logic here
```

### Step 2: Dependency Caching Strategies

**File: `.github/workflows/caching-npm.yml`**

```yaml
name: NPM Caching

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Node.js with cache
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: package-lock.json

    - name: Install dependencies (will use cache)
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: dist
        path: dist/
```

**File: `.github/workflows/caching-python.yml`**

```yaml
name: Python Caching

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python with cache
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
        cache: 'pip'
        cache-dependency-path: requirements.txt

    - name: Install dependencies (will use cache)
      run: pip install -r requirements.txt

    - name: Run tests
      run: pytest

    - name: Upload coverage reports
      uses: actions/upload-artifact@v4
      with:
        name: coverage-report
        path: htmlcov/
```

### Step 3: Advanced Caching

**File: `.github/workflows/advanced-caching.yml`**

```yaml
name: Advanced Caching

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Cache dependencies
      id: cache-deps
      uses: actions/cache@v3
      with:
        path: |
          ~/.npm
          ~/.cache/pip
          vendor/
        key: deps-${{ runner.os }}-${{ hashFiles('**/package-lock.json', '**/requirements.txt') }}
        restore-keys: |
          deps-${{ runner.os }}-

    - name: Install dependencies (if cache miss)
      if: steps.cache-deps.outputs.cache-hit != 'true'
      run: |
        npm ci
        pip install -r requirements.txt

    - name: Cache build output
      uses: actions/cache@v3
      with:
        path: build/
        key: build-${{ github.sha }}
        restore-keys: |
          build-${{ github.ref_name }}-

    - name: Build application
      run: |
        npm run build
        python setup.py build

    - name: Cache test data
      uses: actions/cache@v3
      with:
        path: test-data/
        key: test-data-v1
        # Static cache for test fixtures
```

### Step 4: Multi-Job Artifact Sharing

**File: `.github/workflows/multi-job-artifacts.yml`**

```yaml
name: Multi-Job Artifacts

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Build application
      run: |
        mkdir -p dist
        echo "Application bundle" > dist/app.js
        echo "Version: $(git rev-parse --short HEAD)" > dist/version.txt

    - name: Upload build output
      uses: actions/upload-artifact@v4
      with:
        name: app-build
        path: dist/

  test:
    needs: build
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: app-build
        path: dist/

    - name: Run tests on build
      run: |
        ls -la dist/
        echo "Running tests..."
        # Test logic here

    - name: Upload test results
      uses: actions/upload-artifact@v4
      with:
        name: test-results
        path: test-results/

  deploy:
    needs: [build, test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Download build artifacts
      uses: actions/download-artifact@v4
      with:
        name: app-build
        path: dist/

    - name: Download test results
      uses: actions/download-artifact@v4
      with:
        name: test-results
        path: test-results/

    - name: Deploy
      run: |
        echo "Deploying application..."
        ls -la dist/
        # Deployment logic here
```

### Step 5: Docker Layer Caching

**File: `.github/workflows/docker-cache.yml`**

```yaml
name: Docker Build with Cache

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Cache Docker layers
      uses: actions/cache@v3
      with:
        path: /tmp/.buildx-cache
        key: docker-${{ runner.os }}-${{ hashFiles('**/Dockerfile') }}
        restore-keys: |
          docker-${{ runner.os }}-

    - name: Build Docker image with cache
      uses: docker/build-push-action@v5
      with:
        context: .
        push: false
        tags: myapp:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Save Docker image as artifact
      run: |
        docker save myapp:latest | gzip > myapp-image.tar.gz

    - name: Upload Docker image artifact
      uses: actions/upload-artifact@v4
      with:
        name: docker-image
        path: myapp-image.tar.gz
        retention-days: 1
```

## Application Example

**File: `app/build.py`**

```python
"""Build script that demonstrates artifact creation."""

import os
import json
from datetime import datetime
import hashlib


def create_build_info():
    """Create build information file."""
    build_info = {
        "timestamp": datetime.now().isoformat(),
        "version": os.environ.get("GITHUB_SHA", "dev")[:7],
        "branch": os.environ.get("GITHUB_REF_NAME", "unknown"),
        "run_id": os.environ.get("GITHUB_RUN_ID", "0"),
    }

    # Create build directory
    os.makedirs("build", exist_ok=True)

    # Write build info
    with open("build/info.json", "w") as f:
        json.dump(build_info, f, indent=2)

    print(f"Build info created: {json.dumps(build_info, indent=2)}")

    return build_info


def create_checksum():
    """Create checksums for build artifacts."""
    checksums = {}

    for root, dirs, files in os.walk("build"):
        for file in files:
            if file.endswith(".json"):
                continue  # Skip checksum file itself

            filepath = os.path.join(root, file)
            with open(filepath, "rb") as f:
                checksum = hashlib.sha256(f.read()).hexdigest()
                checksums[file] = checksum

    # Write checksums
    with open("build/checksums.json", "w") as f:
        json.dump(checksums, f, indent=2)

    print(f"Checksums created: {json.dumps(checksums, indent=2)}")


if __name__ == "__main__":
    print("Starting build process...")
    create_build_info()
    create_checksum()
    print("Build complete!")
```

## Cache Key Strategies

### Good Cache Keys

```yaml
# Hash of dependency files
key: deps-${{ hashFiles('**/package-lock.json') }}

# OS + hash
key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}

# Multiple files
key: deps-${{ hashFiles('**/package-lock.json', '**/requirements.txt') }}

# Version + hash
key: v1-deps-${{ hashFiles('**/package-lock.json') }}

# Branch-specific
key: ${{ github.ref_name }}-deps-${{ hashFiles('**/package-lock.json') }}
```

### Cache Restore Keys

```yaml
restore-keys: |
  deps-${{ runner.os }}-
  deps-
```

## Best Practices

### 1. Use Specific Cache Keys
```yaml
# Good - specific
key: npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}

# Bad - too generic
key: cache-${{ github.run_id }}
```

### 2. Set Appropriate Retention
```yaml
# Long retention for releases
retention-days: 90

# Short retention for PR artifacts
retention-days: 7
```

### 3. Exclude Unnecessary Files
```yaml
path: |
  build/
  !build/**/*.tmp
  !build/**/*.log
```

### 4. Use Conditional Caching
```yaml
- name: Cache only on main branch
  if: github.ref == 'refs/heads/main'
  uses: actions/cache@v3
```

### 5. Version Your Caches
```yaml
# When dependencies change fundamentally
key: v2-deps-${{ hashFiles('**/package-lock.json') }}
```

### 6. Monitor Cache Size
```yaml
- name: Check cache size
  run: du -sh ~/.npm
```

## Troubleshooting

### Issue: Cache not being used

**Solutions:**
- Verify cache key matches
- Check restore-keys order
- Ensure paths are correct
- Check cache size limits (10 GB total)

### Issue: Artifacts not uploading

**Solutions:**
- Verify path exists
- Check file permissions
- Ensure artifact name is unique
- Check retention days setting

### Issue: Cache hit but dependencies reinstalling

**Solutions:**
- Verify cached paths match installation paths
- Check if lock file changed
- Review restore-keys pattern

## Summary

You've learned:
- Uploading and downloading artifacts
- Implementing dependency caching
- Cache key strategies
- Multi-job artifact sharing
- Docker layer caching
- Performance optimization

## Next Steps

Proceed to Tutorial 08: Release Automation to learn about automating releases with semantic versioning and changelogs.
