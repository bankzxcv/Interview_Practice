# 5.4.4 SSL/TLS - Secure Communication

## Overview

Master SSL/TLS to encrypt communication between services, implement mutual TLS for service-to-service authentication, manage certificates, and understand modern TLS configurations.

## Tutorials

### [01 - TLS Basics and Certificates](./01_tls_basics/)
- TLS handshake explained
- X.509 certificates
- Certificate chains and trust
- Public/Private key pairs
- Certificate inspection

**Time**: 2-3 hours | **Difficulty**: Beginner

### [02 - Self-Signed Certificates](./02_self_signed_certs/)
- Creating self-signed certs with OpenSSL
- Certificate Authority (CA) setup
- Signing certificates
- Trust management
- Development vs production

**Time**: 2 hours | **Difficulty**: Beginner

### [03 - Let's Encrypt with cert-manager](./03_letsencrypt_certmanager/)
- Free TLS certificates
- cert-manager installation
- Automated certificate issuance
- Renewal and monitoring
- DNS-01 and HTTP-01 challenges

**Time**: 3 hours | **Difficulty**: Intermediate

### [04 - NGINX with TLS](./04_nginx_tls/)
- NGINX TLS configuration
- Perfect Forward Secrecy
- OCSP stapling
- HTTP/2 and HTTP/3
- Security headers

**Time**: 2-3 hours | **Difficulty**: Intermediate

### [05 - Mutual TLS (mTLS)](./05_mtls/)
- Client certificate authentication
- Two-way TLS
- Certificate-based service identity
- mTLS in microservices
- Debugging mTLS issues

**Time**: 3-4 hours | **Difficulty**: Intermediate

### [06 - Certificate Rotation](./06_cert_rotation/)
- Zero-downtime rotation
- Automated renewal
- Rotation strategies
- Monitoring expiration
- Emergency rotation procedures

**Time**: 2-3 hours | **Difficulty**: Intermediate

### [07 - Kubernetes Ingress TLS](./07_kubernetes_ingress_tls/)
- Ingress TLS termination
- cert-manager integration
- Wildcard certificates
- Multiple domains
- External DNS integration

**Time**: 3 hours | **Difficulty**: Intermediate

### [08 - Service Mesh mTLS (Istio)](./08_service_mesh_mtls/)
- Istio installation
- Automatic mTLS
- Certificate management
- Authorization policies
- Traffic encryption

**Time**: 4 hours | **Difficulty**: Advanced

### [09 - Certificate Pinning](./09_cert_pinning/)
- Public key pinning
- Certificate pinning in apps
- Rotation challenges
- Trust on first use (TOFU)
- When to use pinning

**Time**: 2 hours | **Difficulty**: Advanced

### [10 - TLS 1.3 and Modern Ciphers](./10_tls_modern_ciphers/)
- TLS 1.3 improvements
- Cipher suite selection
- Disabling weak ciphers
- Perfect Forward Secrecy
- Testing and validation

**Time**: 2-3 hours | **Difficulty**: Intermediate

## Quick Start: Self-Signed Certificate

```bash
# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate signing request
openssl req -new -key server.key -out server.csr \
  -subj "/C=US/ST=CA/L=SF/O=MyOrg/CN=localhost"

# Self-sign certificate
openssl x509 -req -days 365 \
  -in server.csr \
  -signkey server.key \
  -out server.crt

# Verify certificate
openssl x509 -in server.crt -text -noout
```

## Quick Start: Let's Encrypt with Certbot

```bash
# Install certbot
brew install certbot

# Get certificate (standalone)
sudo certbot certonly --standalone \
  -d example.com \
  -d www.example.com

# Certificates saved to:
# /etc/letsencrypt/live/example.com/fullchain.pem
# /etc/letsencrypt/live/example.com/privkey.pem

# Renew
sudo certbot renew

# Auto-renewal (cron)
0 0 * * * /usr/bin/certbot renew --quiet
```

## TLS Configuration Examples

### NGINX Modern Config

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # Certificates
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # TLS 1.2 and 1.3 only
    ssl_protocols TLSv1.2 TLSv1.3;

    # Strong ciphers
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # Perfect Forward Secrecy
    ssl_ecdh_curve secp384r1;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /path/to/chain.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://backend;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

### Mutual TLS (mTLS)

```nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    # Server certificates
    ssl_certificate /path/to/server.crt;
    ssl_certificate_key /path/to/server.key;

    # Client certificate verification
    ssl_client_certificate /path/to/ca.crt;
    ssl_verify_client on;
    ssl_verify_depth 2;

    location / {
        # Pass client certificate info to backend
        proxy_set_header X-Client-Cert $ssl_client_cert;
        proxy_set_header X-Client-Verify $ssl_client_verify;
        proxy_set_header X-Client-DN $ssl_client_s_dn;
        proxy_pass http://backend;
    }
}
```

### Kubernetes Ingress with TLS

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - example.com
    - www.example.com
    secretName: example-com-tls
  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80
```

## Certificate Lifecycle

```
1. Generate Key Pair
   ↓
2. Create CSR (Certificate Signing Request)
   ↓
3. Submit to CA (Certificate Authority)
   ↓
4. CA Validates Domain Ownership
   ↓
5. CA Issues Certificate
   ↓
6. Deploy Certificate
   ↓
7. Monitor Expiration
   ↓
8. Renew Before Expiry (30 days)
   ↓
9. Rotate Certificate
   ↓
10. Revoke Old Certificate (if needed)
```

## Best Practices

### Certificate Management
- **Use Let's Encrypt** for free certificates
- **Automate renewal** (cert-manager, certbot)
- **Monitor expiration** (30-day alerts)
- **Use wildcards** for subdomains (* .example.com)
- **Separate certs** per environment
- **Backup private keys** securely

### TLS Configuration
- **TLS 1.2 minimum**, prefer TLS 1.3
- **Disable weak ciphers** (RC4, 3DES, MD5)
- **Enable Perfect Forward Secrecy**
- **Use strong key sizes** (2048-bit RSA minimum, prefer 4096)
- **Enable OCSP stapling**
- **Add security headers** (HSTS, etc.)

### mTLS Implementation
- **Automate with service mesh** (Istio, Linkerd)
- **Short-lived certificates** (hours to days)
- **Automatic rotation**
- **Verify certificate chains**
- **Monitor TLS handshakes**

## Testing and Validation

```bash
# Test TLS connection
openssl s_client -connect example.com:443

# Check certificate expiration
echo | openssl s_client -connect example.com:443 2>/dev/null | \
  openssl x509 -noout -dates

# SSL Labs test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=example.com

# testssl.sh - comprehensive testing
git clone https://github.com/drwetter/testssl.sh
cd testssl.sh
./testssl.sh https://example.com

# Check cipher support
nmap --script ssl-enum-ciphers -p 443 example.com

# Verify certificate chain
openssl verify -CAfile ca-bundle.crt server.crt
```

## Common Issues

### Certificate Not Trusted
- **Cause**: Self-signed or untrusted CA
- **Solution**: Use trusted CA (Let's Encrypt) or install CA cert on clients

### Certificate Expired
- **Cause**: Renewal failed or forgotten
- **Solution**: Automate renewal, monitor expiration

### Certificate Name Mismatch
- **Cause**: CN/SAN doesn't match domain
- **Solution**: Re-issue with correct domain names

### Mixed Content
- **Cause**: HTTPS page loading HTTP resources
- **Solution**: Change all resources to HTTPS or relative URLs

### mTLS Handshake Failure
- **Cause**: Client cert not trusted, expired, or misconfigured
- **Solution**: Verify CA trust chain, check client cert validity

## Security Headers

```nginx
# HSTS - Force HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Prevent clickjacking
add_header X-Frame-Options "SAMEORIGIN" always;

# Prevent MIME sniffing
add_header X-Content-Type-Options "nosniff" always;

# XSS Protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Content Security Policy
add_header Content-Security-Policy "default-src 'self' https:" always;

# Permissions Policy
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

## Tools

```bash
# OpenSSL - Certificate management
openssl version

# Certbot - Let's Encrypt client
certbot --version

# cert-manager - Kubernetes cert automation
kubectl get certificates

# cfssl - CloudFlare PKI toolkit
cfssl version

# step - Step CA CLI
step certificate inspect example.crt

# mkcert - Local development certs
mkcert -install
mkcert example.local
```

## Key Takeaways

1. **Always use TLS in production**
2. **Automate certificate management**
3. **Use Let's Encrypt for free certs**
4. **TLS 1.2 minimum, prefer 1.3**
5. **mTLS for service-to-service communication**
6. **Monitor certificate expiration**
7. **Test TLS configuration regularly**
8. **Enable security headers**

## Next Section

After mastering SSL/TLS, proceed to:
- **5.4.5 Security Scanning**: Vulnerability detection and remediation

---

**Total Time**: 25-30 hours
**Difficulty**: Beginner to Advanced
**Cost**: Free (Let's Encrypt, open source)
