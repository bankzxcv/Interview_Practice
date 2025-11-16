# Kubernetes Tutorial 21: Cert Manager for TLS Certificates

## 🎯 Learning Objectives

- Install cert-manager
- Create certificate issuers
- Generate self-signed certificates
- Use Let's Encrypt for production certs
- Automate certificate renewal
- Secure Ingress with TLS
- Monitor certificate expiration
- Troubleshoot certificate issues

## 📋 Prerequisites

- Completed tutorials 01-20
- Helm installed
- Ingress controller installed
- Domain name (for Let's Encrypt)

## 📝 What We're Building

```
Cert Manager Architecture:
├── Cert-Manager (controller)
├── Issuers/ClusterIssuers (CA configuration)
│   ├── SelfSigned
│   ├── CA
│   └── Let's Encrypt (ACME)
├── Certificates (requested certs)
└── Secrets (TLS cert storage)
```

## 🔍 Concepts Deep Dive

### 1. **Cert-Manager Components**

**Issuer**: Namespace-scoped certificate authority
**ClusterIssuer**: Cluster-wide certificate authority
**Certificate**: Request for TLS certificate
**CertificateRequest**: Actual request to CA
**Order/Challenge**: ACME protocol steps (Let's Encrypt)

### 2. **Certificate Types**

**Self-Signed**:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: selfsigned
spec:
  selfSigned: {}
```

**Let's Encrypt (ACME)**:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

### 3. **ACME Challenges**

**HTTP-01**:
- Creates temporary Ingress
- Let's Encrypt validates via HTTP
- Works with any Ingress controller
- Limited to port 80

**DNS-01**:
- Creates DNS TXT record
- Let's Encrypt validates via DNS
- Supports wildcard certificates
- Requires DNS provider integration

## 📁 Step-by-Step Implementation

### Step 1: Install Cert-Manager

```bash
# Install cert-manager CRDs
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.crds.yaml

# Add cert-manager Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0

# Wait for cert-manager
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=120s

# Verify installation
kubectl get pods -n cert-manager
```

### Step 2: Create Self-Signed Issuer

```bash
# Create self-signed ClusterIssuer
kubectl apply -f manifests/01-selfsigned-issuer.yaml

# Verify issuer
kubectl get clusterissuer selfsigned-issuer

# Describe issuer
kubectl describe clusterissuer selfsigned-issuer
```

### Step 3: Create Self-Signed Certificate

```bash
# Request self-signed certificate
kubectl apply -f manifests/02-selfsigned-cert.yaml

# Wait for certificate
kubectl wait --for=condition=ready certificate/selfsigned-cert --timeout=60s

# Check certificate
kubectl get certificate
kubectl describe certificate selfsigned-cert

# Check created secret
kubectl get secret selfsigned-cert-tls
kubectl describe secret selfsigned-cert-tls

# View certificate details
kubectl get secret selfsigned-cert-tls -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout
```

### Step 4: Create CA Issuer

```bash
# Generate CA certificate
kubectl apply -f manifests/03-ca-issuer.yaml

# This creates:
# 1. Self-signed CA certificate
# 2. CA Issuer that uses the CA certificate

# Verify CA issuer
kubectl get issuer ca-issuer
```

### Step 5: Issue Certificate from CA

```bash
# Request certificate from CA
kubectl apply -f manifests/04-ca-cert.yaml

# Wait and verify
kubectl wait --for=condition=ready certificate/ca-signed-cert --timeout=60s
kubectl get certificate ca-signed-cert

# Check certificate chain
kubectl get secret ca-signed-cert-tls -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout
```

### Step 6: Configure Let's Encrypt Staging

```bash
# Create Let's Encrypt staging issuer (for testing)
cat > manifests/05-letsencrypt-staging.yaml <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

kubectl apply -f manifests/05-letsencrypt-staging.yaml

# Verify
kubectl get clusterissuer letsencrypt-staging
```

### Step 7: Create Ingress with TLS

```bash
# Deploy test application
kubectl apply -f manifests/06-test-app.yaml

# Create Ingress with cert-manager annotation
kubectl apply -f manifests/07-ingress-tls.yaml

# Check certificate issuance
kubectl get certificate
kubectl describe certificate example-com-tls

# Check challenge (ACME)
kubectl get challenge

# Once ready, secret is created
kubectl get secret example-com-tls
```

### Step 8: Configure Let's Encrypt Production

```bash
# Create production issuer (rate limited - use carefully)
cat > manifests/08-letsencrypt-prod.yaml <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

kubectl apply -f manifests/08-letsencrypt-prod.yaml

# Update Ingress to use production issuer
kubectl annotate ingress example-ingress \
  cert-manager.io/cluster-issuer=letsencrypt-prod --overwrite
```

### Step 9: Monitor Certificate Expiration

```bash
# Install cert-manager metrics
kubectl apply -f manifests/09-servicemonitor.yaml

# Check certificate expiration
kubectl get certificate -o custom-columns=\
NAME:.metadata.name,\
READY:.status.conditions[0].status,\
EXPIRY:.status.notAfter

# Cert-manager automatically renews 30 days before expiry
```

### Step 10: Troubleshoot Certificates

```bash
# Check certificate status
kubectl describe certificate example-com-tls

# Check certificate request
kubectl get certificaterequest
kubectl describe certificaterequest <name>

# Check orders (ACME)
kubectl get order
kubectl describe order <name>

# Check challenges
kubectl get challenge
kubectl describe challenge <name>

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager -f
```

## ✅ Verification

### 1. Check Cert-Manager Status

```bash
# Verify pods
kubectl get pods -n cert-manager

# Check CRDs
kubectl get crd | grep cert-manager

# Verify webhook
kubectl get validatingwebhookconfigurations | grep cert-manager
```

### 2. Verify Issuers

```bash
# List issuers
kubectl get issuer,clusterissuer -A

# Describe issuer
kubectl describe clusterissuer letsencrypt-staging

# Check ready condition
kubectl get clusterissuer -o custom-columns=\
NAME:.metadata.name,\
READY:.status.conditions[0].status
```

### 3. Check Certificates

```bash
# List certificates
kubectl get certificate -A

# Check certificate details
kubectl describe certificate <name>

# View certificate content
kubectl get secret <cert-secret> -o jsonpath='{.data.tls\.crt}' | \
  base64 -d | openssl x509 -text -noout | head -20
```

### 4. Test TLS

```bash
# Test HTTPS endpoint
curl -v https://example.com

# Check certificate
openssl s_client -connect example.com:443 -servername example.com | \
  openssl x509 -noout -text
```

## 🧪 Hands-On Exercises

### Exercise 1: Wildcard Certificate

**Task**: Create wildcard certificate:
- Use DNS-01 challenge
- Certificate for *.example.com
- Configure DNS provider (Route53, CloudFlare)

### Exercise 2: Multiple Domains

**Task**: Create certificate for multiple domains:
- Certificate with SAN (Subject Alternative Names)
- Cover: example.com, www.example.com, api.example.com

### Exercise 3: Certificate Monitoring

**Task**: Set up monitoring:
- Grafana dashboard for certificate expiry
- Alert when certificate expires in <7 days
- Track renewal success rate

## 🧹 Cleanup

```bash
# Delete certificates
kubectl delete certificate --all

# Delete issuers
kubectl delete issuer --all
kubectl delete clusterissuer --all

# Uninstall cert-manager
helm uninstall cert-manager -n cert-manager

# Delete CRDs
kubectl delete -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.crds.yaml

# Delete namespace
kubectl delete namespace cert-manager
```

## 📚 What You Learned

✅ Installed cert-manager
✅ Created certificate issuers
✅ Generated self-signed certificates
✅ Used Let's Encrypt for TLS
✅ Automated certificate renewal
✅ Secured Ingress with TLS
✅ Monitored certificate expiration

## 🎓 Key Concepts

### Issuer vs ClusterIssuer

**Issuer** (namespace-scoped):
```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: my-issuer
  namespace: default
```

**ClusterIssuer** (cluster-wide):
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: my-cluster-issuer
# No namespace - cluster-wide
```

### Certificate Renewal

- Automatic renewal 30 days before expiry
- Configurable via `renewBefore` field
- Monitors via `certmanager_certificate_expiration_timestamp_seconds` metric

### Best Practices

1. **Use staging first**: Test with Let's Encrypt staging
2. **Monitor expiration**: Set up alerts
3. **Use ClusterIssuer**: For cluster-wide access
4. **Secure private keys**: Use proper RBAC
5. **Backup certificates**: Export critical certs

## 🔜 Next Steps

**Tutorial 22**: Ingress NGINX - Advanced ingress configuration
- SSL termination
- Path-based routing
- Rate limiting

## 💡 Pro Tips

1. **Quick certificate check**:
   ```bash
   kubectl get certificate -o wide
   ```

2. **Force renewal**:
   ```bash
   kubectl annotate certificate <name> cert-manager.io/issue-temporary-certificate="true"
   ```

3. **Debug with logs**:
   ```bash
   kubectl logs -n cert-manager deployment/cert-manager -f | grep <certificate-name>
   ```

4. **Export certificate**:
   ```bash
   kubectl get secret <secret-name> -o jsonpath='{.data.tls\.crt}' | base64 -d > cert.pem
   ```

## 🆘 Troubleshooting

**Problem**: Certificate stuck in "Pending"
**Solution**: Check certificaterequest and challenge:
```bash
kubectl describe certificate <name>
kubectl get certificaterequest,order,challenge
kubectl logs -n cert-manager deployment/cert-manager
```

**Problem**: ACME challenge fails
**Solution**: Verify Ingress accessible:
```bash
# Check challenge URL is accessible
curl http://example.com/.well-known/acme-challenge/<token>

# Check Ingress
kubectl get ingress
```

**Problem**: Rate limit from Let's Encrypt
**Solution**: Use staging issuer, wait, or use different domains

## 📖 Additional Reading

- [Cert-Manager Docs](https://cert-manager.io/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [ACME Protocol](https://tools.ietf.org/html/rfc8555)

---

**Estimated Time**: 60-90 minutes
**Difficulty**: Intermediate
**Prerequisites**: Tutorials 01-20 completed

**Next**: Tutorial 22 - Advanced Ingress NGINX
