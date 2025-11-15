# Cloud Integration

## Table of Contents
1. [Cloud Service Providers Overview](#cloud-service-providers-overview)
2. [AWS Services Deep Dive](#aws-services-deep-dive)
3. [GCP Services Deep Dive](#gcp-services-deep-dive)
4. [Azure Services Deep Dive](#azure-services-deep-dive)
5. [Cloud vs On-Premise](#cloud-vs-on-premise)
6. [Cost Estimation](#cost-estimation)
7. [Multi-Cloud Strategies](#multi-cloud-strategies)
8. [Serverless Architectures](#serverless-architectures)
9. [Container Orchestration](#container-orchestration)
10. [Cloud Design Patterns](#cloud-design-patterns)

---

## Cloud Service Providers Overview

### Market Share (2024)
```
AWS (Amazon Web Services):    32%  → Market leader, most services
GCP (Google Cloud Platform):  10%  → Strong in ML/AI, data analytics
Azure (Microsoft):            23%  → Enterprise focus, hybrid cloud
Others:                       35%  → Alibaba, Oracle, IBM, etc.
```

### Service Categories

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Services                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│    Compute      │     Storage     │       Database          │
│  - VMs          │  - Object       │  - Relational (SQL)     │
│  - Containers   │  - Block        │  - NoSQL                │
│  - Serverless   │  - File         │  - In-memory            │
├─────────────────┼─────────────────┼─────────────────────────┤
│   Networking    │   Analytics     │      AI/ML              │
│  - VPC          │  - Data lakes   │  - Training             │
│  - Load Bal.    │  - Warehouses   │  - Inference            │
│  - CDN          │  - Streaming    │  - Pre-trained models   │
├─────────────────┼─────────────────┼─────────────────────────┤
│   Security      │   Monitoring    │      DevOps             │
│  - IAM          │  - Logging      │  - CI/CD                │
│  - Encryption   │  - Metrics      │  - IaC                  │
│  - Compliance   │  - Tracing      │  - Automation           │
└─────────────────┴─────────────────┴─────────────────────────┘
```

---

## AWS Services Deep Dive

### Compute

**EC2 (Elastic Compute Cloud)** - Virtual Machines

```yaml
Use Case: General-purpose compute
When to use:
  - Need full control over OS
  - Run legacy applications
  - Custom software requiring specific config

Pricing:
  - On-Demand: $0.096/hour (t3.large)
  - Reserved (1 year): 40% discount
  - Spot Instances: 70-90% discount (can be terminated)

Example:
  - Web application servers
  - Background workers
  - Database servers
```

**ECS (Elastic Container Service)** - Container orchestration

```yaml
Use Case: Run Docker containers
Pros:
  - Managed service (no master nodes)
  - Deep AWS integration
  - Cheaper than Kubernetes
Cons:
  - AWS-only (vendor lock-in)
  - Less flexible than Kubernetes

Example Architecture:
┌──────────────────────────────────────┐
│         Application Load             │
│          Balancer (ALB)              │
└──────────────┬───────────────────────┘
               │
       ┌───────┴──────┐
       │              │
┌──────▼──────┐ ┌─────▼──────┐
│ ECS Task 1  │ │ ECS Task 2 │  (Auto-scaled)
│  Container  │ │  Container │
└─────────────┘ └────────────┘

Pricing:
  - Pay only for EC2 instances or Fargate
  - Fargate: $0.04/vCPU/hour + $0.004/GB/hour
```

**Lambda** - Serverless functions

```yaml
Use Case: Event-driven, short-lived tasks
Limits:
  - Max execution: 15 minutes
  - Max memory: 10GB
  - Cold start: 100-500ms

When to use:
  - API backends (simple)
  - Data processing pipelines
  - Scheduled tasks
  - Event handlers (S3 upload, DynamoDB change)

When NOT to use:
  - Long-running tasks (>15 min)
  - Stateful applications
  - Low-latency requirements (<100ms)

Pricing:
  - $0.20 per 1M requests
  - $0.0000166667 per GB-second
  - Free tier: 1M requests/month

Example: Image processing
def lambda_handler(event, context):
    # Triggered when image uploaded to S3
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    # Download image
    s3.download_file(bucket, key, '/tmp/image.jpg')

    # Resize
    resize_image('/tmp/image.jpg', '/tmp/thumb.jpg')

    # Upload thumbnail
    s3.upload_file('/tmp/thumb.jpg', bucket, f'thumbs/{key}')

Cost example:
  - 1M image uploads/month
  - 1 second execution, 512MB memory
  - Cost: $0.20 (requests) + $10 (compute) = $10.20/month
```

**Fargate** - Serverless containers

```yaml
Use Case: Run containers without managing servers
Pros:
  - No EC2 management
  - Pay per second
  - Auto-scales
Cons:
  - More expensive than EC2
  - Less control

When to use:
  - Don't want to manage servers
  - Variable workloads
  - Microservices

Pricing:
  - 1 vCPU, 2GB: $0.04/hour (vCPU) + $0.008/hour (memory) = $0.048/hour
  - vs EC2: t3.small (2 vCPU, 2GB) = $0.023/hour
  - Fargate is 2x more expensive but no management
```

### Storage

**S3 (Simple Storage Service)** - Object storage

```yaml
Use Case: Store any type of file
Features:
  - Unlimited storage
  - 99.999999999% (11 nines) durability
  - Versioning, lifecycle policies
  - Server-side encryption

Storage Classes:
┌──────────────────┬──────────────┬──────────────┬────────────┐
│     Class        │   Retrieval  │   Use Case   │   Cost     │
├──────────────────┼──────────────┼──────────────┼────────────┤
│ Standard         │   Immediate  │   Hot data   │ $0.023/GB  │
│ Intelligent-Tier │   Auto-move  │   Unknown    │ $0.023/GB  │
│ Standard-IA      │   Immediate  │   Warm data  │ $0.0125/GB │
│ Glacier          │   Minutes    │   Archive    │ $0.004/GB  │
│ Glacier Deep     │   Hours      │   Compliance │ $0.00099/GB│
└──────────────────┴──────────────┴──────────────┴────────────┘

Lifecycle Policy Example:
- Day 0-30: Standard ($0.023/GB)
- Day 30-90: Standard-IA ($0.0125/GB)
- Day 90+: Glacier ($0.004/GB)

For 100GB data stored 1 year:
Standard: $0.023 * 100 * 12 = $27.60/year
With lifecycle: $0.023*100*1 + $0.0125*100*2 + $0.004*100*9 = $8.40/year
Savings: 70%!

When to use:
  - Static assets (images, videos, documents)
  - Backups
  - Data lakes
  - CDN origin
```

**EBS (Elastic Block Store)** - Block storage

```yaml
Use Case: Disk volumes for EC2
Types:
  - gp3 (SSD): General purpose, $0.08/GB/month
  - io2 (SSD): High IOPS, $0.125/GB/month
  - st1 (HDD): Throughput optimized, $0.045/GB/month

When to use:
  - Database storage
  - Application data that needs consistent IOPS
  - Boot volumes

When NOT to use:
  - Shared across instances (use EFS instead)
  - Object storage (use S3)
```

**EFS (Elastic File System)** - Network file system

```yaml
Use Case: Shared file system across multiple EC2
Pros:
  - Multiple instances can mount
  - Auto-scales
  - Managed
Cons:
  - Expensive: $0.30/GB/month (vs S3: $0.023/GB)
  - Lower throughput than EBS

When to use:
  - Content management systems
  - Shared application data
  - Container persistent storage
```

### Database

**RDS (Relational Database Service)** - Managed SQL

```yaml
Engines:
  - PostgreSQL
  - MySQL
  - MariaDB
  - Oracle
  - SQL Server
  - Aurora (AWS proprietary, 5x faster than MySQL)

Pros:
  - Automated backups
  - Automatic failover
  - Read replicas
  - Automated patching
Cons:
  - More expensive than self-managed EC2
  - Less control

Pricing (PostgreSQL, db.t3.medium):
  - On-Demand: $0.068/hour = $50/month
  - Reserved (1 year): $30/month (40% savings)
  - Plus storage: $0.115/GB/month

High Availability:
┌──────────────┐       ┌──────────────┐
│   Master     │◄─────►│   Standby    │  (Different AZ)
│  (AZ-1a)     │ Sync  │   (AZ-1b)    │
└──────────────┘       └──────────────┘
        │
        │ Failover: 60-120 seconds
        ▼
┌──────────────┐
│ Standby      │  → Becomes new master
│ (AZ-1b)      │
└──────────────┘

Read Scaling:
┌──────────────┐
│    Master    │  (Writes)
└──────┬───────┘
       │ Async replication
   ┌───┴────┬────────┬────────┐
   │        │        │        │
┌──▼──┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│Read │  │Read │  │Read │  │Read │  (Reads)
│Rep 1│  │Rep 2│  │Rep 3│  │Rep 4│
└─────┘  └─────┘  └─────┘  └─────┘

Can have up to 15 read replicas
```

**Aurora** - AWS's high-performance database

```yaml
Features:
  - 5x faster than MySQL, 3x faster than PostgreSQL
  - Auto-scaling storage (up to 128TB)
  - 6 copies across 3 AZs
  - Sub-10ms replica lag
  - Serverless option

Pricing:
  - $0.10/hour (db.t3.medium) = $73/month
  - Storage: $0.10/GB/month
  - I/O: $0.20 per 1M requests

Serverless Aurora:
  - Auto-scales capacity (ACU - Aurora Capacity Units)
  - Min: 0.5 ACU, Max: 128 ACU
  - Pricing: $0.06/ACU/hour
  - Use case: Infrequent, unpredictable workloads

When to use Aurora:
  - Need high performance
  - High availability critical (99.99%)
  - Read-heavy workloads
  - Can afford 2x cost of RDS
```

**DynamoDB** - Managed NoSQL

```yaml
Type: Key-value and document database
Features:
  - Fully managed
  - Single-digit millisecond latency
  - Unlimited scale
  - Global tables (multi-region)
  - Point-in-time recovery

Data Model:
Table: Users
┌──────────────┬────────────────┬─────────────┐
│ Partition Key│ Sort Key       │ Attributes  │
├──────────────┼────────────────┼─────────────┤
│ user_id      │ -              │ name, email │
│ "user123"    │                │ {...}       │
└──────────────┴────────────────┴─────────────┘

Table: Orders
┌──────────────┬────────────────┬─────────────┐
│ Partition Key│ Sort Key       │ Attributes  │
├──────────────┼────────────────┼─────────────┤
│ user_id      │ timestamp      │ order_data  │
│ "user123"    │ 2024-01-01     │ {...}       │
│ "user123"    │ 2024-01-05     │ {...}       │
└──────────────┴────────────────┴─────────────┘

Pricing Models:
1. Provisioned:
   - Specify RCU (Read Capacity Units) and WCU (Write Capacity Units)
   - 1 RCU = 1 strongly consistent read/sec (4KB)
   - 1 WCU = 1 write/sec (1KB)
   - Cost: $0.00065/hour per RCU, $0.00065/hour per WCU

   Example: 10 RCU, 10 WCU
   - Cost: (10 + 10) * $0.00065 * 730 hours = $9.49/month

2. On-Demand:
   - Pay per request
   - Auto-scales
   - Cost: $1.25 per 1M reads, $1.25 per 1M writes

   Example: 1M reads + 100K writes/month
   - Cost: $1.25 + $0.125 = $1.38/month

When to use:
  - Need single-digit ms latency
  - Unpredictable traffic (on-demand)
  - Simple queries (key-value)
  - Serverless architecture

When NOT to use:
  - Complex joins
  - Analytical queries
  - Strong consistency across items
```

**ElastiCache** - Managed Redis/Memcached

```yaml
Engines:
  - Redis: Data structures, persistence, pub/sub
  - Memcached: Simple, multi-threaded

Use Cases:
  - Session storage
  - Caching layer
  - Real-time analytics
  - Pub/sub messaging

Redis Configuration:
┌──────────────────────────────────────────┐
│           Application                    │
└────────────┬─────────────────────────────┘
             │
┌────────────▼─────────────────────────────┐
│      ElastiCache Redis Cluster           │
│  ┌────────┐    ┌────────┐   ┌────────┐  │
│  │ Master │───►│Replica │   │Replica │  │
│  │ (AZ-1a)│    │(AZ-1b) │   │(AZ-1c) │  │
│  └────────┘    └────────┘   └────────┘  │
└──────────────────────────────────────────┘

Pricing (cache.t3.medium, 3.09 GB):
  - $0.068/hour = $50/month per node
  - 3 nodes (1 master, 2 replicas): $150/month

Performance:
  - Latency: <1ms
  - Throughput: 100,000+ ops/sec
```

### Networking

**VPC (Virtual Private Cloud)** - Network isolation

```yaml
Concept: Your own private network in AWS

Example VPC:
┌────────────────────────────────────────────────────────────┐
│                  VPC (10.0.0.0/16)                         │
│                                                            │
│  ┌──────────────────────────┐  ┌─────────────────────────┐│
│  │  Public Subnet (AZ-1a)   │  │ Public Subnet (AZ-1b)   ││
│  │  10.0.1.0/24             │  │ 10.0.2.0/24             ││
│  │  ┌────────┐              │  │  ┌────────┐             ││
│  │  │  ALB   │              │  │  │  ALB   │             ││
│  │  └────────┘              │  │  └────────┘             ││
│  └──────────────────────────┘  └─────────────────────────┘│
│           │                              │                 │
│  ┌────────▼──────────────┐  ┌───────────▼──────────────┐ │
│  │ Private Subnet (AZ-1a)│  │ Private Subnet (AZ-1b)   │ │
│  │ 10.0.10.0/24          │  │ 10.0.11.0/24             │ │
│  │  ┌────────┐           │  │  ┌────────┐              │ │
│  │  │  EC2   │           │  │  │  EC2   │              │ │
│  │  └────────┘           │  │  └────────┘              │ │
│  └───────────────────────┘  └──────────────────────────┘ │
│           │                              │                 │
│  ┌────────▼──────────────┐  ┌───────────▼──────────────┐ │
│  │   DB Subnet (AZ-1a)   │  │   DB Subnet (AZ-1b)      │ │
│  │   10.0.20.0/24        │  │   10.0.21.0/24           │ │
│  │  ┌────────┐           │  │  ┌────────┐              │ │
│  │  │  RDS   │           │  │  │  RDS   │              │ │
│  │  └────────┘           │  │  └────────┘              │ │
│  └───────────────────────┘  └──────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

Components:
  - Internet Gateway: Connects VPC to internet
  - NAT Gateway: Allows private subnets to access internet
  - Route Tables: Define traffic routing
  - Security Groups: Stateful firewall
  - Network ACLs: Stateless firewall

No cost for VPC itself, pay for:
  - NAT Gateway: $0.045/hour + $0.045/GB processed
  - VPN: $0.05/hour
  - Transit Gateway: $0.05/hour per attachment
```

**ELB (Elastic Load Balancer)** - Load balancing

```yaml
Types:
1. Application Load Balancer (ALB) - Layer 7 (HTTP/HTTPS)
   - Path-based routing: /api → API servers, /static → S3
   - Host-based routing: api.example.com → API, app.example.com → App
   - WebSocket support
   - Cost: $0.0225/hour + $0.008/LCU

2. Network Load Balancer (NLB) - Layer 4 (TCP/UDP)
   - Ultra-low latency
   - Static IP support
   - Millions of requests/sec
   - Cost: $0.0225/hour + $0.006/LCU

3. Classic Load Balancer (CLB) - Legacy
   - Use ALB or NLB instead

Example: ALB with path-based routing
┌─────────────────┐
│      ALB        │
└────────┬────────┘
         │
    ┌────┴─────────────────┐
    │                      │
/api/*                 /static/*
    │                      │
┌───▼─────┐           ┌────▼────┐
│ EC2     │           │   S3    │
│ (API)   │           │(Static) │
└─────────┘           └─────────┘

Health Checks:
  - Interval: 30 seconds
  - Unhealthy threshold: 2 consecutive failures
  - Automatically removes unhealthy targets
```

**CloudFront** - CDN

```yaml
Use Case: Distribute content globally
How it works:
┌─────────────────────────────────────────────────────────┐
│                 CloudFront Edge Locations               │
│  (400+ locations worldwide)                             │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ US-East  │  │ EU-West  │  │ Asia-Pac │            │
│  │  Cache   │  │  Cache   │  │  Cache   │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
└───────┼─────────────┼─────────────┼──────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      │
              ┌───────▼─────────┐
              │  Origin (S3)    │
              │  us-east-1      │
              └─────────────────┘

Request Flow:
1. User in Tokyo requests image
2. Routed to nearest edge (Tokyo)
3. If cached: Return immediately (<50ms)
4. If not cached: Fetch from origin (200ms), cache, return
5. Next request: Cached (<50ms)

Pricing:
  - Data transfer: $0.085/GB (US/Europe)
  - Requests: $0.0075 per 10,000 requests
  - No charge for data transfer from S3 to CloudFront

Example: 1TB/month
  - Cost: $85/month
  - vs direct S3: $90/month + slower

Use cases:
  - Static website hosting
  - Video streaming
  - API acceleration
  - Dynamic content (with Lambda@Edge)
```

**Route 53** - DNS

```yaml
Features:
  - Domain registration
  - Health checks
  - Failover routing
  - Geolocation routing
  - Latency-based routing

Routing Policies:
1. Simple: One record → One IP
2. Weighted: Traffic split (80% → Server A, 20% → Server B)
3. Latency: Route to lowest latency region
4. Failover: Primary/secondary
5. Geolocation: Route based on user location

Example: Multi-region failover
┌──────────────────┐
│    Route 53      │
└────────┬─────────┘
         │
    ┌────┴──────────────┐
    │                   │
Primary (US)      Failover (EU)
    │                   │
┌───▼─────┐         ┌───▼─────┐
│ ELB US  │         │ ELB EU  │
└─────────┘         └─────────┘

Health check on Primary:
  - If fails: Route all traffic to EU
  - When recovered: Route back to US

Pricing:
  - Hosted zone: $0.50/month
  - Queries: $0.40 per 1M queries
  - Health checks: $0.50/month per endpoint
```

### Messaging

**SQS (Simple Queue Service)** - Message queue

```yaml
Type: Fully managed message queue
Use cases:
  - Decouple microservices
  - Async processing
  - Load leveling

Types:
1. Standard Queue:
   - Unlimited throughput
   - At-least-once delivery (duplicates possible)
   - Best-effort ordering

2. FIFO Queue:
   - Up to 3,000 messages/sec
   - Exactly-once delivery
   - Strict ordering

Example:
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Producer   │──────►│  SQS Queue   │◄──────│   Consumer   │
└──────────────┘       └──────────────┘       └──────────────┘

Visibility Timeout:
  - Consumer receives message
  - Message hidden from other consumers for X seconds
  - If processed: Delete message
  - If not processed: Message reappears in queue

Pricing:
  - $0.40 per 1M requests (Standard)
  - $0.50 per 1M requests (FIFO)
  - First 1M requests/month: FREE

Example: 10M requests/month
  - Cost: $0.40 * 9 = $3.60/month
```

**SNS (Simple Notification Service)** - Pub/Sub

```yaml
Type: Publish-subscribe messaging
Use cases:
  - Fan-out to multiple subscribers
  - Mobile push notifications
  - Email/SMS notifications

Example:
┌──────────────┐
│  Publisher   │
└──────┬───────┘
       │
┌──────▼───────┐
│  SNS Topic   │
└──────┬───────┘
       │
  ┌────┴─────┬────────┬────────┐
  │          │        │        │
┌─▼───┐  ┌──▼──┐  ┌──▼──┐  ┌──▼──┐
│SQS 1│  │SQS 2│  │Email│  │SMS  │
└─────┘  └─────┘  └─────┘  └─────┘

Pricing:
  - $0.50 per 1M publishes
  - $0.50 per 1M HTTP deliveries
  - SMS: $0.00645 per message (US)
  - Email: $2 per 100,000 emails
```

**Kinesis** - Real-time streaming

```yaml
Type: Real-time data streaming
Use cases:
  - Log processing
  - Real-time analytics
  - IoT data ingestion

vs Kafka:
  - Kinesis: Managed, easier to use, AWS-specific
  - Kafka: Self-managed, more powerful, open-source

Components:
1. Kinesis Data Streams:
   - Real-time data ingestion
   - Partition key for sharding
   - 1MB/sec write, 2MB/sec read per shard

2. Kinesis Data Firehose:
   - Load data into S3, Redshift, Elasticsearch
   - No code required
   - Auto-scaling

3. Kinesis Data Analytics:
   - SQL queries on streaming data

Pricing (Data Streams):
  - Shard: $0.015/hour = $11/month
  - PUT: $0.014 per 1M records
  - Extended retention (>24h): $0.02/GB/month

Example: 10 shards, 100M records/month
  - Cost: 10 * $11 + 100 * $0.014 = $111.40/month
```

### Monitoring

**CloudWatch** - Monitoring and observability

```yaml
Features:
  - Metrics
  - Logs
  - Alarms
  - Dashboards

Metrics:
  - EC2: CPU, network, disk
  - RDS: connections, IOPS, latency
  - Custom metrics: Application-specific

Logs:
  - Centralized log storage
  - Log groups and streams
  - Insights for querying

Alarms:
  - Trigger on metric thresholds
  - Actions: SNS, Auto-scaling, Lambda

Example Alarm:
Metric: EC2 CPU > 80%
Period: 5 minutes
Action: Send SNS notification + Add EC2 instance

Pricing:
  - Metrics: First 10 custom metrics FREE
  - Logs: $0.50/GB ingested, $0.03/GB stored
  - Alarms: $0.10/alarm/month

Example: 100GB logs/month, 50 alarms
  - Cost: $50 (ingestion) + $3 (storage) + $5 (alarms) = $58/month
```

---

## GCP Services Deep Dive

### Compute

**Compute Engine** - VMs (equivalent to EC2)

```yaml
Pros vs EC2:
  - Sustained use discounts (automatic, up to 30%)
  - Preemptible VMs (80% cheaper)
  - Per-second billing

Pricing (n1-standard-2: 2 vCPU, 7.5GB):
  - On-demand: $0.095/hour = $70/month
  - Sustained use (30 days): $49/month (30% discount automatically)
  - Preemptible: $0.02/hour = $14.60/month (79% discount!)

Preemptible VMs:
  - Can be terminated anytime (24h max)
  - Use for: Batch jobs, fault-tolerant workloads
```

**Cloud Run** - Serverless containers (unique to GCP)

```yaml
Concept: Deploy containers without managing infrastructure
Pros:
  - Automatic HTTPS
  - Auto-scales to 0
  - Pay only for requests
  - Supports any language (unlike Lambda)

Pricing:
  - Requests: $0.40 per 1M requests
  - CPU: $0.00002400 per vCPU-second
  - Memory: $0.00000250 per GB-second

Example: 1M requests, avg 200ms, 512MB
  - Requests: $0.40
  - CPU: 1M * 0.2 * 0.00002400 = $4.80
  - Memory: 1M * 0.2 * 0.5 * 0.00000250 = $0.25
  - Total: $5.45/month

vs Lambda: Similar pricing, but Cloud Run supports long-running requests
```

**Cloud Functions** - Serverless (equivalent to Lambda)

```yaml
Limits:
  - Max execution: 9 minutes
  - Max memory: 8GB

Pricing: Similar to Lambda
```

### Storage

**Cloud Storage** - Object storage (equivalent to S3)

```yaml
Storage Classes:
┌──────────────────┬──────────────┬──────────────┬────────────┐
│     Class        │   Retrieval  │   Use Case   │   Cost     │
├──────────────────┼──────────────┼──────────────┼────────────┤
│ Standard         │   Immediate  │   Hot data   │ $0.020/GB  │
│ Nearline         │   Immediate  │   Monthly    │ $0.010/GB  │
│ Coldline         │   Immediate  │   Quarterly  │ $0.004/GB  │
│ Archive          │   Hours      │   Yearly     │ $0.0012/GB │
└──────────────────┴──────────────┴──────────────┴────────────┘

Cheaper than S3 for standard storage!
  - GCP: $0.020/GB
  - AWS: $0.023/GB
```

### Database

**Cloud SQL** - Managed SQL (equivalent to RDS)

```yaml
Engines: PostgreSQL, MySQL, SQL Server
Pricing: Similar to RDS
```

**Cloud Spanner** - Global distributed SQL

```yaml
Unique to GCP: Globally distributed, horizontally scalable SQL
Features:
  - 99.999% availability
  - Strong consistency globally
  - Automatic sharding
  - SQL interface

Use case:
  - Global applications (gaming, finance)
  - Need ACID + scale

Pricing:
  - $0.90/hour per node = $657/month
  - $0.30/GB/month storage
  - Minimum: 3 nodes = $1,971/month

Expensive but unique offering
```

**Firestore** - NoSQL (equivalent to DynamoDB)

```yaml
Pricing:
  - $0.06 per 100K document reads
  - $0.18 per 100K document writes
  - $0.18/GB/month storage

vs DynamoDB:
  - Simpler pricing (no capacity units)
  - Better for mobile/web (offline sync)
```

**BigQuery** - Data warehouse

```yaml
Unique to GCP: Serverless, petabyte-scale data warehouse
Features:
  - SQL interface
  - Serverless (no cluster management)
  - Columnar storage
  - ML built-in

Pricing:
  - Storage: $0.02/GB/month (active), $0.01/GB (long-term)
  - Queries: $5 per TB scanned
  - Streaming inserts: $0.01 per 200MB

Example: 1TB data, 100GB scanned/month
  - Storage: $20/month
  - Queries: $0.50/month
  - Total: $20.50/month

Use case:
  - Analytics
  - Data warehousing
  - ML training data
```

### AI/ML

**Vertex AI** - Machine learning platform

```yaml
GCP's strength: AI/ML
Features:
  - Pre-trained models (Vision, NLP, Translation)
  - Custom model training
  - AutoML
  - Model deployment

Example: Vision API
  - Label detection
  - Face detection
  - OCR
  - Pricing: $1.50 per 1,000 images

Example: Translation API
  - Pricing: $20 per 1M characters
```

---

## Azure Services Deep Dive

### Compute

**Virtual Machines** - VMs (equivalent to EC2)

**App Service** - PaaS (unique to Azure)

```yaml
Concept: Deploy web apps without managing infrastructure
Supports: .NET, Java, Node.js, Python, PHP

Pricing:
  - Basic: $13/month
  - Standard: $74/month (auto-scaling, custom domains)

Great for: .NET developers, enterprises
```

**Azure Functions** - Serverless (equivalent to Lambda)

**AKS (Azure Kubernetes Service)** - Managed Kubernetes

### Storage

**Blob Storage** - Object storage (equivalent to S3)

```yaml
Tiers:
  - Hot: $0.0184/GB (frequent access)
  - Cool: $0.010/GB (infrequent, min 30 days)
  - Archive: $0.002/GB (rare, min 180 days)

Cheaper than AWS and GCP!
```

### Database

**Azure SQL Database** - Managed SQL (equivalent to RDS)

**Cosmos DB** - Multi-model NoSQL

```yaml
Unique: Supports multiple APIs (SQL, MongoDB, Cassandra, Gremlin)
Features:
  - Global distribution
  - 99.999% availability
  - 5 consistency models
  - <10ms latency

Pricing:
  - $0.008/hour per 100 RU/s = $5.84/month
  - Storage: $0.25/GB/month

Expensive but powerful
```

### Integration

**Azure DevOps** - CI/CD platform

```yaml
Free tier: 5 users, unlimited private repos
Great for: .NET, enterprise teams
```

**Active Directory** - Identity management

```yaml
Azure's strength: Enterprise integration
Features:
  - SSO
  - MFA
  - Hybrid cloud (on-premise + cloud)

Free tier: 50,000 objects
Premium: $6/user/month
```

---

## Cloud vs On-Premise

### Comparison

```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│      Aspect         │       Cloud         │    On-Premise       │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ Initial Cost        │ Low (pay-as-you-go) │ High (capex)        │
│ Operational Cost    │ High (monthly)      │ Low (after setup)   │
│ Scalability         │ Instant             │ Weeks/months        │
│ Maintenance         │ Provider handles    │ You handle          │
│ Control             │ Limited             │ Full control        │
│ Security            │ Shared              │ Full control        │
│ Compliance          │ Varies              │ Full control        │
│ Expertise Required  │ Lower               │ Higher              │
│ Time to Market      │ Fast                │ Slow                │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

### Cost Comparison (3-year horizon)

**Scenario**: Web application, 10 servers (4 vCPU, 16GB each)

**Cloud (AWS)**:
```
Compute:
  - 10 × t3.xlarge (4 vCPU, 16GB): $0.166/hour
  - 10 × $0.166 × 730 hours/month = $1,212/month
  - 3 years: $1,212 × 36 = $43,632

Storage (1TB):
  - EBS: 1000GB × $0.10 = $100/month
  - 3 years: $100 × 36 = $3,600

Total: ~$47,000

With Reserved Instances (40% discount):
  - Total: ~$28,200
```

**On-Premise**:
```
Hardware (10 servers):
  - Dell PowerEdge R640: $3,000 each
  - Total: $30,000
  - 3-year depreciation

Networking:
  - Switches, routers: $10,000

Facility:
  - Power: $500/month × 36 = $18,000
  - Cooling: $300/month × 36 = $10,800
  - Space rental: $1,000/month × 36 = $36,000

Personnel:
  - 1 sysadmin: $120,000/year × 3 = $360,000

Total: ~$465,000

Per server/year: $465,000 / 10 / 3 = $15,500
```

**Break-even**: Cloud is cheaper until ~30 servers for 3+ years

**When to choose cloud**:
- ✅ Startup/small company
- ✅ Variable workloads
- ✅ Fast iteration needed
- ✅ Limited IT staff
- ✅ Global presence needed

**When to choose on-premise**:
- ✅ Large scale (100+ servers, stable)
- ✅ Strict compliance (government, healthcare)
- ✅ Sensitive data
- ✅ Existing infrastructure
- ✅ Predictable workloads

**Hybrid approach** (best of both):
- On-premise: Core systems, databases
- Cloud: Peak capacity, new services, disaster recovery

---

## Cost Estimation

### Framework for Estimating Cloud Costs

**Step 1: Identify Resources**
```
Compute:    X servers, Y CPUs, Z GB RAM
Storage:    A GB data, B GB/month growth
Database:   C GB, D IOPS
Network:    E GB/month data transfer
```

**Step 2: Map to Services**
```
Compute:    EC2 / Fargate / Lambda
Storage:    S3 / EBS
Database:   RDS / DynamoDB
Network:    CloudFront / Data transfer
```

**Step 3: Calculate Monthly Cost**
```
EC2:        10 × t3.large × $0.0832/hour × 730 hours = $607
S3:         1TB × $0.023/GB = $23
RDS:        db.t3.medium × $0.068/hour × 730 = $50
CloudFront: 10TB × $0.085/GB = $850

Total: $1,530/month
```

**Step 4: Optimize**
```
- Reserved Instances: 40% savings → $364 (EC2)
- Lifecycle policies: Move old data to Glacier → $12 (S3)
- Cache layer: Reduce DB queries → $30 (RDS smaller instance)
- CloudFront: 90% cache hit rate → $850 (no change but faster)

Optimized total: $1,256/month (18% savings)
```

### Real Example: Twitter-like App

```
Assumptions:
  - 1M DAU
  - 10M requests/day
  - 100GB new data/day
  - 10TB total storage

AWS Resources:
┌──────────────────────┬─────────────┬──────────────┬──────────────┐
│      Service         │  Quantity   │  Unit Price  │  Monthly     │
├──────────────────────┼─────────────┼──────────────┼──────────────┤
│ EC2 (API servers)    │ 20 × t3.lg  │ $60/month    │ $1,200       │
│ RDS (PostgreSQL)     │ 1 × db.r5.lg│ $175/month   │ $175         │
│ ElastiCache (Redis)  │ 3 nodes     │ $50/node     │ $150         │
│ S3 (media storage)   │ 10TB        │ $230/month   │ $230         │
│ CloudFront (CDN)     │ 30TB        │ $2,550/month │ $2,550       │
│ ALB (load balancer)  │ 1           │ $25/month    │ $25          │
│ NAT Gateway          │ 2           │ $32/month    │ $64          │
│ CloudWatch           │ Logs, alarms│ $50/month    │ $50          │
├──────────────────────┴─────────────┴──────────────┼──────────────┤
│                                        Total       │ $4,444/month │
└────────────────────────────────────────────────────┴──────────────┘

Per user: $4,444 / 1M DAU = $0.004/user/month
```

### Cost Optimization Strategies

**1. Right-sizing**
```
Problem: Using t3.2xlarge (8 vCPU) when only need t3.large (2 vCPU)
Waste: $0.33/hour vs $0.083/hour = $180/month wasted

Solution: Monitor CPU usage, downsize
Tools: AWS Compute Optimizer, CloudWatch
```

**2. Reserved Instances / Savings Plans**
```
1-year RI: 40% discount
3-year RI: 60% discount

Example: 10 × t3.large on-demand = $607/month
         10 × t3.large 1-year RI = $364/month
         Savings: $243/month = $2,916/year
```

**3. Spot Instances**
```
Use for: Batch jobs, stateless workers
Discount: 70-90%

Example: Training ML model
  - On-demand: $3.06/hour (p3.2xlarge)
  - Spot: $0.92/hour
  - Savings: 70%
```

**4. Auto-scaling**
```
Problem: Running 20 servers 24/7 when only need:
  - 20 servers during peak (8am-8pm)
  - 5 servers during off-peak

Solution: Auto-scaling
  - Avg servers: (20 × 12 + 5 × 12) / 24 = 12.5
  - Cost: 12.5 servers vs 20 servers = 37.5% savings
```

**5. Storage Lifecycle**
```
S3 Lifecycle Policy:
  - Day 0-30: Standard ($0.023/GB)
  - Day 30-90: Infrequent Access ($0.0125/GB)
  - Day 90+: Glacier ($0.004/GB)

1TB data, 1-year:
  - All standard: $276
  - With lifecycle: $95
  - Savings: 66%
```

**6. Data Transfer Optimization**
```
Problem: Data transfer OUT is expensive
  - $0.09/GB after first 10GB

Solution:
  - Use CloudFront (cheaper: $0.085/GB + caching)
  - Compress data (save 70%)
  - Keep traffic within same region (free)

Example: 10TB/month data transfer
  - Direct: 10,000GB × $0.09 = $900
  - Via CloudFront: 10,000GB × $0.085 = $850 (+ cache hit rate)
  - Compressed: 3,000GB × $0.085 = $255
  - Savings: 72%
```

---

## Multi-Cloud Strategies

### Why Multi-Cloud?

**Pros**:
- ✅ Avoid vendor lock-in
- ✅ Use best service from each provider (GCP for ML, AWS for breadth)
- ✅ Compliance (data residency)
- ✅ Disaster recovery

**Cons**:
- ❌ Increased complexity
- ❌ Higher costs (no volume discounts)
- ❌ More expertise required
- ❌ Data transfer between clouds expensive

### Multi-Cloud Patterns

**Pattern 1: Primary + DR**
```
┌──────────────────┐
│   AWS (Primary)  │  ← 100% traffic
│   - App servers  │
│   - Databases    │
└────────┬─────────┘
         │ Async replication
┌────────▼─────────┐
│   GCP (DR)       │  ← Standby
│   - Replicated   │
└──────────────────┘

If AWS fails: Failover to GCP
```

**Pattern 2: Service-based**
```
AWS: Compute, storage
  - EC2, S3, RDS

GCP: Data analytics, ML
  - BigQuery, Vertex AI

Azure: Enterprise integration
  - Active Directory, Azure DevOps

API Gateway connects all
```

**Pattern 3: Geographic**
```
US customers → AWS (us-east-1)
EU customers → GCP (europe-west1)
Asia customers → Azure (asia-southeast1)

Benefits:
  - Data residency compliance
  - Lower latency
  - Cost optimization (different pricing per region)
```

### Tools for Multi-Cloud

**Terraform** - Infrastructure as Code
```hcl
# Works across AWS, GCP, Azure
provider "aws" {
  region = "us-east-1"
}

provider "google" {
  project = "my-project"
  region  = "us-central1"
}

# AWS resources
resource "aws_instance" "web" {
  ami           = "ami-12345"
  instance_type = "t3.micro"
}

# GCP resources
resource "google_compute_instance" "web" {
  name         = "web-instance"
  machine_type = "n1-standard-1"
}
```

**Kubernetes** - Container orchestration
```
Run same containers on any cloud:
  - AWS: EKS
  - GCP: GKE
  - Azure: AKS
  - On-premise: Self-managed

Portable workloads!
```

---

## Serverless Architectures

### What is Serverless?

**Definition**: Run code without managing servers

**Key Services**:
- Compute: Lambda, Cloud Functions, Azure Functions
- Storage: S3, Cloud Storage, Blob Storage
- Database: DynamoDB, Firestore, Cosmos DB
- API: API Gateway, Cloud Endpoints
- Messaging: SQS, SNS, Pub/Sub

### Serverless Patterns

**Pattern 1: API Backend**
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼──────────┐
│  API Gateway    │
└──────┬──────────┘
       │
  ┌────┴─────┬────────┐
  │          │        │
┌─▼──────┐ ┌▼──────┐ ┌▼──────┐
│Lambda  │ │Lambda │ │Lambda │
│/users  │ │/posts │ │/login │
└───┬────┘ └───┬───┘ └───┬───┘
    │          │         │
┌───▼──────────▼─────────▼───┐
│       DynamoDB              │
└─────────────────────────────┘

Pros:
  - Zero server management
  - Auto-scales
  - Pay per request
Cons:
  - Cold starts (100-500ms)
  - 15-minute execution limit
  - Harder to debug
```

**Pattern 2: Event Processing**
```
┌─────────────┐
│  S3 Upload  │
└──────┬──────┘
       │ Event trigger
┌──────▼──────────┐
│  Lambda         │
│  (Process)      │
└──────┬──────────┘
       │
┌──────▼──────────┐
│  Write to DB    │
└─────────────────┘

Example: Image processing
1. User uploads image to S3
2. S3 triggers Lambda
3. Lambda: Resize, add watermark
4. Save to S3, update DynamoDB
```

**Pattern 3: Scheduled Jobs**
```
┌────────────────┐
│  EventBridge   │  (Cron: 0 2 * * *)
│  (Scheduler)   │
└────────┬───────┘
         │ Every day at 2am
┌────────▼───────┐
│  Lambda        │
│  (Cleanup)     │
└────────┬───────┘
         │
┌────────▼───────┐
│  Delete old    │
│  records       │
└────────────────┘
```

### Serverless Cost Example

**Scenario**: Image processing service
- 1M images/month
- 2 seconds processing time
- 512MB memory

**Lambda Cost**:
```
Requests: $0.20 per 1M = $0.20
Compute: 1M × 2 sec × $0.0000166667 per GB-sec × 0.5GB = $16.67

Total: $16.87/month
```

**vs EC2**:
```
Assume need 1 server running 24/7
  - t3.medium: $30/month

Serverless savings: $13.13/month (44%)
```

**But if low traffic (10K images/month)**:
```
Lambda: $0.17/month
EC2: $30/month
Serverless savings: $29.83/month (99%!)
```

**Conclusion**: Serverless great for:
- Variable workloads
- Low traffic
- Event-driven

---

## Container Orchestration

### Kubernetes Overview

**What is Kubernetes?**
- Container orchestration platform
- Auto-scaling, self-healing, load balancing
- Cloud-agnostic

**Architecture**:
```
┌────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                      │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                Control Plane                         │ │
│  │  - API Server                                        │ │
│  │  - Scheduler                                         │ │
│  │  - Controller Manager                                │ │
│  │  - etcd (state store)                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                           │                                │
│         ┌─────────────────┼─────────────────┐             │
│         │                 │                 │             │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐    │
│  │   Node 1    │   │   Node 2    │   │   Node 3    │    │
│  │             │   │             │   │             │    │
│  │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │    │
│  │ │  Pod 1  │ │   │ │  Pod 3  │ │   │ │  Pod 5  │ │    │
│  │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │    │
│  │ ┌─────────┐ │   │ ┌─────────┐ │   │ ┌─────────┐ │    │
│  │ │  Pod 2  │ │   │ │  Pod 4  │ │   │ │  Pod 6  │ │    │
│  │ └─────────┘ │   │ └─────────┘ │   │ └─────────┘ │    │
│  └─────────────┘   └─────────────┘   └─────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### Managed Kubernetes Services

**EKS (AWS)**
```yaml
Pros:
  - Deep AWS integration (IAM, VPC, etc.)
  - Fargate support (serverless nodes)
Cons:
  - $0.10/hour per cluster = $73/month (just for control plane)
  - Complex setup

Pricing:
  - Control plane: $73/month
  - Worker nodes: EC2 pricing (e.g., 3 × t3.medium = $90/month)
  - Total: ~$163/month minimum
```

**GKE (GCP)**
```yaml
Pros:
  - Easiest to use
  - Autopilot mode (fully managed)
  - Free control plane (1 zonal cluster)
Cons:
  - GCP-specific

Pricing:
  - Control plane: FREE (zonal), $73/month (regional)
  - Worker nodes: Compute Engine pricing
  - Autopilot: Pay only for pods (easier)
```

**AKS (Azure)**
```yaml
Pros:
  - Free control plane
  - Good Windows container support
Cons:
  - Azure-specific

Pricing:
  - Control plane: FREE
  - Worker nodes: VM pricing
```

### Kubernetes vs Serverless

```
┌──────────────────────┬────────────────────┬─────────────────────┐
│      Aspect          │    Kubernetes      │    Serverless       │
├──────────────────────┼────────────────────┼─────────────────────┤
│ Setup Complexity     │ High               │ Low                 │
│ Operational Load     │ High               │ Very low            │
│ Portability          │ High (any cloud)   │ Low (vendor lock)   │
│ Cold Start           │ None               │ 100-500ms           │
│ Execution Time Limit │ None               │ 15 minutes          │
│ Cost (low traffic)   │ High (always on)   │ Low (pay per use)   │
│ Cost (high traffic)  │ Lower              │ Higher              │
│ Learning Curve       │ Steep              │ Gentle              │
└──────────────────────┴────────────────────┴─────────────────────┘

Use Kubernetes when:
  - Need portability
  - Complex applications
  - Long-running processes
  - High, consistent traffic

Use Serverless when:
  - Simple applications
  - Variable traffic
  - Event-driven
  - Want minimal ops
```

---

## Cloud Design Patterns

### 1. Circuit Breaker

**Problem**: Cascading failures when service is down

**Solution**: Stop calling failing service, fail fast

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN

    def call(self, func):
        if self.state == "OPEN":
            if time.time() - self.last_failure > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise CircuitBreakerOpen()

        try:
            result = func()
            self.failure_count = 0
            self.state = "CLOSED"
            return result
        except Exception as e:
            self.failure_count += 1
            if self.failure_count >= self.failure_threshold:
                self.state = "OPEN"
                self.last_failure = time.time()
            raise
```

### 2. Retry with Exponential Backoff

```python
def retry_with_backoff(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait_time = 2 ** attempt  # 1s, 2s, 4s
            time.sleep(wait_time)
```

### 3. Bulkhead Pattern

**Problem**: One slow component slows entire system

**Solution**: Isolate resources (separate thread pools, rate limits)

```
┌────────────────────────────────────────┐
│          Application                   │
│                                        │
│  ┌──────────┐  ┌──────────┐          │
│  │Thread    │  │Thread    │          │
│  │Pool 1    │  │Pool 2    │          │
│  │(Critical)│  │(Non-crit)│          │
│  └────┬─────┘  └────┬─────┘          │
└───────┼─────────────┼────────────────┘
        │             │
   ┌────▼──┐     ┌────▼──┐
   │DB     │     │ API   │
   └───────┘     └───────┘

If API is slow, doesn't affect DB access
```

---

## Interview Talking Points

**"I would start by asking..."**
- What's the expected scale?
- Do we have cloud expertise?
- Budget constraints?
- Compliance requirements?

**"The key trade-offs are..."**
- **Cloud vs On-Premise**: Flexibility vs cost (at scale)
- **Serverless vs Containers**: Simplicity vs control
- **Multi-cloud vs Single-cloud**: Flexibility vs complexity
- **Managed vs Self-managed**: Ease vs cost

**"For a startup, I would recommend..."**
- Start with serverless (Lambda, DynamoDB)
- Use managed services (RDS, ElastiCache)
- Single cloud (avoid complexity)
- AWS (most services) or GCP (if ML-heavy)

**"For enterprise, I would recommend..."**
- Hybrid cloud (on-premise + cloud)
- Multi-cloud for DR
- Kubernetes for portability
- Reserved instances for cost savings

**"To optimize costs..."**
- Right-size instances (Compute Optimizer)
- Use reserved instances (40% savings)
- Lifecycle policies for storage (66% savings)
- Auto-scaling (37% savings)
- Spot instances for batch jobs (70% savings)

**"For monitoring..."**
- Cost: AWS Cost Explorer, GCP Cost Management
- Performance: CloudWatch, Stackdriver
- Logs: CloudWatch Logs, Cloud Logging
- Traces: X-Ray, Cloud Trace

---

**End of Cloud Integration Section**
