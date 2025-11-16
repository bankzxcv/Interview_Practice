# Kubernetes Tutorial 04: Deployment with Service and Ingress

## 🎯 Learning Objectives

- Understand Ingress and Ingress Controllers
- Install and configure NGINX Ingress Controller
- Create Ingress resources for HTTP routing
- Route traffic based on hostname and path
- Understand Layer 7 (application layer) load balancing
- Configure SSL/TLS termination (bonus)

## 📋 Prerequisites

- Completed [03_deployment_service](../03_deployment_service/)
- kind cluster "learning" is running (created in Tutorial 01 with port mappings)
- kubectl configured to use kind-learning context
- Basic understanding of Services (ClusterIP, NodePort)

## 📝 What We're Building

```
External HTTP Request (http://app1.local)
           ↓
    Port 80 (localhost)
           ↓
    Ingress Controller (NGINX)
           ↓
    Ingress Rules (routing)
           ↓
    ┌──────────┴──────────┐
    ↓                     ↓
Service: app1      Service: app2
    ↓                     ↓
  Pods: app1          Pods: app2
```

## 🔍 Concepts Introduced

### 1. **What is Ingress?**

**Problem with Services**:
- NodePort: Each service needs a different port (30000+)
- LoadBalancer: Each service gets its own external IP (costs money)
- Can't do path-based or host-based routing

**Ingress solves this**:
- Single entry point for multiple services
- HTTP/HTTPS routing based on hostname or path
- SSL/TLS termination
- Layer 7 (application layer) load balancing

### 2. **Ingress vs Ingress Controller**

**Ingress**: Resource definition (rules)
- Defines routing rules
- Just a configuration (YAML)
- Doesn't do anything by itself

**Ingress Controller**: Implementation
- Actual software that implements Ingress rules
- Watches Ingress resources and applies them
- Common controllers: NGINX, Traefik, HAProxy, Istio

**Analogy**:
- Ingress = Traffic rules
- Ingress Controller = Traffic cop who enforces rules

### 3. **Ingress Routing Types**

**Host-based routing**:
```
app1.example.com → Service A
app2.example.com → Service B
```

**Path-based routing**:
```
example.com/app1 → Service A
example.com/app2 → Service B
```

**Combined**:
```
api.example.com/v1 → Service A
api.example.com/v2 → Service B
web.example.com/   → Service C
```

## 📁 Step-by-Step Implementation

### Step 1: Verify Cluster Port Mappings

Our cluster (from Tutorial 01) should have port mappings for Ingress:

```bash
# Check cluster config
docker ps | grep learning-control-plane

# Verify ports 80 and 443 are mapped
# Look for: 0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

If cluster doesn't have port mappings:
```bash
# Delete and recreate cluster with port mappings
cd ../01_basic_cluster
kind delete cluster --name learning
kind create cluster --config cluster-config.yaml
```

### Step 2: Install NGINX Ingress Controller

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

**What was installed**:
```bash
# Check ingress-nginx namespace
kubectl get all -n ingress-nginx

# Key components:
# - Deployment: ingress-nginx-controller
# - Service: ingress-nginx-controller (NodePort or LoadBalancer)
# - ConfigMap: ingress-nginx-controller
# - ServiceAccount, Roles, RoleBindings
```

### Step 3: Deploy Multiple Applications

Let's deploy two different applications:

```bash
# Deploy App 1 (nginx with custom page)
kubectl apply -f manifests/01-app1-deployment.yaml
kubectl apply -f manifests/02-app1-service.yaml

# Deploy App 2 (another nginx with different page)
kubectl apply -f manifests/03-app2-deployment.yaml
kubectl apply -f manifests/04-app2-service.yaml

# Verify deployments
kubectl get deployments
kubectl get services
kubectl get pods
```

### Step 4: Create Basic Ingress (Host-based Routing)

```bash
# Apply basic ingress with host-based routing
kubectl apply -f manifests/05-basic-ingress.yaml

# Get ingress
kubectl get ingress

# Describe ingress
kubectl describe ingress basic-ingress
```

**Expected Output**:
```
NAME            CLASS   HOSTS                       ADDRESS     PORTS   AGE
basic-ingress   nginx   app1.local,app2.local       localhost   80      10s
```

### Step 5: Test Host-based Routing

Since we're using custom hostnames, we need to use the Host header:

```bash
# Test App 1
curl -H "Host: app1.local" http://localhost
# Should show App 1 page

# Test App 2
curl -H "Host: app2.local" http://localhost
# Should show App 2 page

# Or add entries to /etc/hosts (Linux/Mac)
# echo "127.0.0.1 app1.local app2.local" | sudo tee -a /etc/hosts

# Then you can use:
# curl http://app1.local
# curl http://app2.local
```

### Step 6: Create Path-based Routing

```bash
# Apply path-based ingress
kubectl apply -f manifests/06-path-based-ingress.yaml

# Get ingress
kubectl get ingress
```

**Test path-based routing**:

```bash
# Test /app1 path
curl http://localhost/app1
# Routes to App 1

# Test /app2 path
curl http://localhost/app2
# Routes to App 2

# Test root path
curl http://localhost/
# May show 404 (no rule for /)
```

### Step 7: Create Combined Ingress (Host + Path)

```bash
# Apply combined ingress
kubectl apply -f manifests/07-combined-ingress.yaml

# Test different combinations
curl -H "Host: api.local" http://localhost/v1
curl -H "Host: api.local" http://localhost/v2
curl -H "Host: web.local" http://localhost/
```

### Step 8: Add Default Backend

```bash
# Deploy default backend (404 page)
kubectl apply -f manifests/08-default-backend.yaml

# Apply ingress with default backend
kubectl apply -f manifests/09-ingress-with-default.yaml

# Test unknown path (should show default backend)
curl http://localhost/unknown
```

### Step 9: Ingress with Rewrite Rules

```bash
# Apply ingress with rewrite annotation
kubectl apply -f manifests/10-ingress-rewrite.yaml

# Test rewrite
curl -H "Host: rewrite.local" http://localhost/old-path
# Rewrites to /new-path and routes to service
```

### Step 10: SSL/TLS Termination (Bonus)

```bash
# Create TLS secret (self-signed certificate)
kubectl apply -f manifests/11-tls-secret.yaml

# Apply TLS ingress
kubectl apply -f manifests/12-tls-ingress.yaml

# Test HTTPS
curl -k https://localhost -H "Host: secure.local"
# -k flag ignores certificate validation (self-signed)
```

## ✅ Verification

### 1. Check Ingress Controller

```bash
# Ingress controller pods
kubectl get pods -n ingress-nginx

# Ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# Ingress controller service
kubectl get service -n ingress-nginx
```

### 2. Check Ingress Resources

```bash
# List all ingress resources
kubectl get ingress

# Describe specific ingress
kubectl describe ingress basic-ingress

# Get ingress in YAML
kubectl get ingress basic-ingress -o yaml
```

### 3. Verify Routing

```bash
# Check ingress address
kubectl get ingress

# Test each route
curl -H "Host: app1.local" http://localhost
curl -H "Host: app2.local" http://localhost
curl http://localhost/app1
curl http://localhost/app2
```

### 4. Check Backend Services

```bash
# Ensure services exist
kubectl get services

# Ensure pods are ready
kubectl get pods

# Check service endpoints
kubectl get endpoints app1-service app2-service
```

## 🧪 Hands-On Exercises

### Exercise 1: Create Your Own Ingress

```bash
# Deploy a new app
kubectl create deployment app3 --image=nginxdemos/hello:latest --replicas=2

# Expose it
kubectl expose deployment app3 --port=80 --target-port=80 --name=app3-service

# Create ingress for it (manually)
kubectl create ingress app3-ingress \
  --rule="app3.local/*=app3-service:80" \
  --class=nginx

# Test it
curl -H "Host: app3.local" http://localhost
```

### Exercise 2: Multi-path Routing

Create an ingress with multiple paths for the same host:

```yaml
# Save as exercise-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: exercise-ingress
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: app1-service
            port:
              number: 80
      - path: /web
        pathType: Prefix
        backend:
          service:
            name: app2-service
            port:
              number: 80
```

```bash
kubectl apply -f exercise-ingress.yaml

# Test
curl -H "Host: myapp.local" http://localhost/api
curl -H "Host: myapp.local" http://localhost/web
```

### Exercise 3: Wildcard Host

```bash
# Create wildcard ingress (manually)
kubectl create ingress wildcard-ingress \
  --rule="*.example.local/*=app1-service:80" \
  --class=nginx

# Test with different subdomains
curl -H "Host: anything.example.local" http://localhost
curl -H "Host: test.example.local" http://localhost
```

## 🧹 Cleanup

```bash
# Delete ingress resources
kubectl delete ingress --all

# Delete applications
kubectl delete deployment app1 app2
kubectl delete service app1-service app2-service

# Optionally, remove ingress controller
kubectl delete namespace ingress-nginx

# Keep cluster running for next tutorial
```

## 📚 What You Learned

✅ Installed NGINX Ingress Controller
✅ Created Ingress resources for HTTP routing
✅ Configured host-based routing (app1.local, app2.local)
✅ Configured path-based routing (/app1, /app2)
✅ Combined host and path routing
✅ Added default backends for 404 pages
✅ Used rewrite annotations
✅ Configured SSL/TLS termination
✅ Understood Layer 7 load balancing

## 🎓 Key Concepts

### Ingress Controller vs Service Types

| Feature | NodePort | LoadBalancer | Ingress |
|---------|----------|--------------|---------|
| Layer | L4 (Transport) | L4 (Transport) | L7 (Application) |
| Routing | Port-based | IP-based | Host/Path-based |
| SSL/TLS | No | No | Yes |
| Cost | Free | $ per service | $ for 1 controller |
| Use Case | Development | Production | Production (HTTP/S) |

### Path Types

**Exact**: Matches exact path
```yaml
pathType: Exact
path: /api  # Matches /api only, not /api/ or /api/v1
```

**Prefix**: Matches path prefix
```yaml
pathType: Prefix
path: /api  # Matches /api, /api/, /api/v1, etc.
```

**ImplementationSpecific**: Controller-specific
```yaml
pathType: ImplementationSpecific
# Behavior depends on ingress controller
```

### Common Annotations

```yaml
annotations:
  # Rewrite target
  nginx.ingress.kubernetes.io/rewrite-target: /

  # SSL redirect
  nginx.ingress.kubernetes.io/ssl-redirect: "true"

  # CORS
  nginx.ingress.kubernetes.io/enable-cors: "true"

  # Rate limiting
  nginx.ingress.kubernetes.io/limit-rps: "10"

  # Custom timeout
  nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"

  # Websocket support
  nginx.ingress.kubernetes.io/websocket-services: "my-service"
```

### Ingress Class

Kubernetes supports multiple ingress controllers:
```yaml
spec:
  ingressClassName: nginx  # or: traefik, haproxy, etc.
```

## 🔜 Next Steps

Move to [05_configmap](../05_configmap/) where you'll:
- Learn to externalize configuration
- Create ConfigMaps
- Mount configurations as environment variables
- Mount configurations as files
- Update configurations without rebuilding images

## 💡 Pro Tips

1. **Quick ingress creation**:
   ```bash
   kubectl create ingress myapp --rule="myapp.local/*=myapp-service:80" --class=nginx
   ```

2. **Watch ingress events**:
   ```bash
   kubectl get events --watch | grep Ingress
   ```

3. **Check ingress controller logs**:
   ```bash
   kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=50 -f
   ```

4. **Test without modifying /etc/hosts**:
   ```bash
   curl -H "Host: myapp.local" http://localhost
   ```

5. **Get ingress controller IP** (for debugging):
   ```bash
   kubectl get service -n ingress-nginx
   ```

6. **Validate ingress resource**:
   ```bash
   kubectl describe ingress my-ingress | grep -A 10 "Rules"
   ```

## 🆘 Troubleshooting

**Problem**: Ingress shows no address
**Solution**: Wait for ingress controller to be ready:
```bash
kubectl get pods -n ingress-nginx
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=90s
```

**Problem**: 404 Not Found
**Solution**: Check ingress rules and service names:
```bash
kubectl describe ingress my-ingress
kubectl get services
# Ensure service names match in ingress
```

**Problem**: 503 Service Temporarily Unavailable
**Solution**: Check backend pods are running:
```bash
kubectl get pods
kubectl get endpoints my-service
# If no endpoints, pods may not be ready
```

**Problem**: Connection refused
**Solution**: Check ingress controller is running:
```bash
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

**Problem**: Routing to wrong service
**Solution**: Check rule order and specificity:
```bash
kubectl get ingress my-ingress -o yaml
# More specific rules should come first
# PathType Exact takes precedence over Prefix
```

**Problem**: SSL/TLS not working
**Solution**: Check TLS secret exists:
```bash
kubectl get secrets
kubectl describe ingress my-ingress
# Ensure tls.crt and tls.key are in secret
```

**Problem**: kind cluster not accessible on localhost
**Solution**: Verify port mappings:
```bash
docker ps | grep learning-control-plane
# Should see: 0.0.0.0:80->80/tcp
# If not, recreate cluster with correct config
```

## 📖 Additional Reading

- [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Ingress Controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Ingress on kind](https://kind.sigs.k8s.io/docs/user/ingress/)

---

**Estimated Time**: 60-75 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-03 completed
