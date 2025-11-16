# Tutorial 08: Production ELK Stack - HA, Security, and Scale

## Learning Objectives
- Deploy production-ready ELK cluster
- Configure security and authentication
- Implement high availability
- Scale Elasticsearch cluster
- Monitor ELK stack health
- Apply production best practices

## Production Architecture

```
            ┌─── Load Balancer ───┐
            │                      │
     ┌──────▼────┐         ┌──────▼────┐
     │ Kibana 1  │         │ Kibana 2  │
     └───────────┘         └───────────┘
            │                      │
     ┌──────▼──────────────────────▼────┐
     │    Elasticsearch Cluster          │
     │  ┌────┐  ┌────┐  ┌────┐          │
     │  │ M1 │  │ D1 │  │ D2 │          │
     │  └────┘  └────┘  └────┘          │
     └───────▲──────────────────▲────────┘
             │                   │
        ┌────▼───┐         ┌────▼────┐
        │ LS 1   │         │  LS 2   │
        └────▲───┘         └────▲────┘
             │                   │
        ┌────▼───┐         ┌────▼────┐
        │ Beat 1 │         │ Beat 2  │
        └────────┘         └─────────┘
```

## Step 1: Multi-Node Elasticsearch Cluster

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Master node
  es-master:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: es-master
    environment:
      - node.name=es-master
      - cluster.name=prod-cluster
      - discovery.seed_hosts=es-data1,es-data2
      - cluster.initial_master_nodes=es-master
      - node.roles=master
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
      - xpack.security.enabled=true
      - xpack.security.transport.ssl.enabled=true
      - xpack.security.transport.ssl.verification_mode=certificate
      - ELASTIC_PASSWORD=changeme
    volumes:
      - es-master-data:/usr/share/elasticsearch/data
      - ./certs:/usr/share/elasticsearch/config/certs
    networks:
      - elk
    ulimits:
      memlock:
        soft: -1
        hard: -1

  # Data node 1
  es-data1:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: es-data1
    environment:
      - node.name=es-data1
      - cluster.name=prod-cluster
      - discovery.seed_hosts=es-master,es-data2
      - cluster.initial_master_nodes=es-master
      - node.roles=data,ingest
      - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
      - xpack.security.enabled=true
      - xpack.security.transport.ssl.enabled=true
      - ELASTIC_PASSWORD=changeme
    volumes:
      - es-data1-data:/usr/share/elasticsearch/data
      - ./certs:/usr/share/elasticsearch/config/certs
    networks:
      - elk
    depends_on:
      - es-master

  # Data node 2
  es-data2:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: es-data2
    environment:
      - node.name=es-data2
      - cluster.name=prod-cluster
      - discovery.seed_hosts=es-master,es-data1
      - cluster.initial_master_nodes=es-master
      - node.roles=data,ingest
      - "ES_JAVA_OPTS=-Xms4g -Xmx4g"
      - xpack.security.enabled=true
      - xpack.security.transport.ssl.enabled=true
      - ELASTIC_PASSWORD=changeme
    volumes:
      - es-data2-data:/usr/share/elasticsearch/data
      - ./certs:/usr/share/elasticsearch/config/certs
    networks:
      - elk
    depends_on:
      - es-master

  # Coordinating node (for load balancing)
  es-coord:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: es-coord
    environment:
      - node.name=es-coord
      - cluster.name=prod-cluster
      - discovery.seed_hosts=es-master
      - node.roles=[]
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=changeme
    ports:
      - "9200:9200"
    networks:
      - elk
    depends_on:
      - es-master
      - es-data1
      - es-data2

  # Kibana with HA
  kibana1:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana1
    environment:
      - SERVER_NAME=kibana1
      - ELASTICSEARCH_HOSTS=http://es-coord:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=changeme
      - XPACK_SECURITY_ENABLED=true
    ports:
      - "5601:5601"
    networks:
      - elk
    depends_on:
      - es-coord

  kibana2:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana2
    environment:
      - SERVER_NAME=kibana2
      - ELASTICSEARCH_HOSTS=http://es-coord:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=changeme
    ports:
      - "5602:5601"
    networks:
      - elk
    depends_on:
      - es-coord

  # Logstash with multiple instances
  logstash1:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash1
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
    environment:
      - "LS_JAVA_OPTS=-Xms1g -Xmx1g"
      - ELASTICSEARCH_HOSTS=http://es-coord:9200
      - ELASTICSEARCH_USERNAME=logstash_writer
      - ELASTICSEARCH_PASSWORD=changeme
    ports:
      - "5000:5000"
    networks:
      - elk
    depends_on:
      - es-coord

  logstash2:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash2
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
      - ./logstash/config:/usr/share/logstash/config
    environment:
      - "LS_JAVA_OPTS=-Xms1g -Xmx1g"
      - ELASTICSEARCH_HOSTS=http://es-coord:9200
    ports:
      - "5001:5000"
    networks:
      - elk
    depends_on:
      - es-coord

  # Nginx load balancer for Kibana
  nginx:
    image: nginx:alpine
    container_name: elk-lb
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    networks:
      - elk
    depends_on:
      - kibana1
      - kibana2

volumes:
  es-master-data:
  es-data1-data:
  es-data2-data:

networks:
  elk:
    driver: bridge
```

## Step 2: Security Configuration

```bash
# Generate certificates
docker run --rm -v $(pwd)/certs:/certs \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0 \
  bin/elasticsearch-certutil cert \
  --name security-master \
  --dns es-master,localhost \
  --ip 127.0.0.1 \
  --out /certs/certs.zip

unzip certs/certs.zip -d certs/
```

```yaml
# elasticsearch.yml
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.key: certs/es-master.key
xpack.security.transport.ssl.certificate: certs/es-master.crt
xpack.security.transport.ssl.certificate_authorities: certs/ca.crt

xpack.security.http.ssl.enabled: true
xpack.security.http.ssl.key: certs/es-master.key
xpack.security.http.ssl.certificate: certs/es-master.crt
```

### Create Users and Roles

```bash
# Create custom role
curl -X POST "http://localhost:9200/_security/role/logs_writer" -u elastic:changeme -H 'Content-Type: application/json' -d'
{
  "cluster": ["monitor"],
  "indices": [
    {
      "names": ["logs-*"],
      "privileges": ["write", "create_index", "auto_configure"]
    }
  ]
}
'

# Create user
curl -X POST "http://localhost:9200/_security/user/logstash_writer" -u elastic:changeme -H 'Content-Type: application/json' -d'
{
  "password": "logstash_password",
  "roles": ["logs_writer"],
  "full_name": "Logstash Writer",
  "email": "logstash@example.com"
}
'
```

## Step 3: Nginx Load Balancer

```nginx
# nginx/nginx.conf
upstream kibana_backend {
    least_conn;
    server kibana1:5601 max_fails=3 fail_timeout=30s;
    server kibana2:5601 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name kibana.example.com;

    location / {
        proxy_pass http://kibana_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Step 4: Kubernetes Deployment

```yaml
# elasticsearch-cluster.yaml
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: prod-cluster
  namespace: elastic
spec:
  version: 8.11.0
  nodeSets:
  - name: master
    count: 3
    config:
      node.roles: ["master"]
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 10Gi
        storageClassName: fast-ssd

  - name: data
    count: 3
    config:
      node.roles: ["data", "ingest"]
    volumeClaimTemplates:
    - metadata:
        name: elasticsearch-data
      spec:
        accessModes:
        - ReadWriteOnce
        resources:
          requests:
            storage: 500Gi
        storageClassName: fast-ssd
    podTemplate:
      spec:
        containers:
        - name: elasticsearch
          resources:
            requests:
              memory: 8Gi
              cpu: 2
            limits:
              memory: 8Gi
              cpu: 4
---
apiVersion: kibana.k8s.elastic.co/v1
kind: Kibana
metadata:
  name: kibana
  namespace: elastic
spec:
  version: 8.11.0
  count: 2
  elasticsearchRef:
    name: prod-cluster
```

## Step 5: Monitoring the ELK Stack

```yaml
# Metricbeat monitoring ELK
metricbeat.modules:
- module: elasticsearch
  metricsets:
    - node
    - node_stats
    - index
    - index_recovery
    - index_summary
    - shard
    - ml_job
  period: 10s
  hosts: ["http://localhost:9200"]
  username: "monitoring_user"
  password: "monitoring_password"

- module: kibana
  metricsets:
    - status
  period: 10s
  hosts: ["http://localhost:5601"]

- module: logstash
  metricsets:
    - node
    - node_stats
  period: 10s
  hosts: ["http://localhost:9600"]
```

## Step 6: Cluster Health Checks

```bash
# Cluster health
curl -u elastic:changeme http://localhost:9200/_cluster/health?pretty

# Node info
curl -u elastic:changeme http://localhost:9200/_cat/nodes?v

# Shard allocation
curl -u elastic:changeme http://localhost:9200/_cat/shards?v

# Pending tasks
curl -u elastic:changeme http://localhost:9200/_cat/pending_tasks?v

# Thread pool stats
curl -u elastic:changeme http://localhost:9200/_cat/thread_pool?v

# Disk usage
curl -u elastic:changeme http://localhost:9200/_cat/allocation?v
```

## Step 7: Performance Tuning

### JVM Heap Sizing

```bash
# Set heap to 50% of RAM, max 31GB
ES_JAVA_OPTS=-Xms16g -Xmx16g
```

### Elasticsearch Settings

```yaml
# elasticsearch.yml
bootstrap.memory_lock: true
indices.memory.index_buffer_size: 15%
indices.queries.cache.size: 10%
thread_pool.write.queue_size: 1000
thread_pool.search.queue_size: 1000
```

### Index Settings

```json
PUT _template/optimized_template
{
  "index_patterns": ["logs-*"],
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "30s",
    "codec": "best_compression",
    "translog.durability": "async",
    "translog.sync_interval": "30s"
  }
}
```

## Step 8: Disaster Recovery

### Snapshot Repository

```json
PUT _snapshot/s3_repository
{
  "type": "s3",
  "settings": {
    "bucket": "elasticsearch-snapshots",
    "region": "us-west-2",
    "base_path": "prod-cluster"
  }
}

# Automated snapshots
PUT _slm/policy/daily_snapshots
{
  "schedule": "0 2 * * *",
  "name": "<daily-snap-{now/d}>",
  "repository": "s3_repository",
  "config": {
    "indices": ["*"],
    "ignore_unavailable": true,
    "include_global_state": false
  },
  "retention": {
    "expire_after": "30d",
    "min_count": 5,
    "max_count": 50
  }
}
```

## Step 9: Production Checklist

### Pre-deployment
- [ ] Size cluster appropriately
- [ ] Configure security (SSL/TLS)
- [ ] Set up user authentication
- [ ] Configure network firewall rules
- [ ] Set resource limits (CPU/Memory)
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Plan backup strategy
- [ ] Document runbooks
- [ ] Test failover scenarios

### Post-deployment
- [ ] Verify cluster health
- [ ] Check node roles
- [ ] Test authentication
- [ ] Verify data indexing
- [ ] Check query performance
- [ ] Test alerting
- [ ] Verify backups
- [ ] Monitor resource usage
- [ ] Test restore procedure
- [ ] Update documentation

## Step 10: Common Issues and Solutions

### Split Brain Prevention

```yaml
discovery.zen.minimum_master_nodes: 2  # (N/2) + 1
```

### Unassigned Shards

```bash
# Find why shards are unassigned
GET _cluster/allocation/explain

# Retry allocation
POST _cluster/reroute?retry_failed=true
```

### High Memory Usage

```bash
# Clear field data cache
POST _cache/clear?fielddata=true

# Clear query cache
POST _cache/clear?query=true
```

## Key Takeaways

- ✅ Separate master and data nodes for HA
- ✅ Enable security (SSL/TLS, authentication)
- ✅ Use load balancer for Kibana
- ✅ Monitor cluster health continuously
- ✅ Implement automated snapshots
- ✅ Size JVM heap appropriately
- ✅ Test disaster recovery regularly

## Summary

You've completed the ELK Stack tutorial series! You now know:
- Elasticsearch indexing and querying
- Logstash pipelines and parsing
- Kibana visualization and dashboards
- Beats data shippers
- Log parsing and enrichment
- Index lifecycle management
- Alerting with ElastAlert
- Production cluster deployment

## Next Steps

Explore other monitoring stacks:
- **5.7.3 Loki & Promtail** - Lightweight log aggregation
- **5.7.4 Jaeger** - Distributed tracing
- **5.7.5 OpenTelemetry** - Unified observability

## Additional Resources

- [Elasticsearch Production Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html)
- [ECK Operator](https://www.elastic.co/guide/en/cloud-on-k8s/current/index.html)
- [Elastic Cloud](https://www.elastic.co/cloud/)
- [Community Forums](https://discuss.elastic.co/)
