#!/bin/bash
# Build script with versioning and metadata

set -e

# Configuration
IMAGE_NAME="user-api"
VERSION="${1:-1.0.0}"
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")

echo "Building ${IMAGE_NAME}:${VERSION}"
echo "Build Date: ${BUILD_DATE}"
echo "VCS Ref: ${VCS_REF}"

# Build the image
docker build \
  --build-arg APP_VERSION="${VERSION}" \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --build-arg VCS_REF="${VCS_REF}" \
  -t "${IMAGE_NAME}:${VERSION}" \
  -t "${IMAGE_NAME}:latest" \
  .

echo ""
echo "Build complete!"
echo "Image: ${IMAGE_NAME}:${VERSION}"
echo ""
echo "To run:"
echo "  docker run -d -p 5000:5000 ${IMAGE_NAME}:${VERSION}"
echo ""
echo "To test:"
echo "  curl http://localhost:5000"
echo "  curl http://localhost:5000/health"
