# Tutorial 08: MongoDB Performance

## Indexing
```javascript
// Create index
db.users.createIndex({ email: 1 })

// Compound index
db.orders.createIndex({ user_id: 1, created_at: -1 })

// Analyze query
db.users.find({ email: "test@example.com" }).explain("executionStats")
```

**Next**: Tutorial 09 - Sharding
