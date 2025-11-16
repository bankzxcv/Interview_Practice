// Initialize MongoDB with sample data

db = db.getSiblingDB('learning');

// Create users collection
db.users.insertMany([
  {
    username: "admin",
    email: "admin@example.com",
    age: 35,
    active: true,
    roles: ["admin", "user"],
    createdAt: new Date()
  },
  {
    username: "demo",
    email: "demo@example.com",
    age: 28,
    active: true,
    roles: ["user"],
    createdAt: new Date()
  }
]);

// Create products collection
db.products.insertMany([
  {
    name: "Sample Laptop",
    price: 999.99,
    inStock: true,
    tags: ["electronics", "computers"],
    specs: {
      cpu: "Intel i5",
      ram: "8GB",
      storage: "256GB SSD"
    }
  }
]);

print("Database initialized successfully!");
