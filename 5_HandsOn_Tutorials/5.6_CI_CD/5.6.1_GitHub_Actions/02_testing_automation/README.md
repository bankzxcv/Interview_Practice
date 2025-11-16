# Tutorial 02: Testing Automation with GitHub Actions

## Objectives

By the end of this tutorial, you will:
- Set up automated testing for Python and Node.js applications
- Generate and publish code coverage reports
- Create test result summaries in workflow runs
- Upload test reports as artifacts
- Configure test failure notifications
- Integrate with code coverage services (Codecov, Coveralls)
- Implement parallel testing strategies

## Prerequisites

- Completion of Tutorial 01: Basic Workflow
- Understanding of unit testing concepts
- Basic knowledge of Python (pytest) and Node.js (Jest)
- GitHub repository with Actions enabled

## What is Test Automation?

Test automation in CI/CD ensures that every code change is automatically tested, preventing bugs from reaching production. GitHub Actions can run your test suite on every push or pull request.

## Key Concepts

### Unit Testing
Testing individual components or functions in isolation.

### Integration Testing
Testing how different parts of the application work together.

### Code Coverage
Measurement of how much code is executed during testing (statement, branch, function coverage).

### Test Reports
Structured output of test results, often in JUnit XML or JSON format.

### Artifacts
Files produced by a workflow run that can be downloaded or used by other jobs.

## Step-by-Step Instructions

### Step 1: Python Application with Tests

Create a Python application with comprehensive testing:

**File: `python-app/calculator.py`**

```python
"""Calculator module with basic operations."""

class Calculator:
    """A simple calculator class."""

    def add(self, a, b):
        """Add two numbers."""
        return a + b

    def subtract(self, a, b):
        """Subtract b from a."""
        return a - b

    def multiply(self, a, b):
        """Multiply two numbers."""
        return a * b

    def divide(self, a, b):
        """Divide a by b."""
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b

    def power(self, base, exponent):
        """Raise base to the power of exponent."""
        return base ** exponent
```

**File: `python-app/test_calculator.py`**

```python
"""Tests for calculator module."""

import pytest
from calculator import Calculator


class TestCalculator:
    """Test cases for Calculator class."""

    @pytest.fixture
    def calc(self):
        """Fixture to create a Calculator instance."""
        return Calculator()

    def test_add(self, calc):
        """Test addition."""
        assert calc.add(2, 3) == 5
        assert calc.add(-1, 1) == 0
        assert calc.add(0, 0) == 0

    def test_subtract(self, calc):
        """Test subtraction."""
        assert calc.subtract(5, 3) == 2
        assert calc.subtract(0, 5) == -5
        assert calc.subtract(-1, -1) == 0

    def test_multiply(self, calc):
        """Test multiplication."""
        assert calc.multiply(3, 4) == 12
        assert calc.multiply(-2, 3) == -6
        assert calc.multiply(0, 100) == 0

    def test_divide(self, calc):
        """Test division."""
        assert calc.divide(10, 2) == 5
        assert calc.divide(7, 2) == 3.5
        assert calc.divide(-10, 2) == -5

    def test_divide_by_zero(self, calc):
        """Test division by zero raises error."""
        with pytest.raises(ValueError, match="Cannot divide by zero"):
            calc.divide(10, 0)

    def test_power(self, calc):
        """Test exponentiation."""
        assert calc.power(2, 3) == 8
        assert calc.power(5, 0) == 1
        assert calc.power(2, -1) == 0.5
```

**File: `python-app/requirements.txt`**

```
pytest>=7.4.0
pytest-cov>=4.1.0
pytest-html>=3.2.0
```

### Step 2: Node.js Application with Tests

Create a Node.js application with Jest tests:

**File: `node-app/package.json`**

```json
{
  "name": "github-actions-testing-demo",
  "version": "1.0.0",
  "description": "Testing automation demo for GitHub Actions",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  },
  "keywords": ["testing", "github-actions", "jest"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "jest": "^29.7.0"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "*.js",
      "!jest.config.js"
    ],
    "coverageReporters": ["text", "lcov", "html"],
    "testMatch": ["**/*.test.js"]
  }
}
```

**File: `node-app/stringUtils.js`**

```javascript
/**
 * String utility functions
 */

class StringUtils {
  /**
   * Capitalize the first letter of a string
   * @param {string} str - Input string
   * @returns {string} Capitalized string
   */
  capitalize(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Reverse a string
   * @param {string} str - Input string
   * @returns {string} Reversed string
   */
  reverse(str) {
    if (!str || typeof str !== 'string') {
      return '';
    }
    return str.split('').reverse().join('');
  }

  /**
   * Check if a string is a palindrome
   * @param {string} str - Input string
   * @returns {boolean} True if palindrome
   */
  isPalindrome(str) {
    if (!str || typeof str !== 'string') {
      return false;
    }
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
  }

  /**
   * Count words in a string
   * @param {string} str - Input string
   * @returns {number} Word count
   */
  wordCount(str) {
    if (!str || typeof str !== 'string') {
      return 0;
    }
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}

module.exports = StringUtils;
```

**File: `node-app/stringUtils.test.js`**

```javascript
const StringUtils = require('./stringUtils');

describe('StringUtils', () => {
  let utils;

  beforeEach(() => {
    utils = new StringUtils();
  });

  describe('capitalize', () => {
    test('should capitalize first letter', () => {
      expect(utils.capitalize('hello')).toBe('Hello');
    });

    test('should handle empty string', () => {
      expect(utils.capitalize('')).toBe('');
    });

    test('should handle non-string input', () => {
      expect(utils.capitalize(null)).toBe('');
      expect(utils.capitalize(undefined)).toBe('');
    });

    test('should not change already capitalized string', () => {
      expect(utils.capitalize('Hello')).toBe('Hello');
    });
  });

  describe('reverse', () => {
    test('should reverse string', () => {
      expect(utils.reverse('hello')).toBe('olleh');
    });

    test('should handle empty string', () => {
      expect(utils.reverse('')).toBe('');
    });

    test('should handle palindrome', () => {
      expect(utils.reverse('racecar')).toBe('racecar');
    });
  });

  describe('isPalindrome', () => {
    test('should identify palindrome', () => {
      expect(utils.isPalindrome('racecar')).toBe(true);
      expect(utils.isPalindrome('A man a plan a canal Panama')).toBe(true);
    });

    test('should identify non-palindrome', () => {
      expect(utils.isPalindrome('hello')).toBe(false);
    });

    test('should handle empty string', () => {
      expect(utils.isPalindrome('')).toBe(false);
    });
  });

  describe('wordCount', () => {
    test('should count words', () => {
      expect(utils.wordCount('hello world')).toBe(2);
      expect(utils.wordCount('one two three four')).toBe(4);
    });

    test('should handle extra spaces', () => {
      expect(utils.wordCount('  hello   world  ')).toBe(2);
    });

    test('should handle empty string', () => {
      expect(utils.wordCount('')).toBe(0);
    });
  });
});
```

### Step 3: Create Testing Workflows

**File: `.github/workflows/python-tests.yml`**

```yaml
name: Python Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'python-app/**'
      - '.github/workflows/python-tests.yml'
  pull_request:
    branches: [ main ]
    paths:
      - 'python-app/**'

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
        cache: 'pip'

    - name: Install dependencies
      working-directory: python-app
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt

    - name: Run tests with coverage
      working-directory: python-app
      run: |
        pytest --cov=. --cov-report=xml --cov-report=html --cov-report=term-missing \
               --junitxml=test-results.xml --html=test-report.html --self-contained-html

    - name: Generate coverage summary
      working-directory: python-app
      run: |
        echo "## Test Coverage Summary" >> $GITHUB_STEP_SUMMARY
        echo "\`\`\`" >> $GITHUB_STEP_SUMMARY
        pytest --cov=. --cov-report=term-missing | tail -n 20 >> $GITHUB_STEP_SUMMARY
        echo "\`\`\`" >> $GITHUB_STEP_SUMMARY

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: python-app/coverage.xml
        flags: python
        name: python-coverage

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: python-test-results
        path: |
          python-app/test-results.xml
          python-app/test-report.html
          python-app/htmlcov/

    - name: Publish test results
      if: always()
      uses: EnricoMi/publish-unit-test-result-action@v2
      with:
        files: python-app/test-results.xml
        check_name: Python Test Results

    - name: Comment coverage on PR
      if: github.event_name == 'pull_request'
      uses: py-cov-action/python-coverage-comment-action@v3
      with:
        GITHUB_TOKEN: ${{ github.token }}
```

**File: `.github/workflows/node-tests.yml`**

```yaml
name: Node.js Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'node-app/**'
      - '.github/workflows/node-tests.yml'
  pull_request:
    branches: [ main ]
    paths:
      - 'node-app/**'

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: node-app/package-lock.json

    - name: Install dependencies
      working-directory: node-app
      run: npm ci

    - name: Run tests with coverage
      working-directory: node-app
      run: npm run test:coverage

    - name: Generate coverage summary
      working-directory: node-app
      run: |
        echo "## Test Coverage Summary" >> $GITHUB_STEP_SUMMARY
        echo "\`\`\`" >> $GITHUB_STEP_SUMMARY
        npm run test:coverage 2>&1 | grep -A 10 "Coverage summary" >> $GITHUB_STEP_SUMMARY || true
        echo "\`\`\`" >> $GITHUB_STEP_SUMMARY

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: node-app/coverage/lcov.info
        flags: nodejs
        name: nodejs-coverage

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: node-test-results
        path: node-app/coverage/

    - name: Check coverage thresholds
      working-directory: node-app
      run: |
        npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

**File: `.github/workflows/combined-tests.yml`**

```yaml
name: Combined Test Suite

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  python-tests:
    name: Python Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
    - uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Install dependencies
      working-directory: python-app
      run: |
        pip install -r requirements.txt

    - name: Run tests
      working-directory: python-app
      run: pytest --cov=. --cov-report=xml

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: python-app/coverage.xml

  node-tests:
    name: Node.js Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
    - uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      working-directory: node-app
      run: npm ci

    - name: Run tests
      working-directory: node-app
      run: npm run test:coverage

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: node-app/coverage/lcov.info

  test-summary:
    name: Test Summary
    needs: [python-tests, node-tests]
    runs-on: ubuntu-latest
    if: always()

    steps:
    - name: Check test status
      run: |
        echo "Python Tests: ${{ needs.python-tests.result }}"
        echo "Node.js Tests: ${{ needs.node-tests.result }}"

        if [ "${{ needs.python-tests.result }}" != "success" ] || [ "${{ needs.node-tests.result }}" != "success" ]; then
          echo "Some tests failed!"
          exit 1
        fi

        echo "All tests passed successfully!"
```

## Verification Steps

### Local Testing

1. **Test Python application:**
   ```bash
   cd python-app
   pip install -r requirements.txt
   pytest -v
   pytest --cov=. --cov-report=html
   ```

2. **Test Node.js application:**
   ```bash
   cd node-app
   npm install
   npm test
   npm run test:coverage
   ```

3. **View coverage reports:**
   - Python: Open `python-app/htmlcov/index.html`
   - Node.js: Open `node-app/coverage/lcov-report/index.html`

### GitHub Actions Testing

1. **Push code and check workflows:**
   ```bash
   git add .
   git commit -m "Add testing automation"
   git push
   ```

2. **View workflow runs:**
   - Go to Actions tab
   - Check "Python Tests" and "Node.js Tests" workflows
   - Review test results and coverage reports

3. **Download artifacts:**
   - Click on a workflow run
   - Scroll to "Artifacts" section
   - Download test reports

## Troubleshooting

### Issue: Tests pass locally but fail in CI

**Solutions:**
1. Check Python/Node.js versions match
2. Verify all dependencies are in requirements.txt/package.json
3. Check for environment-specific code
4. Review test output logs in workflow

### Issue: Coverage reports not uploading

**Solutions:**
1. Verify Codecov token is set (for private repos)
2. Check coverage file paths are correct
3. Ensure coverage is generated before upload step
4. Review Codecov action logs

### Issue: npm ci fails

**Solutions:**
1. Ensure package-lock.json is committed
2. Use `npm install` instead of `npm ci` for development
3. Check Node.js version compatibility
4. Clear cache and retry

### Issue: Import errors in Python tests

**Solutions:**
1. Add `__init__.py` files if needed
2. Use correct working directory
3. Install package in editable mode: `pip install -e .`
4. Check PYTHONPATH configuration

## Best Practices

### 1. Use Coverage Thresholds
```yaml
- name: Check coverage
  run: pytest --cov=. --cov-fail-under=80
```

### 2. Fail Fast for Quick Feedback
```yaml
jobs:
  test:
    strategy:
      fail-fast: true
```

### 3. Cache Dependencies
```yaml
- uses: actions/setup-python@v5
  with:
    cache: 'pip'
```

### 4. Upload Artifacts on Failure
```yaml
- name: Upload logs
  if: failure()
  uses: actions/upload-artifact@v4
```

### 5. Use Test Result Actions
```yaml
- uses: EnricoMi/publish-unit-test-result-action@v2
```

### 6. Set Timeouts
```yaml
jobs:
  test:
    timeout-minutes: 10
```

### 7. Conditional Coverage Comments
```yaml
- name: Coverage comment
  if: github.event_name == 'pull_request'
```

## Advanced Features

### Parallel Testing
```yaml
jobs:
  test:
    strategy:
      matrix:
        test-group: [unit, integration, e2e]
    steps:
    - run: pytest tests/${{ matrix.test-group }}
```

### Test Splitting
```yaml
- name: Run test subset
  run: pytest --splits 3 --group ${{ matrix.group }}
  env:
    SPLIT_INDEX: ${{ matrix.group }}
```

### Flaky Test Detection
```yaml
- name: Run tests with retries
  uses: nick-fields/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: pytest
```

## Summary

You've learned to:
- Set up automated testing for Python and Node.js
- Generate and publish code coverage reports
- Upload test artifacts
- Integrate with coverage services
- Create comprehensive test workflows
- Implement best practices for test automation

## Next Steps

Proceed to Tutorial 03: Matrix Builds to learn about testing across multiple versions and platforms.
