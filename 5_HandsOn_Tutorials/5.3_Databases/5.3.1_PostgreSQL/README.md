# PostgreSQL Hands-On Tutorials

## Overview

This comprehensive tutorial series takes you from PostgreSQL basics to production-ready deployments on Kubernetes. Each tutorial builds on previous knowledge, providing hands-on experience with real-world scenarios.

**Total Time**: 8-12 hours
**Difficulty**: Beginner to Advanced
**Prerequisites**: Docker, basic SQL knowledge

## Tutorial Structure

| # | Tutorial | Focus | Duration | Difficulty |
|---|----------|-------|----------|------------|
| 01 | [Basic Setup](./01_basic_setup/) | Docker, psql, CRUD operations | 30 min | Beginner |
| 02 | [Docker Compose](./02_docker_compose/) | Multi-container, pgAdmin | 45 min | Beginner |
| 03 | [Schema Design](./03_schema_design/) | Tables, relationships, indexes | 60 min | Intermediate |
| 04 | [Replication](./04_replication/) | Master-slave, streaming replication | 60 min | Intermediate |
| 05 | [Backup & Restore](./05_backup_restore/) | pg_dump, PITR, WAL archiving | 60 min | Intermediate |
| 06 | [Monitoring](./06_monitoring/) | pg_stat, Prometheus, Grafana | 60 min | Intermediate |
| 07 | [Security](./07_security/) | Users, roles, SSL, RLS | 60 min | Advanced |
| 08 | [Performance Tuning](./08_performance_tuning/) | EXPLAIN, indexes, optimization | 60 min | Advanced |
| 09 | [Clustering](./09_clustering/) | Patroni, etcd, HAProxy | 75 min | Advanced |
| 10 | [Kubernetes](./10_kubernetes_deployment/) | StatefulSets, operators | 90 min | Advanced |

## Learning Path

### Week 1: Foundations (Tutorials 01-03)
**Goal**: Master PostgreSQL basics and schema design

- **Day 1-2**: Tutorial 01 - Basic Setup
  - Install PostgreSQL with Docker
  - Learn psql commands
  - CRUD operations

- **Day 3-4**: Tutorial 02 - Docker Compose
  - Multi-container setup
  - pgAdmin web interface
  - Environment configuration

- **Day 5-7**: Tutorial 03 - Schema Design
  - Database normalization
  - Foreign keys and relationships
  - Indexing strategies

### Week 2: High Availability (Tutorials 04-06)
**Goal**: Implement production-ready HA setup

- **Day 1-2**: Tutorial 04 - Replication
  - Streaming replication
  - Read replicas
  - Failover testing

- **Day 3-4**: Tutorial 05 - Backup & Restore
  - Logical backups (pg_dump)
  - Physical backups
  - Point-in-time recovery

- **Day 5-7**: Tutorial 06 - Monitoring
  - pg_stat views
  - Prometheus + Grafana
  - Alerting

### Week 3: Security & Performance (Tutorials 07-08)
**Goal**: Secure and optimize PostgreSQL

- **Day 1-3**: Tutorial 07 - Security
  - User management
  - Row-level security
  - SSL/TLS encryption
  - Audit logging

- **Day 4-7**: Tutorial 08 - Performance Tuning
  - Query optimization
  - EXPLAIN ANALYZE
  - Index design
  - Configuration tuning

### Week 4: Production Deployment (Tutorials 09-10)
**Goal**: Deploy PostgreSQL at scale

- **Day 1-4**: Tutorial 09 - Clustering
  - Patroni setup
  - Automatic failover
  - Load balancing
  - Distributed consensus

- **Day 5-7**: Tutorial 10 - Kubernetes
  - StatefulSets
  - PostgreSQL Operator
  - Cloud-native deployment
  - Production best practices

## Quick Start

### Option 1: Start from Beginning
```bash
cd 01_basic_setup
docker-compose up -d
cat README.md
```

### Option 2: Jump to Specific Tutorial
```bash
# Prerequisites: Complete previous tutorials
cd 05_backup_restore
docker-compose up -d
cat README.md
```

### Option 3: Quick Production Setup
```bash
# Skip to advanced topics
cd 09_clustering
docker-compose up -d
# Follow README for cluster setup
```

## What You'll Learn

### Core PostgreSQL
- ✅ SQL fundamentals (SELECT, INSERT, UPDATE, DELETE)
- ✅ Advanced queries (JOINs, subqueries, CTEs, window functions)
- ✅ Data types and constraints
- ✅ Transactions and ACID properties
- ✅ Functions and triggers

### Schema Design
- ✅ Database normalization (1NF, 2NF, 3NF, BCNF)
- ✅ Entity-relationship modeling
- ✅ Foreign keys and constraints
- ✅ Index strategies
- ✅ Real-world schema design (e-commerce example)

### High Availability
- ✅ Streaming replication
- ✅ Automatic failover
- ✅ Read replicas
- ✅ Load balancing
- ✅ Split-brain prevention

### Backup & Recovery
- ✅ Logical backups (pg_dump/pg_restore)
- ✅ Physical backups (pg_basebackup)
- ✅ Point-in-time recovery (PITR)
- ✅ WAL archiving
- ✅ Backup automation

### Monitoring & Observability
- ✅ pg_stat views
- ✅ Slow query logging
- ✅ Prometheus metrics
- ✅ Grafana dashboards
- ✅ Alert configuration

### Security
- ✅ User and role management
- ✅ Row-level security (RLS)
- ✅ SSL/TLS encryption
- ✅ Password policies
- ✅ Audit logging

### Performance
- ✅ Query optimization
- ✅ EXPLAIN ANALYZE
- ✅ Index design and maintenance
- ✅ Configuration tuning
- ✅ Connection pooling

### Cloud Native
- ✅ Docker containerization
- ✅ Kubernetes StatefulSets
- ✅ PostgreSQL Operators
- ✅ Cloud deployment
- ✅ GitOps practices

## Prerequisites

### Required
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Command Line**: Basic shell knowledge
- **Text Editor**: VS Code, vim, or similar

### Optional (for later tutorials)
- **Kubernetes**: minikube, kind, or cloud cluster
- **kubectl**: Kubernetes CLI
- **Helm**: Package manager for Kubernetes
- **psql client**: PostgreSQL command-line tool

### Installation Guides

**macOS**:
```bash
# Install Docker Desktop
brew install --cask docker

# Install PostgreSQL client
brew install postgresql@15

# Install kubectl and Helm (for tutorial 10)
brew install kubectl helm
```

**Linux (Ubuntu/Debian)**:
```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Install PostgreSQL client
sudo apt-get install postgresql-client-15

# Install kubectl and Helm
sudo snap install kubectl --classic
sudo snap install helm --classic
```

**Windows**:
- Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
- Install WSL2 for better performance
- Install PostgreSQL client or use Docker for all commands

## Common Commands Reference

### Docker
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f postgres

# Stop services
docker-compose down

# Remove volumes (⚠️ deletes data)
docker-compose down -v

# Execute psql
docker-compose exec postgres psql -U postgres
```

### PostgreSQL (psql)
```sql
-- List databases
\l

-- Connect to database
\c database_name

-- List tables
\dt

-- Describe table
\d table_name

-- List users
\du

-- Execute SQL file
\i filename.sql

-- Quit
\q
```

### Kubernetes
```bash
# Apply manifests
kubectl apply -f postgres-statefulset.yaml

# Get resources
kubectl get pods
kubectl get pvc
kubectl get svc

# Describe resource
kubectl describe pod postgres-0

# View logs
kubectl logs postgres-0

# Execute command
kubectl exec -it postgres-0 -- psql -U postgres

# Port forward
kubectl port-forward postgres-0 5432:5432
```

## Troubleshooting Guide

### Container Won't Start
```bash
# Check logs
docker-compose logs postgres

# Remove old volumes
docker-compose down -v
docker-compose up -d

# Verify port is available
sudo lsof -i :5432
```

### Connection Refused
```bash
# Wait for healthcheck
docker-compose ps

# Verify network
docker network ls
docker network inspect <network_name>

# Test connectivity
docker-compose exec postgres pg_isready
```

### Data Persistence Issues
```bash
# Check volume exists
docker volume ls

# Inspect volume
docker volume inspect <volume_name>

# Ensure volume is mounted
docker-compose exec postgres df -h /var/lib/postgresql/data
```

### Performance Issues
```sql
-- Check active queries
SELECT * FROM pg_stat_activity WHERE state != 'idle';

-- Check table bloat
SELECT schemaname, tablename, n_dead_tup, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- Run VACUUM
VACUUM ANALYZE;
```

## Best Practices Covered

### Development
- Use Docker for consistent environments
- Version control database schemas
- Use migrations for schema changes
- Test on production-like data

### Operations
- Regular backups (3-2-1 rule)
- Monitor replication lag
- Set up alerting
- Document runbooks

### Security
- Never commit credentials
- Use strong passwords
- Enable SSL in production
- Implement least privilege
- Regular security audits

### Performance
- Index foreign keys
- Use appropriate data types
- Regular VACUUM and ANALYZE
- Monitor slow queries
- Connection pooling

## Additional Resources

### Official Documentation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/15/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

### Books
- "PostgreSQL: Up and Running" by Regina Obe & Leo Hsu
- "The Art of PostgreSQL" by Dimitri Fontaine
- "PostgreSQL High Performance" by Gregory Smith

### Online Courses
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Udemy PostgreSQL Courses](https://www.udemy.com/topic/postgresql/)
- [Pluralsight PostgreSQL Path](https://www.pluralsight.com/)

### Community
- [PostgreSQL Slack](https://postgres-slack.herokuapp.com/)
- [Reddit /r/PostgreSQL](https://www.reddit.com/r/PostgreSQL/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/postgresql)
- [PostgreSQL Mailing Lists](https://www.postgresql.org/list/)

### Tools
- [pgAdmin](https://www.pgadmin.org/) - Web-based administration
- [DBeaver](https://dbeaver.io/) - Universal database tool
- [pgBouncer](https://www.pgbouncer.org/) - Connection pooler
- [pgBackRest](https://pgbackrest.org/) - Backup solution
- [pg_stat_statements](https://www.postgresql.org/docs/15/pgstatstatements.html) - Query performance

## Contributing

Found an issue or want to improve a tutorial?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

- **Issues**: Open a GitHub issue
- **Questions**: Use discussion board
- **Email**: [Your contact information]

## License

These tutorials are provided as educational material. PostgreSQL is licensed under the PostgreSQL License.

---

## Next Steps After Completion

**1. Build Real Projects**
- Multi-tenant SaaS application
- E-commerce platform
- Real-time analytics dashboard
- IoT data platform

**2. Advanced Topics**
- Partitioning and sharding
- Foreign Data Wrappers (FDW)
- Full-text search
- PostGIS for geospatial data
- TimescaleDB for time-series

**3. Certifications**
- PostgreSQL Associate Certification
- AWS RDS Specialty
- Google Cloud Professional Database Engineer

**4. Contribute to Open Source**
- PostgreSQL core
- PostgreSQL extensions
- Client libraries
- Tools and utilities

---

**Happy Learning! 🚀**

Start with [Tutorial 01: Basic Setup](./01_basic_setup/) and work your way through to become a PostgreSQL expert!
