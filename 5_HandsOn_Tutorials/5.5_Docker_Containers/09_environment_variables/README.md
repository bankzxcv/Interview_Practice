# Tutorial 09: Environment Variables and Secrets

## Objectives
- Master environment variable management in Docker
- Learn different ways to pass environment variables
- Implement secure secrets management
- Use .env files effectively
- Handle configuration across environments

## Prerequisites
- Completed Tutorial 08 (Networks)
- Understanding of environment variables
- Basic security awareness

## Why Environment Variables?

Environment variables enable:
- **Configuration without code changes**
- **Different settings per environment**
- **Secure handling of credentials**
- **Easy deployment automation**

## Methods to Pass Environment Variables

### 1. Command Line (-e flag)

```bash
docker run -e DATABASE_URL=postgresql://localhost/mydb \
           -e API_KEY=secret123 \
           -e DEBUG=true \
           myapp
```

### 2. Environment File (--env-file)

`.env`:
```bash
DATABASE_URL=postgresql://localhost/mydb
API_KEY=secret123
DEBUG=true
PORT=3000
```

```bash
docker run --env-file .env myapp
```

### 3. Dockerfile ENV

```dockerfile
FROM node:18
ENV NODE_ENV=production
ENV PORT=3000
CMD ["npm", "start"]
```

### 4. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://db:5432/myapp
    env_file:
      - .env
      - .env.local
```

## Docker Compose Environment Variables

### Example 1: Basic Configuration

`docker-compose.yml`:
```yaml
version: '3.8'

services:
  web:
    build: .
    environment:
      # Direct assignment
      - NODE_ENV=production
      - PORT=3000

      # From compose host environment
      - DEBUG=${DEBUG}

      # With default value
      - LOG_LEVEL=${LOG_LEVEL:-info}

    env_file:
      - .env
      - .env.production

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
```

`.env`:
```bash
# Application
NODE_ENV=production
DEBUG=false
LOG_LEVEL=info
PORT=3000

# Database
DB_NAME=myapp
DB_USER=admin
DB_PASSWORD=secret123

# External Services
API_KEY=your-api-key-here
STRIPE_KEY=sk_test_xxx
```

### Example 2: Multiple Environment Files

Development (`.env.dev`):
```bash
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
DATABASE_URL=postgresql://localhost:5432/myapp_dev
```

Production (`.env.prod`):
```bash
NODE_ENV=production
DEBUG=false
LOG_LEVEL=warn
DATABASE_URL=postgresql://db-prod:5432/myapp
```

```bash
# Development
docker-compose --env-file .env.dev up

# Production
docker-compose --env-file .env.prod up
```

## Secrets Management

### 1. Docker Secrets (Swarm Mode)

```yaml
version: '3.8'

services:
  web:
    image: myapp
    secrets:
      - db_password
      - api_key
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password
      - API_KEY_FILE=/run/secrets/api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    external: true
```

### 2. BuildKit Secrets (Build Time)

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.9

WORKDIR /app

# Use secret during build (doesn't persist in image)
RUN --mount=type=secret,id=pip_auth,target=/root/.pip/pip.conf \
    pip install -r requirements.txt
```

Build:
```bash
DOCKER_BUILDKIT=1 docker build \
  --secret id=pip_auth,src=$HOME/.pip/pip.conf \
  -t myapp .
```

### 3. Encrypted Environment Variables

```bash
# Encrypt sensitive values
echo "secret123" | openssl enc -aes-256-cbc -pbkdf2 -salt -out secret.enc

# Decrypt in container entrypoint
openssl enc -d -aes-256-cbc -pbkdf2 -in /secrets/secret.enc
```

## Complete Example: Multi-Environment Application

**Project Structure:**
```
my-app/
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── .env
├── .env.local (gitignored)
├── secrets/
│   ├── db_password.txt
│   └── api_key.txt
└── app/
```

`docker-compose.yml` (base):
```yaml
version: '3.8'

services:
  app:
    build:
      context: ./app
      args:
        - BUILD_DATE=${BUILD_DATE}
        - VERSION=${VERSION:-1.0.0}
    environment:
      # Application
      - APP_NAME=${APP_NAME:-MyApp}
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=${PORT:-3000}

      # Database
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}

      # Redis
      - REDIS_URL=redis://redis:6379/${REDIS_DB:-0}

      # External Services
      - API_BASE_URL=${API_BASE_URL}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}

    env_file:
      - .env
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network

networks:
  app-network:

volumes:
  db_data:
  redis_data:
```

`docker-compose.dev.yml` (development overrides):
```yaml
version: '3.8'

services:
  app:
    build:
      target: development
    environment:
      - NODE_ENV=development
      - DEBUG=true
    volumes:
      - ./app:/app
      - /app/node_modules
    ports:
      - "3000:3000"
      - "9229:9229"  # Debugger
    command: npm run dev

  db:
    ports:
      - "5432:5432"

  redis:
    ports:
      - "6379:6379"
```

`docker-compose.prod.yml` (production overrides):
```yaml
version: '3.8'

services:
  app:
    build:
      target: production
    environment:
      - NODE_ENV=production
      - DEBUG=false
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

`.env.example` (commit to git):
```bash
# Application Settings
APP_NAME=MyApp
VERSION=1.0.0
NODE_ENV=production
PORT=3000
DEBUG=false

# Database Configuration
DB_NAME=myapp
DB_USER=admin
DB_PASSWORD=CHANGE_ME

# Redis Configuration
REDIS_DB=0
REDIS_PASSWORD=CHANGE_ME

# External Services
API_BASE_URL=https://api.example.com
API_KEY=YOUR_API_KEY

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=CHANGE_ME

# Security
JWT_SECRET=CHANGE_ME
ENCRYPTION_KEY=CHANGE_ME
```

**Run different environments:**

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Application Code Examples

### Node.js

```javascript
// config.js
require('dotenv').config();

module.exports = {
  app: {
    name: process.env.APP_NAME || 'MyApp',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,
    debug: process.env.DEBUG === 'true'
  },
  database: {
    url: process.env.DATABASE_URL,
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS) || 10
  },
  redis: {
    url: process.env.REDIS_URL
  },
  secrets: {
    jwtSecret: process.env.JWT_SECRET,
    apiKey: process.env.API_KEY
  }
};
```

### Python

```python
# config.py
import os
from typing import Optional

class Config:
    # Application
    APP_NAME: str = os.getenv('APP_NAME', 'MyApp')
    ENV: str = os.getenv('NODE_ENV', 'development')
    PORT: int = int(os.getenv('PORT', 3000))
    DEBUG: bool = os.getenv('DEBUG', 'false').lower() == 'true'

    # Database
    DATABASE_URL: str = os.getenv('DATABASE_URL', '')

    # Redis
    REDIS_URL: str = os.getenv('REDIS_URL', '')

    # Secrets
    JWT_SECRET: str = os.getenv('JWT_SECRET', '')
    API_KEY: str = os.getenv('API_KEY', '')

    @classmethod
    def validate(cls):
        """Validate required environment variables"""
        required = ['DATABASE_URL', 'JWT_SECRET']
        missing = [key for key in required if not getattr(cls, key)]

        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

# Validate on import
Config.validate()
```

## Security Best Practices

### 1. Never Commit Secrets

`.gitignore`:
```
.env
.env.local
.env.*.local
secrets/
*.key
*.pem
```

### 2. Use .env.example

```bash
# Copy example file
cp .env.example .env

# Edit with actual values
vim .env
```

### 3. Validate Environment Variables

```python
# At application startup
required_vars = ['DATABASE_URL', 'API_KEY', 'JWT_SECRET']
missing = [var for var in required_vars if not os.getenv(var)]

if missing:
    raise Exception(f"Missing required environment variables: {missing}")
```

### 4. Use Secrets for Sensitive Data

```yaml
services:
  app:
    environment:
      # Public config - OK
      - NODE_ENV=production
      - PORT=3000

    secrets:
      # Sensitive data - use secrets
      - db_password
      - api_key

secrets:
  db_password:
    file: ./secrets/db_password.txt
  api_key:
    external: true
```

### 5. Rotate Secrets Regularly

```bash
# Generate new secret
openssl rand -base64 32 > secrets/new_api_key.txt

# Update in production
docker secret create api_key_v2 secrets/new_api_key.txt

# Update service
docker service update --secret-rm api_key --secret-add api_key_v2 myservice
```

## Environment Variable Precedence

1. Compose file `environment` key
2. Environment file specified with `env_file`
3. Dockerfile `ENV` instructions
4. Variable not defined (empty string)

## Common Patterns

### Pattern 1: Database Connection

```yaml
environment:
  - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

### Pattern 2: Feature Flags

```yaml
environment:
  - FEATURE_NEW_UI=${FEATURE_NEW_UI:-false}
  - FEATURE_ANALYTICS=${FEATURE_ANALYTICS:-true}
```

### Pattern 3: Service Discovery

```yaml
environment:
  - AUTH_SERVICE_URL=http://auth:8080
  - PAYMENT_SERVICE_URL=http://payment:8080
  - EMAIL_SERVICE_URL=http://email:8080
```

## Troubleshooting

### Variable Not Expanding

```bash
# Wrong - single quotes prevent expansion
- DATABASE_URL='postgresql://db:5432/${DB_NAME}'

# Correct - use double quotes or no quotes
- DATABASE_URL=postgresql://db:5432/${DB_NAME}
```

### Empty Variable Values

```bash
# Check if variable is set
docker-compose config

# Print specific variable
docker-compose exec app printenv DATABASE_URL
```

## Best Practices

1. **Use .env.example** for documentation
2. **Never commit .env** files with secrets
3. **Validate required variables** at startup
4. **Use defaults wisely** with `${VAR:-default}`
5. **Separate secrets** from config
6. **Rotate secrets** regularly
7. **Use specific names** (DATABASE_URL not URL)
8. **Document all variables**
9. **Use type conversion** in application code
10. **Audit environment** regularly

## Next Steps

- **Tutorial 10**: Full-stack application
- **Tutorial 11**: Health checks
- **Tutorial 12**: Resource limits

## Key Takeaways

1. Environment variables enable flexible configuration
2. Multiple methods to pass env vars
3. .env files simplify management
4. Use docker secrets for sensitive data
5. Never commit secrets to git
6. Validate required variables at startup
7. Use defaults with ${VAR:-default}
8. Separate config per environment
9. Document all environment variables
10. Regular security audits essential
