# Kubernetes Tutorial 20: Service Mesh with Istio

## 🎯 Learning Objectives

- Understand service mesh concepts
- Install Istio on Kubernetes
- Configure traffic routing and splitting
- Implement mutual TLS (mTLS)
- Use circuit breakers and retries
- Observe service communication
- Implement canary deployments
- Configure ingress gateway

## 📋 Prerequisites

- Completed tutorials 01-19
- kind cluster with sufficient resources (8GB+ RAM)
- kubectl and helm installed

## 📝 What We're Building

```
Istio Service Mesh:
├── Istiod (control plane)
├── Envoy Sidecars (data plane)
│   └── Injected into each pod
├── Ingress Gateway
├── VirtualServices (routing rules)
├── DestinationRules (load balancing, mTLS)
└── ServiceEntries (external services)
```

## 🔍 Concepts Deep Dive

### 1. **What is a Service Mesh?**

**Purpose**:
- Service-to-service communication
- Traffic management
- Security (mTLS)
- Observability (metrics, tracing)

**Istio Components**:
- **Istiod**: Control plane (pilot, citadel, galley combined)
- **Envoy**: Sidecar proxy in each pod
- **Ingress Gateway**: Entry point for external traffic

### 2. **Sidecar Injection**

```yaml
# Automatic injection
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
  labels:
    istio-injection: enabled  # Auto-inject sidecar

# Each pod gets:
# - App container
# - istio-proxy container (Envoy)
# - istio-init container
```

### 3. **Traffic Management**

**VirtualService**: How to route requests
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - match:
    - headers:
        end-user:
          exact: jason
    route:
    - destination:
        host: reviews
        subset: v2
  - route:
    - destination:
        host: reviews
        subset: v1
```

**DestinationRule**: How to handle traffic
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

## 📁 Step-by-Step Implementation

### Step 1: Install Istio

```bash
# Download Istio
curl -L https://istio.io/downloadIstio | sh -
cd istio-*
export PATH=$PWD/bin:$PATH

# Install Istio with demo profile
istioctl install --set profile=demo -y

# Verify installation
kubectl get pods -n istio-system

# Wait for Istio
kubectl wait --for=condition=ready pod -l app=istiod -n istio-system --timeout=300s
kubectl wait --for=condition=ready pod -l app=istio-ingressgateway -n istio-system --timeout=300s
```

### Step 2: Deploy Sample Application (Bookinfo)

```bash
# Create namespace with sidecar injection
kubectl create namespace bookinfo
kubectl label namespace bookinfo istio-injection=enabled

# Deploy Bookinfo app
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/bookinfo/platform/kube/bookinfo.yaml -n bookinfo

# Wait for pods (each should have 2/2 containers: app + sidecar)
kubectl get pods -n bookinfo

# Deploy gateway
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/bookinfo/networking/bookinfo-gateway.yaml -n bookinfo
```

### Step 3: Access Application via Ingress Gateway

```bash
# Get ingress gateway external IP (for kind, use port-forward)
export INGRESS_PORT=$(kubectl get service istio-ingressgateway -n istio-system -o jsonpath='{.spec.ports[?(@.name=="http2")].nodePort}')

# Access application
kubectl port-forward -n istio-system svc/istio-ingressgateway 8080:80 &

# Test
curl http://localhost:8080/productpage
# Or open in browser
```

### Step 4: Configure Traffic Routing (Canary)

```bash
# Apply default destination rules
kubectl apply -f manifests/01-destination-rules.yaml -n bookinfo

# Route all traffic to v1
kubectl apply -f manifests/02-virtual-service-v1.yaml -n bookinfo

# Test - should only see v1 (no stars in reviews)
curl http://localhost:8080/productpage | grep -o "glyphicon-star"

# 50/50 split between v1 and v2
kubectl apply -f manifests/03-virtual-service-50-50.yaml -n bookinfo

# Route based on header
kubectl apply -f manifests/04-virtual-service-header.yaml -n bookinfo
# Test with header: curl -H "end-user: jason" http://localhost:8080/productpage
```

### Step 5: Implement Circuit Breaker

```bash
# Apply circuit breaker
kubectl apply -f manifests/05-circuit-breaker.yaml -n bookinfo

# Circuit breaker opens after:
# - 1 consecutive error
# - Max 1 concurrent connection

# Test by generating traffic
kubectl apply -f manifests/06-load-generator.yaml -n bookinfo

# Check circuit breaker status
istioctl proxy-config clusters -n bookinfo deployment/reviews | grep outlier
```

### Step 6: Configure Retries and Timeouts

```bash
# Apply retry policy
kubectl apply -f manifests/07-retry-policy.yaml -n bookinfo

# Configuration:
# - Retry 3 times
# - Timeout: 2 seconds per attempt
# - Retry on: 5xx errors

# Test with fault injection
kubectl apply -f manifests/08-fault-injection.yaml -n bookinfo
# This injects delays and errors to test retries
```

### Step 7: Enable Mutual TLS

```bash
# Check current mTLS status
istioctl authn tls-check -n bookinfo

# Enable strict mTLS for namespace
kubectl apply -f manifests/09-mtls-strict.yaml -n bookinfo

# Verify mTLS
kubectl exec -n bookinfo deployment/productpage-v1 -c istio-proxy -- \
  curl -s http://details:9080/details/0 -v

# Should see TLS handshake in logs
```

### Step 8: Observe Traffic with Kiali

```bash
# Install Kiali (if not installed)
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/kiali.yaml

# Wait for Kiali
kubectl wait --for=condition=ready pod -l app=kiali -n istio-system --timeout=300s

# Access Kiali
kubectl port-forward -n istio-system svc/kiali 20001:20001 &

# Open http://localhost:20001
# View service graph, traffic flow, health
```

### Step 9: Distributed Tracing with Jaeger

```bash
# Install Jaeger
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/jaeger.yaml

# Wait for Jaeger
kubectl wait --for=condition=ready pod -l app=jaeger -n istio-system --timeout=300s

# Access Jaeger
kubectl port-forward -n istio-system svc/jaeger-query 16686:16686 &

# Open http://localhost:16686
# View traces across services
```

### Step 10: Monitor with Prometheus and Grafana

```bash
# Install Istio's Prometheus and Grafana
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.20/samples/addons/grafana.yaml

# Access Grafana
kubectl port-forward -n istio-system svc/grafana 3000:3000 &

# Open http://localhost:3000
# View Istio dashboards:
# - Istio Service Dashboard
# - Istio Workload Dashboard
# - Istio Mesh Dashboard
```

## ✅ Verification

### 1. Check Istio Installation

```bash
# Verify Istio components
kubectl get pods -n istio-system

# Check Istio version
istioctl version

# Verify proxy injection
kubectl get namespace -L istio-injection
```

### 2. Verify Sidecar Injection

```bash
# Check pods have sidecars (2/2 containers)
kubectl get pods -n bookinfo

# Describe pod to see containers
kubectl describe pod -n bookinfo -l app=productpage
# Should see: productpage, istio-proxy, istio-init
```

### 3. Test Traffic Management

```bash
# Check virtual services
kubectl get virtualservices -n bookinfo

# Check destination rules
kubectl get destinationrules -n bookinfo

# Describe routing rules
kubectl describe virtualservice reviews -n bookinfo
```

### 4. Verify mTLS

```bash
# Check mTLS status for all services
istioctl authn tls-check -n bookinfo

# Should show "STRICT" or "PERMISSIVE"
```

## 🧪 Hands-On Exercises

### Exercise 1: Canary Deployment

**Task**: Implement canary release:
- 90% traffic to v1
- 10% traffic to v2 (canary)
- Monitor error rates
- Gradually shift to 100% v2

### Exercise 2: Fault Injection

**Task**: Test resilience:
- Inject 500ms delay for 50% of requests
- Inject HTTP 503 error for 10% of requests
- Verify retries work

### Exercise 3: External Service

**Task**: Configure external service access:
- Create ServiceEntry for external API
- Add timeout and retry policies
- Monitor external calls

## 🧹 Cleanup

```bash
# Delete Bookinfo app
kubectl delete namespace bookinfo

# Uninstall Istio
istioctl uninstall --purge -y

# Delete Istio namespace
kubectl delete namespace istio-system

# Verify cleanup
kubectl get pods -n istio-system
kubectl get crd | grep istio
```

## 📚 What You Learned

✅ Installed Istio service mesh
✅ Configured sidecar injection
✅ Implemented traffic routing
✅ Set up circuit breakers
✅ Enabled mutual TLS
✅ Used observability tools (Kiali, Jaeger)
✅ Implemented canary deployments

## 🎓 Key Concepts

### Traffic Management Patterns

**Canary Deployment**:
```yaml
http:
- route:
  - destination:
      host: myapp
      subset: v1
    weight: 90
  - destination:
      host: myapp
      subset: v2
    weight: 10
```

**A/B Testing**:
```yaml
http:
- match:
  - headers:
      user-agent:
        regex: ".*Mobile.*"
  route:
  - destination:
      host: myapp
      subset: mobile
- route:
  - destination:
      host: myapp
      subset: desktop
```

**Blue/Green**:
```yaml
# Initially all to blue
route:
- destination:
    host: myapp
    subset: blue
# Then switch to green
route:
- destination:
    host: myapp
    subset: green
```

## 🔜 Next Steps

**Tutorial 21**: Cert Manager - Automated TLS certificate management
- Install cert-manager
- Configure Let's Encrypt
- Automate certificate renewal

## 💡 Pro Tips

1. **Analyze configuration**:
   ```bash
   istioctl analyze -n bookinfo
   ```

2. **Debug proxy configuration**:
   ```bash
   istioctl proxy-config routes -n bookinfo deployment/productpage-v1
   ```

3. **Enable access logs**:
   ```bash
   kubectl apply -f - <<EOF
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: istio
     namespace: istio-system
   data:
     mesh: |
       accessLogFile: /dev/stdout
   EOF
   ```

4. **Check mesh status**:
   ```bash
   istioctl proxy-status
   ```

## 🆘 Troubleshooting

**Problem**: Sidecar not injected
**Solution**: Check namespace label:
```bash
kubectl get namespace bookinfo -o yaml | grep istio-injection
kubectl label namespace bookinfo istio-injection=enabled
```

**Problem**: Traffic not routing as expected
**Solution**: Check virtual service:
```bash
kubectl describe virtualservice -n bookinfo
istioctl analyze -n bookinfo
```

**Problem**: mTLS connection failures
**Solution**: Check peer authentication:
```bash
kubectl get peerauthentication -A
istioctl authn tls-check -n bookinfo
```

## 📖 Additional Reading

- [Istio Official Docs](https://istio.io/latest/docs/)
- [Istio Traffic Management](https://istio.io/latest/docs/concepts/traffic-management/)
- [Istio Security](https://istio.io/latest/docs/concepts/security/)
- [Kiali](https://kiali.io/)

---

**Estimated Time**: 120+ minutes
**Difficulty**: Advanced
**Prerequisites**: Tutorials 01-19 completed

**Next**: Tutorial 21 - Cert Manager
