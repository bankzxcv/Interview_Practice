# Tutorial 09: Automated Model Retraining

## Learning Objectives

By completing this tutorial, you will:
- Implement automated model retraining pipelines with Apache Airflow
- Set up performance-based retraining triggers
- Create drift-based retraining workflows
- Implement model comparison and validation gates
- Schedule and orchestrate retraining jobs
- Integrate retraining with MLflow and model registry

## Prerequisites

- Completion of Tutorials 04, 07, and 08
- Python 3.8+
- Docker and Docker Compose
- Apache Airflow knowledge
- Understanding of MLOps lifecycle

## Architecture Overview

### Automated Retraining System

```mermaid
graph TB
    subgraph "Triggers"
        A[Schedule Trigger<br/>Weekly/Monthly]
        B[Drift Detection Trigger]
        C[Performance Degradation Trigger]
        D[Manual Trigger]
    end

    subgraph "Airflow Orchestration"
        E[Retraining DAG]
        F[Data Validation Task]
        G[Feature Engineering Task]
        H[Model Training Task]
        I[Model Evaluation Task]
        J[Model Comparison Task]
    end

    subgraph "Decision Gates"
        K{New Model Better?}
        L{Meets SLA?}
        M{Approval Required?}
    end

    subgraph "Deployment"
        N[Register Model]
        O[Stage to Staging]
        P[Run A/B Test]
        Q[Deploy to Production]
    end

    A --> E
    B --> E
    C --> E
    D --> E

    E --> F
    F --> G
    G --> H
    H --> I
    I --> J

    J --> K
    K -->|Yes| L
    K -->|No| R[Archive & Alert]

    L -->|Yes| M
    L -->|No| R

    M -->|Auto| N
    M -->|Manual| S[Request Approval]

    N --> O
    O --> P
    P --> Q

    style K fill:#FFD700
    style Q fill:#90EE90
```

### Retraining Pipeline Flow

```mermaid
flowchart LR
    A[Monitor Trigger] --> B{Condition Met?}
    B -->|Yes| C[Fetch New Data]
    B -->|No| A

    C --> D[Validate Data Quality]
    D --> E{Data Valid?}

    E -->|No| F[Alert & Stop]
    E -->|Yes| G[Prepare Features]

    G --> H[Train New Model]
    H --> I[Evaluate Model]

    I --> J[Compare with Baseline]
    J --> K{Improvement?}

    K -->|Yes| L[Register Model]
    K -->|No| M[Log Results & Stop]

    L --> N[Promote to Staging]
    N --> O[Run Tests]
    O --> P{Tests Pass?}

    P -->|Yes| Q[Deploy to Production]
    P -->|No| R[Rollback]

    Q --> S[Update Baseline]
    S --> A
```

### Orchestration Workflow

```mermaid
sequenceDiagram
    participant Monitor as Performance Monitor
    participant Airflow as Airflow Scheduler
    participant DAG as Retraining DAG
    participant Data as Data Pipeline
    participant Train as Training Job
    participant MLflow as MLflow Registry
    participant Deploy as Deployment Service

    Monitor->>Airflow: Trigger retraining (drift detected)
    Airflow->>DAG: Start DAG execution

    DAG->>Data: Fetch training data
    Data-->>DAG: Dataset ready

    DAG->>DAG: Validate data quality

    alt Data quality issues
        DAG->>Airflow: Fail with alert
    else Data OK
        DAG->>Train: Start training job
        Train->>Train: Train model
        Train->>MLflow: Log metrics & model
        Train-->>DAG: Training complete

        DAG->>MLflow: Get baseline model
        DAG->>DAG: Compare performance

        alt New model better
            DAG->>MLflow: Register new version
            DAG->>Deploy: Deploy to staging
            Deploy-->>DAG: Staging deployment OK

            DAG->>Deploy: Run validation tests
            Deploy-->>DAG: Tests passed

            DAG->>Deploy: Deploy to production
            Deploy-->>DAG: Production deployment OK

            DAG->>Airflow: Success
        else New model worse
            DAG->>MLflow: Log experiment
            DAG->>Airflow: Skip deployment
        end
    end
```

## Implementation Guide

### Step 1: Set Up Apache Airflow

Create `docker-compose.yml`:

```yaml
version: '3.8'

x-airflow-common:
  &airflow-common
  image: apache/airflow:2.7.0
  environment:
    &airflow-common-env
    AIRFLOW__CORE__EXECUTOR: LocalExecutor
    AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
    AIRFLOW__CORE__FERNET_KEY: ''
    AIRFLOW__CORE__DAGS_ARE_PAUSED_AT_CREATION: 'true'
    AIRFLOW__CORE__LOAD_EXAMPLES: 'false'
    AIRFLOW__API__AUTH_BACKENDS: 'airflow.api.auth.backend.basic_auth'
    MLFLOW_TRACKING_URI: http://mlflow:5000
  volumes:
    - ./dags:/opt/airflow/dags
    - ./logs:/opt/airflow/logs
    - ./plugins:/opt/airflow/plugins
    - ./data:/opt/airflow/data
  user: "${AIRFLOW_UID:-50000}:0"
  depends_on:
    &airflow-common-depends-on
    postgres:
      condition: service_healthy

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    volumes:
      - postgres-db-volume:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "airflow"]
      interval: 5s
      retries: 5
    ports:
      - "5432:5432"

  airflow-webserver:
    <<: *airflow-common
    command: webserver
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "--fail", "http://localhost:8080/health"]
      interval: 10s
      timeout: 10s
      retries: 5
    restart: always
    depends_on:
      <<: *airflow-common-depends-on
      airflow-init:
        condition: service_completed_successfully

  airflow-scheduler:
    <<: *airflow-common
    command: scheduler
    healthcheck:
      test: ["CMD-SHELL", 'airflow jobs check --job-type SchedulerJob --hostname "$${HOSTNAME}"']
      interval: 10s
      timeout: 10s
      retries: 5
    restart: always
    depends_on:
      <<: *airflow-common-depends-on
      airflow-init:
        condition: service_completed_successfully

  airflow-init:
    <<: *airflow-common
    entrypoint: /bin/bash
    command:
      - -c
      - |
        mkdir -p /sources/logs /sources/dags /sources/plugins
        chown -R "${AIRFLOW_UID}:0" /sources/{logs,dags,plugins}
        exec /entrypoint airflow version
    environment:
      <<: *airflow-common-env
      _AIRFLOW_DB_UPGRADE: 'true'
      _AIRFLOW_WWW_USER_CREATE: 'true'
      _AIRFLOW_WWW_USER_USERNAME: airflow
      _AIRFLOW_WWW_USER_PASSWORD: airflow

  mlflow:
    image: python:3.9
    command: >
      bash -c "pip install mlflow psycopg2-binary boto3 &&
               mlflow server
               --backend-store-uri postgresql://airflow:airflow@postgres:5432/airflow
               --default-artifact-root /mlflow/artifacts
               --host 0.0.0.0
               --port 5000"
    ports:
      - "5000:5000"
    volumes:
      - mlflow-artifacts:/mlflow/artifacts
    depends_on:
      - postgres

volumes:
  postgres-db-volume:
  mlflow-artifacts:
```

### Step 2: Create Retraining DAG

Create `dags/model_retraining_dag.py`:

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.sensors.external_task import ExternalTaskSensor
import mlflow
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import json

# Default arguments
default_args = {
    'owner': 'ml-platform',
    'depends_on_past': False,
    'email': ['ml-team@company.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

# Initialize MLflow
MLFLOW_TRACKING_URI = "http://mlflow:5000"
mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

def fetch_training_data(**context):
    """Fetch new training data."""
    print("Fetching training data...")

    # In production: query from data warehouse/lake
    # For demo: generate synthetic data
    from sklearn.datasets import make_classification

    X, y = make_classification(
        n_samples=10000,
        n_features=20,
        n_informative=15,
        n_redundant=5,
        random_state=42
    )

    df = pd.DataFrame(X, columns=[f'feature_{i}' for i in range(20)])
    df['target'] = y

    # Save to shared location
    df.to_csv('/opt/airflow/data/training_data.csv', index=False)

    print(f"✓ Fetched {len(df)} samples")

    # Push metadata to XCom
    context['task_instance'].xcom_push(
        key='data_info',
        value={'num_samples': len(df), 'num_features': X.shape[1]}
    )

def validate_data(**context):
    """Validate data quality."""
    print("Validating data quality...")

    df = pd.read_csv('/opt/airflow/data/training_data.csv')

    # Data quality checks
    checks = {
        'no_missing_values': df.isnull().sum().sum() == 0,
        'correct_shape': df.shape[1] == 21,  # 20 features + 1 target
        'target_distribution': df['target'].value_counts().min() > 100,
        'feature_ranges': (df.drop('target', axis=1).min() > -10).all() and
                         (df.drop('target', axis=1).max() < 10).all()
    }

    if not all(checks.values()):
        failed_checks = [k for k, v in checks.items() if not v]
        raise ValueError(f"Data quality checks failed: {failed_checks}")

    print("✓ Data validation passed")
    return True

def train_model(**context):
    """Train new model."""
    print("Training new model...")

    # Load data
    df = pd.read_csv('/opt/airflow/data/training_data.csv')
    X = df.drop('target', axis=1)
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Start MLflow run
    with mlflow.start_run(run_name=f"retraining_{datetime.now().strftime('%Y%m%d_%H%M')}") as run:
        # Train model
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        model.fit(X_train, y_train)

        # Evaluate
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')

        # Log parameters and metrics
        mlflow.log_params({
            'n_estimators': 100,
            'max_depth': 10,
            'training_samples': len(X_train)
        })

        mlflow.log_metrics({
            'accuracy': accuracy,
            'f1_score': f1
        })

        # Log model
        mlflow.sklearn.log_model(
            model,
            "model",
            registered_model_name="auto_retrained_model"
        )

        print(f"✓ Model trained - Accuracy: {accuracy:.4f}, F1: {f1:.4f}")

        # Push metrics to XCom
        context['task_instance'].xcom_push(
            key='model_metrics',
            value={'accuracy': accuracy, 'f1_score': f1, 'run_id': run.info.run_id}
        )

def compare_with_baseline(**context):
    """Compare new model with production baseline."""
    print("Comparing with baseline model...")

    # Get new model metrics
    new_metrics = context['task_instance'].xcom_pull(
        task_ids='train_model',
        key='model_metrics'
    )

    # Get baseline (production) model metrics
    client = mlflow.tracking.MlflowClient()

    try:
        prod_versions = client.get_latest_versions(
            "auto_retrained_model",
            stages=["Production"]
        )

        if prod_versions:
            baseline_run = client.get_run(prod_versions[0].run_id)
            baseline_accuracy = baseline_run.data.metrics.get('accuracy', 0)
        else:
            baseline_accuracy = 0.0  # No baseline exists

    except Exception as e:
        print(f"No baseline model found: {e}")
        baseline_accuracy = 0.0

    # Compare
    improvement = new_metrics['accuracy'] - baseline_accuracy
    improvement_pct = (improvement / baseline_accuracy * 100) if baseline_accuracy > 0 else 100

    print(f"Baseline accuracy: {baseline_accuracy:.4f}")
    print(f"New model accuracy: {new_metrics['accuracy']:.4f}")
    print(f"Improvement: {improvement_pct:.2f}%")

    # Decision criteria
    MIN_IMPROVEMENT = 0.01  # 1% improvement required

    if improvement >= MIN_IMPROVEMENT or baseline_accuracy == 0:
        decision = 'promote'
        print("✓ New model is better - promoting")
    else:
        decision = 'reject'
        print("✗ New model not better enough - rejecting")

    # Push decision to XCom
    context['task_instance'].xcom_push(
        key='deployment_decision',
        value={
            'decision': decision,
            'baseline_accuracy': baseline_accuracy,
            'new_accuracy': new_metrics['accuracy'],
            'improvement': improvement
        }
    )

    return decision

def promote_model(**context):
    """Promote model to production."""
    decision_data = context['task_instance'].xcom_pull(
        task_ids='compare_with_baseline',
        key='deployment_decision'
    )

    if decision_data['decision'] != 'promote':
        print("Model promotion skipped - not better than baseline")
        return

    model_metrics = context['task_instance'].xcom_pull(
        task_ids='train_model',
        key='model_metrics'
    )

    print("Promoting model to production...")

    client = mlflow.tracking.MlflowClient()

    # Get latest version
    versions = client.search_model_versions("name='auto_retrained_model'")
    latest_version = sorted(versions, key=lambda x: int(x.version))[-1]

    # Transition to production
    client.transition_model_version_stage(
        name="auto_retrained_model",
        version=latest_version.version,
        stage="Production",
        archive_existing_versions=True
    )

    # Add deployment metadata
    client.set_model_version_tag(
        name="auto_retrained_model",
        version=latest_version.version,
        key="deployed_at",
        value=datetime.now().isoformat()
    )

    client.set_model_version_tag(
        name="auto_retrained_model",
        version=latest_version.version,
        key="deployment_type",
        value="automated_retraining"
    )

    print(f"✓ Model version {latest_version.version} promoted to Production")

def send_notification(**context):
    """Send retraining completion notification."""
    decision_data = context['task_instance'].xcom_pull(
        task_ids='compare_with_baseline',
        key='deployment_decision'
    )

    message = f"""
    Automated Model Retraining Complete

    Decision: {decision_data['decision'].upper()}
    Baseline Accuracy: {decision_data['baseline_accuracy']:.4f}
    New Model Accuracy: {decision_data['new_accuracy']:.4f}
    Improvement: {decision_data['improvement']:.4f}

    Timestamp: {datetime.now().isoformat()}
    """

    print(message)

    # In production: send to Slack, email, etc.
    # requests.post(SLACK_WEBHOOK, json={'text': message})

# Create DAG
dag = DAG(
    'automated_model_retraining',
    default_args=default_args,
    description='Automated model retraining pipeline',
    schedule_interval='@weekly',  # Run weekly
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['ml', 'retraining', 'production'],
)

# Define tasks
fetch_data_task = PythonOperator(
    task_id='fetch_training_data',
    python_callable=fetch_training_data,
    dag=dag,
)

validate_data_task = PythonOperator(
    task_id='validate_data',
    python_callable=validate_data,
    dag=dag,
)

train_model_task = PythonOperator(
    task_id='train_model',
    python_callable=train_model,
    dag=dag,
)

compare_task = PythonOperator(
    task_id='compare_with_baseline',
    python_callable=compare_with_baseline,
    dag=dag,
)

promote_task = PythonOperator(
    task_id='promote_model',
    python_callable=promote_model,
    dag=dag,
)

notify_task = PythonOperator(
    task_id='send_notification',
    python_callable=send_notification,
    trigger_rule='all_done',  # Run even if upstream tasks fail
    dag=dag,
)

# Set task dependencies
fetch_data_task >> validate_data_task >> train_model_task >> compare_task >> promote_task >> notify_task
```

### Step 3: Drift-Triggered Retraining

Create `dags/drift_triggered_retraining.py`:

```python
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.sensors.filesystem import FileSensor
from datetime import datetime, timedelta

default_args = {
    'owner': 'ml-platform',
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

def check_drift_threshold(**context):
    """Check if drift exceeds threshold."""
    # In production: query drift detection system
    # For demo: simulate checking

    import json
    import random

    # Simulate drift score
    drift_score = random.uniform(0, 1)
    threshold = 0.5

    print(f"Drift score: {drift_score:.3f}, Threshold: {threshold}")

    if drift_score > threshold:
        print("⚠️  Drift threshold exceeded - triggering retraining")
        return 'trigger_retraining'
    else:
        print("✓ Drift within acceptable range")
        return 'skip_retraining'

def trigger_retraining(**context):
    """Trigger the main retraining DAG."""
    from airflow.api.common.experimental.trigger_dag import trigger_dag

    trigger_dag(
        dag_id='automated_model_retraining',
        run_id=f'drift_triggered_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
        conf={'trigger_type': 'drift_detection'}
    )

    print("✓ Retraining DAG triggered")

dag = DAG(
    'drift_monitoring_trigger',
    default_args=default_args,
    description='Monitor drift and trigger retraining',
    schedule_interval='@daily',
    start_date=datetime(2024, 1, 1),
    catchup=False,
)

check_drift = BranchPythonOperator(
    task_id='check_drift_threshold',
    python_callable=check_drift_threshold,
    dag=dag,
)

trigger_task = PythonOperator(
    task_id='trigger_retraining',
    python_callable=trigger_retraining,
    dag=dag,
)

skip_task = PythonOperator(
    task_id='skip_retraining',
    python_callable=lambda: print("Skipping retraining"),
    dag=dag,
)

check_drift >> [trigger_task, skip_task]
```

## Verification Steps

### 1. Start Airflow

```bash
docker-compose up -d
```

### 2. Access Airflow UI

Navigate to http://localhost:8080 (airflow/airflow)

### 3. Trigger DAG Manually

In the Airflow UI:
1. Enable the `automated_model_retraining` DAG
2. Click "Trigger DAG"
3. Monitor execution in Graph view

### 4. Check MLflow

Navigate to http://localhost:5000 to see:
- Training runs
- Registered models
- Model versions
- Metrics comparison

### 5. Verify Model Promotion

```python
import mlflow

mlflow.set_tracking_uri("http://localhost:5000")
client = mlflow.tracking.MlflowClient()

# Check production models
prod_models = client.get_latest_versions(
    "auto_retrained_model",
    stages=["Production"]
)

for model in prod_models:
    print(f"Production Model Version: {model.version}")
    print(f"Run ID: {model.run_id}")

    # Get metrics
    run = client.get_run(model.run_id)
    print(f"Accuracy: {run.data.metrics['accuracy']:.4f}")
```

## Best Practices

### 1. Implement Circuit Breakers

```python
MAX_CONSECUTIVE_FAILURES = 3
COOLDOWN_PERIOD_HOURS = 24

def check_circuit_breaker(**context):
    """Prevent repeated retraining failures."""
    # Check failure history
    # If too many recent failures, stop
    pass
```

### 2. Gradual Rollout

```python
def gradual_rollout(**context):
    """Deploy new model gradually."""
    stages = [
        {'stage': 'canary', 'traffic': 0.05, 'duration_hours': 4},
        {'stage': 'partial', 'traffic': 0.25, 'duration_hours': 12},
        {'stage': 'full', 'traffic': 1.0, 'duration_hours': 0},
    ]
    # Implement progressive deployment
```

### 3. Rollback Mechanism

```python
def auto_rollback_on_failure(**context):
    """Automatically rollback if new model underperforms."""
    # Monitor production metrics
    # If degradation detected, rollback to previous version
    pass
```

## Key Takeaways

1. **Automated Pipelines**: Use Airflow to orchestrate complex retraining workflows with proper dependency management.

2. **Multiple Triggers**: Support schedule-based, drift-based, and performance-based retraining triggers.

3. **Validation Gates**: Implement quality checks and comparison logic before deploying retrained models.

4. **Safe Deployment**: Use gradual rollout and automated rollback for production safety.

5. **Monitoring Integration**: Connect retraining to drift detection and performance monitoring systems.

6. **Version Control**: Track all model versions and their performance metrics in MLflow.

7. **Notification System**: Alert teams about retraining results and deployment decisions.

8. **Data Quality**: Validate data before training to prevent garbage-in-garbage-out.

9. **Resource Management**: Schedule resource-intensive retraining jobs appropriately.

10. **Audit Trail**: Maintain complete logs of retraining decisions and outcomes.

## Additional Resources

- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [MLflow Model Registry](https://mlflow.org/docs/latest/model-registry.html)
- [Continuous Training Best Practices](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)

## Next Steps

- **Tutorial 18**: Continuous Training Pipeline
- **Tutorial 22**: End-to-End MLOps Platform
