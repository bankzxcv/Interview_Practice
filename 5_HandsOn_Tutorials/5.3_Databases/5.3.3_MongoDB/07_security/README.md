# Tutorial 07: MongoDB Security

## Enable Authentication
```javascript
// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "securepass",
  roles: ["root"]
})

// Create application user
use myapp
db.createUser({
  user: "appuser",
  pwd: "apppass",
  roles: [{ role: "readWrite", db: "myapp" }]
})
```

**Next**: Tutorial 08 - Performance
