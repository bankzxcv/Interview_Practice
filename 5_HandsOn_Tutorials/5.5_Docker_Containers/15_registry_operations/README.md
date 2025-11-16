# Tutorial 15: Registry Operations

## Objectives
- Understand Docker registries
- Push and pull images to/from Docker Hub
- Set up private registries
- Implement authentication and security
- Use registry mirrors and proxies
- Manage image lifecycle

## Prerequisites
- Completed Tutorial 14 (Multi-Arch Builds)
- Docker Hub account
- Understanding of image tagging

## What is a Docker Registry?

A registry is a storage and distribution system for Docker images. It enables:
- **Centralized storage** of Docker images
- **Version control** with tags
- **Access control** and authentication
- **Image distribution** across teams/infrastructure

## Types of Registries

1. **Docker Hub**: Public registry (hub.docker.com)
2. **Private Registries**: Self-hosted or managed
3. **Cloud Registries**: AWS ECR, Google GCR, Azure ACR
4. **Enterprise**: Harbor, GitLab Registry, JFrog Artifactory

## Docker Hub Operations

### Login

```bash
# Login to Docker Hub
docker login

# Login with username
docker login -u username

# Login to specific registry
docker login registry.example.com
```

### Pushing Images

```bash
# Tag image for Docker Hub
docker tag myapp username/myapp:latest
docker tag myapp username/myapp:1.0.0
docker tag myapp username/myapp:stable

# Push to Docker Hub
docker push username/myapp:latest
docker push username/myapp:1.0.0

# Push all tags
docker push --all-tags username/myapp
```

### Pulling Images

```bash
# Pull latest
docker pull username/myapp:latest

# Pull specific version
docker pull username/myapp:1.0.0

# Pull specific platform
docker pull --platform linux/arm64 username/myapp:latest

# Pull from different registry
docker pull gcr.io/project/image:tag
```

### Complete Workflow

```bash
# 1. Build image
docker build -t myapp:latest .

# 2. Tag for registry
docker tag myapp:latest username/myapp:latest
docker tag myapp:latest username/myapp:1.0.0

# 3. Login
docker login

# 4. Push
docker push username/myapp:latest
docker push username/myapp:1.0.0

# 5. Verify
docker pull username/myapp:latest
```

## Setting Up Private Registry

### Basic Local Registry

```bash
# Run registry container
docker run -d \
  -p 5000:5000 \
  --restart=always \
  --name registry \
  registry:2

# Tag image for local registry
docker tag myapp localhost:5000/myapp:latest

# Push to local registry
docker push localhost:5000/myapp:latest

# Pull from local registry
docker pull localhost:5000/myapp:latest
```

### Registry with Persistent Storage

```bash
docker run -d \
  -p 5000:5000 \
  --restart=always \
  --name registry \
  -v /mnt/registry:/var/lib/registry \
  registry:2
```

### Docker Compose Registry

```yaml
version: '3.8'

services:
  registry:
    image: registry:2
    ports:
      - "5000:5000"
    environment:
      REGISTRY_STORAGE_FILESYSTEM_ROOTDIRECTORY: /data
    volumes:
      - registry-data:/data
    restart: always

volumes:
  registry-data:
```

## Secured Private Registry

### With Basic Authentication

```yaml
version: '3.8'

services:
  registry:
    image: registry:2
    ports:
      - "5000:5000"
    environment:
      REGISTRY_AUTH: htpasswd
      REGISTRY_AUTH_HTPASSWD_PATH: /auth/htpasswd
      REGISTRY_AUTH_HTPASSWD_REALM: Registry Realm
    volumes:
      - registry-data:/var/lib/registry
      - ./auth:/auth
    restart: always

volumes:
  registry-data:
```

Create auth file:
```bash
# Create htpasswd file
mkdir auth
docker run --rm \
  --entrypoint htpasswd \
  httpd:2 -Bbn username password > auth/htpasswd

# Start registry
docker-compose up -d

# Login to registry
docker login localhost:5000
```

### With TLS/SSL

```yaml
version: '3.8'

services:
  registry:
    image: registry:2
    ports:
      - "443:443"
    environment:
      REGISTRY_HTTP_ADDR: 0.0.0.0:443
      REGISTRY_HTTP_TLS_CERTIFICATE: /certs/domain.crt
      REGISTRY_HTTP_TLS_KEY: /certs/domain.key
      REGISTRY_AUTH: htpasswd
      REGISTRY_AUTH_HTPASSWD_PATH: /auth/htpasswd
    volumes:
      - registry-data:/var/lib/registry
      - ./certs:/certs
      - ./auth:/auth
    restart: always

volumes:
  registry-data:
```

Generate certificates:
```bash
mkdir certs

# Generate self-signed certificate
openssl req -newkey rsa:4096 -nodes -sha256 \
  -keyout certs/domain.key -x509 -days 365 \
  -out certs/domain.crt \
  -subj "/CN=registry.example.com"

# Start registry
docker-compose up -d

# Login
docker login registry.example.com
```

## Registry with Web UI (Harbor-like)

```yaml
version: '3.8'

services:
  # Registry
  registry:
    image: registry:2
    volumes:
      - registry-data:/var/lib/registry
    restart: always

  # Web UI
  registry-ui:
    image: joxit/docker-registry-ui:latest
    ports:
      - "8080:80"
    environment:
      - REGISTRY_TITLE=My Docker Registry
      - REGISTRY_URL=http://registry:5000
      - DELETE_IMAGES=true
      - SHOW_CONTENT_DIGEST=true
      - SINGLE_REGISTRY=true
    depends_on:
      - registry
    restart: always

volumes:
  registry-data:
```

## Cloud Registry Examples

### AWS ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag myapp:latest \
  123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:latest

# Push image
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:latest
```

### Google Container Registry (GCR)

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Tag image
docker tag myapp:latest gcr.io/project-id/myapp:latest

# Push image
docker push gcr.io/project-id/myapp:latest
```

### Azure Container Registry (ACR)

```bash
# Login to ACR
az acr login --name myregistry

# Tag image
docker tag myapp:latest myregistry.azurecr.io/myapp:latest

# Push image
docker push myregistry.azurecr.io/myapp:latest
```

## Registry Mirror/Proxy

```yaml
version: '3.8'

services:
  registry-mirror:
    image: registry:2
    ports:
      - "5000:5000"
    environment:
      REGISTRY_PROXY_REMOTEURL: https://registry-1.docker.io
    volumes:
      - mirror-cache:/var/lib/registry
    restart: always

volumes:
  mirror-cache:
```

Configure Docker to use mirror:
```json
# /etc/docker/daemon.json
{
  "registry-mirrors": ["http://localhost:5000"]
}
```

## Registry API Operations

### List Repositories

```bash
# List repositories
curl -X GET http://localhost:5000/v2/_catalog

# List tags for repository
curl -X GET http://localhost:5000/v2/myapp/tags/list

# With authentication
curl -u username:password -X GET \
  http://localhost:5000/v2/_catalog
```

### Delete Image

```bash
# Get digest
DIGEST=$(curl -I \
  -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
  http://localhost:5000/v2/myapp/manifests/latest \
  | grep Docker-Content-Digest \
  | awk '{print $2}')

# Delete manifest
curl -X DELETE \
  http://localhost:5000/v2/myapp/manifests/$DIGEST

# Garbage collection (in registry container)
docker exec registry bin/registry garbage-collect \
  /etc/docker/registry/config.yml
```

## Automation Scripts

### Build, Tag, and Push

```bash
#!/bin/bash
# build-and-push.sh

set -e

IMAGE_NAME="myapp"
REGISTRY="username"
VERSION="${1:-latest}"

echo "Building image..."
docker build -t $IMAGE_NAME:$VERSION .

echo "Tagging image..."
docker tag $IMAGE_NAME:$VERSION $REGISTRY/$IMAGE_NAME:$VERSION
docker tag $IMAGE_NAME:$VERSION $REGISTRY/$IMAGE_NAME:latest

echo "Pushing to registry..."
docker push $REGISTRY/$IMAGE_NAME:$VERSION
docker push $REGISTRY/$IMAGE_NAME:latest

echo "Done! Image available at:"
echo "  $REGISTRY/$IMAGE_NAME:$VERSION"
echo "  $REGISTRY/$IMAGE_NAME:latest"
```

Usage:
```bash
chmod +x build-and-push.sh
./build-and-push.sh 1.0.0
```

### Multi-Registry Push

```bash
#!/bin/bash
# multi-registry-push.sh

IMAGE_NAME="myapp"
VERSION="$1"

REGISTRIES=(
  "username"                                    # Docker Hub
  "gcr.io/project-id"                          # GCR
  "123456789.dkr.ecr.us-east-1.amazonaws.com"  # ECR
)

for registry in "${REGISTRIES[@]}"; do
  echo "Pushing to $registry..."

  docker tag $IMAGE_NAME:$VERSION $registry/$IMAGE_NAME:$VERSION
  docker push $registry/$IMAGE_NAME:$VERSION

  echo "✓ Pushed to $registry"
done
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Build and Push

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: username/myapp
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
build-push:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker push $CI_REGISTRY_IMAGE:latest
```

## Image Lifecycle Management

### Cleanup Old Images

```bash
#!/bin/bash
# cleanup-old-images.sh

REGISTRY="localhost:5000"
REPOSITORY="myapp"
KEEP_LAST=5

# Get all tags
TAGS=$(curl -s http://$REGISTRY/v2/$REPOSITORY/tags/list | \
  jq -r '.tags[]' | sort -V)

# Count tags
TOTAL=$(echo "$TAGS" | wc -l)
DELETE_COUNT=$((TOTAL - KEEP_LAST))

if [ $DELETE_COUNT -gt 0 ]; then
  echo "$TAGS" | head -n $DELETE_COUNT | while read tag; do
    echo "Deleting $REPOSITORY:$tag"
    # Delete logic here
  done
fi
```

## Best Practices

1. **Use Specific Tags**: Not just `latest`
2. **Semantic Versioning**: v1.0.0, v1.0.1, etc.
3. **Authentication**: Always secure registries
4. **TLS/SSL**: Use HTTPS for production
5. **Backup**: Regular registry backups
6. **Monitoring**: Track registry usage
7. **Cleanup**: Remove unused images
8. **Access Control**: Implement RBAC
9. **Scanning**: Scan images for vulnerabilities
10. **Documentation**: Document tagging strategy

## Troubleshooting

### Push Denied

```bash
# Ensure you're logged in
docker login

# Check image name format
# Should be: registry/username/image:tag
```

### Certificate Errors

```bash
# Add insecure registry (development only)
# /etc/docker/daemon.json
{
  "insecure-registries": ["registry.example.com:5000"]
}

sudo systemctl restart docker
```

### Storage Issues

```bash
# Check registry storage
docker exec registry df -h /var/lib/registry

# Run garbage collection
docker exec registry bin/registry garbage-collect \
  /etc/docker/registry/config.yml
```

## Congratulations!

You've completed all 15 Docker & Containers tutorials! You now have comprehensive knowledge of:

1. Basic Docker operations
2. Creating Dockerfiles
3. Building custom images
4. Multi-stage builds
5. Docker Compose
6. Multi-service applications
7. Data persistence with volumes
8. Networking
9. Environment variables
10. Full-stack applications
11. Health checks
12. Resource limits
13. Security best practices
14. Multi-architecture builds
15. Registry operations

## Next Steps

- **Production Deployment**: Deploy to Kubernetes
- **Orchestration**: Learn Docker Swarm or Kubernetes
- **CI/CD**: Implement automated pipelines
- **Monitoring**: Set up Prometheus and Grafana
- **Service Mesh**: Explore Istio or Linkerd

## Key Takeaways

1. Registries centralize image distribution
2. Docker Hub is the default public registry
3. Private registries for internal images
4. Always use authentication
5. Implement TLS for production
6. Tag images with versions
7. Automate push in CI/CD
8. Regular cleanup prevents storage issues
9. Use registry mirrors for performance
10. Cloud registries integrate with cloud platforms
