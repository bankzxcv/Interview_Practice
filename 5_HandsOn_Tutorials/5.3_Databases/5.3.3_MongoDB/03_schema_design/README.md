# Tutorial 03: MongoDB Schema Design & Data Modeling

## Objectives
- Learn document modeling patterns
- Understand embedded vs referenced documents
- Design for query patterns
- Implement schema validation

## Key Patterns

### 1. Embedded Documents (1:1, 1:Few)
```javascript
// User with address
db.users.insertOne({
  username: "john",
  email: "john@example.com",
  address: {
    street: "123 Main St",
    city: "NYC",
    country: "USA"
  }
})
```

### 2. Referenced Documents (1:Many, Many:Many)
```javascript
// Author and Books
db.authors.insertOne({
  _id: ObjectId("..."),
  name: "John Doe"
})

db.books.insertMany([
  { title: "Book 1", author_id: ObjectId("...") },
  { title: "Book 2", author_id: ObjectId("...") }
])
```

### 3. Bucket Pattern (Time-Series)
```javascript
db.sensor_data.insertOne({
  sensor_id: "sensor1",
  date: ISODate("2024-01-15"),
  readings: [
    { time: ISODate("..."), temp: 22.5 },
    { time: ISODate("..."), temp: 23.1 }
  ]
})
```

## Schema Validation
```javascript
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "price"],
      properties: {
        name: { bsonType: "string" },
        price: { bsonType: "number", minimum: 0 },
        inStock: { bsonType: "bool" }
      }
    }
  }
})
```

**Next**: Tutorial 04 - Replica Sets
