# Tutorial 10: Full-Stack Application

## Objectives
- Build a complete production-ready full-stack application
- Integrate frontend, backend, database, cache, and worker processes
- Implement proper networking, volumes, and environment configuration
- Use health checks and restart policies
- Deploy a real-world application architecture

## Prerequisites
- Completed Tutorials 01-09
- Understanding of full-stack architecture
- Familiarity with React, Node.js, and databases

## Application Architecture

```
┌─────────────┐
│   Nginx     │  ← Static files + Reverse proxy
│  (Frontend) │
└──────┬──────┘
       │
┌──────▼──────┐
│   Node.js   │  ← REST API
│   (Backend) │
└─┬────────┬──┘
  │        │
  │     ┌──▼──────┐
  │     │  Redis  │  ← Session store + cache
  │     └─────────┘
  │
┌─▼────────────┐
│  PostgreSQL  │  ← Primary database
└──────────────┘

┌──────────────┐
│    Worker    │  ← Background jobs
└──────────────┘
```

## Complete docker-compose.yml

```yaml
version: '3.8'

services:
  # Frontend - React App served by Nginx
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:5000}
    image: fullstack-frontend:${VERSION:-latest}
    container_name: frontend
    ports:
      - "${FRONTEND_PORT:-80}:80"
    networks:
      - frontend-network
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Backend - Node.js Express API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    image: fullstack-backend:${VERSION:-latest}
    container_name: backend
    ports:
      - "${BACKEND_PORT:-5000}:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - REDIS_URL=redis://redis:6379/0
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
    env_file:
      - .env
    networks:
      - frontend-network
      - backend-network
      - database-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/app/uploads
      - backend-logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # Database - PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
    ports:
      - "${DB_PORT:-5432}:5432"
    networks:
      - database-network
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d:ro
      - ./database/backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Cache/Session Store - Redis
  redis:
    image: redis:7-alpine
    container_name: redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    ports:
      - "${REDIS_PORT:-6379}:6379"
    networks:
      - backend-network
    volumes:
      - redis-data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  # Background Worker
  worker:
    build:
      context: ./worker
      dockerfile: Dockerfile
    image: fullstack-worker:${VERSION:-latest}
    container_name: worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0
      - WORKER_CONCURRENCY=${WORKER_CONCURRENCY:-5}
    networks:
      - backend-network
      - database-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - worker-logs:/app/logs
    restart: unless-stopped

  # Database Admin - pgAdmin
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    environment:
      - PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL:-admin@example.com}
      - PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD:-admin}
      - PGADMIN_CONFIG_SERVER_MODE=False
    ports:
      - "${PGADMIN_PORT:-5050}:80"
    networks:
      - database-network
    volumes:
      - pgadmin-data:/var/lib/pgadmin
    depends_on:
      - postgres
    restart: unless-stopped
    profiles:
      - admin

  # Redis Commander - Redis Admin
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: redis-commander
    environment:
      - REDIS_HOSTS=local:redis:6379:0:${REDIS_PASSWORD}
    ports:
      - "${REDIS_COMMANDER_PORT:-8081}:8081"
    networks:
      - backend-network
    depends_on:
      - redis
    restart: unless-stopped
    profiles:
      - admin

networks:
  frontend-network:
    driver: bridge
  backend-network:
    driver: bridge
  database-network:
    driver: bridge
    internal: true

volumes:
  postgres-data:
    driver: local
  redis-data:
    driver: local
  backend-logs:
  worker-logs:
  pgadmin-data:
