# Tutorial 22: End-to-End MLOps Platform

## Learning Objectives

- Integrate all MLOps components into a unified platform
- Build complete CI/CD pipelines for ML
- Implement end-to-end model lifecycle management
- Set up production-grade monitoring and observability
- Create automated workflows from training to deployment

## Prerequisites

- Completion of all previous tutorials
- Docker and Kubernetes knowledge
- Understanding of DevOps practices
- Cloud platform familiarity (AWS/GCP/Azure)

## Architecture Overview

### Complete MLOps Platform Architecture

```mermaid
graph TB
    subgraph "Data Layer"
        A[Data Sources] --> B[Data Lake S3/GCS]
        B --> C[Feature Store<br/>Feast]
        B --> D[Data Versioning<br/>DVC]
    end

    subgraph "Development"
        E[Data Scientists] --> F[Jupyter Notebooks]
        F --> G[Experiment Tracking<br/>MLflow]
        G --> H[Model Registry]
    end

    subgraph "CI/CD Pipeline"
        I[Git Push] --> J[GitHub Actions]
        J --> K[Run Tests]
        K --> L[Build Model]
        L --> M[Deploy to Staging]
        M --> N[A/B Test]
        N --> O[Deploy to Prod]
    end

    subgraph "Training Pipeline"
        P[Airflow/Kubeflow] --> Q[Data Validation]
        Q --> R[Training Job]
        R --> S[Model Evaluation]
        S --> T{Quality Gate}
        T -->|Pass| H
    end

    subgraph "Serving"
        H --> U[Model Serving<br/>FastAPI/TFServing]
        C --> U
        U --> V[Load Balancer]
        V --> W[Production Traffic]
    end

    subgraph "Monitoring & Observability"
        U --> X[Prometheus]
        U --> Y[Evidently<br/>Drift Detection]
        X --> Z[Grafana]
        Y --> Z
        Z --> AA[Alerts]
    end

    subgraph "Feedback Loop"
        W --> AB[Logging]
        AB --> B
        AA --> P
        Y --> P
    end

    style H fill:#FFD700
    style U fill:#90EE90
    style Z fill:#87CEEB
```

### End-to-End Workflow

```mermaid
flowchart TB
    A[Developer Commits Code] --> B[CI Pipeline Triggered]
    B --> C[Run Unit Tests]
    C --> D[Run Integration Tests]
    D --> E{Tests Pass?}

    E -->|No| F[Notify Developer]
    E -->|Yes| G[Build Docker Image]

    G --> H[Push to Registry]
    H --> I[Deploy to Staging]

    I --> J[Run Smoke Tests]
    J --> K{Healthy?}

    K -->|No| F
    K -->|Yes| L[Run A/B Test]

    L --> M[Monitor Metrics]
    M --> N{Better Performance?}

    N -->|No| O[Keep Old Model]
    N -->|Yes| P[Gradual Rollout]

    P --> Q[10% Traffic]
    Q --> R[Monitor]
    R --> S{Issues?}

    S -->|Yes| T[Rollback]
    S -->|No| U[50% Traffic]

    U --> V[Monitor]
    V --> W{Issues?}

    W -->|Yes| T
    W -->|No| X[100% Traffic]

    X --> Y[Production Model]

    Y --> Z[Continuous Monitoring]
    Z --> AA{Drift Detected?}

    AA -->|Yes| AB[Trigger Retraining]
    AB --> B
```

## Implementation

### Step 1: Complete Platform Setup

Create `docker-compose-complete.yml`:

```yaml
version: '3.8'

services:
  # Data Version Control
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio_password
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  # Database for MLflow and Airflow
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: mlops
      POSTGRES_USER: mlops
      POSTGRES_PASSWORD: mlops_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Experiment Tracking
  mlflow:
    image: python:3.9
    command: >
      bash -c "pip install mlflow psycopg2-binary boto3 &&
               mlflow server
               --backend-store-uri postgresql://mlops:mlops_pass@postgres:5432/mlops
               --default-artifact-root s3://mlflow/
               --host 0.0.0.0"
    environment:
      MLFLOW_S3_ENDPOINT_URL: http://minio:9000
      AWS_ACCESS_KEY_ID: minio
      AWS_SECRET_ACCESS_KEY: minio_password
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - minio

  # Feature Store
  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana:/etc/grafana/provisioning
    depends_on:
      - prometheus

  # Model Serving
  model-server:
    build:
      context: ./model_server
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      MLFLOW_TRACKING_URI: http://mlflow:5000
      REDIS_URL: redis://redis:6379
      PROMETHEUS_MULTIPROC_DIR: /tmp/prometheus
    depends_on:
      - mlflow
      - redis

  # Workflow Orchestration
  airflow-webserver:
    image: apache/airflow:2.7.0
    command: webserver
    ports:
      - "8080:8080"
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://mlops:mlops_pass@postgres/mlops
      MLFLOW_TRACKING_URI: http://mlflow:5000
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
    depends_on:
      - postgres

  airflow-scheduler:
    image: apache/airflow:2.7.0
    command: scheduler
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://mlops:mlops_pass@postgres/mlops
      MLFLOW_TRACKING_URI: http://mlflow:5000
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
    depends_on:
      - postgres

volumes:
  minio_data:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

### Step 2: GitHub Actions CI/CD Pipeline

Create `.github/workflows/ml-pipeline.yml`:

```yaml
name: ML Model CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run unit tests
        run: |
          pytest tests/unit --cov=src --cov-report=xml

      - name: Run integration tests
        run: |
          pytest tests/integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  train:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Train model
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
        run: |
          python scripts/train_model.py

      - name: Evaluate model
        run: |
          python scripts/evaluate_model.py

      - name: Register model
        if: success()
        run: |
          python scripts/register_model.py

  deploy-staging:
    needs: train
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: |
          docker build -t model-server:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push model-server:${{ github.sha }}

      - name: Deploy to staging
        run: |
          kubectl set image deployment/model-server \
            model-server=model-server:${{ github.sha }} \
            --namespace=staging

      - name: Run smoke tests
        run: |
          python scripts/smoke_tests.py --env staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          kubectl set image deployment/model-server \
            model-server=model-server:${{ github.sha }} \
            --namespace=production

      - name: Monitor deployment
        run: |
          python scripts/monitor_deployment.py
```

### Step 3: Complete Model Server with All Integrations

Create `model_server/app.py`:

```python
from fastapi import FastAPI, HTTPException
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import mlflow
from feast import FeatureStore
import redis
import time
import logging
from typing import Dict, List

app = FastAPI(title="Complete MLOps Model Server")

# Initialize components
mlflow.set_tracking_uri("http://mlflow:5000")
feature_store = FeatureStore(repo_path="./feature_repo")
cache = redis.from_url("redis://redis:6379", decode_responses=True)

# Prometheus metrics
predictions_total = Counter('predictions_total', 'Total predictions',
                           ['model', 'version'])
prediction_latency = Histogram('prediction_latency_seconds',
                              'Prediction latency')
model_confidence = Gauge('model_confidence', 'Model confidence')
cache_hits = Counter('cache_hits_total', 'Cache hits')

# Load production model
model = mlflow.pyfunc.load_model("models:/production-model/Production")
logger = logging.getLogger(__name__)

@app.post("/predict")
async def predict(entity_id: str, features: Dict):
    """Complete prediction endpoint with all integrations."""
    start_time = time.time()

    try:
        # Check cache
        cache_key = f"prediction:{entity_id}"
        cached_result = cache.get(cache_key)

        if cached_result:
            cache_hits.inc()
            logger.info(f"Cache hit for {entity_id}")
            return eval(cached_result)

        # Get features from feature store
        feature_vector = feature_store.get_online_features(
            features=[
                "user_features:age",
                "user_features:total_purchases",
            ],
            entity_rows=[{"user_id": entity_id}]
        ).to_dict()

        # Make prediction
        prediction = model.predict(feature_vector)
        confidence = prediction[0] if len(prediction) > 0 else 0.0

        # Update metrics
        predictions_total.labels(
            model='production-model',
            version='v1.0'
        ).inc()

        latency = time.time() - start_time
        prediction_latency.observe(latency)
        model_confidence.set(confidence)

        # Cache result
        result = {
            'prediction': int(prediction[0]),
            'confidence': float(confidence),
            'latency_ms': latency * 1000
        }

        cache.setex(cache_key, 3600, str(result))

        return result

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return generate_latest()

@app.get("/health")
async def health():
    """Health check."""
    return {
        "status": "healthy",
        "model": "production-model",
        "version": "v1.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Step 4: Complete Monitoring Dashboard

Create `config/grafana/dashboards/complete-platform.json`:

```json
{
  "dashboard": {
    "title": "Complete MLOps Platform",
    "panels": [
      {
        "title": "Prediction Rate",
        "targets": [{"expr": "rate(predictions_total[5m])"}]
      },
      {
        "title": "Model Performance",
        "targets": [{"expr": "avg(model_confidence)"}]
      },
      {
        "title": "Latency Distribution",
        "targets": [{"expr": "histogram_quantile(0.95, prediction_latency_seconds_bucket)"}]
      },
      {
        "title": "Cache Hit Rate",
        "targets": [{"expr": "rate(cache_hits_total[5m]) / rate(predictions_total[5m])"}]
      },
      {
        "title": "Error Rate",
        "targets": [{"expr": "rate(prediction_errors_total[5m])"}]
      },
      {
        "title": "Data Drift Score",
        "targets": [{"expr": "drift_score"}]
      }
    ]
  }
}
```

## Deployment Instructions

### 1. Set Up Infrastructure

```bash
# Start all services
docker-compose -f docker-compose-complete.yml up -d

# Verify services
docker-compose ps
```

### 2. Initialize Feature Store

```bash
cd feature_repo
feast apply
feast materialize-incremental $(date -u +"%Y-%m-%dT%H:%M:%S")
```

### 3. Deploy Model

```bash
# Train and register model
python scripts/train_and_register.py

# Deploy model server
kubectl apply -f k8s/model-server-deployment.yaml
```

### 4. Set Up Monitoring

```bash
# Import Grafana dashboards
curl -X POST http://admin:admin@localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @config/grafana/dashboards/complete-platform.json
```

## Verification Steps

### 1. End-to-End Test

```bash
# Run complete test suite
python scripts/e2e_test.py
```

### 2. Access All Dashboards

- MLflow: http://localhost:5000
- Airflow: http://localhost:8080
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Model API: http://localhost:8000/docs

### 3. Trigger Retraining Pipeline

```bash
# Manually trigger via Airflow UI or CLI
airflow dags trigger automated_model_retraining
```

## Best Practices

1. **Infrastructure as Code**: Use Terraform/CloudFormation
2. **GitOps**: All configurations in version control
3. **Automated Testing**: Comprehensive test coverage
4. **Monitoring**: Full observability stack
5. **Security**: Implement authentication and encryption
6. **Scalability**: Design for horizontal scaling
7. **Documentation**: Maintain runbooks and architecture docs
8. **Disaster Recovery**: Regular backups and recovery procedures

## Key Takeaways

1. **Integration is Key**: All components must work seamlessly together
2. **Automation Reduces Errors**: Automate everything from training to deployment
3. **Monitoring is Essential**: Observability prevents production issues
4. **Testing Builds Confidence**: Comprehensive testing enables rapid iteration
5. **Standardization Matters**: Consistent patterns across components
6. **Documentation Saves Time**: Good docs accelerate onboarding
7. **Security Cannot Be Afterthought**: Build in from the start
8. **Feedback Loops Drive Improvement**: Continuous monitoring enables continuous improvement
9. **Scalability Requires Planning**: Design for scale from day one
10. **People and Process Matter**: Technology alone doesn't solve organizational challenges

## Production Checklist

- [ ] All tests passing in CI/CD
- [ ] Model performance meets SLAs
- [ ] Monitoring and alerting configured
- [ ] Data quality validation in place
- [ ] Drift detection active
- [ ] Automated retraining configured
- [ ] Rollback procedures tested
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Team trained on platform

## Additional Resources

- [ML Ops Best Practices](https://ml-ops.org/)
- [Google MLOps Guide](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)
- [AWS MLOps Framework](https://aws.amazon.com/sagemaker/mlops/)
- [Azure ML Platform](https://azure.microsoft.com/en-us/services/machine-learning/)

## Conclusion

This end-to-end platform integrates all components from previous tutorials into a production-ready MLOps system. It provides automation, monitoring, and governance necessary for operating ML systems at scale.

**Congratulations on completing all 22 MLOps/LLMOps tutorials!**
