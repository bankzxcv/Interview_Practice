# Topic 5: Hands-On Tutorials - Build Muscle Memory Through Repetition

## Philosophy

This section is designed for **incremental learning through repetition**. Each tutorial builds on the previous one with small additions, helping you develop strong muscle memory for various technologies.

## Learning Approach

- ✅ **Small Steps**: Each tutorial adds just 1-2 new concepts
- ✅ **Repetition**: You'll repeat similar patterns across different technologies
- ✅ **Hands-On**: All tutorials are practical and runnable
- ✅ **Local First**: Most tutorials run locally (cloud tutorials included for completeness)
- ✅ **Best Practices**: Each tutorial includes production-ready patterns

## Structure

### [5.1 Cloud + Terraform](./5.1_Cloud_Terraform/)
Incremental cloud infrastructure tutorials across all major cloud providers:
- **Azure** - 15 incremental tutorials
- **AWS** - 15 incremental tutorials
- **GCP** - 15 incremental tutorials
- **DigitalOcean** - 10 incremental tutorials
- **Oracle Cloud** - 10 incremental tutorials

### [5.2 Kubernetes (Local)](./5.2_Kubernetes_Local/)
25+ incremental Kubernetes tutorials using local clusters (kind/k3s):
- Start with basic cluster setup
- Add: Deployments → Services → Ingress → ConfigMaps → Secrets → PV/PVC → StatefulSets → DaemonSets → Jobs → CronJobs → RBAC → Network Policies → Helm → Monitoring → Logging → Service Mesh

### [5.3 Databases](./5.3_Databases/)
Incremental database setup and operations:
- PostgreSQL
- MySQL/MariaDB
- MongoDB
- Redis
- Cassandra
- InfluxDB (Time Series)
- Neo4j (Graph DB)

### [5.4 Security](./5.4_Security/)
Security patterns and tools:
- IAM & RBAC
- Secrets Management (Vault, Sealed Secrets)
- Encryption (at rest, in transit)
- SSL/TLS setup
- Security Scanning
- SAST/DAST

### [5.5 Docker & Containers](./5.5_Docker_Containers/)
Container fundamentals:
- Basic containers
- Multi-stage builds
- Docker Compose (incremental)
- Networking
- Volumes & Persistence

### [5.6 CI/CD Pipelines](./5.6_CI_CD/)
Continuous Integration & Deployment:
- GitHub Actions
- GitLab CI
- Jenkins
- ArgoCD (GitOps)
- Flux (GitOps)

### [5.7 Monitoring & Observability](./5.7_Monitoring/)
Monitoring stack tutorials:
- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Loki + Promtail
- Jaeger (Distributed Tracing)
- OpenTelemetry

### [5.8 Message Queues](./5.8_Message_Queues/)
Message broker patterns:
- RabbitMQ
- Apache Kafka
- NATS
- Redis Pub/Sub
- AWS SQS/SNS patterns

### [5.9 Service Mesh](./5.9_Service_Mesh/)
Service mesh implementations:
- Istio
- Linkerd
- Consul Connect

### [5.10 Infrastructure as Code](./5.10_IaC_Tools/)
Additional IaC tools:
- Ansible
- Pulumi
- Helm Charts
- Kustomize

## How to Use This Section

1. **Pick a Technology**: Choose a subsection you want to learn
2. **Start at 01**: Always begin with the first tutorial in a series
3. **Do Each Step**: Don't skip - repetition builds memory
4. **Type It Out**: Don't copy-paste - type the code yourself
5. **Experiment**: After completing a tutorial, modify it
6. **Repeat**: Come back and do it again after a few days

## Best Practice Highlights

Each tutorial includes:
- 📋 **Prerequisites**: What you need before starting
- 🎯 **Learning Objectives**: What you'll learn
- 📝 **Step-by-Step Instructions**: Clear, numbered steps
- 🔍 **Explanation**: Why we're doing each step
- ✅ **Verification**: How to confirm it works
- 🧹 **Cleanup**: How to tear down resources
- 💡 **Best Practices**: Production-ready patterns
- 🚀 **Next Steps**: What to learn next

## Quick Start Examples

### Kubernetes Local
```bash
cd 5.2_Kubernetes_Local/01_basic_cluster
cat README.md
# Follow the instructions
```

### Docker Containers
```bash
cd 5.5_Docker_Containers/01_basic_container
cat README.md
# Follow the instructions
```

### Database (PostgreSQL)
```bash
cd 5.3_Databases/5.3.1_PostgreSQL/01_basic_setup
cat README.md
# Follow the instructions
```

## Progress Tracking

Consider creating a checklist to track your progress:
- [ ] Complete 5.1 Azure (15 tutorials)
- [ ] Complete 5.2 Kubernetes (25 tutorials)
- [ ] Complete 5.3 Databases (all 7 databases)
- [ ] Complete 5.4 Security (all tutorials)
- [ ] Complete 5.5 Docker (all tutorials)
- [ ] Complete 5.6 CI/CD (all tutorials)
- [ ] Complete 5.7 Monitoring (all tutorials)
- [ ] Complete 5.8 Message Queues (all tutorials)
- [ ] Complete 5.9 Service Mesh (all tutorials)
- [ ] Complete 5.10 IaC Tools (all tutorials)

## Tips for Success

1. **Schedule Regular Practice**: 30 minutes daily is better than 5 hours once a week
2. **Focus on One Technology**: Master one section before moving to another
3. **Build Projects**: After tutorials, combine concepts into small projects
4. **Join Communities**: Share your progress, ask questions
5. **Teach Others**: Best way to solidify knowledge

---

**Remember**: The goal isn't to complete all tutorials quickly - it's to build deep, lasting knowledge through repetition and hands-on practice.
