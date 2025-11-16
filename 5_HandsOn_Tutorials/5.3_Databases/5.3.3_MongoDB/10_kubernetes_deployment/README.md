# Tutorial 10: MongoDB on Kubernetes

## Using MongoDB Operator
```yaml
apiVersion: mongodbcommunity.mongodb.com/v1
kind: MongoDBCommunity
metadata:
  name: mongodb
spec:
  members: 3
  type: ReplicaSet
  version: "7.0.0"
```

**Congratulations!** MongoDB series complete!
