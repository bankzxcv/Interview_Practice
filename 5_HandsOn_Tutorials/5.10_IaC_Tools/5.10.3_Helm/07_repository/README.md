# Helm Chart Repository

## Overview
Learn to create, publish, and manage Helm chart repositories.

## Package Chart

```bash
# Package chart
helm package my-app

# Creates: my-app-0.1.0.tgz
```

## Local Repository

```bash
# Create repository index
helm repo index . --url http://charts.example.com

# Start local server
python3 -m http.server 8080

# Add repository
helm repo add myrepo http://localhost:8080

# Update
helm repo update

# Install from repo
helm install my-release myrepo/my-app
```

## ChartMuseum

```bash
# Install ChartMuseum
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/charts:/charts \
  chartmuseum/chartmuseum

# Upload chart
curl --data-binary "@my-app-0.1.0.tgz" \
  http://localhost:8080/api/charts
```

## GitHub Pages Repository

```bash
# Package charts
helm package my-app -d charts/

# Create index
helm repo index charts/ --url https://username.github.io/helm-charts/

# Commit and push
git add charts/
git commit -m "Add chart"
git push

# Add repository
helm repo add myrepo https://username.github.io/helm-charts/
```

## Harbor Registry

```bash
# Login to Harbor
helm registry login harbor.example.com

# Push chart
helm push my-app-0.1.0.tgz oci://harbor.example.com/charts

# Install from OCI registry
helm install my-release oci://harbor.example.com/charts/my-app --version 0.1.0
```

## Next Steps
- Tutorial 08: Production Charts
