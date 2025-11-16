# Tutorial 02: MongoDB Docker Compose Advanced

## Objectives
- Set up MongoDB with Mongo Express GUI
- Configure environment variables and secrets
- Implement initialization scripts
- Set up proper networking and volumes

## Docker Compose Configuration

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb-compose
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DATABASE}
    ports:
      - "${MONGO_PORT:-27017}:27017"
    volumes:
      - mongodb-data:/data/db
      - ./scripts:/docker-entrypoint-initdb.d
    networks:
      - mongo-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s

  mongo-express:
    image: mongo-express:latest
    container_name: mongo-express
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: ${MONGO_ROOT_USER}
      ME_CONFIG_MONGODB_ADMINPASSWORD: ${MONGO_ROOT_PASSWORD}
      ME_CONFIG_MONGODB_SERVER: mongodb
    ports:
      - "8081:8081"
    depends_on:
      - mongodb
    networks:
      - mongo-network

networks:
  mongo-network:
    driver: bridge

volumes:
  mongodb-data:
```

**.env.example**:
```
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=securepass123
MONGO_DATABASE=myapp
MONGO_PORT=27017
```

## Quick Start
```bash
cp .env.example .env
docker-compose up -d
# Access Mongo Express: http://localhost:8081
```

**Next**: Tutorial 03 - Schema Design
