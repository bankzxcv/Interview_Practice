# Tutorial 09: Reusable Workflows and Composite Actions

## Objectives

By the end of this tutorial, you will:
- Create reusable workflows for organization-wide use
- Build custom composite actions
- Share workflows across repositories
- Implement workflow templates
- Use workflow inputs and outputs
- Create action marketplace-ready actions
- Implement best practices for action development
- Version and publish custom actions

## Prerequisites

- Completion of Tutorials 01-08
- Understanding of GitHub Actions syntax
- Knowledge of workflow composition

## Key Concepts

### Reusable Workflow
A workflow that can be called by other workflows, reducing duplication.

### Composite Action
A custom action combining multiple workflow steps into a single reusable unit.

### Workflow Templates
Starter workflows that appear in the Actions tab for repositories.

### Action Inputs/Outputs
Parameters and return values that make actions configurable and composable.

## Step-by-Step Instructions

### Step 1: Create a Reusable Workflow

**File: `.github/workflows/reusable-test.yml`**

```yaml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        description: 'Node.js version to use'
        required: false
        type: string
        default: '20'
      run-lint:
        description: 'Run linting'
        required: false
        type: boolean
        default: true
      working-directory:
        description: 'Working directory'
        required: false
        type: string
        default: '.'
    outputs:
      test-result:
        description: 'Test execution result'
        value: ${{ jobs.test.outputs.result }}

jobs:
  test:
    runs-on: ubuntu-latest
    outputs:
      result: ${{ steps.test.outputs.result }}

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'

    - name: Install dependencies
      working-directory: ${{ inputs.working-directory }}
      run: npm ci

    - name: Run linter
      if: inputs.run-lint
      working-directory: ${{ inputs.working-directory }}
      run: npm run lint || echo "No lint script"

    - name: Run tests
      id: test
      working-directory: ${{ inputs.working-directory }}
      run: |
        npm test
        echo "result=success" >> $GITHUB_OUTPUT
```

**File: `.github/workflows/use-reusable-test.yml`**

```yaml
name: Use Reusable Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-with-defaults:
    uses: ./.github/workflows/reusable-test.yml

  test-with-custom-settings:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '18'
      run-lint: false

  report-results:
    needs: [test-with-defaults, test-with-custom-settings]
    runs-on: ubuntu-latest
    steps:
    - name: Report test results
      run: |
        echo "Default test: ${{ needs.test-with-defaults.outputs.test-result }}"
        echo "Custom test: ${{ needs.test-with-custom-settings.outputs.test-result }}"
```

### Step 2: Create a Composite Action

**File: `.github/actions/custom-action/action.yml`**

```yaml
name: 'Setup and Test'
description: 'Sets up environment and runs tests'
author: 'Your Name'

inputs:
  language:
    description: 'Programming language (python, node)'
    required: true
  version:
    description: 'Language version'
    required: false
    default: 'latest'
  install-command:
    description: 'Command to install dependencies'
    required: false
    default: ''
  test-command:
    description: 'Command to run tests'
    required: true

outputs:
  test-status:
    description: 'Test execution status'
    value: ${{ steps.run-tests.outputs.status }}

runs:
  using: 'composite'
  steps:
    - name: Set up Python
      if: inputs.language == 'python'
      uses: actions/setup-python@v5
      with:
        python-version: ${{ inputs.version }}
        cache: 'pip'
      shell: bash

    - name: Set up Node.js
      if: inputs.language == 'node'
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.version }}
        cache: 'npm'
      shell: bash

    - name: Install dependencies
      if: inputs.install-command != ''
      run: ${{ inputs.install-command }}
      shell: bash

    - name: Run tests
      id: run-tests
      run: |
        ${{ inputs.test-command }}
        echo "status=success" >> $GITHUB_OUTPUT
      shell: bash

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: test-results-${{ inputs.language }}
        path: test-results/
      shell: bash
```

**File: `.github/workflows/use-composite-action.yml`**

```yaml
name: Use Composite Action

on:
  push:
    branches: [ main ]

jobs:
  test-python:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Setup and test Python
      uses: ./.github/actions/custom-action
      with:
        language: 'python'
        version: '3.11'
        install-command: 'pip install -r requirements.txt'
        test-command: 'pytest'

  test-node:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - name: Setup and test Node.js
      uses: ./.github/actions/custom-action
      with:
        language: 'node'
        version: '20'
        install-command: 'npm ci'
        test-command: 'npm test'
```

### Step 3: Advanced Composite Action with Scripts

**File: `.github/actions/deploy-action/action.yml`**

```yaml
name: 'Deploy Application'
description: 'Deploys application to specified environment'

inputs:
  environment:
    description: 'Target environment (dev, staging, prod)'
    required: true
  version:
    description: 'Version to deploy'
    required: true
  dry-run:
    description: 'Run in dry-run mode'
    required: false
    default: 'false'

outputs:
  deployment-url:
    description: 'URL of deployed application'
    value: ${{ steps.deploy.outputs.url }}
  deployment-status:
    description: 'Deployment status'
    value: ${{ steps.deploy.outputs.status }}

runs:
  using: 'composite'
  steps:
    - name: Validate inputs
      run: |
        if [[ ! "${{ inputs.environment }}" =~ ^(dev|staging|prod)$ ]]; then
          echo "Invalid environment: ${{ inputs.environment }}"
          exit 1
        fi
      shell: bash

    - name: Run deployment script
      id: deploy
      run: ${{ github.action_path }}/deploy.sh
      env:
        ENVIRONMENT: ${{ inputs.environment }}
        VERSION: ${{ inputs.version }}
        DRY_RUN: ${{ inputs.dry-run }}
      shell: bash

    - name: Post deployment verification
      run: |
        echo "Verifying deployment..."
        # Add verification logic
      shell: bash
```

**File: `.github/actions/deploy-action/deploy.sh`**

```bash
#!/bin/bash
set -e

echo "Deploying to ${ENVIRONMENT}"
echo "Version: ${VERSION}"
echo "Dry run: ${DRY_RUN}"

if [ "$DRY_RUN" == "true" ]; then
  echo "DRY RUN MODE - No actual deployment"
  echo "url=https://dry-run.example.com" >> $GITHUB_OUTPUT
  echo "status=dry-run" >> $GITHUB_OUTPUT
  exit 0
fi

# Actual deployment logic here
echo "Performing deployment..."

# Set outputs
echo "url=https://${ENVIRONMENT}.example.com" >> $GITHUB_OUTPUT
echo "status=deployed" >> $GITHUB_OUTPUT

echo "Deployment complete!"
```

### Step 4: Organization-Wide Reusable Workflows

**File: `.github/workflows/org-reusable-ci.yml`** (In a central .github repo)

```yaml
name: Organization CI Pipeline

on:
  workflow_call:
    inputs:
      language:
        required: true
        type: string
      run-security-scan:
        required: false
        type: boolean
        default: true
    secrets:
      CODECOV_TOKEN:
        required: false

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Run linting
      run: echo "Linting ${{ inputs.language }} code"

  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Run tests
      run: echo "Testing ${{ inputs.language }} code"
    - name: Upload coverage
      if: secrets.CODECOV_TOKEN
      run: echo "Uploading coverage"

  security-scan:
    if: inputs.run-security-scan
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Run security scan
      run: echo "Scanning for vulnerabilities"
```

**File: `.github/workflows/call-org-workflow.yml`** (In your repository)

```yaml
name: CI Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  ci:
    uses: your-org/.github/.github/workflows/org-reusable-ci.yml@main
    with:
      language: 'python'
      run-security-scan: true
    secrets:
      CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

### Step 5: Action with Docker

**File: `.github/actions/docker-action/action.yml`**

```yaml
name: 'Custom Docker Action'
description: 'Runs a custom Docker container'

inputs:
  input-file:
    description: 'Input file to process'
    required: true

outputs:
  result:
    description: 'Processing result'

runs:
  using: 'docker'
  image: 'Dockerfile'
  args:
    - ${{ inputs.input-file }}
```

**File: `.github/actions/docker-action/Dockerfile`**

```dockerfile
FROM python:3.11-slim

COPY entrypoint.py /entrypoint.py

RUN chmod +x /entrypoint.py

ENTRYPOINT ["/entrypoint.py"]
```

**File: `.github/actions/docker-action/entrypoint.py`**

```python
#!/usr/bin/env python3
"""Custom Docker action entrypoint."""

import sys
import os


def main():
    """Process input and generate output."""
    if len(sys.argv) < 2:
        print("Error: Input file required")
        sys.exit(1)

    input_file = sys.argv[1]
    print(f"Processing file: {input_file}")

    # Processing logic here

    # Set output
    with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
        f.write(f"result=processed_{input_file}\n")

    print("Processing complete!")


if __name__ == "__main__":
    main()
```

## Best Practices

### 1. Use Descriptive Names and Descriptions
```yaml
name: 'Deploy to Kubernetes'
description: 'Deploys application to K8s cluster with health checks'
```

### 2. Document Inputs and Outputs
```yaml
inputs:
  environment:
    description: 'Target environment (dev/staging/prod)'
    required: true
```

### 3. Version Your Actions
```yaml
# Use semantic versioning
uses: your-org/your-action@v1
uses: your-org/your-action@v1.2.3
```

### 4. Handle Errors Gracefully
```yaml
- name: Step with error handling
  run: |
    if ! command; then
      echo "::error::Command failed"
      exit 1
    fi
  shell: bash
```

### 5. Use Action Inputs for Configuration
```yaml
# Good - configurable
inputs:
  timeout:
    default: '300'

# Bad - hardcoded
run: sleep 300
```

### 6. Provide Default Values
```yaml
inputs:
  version:
    default: 'latest'
  retry-count:
    default: '3'
```

## Publishing Actions to Marketplace

1. **Create action.yml in repository root**
2. **Add branding:**
```yaml
branding:
  icon: 'check-circle'
  color: 'green'
```

3. **Create release with tag:**
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

4. **Publish to Marketplace:**
   - Go to repository releases
   - Create new release
   - Check "Publish this action to the GitHub Marketplace"

## Summary

You've learned:
- Creating reusable workflows
- Building composite actions
- Docker-based actions
- Organization-wide workflow patterns
- Action inputs and outputs
- Best practices for action development
- Publishing to GitHub Marketplace

## Next Steps

Proceed to Tutorial 10: Production Pipeline to see how all these concepts come together in a complete CI/CD system.
