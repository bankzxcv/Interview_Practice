# Kubernetes Tutorial 03: Deployment with Service

## 🎯 Learning Objectives

- Understand Kubernetes Services and why they're needed
- Learn about different Service types (ClusterIP, NodePort)
- Expose applications within the cluster
- Access applications from outside the cluster
- Understand service discovery and DNS
- Learn about endpoints and how services route traffic

## 📋 Prerequisites

- Completed [02_cluster_with_deployment](../02_cluster_with_deployment/)
- kind cluster "learning" is running
- kubectl configured to use kind-learning context
- Basic understanding of Deployments and Pods

## 📝 What We're Building

```
External Traffic
       ↓
   NodePort Service (30080)
       ↓
   ClusterIP Service (80)
       ↓
   Load Balanced to Pods
   ├── Pod 1 (10.244.0.5)
   ├── Pod 2 (10.244.0.6)
   └── Pod 3 (10.244.0.7)
```

## 🔍 Concepts Introduced

### 1. **Why Services?**
**Problem**: Pods are ephemeral
- Pods can die and be recreated with new IP addresses
- Can't rely on Pod IPs for communication
- Need stable endpoint for accessing pods

**Solution**: Services provide:
- Stable IP address
- DNS name
- Load balancing across pods
- Service discovery

### 2. **Service Types**

**ClusterIP** (default):
- Accessible only within cluster
- Gets internal IP address
- Used for internal service-to-service communication
- Most common service type

**NodePort**:
- Exposes service on each Node's IP at a static port
- Accessible from outside cluster
- Port range: 30000-32767
- Routes to ClusterIP service

**LoadBalancer**:
- Creates external load balancer (cloud provider)
- Not available in kind without additional setup
- Routes to NodePort service

**ExternalName**:
- Maps service to DNS name
- No proxying, just DNS CNAME
- Used for accessing external services

### 3. **Service Discovery**

**By DNS** (recommended):
- Service name resolves to service IP
- Format: `<service-name>.<namespace>.svc.cluster.local`
- Short form: `<service-name>` (same namespace)

**By Environment Variables**:
- Kubernetes injects service info as env vars
- Legacy method, DNS is better

## 📁 Step-by-Step Implementation

### Step 1: Create Deployment

First, let's create our nginx deployment:

```bash
# Apply deployment
kubectl apply -f manifests/01-nginx-deployment.yaml

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=nginx --timeout=60s

# Get pods with IPs
kubectl get pods -o wide
```

**Note the Pod IPs** - they're internal and will change if pods restart.

### Step 2: Try Accessing Pods Directly (The Problem)

```bash
# Get pod name and IP
POD_NAME=$(kubectl get pods -l app=nginx -o jsonpath='{.items[0].metadata.name}')
POD_IP=$(kubectl get pod $POD_NAME -o jsonpath='{.status.podIP}')

echo "Pod Name: $POD_NAME"
echo "Pod IP: $POD_IP"

# Try to access pod from outside cluster
curl $POD_IP
# This won't work from your machine - pod IPs are internal only!

# Access from another pod (to show it works inside cluster)
kubectl run curl-test --image=curlimages/curl:8.5.0 -i --tty --rm -- curl http://$POD_IP
# This works! But the IP will change if pod restarts
```

**The problem**:
1. Pod IPs are not accessible from outside cluster
2. Pod IPs change when pods restart
3. No load balancing across multiple pods

### Step 3: Create ClusterIP Service

```bash
# Apply ClusterIP service
kubectl apply -f manifests/02-nginx-service-clusterip.yaml

# Get service
kubectl get service nginx-service
# or
kubectl get svc nginx-service
```

**Expected Output**:
```
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
nginx-service   ClusterIP   10.96.123.45    <none>        80/TCP    5s
```

**Explore the service**:

```bash
# Describe service
kubectl describe service nginx-service

# Get service endpoints (pod IPs)
kubectl get endpoints nginx-service

# Get service in YAML format
kubectl get service nginx-service -o yaml
```

### Step 4: Test ClusterIP Service

```bash
# Get service IP
SERVICE_IP=$(kubectl get service nginx-service -o jsonpath='{.spec.clusterIP}')
echo "Service IP: $SERVICE_IP"

# Test from within cluster using a temporary pod
kubectl run curl-test --image=curlimages/curl:8.5.0 -i --tty --rm -- curl http://$SERVICE_IP
# Success! Service routes to pods

# Test using service DNS name
kubectl run curl-test --image=curlimages/curl:8.5.0 -i --tty --rm -- curl http://nginx-service
# Works! DNS resolves to service IP

# Full DNS name
kubectl run curl-test --image=curlimages/curl:8.5.0 -i --tty --rm -- curl http://nginx-service.default.svc.cluster.local
# Also works!
```

**Key Points**:
- Service IP is stable (doesn't change)
- DNS name resolves to service
- Traffic is load balanced to all pods
- Still only accessible within cluster

### Step 5: Test Load Balancing

Deploy a custom nginx with pod info:

```bash
# Apply deployment with pod info
kubectl apply -f manifests/03-nginx-deployment-hostname.yaml

# Wait for rollout
kubectl rollout status deployment/nginx-deployment

# Test load balancing (run multiple times)
for i in {1..10}; do
  kubectl run curl-test-$i --image=curlimages/curl:8.5.0 --rm -i --restart=Never -- curl -s http://nginx-service | grep "Server name:"
done
```

You should see different pod names, showing traffic is load balanced!

### Step 6: Create NodePort Service

Now let's expose the service outside the cluster:

```bash
# Apply NodePort service (replaces ClusterIP)
kubectl apply -f manifests/04-nginx-service-nodeport.yaml

# Get service
kubectl get service nginx-service
```

**Expected Output**:
```
NAME            TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
nginx-service   NodePort   10.96.123.45    <none>        80:30080/TCP   1m
```

**Note**: Port format is `<ClusterIP-Port>:<NodePort>`

### Step 7: Access via NodePort

```bash
# Get node port
NODE_PORT=$(kubectl get service nginx-service -o jsonpath='{.spec.ports[0].nodePort}')
echo "NodePort: $NODE_PORT"

# Access from your machine (kind maps ports to localhost)
curl http://localhost:$NODE_PORT

# Or if you set the specific port (30080) as in our manifest:
curl http://localhost:30080
```

**Success!** You can now access the service from outside the cluster.

```bash
# Test load balancing from outside
for i in {1..5}; do
  curl -s http://localhost:30080 | grep "Server name:"
done
```

### Step 8: Explore Service Discovery

```bash
# Create a debug pod
kubectl run debug-pod --image=nicolaka/netshoot:latest -i --tty

# Inside the pod, try these commands:
# (Run this in the interactive shell)
```

Inside the debug pod:
```bash
# Resolve service DNS
nslookup nginx-service

# Full DNS name
nslookup nginx-service.default.svc.cluster.local

# Curl service
curl http://nginx-service

# See environment variables
env | grep NGINX_SERVICE

# Exit
exit
```

**Cleanup debug pod**:
```bash
kubectl delete pod debug-pod
```

### Step 9: Watch Service Endpoints

```bash
# In terminal 1: Watch endpoints
kubectl get endpoints nginx-service --watch

# In terminal 2: Scale deployment
kubectl scale deployment nginx-deployment --replicas=5

# Watch endpoints update in terminal 1!
# Press Ctrl+C when done

# Scale back
kubectl scale deployment nginx-deployment --replicas=3
```

**Observation**: Endpoints automatically update as pods are added/removed!

### Step 10: Create Multi-Port Service

```bash
# Apply multi-port deployment
kubectl apply -f manifests/05-multiport-deployment.yaml

# Apply multi-port service
kubectl apply -f manifests/06-multiport-service.yaml

# Get service
kubectl get service multiport-service

# Test HTTP port
curl http://localhost:30081

# Test HTTPS port (will fail - no cert, but shows port works)
curl -k https://localhost:30082
```

## ✅ Verification

### 1. Check All Services

```bash
# Get all services
kubectl get services

# Get with more details
kubectl get services -o wide

# Include default kubernetes service
kubectl get services --all-namespaces
```

### 2. Verify Service Configuration

```bash
# Describe service
kubectl describe service nginx-service

# Check selector matches deployment
kubectl get deployment nginx-deployment -o jsonpath='{.spec.template.metadata.labels}'
kubectl get service nginx-service -o jsonpath='{.spec.selector}'
```

### 3. Verify Endpoints

```bash
# Get endpoints
kubectl get endpoints nginx-service

# Compare with pod IPs
kubectl get pods -l app=nginx -o wide

# They should match!
```

### 4. Test Service Connectivity

```bash
# From within cluster
kubectl run curl-test --image=curlimages/curl:8.5.0 --rm -i --restart=Never -- curl -s http://nginx-service

# From outside cluster (NodePort)
curl http://localhost:30080

# Both should work!
```

### 5. Verify DNS Resolution

```bash
# Check CoreDNS is running
kubectl get pods -n kube-system -l k8s-app=kube-dns

# Test DNS resolution
kubectl run nslookup-test --image=busybox:1.36 --rm -i --restart=Never -- nslookup nginx-service
```

## 🧪 Hands-On Exercises

### Exercise 1: Create Your Own Service

```bash
# Create a Redis deployment
kubectl create deployment redis --image=redis:7-alpine --replicas=2

# Create a ClusterIP service for it
kubectl expose deployment redis --port=6379 --target-port=6379 --name=redis-service

# Test it
kubectl run redis-test --image=redis:7-alpine --rm -i --restart=Never -- redis-cli -h redis-service ping
# Should return "PONG"
```

### Exercise 2: Change Service Type

```bash
# Change redis-service to NodePort
kubectl patch service redis-service -p '{"spec":{"type":"NodePort"}}'

# Get the NodePort
kubectl get service redis-service

# Note: You can now access Redis from outside cluster
```

### Exercise 3: Service Without Selector

Create a service that points to external endpoint:

```bash
# Apply external service
kubectl apply -f manifests/07-external-service.yaml

# Test it
kubectl run curl-test --image=curlimages/curl:8.5.0 --rm -i --restart=Never -- curl -s http://external-service
```

## 🧹 Cleanup

```bash
# Delete services
kubectl delete service nginx-service multiport-service redis-service

# Delete deployments
kubectl delete deployment nginx-deployment multiport-deployment redis

# Verify cleanup
kubectl get all

# Keep cluster running for next tutorial
```

## 📚 What You Learned

✅ Why Services are needed (stable endpoint for pods)
✅ Different Service types (ClusterIP, NodePort)
✅ How to expose applications within cluster (ClusterIP)
✅ How to expose applications outside cluster (NodePort)
✅ Service discovery via DNS
✅ How Services load balance traffic to pods
✅ How endpoints track pod IPs
✅ Multi-port services

## 🎓 Key Concepts

### Service Selector
Services use labels to select pods:
```yaml
# Service selector
selector:
  app: nginx

# Must match pod labels
labels:
  app: nginx
```

### Service DNS Names
- `<service-name>`: Same namespace
- `<service-name>.<namespace>`: Cross namespace
- `<service-name>.<namespace>.svc.cluster.local`: Fully qualified

### Port Mapping
- `port`: Service port (how clients connect)
- `targetPort`: Pod port (where traffic goes)
- `nodePort`: External port (30000-32767)

Example:
```yaml
ports:
- port: 80          # Service listens on 80
  targetPort: 8080  # Forwards to pod port 8080
  nodePort: 30080   # Accessible on node at 30080
```

### Service Types Comparison

| Type | Use Case | Accessible From |
|------|----------|----------------|
| ClusterIP | Internal services | Within cluster only |
| NodePort | External access (dev/test) | Outside cluster via Node IP |
| LoadBalancer | External access (production) | Outside cluster via LB IP |
| ExternalName | External service proxy | Within cluster |

### Headless Services
Set `clusterIP: None` to get:
- No load balancing
- Direct pod IPs in DNS
- Used for StatefulSets (covered later)

## 🔜 Next Steps

Move to [04_deployment_service_ingress](../04_deployment_service_ingress/) where you'll:
- Keep your services running
- Install Ingress controller
- Create Ingress resources
- Route HTTP traffic by hostname/path
- Learn about Layer 7 load balancing

## 💡 Pro Tips

1. **Quick service creation**:
   ```bash
   kubectl expose deployment myapp --port=80 --target-port=8080 --type=NodePort
   ```

2. **Get service URL** (for NodePort):
   ```bash
   kubectl get service myapp -o jsonpath='{.spec.ports[0].nodePort}'
   ```

3. **Test service from pod**:
   ```bash
   kubectl run curl-test --image=curlimages/curl:8.5.0 --rm -i --restart=Never -- curl http://myservice
   ```

4. **Port forward** (alternative to NodePort for testing):
   ```bash
   kubectl port-forward service/nginx-service 8080:80
   # Access at http://localhost:8080
   ```

5. **Check if service has endpoints**:
   ```bash
   kubectl get endpoints myservice
   # If empty, check selector matches pod labels!
   ```

## 🆘 Troubleshooting

**Problem**: Service has no endpoints
**Solution**: Check selector matches pod labels:
```bash
kubectl describe service myservice  # Check Selector
kubectl get pods --show-labels      # Check pod labels
```

**Problem**: Can't access service
**Solution**: Check service type and ports:
```bash
kubectl get service myservice
kubectl describe service myservice
# For NodePort, try: curl http://localhost:<nodePort>
# For ClusterIP, test from inside cluster
```

**Problem**: DNS not resolving
**Solution**: Check CoreDNS is running:
```bash
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns
```

**Problem**: Traffic not load balancing
**Solution**: Check readiness probes and pod status:
```bash
kubectl get pods -l app=myapp
kubectl describe pod <pod-name>
# Ensure all pods are Ready
```

**Problem**: NodePort not accessible
**Solution**: For kind, ensure port mapping in cluster config:
```yaml
extraPortMappings:
- containerPort: 30080
  hostPort: 30080
```

## 📖 Additional Reading

- [Services](https://kubernetes.io/docs/concepts/services-networking/service/)
- [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
- [Connecting Applications with Services](https://kubernetes.io/docs/concepts/services-networking/connect-applications-service/)
- [Service Types](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types)

---

**Estimated Time**: 45-60 minutes
**Difficulty**: Beginner to Intermediate
**Prerequisites**: Tutorial 02 completed
