# Tutorial 10: MySQL on Kubernetes

## Objectives

- Deploy MySQL on Kubernetes with StatefulSets
- Configure persistent volumes for data
- Implement MySQL replication on K8s
- Use Kubernetes operators for management
- Implement backup and restore on K8s
- Handle scaling and failover

## Prerequisites

- Kubernetes cluster (minikube, kind, or cloud provider)
- kubectl installed
- Basic Kubernetes knowledge
- Completed previous MySQL tutorials

## Why MySQL on Kubernetes?

**Benefits**:
- Automated deployment and scaling
- Self-healing capabilities
- Declarative configuration
- Rolling updates
- Resource management
- Service discovery

**Challenges**:
- Stateful application complexity
- Data persistence requirements
- Network latency considerations
- Backup/restore procedures

## Basic MySQL Deployment

### 1. Create Namespace

**namespace.yaml**:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mysql
```

### 2. Create Secret

**secret.yaml**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
  namespace: mysql
type: Opaque
stringData:
  MYSQL_ROOT_PASSWORD: "rootpass123"
  MYSQL_DATABASE: "mydb"
  MYSQL_USER: "appuser"
  MYSQL_PASSWORD: "apppass123"
```

### 3. Create PersistentVolumeClaim

**pvc.yaml**:
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
  namespace: mysql
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: standard  # Use your storage class
```

### 4. Create ConfigMap

**configmap.yaml**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: mysql-config
  namespace: mysql
data:
  my.cnf: |
    [mysqld]
    default-authentication-plugin=mysql_native_password
    character-set-server=utf8mb4
    collation-server=utf8mb4_unicode_ci
    max_connections=200
    innodb_buffer_pool_size=1G
```

### 5. Create Deployment

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
  namespace: mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
          name: mysql
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_ROOT_PASSWORD
        - name: MYSQL_DATABASE
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_DATABASE
        - name: MYSQL_USER
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_USER
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_PASSWORD
        volumeMounts:
        - name: mysql-storage
          mountPath: /var/lib/mysql
        - name: mysql-config
          mountPath: /etc/mysql/conf.d
        livenessProbe:
          exec:
            command:
            - mysqladmin
            - ping
            - -h
            - localhost
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - mysqladmin
            - ping
            - -h
            - localhost
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
      volumes:
      - name: mysql-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
      - name: mysql-config
        configMap:
          name: mysql-config
```

### 6. Create Service

**service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
  namespace: mysql
spec:
  ports:
  - port: 3306
    targetPort: 3306
  selector:
    app: mysql
  clusterIP: None  # Headless service for StatefulSet
---
apiVersion: v1
kind: Service
metadata:
  name: mysql-external
  namespace: mysql
spec:
  type: LoadBalancer  # or NodePort
  ports:
  - port: 3306
    targetPort: 3306
  selector:
    app: mysql
```

## StatefulSet for MySQL Replication

**statefulset.yaml**:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: mysql
spec:
  serviceName: mysql
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      initContainers:
      - name: init-mysql
        image: mysql:8.0
        command:
        - bash
        - "-c"
        - |
          set -ex
          # Generate server-id from pod ordinal index
          [[ $(hostname) =~ -([0-9]+)$ ]] || exit 1
          ordinal=${BASH_REMATCH[1]}
          echo [mysqld] > /mnt/conf.d/server-id.cnf
          echo server-id=$((100 + $ordinal)) >> /mnt/conf.d/server-id.cnf
          # Master is pod-0, replicas are others
          if [[ $ordinal -eq 0 ]]; then
            cp /mnt/config-map/master.cnf /mnt/conf.d/
          else
            cp /mnt/config-map/replica.cnf /mnt/conf.d/
          fi
        volumeMounts:
        - name: conf
          mountPath: /mnt/conf.d
        - name: config-map
          mountPath: /mnt/config-map
      - name: clone-mysql
        image: gcr.io/google-samples/xtrabackup:1.0
        command:
        - bash
        - "-c"
        - |
          set -ex
          # Skip clone for pod-0 (master)
          [[ $(hostname) =~ -([0-9]+)$ ]] || exit 1
          ordinal=${BASH_REMATCH[1]}
          [[ $ordinal -eq 0 ]] && exit 0
          # Clone from previous pod
          ncat --recv-only mysql-$(($ordinal-1)).mysql 3307 | xbstream -x -C /var/lib/mysql
          xtrabackup --prepare --target-dir=/var/lib/mysql
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
          subPath: mysql
        - name: conf
          mountPath: /etc/mysql/conf.d
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: MYSQL_ROOT_PASSWORD
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
          subPath: mysql
        - name: conf
          mountPath: /etc/mysql/conf.d
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
        livenessProbe:
          exec:
            command: ["mysqladmin", "ping"]
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
        readinessProbe:
          exec:
            command: ["mysql", "-h", "127.0.0.1", "-e", "SELECT 1"]
          initialDelaySeconds: 5
          periodSeconds: 2
          timeoutSeconds: 1
      - name: xtrabackup
        image: gcr.io/google-samples/xtrabackup:1.0
        ports:
        - containerPort: 3307
          name: xtrabackup
        command:
        - bash
        - "-c"
        - |
          set -ex
          cd /var/lib/mysql
          if [[ -f xtrabackup_slave_info && "x$(<xtrabackup_slave_info)" != "x" ]]; then
            cat xtrabackup_slave_info | sed -E 's/;$//g' > change_master_to.sql.in
            rm -f xtrabackup_slave_info xtrabackup_binlog_info
          elif [[ -f xtrabackup_binlog_info ]]; then
            [[ $(cat xtrabackup_binlog_info) =~ ^(.*?)[[:space:]]+(.*?)$ ]] || exit 1
            rm -f xtrabackup_binlog_info xtrabackup_slave_info
            echo "CHANGE MASTER TO MASTER_LOG_FILE='${BASH_REMATCH[1]}',\
                  MASTER_LOG_POS=${BASH_REMATCH[2]}" > change_master_to.sql.in
          fi
          if [[ -f change_master_to.sql.in ]]; then
            echo "Waiting for mysqld to be ready (accepting connections)"
            until mysql -h 127.0.0.1 -e "SELECT 1"; do sleep 1; done
            echo "Initializing replication from clone position"
            mysql -h 127.0.0.1 \
                  -e "$(<change_master_to.sql.in), \
                          MASTER_HOST='mysql-0.mysql', \
                          MASTER_USER='root', \
                          MASTER_PASSWORD='${MYSQL_ROOT_PASSWORD}', \
                          MASTER_CONNECT_RETRY=10; \
                        START SLAVE;" || exit 1
            mv change_master_to.sql.in change_master_to.sql.orig
          fi
          exec ncat --listen --keep-open --send-only --max-conns=1 3307 -c \
            "xtrabackup --backup --slave-info --stream=xbstream --host=127.0.0.1 --user=root"
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
          subPath: mysql
        - name: conf
          mountPath: /etc/mysql/conf.d
        resources:
          requests:
            cpu: 100m
            memory: 100Mi
      volumes:
      - name: conf
        emptyDir: {}
      - name: config-map
        configMap:
          name: mysql-config
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

## Deploy MySQL

```bash
# Apply all manifests
kubectl apply -f namespace.yaml
kubectl apply -f secret.yaml
kubectl apply -f configmap.yaml
kubectl apply -f pvc.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check deployment
kubectl get all -n mysql

# Check pods
kubectl get pods -n mysql -w

# Check persistent volumes
kubectl get pvc -n mysql
```

## Connect to MySQL

```bash
# From within cluster
kubectl run -it --rm --image=mysql:8.0 --restart=Never mysql-client -n mysql -- \
  mysql -h mysql -u root -prootpass123

# Port forward to local machine
kubectl port-forward -n mysql svc/mysql 3306:3306

# Connect from localhost
mysql -h 127.0.0.1 -P 3306 -u root -prootpass123
```

## MySQL Operator (Recommended)

### Using MySQL Operator by Oracle

```bash
# Install the operator
kubectl apply -f https://raw.githubusercontent.com/mysql/mysql-operator/trunk/deploy/deploy-crds.yaml
kubectl apply -f https://raw.githubusercontent.com/mysql/mysql-operator/trunk/deploy/deploy-operator.yaml

# Create MySQL cluster
cat <<EOF | kubectl apply -f -
apiVersion: mysql.oracle.com/v2
kind: InnoDBCluster
metadata:
  name: mysql-cluster
  namespace: mysql
spec:
  secretName: mysql-secret
  tlsUseSelfSigned: true
  instances: 3
  router:
    instances: 1
  datadirVolumeClaimTemplate:
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: 10Gi
EOF

# Check cluster
kubectl get innodbcluster -n mysql
kubectl get pods -n mysql
```

## Backup on Kubernetes

**cronjob-backup.yaml**:
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: mysql-backup
  namespace: mysql
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: mysql:8.0
            command:
            - /bin/sh
            - -c
            - |
              mysqldump -h mysql -u root -p${MYSQL_ROOT_PASSWORD} \
                --all-databases --single-transaction \
                | gzip > /backup/mysql-$(date +%Y%m%d-%H%M%S).sql.gz
            env:
            - name: MYSQL_ROOT_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: mysql-secret
                  key: MYSQL_ROOT_PASSWORD
            volumeMounts:
            - name: backup
              mountPath: /backup
          restartPolicy: OnFailure
          volumes:
          - name: backup
            persistentVolumeClaim:
              claimName: mysql-backup-pvc
```

## Monitoring on Kubernetes

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-exporter
  namespace: mysql
  labels:
    app: mysql-exporter
spec:
  ports:
  - port: 9104
    targetPort: 9104
  selector:
    app: mysql-exporter
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql-exporter
  namespace: mysql
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mysql-exporter
  template:
    metadata:
      labels:
        app: mysql-exporter
    spec:
      containers:
      - name: mysql-exporter
        image: prom/mysqld-exporter:latest
        env:
        - name: DATA_SOURCE_NAME
          value: "root:rootpass123@(mysql:3306)/"
        ports:
        - containerPort: 9104
```

## Best Practices

1. **Use StatefulSets** for MySQL replication
2. **Use MySQL Operator** for production
3. **Implement proper resource limits**
4. **Use PersistentVolumes** with backups
5. **Enable monitoring** with Prometheus
6. **Implement automated backups**
7. **Use secrets** for credentials
8. **Configure liveness/readiness** probes
9. **Use headless services** for StatefulSets
10. **Test disaster recovery** procedures

## Cleanup

```bash
# Delete all resources
kubectl delete namespace mysql

# Or delete individual resources
kubectl delete -f .
```

## Next Steps

You've completed all 10 MySQL tutorials! You now have:
- ✅ Basic setup and operations
- ✅ Docker Compose orchestration
- ✅ Schema design expertise
- ✅ Replication configuration
- ✅ Backup/restore procedures
- ✅ Monitoring with Prometheus/Grafana
- ✅ Security hardening
- ✅ Performance tuning
- ✅ Clustering with Galera
- ✅ Kubernetes deployment

**Next**: Explore other databases in Section 5.3 (MongoDB, Redis, Cassandra, InfluxDB, Neo4j)

---

**Congratulations!** You're now a MySQL expert ready for production deployments!
