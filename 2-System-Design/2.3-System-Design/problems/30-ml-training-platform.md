# Design ML Training Platform

## Problem Statement

Design a machine learning training platform like AWS SageMaker that handles large-scale model training, hyperparameter tuning, distributed training, and model versioning.

## Requirements

- Submit training jobs (code + data + hyperparameters)
- Distributed training (multi-GPU, multi-node)
- Hyperparameter tuning (grid search, random search, Bayesian)
- Experiment tracking (metrics, artifacts)
- Model versioning and registry
- Resource scheduling (GPU/CPU allocation)
- Cost optimization

## Architecture

```
User → API → Job Scheduler → [Worker Pool (K8s)] → Model Registry
                                   ↓
                            Distributed Storage (S3)
                                   ↓
                            Metrics DB (PrometheusDalton/MLflow)
```

## Key Components

### Job Submission

```python
# Submit training job
POST /api/training-jobs
{
  "name": "resnet50-imagenet",
  "framework": "pytorch",
  "code_uri": "s3://models/train.py",
  "data_uri": "s3://datasets/imagenet",
  "instance_type": "p3.8xlarge",  # 4x V100 GPUs
  "instance_count": 4,  # 16 GPUs total
  "hyperparameters": {
    "learning_rate": 0.001,
    "batch_size": 256,
    "epochs": 100
  }
}
```

### Distributed Training

```python
# PyTorch Distributed Data Parallel
import torch.distributed as dist

def train_distributed(rank, world_size):
    # Initialize process group
    dist.init_process_group(
        backend='nccl',  # NVIDIA Collective Communications Library
        init_method='env://',
        world_size=world_size,
        rank=rank
    )

    # Distribute model across GPUs
    model = ResNet50().to(rank)
    model = torch.nn.parallel.DistributedDataParallel(model, device_ids=[rank])

    # Each GPU gets different batch
    sampler = torch.utils.data.distributed.DistributedSampler(dataset, num_replicas=world_size, rank=rank)
    dataloader = DataLoader(dataset, sampler=sampler, batch_size=256)

    for epoch in range(100):
        for batch in dataloader:
            loss = model(batch)
            loss.backward()
            optimizer.step()

            # Log metrics (rank 0 only)
            if rank == 0:
                log_metric('loss', loss.item())
```

### Hyperparameter Tuning

```python
# Bayesian Optimization
from sklearn.gaussian_process import GaussianProcessRegressor

def bayesian_hp_search(objective_fn, param_space, n_iterations=50):
    # Track tried hyperparameters and results
    X_tried = []  # Hyperparameters
    y_tried = []  # Validation accuracy

    for i in range(n_iterations):
        # Fit Gaussian Process
        gp = GaussianProcessRegressor()
        if X_tried:
            gp.fit(X_tried, y_tried)

        # Acquisition function (Expected Improvement)
        next_params = maximize_expected_improvement(gp, param_space)

        # Train model with these hyperparameters
        accuracy = objective_fn(next_params)

        X_tried.append(next_params)
        y_tried.append(accuracy)

    # Return best
    best_idx = np.argmax(y_tried)
    return X_tried[best_idx], y_tried[best_idx]
```

### Experiment Tracking

```python
# MLflow integration
import mlflow

with mlflow.start_run():
    # Log hyperparameters
    mlflow.log_params({
        "learning_rate": 0.001,
        "batch_size": 256,
        "optimizer": "adam"
    })

    for epoch in range(100):
        # Train...
        train_loss = train_one_epoch()

        # Log metrics
        mlflow.log_metric("train_loss", train_loss, step=epoch)

    # Save model
    mlflow.pytorch.log_model(model, "model")

    # Log artifacts (plots, confusion matrix)
    mlflow.log_artifact("confusion_matrix.png")
```

## Resource Scheduling

```python
class GPUScheduler:
    def schedule_job(self, job):
        # Find available GPU nodes
        available = self.find_available_nodes(
            gpu_count=job.gpu_count,
            memory_gb=job.memory_gb
        )

        if not available:
            # Queue job
            self.queue.add(job, priority=job.priority)
            return "queued"

        # Allocate resources
        allocated_nodes = available[:job.node_count]

        # Launch on Kubernetes
        k8s.create_job({
            "name": job.name,
            "image": f"pytorch/{job.framework_version}",
            "command": ["python", "train.py"],
            "resources": {
                "limits": {
                    "nvidia.com/gpu": job.gpu_per_node
                }
            },
            "env": {
                "MASTER_ADDR": allocated_nodes[0],
                "WORLD_SIZE": len(allocated_nodes)
            }
        })

        return "running"
```

## Cost Optimization

```python
# Spot instances (70% cheaper but can be interrupted)
def use_spot_instances(job):
    if job.is_fault_tolerant:  # Has checkpointing
        # Try spot first
        instances = ec2.request_spot_instances(
            instance_type='p3.8xlarge',
            count=job.instance_count,
            max_price=2.50  # $/hour (vs $12/hour on-demand)
        )

        # Checkpoint every 10 minutes
        def checkpoint_callback():
            torch.save(model.state_dict(), f's3://checkpoints/{job.id}/latest.pth')

# Automatic scaling
def scale_training(job):
    # Start with 1 node
    # If gradient staleness low → add nodes
    # If GPU utilization <70% → remove nodes
    pass
```

## Model Registry

```sql
CREATE TABLE models (
  model_id UUID PRIMARY KEY,
  name VARCHAR(200),
  version INT,
  framework VARCHAR(50),
  metrics JSONB,  -- {"accuracy": 0.95, "f1": 0.92}
  artifacts_uri TEXT,  -- s3://models/resnet50/v1
  created_at TIMESTAMP,
  created_by UUID
);

CREATE TABLE model_deployments (
  deployment_id UUID PRIMARY KEY,
  model_id UUID REFERENCES models(model_id),
  endpoint_url TEXT,
  status VARCHAR(20),  -- staging, production
  traffic_percentage INT,
  deployed_at TIMESTAMP
);
```

## Monitoring

```
Performance:
- Training throughput: 1000 images/sec
- GPU utilization: > 90%
- Job queue time: p50 < 5 min

Cost:
- Cost per experiment: $50
- Spot instance savings: 70%
- GPU idle time: < 10%

ML Metrics:
- Model accuracy: 95%
- Training time: 12 hours
- Experiments per day: 100
```

## Interview Talking Points

"ML training platform needs distributed compute, experiment tracking, and cost optimization. Use Kubernetes for orchestration with GPU scheduling. For distributed training, use PyTorch DDP across multi-node. Hyperparameter tuning with Bayesian optimization (better than grid search). Track experiments with MLflow. Cost optimize with spot instances (70% savings) + checkpointing. Monitor GPU utilization (>90%) and queue time."
