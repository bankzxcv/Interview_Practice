# Tutorial 03: Matrix Builds and Parallel Jobs

## Objectives

By the end of this tutorial, you will:
- Understand parallel job execution in GitLab CI
- Implement matrix builds for multiple versions/configurations
- Use parallel keyword for job parallelization
- Optimize pipeline execution time
- Implement fan-out/fan-in patterns
- Manage dependencies between parallel jobs

## Prerequisites

- Completed Tutorial 02: Testing
- Understanding of GitLab CI stages and jobs
- Familiarity with testing frameworks
- GitLab repository with CI/CD enabled

## What are Matrix Builds?

Matrix builds allow you to run the same job with different configurations (e.g., different Python versions, OS environments, or dependency versions) in parallel, reducing overall pipeline execution time.

## Key Concepts

### Parallel Jobs
Jobs in the same stage run in parallel by default. You can explicitly control parallelism using the `parallel` keyword.

### Matrix Strategy
Define multiple dimensions of configuration variables to create a matrix of job combinations.

### Job Dependencies
Control which jobs run in sequence using `needs` keyword for directed acyclic graph (DAG) pipelines.

### Resource Optimization
Balance between parallelism and available runner resources.

## Step-by-Step Instructions

### Step 1: Basic Parallel Execution

Create `.gitlab-ci.yml` with parallel jobs:

```yaml
stages:
  - test
  - report

# Simple parallel execution
parallel-test:
  stage: test
  parallel: 5
  script:
    - echo "Running parallel job ${CI_NODE_INDEX} of ${CI_NODE_TOTAL}"
    - sleep $((CI_NODE_INDEX * 2))
    - echo "Job ${CI_NODE_INDEX} completed"
  artifacts:
    paths:
      - "result-${CI_NODE_INDEX}.txt"
    expire_in: 1 hour

# Collect results
collect-results:
  stage: report
  script:
    - echo "Collecting results from parallel jobs"
    - ls -la result-*.txt || true
    - cat result-*.txt || true
  dependencies:
    - parallel-test
```

### Step 2: Matrix Builds - Multiple Python Versions

Create `.gitlab-ci.yml` for testing across Python versions:

```yaml
stages:
  - test
  - integrate

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

cache:
  paths:
    - .cache/pip

# Test on multiple Python versions
test-matrix:
  stage: test
  image: python:${PYTHON_VERSION}
  parallel:
    matrix:
      - PYTHON_VERSION: ["3.8", "3.9", "3.10", "3.11", "3.12"]
  before_script:
    - python --version
    - pip install pytest pytest-cov
    - pip install -r requirements.txt
  script:
    - echo "Testing on Python ${PYTHON_VERSION}"
    - pytest tests/ -v --junitxml=report-${PYTHON_VERSION}.xml
  artifacts:
    when: always
    reports:
      junit: report-${PYTHON_VERSION}.xml
    paths:
      - report-${PYTHON_VERSION}.xml
    expire_in: 1 week

# Integration test (runs after all matrix tests)
integration-test:
  stage: integrate
  image: python:3.11
  script:
    - echo "Running integration tests"
    - pip install pytest
    - pip install -r requirements.txt
    - pytest tests/integration/ -v
  needs:
    - test-matrix
```

### Step 3: Multi-Dimensional Matrix

Create `.gitlab-ci.yml` with multiple matrix dimensions:

```yaml
stages:
  - build
  - test

# Multi-dimensional matrix
build-matrix:
  stage: build
  parallel:
    matrix:
      - PYTHON_VERSION: ["3.9", "3.10", "3.11"]
        OS: ["alpine", "slim", "bullseye"]
        ARCH: ["amd64", "arm64"]
  image: python:${PYTHON_VERSION}-${OS}
  script:
    - echo "Building for Python ${PYTHON_VERSION} on ${OS} (${ARCH})"
    - echo "Build configuration:" > build-info.txt
    - echo "  Python: ${PYTHON_VERSION}" >> build-info.txt
    - echo "  OS: ${OS}" >> build-info.txt
    - echo "  Arch: ${ARCH}" >> build-info.txt
    - cat build-info.txt
  artifacts:
    paths:
      - build-info.txt
    name: "build-${PYTHON_VERSION}-${OS}-${ARCH}"
    expire_in: 1 day
  tags:
    - docker

# Test specific combinations
test-combinations:
  stage: test
  parallel:
    matrix:
      - PYTHON_VERSION: "3.11"
        OS: "alpine"
      - PYTHON_VERSION: "3.10"
        OS: "slim"
      - PYTHON_VERSION: "3.9"
        OS: "bullseye"
  image: python:${PYTHON_VERSION}-${OS}
  script:
    - echo "Testing Python ${PYTHON_VERSION} on ${OS}"
    - python --version
    - pip install pytest
    - pytest tests/ -v || true
```

### Step 4: Parallel Test Sharding

Create `.gitlab-ci.yml` for test sharding:

```yaml
stages:
  - test
  - coverage

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

# Shard tests across multiple runners
test-shard:
  stage: test
  image: python:3.11
  parallel: 4
  before_script:
    - pip install pytest pytest-cov pytest-split
    - pip install -r requirements.txt
  script:
    - |
      echo "Running test shard ${CI_NODE_INDEX}/${CI_NODE_TOTAL}"
      # Split tests evenly across shards
      pytest tests/ \
        --cov=app \
        --cov-report=xml:coverage-${CI_NODE_INDEX}.xml \
        --junitxml=report-${CI_NODE_INDEX}.xml \
        -n auto \
        --splits ${CI_NODE_TOTAL} \
        --group ${CI_NODE_INDEX}
  artifacts:
    when: always
    reports:
      junit: report-${CI_NODE_INDEX}.xml
    paths:
      - coverage-${CI_NODE_INDEX}.xml
    expire_in: 1 day

# Merge coverage from all shards
merge-coverage:
  stage: coverage
  image: python:3.11
  script:
    - pip install coverage
    - |
      echo "Merging coverage reports from all shards"
      coverage combine coverage-*.xml 2>/dev/null || true
      coverage report || true
      coverage html || true
  artifacts:
    paths:
      - htmlcov/
    expire_in: 30 days
  needs:
    - test-shard
```

### Step 5: Conditional Matrix Jobs

Create `.gitlab-ci.yml` with conditional execution:

```yaml
stages:
  - test

# Matrix with rules
test-conditional-matrix:
  stage: test
  parallel:
    matrix:
      - ENVIRONMENT: [dev, staging, prod]
        REGION: [us-east-1, eu-west-1, ap-south-1]
  script:
    - echo "Testing ${ENVIRONMENT} in ${REGION}"
    - ./run-tests.sh ${ENVIRONMENT} ${REGION}
  rules:
    # Only run prod tests on main branch
    - if: '$ENVIRONMENT == "prod" && $CI_COMMIT_BRANCH != "main"'
      when: never
    # Run staging tests on develop and main
    - if: '$ENVIRONMENT == "staging"'
      when: on_success
    # Run dev tests always
    - if: '$ENVIRONMENT == "dev"'
      when: always
  allow_failure:
    - ENVIRONMENT: dev  # Dev failures don't block pipeline
```

### Step 6: Fan-Out/Fan-In Pattern

Create `.gitlab-ci.yml` with fan-out/fan-in:

```yaml
stages:
  - prepare
  - parallel-build
  - collect
  - test

# Single preparation job
prepare:
  stage: prepare
  script:
    - echo "Preparing build environment"
    - mkdir -p artifacts
    - echo "prepared" > artifacts/status.txt
  artifacts:
    paths:
      - artifacts/
    expire_in: 1 hour

# Fan-out: Multiple parallel builds
build-component:
  stage: parallel-build
  parallel:
    matrix:
      - COMPONENT: [frontend, backend, api, worker, scheduler]
  script:
    - echo "Building ${COMPONENT}"
    - mkdir -p dist/${COMPONENT}
    - echo "${COMPONENT} built successfully" > dist/${COMPONENT}/build.txt
    - sleep 5
  artifacts:
    paths:
      - dist/${COMPONENT}/
    expire_in: 1 hour
  needs:
    - prepare

# Fan-in: Collect all parallel results
collect-builds:
  stage: collect
  script:
    - echo "Collecting all build artifacts"
    - find dist/ -type f -name "build.txt" -exec cat {} \;
    - |
      echo "Build summary:" > build-summary.txt
      for component in dist/*; do
        echo "- $(basename $component): OK" >> build-summary.txt
      done
    - cat build-summary.txt
  artifacts:
    paths:
      - build-summary.txt
    expire_in: 1 week
  needs:
    - job: build-component
      artifacts: true

# Final integration test
integration-test:
  stage: test
  script:
    - echo "Running integration tests on all components"
    - cat build-summary.txt
    - echo "All components integrated successfully"
  needs:
    - collect-builds
```

### Step 7: Dynamic Parallel Jobs

Create `.gitlab-ci.yml` with dynamic parallelism:

```yaml
stages:
  - discover
  - test
  - report

# Discover test files
discover-tests:
  stage: discover
  script:
    - |
      echo "Discovering test files"
      find tests/ -name "test_*.py" > test-files.txt
      cat test-files.txt
  artifacts:
    paths:
      - test-files.txt
    expire_in: 1 hour

# Run tests in parallel based on discovery
run-tests:
  stage: test
  parallel: 10
  script:
    - |
      # Calculate which tests this shard should run
      TOTAL_TESTS=$(wc -l < test-files.txt)
      TESTS_PER_SHARD=$((TOTAL_TESTS / CI_NODE_TOTAL + 1))
      START_LINE=$((CI_NODE_INDEX * TESTS_PER_SHARD + 1))

      echo "Running tests for shard ${CI_NODE_INDEX}/${CI_NODE_TOTAL}"
      echo "Processing lines ${START_LINE} to $((START_LINE + TESTS_PER_SHARD - 1))"

      sed -n "${START_LINE},$((START_LINE + TESTS_PER_SHARD - 1))p" test-files.txt | \
        while read testfile; do
          echo "Running: $testfile"
          pytest "$testfile" -v || true
        done
  needs:
    - discover-tests

# Generate report
generate-report:
  stage: report
  script:
    - echo "All parallel tests completed"
    - echo "Total shards: ${CI_NODE_TOTAL:-10}"
  needs:
    - run-tests
```

### Step 8: Performance Optimization

Create `.gitlab-ci.yml` optimized for performance:

```yaml
stages:
  - quick-test
  - full-test
  - benchmark

variables:
  FF_USE_FASTZIP: "true"  # Faster artifact compression
  CACHE_COMPRESSION_LEVEL: "fast"
  GIT_DEPTH: 1  # Shallow clone

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - .cache/pip
    - .venv/
  policy: pull-push

# Quick smoke tests (always run)
smoke-test:
  stage: quick-test
  image: python:3.11-alpine
  cache:
    policy: pull
  script:
    - pip install pytest
    - pytest tests/smoke/ -v --maxfail=1
  timeout: 5 minutes

# Comprehensive parallel tests
comprehensive-test:
  stage: full-test
  image: python:3.11
  parallel: 8
  before_script:
    - pip install pytest pytest-xdist pytest-cov
    - pip install -r requirements.txt
  script:
    - |
      pytest tests/ \
        -n auto \
        -v \
        --dist=loadscope \
        --junitxml=report-${CI_NODE_INDEX}.xml
  artifacts:
    when: always
    reports:
      junit: report-${CI_NODE_INDEX}.xml
    expire_in: 1 day
  timeout: 15 minutes
  needs:
    - smoke-test

# Performance benchmarks (parallel)
benchmark:
  stage: benchmark
  parallel:
    matrix:
      - BENCHMARK: [cpu, memory, io, network]
  script:
    - echo "Running ${BENCHMARK} benchmark"
    - ./benchmarks/run_${BENCHMARK}_benchmark.sh
  artifacts:
    paths:
      - benchmark-${BENCHMARK}.json
    expire_in: 1 week
  needs:
    - comprehensive-test
  only:
    - main
    - develop
```

## Sample Application Files

**File: `app/calculator.py`**
```python
"""Calculator for matrix testing."""

class Calculator:
    def add(self, a, b):
        return a + b

    def multiply(self, a, b):
        return a * b

    def divide(self, a, b):
        if b == 0:
            raise ValueError("Division by zero")
        return a / b
```

**File: `tests/test_calculator.py`**
```python
"""Tests for calculator."""
import pytest
from app.calculator import Calculator

@pytest.fixture
def calc():
    return Calculator()

def test_add(calc):
    assert calc.add(2, 3) == 5

def test_multiply(calc):
    assert calc.multiply(4, 5) == 20

def test_divide(calc):
    assert calc.divide(10, 2) == 5

def test_divide_by_zero(calc):
    with pytest.raises(ValueError):
        calc.divide(10, 0)
```

**File: `requirements.txt`**
```txt
pytest==7.4.0
pytest-cov==4.1.0
pytest-xdist==3.3.1
pytest-split==0.8.0
coverage==7.2.7
```

## Verification Steps

### Local Testing

1. **Test matrix locally with Docker:**
   ```bash
   # Test Python 3.9
   docker run --rm -v $(pwd):/app -w /app python:3.9 \
     sh -c "pip install pytest && pytest tests/"

   # Test Python 3.11
   docker run --rm -v $(pwd):/app -w /app python:3.11 \
     sh -c "pip install pytest && pytest tests/"
   ```

2. **Simulate parallel execution:**
   ```bash
   # Run tests with xdist
   pip install pytest pytest-xdist
   pytest tests/ -n 4
   ```

### GitLab CI Verification

1. **View parallel jobs:**
   - Go to CI/CD > Pipelines
   - Click on pipeline
   - See parallel jobs grouped together
   - Each job shows its index (e.g., 1/5, 2/5)

2. **Check execution time:**
   - Compare pipeline duration with/without parallelism
   - View individual job durations
   - Identify bottlenecks

3. **Verify artifacts:**
   - Download artifacts from parallel jobs
   - Ensure all expected files are present

## Troubleshooting

### Issue: Too many parallel jobs

**Problem:** Pipeline creates too many jobs, overwhelming runners.

**Solutions:**
1. Reduce matrix dimensions
2. Use `rules:` to filter combinations
3. Limit `parallel:` count
4. Combine similar configurations

### Issue: Uneven load distribution

**Problem:** Some parallel jobs finish much faster than others.

**Solutions:**
1. Use pytest-xdist with load balancing
2. Split tests by execution time
3. Use `--dist=loadscope` for better distribution
4. Profile slow tests

### Issue: Resource contention

**Problem:** Parallel jobs competing for resources.

**Solutions:**
1. Reduce parallel count
2. Use resource_group for exclusive access
3. Configure runner concurrency limits
4. Use different runner tags

### Issue: Flaky tests in parallel

**Problem:** Tests fail randomly when run in parallel.

**Solutions:**
1. Fix test isolation issues
2. Avoid shared state
3. Use test fixtures properly
4. Add retry mechanism

## Best Practices

### 1. Optimize Matrix Size
```yaml
# Good - targeted combinations
parallel:
  matrix:
    - VERSION: ["3.9", "3.11"]  # Min and latest
      OS: ["alpine"]

# Avoid - too many combinations
parallel:
  matrix:
    - VERSION: ["3.7", "3.8", "3.9", "3.10", "3.11"]
      OS: ["alpine", "slim", "bullseye"]  # 15 jobs!
```

### 2. Use Needs for DAG Pipelines
```yaml
test-fast:
  stage: test
  script: pytest tests/unit/

test-slow:
  stage: test
  needs: []  # Start immediately, don't wait
  script: pytest tests/integration/
```

### 3. Cache Dependencies
```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}-${PYTHON_VERSION}
  paths:
    - .venv/
```

### 4. Set Appropriate Timeouts
```yaml
parallel-job:
  parallel: 10
  timeout: 10 minutes  # Prevent hung jobs
```

### 5. Use Resource Groups
```yaml
deploy:
  resource_group: production
  script: deploy.sh
```

## Advanced Features

### Interruptible Jobs
```yaml
test:
  interruptible: true
  parallel: 5
  script: pytest tests/
```

### Job Dependencies with Artifacts
```yaml
test:
  parallel: 3
  artifacts:
    paths:
      - results-${CI_NODE_INDEX}.xml

collect:
  needs:
    - job: test
      artifacts: true
  script: merge-results.sh
```

### Variable Inheritance
```yaml
.base:
  variables:
    COMMON_VAR: value

job:
  extends: .base
  parallel:
    matrix:
      - SPECIFIC_VAR: [a, b, c]
```

## Additional Resources

- [GitLab CI Parallel Jobs](https://docs.gitlab.com/ee/ci/yaml/#parallel)
- [Matrix Builds](https://docs.gitlab.com/ee/ci/yaml/#parallelmatrix)
- [DAG Pipelines](https://docs.gitlab.com/ee/ci/directed_acyclic_graph/)
- [Pipeline Efficiency](https://docs.gitlab.com/ee/ci/pipelines/pipeline_efficiency.html)

## Next Steps

After completing this tutorial:
1. Optimize your pipeline with parallelism
2. Experiment with matrix builds
3. Implement DAG pipelines
4. Move on to Tutorial 04: Docker Integration

## Summary

You've learned:
- How to implement parallel job execution
- Creating matrix builds for multiple configurations
- Optimizing pipeline execution time
- Fan-out/fan-in patterns
- Dynamic parallel job generation
- Performance optimization techniques
- Best practices for parallel execution

This knowledge enables you to create efficient, fast-running CI pipelines.
