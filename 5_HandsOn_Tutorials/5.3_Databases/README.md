# 5.3 Database Hands-On Tutorials

## Overview

Comprehensive database tutorials covering 7 different database types. Each database has 10 incremental tutorials from basic setup to production-ready deployment on Kubernetes.

## Database Types Covered

### [5.3.1 PostgreSQL](./5.3.1_PostgreSQL/) - Relational Database
**Use Cases**: OLTP, ACID compliance, complex queries, JSON support
- 10 tutorials: Basic → Docker → Replication → Backup → Monitoring → Security → Performance → Clustering → Production → Kubernetes

### [5.3.2 MySQL](./5.3.2_MySQL/) - Relational Database
**Use Cases**: Web applications, read-heavy workloads
- 10 tutorials: Same progression as PostgreSQL

### [5.3.3 MongoDB](./5.3.3_MongoDB/) - Document Database
**Use Cases**: Flexible schema, JSON documents, rapid iteration
- 10 tutorials: Collections → Replica Sets → Sharding → Aggregation → Kubernetes

### [5.3.4 Redis](./5.3.4_Redis/) - In-Memory Data Store
**Use Cases**: Caching, session storage, pub/sub, real-time analytics
- 10 tutorials: Basic → Data structures → Persistence → Clustering → Sentinel → Kubernetes

### [5.3.5 Cassandra](./5.3.5_Cassandra/) - Wide Column Store
**Use Cases**: Time-series data, high write throughput, horizontal scaling
- 10 tutorials: Single node → Cluster → Replication → Consistency → Performance

### [5.3.6 InfluxDB](./5.3.6_InfluxDB/) - Time Series Database
**Use Cases**: Metrics, IoT data, real-time analytics
- 10 tutorials: Basic → Retention policies → Continuous queries → Clustering

### [5.3.7 Neo4j](./5.3.7_Neo4j/) - Graph Database
**Use Cases**: Social networks, recommendation engines, fraud detection
- 10 tutorials: Basic → Cypher → Relationships → Clustering → Kubernetes

## Learning Progression (Common to All Databases)

Each database follows this 10-step progression:

| # | Tutorial | Focus | Environment |
|---|----------|-------|-------------|
| 01 | Basic Setup | Installation, CLI, basic operations | Local |
| 02 | Docker Compose | Containerization, persistence | Docker |
| 03 | Replication | High availability, read replicas | Docker |
| 04 | Backup & Restore | Data safety, disaster recovery | Docker |
| 05 | Monitoring | Metrics, dashboards, alerting | Docker + Prometheus/Grafana |
| 06 | Security | Authentication, encryption, RBAC | Docker |
| 07 | Performance Tuning | Indexing, query optimization, caching | Docker |
| 08 | Clustering | Horizontal scaling, sharding | Docker Compose |
| 09 | Production Ready | Best practices, hardening | Docker |
| 10 | Kubernetes Deployment | Cloud-native, operators, StatefulSets | Kubernetes |

## Quick Start Example (PostgreSQL)

```bash
# Navigate to PostgreSQL tutorial 01
cd 5.3_Databases/5.3.1_PostgreSQL/01_basic_setup

# Read the README
cat README.md

# Follow the step-by-step instructions
```

## Tutorial Structure

Each tutorial contains:

```
XX_topic_name/
├── README.md              # Detailed instructions
├── docker-compose.yml     # Docker Compose configuration
├── config/                # Database configuration files
│   └── *.conf
├── scripts/               # Helper scripts
│   ├── setup.sh
│   ├── seed-data.sql
│   └── cleanup.sh
├── examples/              # Example queries and operations
│   └── operations.sql
└── kubernetes/            # K8s manifests (in tutorial 10)
    ├── statefulset.yaml
    ├── service.yaml
    └── configmap.yaml
```

## Database Comparison

| Database | Type | Best For | ACID | Scalability | Query Language |
|----------|------|----------|------|-------------|----------------|
| PostgreSQL | Relational | Complex queries, ACID | ✅ | Vertical++ | SQL |
| MySQL | Relational | Web apps, read-heavy | ✅ | Vertical+ | SQL |
| MongoDB | Document | Flexible schema, JSON | ⚠️ | Horizontal++ | MongoDB Query |
| Redis | Key-Value | Caching, real-time | ⚠️ | Horizontal+ | Redis Commands |
| Cassandra | Wide Column | Time-series, writes | ❌ | Horizontal+++ | CQL |
| InfluxDB | Time Series | Metrics, IoT | ⚠️ | Horizontal++ | InfluxQL/Flux |
| Neo4j | Graph | Relationships, networks | ✅ | Horizontal+ | Cypher |

## Common Docker Commands

```bash
# Start database
docker-compose up -d

# View logs
docker-compose logs -f

# Stop database
docker-compose down

# Stop and remove volumes (⚠️ deletes data!)
docker-compose down -v

# Execute commands in container
docker-compose exec <service-name> bash

# Restart services
docker-compose restart
```

## Prerequisites

### Required Tools

```bash
# macOS
brew install docker
brew install docker-compose  # If not included with Docker Desktop
brew install postgresql@15   # For psql client
brew install mysql-client    # For mysql client
brew install mongosh         # MongoDB shell
brew install redis           # For redis-cli

# Verify Docker
docker --version
docker-compose --version
```

### Optional Tools

```bash
# Database management GUIs
brew install --cask dbeaver-community      # Universal DB client
brew install --cask pgadmin4               # PostgreSQL
brew install --cask mongodb-compass        # MongoDB
brew install --cask redis-insight          # Redis
```

## Best Practices Covered

Throughout these tutorials, you'll learn:

**Data Persistence**
- Docker volumes for data storage
- Backup and restore strategies
- Point-in-time recovery
- Replication for redundancy

**Security**
- Strong password policies
- SSL/TLS encryption
- Role-based access control (RBAC)
- Network segmentation
- Secrets management

**Performance**
- Indexing strategies
- Query optimization
- Connection pooling
- Caching patterns
- Read replicas

**High Availability**
- Replication (master-slave, master-master)
- Failover automation
- Load balancing
- Clustering
- Disaster recovery

**Monitoring**
- Metrics collection (Prometheus)
- Visualization (Grafana)
- Alerting
- Slow query logging
- Performance insights

**Cloud Native**
- Kubernetes StatefulSets
- Persistent Volume Claims
- Operators (for automation)
- Helm charts
- GitOps deployment

## Recommended Study Path

### Week 1-2: Relational Databases
- **Days 1-5**: PostgreSQL (all 10 tutorials)
- **Days 6-10**: MySQL (all 10 tutorials)
- **Goal**: Master SQL, ACID, transactions, joins

### Week 3: Document & In-Memory
- **Days 1-5**: MongoDB (all 10 tutorials)
- **Days 6-7**: Redis (tutorials 1-7)
- **Goal**: NoSQL patterns, caching strategies

### Week 4: Specialized Databases
- **Days 1-3**: Redis (tutorials 8-10)
- **Days 4-5**: Cassandra (tutorials 1-5)
- **Days 6**: InfluxDB (tutorials 1-3)
- **Days 7**: Neo4j (tutorials 1-3)
- **Goal**: Understanding different data models

### Week 5: Deep Dive Specialization
- Complete remaining tutorials for your chosen specialization
- Build a multi-database application
- Practice Kubernetes deployments

## Database Selection Guide

**Choose PostgreSQL when**:
- Complex queries and joins required
- ACID compliance is critical
- JSON support needed
- Mature ecosystem required

**Choose MySQL when**:
- Read-heavy workloads
- Simple to moderate queries
- Large community support needed
- WordPress or similar platforms

**Choose MongoDB when**:
- Schema flexibility required
- Rapid development cycles
- Hierarchical data
- JSON-native storage needed

**Choose Redis when**:
- Sub-millisecond latency required
- Caching layer needed
- Session storage
- Real-time analytics
- Pub/sub messaging

**Choose Cassandra when**:
- Massive write throughput
- Linear scalability needed
- Multi-datacenter replication
- No single point of failure tolerated

**Choose InfluxDB when**:
- Time-series data (metrics, events)
- IoT data storage
- Real-time analytics
- Automatic data retention

**Choose Neo4j when**:
- Complex relationships matter
- Graph traversal queries
- Social networks
- Recommendation engines
- Fraud detection

## Example: PostgreSQL Basic Setup

```bash
# Tutorial 01: Basic Setup
cd 5.3_Databases/5.3.1_PostgreSQL/01_basic_setup

# Start PostgreSQL
docker-compose up -d

# Connect to database
docker-compose exec postgres psql -U postgres

# Create database
CREATE DATABASE learning;

# Create table
\c learning
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# Insert data
INSERT INTO users (username, email) VALUES ('john', 'john@example.com');

# Query data
SELECT * FROM users;

# Exit
\q

# Cleanup
docker-compose down -v
```

## Tips for Success

1. **One Database at a Time**: Master one database before moving to the next
2. **Practice Daily**: 30-60 minutes daily is better than long sessions weekly
3. **Type Commands**: Build muscle memory by typing, not copy-pasting
4. **Experiment**: Break things, restore from backups, learn from mistakes
5. **Read Documentation**: Official docs are invaluable resources
6. **Join Communities**: Stack Overflow, Reddit, Discord communities
7. **Build Projects**: Apply learning in real projects

## Common Issues & Solutions

**Problem**: Container fails to start
**Solution**:
```bash
# Check logs
docker-compose logs

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

**Problem**: Connection refused
**Solution**:
```bash
# Wait for database to be ready
docker-compose logs -f | grep "ready"

# Check port mappings
docker-compose ps
```

**Problem**: Data lost after restart
**Solution**:
- Ensure volumes are configured in docker-compose.yml
- Use named volumes instead of bind mounts for persistence

## Additional Resources

**PostgreSQL**:
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

**MySQL**:
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MySQL Tutorial](https://www.mysqltutorial.org/)

**MongoDB**:
- [MongoDB Documentation](https://docs.mongodb.com/)
- [MongoDB University](https://university.mongodb.com/)

**Redis**:
- [Redis Documentation](https://redis.io/documentation)
- [Redis University](https://university.redis.com/)

**Cassandra**:
- [Cassandra Documentation](https://cassandra.apache.org/doc/)
- [DataStax Academy](https://academy.datastax.com/)

**InfluxDB**:
- [InfluxDB Documentation](https://docs.influxdata.com/)

**Neo4j**:
- [Neo4j Documentation](https://neo4j.com/docs/)
- [Neo4j GraphAcademy](https://graphacademy.neo4j.com/)

## What You'll Master

After completing all database tutorials:
- ✅ Deploy and manage 7 different database types
- ✅ Understand data modeling for different use cases
- ✅ Implement replication and clustering
- ✅ Set up monitoring and alerting
- ✅ Secure databases following best practices
- ✅ Optimize performance and queries
- ✅ Deploy databases on Kubernetes
- ✅ Choose the right database for your needs

## Next Steps

1. Choose a database to start with (recommend PostgreSQL for beginners)
2. Navigate to the first tutorial
3. Work through all 10 tutorials sequentially
4. Move to the next database
5. Build a multi-database application combining several databases

---

**Total Tutorials**: 70 (7 databases × 10 tutorials each)
**Estimated Total Time**: 100-150 hours
**Difficulty**: Beginner to Advanced
**Cost**: Free (all run locally with Docker)
