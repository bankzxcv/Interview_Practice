# Tutorial 01: MongoDB Basic Setup

## Objectives

- Set up MongoDB in Docker
- Learn MongoDB shell basics
- Understand documents and collections
- Perform CRUD operations
- Work with MongoDB data types
- Learn query operators

## What is MongoDB?

MongoDB is a document database storing data in BSON (Binary JSON) format with dynamic schemas.

**Key Concepts**:
- **Database**: Container for collections
- **Collection**: Group of documents (like SQL table)
- **Document**: Record in JSON format (like SQL row)
- **Field**: Key-value pair (like SQL column)
- **_id**: Unique identifier (auto-generated)

## Docker Setup

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb-basic
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: adminpass123
      MONGO_INITDB_DATABASE: learning
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
      - ./scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongodb-data:
```

## Start MongoDB

```bash
cd /home/user/Interview_Practice/5_HandsOn_Tutorials/5.3_Databases/5.3.3_MongoDB/01_basic_setup
docker-compose up -d
docker-compose ps
```

## Connect to MongoDB

```bash
# Using mongosh (MongoDB Shell)
docker-compose exec mongodb mongosh -u admin -p adminpass123

# Or from host (if mongosh installed)
mongosh "mongodb://admin:adminpass123@localhost:27017"
```

## MongoDB Shell Basics

```javascript
// Show all databases
show dbs

// Create/use database
use learning

// Show current database
db

// Show collections
show collections

// Get help
help
db.help()

// Exit
exit
```

## Create Collection and Insert Documents

```javascript
// Create users collection
db.createCollection("users")

// Insert single document
db.users.insertOne({
  username: "johndoe",
  email: "john@example.com",
  age: 30,
  active: true,
  createdAt: new Date()
})

// Insert multiple documents
db.users.insertMany([
  {
    username: "janesmith",
    email: "jane@example.com",
    age: 28,
    active: true,
    tags: ["developer", "designer"]
  },
  {
    username: "bobwilson",
    email: "bob@example.com",
    age: 35,
    active: false,
    address: {
      city: "New York",
      country: "USA"
    }
  }
])
```

## Query Documents (READ)

```javascript
// Find all documents
db.users.find()

// Find with pretty print
db.users.find().pretty()

// Find one document
db.users.findOne()

// Find with filter
db.users.find({ age: 30 })

// Multiple conditions (AND)
db.users.find({ age: 30, active: true })

// OR condition
db.users.find({
  $or: [
    { age: { $gt: 30 } },
    { active: false }
  ]
})

// Comparison operators
db.users.find({ age: { $gte: 30 } })  // >= 30
db.users.find({ age: { $lt: 30 } })   // < 30
db.users.find({ age: { $ne: 30 } })   // != 30
db.users.find({ age: { $in: [28, 30, 35] } })

// Regex pattern matching
db.users.find({ email: /example.com$/ })

// Select specific fields (projection)
db.users.find({}, { username: 1, email: 1, _id: 0 })

// Sort results
db.users.find().sort({ age: -1 })  // Descending
db.users.find().sort({ age: 1 })   // Ascending

// Limit results
db.users.find().limit(2)

// Skip and limit (pagination)
db.users.find().skip(1).limit(2)

// Count documents
db.users.countDocuments()
db.users.countDocuments({ active: true })
```

## Update Documents (UPDATE)

```javascript
// Update single document
db.users.updateOne(
  { username: "johndoe" },
  { $set: { age: 31, updatedAt: new Date() } }
)

// Update multiple documents
db.users.updateMany(
  { active: false },
  { $set: { active: true, updatedAt: new Date() } }
)

// Increment field
db.users.updateOne(
  { username: "johndoe" },
  { $inc: { age: 1 } }
)

// Add to array
db.users.updateOne(
  { username: "johndoe" },
  { $push: { tags: "mongodb-expert" } }
)

// Remove from array
db.users.updateOne(
  { username: "johndoe" },
  { $pull: { tags: "mongodb-expert" } }
)

// Upsert (update or insert)
db.users.updateOne(
  { username: "newuser" },
  { $set: { email: "new@example.com", age: 25 } },
  { upsert: true }
)

// Replace entire document
db.users.replaceOne(
  { username: "johndoe" },
  {
    username: "johndoe",
    email: "john.new@example.com",
    age: 32,
    active: true
  }
)
```

## Delete Documents (DELETE)

```javascript
// Delete single document
db.users.deleteOne({ username: "bobwilson" })

// Delete multiple documents
db.users.deleteMany({ active: false })

// Delete all documents in collection
db.users.deleteMany({})

// Drop entire collection
db.users.drop()
```

## MongoDB Data Types

```javascript
// Create products collection with various data types
db.products.insertOne({
  // String
  name: "Laptop",

  // Number (Integer)
  stockQuantity: 50,

  // Number (Double)
  price: 1299.99,

  // Boolean
  inStock: true,

  // Date
  createdAt: new Date(),
  releaseDate: ISODate("2024-01-15"),

  // Array
  tags: ["electronics", "computers", "programming"],

  // Embedded Document
  specifications: {
    cpu: "Intel i7",
    ram: "16GB",
    storage: "512GB SSD"
  },

  // Array of Documents
  reviews: [
    {
      user: "user1",
      rating: 5,
      comment: "Excellent!"
    },
    {
      user: "user2",
      rating: 4,
      comment: "Very good"
    }
  ],

  // Null
  discontinued: null,

  // ObjectId
  categoryId: ObjectId("507f1f77bcf86cd799439011")
})
```

## Working with Embedded Documents

```javascript
// Query embedded document
db.products.find({ "specifications.ram": "16GB" })

// Query array element
db.products.find({ tags: "electronics" })

// Query array of documents
db.products.find({ "reviews.rating": { $gte: 4 } })

// Update embedded document
db.products.updateOne(
  { name: "Laptop" },
  { $set: { "specifications.ram": "32GB" } }
)

// Add to array of documents
db.products.updateOne(
  { name: "Laptop" },
  {
    $push: {
      reviews: {
        user: "user3",
        rating: 5,
        comment: "Amazing product!"
      }
    }
  }
)
```

## Aggregation Basics

```javascript
// Count by active status
db.users.aggregate([
  { $group: { _id: "$active", count: { $sum: 1 } } }
])

// Average age
db.users.aggregate([
  { $group: { _id: null, avgAge: { $avg: "$age" } } }
])

// Match and group
db.users.aggregate([
  { $match: { active: true } },
  { $group: { _id: null, totalAge: { $sum: "$age" } } }
])
```

## Best Practices

1. **Use meaningful field names** in camelCase
2. **Always validate data** before insertion
3. **Use indexes** for frequently queried fields
4. **Avoid deep nesting** (max 3-4 levels)
5. **Use embedded documents** for 1:1 and 1:few relationships
6. **Use references** for many:many relationships
7. **Keep documents under 16MB**
8. **Use projections** to reduce network transfer

## Verification

```bash
# Check container
docker-compose ps

# Check databases
docker-compose exec mongodb mongosh -u admin -p adminpass123 --eval "show dbs"

# Check collections
docker-compose exec mongodb mongosh -u admin -p adminpass123 learning --eval "show collections"
```

## Next Steps

**Tutorial 02: Docker Compose** - Add Mongo Express GUI and advanced configurations.

---

**Congratulations!** You can now work with MongoDB basics!
