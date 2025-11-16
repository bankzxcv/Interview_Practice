# Tutorial 06: MongoDB Monitoring

## Key Metrics
```javascript
// Database stats
db.stats()

// Server status
db.serverStatus()

// Current operations
db.currentOp()

// Profiler
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(10)
```

**Next**: Tutorial 07 - Security
