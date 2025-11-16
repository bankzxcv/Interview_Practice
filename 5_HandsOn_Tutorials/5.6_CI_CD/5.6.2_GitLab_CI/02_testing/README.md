# Tutorial 02: Testing with GitLab CI

## Objectives

By the end of this tutorial, you will:
- Implement automated testing in GitLab CI pipelines
- Configure unit tests, integration tests, and code coverage
- Generate and publish test reports
- Use test artifacts and coverage visualization
- Implement parallel test execution
- Understand test result parsing and reporting

## Prerequisites

- Completed Tutorial 01: Basic Pipeline
- Understanding of testing frameworks (pytest, JUnit, etc.)
- GitLab repository with CI/CD enabled
- Basic Python or Node.js knowledge

## What is CI Testing?

Automated testing in CI ensures that every code change is validated before merging. GitLab CI can run various types of tests and display results directly in merge requests.

## Key Concepts

### Test Stages
- **Unit Tests:** Test individual components in isolation
- **Integration Tests:** Test component interactions
- **End-to-End Tests:** Test complete user flows
- **Performance Tests:** Test application performance

### Test Reports
GitLab can parse and display test results in the UI:
- JUnit XML format
- Coverage reports (Cobertura, SimpleCov)
- Performance metrics
- Accessibility reports

### Code Coverage
Measure what percentage of code is executed during tests. GitLab can visualize coverage in merge requests.

## Step-by-Step Instructions

### Step 1: Python Testing Pipeline

Create `.gitlab-ci.yml` for Python testing:

```yaml
image: python:3.9

stages:
  - test
  - coverage
  - report

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

cache:
  paths:
    - .cache/pip
    - .venv/

before_script:
  - python --version
  - pip install virtualenv
  - virtualenv .venv
  - source .venv/bin/activate
  - pip install -r requirements.txt

# Unit tests
unit-test:
  stage: test
  script:
    - echo "Running unit tests..."
    - pytest tests/unit --junitxml=report.xml --cov=app --cov-report=xml --cov-report=term
    - echo "Unit tests completed"
  artifacts:
    when: always
    reports:
      junit: report.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    paths:
      - htmlcov/
    expire_in: 30 days
  coverage: '/(?i)total.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)$/'

# Integration tests
integration-test:
  stage: test
  script:
    - echo "Running integration tests..."
    - pytest tests/integration --junitxml=integration-report.xml
    - echo "Integration tests completed"
  artifacts:
    when: always
    reports:
      junit: integration-report.xml
    expire_in: 30 days

# Code quality check
code-quality:
  stage: test
  script:
    - echo "Running code quality checks..."
    - pip install flake8 pylint
    - flake8 app/ --max-line-length=100 --output-file=flake8-report.txt
    - pylint app/ --output-format=text | tee pylint-report.txt
  artifacts:
    paths:
      - flake8-report.txt
      - pylint-report.txt
    expire_in: 30 days
  allow_failure: true

# Coverage analysis
coverage-analysis:
  stage: coverage
  script:
    - echo "Analyzing code coverage..."
    - pytest tests/ --cov=app --cov-report=html --cov-report=term
    - coverage report
    - coverage html
  artifacts:
    paths:
      - htmlcov/
    expire_in: 30 days
  coverage: '/(?i)total.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)$/'

# Generate test summary
test-summary:
  stage: report
  script:
    - echo "Generating test summary..."
    - |
      cat << EOF > test-summary.txt
      Test Summary Report
      ===================
      Pipeline: $CI_PIPELINE_ID
      Commit: $CI_COMMIT_SHORT_SHA
      Branch: $CI_COMMIT_REF_NAME

      All tests executed successfully!
      EOF
    - cat test-summary.txt
  artifacts:
    paths:
      - test-summary.txt
    expire_in: 1 week
  when: on_success
```

### Step 2: Create Test Files

**File: `requirements.txt`**

```txt
pytest==7.4.0
pytest-cov==4.1.0
coverage==7.2.7
flake8==6.0.0
pylint==2.17.4
requests==2.31.0
```

**File: `app/__init__.py`**

```python
"""Application package."""
__version__ = "1.0.0"
```

**File: `app/calculator.py`**

```python
"""Calculator module for testing demonstration."""

class Calculator:
    """A simple calculator class."""

    def add(self, a, b):
        """Add two numbers."""
        return a + b

    def subtract(self, a, b):
        """Subtract two numbers."""
        return a - b

    def multiply(self, a, b):
        """Multiply two numbers."""
        return a * b

    def divide(self, a, b):
        """Divide two numbers."""
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b

    def power(self, a, b):
        """Raise a to the power of b."""
        return a ** b
```

**File: `app/string_utils.py`**

```python
"""String utility functions."""

def reverse_string(text):
    """Reverse a string."""
    return text[::-1]

def capitalize_words(text):
    """Capitalize each word in a string."""
    return text.title()

def count_vowels(text):
    """Count the number of vowels in a string."""
    vowels = "aeiouAEIOU"
    return sum(1 for char in text if char in vowels)

def is_palindrome(text):
    """Check if a string is a palindrome."""
    cleaned = ''.join(char.lower() for char in text if char.isalnum())
    return cleaned == cleaned[::-1]
```

**File: `tests/unit/test_calculator.py`**

```python
"""Unit tests for calculator module."""

import pytest
from app.calculator import Calculator

@pytest.fixture
def calc():
    """Create a calculator instance."""
    return Calculator()

def test_add(calc):
    """Test addition."""
    assert calc.add(2, 3) == 5
    assert calc.add(-1, 1) == 0
    assert calc.add(0, 0) == 0

def test_subtract(calc):
    """Test subtraction."""
    assert calc.subtract(5, 3) == 2
    assert calc.subtract(0, 5) == -5
    assert calc.subtract(10, 10) == 0

def test_multiply(calc):
    """Test multiplication."""
    assert calc.multiply(3, 4) == 12
    assert calc.multiply(-2, 5) == -10
    assert calc.multiply(0, 100) == 0

def test_divide(calc):
    """Test division."""
    assert calc.divide(10, 2) == 5
    assert calc.divide(7, 2) == 3.5
    assert calc.divide(-10, 2) == -5

def test_divide_by_zero(calc):
    """Test division by zero raises error."""
    with pytest.raises(ValueError, match="Cannot divide by zero"):
        calc.divide(10, 0)

def test_power(calc):
    """Test power operation."""
    assert calc.power(2, 3) == 8
    assert calc.power(5, 2) == 25
    assert calc.power(10, 0) == 1
```

**File: `tests/unit/test_string_utils.py`**

```python
"""Unit tests for string utilities."""

import pytest
from app.string_utils import (
    reverse_string,
    capitalize_words,
    count_vowels,
    is_palindrome
)

def test_reverse_string():
    """Test string reversal."""
    assert reverse_string("hello") == "olleh"
    assert reverse_string("") == ""
    assert reverse_string("a") == "a"
    assert reverse_string("racecar") == "racecar"

def test_capitalize_words():
    """Test word capitalization."""
    assert capitalize_words("hello world") == "Hello World"
    assert capitalize_words("python programming") == "Python Programming"
    assert capitalize_words("") == ""

def test_count_vowels():
    """Test vowel counting."""
    assert count_vowels("hello") == 2
    assert count_vowels("AEIOU") == 5
    assert count_vowels("xyz") == 0
    assert count_vowels("") == 0

def test_is_palindrome():
    """Test palindrome detection."""
    assert is_palindrome("racecar") == True
    assert is_palindrome("A man a plan a canal Panama") == True
    assert is_palindrome("hello") == False
    assert is_palindrome("") == True
```

**File: `tests/integration/test_integration.py`**

```python
"""Integration tests."""

import pytest
from app.calculator import Calculator
from app.string_utils import reverse_string, count_vowels

def test_calculator_chain():
    """Test chaining calculator operations."""
    calc = Calculator()
    result = calc.add(5, 3)
    result = calc.multiply(result, 2)
    result = calc.subtract(result, 6)
    assert result == 10

def test_string_processing_pipeline():
    """Test string processing pipeline."""
    text = "Hello World"
    reversed_text = reverse_string(text)
    vowel_count = count_vowels(reversed_text)
    assert vowel_count == 3

def test_combined_operations():
    """Test combined calculator and string operations."""
    calc = Calculator()
    number_result = calc.add(10, 20)

    text = "a" * number_result
    vowel_count = count_vowels(text)

    assert vowel_count == 30
```

### Step 3: Node.js Testing Pipeline

Create `.gitlab-ci.yml` for JavaScript/Node.js testing:

```yaml
image: node:18

stages:
  - install
  - lint
  - test
  - coverage

cache:
  paths:
    - node_modules/

install-dependencies:
  stage: install
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour

lint-code:
  stage: lint
  script:
    - npm run lint
  dependencies:
    - install-dependencies

unit-test:
  stage: test
  script:
    - npm run test:unit -- --ci --coverage
  artifacts:
    when: always
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths:
      - coverage/
    expire_in: 30 days
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  dependencies:
    - install-dependencies

e2e-test:
  stage: test
  script:
    - npm run test:e2e
  artifacts:
    when: always
    reports:
      junit: e2e-junit.xml
  dependencies:
    - install-dependencies
  allow_failure: true

coverage-check:
  stage: coverage
  script:
    - npm run test:coverage
    - |
      if [ -f coverage/coverage-summary.json ]; then
        echo "Coverage Summary:"
        cat coverage/coverage-summary.json
      fi
  dependencies:
    - unit-test
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
```

### Step 4: Parallel Test Execution

Create `.gitlab-ci.yml` with parallel tests:

```yaml
image: python:3.9

stages:
  - test
  - merge-reports

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

cache:
  paths:
    - .cache/pip

before_script:
  - pip install pytest pytest-cov pytest-xdist

# Run tests in parallel
parallel-tests:
  stage: test
  parallel: 4
  script:
    - |
      echo "Running parallel test batch ${CI_NODE_INDEX} of ${CI_NODE_TOTAL}"
      pytest tests/ -n auto \
        --junitxml=report-${CI_NODE_INDEX}.xml \
        --cov=app \
        --cov-report=xml:coverage-${CI_NODE_INDEX}.xml
  artifacts:
    when: always
    reports:
      junit: report-${CI_NODE_INDEX}.xml
    paths:
      - coverage-${CI_NODE_INDEX}.xml
    expire_in: 1 day

# Merge coverage reports
merge-coverage:
  stage: merge-reports
  script:
    - pip install coverage
    - |
      echo "Merging coverage reports..."
      coverage combine coverage-*.xml || true
      coverage report
      coverage html
  artifacts:
    paths:
      - htmlcov/
    expire_in: 30 days
  dependencies:
    - parallel-tests
```

### Step 5: Test Matrix Configuration

Create `.gitlab-ci.yml` with test matrix:

```yaml
image: python:${PYTHON_VERSION}

stages:
  - test

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

# Test on multiple Python versions
test:
  stage: test
  parallel:
    matrix:
      - PYTHON_VERSION: ["3.8", "3.9", "3.10", "3.11"]
  before_script:
    - python --version
    - pip install pytest pytest-cov
    - pip install -r requirements.txt
  script:
    - echo "Testing on Python ${PYTHON_VERSION}"
    - pytest tests/ --junitxml=report-py${PYTHON_VERSION}.xml
  artifacts:
    when: always
    reports:
      junit: report-py${PYTHON_VERSION}.xml
    expire_in: 1 week
```

### Step 6: Coverage Badge Configuration

Add to `.gitlab-ci.yml`:

```yaml
coverage-badge:
  stage: report
  image: python:3.9
  script:
    - pip install coverage coverage-badge
    - coverage report
    - coverage-badge -o coverage.svg
  artifacts:
    paths:
      - coverage.svg
    expire_in: 30 days
  only:
    - main
```

## Test Report Formats

### JUnit XML
```yaml
artifacts:
  reports:
    junit: report.xml
```

### Cobertura Coverage
```yaml
artifacts:
  reports:
    coverage_report:
      coverage_format: cobertura
      path: coverage.xml
```

### Coverage Regex
```yaml
coverage: '/(?i)total.*? (100(?:\.0+)?\%|[1-9]?\d(?:\.\d+)?\%)$/'
```

## Verification Steps

### Local Testing

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run unit tests:**
   ```bash
   pytest tests/unit -v
   ```

3. **Run with coverage:**
   ```bash
   pytest tests/ --cov=app --cov-report=html --cov-report=term
   ```

4. **View coverage report:**
   ```bash
   open htmlcov/index.html
   ```

5. **Check code quality:**
   ```bash
   flake8 app/
   pylint app/
   ```

### GitLab CI Testing

1. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add testing pipeline"
   git push origin main
   ```

2. **View test results:**
   - Go to CI/CD > Pipelines
   - Click on pipeline
   - View test report in the "Tests" tab
   - Check coverage in merge request

3. **View coverage:**
   - Go to merge request
   - Check "Coverage" badge
   - View coverage diff

## Troubleshooting

### Issue: Tests not found

**Problem:** pytest cannot find test files.

**Solutions:**
1. Ensure test files start with `test_`
2. Check `pytest.ini` configuration
3. Verify test directory structure
4. Use `pytest --collect-only` to see discovered tests

### Issue: Coverage not displaying

**Problem:** Coverage report not showing in GitLab.

**Solutions:**
1. Verify coverage format is Cobertura
2. Check coverage regex pattern
3. Ensure artifacts are uploaded correctly
4. Verify `coverage_report` path is correct

### Issue: JUnit report not parsed

**Problem:** Test results not showing in UI.

**Solutions:**
1. Verify JUnit XML format
2. Check file path in `junit:` artifact
3. Ensure report is generated before upload
4. Validate XML syntax

### Issue: Parallel tests failing

**Problem:** Tests fail when running in parallel.

**Solutions:**
1. Check for shared state between tests
2. Use test isolation techniques
3. Review database/file access conflicts
4. Consider using pytest-xdist properly

## Best Practices

### 1. Fail Fast
```yaml
script:
  - pytest tests/ --exitfirst  # Stop on first failure
```

### 2. Use Test Fixtures
```python
@pytest.fixture(scope="session")
def database():
    """Create test database."""
    db = create_database()
    yield db
    db.cleanup()
```

### 3. Separate Test Types
```yaml
unit-test:
  script:
    - pytest tests/unit

integration-test:
  script:
    - pytest tests/integration
```

### 4. Set Coverage Thresholds
```yaml
script:
  - pytest --cov=app --cov-fail-under=80
```

### 5. Tag Tests
```python
@pytest.mark.slow
def test_slow_operation():
    pass

@pytest.mark.smoke
def test_critical_feature():
    pass
```

### 6. Use Markers
```yaml
script:
  - pytest -m "not slow"  # Skip slow tests
```

## Advanced Testing Features

### Mutation Testing
```yaml
mutation-test:
  script:
    - pip install mutmut
    - mutmut run
    - mutmut results
  allow_failure: true
```

### Performance Testing
```yaml
performance-test:
  script:
    - pip install pytest-benchmark
    - pytest tests/performance --benchmark-only
  artifacts:
    paths:
      - benchmark-results/
```

### Security Testing
```yaml
security-test:
  script:
    - pip install safety bandit
    - safety check
    - bandit -r app/
  allow_failure: true
```

## Additional Resources

- [pytest Documentation](https://docs.pytest.org/)
- [GitLab Test Reports](https://docs.gitlab.com/ee/ci/testing/)
- [Coverage.py Documentation](https://coverage.readthedocs.io/)
- [GitLab Code Coverage](https://docs.gitlab.com/ee/ci/testing/code_coverage.html)

## Next Steps

After completing this tutorial:
1. Add more comprehensive test suites
2. Experiment with different test frameworks
3. Implement test coverage requirements
4. Move on to Tutorial 03: Matrix Builds

## Summary

You've learned:
- How to implement automated testing in GitLab CI
- Running unit, integration, and e2e tests
- Generating and publishing test reports
- Measuring and visualizing code coverage
- Parallel test execution
- Test matrix configurations
- Best practices for CI testing

This prepares you for more advanced testing and build strategies.
