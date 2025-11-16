#!/bin/bash
# Script to compare single-stage vs multi-stage builds

echo "=========================================="
echo "Docker Multi-Stage Build Comparison"
echo "=========================================="
echo ""

# Function to build and measure
build_and_measure() {
    local name=$1
    local dockerfile=$2
    local context=$3

    echo "Building $name..."
    docker build -t "$name" -f "$dockerfile" "$context" > /dev/null 2>&1

    size=$(docker images "$name" --format "{{.Size}}")
    echo "  Image size: $size"
}

# Go Example
echo "1. Go Application:"
if [ -d "go-example" ]; then
    cd go-example
    build_and_measure "go-multistage" "Dockerfile" "."
    cd ..
fi
echo ""

# Node Example
echo "2. Node.js Application:"
if [ -d "node-example" ]; then
    cd node-example
    build_and_measure "node-multistage" "Dockerfile" "."
    cd ..
fi
echo ""

# Python Example
echo "3. Python Application:"
if [ -d "python-example" ]; then
    cd python-example
    build_and_measure "python-multistage" "Dockerfile" "."
    cd ..
fi
echo ""

echo "=========================================="
echo "Summary:"
docker images | grep -E "go-multistage|node-multistage|python-multistage"
echo "=========================================="
