# Tutorial 04: MongoDB Replica Sets

## Objectives
- Set up a replica set for high availability
- Configure automatic failover
- Understand read preferences
- Monitor replication lag

## Docker Compose Setup

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  mongo-primary:
    image: mongo:7.0
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27017:27017"
    volumes:
      - mongo1:/data/db

  mongo-secondary-1:
    image: mongo:7.0
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27018:27017"
    volumes:
      - mongo2:/data/db

  mongo-secondary-2:
    image: mongo:7.0
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27019:27017"
    volumes:
      - mongo3:/data/db

volumes:
  mongo1:
  mongo2:
  mongo3:
```

## Initialize Replica Set
```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo-primary:27017", priority: 2 },
    { _id: 1, host: "mongo-secondary-1:27017" },
    { _id: 2, host: "mongo-secondary-2:27017" }
  ]
})

// Check status
rs.status()
```

**Next**: Tutorial 05 - Backup & Restore
