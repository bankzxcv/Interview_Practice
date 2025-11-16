# Tutorial 08: Docker Networks

## Objectives
- Understand Docker networking concepts
- Learn different network drivers: bridge, host, none, overlay
- Create and manage custom networks
- Implement network isolation and security
- Configure service discovery and DNS

## Prerequisites
- Completed Tutorial 07 (Volumes)
- Understanding of basic networking concepts
- Docker Compose knowledge

## Docker Network Drivers

### 1. Bridge (Default)
- Default network driver
- Isolated network on the host
- Containers on same bridge can communicate
- Best for standalone containers

### 2. Host
- Container shares host's network
- No network isolation
- Better performance
- Port conflicts possible

### 3. None
- No networking
- Complete isolation
- Good for security/testing

### 4. Overlay
- Multi-host networking
- For Docker Swarm
- Enables container communication across hosts

### 5. Macvlan
- Assign MAC address to container
- Appears as physical device
- Legacy application support

## Basic Network Commands

```bash
# List networks
docker network ls

# Inspect network
docker network inspect bridge

# Create network
docker network create my-network

# Create network with specific driver
docker network create --driver bridge --subnet 172.20.0.0/16 custom-network

# Connect container to network
docker network connect my-network container-name

# Disconnect container from network
docker network disconnect my-network container-name

# Remove network
docker network rm my-network

# Prune unused networks
docker network prune
```

## Example 1: Custom Bridge Network

```bash
# Create custom network
docker network create \
  --driver bridge \
  --subnet 172.25.0.0/16 \
  --gateway 172.25.0.1 \
  --ip-range 172.25.0.0/24 \
  my-app-network

# Run containers on custom network
docker run -d \
  --name web \
  --network my-app-network \
  --ip 172.25.0.10 \
  nginx

docker run -d \
  --name api \
  --network my-app-network \
  --ip 172.25.0.11 \
  my-api-image

# Containers can communicate by name
docker exec web ping api
docker exec api curl http://web
```

## Example 2: Multi-Network Architecture

```yaml
version: '3.8'

services:
  # Frontend (public network only)
  frontend:
    image: nginx:alpine
    ports:
      - "80:80"
    networks:
      - public
    configs:
      - source: nginx-config
        target: /etc/nginx/nginx.conf

  # API (public + private networks)
  api:
    build: ./api
    networks:
      - public
      - private
    environment:
      - DATABASE_URL=postgresql://db:5432/mydb
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache

  # Database (private network only)
  db:
    image: postgres:15-alpine
    networks:
      - private
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - db_data:/var/lib/postgresql/data

  # Cache (private network only)
  cache:
    image: redis:7-alpine
    networks:
      - private

networks:
  # Public network - internet facing
  public:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16

  # Private network - internal only
  private:
    driver: bridge
    internal: true  # No external access
    ipam:
      config:
        - subnet: 172.29.0.0/16

volumes:
  db_data:

configs:
  nginx-config:
    file: ./nginx.conf
```

## Example 3: Service Discovery

Docker provides automatic DNS resolution for containers on the same network.

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    networks:
      - app-network

  api:
    build: ./api
    networks:
      - app-network
    environment:
      # Can use service name as hostname
      - WEB_URL=http://web
      - DB_HOST=database
      - CACHE_HOST=redis

  database:
    image: postgres:15-alpine
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Example 4: Network Aliases

```yaml
version: '3.8'

services:
  api:
    build: ./api
    networks:
      app-network:
        aliases:
          - api-server
          - backend
          - rest-api

  database:
    image: postgres:15
    networks:
      app-network:
        aliases:
          - db
          - postgres
          - primary-db

networks:
  app-network:
```

Access service using any alias:
```bash
docker exec some-container ping api-server
docker exec some-container ping backend
docker exec some-container ping rest-api
```

## Example 5: External Networks

Share network between multiple Compose projects:

```bash
# Create external network
docker network create shared-network
```

**Project A - docker-compose.yml:**
```yaml
version: '3.8'

services:
  app-a:
    build: .
    networks:
      - shared-network

networks:
  shared-network:
    external: true
```

**Project B - docker-compose.yml:**
```yaml
version: '3.8'

services:
  app-b:
    build: .
    networks:
      - shared-network

networks:
  shared-network:
    external: true
```

Now `app-a` and `app-b` can communicate!

## Complete Example: Microservices Architecture

```yaml
version: '3.8'

services:
  # API Gateway (public + backend networks)
  gateway:
    build: ./gateway
    ports:
      - "80:80"
      - "443:443"
    networks:
      - public
      - backend
    environment:
      - AUTH_SERVICE=http://auth:8080
      - USER_SERVICE=http://users:8080
      - ORDER_SERVICE=http://orders:8080

  # Authentication Service
  auth:
    build: ./services/auth
    networks:
      - backend
      - database
    environment:
      - DB_HOST=auth-db
      - REDIS_HOST=session-cache

  # User Service
  users:
    build: ./services/users
    networks:
      - backend
      - database
    environment:
      - DB_HOST=users-db

  # Order Service
  orders:
    build: ./services/orders
    networks:
      - backend
      - database
      - message-queue
    environment:
      - DB_HOST=orders-db
      - RABBITMQ_HOST=queue

  # Databases (database network only)
  auth-db:
    image: postgres:15-alpine
    networks:
      - database
    environment:
      - POSTGRES_DB=auth

  users-db:
    image: postgres:15-alpine
    networks:
      - database
    environment:
      - POSTGRES_DB=users

  orders-db:
    image: postgres:15-alpine
    networks:
      - database
    environment:
      - POSTGRES_DB=orders

  # Redis for sessions
  session-cache:
    image: redis:7-alpine
    networks:
      - backend

  # RabbitMQ
  queue:
    image: rabbitmq:3-management
    networks:
      - message-queue
    ports:
      - "15672:15672"  # Management UI

networks:
  # Internet-facing
  public:
    driver: bridge

  # Backend services
  backend:
    driver: bridge
    internal: false

  # Database layer
  database:
    driver: bridge
    internal: true  # No external access

  # Message queue
  message-queue:
    driver: bridge
    internal: true

volumes:
  auth_db_data:
  users_db_data:
  orders_db_data:
```

## Network Inspection

```bash
# List all networks
docker network ls

# Inspect network details
docker network inspect my-network

# See which containers are on a network
docker network inspect my-network --format '{{range .Containers}}{{.Name}} {{end}}'

# Test connectivity
docker exec container1 ping container2
docker exec container1 nslookup container2
docker exec container1 curl http://container2:8080

# Monitor network traffic
docker run --rm --net container:my-container nicolaka/netshoot tcpdump
```

## Network Security

### 1. Network Isolation

```yaml
services:
  # Public-facing only
  frontend:
    networks:
      - public

  # Internal only
  backend:
    networks:
      - internal

networks:
  public:
    driver: bridge

  internal:
    driver: bridge
    internal: true  # Prevents external access
```

### 2. Firewall Rules

```yaml
networks:
  custom:
    driver: bridge
    driver_opts:
      com.docker.network.bridge.enable_icc: "false"  # Disable inter-container communication
      com.docker.network.bridge.enable_ip_masquerade: "true"
```

### 3. Network Policies

```yaml
networks:
  app-network:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
          ip_range: 172.28.5.0/24
          gateway: 172.28.5.254
```

## Practical Exercises

### Exercise 1: Three-Tier Architecture

```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    networks:
      - frontend

  app:
    build: ./app
    networks:
      - frontend
      - backend

  db:
    image: postgres:15
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true
```

### Exercise 2: Testing Network Connectivity

```bash
# Create network
docker network create test-network

# Run containers
docker run -dit --name container1 --network test-network alpine
docker run -dit --name container2 --network test-network alpine

# Test connectivity
docker exec container1 ping -c 3 container2
docker exec container2 ping -c 3 container1

# Test DNS
docker exec container1 nslookup container2
```

## Troubleshooting

### Cannot connect to service

```bash
# 1. Check if containers are on same network
docker network inspect my-network

# 2. Check container networking
docker exec container1 ip addr

# 3. Test DNS resolution
docker exec container1 nslookup container2

# 4. Test connectivity
docker exec container1 ping container2
```

### Port conflicts

```bash
# Check what's using the port
sudo lsof -i :8080

# Use different host port
ports:
  - "8081:8080"
```

## Best Practices

1. **Use custom networks** instead of default bridge
2. **Internal networks** for databases and sensitive services
3. **Network aliases** for flexibility
4. **External networks** to share between projects
5. **Minimal network exposure** - only public what's needed
6. **Use DNS names** instead of IP addresses
7. **Document network architecture**
8. **Regular security audits**

## Next Steps

- **Tutorial 09**: Environment variables and secrets
- **Tutorial 10**: Full-stack application
- **Tutorial 11**: Health checks

## Key Takeaways

1. Docker networks enable container communication
2. Bridge is the default network driver
3. Custom networks provide isolation
4. Service names work as DNS hostnames
5. Internal networks prevent external access
6. Multiple networks enable layered architecture
7. Network aliases provide flexibility
8. External networks share between projects
9. Proper network design improves security
10. Always use custom networks in production
