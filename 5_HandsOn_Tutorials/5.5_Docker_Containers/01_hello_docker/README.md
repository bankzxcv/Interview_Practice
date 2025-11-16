# Tutorial 01: Hello Docker

## Objectives
- Understand what Docker is and why it's useful
- Run your first Docker container
- Learn basic Docker commands: `docker run`, `docker ps`, `docker images`
- Understand container lifecycle and basic operations
- Interact with running containers

## Prerequisites
- Docker installed on your system
- Basic command-line knowledge
- No prior Docker experience required

## What is Docker?

Docker is a platform for developing, shipping, and running applications in containers. Containers package an application with all its dependencies, ensuring it runs consistently across different environments.

**Key Benefits:**
- **Consistency**: "Works on my machine" becomes "Works everywhere"
- **Isolation**: Applications run independently without conflicts
- **Portability**: Run anywhere Docker is installed
- **Efficiency**: Lightweight compared to virtual machines

## Step-by-Step Instructions

### Step 1: Verify Docker Installation

```bash
# Check Docker version
docker --version

# Verify Docker is running
docker info
```

**Expected Output:**
```
Docker version 24.x.x, build xxxxx
```

### Step 2: Run Your First Container

```bash
# Run a simple hello-world container
docker run hello-world
```

**What happens:**
1. Docker checks if the image exists locally
2. If not found, it downloads from Docker Hub
3. Creates a container from the image
4. Runs the container
5. Displays the message and exits

**Expected Output:**
```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
...
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### Step 3: Run an Interactive Container

```bash
# Run Ubuntu container interactively
docker run -it ubuntu bash

# Now you're inside the container!
# Try some commands:
ls
pwd
cat /etc/os-release
echo "Hello from inside a container!"

# Exit the container
exit
```

**Explanation:**
- `-it`: Combines `-i` (interactive) and `-t` (pseudo-TTY)
- `ubuntu`: The image name
- `bash`: The command to run inside the container

### Step 4: Run a Container in Detached Mode

```bash
# Run nginx web server in background
docker run -d -p 8080:80 --name my-nginx nginx

# Access it in your browser: http://localhost:8080
# Or use curl:
curl http://localhost:8080
```

**Explanation:**
- `-d`: Detached mode (runs in background)
- `-p 8080:80`: Maps port 8080 on host to port 80 in container
- `--name my-nginx`: Gives the container a friendly name
- `nginx`: The image to use

### Step 5: List Running Containers

```bash
# Show running containers
docker ps

# Show all containers (including stopped ones)
docker ps -a

# Show only container IDs
docker ps -q
```

**Output Explanation:**
```
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS          PORTS                  NAMES
abc123def456   nginx     "/docker-entrypoint.…"   2 minutes ago    Up 2 minutes    0.0.0.0:8080->80/tcp   my-nginx
```

- **CONTAINER ID**: Unique identifier (short form)
- **IMAGE**: Image used to create the container
- **COMMAND**: Command running inside the container
- **CREATED**: When the container was created
- **STATUS**: Current state (Up, Exited, etc.)
- **PORTS**: Port mappings
- **NAMES**: Container name

### Step 6: Interact with Running Containers

```bash
# View logs from a container
docker logs my-nginx

# Follow logs in real-time
docker logs -f my-nginx
# (Press Ctrl+C to stop following)

# Execute a command in a running container
docker exec my-nginx ls /usr/share/nginx/html

# Open an interactive shell in the running container
docker exec -it my-nginx bash
# (Inside the container, you can explore)
ls
cat /etc/nginx/nginx.conf
exit
```

### Step 7: Inspect Container Details

```bash
# Get detailed information about a container
docker inspect my-nginx

# Get specific information using format
docker inspect --format='{{.NetworkSettings.IPAddress}}' my-nginx

# View container resource usage
docker stats my-nginx
# (Press Ctrl+C to stop)
```

### Step 8: Manage Container Lifecycle

```bash
# Stop a running container
docker stop my-nginx

# Verify it's stopped
docker ps
docker ps -a

# Start a stopped container
docker start my-nginx

# Restart a container
docker restart my-nginx

# Pause a running container
docker pause my-nginx

# Unpause it
docker unpause my-nginx
```

### Step 9: List and Manage Images

```bash
# List all downloaded images
docker images

# Get specific information
docker images nginx

# Remove an image (must stop containers using it first)
docker rmi hello-world
```

### Step 10: Cleanup

```bash
# Stop the nginx container
docker stop my-nginx

# Remove the container
docker rm my-nginx

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune
```

## Verification

Run these commands to verify your understanding:

```bash
# 1. Run a new nginx container on port 9090
docker run -d -p 9090:80 --name test-nginx nginx

# 2. Verify it's running
docker ps

# 3. Access it
curl http://localhost:9090

# 4. View logs
docker logs test-nginx

# 5. Stop and remove
docker stop test-nginx
docker rm test-nginx
```

## Key Concepts

### Container vs Image
- **Image**: Read-only template with instructions for creating a container (like a class)
- **Container**: Runnable instance of an image (like an object)

### Container States
- **Created**: Container is created but not started
- **Running**: Container is actively running
- **Paused**: Container process is paused
- **Stopped**: Container has exited
- **Dead**: Container is non-functioning

### Port Mapping
- Format: `-p HOST_PORT:CONTAINER_PORT`
- Example: `-p 8080:80` means:
  - Access container port 80 via host port 8080
  - External requests to `localhost:8080` route to container port 80

### Naming Containers
- Use `--name` to assign friendly names
- Without `--name`, Docker generates random names
- Names must be unique

## Common Commands Summary

```bash
# Running containers
docker run [OPTIONS] IMAGE [COMMAND]
docker run -d                    # Detached mode
docker run -it                   # Interactive mode
docker run -p HOST:CONTAINER     # Port mapping
docker run --name NAME           # Name the container

# Listing
docker ps                        # Running containers
docker ps -a                     # All containers
docker images                    # List images

# Managing containers
docker start CONTAINER           # Start stopped container
docker stop CONTAINER            # Stop running container
docker restart CONTAINER         # Restart container
docker rm CONTAINER              # Remove container
docker logs CONTAINER            # View logs
docker exec CONTAINER COMMAND    # Execute command

# Cleanup
docker container prune           # Remove stopped containers
docker image prune               # Remove unused images
docker system prune              # Remove all unused resources
```

## Troubleshooting

### Port Already in Use
```bash
# Error: port is already allocated
# Solution: Use a different port or stop the conflicting service
docker run -d -p 8081:80 nginx   # Use different port
```

### Container Name Conflict
```bash
# Error: name already in use
# Solution: Remove the old container or use a different name
docker rm old-container
# Or:
docker run --name my-nginx-2 nginx
```

### Cannot Connect to Docker Daemon
```bash
# Error: Cannot connect to the Docker daemon
# Solution: Ensure Docker is running
sudo systemctl start docker      # Linux
# Or restart Docker Desktop       # Windows/Mac
```

## Practice Exercises

1. **Run Multiple Containers**
   ```bash
   # Run 3 nginx containers on different ports
   docker run -d -p 8081:80 --name nginx1 nginx
   docker run -d -p 8082:80 --name nginx2 nginx
   docker run -d -p 8083:80 --name nginx3 nginx

   # List them
   docker ps

   # Stop all and remove
   docker stop nginx1 nginx2 nginx3
   docker rm nginx1 nginx2 nginx3
   ```

2. **Explore Different Images**
   ```bash
   # Try different official images
   docker run -it alpine sh      # Lightweight Linux
   docker run -it python:3.9     # Python environment
   docker run -d redis           # Redis database
   ```

3. **Container Inspection**
   ```bash
   # Run a container
   docker run -d --name inspect-me nginx

   # Get its IP address
   docker inspect --format='{{.NetworkSettings.IPAddress}}' inspect-me

   # Get its status
   docker inspect --format='{{.State.Status}}' inspect-me

   # Cleanup
   docker stop inspect-me && docker rm inspect-me
   ```

## Real-World Use Case

Running a quick web server for testing:

```bash
# Create a simple HTML file
mkdir -p ~/docker-test
echo "<h1>Hello Docker!</h1>" > ~/docker-test/index.html

# Run nginx with your HTML
docker run -d \
  -p 8080:80 \
  --name my-web \
  -v ~/docker-test:/usr/share/nginx/html:ro \
  nginx

# Access: http://localhost:8080
# You'll see your HTML file!

# Cleanup
docker stop my-web && docker rm my-web
```

## Next Steps

Now that you understand basic Docker operations, move on to:
- **Tutorial 02**: Learn how to create your own Docker images using Dockerfiles
- **Tutorial 03**: Build custom images with your applications
- **Tutorial 04**: Optimize images with multi-stage builds

## Additional Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Hub](https://hub.docker.com/) - Find official images
- [Docker Cheat Sheet](https://docs.docker.com/get-started/docker_cheatsheet.pdf)

## Key Takeaways

1. Docker containers are lightweight, isolated environments
2. Containers are created from images
3. Use `docker run` to create and start containers
4. Use `docker ps` to list containers
5. Containers can run in interactive (`-it`) or detached (`-d`) mode
6. Port mapping (`-p`) allows accessing container services from the host
7. Always clean up unused containers and images to save disk space
