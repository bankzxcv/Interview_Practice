# Tutorial 01: Basic GitHub Actions Workflow

## Objectives

By the end of this tutorial, you will:
- Understand the basic structure of a GitHub Actions workflow
- Learn about common workflow triggers (push, pull_request)
- Create your first workflow with jobs and steps
- Understand the GitHub Actions execution environment
- Learn to view workflow runs and logs in GitHub UI

## Prerequisites

- Git and GitHub account
- Basic understanding of YAML syntax
- A GitHub repository (public or private)
- Text editor or IDE

## What is GitHub Actions?

GitHub Actions is a CI/CD platform that allows you to automate your build, test, and deployment pipeline. Workflows are defined in YAML files stored in the `.github/workflows/` directory of your repository.

## Key Concepts

### Workflow
A configurable automated process made up of one or more jobs. Defined by a YAML file in `.github/workflows/`.

### Event
A specific activity that triggers a workflow run (e.g., push, pull_request, schedule).

### Job
A set of steps that execute on the same runner. Jobs run in parallel by default.

### Step
An individual task that can run commands or actions.

### Runner
A server that runs your workflows. GitHub provides Ubuntu Linux, Windows, and macOS runners.

## Step-by-Step Instructions

### Step 1: Create the Workflow File

Create a file at `.github/workflows/basic.yml`:

```yaml
name: Basic CI Workflow

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Print greeting
      run: echo "Hello from GitHub Actions!"

    - name: Display system information
      run: |
        echo "Runner OS: ${{ runner.os }}"
        echo "Repository: ${{ github.repository }}"
        echo "Branch: ${{ github.ref_name }}"
        echo "Event: ${{ github.event_name }}"

    - name: List files
      run: ls -la

    - name: Check runner details
      run: |
        echo "CPU Architecture: $(uname -m)"
        echo "CPU Cores: $(nproc)"
        echo "Memory: $(free -h | grep Mem | awk '{print $2}')"
        echo "Disk Space: $(df -h / | tail -1 | awk '{print $4}')"
```

### Step 2: Create a Simple Application

Create a simple Python application to demonstrate the workflow:

**File: `app/hello.py`**

```python
def greet(name):
    """Return a greeting message."""
    return f"Hello, {name}!"

def main():
    print(greet("GitHub Actions"))
    print("This is a basic workflow example.")

if __name__ == "__main__":
    main()
```

### Step 3: Create Additional Workflow Examples

**File: `.github/workflows/manual-trigger.yml`**

This demonstrates a manually triggered workflow:

```yaml
name: Manual Workflow

on:
  workflow_dispatch:
    inputs:
      name:
        description: 'Person to greet'
        required: true
        default: 'World'
      environment:
        description: 'Environment to run on'
        required: true
        type: choice
        options:
          - development
          - staging
          - production

jobs:
  greet:
    runs-on: ubuntu-latest

    steps:
    - name: Greet user
      run: echo "Hello ${{ inputs.name }}!"

    - name: Display environment
      run: echo "Running on ${{ inputs.environment }} environment"
```

**File: `.github/workflows/scheduled.yml`**

This demonstrates a scheduled workflow (cron):

```yaml
name: Scheduled Workflow

on:
  schedule:
    # Run every day at 9 AM UTC
    - cron: '0 9 * * *'
  workflow_dispatch:  # Allow manual trigger

jobs:
  scheduled-job:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run scheduled task
      run: |
        echo "Running scheduled task at $(date)"
        echo "This workflow runs daily at 9 AM UTC"
```

### Step 4: Understanding the Workflow Structure

Let's break down the basic workflow:

```yaml
name: Basic CI Workflow  # Workflow name (appears in GitHub UI)

on:  # Events that trigger the workflow
  push:
    branches: [ main, develop ]  # Trigger on push to these branches
  pull_request:
    branches: [ main ]  # Trigger on PR to main

jobs:  # Define jobs
  build:  # Job ID
    runs-on: ubuntu-latest  # Runner environment

    steps:  # Sequential steps
    - name: Step name  # Step description
      uses: actions/checkout@v4  # Use an action

    - name: Another step
      run: echo "Run a command"  # Execute shell command
```

## Workflow File Locations

All workflow files in this tutorial:

1. `.github/workflows/basic.yml` - Main basic workflow
2. `.github/workflows/manual-trigger.yml` - Manual trigger example
3. `.github/workflows/scheduled.yml` - Scheduled workflow example

## Verification Steps

### Local Verification

1. **Validate YAML syntax:**
   ```bash
   # Install yamllint
   pip install yamllint

   # Validate workflow files
   yamllint .github/workflows/*.yml
   ```

2. **Check file structure:**
   ```bash
   tree .github/
   ```

### GitHub Verification

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add basic GitHub Actions workflow"
   git push origin main
   ```

2. **View workflow run:**
   - Go to your repository on GitHub
   - Click on "Actions" tab
   - You should see "Basic CI Workflow" running
   - Click on the workflow run to view logs

3. **Test manual trigger:**
   - Go to "Actions" tab
   - Click "Manual Workflow" in the left sidebar
   - Click "Run workflow" button
   - Fill in the inputs
   - Click "Run workflow"
   - View the execution

4. **Check workflow status:**
   - Green checkmark: Success
   - Red X: Failure
   - Yellow circle: In progress

## Understanding Workflow Context

GitHub Actions provides various context variables:

```yaml
${{ github.repository }}      # Repository name (owner/repo)
${{ github.ref }}              # Branch or tag ref
${{ github.ref_name }}         # Branch or tag name
${{ github.sha }}              # Commit SHA
${{ github.actor }}            # User who triggered the workflow
${{ github.event_name }}       # Event that triggered the workflow
${{ runner.os }}               # Runner OS (Linux, Windows, macOS)
${{ runner.temp }}             # Path to temporary directory
${{ job.status }}              # Current job status
```

## Common Triggers

### Push Event
```yaml
on:
  push:
    branches:
      - main
      - 'release/**'
    paths:
      - 'src/**'
      - '!src/docs/**'
```

### Pull Request Event
```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches:
      - main
```

### Multiple Events
```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
```

## Troubleshooting

### Issue: Workflow not triggering

**Problem:** Pushed code but workflow doesn't run.

**Solutions:**
1. Check workflow file is in `.github/workflows/` directory
2. Verify YAML syntax is correct
3. Ensure trigger conditions match (branch name, event type)
4. Check if Actions are enabled in repository settings

### Issue: YAML syntax errors

**Problem:** Workflow fails immediately with syntax error.

**Solutions:**
1. Use a YAML validator or linter
2. Check indentation (use spaces, not tabs)
3. Ensure proper quoting of strings with special characters
4. Verify array and object syntax

### Issue: Permission denied errors

**Problem:** Workflow fails with permission errors.

**Solutions:**
1. Check repository settings > Actions > General > Workflow permissions
2. Ensure "Read and write permissions" is enabled if needed
3. Use `permissions:` key in workflow for specific permissions

### Issue: Workflow runs on wrong branch

**Problem:** Workflow triggers on unexpected branches.

**Solutions:**
1. Review `on.push.branches` filter
2. Use branch patterns carefully (`main`, `develop`, `release/*`)
3. Check for wildcard matches

## Best Practices

### 1. Naming Conventions
```yaml
name: Descriptive Workflow Name  # Use clear, descriptive names

jobs:
  build-and-test:  # Use kebab-case for job IDs
    steps:
    - name: Checkout source code  # Use action-oriented step names
```

### 2. Use Latest Action Versions
```yaml
- uses: actions/checkout@v4  # Use major version tag
# NOT: @main or @master (unstable)
```

### 3. Minimize Trigger Scope
```yaml
on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'package.json'
  # Don't trigger on documentation changes
```

### 4. Add Descriptive Names
```yaml
- name: Install dependencies
  run: npm install
# Better than: run: npm install (no name)
```

### 5. Use Multi-line Commands Properly
```yaml
- name: Multiple commands
  run: |
    echo "First command"
    echo "Second command"
    echo "Third command"
```

### 6. Timeout Configuration
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10  # Prevent hanging jobs
```

### 7. Fail Fast
```yaml
- name: Exit on error
  run: |
    set -e  # Exit immediately if command fails
    npm install
    npm test
```

## Advanced Tips

### Conditional Execution
```yaml
steps:
- name: Run only on main branch
  if: github.ref == 'refs/heads/main'
  run: echo "Main branch only!"

- name: Run only on PRs
  if: github.event_name == 'pull_request'
  run: echo "Pull request detected!"
```

### Environment Variables
```yaml
env:
  NODE_ENV: production

jobs:
  build:
    env:
      BUILD_TYPE: release
    steps:
    - name: Use environment variable
      run: echo "NODE_ENV is $NODE_ENV"
      env:
        CUSTOM_VAR: value
```

### Continue on Error
```yaml
- name: Optional step
  continue-on-error: true
  run: npm run optional-task
```

## Workflow Examples by Use Case

### Simple Linting
```yaml
name: Lint Code

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Run linter
      run: |
        pip install flake8
        flake8 . --count --show-source --statistics
```

### Multiple Jobs
```yaml
jobs:
  job1:
    runs-on: ubuntu-latest
    steps:
    - run: echo "Job 1"

  job2:
    runs-on: ubuntu-latest
    needs: job1  # Wait for job1 to complete
    steps:
    - run: echo "Job 2"
```

## Testing Your Workflow Locally

While you can't run GitHub Actions workflows exactly as they run on GitHub, you can:

1. **Validate YAML:**
   ```bash
   yamllint .github/workflows/basic.yml
   ```

2. **Use act (local runner):**
   ```bash
   # Install act
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

   # Run workflow locally
   act -l  # List available workflows
   act push  # Simulate push event
   ```

3. **Test commands locally:**
   ```bash
   # Test individual commands from steps
   echo "Hello from GitHub Actions!"
   ls -la
   ```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Events that trigger workflows](https://docs.github.com/en/actions/reference/events-that-trigger-workflows)

## Next Steps

After completing this tutorial:
1. Experiment with different triggers
2. Try adding more steps to your workflow
3. Explore the GitHub Actions Marketplace for useful actions
4. Move on to Tutorial 02: Testing Automation

## Summary

You've learned:
- How to create a basic GitHub Actions workflow
- Understanding workflow triggers (push, pull_request, manual, scheduled)
- Working with jobs and steps
- Using GitHub Actions context variables
- Viewing and debugging workflow runs
- Best practices for workflow configuration

This foundation prepares you for more advanced CI/CD patterns in subsequent tutorials.
