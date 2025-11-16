# Tutorial 09: MongoDB Sharding

## Horizontal Scaling Setup

Configure config servers, shard servers, and mongos routers for distributed data.

```javascript
// Enable sharding
sh.enableSharding("mydb")

// Shard collection
sh.shardCollection("mydb.users", { user_id: "hashed" })
```

**Next**: Tutorial 10 - Kubernetes
