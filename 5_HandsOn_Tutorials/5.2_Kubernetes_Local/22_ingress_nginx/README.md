# Kubernetes Tutorial 22: Advanced NGINX Ingress Controller

## 🎯 Learning Objectives

- Install NGINX Ingress Controller
- Configure path-based routing
- Implement host-based routing
- Set up SSL/TLS termination
- Configure rate limiting
- Implement authentication
- Use custom error pages
- Configure request/response modifications
- Implement canary deployments with Ingress

## 📋 Prerequisites

- Completed tutorials 01-21
- kind cluster running
- Helm installed
- Cert-manager installed (for TLS)

## 📝 What We're Building

```
Ingress Architecture:
├── NGINX Ingress Controller
│   ├── Controller Pod
│   ├── LoadBalancer Service
│   └── ConfigMap (global config)
├── Ingress Resources
│   ├── Host-based routing
│   ├── Path-based routing
│   ├── TLS termination
│   └── Custom annotations
└── Backend Services
    ├── Frontend (/)
    ├── API (/api)
    └── Admin (/admin)
```

## 🔍 Concepts Deep Dive

### 1. **Ingress Controller vs Ingress**

**Ingress Controller**:
- Actual implementation (NGINX, Traefik, etc.)
- Watches Ingress resources
- Configures load balancer

**Ingress Resource**:
- Configuration object
- Defines routing rules
- References backend services

### 2. **Routing Types**

**Host-based**:
```yaml
spec:
  rules:
  - host: app1.example.com
    http:
      paths:
      - path: /
        backend:
          service:
            name: app1
  - host: app2.example.com
    http:
      paths:
      - path: /
        backend:
          service:
            name: app2
```

**Path-based**:
```yaml
spec:
  rules:
  - http:
      paths:
      - path: /app1
        backend:
          service:
            name: app1
      - path: /app2
        backend:
          service:
            name: app2
```

### 3. **NGINX Annotations**

Common annotations:
```yaml
annotations:
  nginx.ingress.kubernetes.io/rewrite-target: /$2
  nginx.ingress.kubernetes.io/rate-limit: "100"
  nginx.ingress.kubernetes.io/auth-type: basic
  nginx.ingress.kubernetes.io/ssl-redirect: "true"
  nginx.ingress.kubernetes.io/cors-allow-origin: "*"
```

## 📁 Step-by-Step Implementation

### Step 1: Install NGINX Ingress Controller

```bash
# Add Helm repository
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install NGINX Ingress Controller
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http=30080 \
  --set controller.service.nodePorts.https=30443

# Wait for deployment
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/component=controller \
  -n ingress-nginx \
  --timeout=120s

# Verify installation
kubectl get pods -n ingress-nginx
kubectl get svc -n ingress-nginx
```

### Step 2: Deploy Test Applications

```bash
# Create namespace
kubectl create namespace ingress-demo

# Deploy three backend services
kubectl apply -f manifests/01-backend-apps.yaml -n ingress-demo

# Verify deployments
kubectl get deployments,svc -n ingress-demo
```

### Step 3: Create Basic Ingress (Path-Based)

```bash
# Create path-based Ingress
kubectl apply -f manifests/02-path-based-ingress.yaml -n ingress-demo

# Check Ingress
kubectl get ingress -n ingress-demo
kubectl describe ingress path-based -n ingress-demo

# Test routing
curl http://localhost:30080/app1
curl http://localhost:30080/app2
curl http://localhost:30080/app3
```

### Step 4: Create Host-Based Ingress

```bash
# Create host-based Ingress
kubectl apply -f manifests/03-host-based-ingress.yaml -n ingress-demo

# Update /etc/hosts (for local testing)
echo "127.0.0.1 app1.local app2.local app3.local" | sudo tee -a /etc/hosts

# Test
curl http://app1.local:30080
curl http://app2.local:30080
curl http://app3.local:30080
```

### Step 5: Configure TLS/SSL

```bash
# Create TLS secret
kubectl create secret tls example-tls \
  --cert=certs/tls.crt \
  --key=certs/tls.key \
  -n ingress-demo

# Or use cert-manager
kubectl apply -f manifests/04-ingress-tls.yaml -n ingress-demo

# Test HTTPS
curl -k https://localhost:30443
```

### Step 6: Implement Rate Limiting

```bash
# Apply rate limiting
kubectl apply -f manifests/05-rate-limit-ingress.yaml -n ingress-demo

# Test rate limiting (100 requests per second)
for i in {1..110}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:30080/app1
done

# Should see 429 (Too Many Requests) after 100 requests
```

### Step 7: Configure Basic Authentication

```bash
# Create auth secret
htpasswd -c auth myuser
kubectl create secret generic basic-auth \
  --from-file=auth \
  -n ingress-demo

# Apply auth Ingress
kubectl apply -f manifests/06-auth-ingress.yaml -n ingress-demo

# Test
curl http://localhost:30080/admin  # Should get 401
curl -u myuser:password http://localhost:30080/admin  # Should work
```

### Step 8: Custom Error Pages

```bash
# Deploy custom error backend
kubectl apply -f manifests/07-custom-errors.yaml -n ingress-demo

# Configure Ingress to use custom errors
kubectl apply -f manifests/08-ingress-custom-errors.yaml -n ingress-demo

# Test 404
curl http://localhost:30080/nonexistent
# Should show custom error page
```

### Step 9: URL Rewriting

```bash
# Apply rewrite rules
kubectl apply -f manifests/09-rewrite-ingress.yaml -n ingress-demo

# Rewrite /api/v1/* to /*
curl http://localhost:30080/api/v1/users
# Backend receives: GET /users

# Capture groups
curl http://localhost:30080/app/foo/bar
# Backend receives: GET /foo/bar
```

### Step 10: Canary Deployment

```bash
# Deploy canary version
kubectl apply -f manifests/10-canary-deployment.yaml -n ingress-demo

# Create canary Ingress (10% traffic)
kubectl apply -f manifests/11-canary-ingress.yaml -n ingress-demo

# Test - 10% of requests go to canary
for i in {1..100}; do
  curl -s http://localhost:30080/ | grep version
done | sort | uniq -c
# Should see ~90 stable, ~10 canary
```

## ✅ Verification

### 1. Check Ingress Controller

```bash
# Verify controller pods
kubectl get pods -n ingress-nginx

# Check controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# View NGINX config
kubectl exec -n ingress-nginx deployment/ingress-nginx-controller -- cat /etc/nginx/nginx.conf
```

### 2. List Ingress Resources

```bash
# All Ingress resources
kubectl get ingress -A

# Specific namespace
kubectl get ingress -n ingress-demo

# Detailed view
kubectl describe ingress -n ingress-demo
```

### 3. Test Routing

```bash
# Path-based
curl -H "Host: example.com" http://localhost:30080/app1
curl -H "Host: example.com" http://localhost:30080/app2

# Host-based
curl -H "Host: app1.example.com" http://localhost:30080/
curl -H "Host: app2.example.com" http://localhost:30080/

# With verbose output
curl -v http://localhost:30080/app1
```

### 4. Check TLS

```bash
# Test HTTPS
curl -k https://localhost:30443

# Verify certificate
openssl s_client -connect localhost:30443 -servername example.com | \
  openssl x509 -noout -text
```

## 🧪 Hands-On Exercises

### Exercise 1: Multi-Domain Setup

**Task**: Configure Ingress for multiple domains:
- example.com → frontend service
- api.example.com → API service
- admin.example.com → admin (with auth)

### Exercise 2: Advanced Rewriting

**Task**: Implement complex rewrite rules:
- /v1/api/* → /api/v1/*
- /old-path → /new-path (redirect)
- Add custom headers

### Exercise 3: CORS Configuration

**Task**: Configure CORS:
- Allow specific origins
- Allow credentials
- Specify allowed methods and headers

## 🧹 Cleanup

```bash
# Delete Ingress resources
kubectl delete ingress --all -n ingress-demo

# Delete backend apps
kubectl delete namespace ingress-demo

# Uninstall NGINX Ingress
helm uninstall ingress-nginx -n ingress-nginx

# Delete namespace
kubectl delete namespace ingress-nginx
```

## 📚 What You Learned

✅ Installed NGINX Ingress Controller
✅ Configured path-based and host-based routing
✅ Implemented TLS/SSL termination
✅ Set up rate limiting
✅ Configured authentication
✅ Used custom error pages
✅ Implemented URL rewriting
✅ Created canary deployments

## 🎓 Key Concepts

### Ingress Path Types

**Exact**:
```yaml
pathType: Exact
path: /api
# Matches: /api only
```

**Prefix**:
```yaml
pathType: Prefix
path: /api
# Matches: /api, /api/, /api/users
```

**ImplementationSpecific** (NGINX):
```yaml
pathType: ImplementationSpecific
path: /api
# Uses NGINX regex rules
```

### Common Annotations

```yaml
# Rewrite
nginx.ingress.kubernetes.io/rewrite-target: /$1

# Rate limiting
nginx.ingress.kubernetes.io/limit-rps: "100"
nginx.ingress.kubernetes.io/limit-connections: "10"

# Auth
nginx.ingress.kubernetes.io/auth-type: basic
nginx.ingress.kubernetes.io/auth-secret: basic-auth

# SSL
nginx.ingress.kubernetes.io/ssl-redirect: "true"
nginx.ingress.kubernetes.io/force-ssl-redirect: "true"

# CORS
nginx.ingress.kubernetes.io/enable-cors: "true"
nginx.ingress.kubernetes.io/cors-allow-origin: "*"

# Custom headers
nginx.ingress.kubernetes.io/configuration-snippet: |
  add_header X-Custom-Header "value";
```

## 🔜 Next Steps

**Tutorial 23**: ArgoCD - GitOps continuous deployment
- Install ArgoCD
- Deploy applications from Git
- Implement GitOps workflow

## 💡 Pro Tips

1. **Debug Ingress issues**:
   ```bash
   kubectl logs -n ingress-nginx deployment/ingress-nginx-controller -f
   ```

2. **View NGINX config**:
   ```bash
   kubectl exec -n ingress-nginx deploy/ingress-nginx-controller -- cat /etc/nginx/nginx.conf | less
   ```

3. **Test without DNS**:
   ```bash
   curl -H "Host: example.com" http://localhost:30080
   ```

4. **Enable request logging**:
   ```yaml
   annotations:
     nginx.ingress.kubernetes.io/enable-access-log: "true"
   ```

5. **Increase upload size**:
   ```yaml
   annotations:
     nginx.ingress.kubernetes.io/proxy-body-size: "50m"
   ```

## 🆘 Troubleshooting

**Problem**: 404 for all paths
**Solution**: Check backend service exists:
```bash
kubectl get svc -n ingress-demo
kubectl describe ingress <name> -n ingress-demo
```

**Problem**: Certificate errors
**Solution**: Check TLS secret:
```bash
kubectl get secret <tls-secret> -n ingress-demo
kubectl describe certificate <name>
```

**Problem**: Rate limiting not working
**Solution**: Check annotations:
```bash
kubectl get ingress <name> -o yaml | grep rate-limit
```

**Problem**: Rewrite not working
**Solution**: Check rewrite-target syntax:
```yaml
# Capture group in path
path: /api/(.*)
# Use in rewrite
nginx.ingress.kubernetes.io/rewrite-target: /$1
```

## 📖 Additional Reading

- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Ingress Annotations](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/)
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)

---

**Estimated Time**: 90 minutes
**Difficulty**: Intermediate to Advanced
**Prerequisites**: Tutorials 01-21 completed

**Next**: Tutorial 23 - ArgoCD GitOps
