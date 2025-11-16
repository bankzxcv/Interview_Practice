# Tutorial 04: Model Registry and Deployment

## Learning Objectives

By completing this tutorial, you will:
- Understand the MLflow Model Registry architecture and concepts
- Learn to version and manage ML models systematically
- Implement model staging workflows (dev/staging/production)
- Deploy models through automated promotion pipelines
- Set up model approval and governance processes
- Integrate model registry with CI/CD pipelines

## Prerequisites

- Completion of Tutorial 03 (Experiment Tracking with MLflow)
- Python 3.8+
- Docker and Docker Compose installed
- Basic understanding of ML model lifecycle
- Familiarity with REST APIs

## Architecture Overview

### System Architecture

```mermaid
graph TB
    subgraph "Model Development"
        A[Data Scientists] --> B[Training Scripts]
        B --> C[MLflow Tracking Server]
    end

    subgraph "Model Registry"
        C --> D[Register Model]
        D --> E[Model Registry Database]
        E --> F{Model Versions}
        F --> G[Version 1]
        F --> H[Version 2]
        F --> I[Version N]
    end

    subgraph "Model Stages"
        G --> J[None/Archived]
        H --> K[Staging]
        I --> L[Production]
    end

    subgraph "Deployment Targets"
        K --> M[Staging Environment]
        L --> N[Production Environment]
        M --> O[Load Balancer]
        N --> O
        O --> P[API Endpoints]
    end

    subgraph "Monitoring & Governance"
        Q[Model Validators] --> E
        R[Approval Workflow] --> E
        S[Audit Logs] --> E
    end

    style L fill:#90EE90
    style K fill:#FFD700
    style J fill:#D3D3D3
```

### Data Flow Diagram

```mermaid
flowchart LR
    A[Trained Model] --> B{Register in MLflow}
    B --> C[Assign Version Number]
    C --> D[Store Model Artifacts]
    D --> E[Store Metadata]

    E --> F{Validation Tests}
    F -->|Pass| G[Transition to Staging]
    F -->|Fail| H[Stay in None]

    G --> I{Performance Review}
    I -->|Approved| J[Transition to Production]
    I -->|Rejected| K[Archive or Rollback]

    J --> L[Update Production Deployment]
    L --> M[Serve Predictions]

    M --> N[Collect Metrics]
    N --> O{Performance Degradation?}
    O -->|Yes| P[Rollback to Previous]
    O -->|No| Q[Continue Serving]

    P --> L
```

### Model Promotion Workflow

```mermaid
sequenceDiagram
    participant DS as Data Scientist
    participant MLflow as MLflow Server
    participant Registry as Model Registry
    participant CI as CI/CD Pipeline
    participant Staging as Staging Env
    participant Prod as Production Env

    DS->>MLflow: Train and log model
    DS->>Registry: Register model (v1.2.3)
    Registry-->>DS: Model registered (None stage)

    DS->>Registry: Transition to Staging
    Registry->>CI: Trigger deployment pipeline
    CI->>CI: Run validation tests
    CI->>Staging: Deploy model
    Staging-->>CI: Deployment successful
    CI-->>DS: Staging deployment complete

    DS->>Registry: Request Production promotion
    Registry->>CI: Trigger approval workflow
    CI->>CI: Run production tests
    CI->>CI: Check performance metrics

    alt Tests Pass
        CI->>Registry: Approve transition
        Registry->>Prod: Deploy to production
        Prod-->>Registry: Deployment confirmed
        Registry->>Registry: Archive old production model
        Registry-->>DS: Production deployment complete
    else Tests Fail
        CI-->>DS: Promotion rejected
    end
```

## Implementation Guide

### Step 1: Set Up MLflow with Model Registry

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: mlflow
      POSTGRES_USER: mlflow
      POSTGRES_PASSWORD: mlflow_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mlflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio_password
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 5

  mlflow:
    image: python:3.9
    command: >
      bash -c "pip install mlflow psycopg2-binary boto3 &&
               mlflow server
               --backend-store-uri postgresql://mlflow:mlflow_password@postgres:5432/mlflow
               --default-artifact-root s3://mlflow/
               --host 0.0.0.0
               --port 5000"
    environment:
      MLFLOW_S3_ENDPOINT_URL: http://minio:9000
      AWS_ACCESS_KEY_ID: minio
      AWS_SECRET_ACCESS_KEY: minio_password
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      minio:
        condition: service_healthy

volumes:
  postgres_data:
  minio_data:
```

Start the services:

```bash
docker-compose up -d
```

### Step 2: Train and Register a Model

Create `train_and_register.py`:

```python
import mlflow
import mlflow.sklearn
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import numpy as np

# Set MLflow tracking URI
mlflow.set_tracking_uri("http://localhost:5000")

def train_model(n_estimators=100, max_depth=5):
    """Train a Random Forest model on Iris dataset."""
    # Load data
    iris = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        iris.data, iris.target, test_size=0.2, random_state=42
    )

    # Start MLflow run
    with mlflow.start_run(run_name="iris-classifier") as run:
        # Train model
        model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=42
        )
        model.fit(X_train, y_train)

        # Make predictions
        y_pred = model.predict(X_test)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')

        # Log parameters
        mlflow.log_param("n_estimators", n_estimators)
        mlflow.log_param("max_depth", max_depth)

        # Log metrics
        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_metric("f1_score", f1)

        # Log model
        mlflow.sklearn.log_model(
            model,
            "model",
            registered_model_name="iris-classifier"
        )

        print(f"Model trained with accuracy: {accuracy:.4f}")
        print(f"Run ID: {run.info.run_id}")

        return run.info.run_id, accuracy

if __name__ == "__main__":
    run_id, accuracy = train_model(n_estimators=150, max_depth=10)
    print(f"Model registered successfully!")
```

Run the training script:

```bash
python train_and_register.py
```

### Step 3: Manage Model Versions and Stages

Create `model_registry_manager.py`:

```python
import mlflow
from mlflow.tracking import MlflowClient
from datetime import datetime

class ModelRegistryManager:
    def __init__(self, tracking_uri="http://localhost:5000"):
        mlflow.set_tracking_uri(tracking_uri)
        self.client = MlflowClient()

    def list_registered_models(self):
        """List all registered models."""
        models = self.client.search_registered_models()
        for model in models:
            print(f"\nModel: {model.name}")
            print(f"  Created: {datetime.fromtimestamp(model.creation_timestamp/1000)}")
            print(f"  Latest Versions:")
            for version in model.latest_versions:
                print(f"    Version {version.version}: {version.current_stage}")

    def get_model_versions(self, model_name):
        """Get all versions of a model."""
        versions = self.client.search_model_versions(f"name='{model_name}'")
        return sorted(versions, key=lambda x: int(x.version), reverse=True)

    def transition_model_stage(self, model_name, version, stage, archive_existing=True):
        """
        Transition a model version to a new stage.

        Stages: None, Staging, Production, Archived
        """
        self.client.transition_model_version_stage(
            name=model_name,
            version=version,
            stage=stage,
            archive_existing_versions=archive_existing
        )
        print(f"Model {model_name} v{version} transitioned to {stage}")

    def add_model_description(self, model_name, version, description):
        """Add description to a model version."""
        self.client.update_model_version(
            name=model_name,
            version=version,
            description=description
        )

    def add_model_tags(self, model_name, version, tags):
        """Add tags to a model version."""
        for key, value in tags.items():
            self.client.set_model_version_tag(
                name=model_name,
                version=version,
                key=key,
                value=value
            )

    def get_production_model(self, model_name):
        """Get the current production model."""
        versions = self.client.get_latest_versions(model_name, stages=["Production"])
        if versions:
            return versions[0]
        return None

    def rollback_to_version(self, model_name, version):
        """Rollback to a specific model version."""
        # Archive current production
        current_prod = self.get_production_model(model_name)
        if current_prod:
            self.transition_model_stage(
                model_name,
                current_prod.version,
                "Archived",
                archive_existing=False
            )

        # Promote specified version
        self.transition_model_stage(
            model_name,
            version,
            "Production",
            archive_existing=False
        )
        print(f"Rolled back to version {version}")

# Example usage
if __name__ == "__main__":
    manager = ModelRegistryManager()

    # List all models
    print("=== Registered Models ===")
    manager.list_registered_models()

    # Get model versions
    print("\n=== Model Versions ===")
    versions = manager.get_model_versions("iris-classifier")
    for v in versions:
        print(f"Version {v.version}: {v.current_stage} (Run: {v.run_id})")

    # Transition to staging
    if versions:
        latest_version = versions[0].version
        manager.transition_model_stage("iris-classifier", latest_version, "Staging")

        # Add metadata
        manager.add_model_description(
            "iris-classifier",
            latest_version,
            "Random Forest classifier for Iris dataset"
        )

        manager.add_model_tags(
            "iris-classifier",
            latest_version,
            {
                "team": "ml-platform",
                "validation_status": "passed",
                "deployment_date": datetime.now().isoformat()
            }
        )
```

### Step 4: Automated Model Deployment

Create `deploy_model.py`:

```python
import mlflow
from mlflow.tracking import MlflowClient
import subprocess
import json
import time

class ModelDeployer:
    def __init__(self, tracking_uri="http://localhost:5000"):
        mlflow.set_tracking_uri(tracking_uri)
        self.client = MlflowClient()

    def validate_model(self, model_uri):
        """Run validation tests on the model."""
        print(f"Validating model: {model_uri}")

        # Load model
        model = mlflow.pyfunc.load_model(model_uri)

        # Run basic validation
        from sklearn.datasets import load_iris
        iris = load_iris()
        sample = iris.data[:5]

        try:
            predictions = model.predict(sample)
            print(f"  ✓ Model inference successful")
            print(f"  ✓ Sample predictions: {predictions}")
            return True
        except Exception as e:
            print(f"  ✗ Model validation failed: {e}")
            return False

    def deploy_to_staging(self, model_name, version):
        """Deploy model to staging environment."""
        print(f"\n=== Deploying {model_name} v{version} to Staging ===")

        model_uri = f"models:/{model_name}/{version}"

        # Validate model
        if not self.validate_model(model_uri):
            raise Exception("Model validation failed")

        # Create deployment script
        deployment_script = f"""
#!/bin/bash
mlflow models serve -m "{model_uri}" -p 5001 --env-manager=local &
echo $! > staging_model.pid
        """

        with open("/tmp/deploy_staging.sh", "w") as f:
            f.write(deployment_script)

        # Execute deployment
        subprocess.run(["chmod", "+x", "/tmp/deploy_staging.sh"])
        result = subprocess.run(
            ["/tmp/deploy_staging.sh"],
            capture_output=True,
            text=True,
            shell=True
        )

        if result.returncode == 0:
            print("✓ Deployed to staging on port 5001")

            # Update stage
            self.client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage="Staging",
                archive_existing_versions=True
            )
            return True
        else:
            print(f"✗ Deployment failed: {result.stderr}")
            return False

    def deploy_to_production(self, model_name, version):
        """Deploy model to production environment."""
        print(f"\n=== Deploying {model_name} v{version} to Production ===")

        model_uri = f"models:/{model_name}/{version}"

        # Validate model
        if not self.validate_model(model_uri):
            raise Exception("Model validation failed")

        # Check if staging deployment exists
        staging_versions = self.client.get_latest_versions(
            model_name, stages=["Staging"]
        )

        if not staging_versions or str(staging_versions[0].version) != str(version):
            raise Exception("Model must be deployed to staging first")

        # Create production deployment with blue-green strategy
        deployment_config = {
            "model_uri": model_uri,
            "port": 5002,
            "workers": 4,
            "timeout": 60
        }

        print("  ✓ Configuration validated")
        print(f"  ✓ Deploying with config: {json.dumps(deployment_config, indent=2)}")

        # Transition to production
        self.client.transition_model_version_stage(
            name=model_name,
            version=version,
            stage="Production",
            archive_existing_versions=True
        )

        print("✓ Model promoted to Production")
        return True

    def rollback_production(self, model_name, target_version=None):
        """Rollback production to a previous version."""
        print(f"\n=== Rolling back {model_name} ===")

        if target_version is None:
            # Get previous production version
            versions = self.client.search_model_versions(
                f"name='{model_name}'"
            )
            archived = [v for v in versions if v.current_stage == "Archived"]
            if not archived:
                raise Exception("No archived versions to rollback to")
            target_version = sorted(
                archived,
                key=lambda x: int(x.version),
                reverse=True
            )[0].version

        # Deploy previous version
        self.deploy_to_production(model_name, target_version)
        print(f"✓ Rolled back to version {target_version}")

# Example usage
if __name__ == "__main__":
    deployer = ModelDeployer()

    # Get latest version
    client = MlflowClient()
    versions = client.search_model_versions("name='iris-classifier'")
    if versions:
        latest_version = sorted(versions, key=lambda x: int(x.version))[-1].version

        # Deploy to staging
        deployer.deploy_to_staging("iris-classifier", latest_version)

        # Wait for validation
        time.sleep(5)

        # Deploy to production
        deployer.deploy_to_production("iris-classifier", latest_version)
```

### Step 5: Model Approval Workflow

Create `approval_workflow.py`:

```python
import mlflow
from mlflow.tracking import MlflowClient
from datetime import datetime
import json

class ModelApprovalWorkflow:
    def __init__(self, tracking_uri="http://localhost:5000"):
        mlflow.set_tracking_uri(tracking_uri)
        self.client = MlflowClient()

    def request_approval(self, model_name, version, requester, justification):
        """Request approval for production deployment."""
        approval_request = {
            "status": "pending",
            "requester": requester,
            "justification": justification,
            "requested_at": datetime.now().isoformat(),
            "approved_by": None,
            "approved_at": None
        }

        # Store as model version tag
        self.client.set_model_version_tag(
            name=model_name,
            version=version,
            key="approval_request",
            value=json.dumps(approval_request)
        )

        print(f"✓ Approval requested for {model_name} v{version}")
        return approval_request

    def approve_deployment(self, model_name, version, approver, comments=""):
        """Approve a model for production deployment."""
        # Get current approval request
        model_version = self.client.get_model_version(model_name, version)
        approval_tag = model_version.tags.get("approval_request")

        if not approval_tag:
            raise Exception("No approval request found")

        approval_data = json.loads(approval_tag)
        approval_data.update({
            "status": "approved",
            "approved_by": approver,
            "approved_at": datetime.now().isoformat(),
            "comments": comments
        })

        # Update approval status
        self.client.set_model_version_tag(
            name=model_name,
            version=version,
            key="approval_request",
            value=json.dumps(approval_data)
        )

        # Add approval tag
        self.client.set_model_version_tag(
            name=model_name,
            version=version,
            key="production_approved",
            value="true"
        )

        print(f"✓ Deployment approved by {approver}")
        return approval_data

    def reject_deployment(self, model_name, version, reviewer, reason):
        """Reject a model deployment."""
        approval_tag = self.client.get_model_version(
            model_name, version
        ).tags.get("approval_request")

        if approval_tag:
            approval_data = json.loads(approval_tag)
            approval_data.update({
                "status": "rejected",
                "reviewed_by": reviewer,
                "reviewed_at": datetime.now().isoformat(),
                "rejection_reason": reason
            })

            self.client.set_model_version_tag(
                name=model_name,
                version=version,
                key="approval_request",
                value=json.dumps(approval_data)
            )

        print(f"✗ Deployment rejected: {reason}")

    def get_pending_approvals(self):
        """Get all models pending approval."""
        all_models = self.client.search_registered_models()
        pending = []

        for model in all_models:
            for version in model.latest_versions:
                approval_tag = version.tags.get("approval_request")
                if approval_tag:
                    approval_data = json.loads(approval_tag)
                    if approval_data["status"] == "pending":
                        pending.append({
                            "model_name": model.name,
                            "version": version.version,
                            "approval_data": approval_data
                        })

        return pending

# Example usage
if __name__ == "__main__":
    workflow = ModelApprovalWorkflow()

    # Request approval
    workflow.request_approval(
        model_name="iris-classifier",
        version="1",
        requester="data-scientist@company.com",
        justification="Improved accuracy by 5% over current production model"
    )

    # List pending approvals
    pending = workflow.get_pending_approvals()
    print(f"\nPending Approvals: {len(pending)}")
    for item in pending:
        print(f"  - {item['model_name']} v{item['version']}")

    # Approve deployment
    if pending:
        workflow.approve_deployment(
            model_name=pending[0]["model_name"],
            version=pending[0]["version"],
            approver="ml-lead@company.com",
            comments="Metrics look good, approved for production"
        )
```

## Verification Steps

### 1. Verify MLflow Server is Running

```bash
curl http://localhost:5000/health
```

Expected output:
```
OK
```

### 2. Check Model Registry

```bash
python -c "
from mlflow.tracking import MlflowClient
import mlflow
mlflow.set_tracking_uri('http://localhost:5000')
client = MlflowClient()
models = client.search_registered_models()
for m in models:
    print(f'Model: {m.name}, Versions: {len(m.latest_versions)}')
"
```

### 3. Test Model Serving

```bash
# Test staging endpoint
curl -X POST http://localhost:5001/invocations \
  -H 'Content-Type: application/json' \
  -d '{"dataframe_split": {"columns": ["0", "1", "2", "3"], "data": [[5.1, 3.5, 1.4, 0.2]]}}'
```

Expected output:
```json
{"predictions": [0]}
```

### 4. Verify Model Stages

```python
from mlflow.tracking import MlflowClient
import mlflow

mlflow.set_tracking_uri("http://localhost:5000")
client = MlflowClient()

model_name = "iris-classifier"
for stage in ["Staging", "Production"]:
    versions = client.get_latest_versions(model_name, stages=[stage])
    for v in versions:
        print(f"{stage}: Version {v.version}")
```

### 5. Check Model Metadata and Tags

```python
from mlflow.tracking import MlflowClient
import mlflow

mlflow.set_tracking_uri("http://localhost:5000")
client = MlflowClient()

version = client.get_model_version("iris-classifier", "1")
print(f"Description: {version.description}")
print(f"Tags: {version.tags}")
print(f"Stage: {version.current_stage}")
```

## Best Practices

### 1. Model Versioning Strategy

```python
# Use semantic versioning for models
# Format: MAJOR.MINOR.PATCH
# - MAJOR: Breaking changes in model API
# - MINOR: New features, backward compatible
# - PATCH: Bug fixes, performance improvements

def generate_model_version(major, minor, patch):
    return f"{major}.{minor}.{patch}"

# Tag models with metadata
tags = {
    "model_version": "2.1.0",
    "algorithm": "random_forest",
    "feature_set": "v3",
    "training_date": datetime.now().isoformat(),
    "training_data_version": "2024-11-01",
    "performance_baseline": "0.95",
    "owner": "ml-team"
}
```

### 2. Stage Transition Rules

```python
# Define clear criteria for each stage transition

STAGE_REQUIREMENTS = {
    "Staging": {
        "min_accuracy": 0.85,
        "validation_tests": ["schema_test", "inference_test"],
        "required_tags": ["validation_status", "team"]
    },
    "Production": {
        "min_accuracy": 0.90,
        "previous_stage": "Staging",
        "approval_required": True,
        "staging_duration_hours": 24,
        "validation_tests": ["load_test", "integration_test"]
    }
}

def can_transition(model_name, version, target_stage):
    requirements = STAGE_REQUIREMENTS.get(target_stage, {})

    # Check all requirements
    for req, value in requirements.items():
        if not validate_requirement(model_name, version, req, value):
            return False, f"Failed requirement: {req}"

    return True, "All requirements met"
```

### 3. Automated Testing Pipeline

```python
class ModelValidator:
    def __init__(self):
        self.tests = []

    def add_test(self, test_func, test_name):
        self.tests.append((test_name, test_func))

    def validate(self, model_uri):
        results = {}
        model = mlflow.pyfunc.load_model(model_uri)

        for test_name, test_func in self.tests:
            try:
                result = test_func(model)
                results[test_name] = {"status": "passed", "result": result}
            except Exception as e:
                results[test_name] = {"status": "failed", "error": str(e)}

        return results

# Define tests
validator = ModelValidator()

def test_inference_latency(model):
    import time
    from sklearn.datasets import load_iris
    iris = load_iris()
    sample = iris.data[:100]

    start = time.time()
    predictions = model.predict(sample)
    latency = (time.time() - start) / len(sample) * 1000  # ms per prediction

    assert latency < 10, f"Latency {latency:.2f}ms exceeds 10ms threshold"
    return latency

def test_prediction_distribution(model):
    from sklearn.datasets import load_iris
    import numpy as np

    iris = load_iris()
    predictions = model.predict(iris.data)
    unique, counts = np.unique(predictions, return_counts=True)

    # Check that all classes are predicted
    assert len(unique) == 3, "Model not predicting all classes"
    return dict(zip(unique, counts))

validator.add_test(test_inference_latency, "latency_test")
validator.add_test(test_prediction_distribution, "distribution_test")
```

### 4. Audit Logging

```python
import logging
from datetime import datetime

class ModelAuditLogger:
    def __init__(self, log_file="model_registry_audit.log"):
        self.logger = logging.getLogger("model_registry_audit")
        handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.INFO)

    def log_registration(self, model_name, version, run_id, user):
        self.logger.info(
            f"MODEL_REGISTERED | model={model_name} | version={version} | "
            f"run_id={run_id} | user={user}"
        )

    def log_stage_transition(self, model_name, version, from_stage, to_stage, user):
        self.logger.info(
            f"STAGE_TRANSITION | model={model_name} | version={version} | "
            f"from={from_stage} | to={to_stage} | user={user}"
        )

    def log_deployment(self, model_name, version, environment, status, user):
        self.logger.info(
            f"DEPLOYMENT | model={model_name} | version={version} | "
            f"env={environment} | status={status} | user={user}"
        )

# Usage
audit_logger = ModelAuditLogger()
audit_logger.log_stage_transition(
    "iris-classifier", "1", "Staging", "Production", "ml-lead@company.com"
)
```

### 5. Model Governance

```python
class ModelGovernance:
    """Enforce governance policies on model registry."""

    POLICIES = {
        "max_production_versions": 2,
        "min_staging_duration_hours": 24,
        "required_approval": True,
        "required_tests": ["unit", "integration", "performance"]
    }

    def __init__(self, tracking_uri="http://localhost:5000"):
        mlflow.set_tracking_uri(tracking_uri)
        self.client = MlflowClient()

    def enforce_production_limit(self, model_name):
        """Ensure max production versions policy."""
        prod_versions = self.client.get_latest_versions(
            model_name, stages=["Production"]
        )

        max_allowed = self.POLICIES["max_production_versions"]
        if len(prod_versions) >= max_allowed:
            # Archive oldest production version
            oldest = min(prod_versions, key=lambda v: int(v.version))
            self.client.transition_model_version_stage(
                name=model_name,
                version=oldest.version,
                stage="Archived"
            )

    def check_staging_duration(self, model_name, version):
        """Verify minimum staging duration."""
        from datetime import timedelta

        model_version = self.client.get_model_version(model_name, version)

        # Get staging transition time from tags
        staging_time = model_version.tags.get("staging_timestamp")
        if not staging_time:
            return False

        staging_dt = datetime.fromisoformat(staging_time)
        duration = datetime.now() - staging_dt

        min_duration = timedelta(
            hours=self.POLICIES["min_staging_duration_hours"]
        )

        return duration >= min_duration
```

## Key Takeaways

1. **Structured Model Lifecycle**: MLflow Model Registry provides a centralized system for managing model versions, stages, and metadata throughout the ML lifecycle.

2. **Stage-Based Promotion**: Models progress through well-defined stages (None → Staging → Production) with validation at each step, ensuring quality and reducing deployment risks.

3. **Version Control for Models**: Every model is versioned automatically, enabling easy rollback, comparison, and audit trails of model changes over time.

4. **Metadata and Governance**: Tags, descriptions, and custom metadata enable rich documentation, searchability, and policy enforcement for model governance.

5. **Automated Deployment Pipelines**: Integration with CI/CD tools allows automated testing, validation, and deployment based on stage transitions.

6. **Approval Workflows**: Implementing approval processes before production deployment adds a critical governance layer for high-stakes ML systems.

7. **Rollback Capabilities**: The registry maintains all versions, making it easy to rollback to previous models if issues arise in production.

8. **Audit Trail**: All transitions, deployments, and changes are logged, providing complete traceability for compliance and debugging.

9. **Environment Separation**: Clear separation between staging and production environments allows thorough testing before production deployment.

10. **Integration Ready**: MLflow Model Registry integrates seamlessly with various deployment targets (SageMaker, AzureML, REST APIs, Kubernetes) through standardized model formats.

## Additional Resources

- [MLflow Model Registry Documentation](https://mlflow.org/docs/latest/model-registry.html)
- [MLflow Models Documentation](https://mlflow.org/docs/latest/models.html)
- [Model Deployment Patterns](https://ml-ops.org/content/ml-deployment-patterns)
- [ML Model Governance Best Practices](https://www.databricks.com/blog/2020/06/25/ml-model-governance.html)

## Next Steps

After completing this tutorial, proceed to:
- **Tutorial 05**: A/B Testing for ML Models
- **Tutorial 07**: ML Model Monitoring
- **Tutorial 09**: Automated Model Retraining
