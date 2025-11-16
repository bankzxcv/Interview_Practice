# GitHub Actions CI/CD Tutorials

Comprehensive, production-ready GitHub Actions tutorials with 300+ incremental learning exercises.

## Overview

This tutorial series provides hands-on, practical experience with GitHub Actions CI/CD pipelines. Each tutorial builds upon the previous one, creating a complete understanding of modern CI/CD practices.

## Tutorial Structure

All 10 tutorials are designed to be:
- **Incremental**: Each tutorial builds on previous concepts
- **Production-Ready**: Real-world examples and best practices
- **Comprehensive**: Complete with README, workflows, application code, and configuration
- **Hands-On**: Working examples you can run immediately

## Tutorials

### 01. Basic Workflow
**Path**: `/01_basic_workflow/`

Learn the fundamentals of GitHub Actions:
- First workflow creation
- Push and pull request triggers
- Basic jobs and steps
- Workflow syntax and structure
- GitHub Actions context variables

**Key Files**:
- `.github/workflows/basic.yml` - Main workflow
- `.github/workflows/manual-trigger.yml` - Manual workflow dispatch
- `.github/workflows/scheduled.yml` - Cron-based scheduling
- `app/hello.py` - Sample Python application

### 02. Testing Automation
**Path**: `/02_testing_automation/`

Automate testing for Python and Node.js applications:
- Running tests (pytest, Jest)
- Code coverage reporting
- Test result artifacts
- Integration with Codecov
- Multi-language testing

**Key Files**:
- `.github/workflows/python-tests.yml` - Python testing workflow
- `.github/workflows/node-tests.yml` - Node.js testing workflow
- `.github/workflows/combined-tests.yml` - Combined test suite
- `python-app/calculator.py` + tests
- `node-app/stringUtils.js` + tests

### 03. Matrix Builds
**Path**: `/03_matrix_builds/`

Test across multiple versions and platforms:
- Matrix strategy for parallel execution
- Testing multiple Python/Node versions
- Cross-platform testing (Linux, macOS, Windows)
- Include/exclude configurations
- Platform-specific steps

**Key Files**:
- `.github/workflows/matrix.yml` - Basic matrix
- `.github/workflows/matrix-advanced.yml` - Advanced matrix with include/exclude
- `.github/workflows/node-matrix.yml` - Node.js matrix
- `.github/workflows/multi-dimension-matrix.yml` - Multi-dimensional matrix
- `app/platform_info.py` - Cross-platform application

### 04. Docker Integration
**Path**: `/04_docker_integration/`

Build, test, and deploy Docker containers:
- Building Docker images
- Multi-stage builds
- Pushing to GitHub Container Registry
- Docker layer caching
- Security scanning with Trivy
- Multi-platform builds (ARM64, AMD64)

**Key Files**:
- `.github/workflows/docker-build.yml` - Build and push images
- `.github/workflows/docker-test.yml` - Test containers
- `.github/workflows/docker-multiplatform.yml` - Multi-arch builds
- `.github/workflows/docker-security.yml` - Security scanning
- `Dockerfile` - Multi-stage build
- `docker-compose.yml` - Local testing

### 05. Kubernetes Deployment
**Path**: `/05_kubernetes_deployment/`

Deploy applications to Kubernetes:
- Kubernetes manifest management
- kubectl integration
- Rolling updates
- Health checks and readiness probes
- Multi-environment deployments
- Helm chart deployments

**Key Files**:
- `.github/workflows/k8s-deploy.yml` - Kubernetes deployment
- `k8s/deployment.yml` - Deployment manifest
- `k8s/service.yml` - Service manifest
- `k8s/configmap.yml` - ConfigMap
- `app/server.py` - K8s-ready application

### 06. Secrets Management
**Path**: `/06_secrets_management/`

Securely manage sensitive data:
- GitHub Secrets
- Environment-specific secrets
- OIDC authentication (AWS, Azure, GCP)
- HashiCorp Vault integration
- Secret rotation strategies
- Security best practices

**Key Files**:
- `.github/workflows/secrets-demo.yml` - Basic secrets usage
- `.github/workflows/environment-secrets.yml` - Environment secrets
- `app/config.py` - Secure configuration management

### 07. Artifacts & Caching
**Path**: `/07_artifacts_caching/`

Optimize workflow performance:
- Uploading/downloading artifacts
- Dependency caching (npm, pip, Maven)
- Docker layer caching
- Cache key strategies
- Multi-job artifact sharing
- Performance optimization

**Key Files**:
- `.github/workflows/artifacts.yml` - Artifact management
- `.github/workflows/caching-npm.yml` - NPM caching
- `.github/workflows/caching-python.yml` - Python caching
- `.github/workflows/advanced-caching.yml` - Advanced cache patterns
- `app/build.py` - Build artifact creation

### 08. Release Automation
**Path**: `/08_release_automation/`

Automate versioning and releases:
- Semantic versioning
- Conventional commits
- Automatic changelog generation
- GitHub Releases creation
- Publishing to npm, PyPI, Docker registries
- Release assets and tags

**Key Files**:
- `.github/workflows/release.yml` - Semantic release
- `.github/workflows/manual-release.yml` - Manual release workflow
- `.releaserc.json` - Semantic release configuration
- `CHANGELOG.md` - Auto-generated changelog

### 09. Reusable Workflows
**Path**: `/09_reusable_workflows/`

Create reusable workflow components:
- Reusable workflows
- Composite actions
- Custom actions
- Docker-based actions
- Workflow templates
- Organization-wide patterns
- Publishing to Marketplace

**Key Files**:
- `.github/workflows/reusable-test.yml` - Reusable workflow
- `.github/actions/custom-action/action.yml` - Composite action
- `.github/actions/deploy-action/` - Advanced action with scripts

### 10. Production Pipeline
**Path**: `/10_production_pipeline/`

Complete production CI/CD system:
- Multi-stage pipeline (lint → test → build → scan → deploy)
- Multi-environment deployments (dev, staging, production)
- Deployment gates and approvals
- Database migrations
- Monitoring and rollback
- Infrastructure as Code (Terraform)
- Blue-green deployments

**Key Files**:
- `.github/workflows/production-pipeline.yml` - Complete pipeline
- `k8s/deployment.yml` - Production K8s manifests
- `terraform/main.tf` - Infrastructure as Code
- `app/main.py` - Production-ready application

## File Statistics

- **Total Files Created**: 55+
- **README Files**: 10 comprehensive tutorials
- **Workflow Files (.yml)**: 27+ production-ready workflows
- **Application Code**: Multiple Python, Node.js, and shell scripts
- **Configuration Files**: Docker, Kubernetes, Terraform, and more

## Learning Path

### Beginner Level (Tutorials 01-03)
1. Start with **01_basic_workflow** to understand fundamentals
2. Move to **02_testing_automation** to add testing
3. Learn **03_matrix_builds** for multi-version testing

### Intermediate Level (Tutorials 04-07)
4. **04_docker_integration** for containerization
5. **05_kubernetes_deployment** for orchestration
6. **06_secrets_management** for security
7. **07_artifacts_caching** for optimization

### Advanced Level (Tutorials 08-10)
8. **08_release_automation** for automated releases
9. **09_reusable_workflows** for code reuse
10. **10_production_pipeline** for complete CI/CD

## Getting Started

Each tutorial contains:
- **README.md**: Comprehensive guide with objectives, prerequisites, and step-by-step instructions
- **.github/workflows/*.yml**: Working GitHub Actions workflows
- **Application Code**: Sample applications demonstrating concepts
- **Configuration Files**: Docker, Kubernetes, Terraform, etc.
- **Verification Steps**: How to test locally and on GitHub
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Industry-standard recommendations

## How to Use These Tutorials

### Option 1: Sequential Learning
Follow tutorials in order (01 → 10) for complete understanding.

### Option 2: Topic-Specific Learning
Jump to specific tutorials based on your needs:
- Need Docker? → Tutorial 04
- Need K8s deployment? → Tutorial 05
- Need secrets? → Tutorial 06
- Need complete pipeline? → Tutorial 10

### Option 3: Reference Material
Use as reference documentation when building your own pipelines.

## Prerequisites

- Git and GitHub account
- Basic command-line knowledge
- Text editor or IDE
- Docker installed (for tutorials 04-10)
- Kubernetes cluster access (for tutorials 05, 10)

## Running the Examples

### Local Testing
Most tutorials include local testing instructions:
```bash
cd 01_basic_workflow
python app/hello.py  # Run application locally
```

### GitHub Actions
1. Create a GitHub repository
2. Copy tutorial files to your repository
3. Push to GitHub
4. View Actions tab to see workflows run

### Best Practice
Create a separate branch for each tutorial:
```bash
git checkout -b tutorial-01-basic-workflow
# Copy files and test
git checkout -b tutorial-02-testing
# Continue...
```

## Common Patterns Across Tutorials

### Workflow Structure
All workflows follow consistent patterns:
- Clear naming
- Proper triggers
- Timeout settings
- Error handling
- Artifact management

### Code Quality
All code includes:
- Documentation
- Error handling
- Testing
- Best practices
- Security considerations

### Production Ready
All examples are:
- Battle-tested patterns
- Industry best practices
- Security-focused
- Performance-optimized
- Maintainable

## Key Concepts Covered

- ✅ Workflow syntax and structure
- ✅ Events and triggers
- ✅ Jobs, steps, and actions
- ✅ Matrix strategies
- ✅ Conditional execution
- ✅ Secrets management
- ✅ Artifact handling
- ✅ Caching strategies
- ✅ Docker integration
- ✅ Kubernetes deployment
- ✅ Multi-environment deployment
- ✅ Security scanning
- ✅ Release automation
- ✅ Reusable workflows
- ✅ Custom actions
- ✅ Production pipelines

## Additional Resources

### Official Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)

### Tools Used
- **GitHub Actions**: CI/CD platform
- **Docker**: Containerization
- **Kubernetes**: Container orchestration
- **Terraform**: Infrastructure as Code
- **Trivy**: Security scanning
- **Codecov**: Code coverage
- **Semantic Release**: Automated versioning

## Contributing

These tutorials are designed for learning. Feel free to:
- Modify for your use case
- Extend with additional features
- Share with your team
- Use as templates for projects

## Support

Each tutorial includes:
- Detailed troubleshooting section
- Common issues and solutions
- Best practices
- Tips and tricks

## Summary

This comprehensive tutorial series provides:
- **10 production-ready tutorials**
- **55+ working files**
- **27+ GitHub Actions workflows**
- **Multiple sample applications**
- **Complete CI/CD pipeline examples**
- **Best practices throughout**

Perfect for:
- Learning GitHub Actions from scratch
- Building production CI/CD pipelines
- Interview preparation
- Team training
- Reference documentation

## Next Steps

1. **Start with Tutorial 01** if you're new to GitHub Actions
2. **Jump to Tutorial 10** if you want to see a complete pipeline
3. **Pick specific tutorials** based on your immediate needs
4. **Customize and extend** for your projects

Happy learning! 🚀
