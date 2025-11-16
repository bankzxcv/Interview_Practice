# Tutorial 08: Release Automation with GitHub Actions

## Objectives

By the end of this tutorial, you will:
- Automate version bumping with semantic versioning
- Generate changelogs automatically
- Create GitHub releases with assets
- Tag releases properly
- Publish packages to npm, PyPI, Docker registries
- Implement release notes generation
- Use conventional commits
- Create draft releases and pre-releases

## Prerequisites

- Completion of Tutorials 01-07
- Understanding of semantic versioning
- Knowledge of Git tags
- Basic understanding of package registries

## Key Concepts

### Semantic Versioning (SemVer)
Version format: MAJOR.MINOR.PATCH (e.g., 1.2.3)
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Conventional Commits
Standardized commit message format that enables automated versioning:
- `feat:` - New feature (MINOR bump)
- `fix:` - Bug fix (PATCH bump)
- `feat!:` or `BREAKING CHANGE:` - Breaking change (MAJOR bump)

### Changelog
Automatically generated document describing changes between versions.

## Step-by-Step Instructions

### Step 1: Semantic Release Setup

**File: `.releaserc.json`**

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ]
}
```

**File: `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    branches: [ main ]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write
      pull-requests: write
      packages: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0
        persist-credentials: false

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Run semantic release
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      run: npx semantic-release
```

### Step 2: Manual Release Workflow

**File: `.github/workflows/manual-release.yml`**

```yaml
name: Manual Release

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to release (e.g., 1.2.3)'
        required: true
      prerelease:
        description: 'Is this a pre-release?'
        required: false
        type: boolean
        default: false

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Validate version
      run: |
        if ! echo "${{ inputs.version }}" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$'; then
          echo "Invalid version format. Use semver (e.g., 1.2.3)"
          exit 1
        fi

    - name: Update version in files
      run: |
        # Update package.json
        npm version ${{ inputs.version }} --no-git-tag-version

        # Update Python version (if applicable)
        sed -i 's/version = .*/version = "${{ inputs.version }}"/' setup.py || true

    - name: Generate changelog
      id: changelog
      run: |
        # Get commits since last tag
        LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

        if [ -z "$LAST_TAG" ]; then
          COMMITS=$(git log --pretty=format:"- %s (%h)" --no-merges)
        else
          COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"- %s (%h)" --no-merges)
        fi

        # Save to file
        echo "## Changes in v${{ inputs.version }}" > RELEASE_NOTES.md
        echo "" >> RELEASE_NOTES.md
        echo "$COMMITS" >> RELEASE_NOTES.md

        # Output for GitHub release
        echo "changelog<<EOF" >> $GITHUB_OUTPUT
        cat RELEASE_NOTES.md >> $GITHUB_OUTPUT
        echo "EOF" >> $GITHUB_OUTPUT

    - name: Create Git tag
      run: |
        git config user.name "GitHub Actions"
        git config user.email "actions@github.com"
        git tag -a "v${{ inputs.version }}" -m "Release v${{ inputs.version }}"
        git push origin "v${{ inputs.version }}"

    - name: Build release assets
      run: |
        # Build your application
        npm run build || echo "No build script"

        # Create tarball
        tar -czf release-v${{ inputs.version }}.tar.gz dist/ || echo "No dist folder"

    - name: Create GitHub Release
      uses: softprops/action-gh-release@v1
      with:
        tag_name: v${{ inputs.version }}
        name: Release v${{ inputs.version }}
        body: ${{ steps.changelog.outputs.changelog }}
        prerelease: ${{ inputs.prerelease }}
        files: |
          release-v${{ inputs.version }}.tar.gz
          CHANGELOG.md
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Step 3: Changelog Generation

**File: `.github/workflows/changelog.yml`**

```yaml
name: Update Changelog

on:
  push:
    tags:
      - 'v*'

jobs:
  changelog:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0

    - name: Generate changelog
      uses: conventional-changelog/standard-version@v9
      with:
        infile: CHANGELOG.md
        message: 'chore(release): %s [skip ci]'

    - name: Update changelog
      uses: stefanzweifel/git-auto-commit-action@v5
      with:
        commit_message: 'docs: update CHANGELOG.md for ${{ github.ref_name }}'
        file_pattern: CHANGELOG.md
```

### Step 4: NPM Package Release

**File: `.github/workflows/npm-publish.yml`**

```yaml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        registry-url: 'https://registry.npmjs.org'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Build package
      run: npm run build

    - name: Publish to NPM
      run: npm publish --provenance
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Step 5: PyPI Package Release

**File: `.github/workflows/pypi-publish.yml`**

```yaml
name: Publish to PyPI

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'

    - name: Install build tools
      run: |
        python -m pip install --upgrade pip
        pip install build twine

    - name: Build package
      run: python -m build

    - name: Publish to PyPI
      uses: pypa/gh-action-pypi-publish@release/v1
```

### Step 6: Docker Image Release

**File: `.github/workflows/docker-release.yml`**

```yaml
name: Docker Release

on:
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract version from tag
      id: version
      run: echo "version=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: |
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.version.outputs.version }}
          ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
        labels: |
          org.opencontainers.image.version=${{ steps.version.outputs.version }}
          org.opencontainers.image.created=${{ github.event.release.published_at }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

## Application Files

**File: `package.json`**

```json
{
  "name": "release-automation-demo",
  "version": "1.0.0",
  "description": "GitHub Actions release automation demo",
  "main": "index.js",
  "scripts": {
    "test": "echo \"No tests yet\" && exit 0",
    "build": "echo \"Building...\" && mkdir -p dist && echo \"Build output\" > dist/index.js",
    "release": "semantic-release"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/your-repo.git"
  },
  "keywords": ["release", "automation"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "semantic-release": "^22.0.0",
    "@semantic-release/changelog": "^6.0.3",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/github": "^9.2.0",
    "@semantic-release/npm": "^11.0.0",
    "@semantic-release/commit-analyzer": "^11.0.0",
    "@semantic-release/release-notes-generator": "^12.0.0"
  }
}
```

**File: `CHANGELOG.md`** (Template)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Feature X
- Feature Y

### Changed
- Improved Z

### Fixed
- Bug A
- Bug B
```

## Conventional Commit Examples

```
feat: add user authentication
feat(api): add new endpoint for data export
fix: resolve memory leak in worker process
fix(ui): correct button alignment
docs: update installation instructions
chore: update dependencies
test: add integration tests for API
ci: update release workflow
refactor: simplify error handling
perf: optimize database queries

# Breaking change
feat!: redesign API response format

# Or with footer
feat: add new authentication method

BREAKING CHANGE: Old auth tokens are no longer supported
```

## Best Practices

### 1. Use Conventional Commits
```bash
# Good commits
git commit -m "feat: add dark mode"
git commit -m "fix: resolve login issue"
git commit -m "docs: update README"

# Bad commits
git commit -m "changes"
git commit -m "fix stuff"
```

### 2. Protect Release Branches
```yaml
# Require status checks
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

### 3. Automate Version Bumping
```yaml
# Use semantic-release or similar tools
- run: npx semantic-release
```

### 4. Include Release Assets
```yaml
files: |
  dist/*.tar.gz
  CHANGELOG.md
  LICENSE
```

### 5. Test Before Release
```yaml
jobs:
  test:
    # Run all tests

  release:
    needs: test
    # Only release if tests pass
```

## Verification Steps

1. **Make conventional commit:**
   ```bash
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **Verify release created:**
   - Check repository Releases page
   - Verify version number
   - Check release notes

3. **Test package published:**
   ```bash
   # NPM
   npm view your-package

   # PyPI
   pip install your-package==version

   # Docker
   docker pull ghcr.io/org/repo:version
   ```

## Troubleshooting

### Issue: Release not created

**Solutions:**
- Check conventional commit format
- Verify GITHUB_TOKEN permissions
- Review workflow logs

### Issue: Version not bumped correctly

**Solutions:**
- Verify commit type (feat/fix/BREAKING)
- Check .releaserc.json configuration
- Review commit-analyzer settings

## Summary

You've learned:
- Automating releases with semantic versioning
- Generating changelogs
- Publishing packages to registries
- Using conventional commits
- Creating GitHub releases
- Best practices for release automation

## Next Steps

Proceed to Tutorial 09: Reusable Workflows to learn about creating reusable actions and workflows.
