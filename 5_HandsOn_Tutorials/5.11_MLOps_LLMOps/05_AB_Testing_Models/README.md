# Tutorial 05: A/B Testing for ML Models

## Learning Objectives

By completing this tutorial, you will:
- Understand A/B testing principles for ML models in production
- Implement traffic splitting and routing strategies
- Calculate statistical significance for model comparisons
- Set up multi-armed bandit algorithms for adaptive testing
- Monitor and analyze A/B test metrics in real-time
- Make data-driven decisions for model deployment

## Prerequisites

- Completion of Tutorial 04 (Model Registry and Deployment)
- Python 3.8+
- Docker and Docker Compose
- Understanding of statistical hypothesis testing
- Familiarity with REST APIs and load balancing

## Architecture Overview

### A/B Testing System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web/Mobile Clients] --> B[API Gateway]
        C[Backend Services] --> B
    end

    subgraph "Routing Layer"
        B --> D[Load Balancer]
        D --> E[Traffic Splitter]
        E --> F{Experiment Manager}
    end

    subgraph "Model Serving"
        F -->|50% Traffic| G[Model A v1.0<br/>Production]
        F -->|50% Traffic| H[Model B v2.0<br/>Challenger]
    end

    subgraph "Data Collection"
        G --> I[Prediction Logger A]
        H --> J[Prediction Logger B]
        I --> K[(Metrics Database)]
        J --> K
    end

    subgraph "Analysis & Monitoring"
        K --> L[Metrics Aggregator]
        L --> M[Statistical Analysis]
        M --> N[Dashboard<br/>Grafana]
        M --> O{Significance Test}
        O -->|Significant| P[Auto-Promote Winner]
        O -->|Not Significant| Q[Continue Testing]
    end

    subgraph "Configuration"
        R[Experiment Config] --> F
        S[Feature Flags] --> F
        T[User Segments] --> F
    end

    style G fill:#90EE90
    style H fill:#FFD700
    style P fill:#87CEEB
```

### Traffic Routing Flow

```mermaid
flowchart LR
    A[Incoming Request] --> B{Extract User ID}
    B --> C[Hash User ID]
    C --> D{Traffic Split Logic}

    D -->|Bucket 0-49| E[Route to Model A]
    D -->|Bucket 50-99| F[Route to Model B]

    E --> G[Model A Prediction]
    F --> H[Model B Prediction]

    G --> I[Log Metrics A]
    H --> J[Log Metrics B]

    I --> K[Response to Client]
    J --> K

    I --> L[(Metrics Store)]
    J --> L

    L --> M[Real-time Analysis]
    M --> N{Check Criteria}
    N -->|Winner Found| O[Promote Model]
    N -->|Inconclusive| P[Continue Test]
    N -->|Model B Worse| Q[Stop Experiment]
```

### Metrics Comparison Workflow

```mermaid
sequenceDiagram
    participant Client
    participant Router
    participant ModelA
    participant ModelB
    participant Metrics
    participant Analyzer

    Client->>Router: Prediction Request
    Router->>Router: Assign to variant (A or B)

    alt Variant A
        Router->>ModelA: Forward request
        ModelA->>ModelA: Generate prediction
        ModelA->>Metrics: Log metrics (latency, confidence)
        ModelA->>Client: Return prediction
    else Variant B
        Router->>ModelB: Forward request
        ModelB->>ModelB: Generate prediction
        ModelB->>Metrics: Log metrics (latency, confidence)
        ModelB->>Client: Return prediction
    end

    loop Every 5 minutes
        Analyzer->>Metrics: Fetch aggregated metrics
        Analyzer->>Analyzer: Calculate statistics
        Analyzer->>Analyzer: Compute p-value
        Analyzer->>Analyzer: Check stopping criteria

        alt Significant improvement
            Analyzer->>Router: Promote Model B
            Analyzer->>Analyzer: Stop experiment
        else No significant difference
            Analyzer->>Analyzer: Continue collecting data
        else Model B performing worse
            Analyzer->>Router: Stop routing to B
            Analyzer->>Analyzer: End experiment
        end
    end
```

## Implementation Guide

### Step 1: Set Up Infrastructure

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: ab_testing
      POSTGRES_USER: abtest
      POSTGRES_PASSWORD: abtest_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  model-a:
    build:
      context: .
      dockerfile: Dockerfile.model
    environment:
      MODEL_VERSION: "v1.0"
      MODEL_NAME: "model-a"
      PORT: "8001"
    ports:
      - "8001:8001"

  model-b:
    build:
      context: .
      dockerfile: Dockerfile.model
    environment:
      MODEL_VERSION: "v2.0"
      MODEL_NAME: "model-b"
      PORT: "8002"
    ports:
      - "8002:8002"

  traffic-router:
    build:
      context: .
      dockerfile: Dockerfile.router
    environment:
      MODEL_A_URL: "http://model-a:8001"
      MODEL_B_URL: "http://model-b:8002"
      REDIS_URL: "redis://redis:6379"
      POSTGRES_URL: "postgresql://abtest:abtest_pass@postgres:5432/ab_testing"
    ports:
      - "8000:8000"
    depends_on:
      - redis
      - postgres
      - model-a
      - model-b

  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana-dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3000:3000"
    depends_on:
      - prometheus

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

Create database schema `init.sql`:

```sql
CREATE TABLE experiments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    model_a_name VARCHAR(100) NOT NULL,
    model_b_name VARCHAR(100) NOT NULL,
    traffic_split FLOAT DEFAULT 0.5,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'running',
    winner VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES experiments(id),
    user_id VARCHAR(255),
    variant VARCHAR(10) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    prediction JSONB NOT NULL,
    confidence FLOAT,
    latency_ms FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_experiment ON predictions(experiment_id);
CREATE INDEX idx_predictions_variant ON predictions(variant);
CREATE INDEX idx_predictions_timestamp ON predictions(timestamp);

CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    prediction_id INTEGER REFERENCES predictions(id),
    user_id VARCHAR(255),
    actual_outcome JSONB,
    is_correct BOOLEAN,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE experiment_metrics (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES experiments(id),
    variant VARCHAR(10) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    sample_size INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_experiment_variant ON experiment_metrics(experiment_id, variant);
```

### Step 2: Implement Traffic Router

Create `traffic_router.py`:

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import httpx
import hashlib
import asyncio
from datetime import datetime
import redis
import json
from typing import Optional, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import time

app = FastAPI(title="A/B Testing Traffic Router")

# Configuration
MODEL_A_URL = os.getenv("MODEL_A_URL", "http://localhost:8001")
MODEL_B_URL = os.getenv("MODEL_B_URL", "http://localhost:8002")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
POSTGRES_URL = os.getenv("POSTGRES_URL", "postgresql://abtest:abtest_pass@localhost:5432/ab_testing")

# Initialize Redis
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

class ExperimentManager:
    def __init__(self):
        self.conn = psycopg2.connect(POSTGRES_URL)

    def get_active_experiment(self, experiment_name: str) -> Optional[Dict]:
        """Get active experiment configuration."""
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM experiments WHERE name = %s AND status = 'running'",
                (experiment_name,)
            )
            return cur.fetchone()

    def create_experiment(self, name: str, model_a: str, model_b: str, traffic_split: float = 0.5):
        """Create a new A/B test experiment."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO experiments (name, model_a_name, model_b_name, traffic_split)
                VALUES (%s, %s, %s, %s)
                RETURNING id
                """,
                (name, model_a, model_b, traffic_split)
            )
            self.conn.commit()
            return cur.fetchone()[0]

    def log_prediction(self, experiment_id: int, user_id: str, variant: str,
                      model_name: str, prediction: Dict, confidence: float, latency: float):
        """Log prediction for analysis."""
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO predictions
                (experiment_id, user_id, variant, model_name, prediction, confidence, latency_ms)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (experiment_id, user_id, variant, model_name, json.dumps(prediction), confidence, latency)
            )
            self.conn.commit()

experiment_manager = ExperimentManager()

class TrafficSplitter:
    """Handle traffic splitting logic."""

    @staticmethod
    def assign_variant(user_id: str, traffic_split: float = 0.5) -> str:
        """
        Assign user to variant A or B using consistent hashing.

        Args:
            user_id: Unique user identifier
            traffic_split: Percentage of traffic to Model B (0.0 to 1.0)

        Returns:
            'A' or 'B'
        """
        # Use MD5 hash for consistent assignment
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        bucket = (hash_value % 100) / 100.0

        return 'B' if bucket < traffic_split else 'A'

    @staticmethod
    def get_cached_variant(user_id: str) -> Optional[str]:
        """Check if user already assigned to variant."""
        return redis_client.get(f"user_variant:{user_id}")

    @staticmethod
    def cache_variant(user_id: str, variant: str, ttl: int = 3600):
        """Cache user's variant assignment."""
        redis_client.setex(f"user_variant:{user_id}", ttl, variant)

splitter = TrafficSplitter()

@app.post("/predict")
async def predict(request: Request, user_id: str, features: Dict[str, Any]):
    """
    Route prediction request to appropriate model variant.

    Args:
        user_id: Unique user identifier for consistent routing
        features: Input features for prediction
    """
    experiment_name = "iris-classifier-test"

    # Get experiment configuration
    experiment = experiment_manager.get_active_experiment(experiment_name)
    if not experiment:
        raise HTTPException(status_code=404, detail="No active experiment found")

    # Check cached variant assignment
    variant = splitter.get_cached_variant(user_id)

    if not variant:
        # Assign variant using traffic split
        variant = splitter.assign_variant(user_id, experiment['traffic_split'])
        splitter.cache_variant(user_id, variant)

    # Route to appropriate model
    model_url = MODEL_A_URL if variant == 'A' else MODEL_B_URL
    model_name = experiment['model_a_name'] if variant == 'A' else experiment['model_b_name']

    # Make prediction with timing
    start_time = time.time()
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{model_url}/predict",
                json={"features": features},
                timeout=5.0
            )
            response.raise_for_status()
            result = response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model request failed: {str(e)}")

    latency_ms = (time.time() - start_time) * 1000

    # Log prediction
    experiment_manager.log_prediction(
        experiment_id=experiment['id'],
        user_id=user_id,
        variant=variant,
        model_name=model_name,
        prediction=result,
        confidence=result.get('confidence', 0.0),
        latency=latency_ms
    )

    # Add metadata to response
    result['variant'] = variant
    result['experiment_id'] = experiment['id']
    result['latency_ms'] = latency_ms

    return result

@app.get("/experiment/{experiment_name}/stats")
async def get_experiment_stats(experiment_name: str):
    """Get current statistics for an experiment."""
    experiment = experiment_manager.get_active_experiment(experiment_name)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")

    with experiment_manager.conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Get metrics by variant
        cur.execute(
            """
            SELECT
                variant,
                COUNT(*) as total_predictions,
                AVG(latency_ms) as avg_latency,
                AVG(confidence) as avg_confidence,
                MIN(timestamp) as first_prediction,
                MAX(timestamp) as last_prediction
            FROM predictions
            WHERE experiment_id = %s
            GROUP BY variant
            """,
            (experiment['id'],)
        )
        stats = cur.fetchall()

    return {
        "experiment": experiment_name,
        "status": experiment['status'],
        "traffic_split": experiment['traffic_split'],
        "variants": stats
    }

@app.post("/experiment/create")
async def create_experiment(
    name: str,
    model_a_name: str,
    model_b_name: str,
    traffic_split: float = 0.5
):
    """Create a new A/B test experiment."""
    try:
        exp_id = experiment_manager.create_experiment(
            name, model_a_name, model_b_name, traffic_split
        )
        return {"experiment_id": exp_id, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Step 3: Statistical Analysis Engine

Create `statistical_analyzer.py`:

```python
import numpy as np
from scipy import stats
from typing import Dict, Tuple, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class VariantMetrics:
    """Metrics for a single variant."""
    variant: str
    sample_size: int
    mean: float
    std: float
    success_rate: Optional[float] = None

class StatisticalAnalyzer:
    """Statistical analysis for A/B tests."""

    def __init__(self, db_url: str, significance_level: float = 0.05):
        self.conn = psycopg2.connect(db_url)
        self.alpha = significance_level

    def get_variant_metrics(self, experiment_id: int, metric_name: str) -> Dict[str, VariantMetrics]:
        """Fetch metrics for both variants."""
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            if metric_name == "latency":
                cur.execute(
                    """
                    SELECT
                        variant,
                        COUNT(*) as sample_size,
                        AVG(latency_ms) as mean,
                        STDDEV(latency_ms) as std
                    FROM predictions
                    WHERE experiment_id = %s
                    GROUP BY variant
                    """,
                    (experiment_id,)
                )
            elif metric_name == "confidence":
                cur.execute(
                    """
                    SELECT
                        variant,
                        COUNT(*) as sample_size,
                        AVG(confidence) as mean,
                        STDDEV(confidence) as std
                    FROM predictions
                    WHERE experiment_id = %s
                    GROUP BY variant
                    """,
                    (experiment_id,)
                )
            elif metric_name == "accuracy":
                cur.execute(
                    """
                    SELECT
                        p.variant,
                        COUNT(*) as sample_size,
                        AVG(CASE WHEN f.is_correct THEN 1.0 ELSE 0.0 END) as mean,
                        STDDEV(CASE WHEN f.is_correct THEN 1.0 ELSE 0.0 END) as std
                    FROM predictions p
                    JOIN feedback f ON p.id = f.prediction_id
                    WHERE p.experiment_id = %s
                    GROUP BY p.variant
                    """,
                    (experiment_id,)
                )

            results = cur.fetchall()

        metrics = {}
        for row in results:
            metrics[row['variant']] = VariantMetrics(
                variant=row['variant'],
                sample_size=row['sample_size'],
                mean=row['mean'] or 0.0,
                std=row['std'] or 0.0
            )

        return metrics

    def t_test(self, metrics_a: VariantMetrics, metrics_b: VariantMetrics) -> Tuple[float, float]:
        """
        Perform Welch's t-test for two variants.

        Returns:
            t_statistic, p_value
        """
        # Calculate t-statistic
        mean_diff = metrics_b.mean - metrics_a.mean
        se_diff = np.sqrt(
            (metrics_a.std ** 2 / metrics_a.sample_size) +
            (metrics_b.std ** 2 / metrics_b.sample_size)
        )

        if se_diff == 0:
            return 0.0, 1.0

        t_stat = mean_diff / se_diff

        # Calculate degrees of freedom (Welch-Satterthwaite equation)
        df = (
            (metrics_a.std ** 2 / metrics_a.sample_size +
             metrics_b.std ** 2 / metrics_b.sample_size) ** 2
        ) / (
            (metrics_a.std ** 2 / metrics_a.sample_size) ** 2 / (metrics_a.sample_size - 1) +
            (metrics_b.std ** 2 / metrics_b.sample_size) ** 2 / (metrics_b.sample_size - 1)
        )

        # Calculate p-value (two-tailed test)
        p_value = 2 * (1 - stats.t.cdf(abs(t_stat), df))

        return t_stat, p_value

    def proportion_test(self, metrics_a: VariantMetrics, metrics_b: VariantMetrics) -> Tuple[float, float]:
        """
        Perform two-proportion z-test.

        Used for binary metrics like conversion rate, accuracy.

        Returns:
            z_statistic, p_value
        """
        p1 = metrics_a.mean
        p2 = metrics_b.mean
        n1 = metrics_a.sample_size
        n2 = metrics_b.sample_size

        # Pooled proportion
        p_pool = (p1 * n1 + p2 * n2) / (n1 + n2)

        # Standard error
        se = np.sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))

        if se == 0:
            return 0.0, 1.0

        # Z-statistic
        z_stat = (p2 - p1) / se

        # P-value (two-tailed)
        p_value = 2 * (1 - stats.norm.cdf(abs(z_stat)))

        return z_stat, p_value

    def calculate_confidence_interval(
        self,
        metrics: VariantMetrics,
        confidence: float = 0.95
    ) -> Tuple[float, float]:
        """Calculate confidence interval for a metric."""
        z_score = stats.norm.ppf((1 + confidence) / 2)
        margin_error = z_score * (metrics.std / np.sqrt(metrics.sample_size))

        return (
            metrics.mean - margin_error,
            metrics.mean + margin_error
        )

    def minimum_sample_size(
        self,
        baseline_mean: float,
        mde: float,  # Minimum Detectable Effect
        power: float = 0.8
    ) -> int:
        """
        Calculate minimum sample size needed per variant.

        Args:
            baseline_mean: Current metric value
            mde: Minimum detectable effect (as proportion, e.g., 0.05 for 5% improvement)
            power: Statistical power (1 - beta)

        Returns:
            Minimum sample size per variant
        """
        # Assume standard deviation is proportional to mean
        std = baseline_mean * 0.1  # 10% coefficient of variation

        # Effect size
        effect_size = (baseline_mean * mde) / std

        # Z-scores for significance level and power
        z_alpha = stats.norm.ppf(1 - self.alpha / 2)
        z_beta = stats.norm.ppf(power)

        # Sample size calculation
        n = 2 * ((z_alpha + z_beta) ** 2) / (effect_size ** 2)

        return int(np.ceil(n))

    def analyze_experiment(self, experiment_id: int, metric_name: str) -> Dict:
        """
        Perform comprehensive statistical analysis.

        Returns analysis results including:
        - Statistical test results
        - Confidence intervals
        - Recommendation
        """
        metrics = self.get_variant_metrics(experiment_id, metric_name)

        if 'A' not in metrics or 'B' not in metrics:
            return {
                "error": "Insufficient data for both variants",
                "status": "incomplete"
            }

        metrics_a = metrics['A']
        metrics_b = metrics['B']

        # Choose appropriate test
        if metric_name in ['accuracy', 'conversion']:
            test_stat, p_value = self.proportion_test(metrics_a, metrics_b)
            test_type = "two-proportion z-test"
        else:
            test_stat, p_value = self.t_test(metrics_a, metrics_b)
            test_type = "Welch's t-test"

        # Calculate confidence intervals
        ci_a = self.calculate_confidence_interval(metrics_a)
        ci_b = self.calculate_confidence_interval(metrics_b)

        # Determine significance
        is_significant = p_value < self.alpha

        # Calculate improvement
        improvement = ((metrics_b.mean - metrics_a.mean) / metrics_a.mean) * 100

        # Generate recommendation
        if not is_significant:
            recommendation = "Continue test - no significant difference detected"
            winner = None
        elif improvement > 0:
            recommendation = f"Variant B shows {improvement:.2f}% improvement - consider promoting"
            winner = "B"
        else:
            recommendation = f"Variant B shows {improvement:.2f}% degradation - keep Variant A"
            winner = "A"

        return {
            "test_type": test_type,
            "metric": metric_name,
            "variant_a": {
                "sample_size": metrics_a.sample_size,
                "mean": metrics_a.mean,
                "std": metrics_a.std,
                "confidence_interval": ci_a
            },
            "variant_b": {
                "sample_size": metrics_b.sample_size,
                "mean": metrics_b.mean,
                "std": metrics_b.std,
                "confidence_interval": ci_b
            },
            "test_statistic": test_stat,
            "p_value": p_value,
            "is_significant": is_significant,
            "improvement_percent": improvement,
            "winner": winner,
            "recommendation": recommendation
        }

# Example usage
if __name__ == "__main__":
    analyzer = StatisticalAnalyzer(
        "postgresql://abtest:abtest_pass@localhost:5432/ab_testing"
    )

    # Analyze experiment
    results = analyzer.analyze_experiment(
        experiment_id=1,
        metric_name="latency"
    )

    print("=== A/B Test Analysis ===")
    print(f"Test: {results['test_type']}")
    print(f"Metric: {results['metric']}")
    print(f"\nVariant A: {results['variant_a']['mean']:.4f} ± {results['variant_a']['std']:.4f}")
    print(f"Variant B: {results['variant_b']['mean']:.4f} ± {results['variant_b']['std']:.4f}")
    print(f"\nP-value: {results['p_value']:.6f}")
    print(f"Significant: {results['is_significant']}")
    print(f"Improvement: {results['improvement_percent']:.2f}%")
    print(f"\nRecommendation: {results['recommendation']}")
```

### Step 4: Multi-Armed Bandit Implementation

Create `bandit_optimizer.py`:

```python
import numpy as np
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime
import redis
import json

@dataclass
class BanditArm:
    """Represents one variant in the bandit."""
    name: str
    successes: int = 0
    failures: int = 0
    total_pulls: int = 0

    @property
    def success_rate(self) -> float:
        if self.total_pulls == 0:
            return 0.0
        return self.successes / self.total_pulls

class ThompsonSampling:
    """
    Thompson Sampling for multi-armed bandit optimization.

    Dynamically allocates traffic based on performance.
    """

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = redis.from_url(redis_url, decode_responses=True)

    def _get_arm_key(self, experiment_name: str, arm_name: str) -> str:
        return f"bandit:{experiment_name}:{arm_name}"

    def get_arm(self, experiment_name: str, arm_name: str) -> BanditArm:
        """Retrieve arm statistics from Redis."""
        key = self._get_arm_key(experiment_name, arm_name)
        data = self.redis_client.get(key)

        if data:
            stats = json.loads(data)
            return BanditArm(
                name=arm_name,
                successes=stats['successes'],
                failures=stats['failures'],
                total_pulls=stats['total_pulls']
            )
        return BanditArm(name=arm_name)

    def save_arm(self, experiment_name: str, arm: BanditArm):
        """Save arm statistics to Redis."""
        key = self._get_arm_key(experiment_name, arm.name)
        data = {
            'successes': arm.successes,
            'failures': arm.failures,
            'total_pulls': arm.total_pulls
        }
        self.redis_client.set(key, json.dumps(data))

    def select_arm(self, experiment_name: str, arms: List[str]) -> str:
        """
        Select an arm using Thompson Sampling.

        Draws a sample from Beta distribution for each arm
        and selects the arm with highest sample.
        """
        arm_data = [self.get_arm(experiment_name, arm) for arm in arms]

        # Thompson Sampling: sample from Beta distribution
        samples = []
        for arm in arm_data:
            # Beta(alpha, beta) where alpha = successes + 1, beta = failures + 1
            alpha = arm.successes + 1
            beta = arm.failures + 1
            sample = np.random.beta(alpha, beta)
            samples.append(sample)

        # Select arm with highest sample
        selected_idx = np.argmax(samples)
        return arms[selected_idx]

    def update_reward(
        self,
        experiment_name: str,
        arm_name: str,
        reward: float,
        success_threshold: float = 0.5
    ):
        """
        Update arm statistics based on reward.

        Args:
            experiment_name: Name of experiment
            arm_name: Name of selected arm
            reward: Reward value (e.g., 0-1 for binary, any value for continuous)
            success_threshold: Threshold to consider reward a success
        """
        arm = self.get_arm(experiment_name, arm_name)

        arm.total_pulls += 1
        if reward >= success_threshold:
            arm.successes += 1
        else:
            arm.failures += 1

        self.save_arm(experiment_name, arm)

    def get_statistics(self, experiment_name: str, arms: List[str]) -> Dict:
        """Get current statistics for all arms."""
        stats = {}
        for arm_name in arms:
            arm = self.get_arm(experiment_name, arm_name)
            stats[arm_name] = {
                'total_pulls': arm.total_pulls,
                'successes': arm.successes,
                'failures': arm.failures,
                'success_rate': arm.success_rate,
                'confidence_bounds': self._calculate_bounds(arm)
            }
        return stats

    def _calculate_bounds(self, arm: BanditArm, confidence: float = 0.95) -> Dict:
        """Calculate credible intervals using Beta distribution."""
        alpha = arm.successes + 1
        beta = arm.failures + 1

        # Calculate credible interval
        lower = np.percentile(np.random.beta(alpha, beta, 10000), (1 - confidence) / 2 * 100)
        upper = np.percentile(np.random.beta(alpha, beta, 10000), (1 + confidence) / 2 * 100)

        return {
            'lower': lower,
            'upper': upper,
            'mean': arm.success_rate
        }

class EpsilonGreedy:
    """
    Epsilon-Greedy strategy for A/B testing.

    Explores with probability epsilon, exploits best arm otherwise.
    """

    def __init__(self, epsilon: float = 0.1, redis_url: str = "redis://localhost:6379"):
        self.epsilon = epsilon
        self.redis_client = redis.from_url(redis_url, decode_responses=True)

    def select_arm(self, experiment_name: str, arms: List[str]) -> str:
        """Select arm using epsilon-greedy strategy."""
        # Explore with probability epsilon
        if np.random.random() < self.epsilon:
            return np.random.choice(arms)

        # Exploit: select best performing arm
        arm_stats = {}
        for arm_name in arms:
            key = f"bandit:{experiment_name}:{arm_name}"
            data = self.redis_client.get(key)
            if data:
                stats = json.loads(data)
                total = stats['total_pulls']
                if total > 0:
                    arm_stats[arm_name] = stats['successes'] / total
                else:
                    arm_stats[arm_name] = 0.0
            else:
                arm_stats[arm_name] = 0.0

        # Select arm with highest success rate
        if not arm_stats:
            return np.random.choice(arms)

        return max(arm_stats, key=arm_stats.get)

# Example usage
if __name__ == "__main__":
    # Thompson Sampling example
    ts = ThompsonSampling()

    experiment = "iris-classifier-bandit"
    arms = ["model-a", "model-b", "model-c"]

    # Simulate experiment
    for i in range(1000):
        # Select arm
        selected_arm = ts.select_arm(experiment, arms)

        # Simulate reward (in practice, this comes from actual model performance)
        true_rewards = {"model-a": 0.7, "model-b": 0.85, "model-c": 0.75}
        reward = 1.0 if np.random.random() < true_rewards[selected_arm] else 0.0

        # Update statistics
        ts.update_reward(experiment, selected_arm, reward)

    # Print results
    stats = ts.get_statistics(experiment, arms)
    print("=== Thompson Sampling Results ===")
    for arm_name, arm_stats in stats.items():
        print(f"\n{arm_name}:")
        print(f"  Pulls: {arm_stats['total_pulls']}")
        print(f"  Success Rate: {arm_stats['success_rate']:.4f}")
        print(f"  95% Credible Interval: [{arm_stats['confidence_bounds']['lower']:.4f}, "
              f"{arm_stats['confidence_bounds']['upper']:.4f}]")
```

### Step 5: Monitoring Dashboard Setup

Create `prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'traffic-router'
    static_configs:
      - targets: ['traffic-router:8000']

  - job_name: 'model-a'
    static_configs:
      - targets: ['model-a:8001']

  - job_name: 'model-b'
    static_configs:
      - targets: ['model-b:8002']
```

Create Grafana dashboard JSON `grafana-dashboards/ab-testing.json`:

```json
{
  "dashboard": {
    "title": "A/B Testing Dashboard",
    "panels": [
      {
        "title": "Traffic Distribution",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (variant) (predictions_total)",
            "legendFormat": "Variant {{variant}}"
          }
        ]
      },
      {
        "title": "Prediction Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum by (le, variant) (rate(prediction_latency_bucket[5m])))",
            "legendFormat": "p95 - Variant {{variant}}"
          },
          {
            "expr": "histogram_quantile(0.50, sum by (le, variant) (rate(prediction_latency_bucket[5m])))",
            "legendFormat": "p50 - Variant {{variant}}"
          }
        ]
      },
      {
        "title": "Model Confidence",
        "type": "graph",
        "targets": [
          {
            "expr": "avg by (variant) (prediction_confidence)",
            "legendFormat": "Avg Confidence - Variant {{variant}}"
          }
        ]
      },
      {
        "title": "Success Rate (with Feedback)",
        "type": "graph",
        "targets": [
          {
            "expr": "sum by (variant) (rate(prediction_success_total[5m])) / sum by (variant) (rate(predictions_total[5m]))",
            "legendFormat": "Success Rate - Variant {{variant}}"
          }
        ]
      }
    ]
  }
}
```

## Verification Steps

### 1. Start Infrastructure

```bash
docker-compose up -d
```

### 2. Create Experiment

```bash
curl -X POST "http://localhost:8000/experiment/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iris-classifier-test",
    "model_a_name": "model-v1.0",
    "model_b_name": "model-v2.0",
    "traffic_split": 0.5
  }'
```

### 3. Send Test Traffic

```python
import requests
import random

# Simulate users
for i in range(100):
    user_id = f"user_{i % 20}"  # 20 unique users
    features = {
        "sepal_length": random.uniform(4.0, 8.0),
        "sepal_width": random.uniform(2.0, 4.5),
        "petal_length": random.uniform(1.0, 7.0),
        "petal_width": random.uniform(0.1, 2.5)
    }

    response = requests.post(
        "http://localhost:8000/predict",
        json={"user_id": user_id, "features": features}
    )
    print(f"User {user_id} -> Variant {response.json()['variant']}")
```

### 4. Check Statistics

```bash
curl "http://localhost:8000/experiment/iris-classifier-test/stats" | jq
```

### 5. Run Statistical Analysis

```python
from statistical_analyzer import StatisticalAnalyzer

analyzer = StatisticalAnalyzer(
    "postgresql://abtest:abtest_pass@localhost:5432/ab_testing"
)

# Analyze latency
results = analyzer.analyze_experiment(1, "latency")
print(results)
```

### 6. View Grafana Dashboard

Open http://localhost:3000 (admin/admin) and view the A/B Testing dashboard.

## Best Practices

### 1. Sample Size Planning

```python
# Always calculate required sample size before starting
def plan_experiment(baseline_conversion=0.10, mde=0.02, alpha=0.05, power=0.80):
    """
    Plan experiment parameters.

    Args:
        baseline_conversion: Current conversion rate
        mde: Minimum detectable effect (absolute)
        alpha: Significance level (Type I error)
        power: Statistical power (1 - Type II error)
    """
    from scipy.stats import norm

    z_alpha = norm.ppf(1 - alpha/2)
    z_beta = norm.ppf(power)

    p1 = baseline_conversion
    p2 = baseline_conversion + mde

    n = (
        (z_alpha * np.sqrt(2 * p1 * (1 - p1)) +
         z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
    ) / (mde ** 2)

    days_estimate = n / (daily_traffic * 0.5)  # Assuming 50/50 split

    return {
        "sample_size_per_variant": int(np.ceil(n)),
        "total_sample_size": int(np.ceil(n * 2)),
        "estimated_days": int(np.ceil(days_estimate))
    }
```

### 2. Early Stopping Criteria

```python
class EarlyStoppingMonitor:
    """Monitor experiment for early stopping conditions."""

    def __init__(self, min_sample_size: int = 1000):
        self.min_sample_size = min_sample_size

    def should_stop(self, metrics_a, metrics_b, p_value, improvement) -> Dict:
        """Determine if experiment should be stopped early."""

        # Not enough data
        if metrics_a.sample_size < self.min_sample_size:
            return {"stop": False, "reason": "insufficient_data"}

        # Clear winner (high confidence + large improvement)
        if p_value < 0.001 and abs(improvement) > 10:
            return {"stop": True, "reason": "clear_winner", "winner": "B" if improvement > 0 else "A"}

        # Clear loser (variant significantly worse)
        if p_value < 0.01 and improvement < -5:
            return {"stop": True, "reason": "variant_b_worse", "action": "rollback"}

        # Minimum effect unlikely to be reached
        if metrics_a.sample_size > self.min_sample_size * 2 and p_value > 0.5:
            return {"stop": True, "reason": "no_difference_likely"}

        return {"stop": False, "reason": "continue_monitoring"}
```

### 3. Segmentation Analysis

```python
def analyze_by_segment(experiment_id: int, segment_field: str):
    """Analyze A/B test results by user segment."""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Example: analyze by user location or device type
        cur.execute(f"""
            SELECT
                p.variant,
                u.{segment_field} as segment,
                COUNT(*) as sample_size,
                AVG(p.confidence) as avg_confidence,
                AVG(f.is_correct::int) as accuracy
            FROM predictions p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN feedback f ON p.id = f.prediction_id
            WHERE p.experiment_id = %s
            GROUP BY p.variant, u.{segment_field}
        """, (experiment_id,))

        results = cur.fetchall()

    # Analyze each segment separately
    segments = {}
    for row in results:
        segment = row['segment']
        if segment not in segments:
            segments[segment] = {'A': {}, 'B': {}}
        segments[segment][row['variant']] = row

    return segments
```

### 4. Sequential Testing

```python
def sequential_probability_ratio_test(
    successes_a: int,
    failures_a: int,
    successes_b: int,
    failures_b: int,
    alpha: float = 0.05,
    beta: float = 0.20,
    mde: float = 0.05
) -> Dict:
    """
    SPRT allows for continuous monitoring with controlled error rates.

    Returns decision: 'continue', 'accept_b', or 'accept_a'
    """
    # Baseline and alternative hypotheses
    p0 = successes_a / (successes_a + failures_a) if (successes_a + failures_a) > 0 else 0.5
    p1 = p0 + mde

    # Likelihood ratio
    n_b = successes_b + failures_b
    if n_b == 0:
        return {"decision": "continue", "log_lr": 0}

    p_b = successes_b / n_b

    # Log likelihood ratio
    log_lr = (
        successes_b * np.log(p1 / p0) +
        failures_b * np.log((1 - p1) / (1 - p0))
    )

    # Decision boundaries
    upper_bound = np.log((1 - beta) / alpha)
    lower_bound = np.log(beta / (1 - alpha))

    if log_lr >= upper_bound:
        decision = "accept_b"  # B is better
    elif log_lr <= lower_bound:
        decision = "accept_a"  # A is better
    else:
        decision = "continue"

    return {
        "decision": decision,
        "log_lr": log_lr,
        "upper_bound": upper_bound,
        "lower_bound": lower_bound
    }
```

## Key Takeaways

1. **Consistent User Assignment**: Use hashing to ensure users see the same variant consistently, preventing confusion and bias.

2. **Statistical Rigor**: Always plan experiments with proper sample size calculations and significance testing to avoid false conclusions.

3. **Multi-Metric Analysis**: Monitor multiple metrics (latency, accuracy, confidence) as improving one may degrade another.

4. **Adaptive Strategies**: Multi-armed bandits like Thompson Sampling can optimize traffic allocation dynamically while learning.

5. **Early Stopping**: Implement guardrails to stop experiments early if variant is clearly worse or significantly better.

6. **Segmentation**: Analyze results by user segments to identify differential effects across populations.

7. **Monitoring Infrastructure**: Real-time dashboards are essential for tracking experiment health and catching issues quickly.

8. **Governance**: Implement approval workflows and minimum test durations to prevent premature decisions.

9. **Rollback Capability**: Always maintain ability to quickly route traffic back to control variant if issues arise.

10. **Documentation**: Record experiment hypotheses, results, and decisions to build organizational knowledge and avoid repeating mistakes.

## Additional Resources

- [Online A/B Testing Guide](https://exp-platform.com/Documents/2014%20experimentersRulesOfThumb.pdf)
- [Thompson Sampling Tutorial](https://web.stanford.edu/~bvr/pubs/TS_Tutorial.pdf)
- [Statistical Significance in A/B Testing](https://www.evanmiller.org/ab-testing/)
- [Multi-Armed Bandit Algorithms](https://banditalgs.com/)

## Next Steps

- **Tutorial 06**: Feature Store Implementation
- **Tutorial 07**: ML Model Monitoring
- **Tutorial 09**: Automated Model Retraining
