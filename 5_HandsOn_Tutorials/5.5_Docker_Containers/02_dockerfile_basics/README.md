# Tutorial 02: Dockerfile Basics

## Objectives
- Understand what a Dockerfile is and why it's important
- Learn core Dockerfile instructions: FROM, RUN, CMD, COPY, WORKDIR, ENV
- Create your first custom Docker image
- Understand image layers and caching
- Build and run containers from custom images

## Prerequisites
- Completed Tutorial 01 (Hello Docker)
- Basic understanding of Docker commands
- Text editor for creating Dockerfiles

## What is a Dockerfile?

A **Dockerfile** is a text file containing instructions to build a Docker image. Think of it as a recipe that tells Docker how to create your custom image step by step.

**Key Benefits:**
- **Reproducibility**: Same Dockerfile = Same image everywhere
- **Version Control**: Store in Git with your code
- **Automation**: Automated image builds
- **Documentation**: Self-documenting infrastructure

## Core Dockerfile Instructions

### FROM - Base Image
Every Dockerfile starts with FROM, specifying the base image:
```dockerfile
FROM ubuntu:22.04
FROM python:3.9
FROM node:18-alpine
```

### RUN - Execute Commands
Runs commands during image build:
```dockerfile
RUN apt-get update && apt-get install -y curl
RUN pip install flask
RUN npm install express
```

### CMD - Default Command
Specifies the default command when container starts:
```dockerfile
CMD ["python", "app.py"]
CMD ["npm", "start"]
```

### COPY - Copy Files
Copies files from host to image:
```dockerfile
COPY app.py /app/
COPY package.json /app/
```

### WORKDIR - Set Working Directory
Sets the working directory for subsequent instructions:
```dockerfile
WORKDIR /app
```

### ENV - Environment Variables
Sets environment variables:
```dockerfile
ENV APP_PORT=8000
ENV DEBUG=false
```

## Step-by-Step Instructions

### Example 1: Simple Ubuntu Container

Create a file named `Dockerfile`:

```dockerfile
# Use Ubuntu as base image
FROM ubuntu:22.04

# Update package list and install packages
RUN apt-get update && \
    apt-get install -y \
    curl \
    vim \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set environment variable
ENV WELCOME_MESSAGE="Hello from custom Ubuntu!"

# Default command
CMD ["bash"]
```

**Build and run:**
```bash
# Build the image
docker build -t my-ubuntu .

# Run the container
docker run -it my-ubuntu

# Inside container, verify installations:
curl --version
vim --version
git --version
echo $WELCOME_MESSAGE
exit
```

### Example 2: Python Web Application

Let's create a simple Flask application.

**Step 1: Create the application file** `app.py`:

```python
from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return '''
    <h1>Hello from Docker!</h1>
    <p>This Flask app is running inside a Docker container.</p>
    '''

@app.route('/health')
def health():
    return {'status': 'healthy'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

**Step 2: Create** `requirements.txt`:

```text
Flask==3.0.0
```

**Step 3: Create** `Dockerfile`:

```dockerfile
# Use official Python runtime as base image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Set environment variable
ENV FLASK_APP=app.py

# Expose port
EXPOSE 5000

# Run the application
CMD ["python", "app.py"]
```

**Step 4: Build and run:**

```bash
# Build the image
docker build -t my-flask-app .

# Run the container
docker run -d -p 5000:5000 --name flask-app my-flask-app

# Test it
curl http://localhost:5000
curl http://localhost:5000/health

# View logs
docker logs flask-app

# Cleanup
docker stop flask-app && docker rm flask-app
```

### Example 3: Node.js Application

**Step 1: Create** `app.js`:

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Node.js in Docker!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 2: Create** `package.json`:

```json
{
  "name": "docker-node-app",
  "version": "1.0.0",
  "description": "Simple Node.js app in Docker",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

**Step 3: Create** `Dockerfile`:

```dockerfile
# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY app.js .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Run the application
CMD ["npm", "start"]
```

**Step 4: Build and run:**

```bash
# Build the image
docker build -t my-node-app .

# Run the container
docker run -d -p 3000:3000 --name node-app my-node-app

# Test it
curl http://localhost:3000
curl http://localhost:3000/health

# View logs
docker logs -f node-app

# Cleanup
docker stop node-app && docker rm node-app
```

## Understanding Image Layers

Every Dockerfile instruction creates a new layer in the image. Understanding layers is crucial for optimization.

### View Image Layers

```bash
# Build an image
docker build -t my-flask-app .

# View image history (layers)
docker history my-flask-app
```

### Layer Caching

Docker caches layers to speed up builds. If an instruction hasn't changed, Docker reuses the cached layer.

**Example - Poor Layer Ordering:**
```dockerfile
FROM python:3.9-slim
COPY . .                          # Changes often - invalidates cache
RUN pip install -r requirements.txt  # Reinstalls every time!
```

**Example - Good Layer Ordering:**
```dockerfile
FROM python:3.9-slim
COPY requirements.txt .           # Changes rarely
RUN pip install -r requirements.txt  # Cached unless requirements change
COPY . .                          # Changes often - but doesn't affect deps
```

## Advanced Dockerfile Instructions

### LABEL - Metadata

```dockerfile
FROM ubuntu:22.04
LABEL maintainer="your-email@example.com"
LABEL version="1.0"
LABEL description="Custom Ubuntu image with tools"
```

### ARG - Build Arguments

```dockerfile
FROM python:3.9
ARG APP_VERSION=1.0
ENV VERSION=${APP_VERSION}
```

Build with custom argument:
```bash
docker build --build-arg APP_VERSION=2.0 -t myapp .
```

### EXPOSE - Document Ports

```dockerfile
EXPOSE 8080
EXPOSE 8443
```

Note: EXPOSE doesn't actually publish the port, it's documentation. Use `-p` when running.

### USER - Set User

```dockerfile
FROM ubuntu:22.04
RUN useradd -m appuser
USER appuser
```

### VOLUME - Define Mount Points

```dockerfile
VOLUME /data
```

### ENTRYPOINT vs CMD

**CMD**: Can be overridden easily
```dockerfile
CMD ["python", "app.py"]
```

**ENTRYPOINT**: Main executable (harder to override)
```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
```

This allows: `docker run myimage other.py`

## Best Practices

### 1. Use Specific Base Image Tags

```dockerfile
# Bad - version can change
FROM python:3

# Good - specific version
FROM python:3.9-slim
```

### 2. Minimize Layers

```dockerfile
# Bad - creates 3 layers
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y git

# Good - creates 1 layer
RUN apt-get update && \
    apt-get install -y curl git && \
    rm -rf /var/lib/apt/lists/*
```

### 3. Use .dockerignore

Create `.dockerignore` to exclude unnecessary files:

```text
node_modules
*.log
.git
.env
__pycache__
*.pyc
.pytest_cache
dist
build
```

### 4. Order Instructions by Change Frequency

```dockerfile
FROM node:18-alpine
WORKDIR /app

# Least frequently changed
COPY package*.json ./
RUN npm install

# Most frequently changed
COPY . .

CMD ["npm", "start"]
```

### 5. Use Multi-line Commands for Readability

```dockerfile
RUN apt-get update && \
    apt-get install -y \
        curl \
        git \
        vim \
    && rm -rf /var/lib/apt/lists/*
```

## Practical Examples

### Example 4: Static Website with Nginx

**Step 1: Create** `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Docker Static Site</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f0f0f0;
        }
        h1 { color: #0066cc; }
    </style>
</head>
<body>
    <h1>Welcome to My Dockerized Website!</h1>
    <p>This static website is being served by Nginx inside a Docker container.</p>
    <ul>
        <li>Fast deployment</li>
        <li>Consistent environment</li>
        <li>Easy scaling</li>
    </ul>
</body>
</html>
```

**Step 2: Create** `Dockerfile`:

```dockerfile
FROM nginx:alpine

# Copy custom HTML
COPY index.html /usr/share/nginx/html/

# Expose port
EXPOSE 80

# Nginx runs by default (from base image)
```

**Step 3: Build and run:**

```bash
# Build
docker build -t my-static-site .

# Run
docker run -d -p 8080:80 --name static-site my-static-site

# Access: http://localhost:8080

# Cleanup
docker stop static-site && docker rm static-site
```

## Verification

Create a complete Python application from scratch:

```bash
# Create project directory
mkdir -p ~/docker-practice/python-app
cd ~/docker-practice/python-app

# Create app.py
cat > app.py << 'EOF'
import http.server
import socketserver

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at port {PORT}")
    httpd.serve_forever()
EOF

# Create index.html
cat > index.html << 'EOF'
<html>
<body>
<h1>Python HTTP Server in Docker</h1>
<p>Successfully built and running!</p>
</body>
</html>
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM python:3.9-slim
WORKDIR /app
COPY app.py index.html ./
EXPOSE 8000
CMD ["python", "app.py"]
EOF

# Build and run
docker build -t python-server .
docker run -d -p 8000:8000 --name py-server python-server

# Test
curl http://localhost:8000

# Cleanup
docker stop py-server && docker rm py-server
```

## Common Dockerfile Patterns

### Pattern 1: Installing System Dependencies

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        python3 \
        python3-pip \
    && rm -rf /var/lib/apt/lists/*
```

### Pattern 2: Application with Dependencies

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["python", "app.py"]
```

### Pattern 3: Using Build Arguments

```dockerfile
FROM node:18-alpine

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app
COPY package*.json ./

RUN if [ "$NODE_ENV" = "development" ]; \
    then npm install; \
    else npm install --only=production; \
    fi

COPY . .
CMD ["npm", "start"]
```

## Troubleshooting

### Build Fails - Command Not Found
```dockerfile
# Problem: Package not installed
RUN some-command

# Solution: Install the package first
RUN apt-get update && apt-get install -y package-name
```

### Permission Denied
```dockerfile
# Problem: File not executable
CMD ["./script.sh"]

# Solution: Make it executable
RUN chmod +x script.sh
CMD ["./script.sh"]
```

### Large Image Size
```bash
# Check image size
docker images my-app

# Solution: Use smaller base images
FROM python:3.9-slim    # Instead of python:3.9
FROM node:18-alpine     # Instead of node:18
FROM nginx:alpine       # Instead of nginx
```

## Practice Exercises

### Exercise 1: Go Application

Create a Dockerfile for this Go app:

```go
// main.go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello from Go in Docker!")
    })
    http.ListenAndServe(":8080", nil)
}
```

<details>
<summary>Solution</summary>

```dockerfile
FROM golang:1.21-alpine

WORKDIR /app
COPY main.go .

RUN go build -o server main.go

EXPOSE 8080
CMD ["./server"]
```
</details>

### Exercise 2: Multi-file Application

Create a Dockerfile for an app with multiple files in different directories.

### Exercise 3: Optimized Build

Take a working Dockerfile and optimize it for:
- Smaller image size
- Faster builds
- Better caching

## Key Concepts Summary

| Instruction | Purpose | Example |
|------------|---------|---------|
| FROM | Set base image | `FROM ubuntu:22.04` |
| RUN | Execute commands during build | `RUN apt-get update` |
| CMD | Default command at runtime | `CMD ["python", "app.py"]` |
| COPY | Copy files to image | `COPY app.py /app/` |
| WORKDIR | Set working directory | `WORKDIR /app` |
| ENV | Set environment variable | `ENV PORT=8000` |
| EXPOSE | Document ports | `EXPOSE 8080` |
| LABEL | Add metadata | `LABEL version="1.0"` |
| ARG | Build-time variables | `ARG VERSION=1.0` |
| USER | Set user | `USER appuser` |

## Next Steps

You've learned how to create Dockerfiles and build custom images! Next:
- **Tutorial 03**: Build more complex custom images with optimization
- **Tutorial 04**: Learn multi-stage builds to drastically reduce image size
- **Tutorial 05**: Use docker-compose to manage multi-container applications

## Additional Resources

- [Dockerfile Reference](https://docs.docker.com/engine/reference/builder/)
- [Best Practices Guide](https://docs.docker.com/develop/dev-best-practices/)
- [.dockerignore documentation](https://docs.docker.com/engine/reference/builder/#dockerignore-file)

## Key Takeaways

1. Dockerfile is a blueprint for building Docker images
2. Each instruction creates a new layer
3. Layer order matters for caching efficiency
4. Use specific base image versions for reproducibility
5. Minimize layers by combining RUN commands
6. Use .dockerignore to exclude unnecessary files
7. Follow the principle: dependencies first, code last
8. Always clean up in the same RUN command (apt cache, etc.)
