# 5.3.2 MySQL - Complete Tutorial Series

## Overview

This comprehensive MySQL tutorial series takes you from beginner to expert, covering everything from basic setup to production-ready deployments on Kubernetes. Each tutorial is hands-on, practical, and follows industry best practices.

## Tutorial Structure

| # | Tutorial | Duration | Level | Topics Covered |
|---|----------|----------|-------|----------------|
| 01 | [Basic Setup](./01_basic_setup/) | 15-30 min | Beginner | Docker setup, SQL basics, CRUD operations |
| 02 | [Docker Compose](./02_docker_compose/) | 20-30 min | Beginner | Multi-service orchestration, phpMyAdmin, environment vars |
| 03 | [Schema Design](./03_schema_design/) | 30-45 min | Intermediate | Normalization, relationships, indexes, migrations |
| 04 | [Replication](./04_replication/) | 30-45 min | Intermediate | Master-slave setup, read replicas, failover |
| 05 | [Backup & Restore](./05_backup_restore/) | 25-35 min | Intermediate | mysqldump, point-in-time recovery, automation |
| 06 | [Monitoring](./06_monitoring/) | 30-40 min | Intermediate | Prometheus, Grafana, slow queries, metrics |
| 07 | [Security](./07_security/) | 30-40 min | Advanced | SSL/TLS, user management, hardening, compliance |
| 08 | [Performance Tuning](./08_performance_tuning/) | 40-50 min | Advanced | Query optimization, EXPLAIN, indexing, caching |
| 09 | [Clustering](./09_clustering/) | 35-45 min | Advanced | Galera cluster, multi-master, high availability |
| 10 | [Kubernetes](./10_kubernetes_deployment/) | 45-60 min | Expert | StatefulSets, operators, K8s deployment |

**Total Learning Time**: ~5-6 hours

## Learning Path

### Path 1: Application Developer
```
01 → 02 → 03 → 05 → 06
```
Focus on practical database usage for application development.

### Path 2: Database Administrator
```
01 → 02 → 04 → 05 → 06 → 07 → 08 → 09
```
Complete DBA training path.

### Path 3: DevOps/SRE Engineer
```
01 → 02 → 04 → 05 → 06 → 07 → 10
```
Focus on deployment, monitoring, and infrastructure.

### Path 4: Full Stack (Recommended)
```
Complete all tutorials 01 → 10
```
Master MySQL comprehensively.

## Prerequisites

- **System Requirements**:
  - Docker & Docker Compose installed
  - 4GB+ RAM available
  - 20GB+ disk space
  - Linux/macOS/Windows with WSL2

- **Knowledge Requirements**:
  - Basic command line skills
  - Text editor proficiency
  - Basic understanding of databases (helpful but not required)

## Quick Start

```bash
# Clone or navigate to this directory
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.2_MySQL

# Start with tutorial 01
cd 01_basic_setup
docker-compose up -d

# Follow the README.md in each tutorial directory
```

## Key Concepts Covered

### Database Fundamentals
- SQL basics (SELECT, INSERT, UPDATE, DELETE)
- Data types and constraints
- Indexes and primary keys
- Foreign keys and relationships
- Transactions and ACID properties
- Normalization (1NF, 2NF, 3NF)

### MySQL-Specific Features
- InnoDB storage engine
- utf8mb4 character set
- JSON data type
- ON UPDATE CURRENT_TIMESTAMP
- REPLACE and INSERT IGNORE
- Binary logging
- Performance schema

### Operations & Administration
- User management and privileges
- Backup and restore strategies
- Point-in-time recovery
- Replication configuration
- Performance monitoring
- Security hardening
- SSL/TLS encryption

### Advanced Topics
- Query optimization with EXPLAIN
- Index strategies
- Galera clustering
- Multi-master replication
- Kubernetes StatefulSets
- MySQL operators
- Automated backups on K8s

## Technologies Used

- **MySQL**: 8.0 (latest stable)
- **Docker**: For containerization
- **Docker Compose**: Multi-container orchestration
- **phpMyAdmin**: GUI management
- **HAProxy**: Load balancing
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **Kubernetes**: Container orchestration
- **MariaDB Galera**: Clustering solution

## Common Use Cases

This tutorial series prepares you for:

1. **Web Applications**: LAMP/LEMP stack development
2. **E-Commerce**: Product catalogs, order management
3. **Content Management**: WordPress, Drupal backends
4. **Analytics**: Data warehousing with read replicas
5. **SaaS Applications**: Multi-tenant databases
6. **Microservices**: Database per service pattern
7. **Mobile Backends**: API data storage
8. **IoT Applications**: Sensor data storage

## Project Ideas

After completing these tutorials, try building:

1. **E-Commerce Platform**: Products, orders, customers, inventory
2. **Blog Platform**: Posts, comments, users, categories
3. **Social Media**: Users, posts, likes, followers
4. **Task Management**: Projects, tasks, assignments
5. **Inventory System**: Products, warehouses, stock movements
6. **CRM System**: Customers, contacts, deals, activities
7. **Booking System**: Resources, reservations, users
8. **Analytics Dashboard**: Events, metrics, reports

## Troubleshooting Guide

### Common Issues

**Port 3306 already in use**:
```bash
# Check what's using the port
sudo lsof -i :3306
# Stop local MySQL or change port in docker-compose.yml
```

**Container won't start**:
```bash
# Check logs
docker-compose logs mysql
# Remove volumes and restart
docker-compose down -v && docker-compose up -d
```

**Connection refused**:
```bash
# Wait for healthcheck
docker-compose ps
# Check if MySQL is ready
docker-compose logs mysql | grep "ready for connections"
```

**Out of disk space**:
```bash
# Clean up Docker
docker system prune -a --volumes
```

## Best Practices Summary

1. ✅ **Always use InnoDB** storage engine
2. ✅ **Use utf8mb4** character set for full Unicode support
3. ✅ **Create indexes** on foreign keys and WHERE columns
4. ✅ **Use transactions** for related operations
5. ✅ **Implement proper backups** with testing
6. ✅ **Monitor performance** continuously
7. ✅ **Secure credentials** with environment variables/secrets
8. ✅ **Enable SSL/TLS** in production
9. ✅ **Use prepared statements** to prevent SQL injection
10. ✅ **Test failover procedures** before you need them

## Additional Resources

### Official Documentation
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [MySQL Tutorial](https://dev.mysql.com/doc/mysql-tutorial-excerpt/8.0/en/)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)

### Community Resources
- [MySQL on Stack Overflow](https://stackoverflow.com/questions/tagged/mysql)
- [Planet MySQL Blog](https://planet.mysql.com/)
- [Percona Blog](https://www.percona.com/blog/)
- [MySQL Server Team Blog](https://mysqlserverteam.com/)

### Tools
- [MySQL Workbench](https://www.mysql.com/products/workbench/)
- [phpMyAdmin](https://www.phpmyadmin.net/)
- [Adminer](https://www.adminer.org/)
- [DBeaver](https://dbeaver.io/)

### Performance & Optimization
- [MySQL Performance Blog](https://www.percona.com/blog/)
- [Use The Index, Luke!](https://use-the-index-luke.com/)
- [High Performance MySQL Book](https://www.oreilly.com/library/view/high-performance-mysql/9781492080503/)

## Certification Path

After mastering these tutorials, consider:
- **MySQL Developer Certification**
- **MySQL Database Administrator Certification**
- **Oracle Cloud Infrastructure Foundations**

## Contributing

Found an issue or want to improve these tutorials?
- Report bugs or unclear instructions
- Suggest additional examples
- Share your project implementations

## What's Next?

After completing MySQL, explore:
- **5.3.3 MongoDB**: Document-oriented NoSQL database
- **5.3.4 Redis**: In-memory data structure store
- **5.3.5 Cassandra**: Wide-column distributed database
- **5.3.6 InfluxDB**: Time-series database
- **5.3.7 Neo4j**: Graph database

Each database system has different strengths and use cases. Learning multiple databases makes you a well-rounded developer.

---

## Quick Reference

### Connect to MySQL
```bash
# Via docker-compose
docker-compose exec mysql mysql -u root -p

# Via Docker directly
docker exec -it mysql-container mysql -u root -p

# From host (if MySQL client installed)
mysql -h 127.0.0.1 -P 3306 -u root -p
```

### Common Commands
```sql
SHOW DATABASES;                    -- List all databases
USE database_name;                 -- Switch to database
SHOW TABLES;                       -- List all tables
DESCRIBE table_name;               -- Show table structure
SHOW CREATE TABLE table_name;      -- Show CREATE statement
SHOW PROCESSLIST;                  -- Show running queries
EXPLAIN SELECT...;                 -- Analyze query
```

### Docker Compose Commands
```bash
docker-compose up -d               -- Start services
docker-compose down                -- Stop services
docker-compose down -v             -- Stop and remove volumes
docker-compose logs -f mysql       -- Follow logs
docker-compose ps                  -- List services
docker-compose restart mysql       -- Restart service
```

---

**Happy Learning!** 🚀

Start with [Tutorial 01: Basic Setup](./01_basic_setup/) →
