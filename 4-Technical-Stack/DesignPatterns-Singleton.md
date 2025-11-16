# Singleton Pattern

> Ensure a class has only one instance and provide a global point of access to it

## Overview

The Singleton pattern restricts instantiation of a class to a single object. This is useful when exactly one object is needed to coordinate actions across the system.

**Category**: Creational Pattern

---

## When to Use

✅ **Use Singleton when:**
- You need exactly one instance of a class (database connection, logger, configuration)
- You want to control access to shared resources
- You need lazy initialization
- You want a global point of access

❌ **Avoid Singleton when:**
- You need multiple instances in the future (violates Open/Closed Principle)
- Testing becomes difficult (global state)
- Multithreading concerns are complex
- You're just avoiding parameter passing (dependency injection is better)

---

## Real-World Use Cases

1. **Database Connection Pool**
   - Single connection manager
   - Resource pooling
   - Connection reuse

2. **Logger**
   - Centralized logging
   - Single log file access
   - Consistent formatting

3. **Configuration Manager**
   - Application settings
   - Environment variables
   - Feature flags

4. **Cache Manager**
   - Shared cache instance
   - Memory management
   - Cache invalidation

5. **Thread Pool**
   - Worker thread management
   - Task queue
   - Resource limitation

---

## Project Folder Structure

### Example 1: Logger System
```
project/
├── src/
│   ├── core/
│   │   └── Logger.ts              # Singleton logger
│   ├── config/
│   │   └── AppConfig.ts           # Singleton configuration
│   ├── services/
│   │   ├── UserService.ts         # Uses Logger
│   │   └── PaymentService.ts     # Uses Logger
│   └── index.ts
├── tests/
│   └── Logger.test.ts
└── package.json
```

### Example 2: Database Connection
```
project/
├── src/
│   ├── database/
│   │   ├── DatabaseConnection.ts  # Singleton connection
│   │   ├── ConnectionPool.ts      # Singleton pool manager
│   │   └── QueryBuilder.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Product.ts
│   └── repositories/
│       ├── UserRepository.ts
│       └── ProductRepository.ts
└── config/
    └── database.config.ts
```

### Example 3: Multi-Layer Application
```
project/
├── src/
│   ├── core/
│   │   ├── singletons/
│   │   │   ├── Logger.ts
│   │   │   ├── ConfigManager.ts
│   │   │   └── CacheManager.ts
│   │   └── interfaces/
│   │       └── ILogger.ts
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── DatabaseConnection.ts
│   │   └── cache/
│   │       └── RedisClient.ts
│   └── application/
│       └── services/
│           └── UserService.ts
└── tests/
    ├── unit/
    └── integration/
```

---

## TypeScript Implementation

### Basic Singleton

```typescript
class Logger {
    private static instance: Logger;
    private logs: string[] = [];

    // Private constructor prevents external instantiation
    private constructor() {
        console.log("Logger instance created");
    }

    // Global access point
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public log(message: string): void {
        const timestamp = new Date().toISOString();
        this.logs.push(`[${timestamp}] ${message}`);
        console.log(`[${timestamp}] ${message}`);
    }

    public getLogs(): string[] {
        return [...this.logs]; // Return copy to prevent modification
    }

    public clearLogs(): void {
        this.logs = [];
    }
}

// Usage
const logger1 = Logger.getInstance();
const logger2 = Logger.getInstance();

logger1.log("First message");
logger2.log("Second message");

console.log(logger1 === logger2); // true - same instance
console.log(logger1.getLogs());   // Both messages visible
```

### Thread-Safe Singleton (Early Initialization)

```typescript
class DatabaseConnection {
    // Eager initialization - created when class is loaded
    private static readonly instance: DatabaseConnection = new DatabaseConnection();
    private connectionString: string;
    private isConnected: boolean = false;

    private constructor() {
        this.connectionString = process.env.DB_CONNECTION || "localhost:5432";
    }

    public static getInstance(): DatabaseConnection {
        return DatabaseConnection.instance;
    }

    public connect(): void {
        if (!this.isConnected) {
            console.log(`Connecting to ${this.connectionString}`);
            this.isConnected = true;
        }
    }

    public query(sql: string): void {
        if (!this.isConnected) {
            throw new Error("Not connected to database");
        }
        console.log(`Executing: ${sql}`);
    }

    public disconnect(): void {
        if (this.isConnected) {
            console.log("Disconnecting from database");
            this.isConnected = false;
        }
    }
}

// Usage
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();

db1.connect();
db1.query("SELECT * FROM users");
console.log(db1 === db2); // true
```

### Lazy Initialization with Async

```typescript
class ConfigManager {
    private static instance: ConfigManager | null = null;
    private static initPromise: Promise<ConfigManager> | null = null;
    private config: Map<string, any>;

    private constructor() {
        this.config = new Map();
    }

    // Async initialization
    public static async getInstance(): Promise<ConfigManager> {
        if (ConfigManager.instance) {
            return ConfigManager.instance;
        }

        if (ConfigManager.initPromise) {
            return ConfigManager.initPromise;
        }

        ConfigManager.initPromise = ConfigManager.initialize();
        return ConfigManager.initPromise;
    }

    private static async initialize(): Promise<ConfigManager> {
        const instance = new ConfigManager();

        // Simulate async config loading (e.g., from file or API)
        await new Promise(resolve => setTimeout(resolve, 100));

        instance.config.set("appName", "MyApp");
        instance.config.set("version", "1.0.0");
        instance.config.set("apiUrl", "https://api.example.com");

        ConfigManager.instance = instance;
        return instance;
    }

    public get(key: string): any {
        return this.config.get(key);
    }

    public set(key: string, value: any): void {
        this.config.set(key, value);
    }

    public getAll(): Record<string, any> {
        return Object.fromEntries(this.config);
    }
}

// Usage
async function main() {
    const config1 = await ConfigManager.getInstance();
    const config2 = await ConfigManager.getInstance();

    console.log(config1 === config2); // true
    console.log(config1.get("appName")); // "MyApp"
    console.log(config1.getAll());
}
```

### Generic Singleton Base Class

```typescript
abstract class Singleton {
    private static instances: Map<any, any> = new Map();

    protected constructor() {
        const constructor = this.constructor;
        if (Singleton.instances.has(constructor)) {
            throw new Error("Singleton instance already exists!");
        }
        Singleton.instances.set(constructor, this);
    }

    public static getInstance<T extends Singleton>(this: new () => T): T {
        if (!Singleton.instances.has(this)) {
            new this();
        }
        return Singleton.instances.get(this);
    }
}

// Usage: Extend Singleton
class CacheManager extends Singleton {
    private cache: Map<string, any> = new Map();

    protected constructor() {
        super();
    }

    public set(key: string, value: any): void {
        this.cache.set(key, value);
    }

    public get(key: string): any {
        return this.cache.get(key);
    }

    public clear(): void {
        this.cache.clear();
    }
}

// Usage
const cache1 = CacheManager.getInstance();
const cache2 = CacheManager.getInstance();

cache1.set("user:1", { name: "John" });
console.log(cache2.get("user:1")); // { name: "John" }
console.log(cache1 === cache2); // true
```

---

## Python Implementation

### Basic Singleton (Metaclass)

```python
class SingletonMeta(type):
    """
    Thread-safe Singleton metaclass
    """
    _instances = {}
    _lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            with cls._lock:
                if cls not in cls._instances:
                    instance = super().__call__(*args, **kwargs)
                    cls._instances[cls] = instance
        return cls._instances[cls]


class Logger(metaclass=SingletonMeta):
    def __init__(self):
        self.logs = []
        print("Logger instance created")

    def log(self, message: str) -> None:
        from datetime import datetime
        timestamp = datetime.now().isoformat()
        log_entry = f"[{timestamp}] {message}"
        self.logs.append(log_entry)
        print(log_entry)

    def get_logs(self) -> list:
        return self.logs.copy()

    def clear_logs(self) -> None:
        self.logs.clear()


# Usage
if __name__ == "__main__":
    logger1 = Logger()
    logger2 = Logger()

    logger1.log("First message")
    logger2.log("Second message")

    print(logger1 is logger2)  # True - same instance
    print(logger1.get_logs())  # Both messages visible
```

### Decorator-Based Singleton

```python
from functools import wraps
import threading


def singleton(cls):
    """
    Singleton decorator for classes
    """
    instances = {}
    lock = threading.Lock()

    @wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            with lock:
                if cls not in instances:
                    instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance


@singleton
class DatabaseConnection:
    def __init__(self):
        self.connection_string = "localhost:5432"
        self.is_connected = False
        print(f"DatabaseConnection created: {self.connection_string}")

    def connect(self) -> None:
        if not self.is_connected:
            print(f"Connecting to {self.connection_string}")
            self.is_connected = True

    def query(self, sql: str) -> None:
        if not self.is_connected:
            raise Exception("Not connected to database")
        print(f"Executing: {sql}")

    def disconnect(self) -> None:
        if self.is_connected:
            print("Disconnecting from database")
            self.is_connected = False


# Usage
if __name__ == "__main__":
    db1 = DatabaseConnection()
    db2 = DatabaseConnection()

    db1.connect()
    db1.query("SELECT * FROM users")

    print(db1 is db2)  # True
```

### Classic Singleton Pattern

```python
class ConfigManager:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        # Prevent re-initialization
        if not ConfigManager._initialized:
            self.config = {}
            self._load_config()
            ConfigManager._initialized = True

    def _load_config(self) -> None:
        """Simulate loading configuration"""
        self.config = {
            "app_name": "MyApp",
            "version": "1.0.0",
            "api_url": "https://api.example.com",
            "debug": False
        }
        print("Configuration loaded")

    def get(self, key: str, default=None):
        return self.config.get(key, default)

    def set(self, key: str, value) -> None:
        self.config[key] = value

    def get_all(self) -> dict:
        return self.config.copy()


# Usage
if __name__ == "__main__":
    config1 = ConfigManager()
    config2 = ConfigManager()

    print(config1 is config2)  # True
    print(config1.get("app_name"))  # "MyApp"

    config1.set("debug", True)
    print(config2.get("debug"))  # True - same instance
```

### Async Singleton (Python 3.7+)

```python
import asyncio
from typing import Optional


class AsyncConfigManager:
    _instance: Optional['AsyncConfigManager'] = None
    _lock = asyncio.Lock()
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def initialize(self):
        """Async initialization"""
        if not AsyncConfigManager._initialized:
            async with AsyncConfigManager._lock:
                if not AsyncConfigManager._initialized:
                    # Simulate async loading (e.g., from API or database)
                    await asyncio.sleep(0.1)
                    self.config = {
                        "app_name": "MyApp",
                        "version": "1.0.0"
                    }
                    AsyncConfigManager._initialized = True
                    print("Async configuration loaded")

    @classmethod
    async def get_instance(cls):
        instance = cls()
        await instance.initialize()
        return instance

    def get(self, key: str):
        return self.config.get(key)


# Usage
async def main():
    config1 = await AsyncConfigManager.get_instance()
    config2 = await AsyncConfigManager.get_instance()

    print(config1 is config2)  # True
    print(config1.get("app_name"))  # "MyApp"


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Testing Strategies

### TypeScript Testing

```typescript
// Logger.test.ts
import { Logger } from './Logger';

describe('Logger Singleton', () => {
    // Reset singleton between tests
    beforeEach(() => {
        (Logger as any).instance = null;
    });

    it('should create only one instance', () => {
        const logger1 = Logger.getInstance();
        const logger2 = Logger.getInstance();

        expect(logger1).toBe(logger2);
    });

    it('should share state across instances', () => {
        const logger1 = Logger.getInstance();
        const logger2 = Logger.getInstance();

        logger1.log('Test message');

        expect(logger2.getLogs().length).toBe(1);
        expect(logger2.getLogs()[0]).toContain('Test message');
    });
});
```

### Python Testing

```python
import unittest
from logger import Logger


class TestLoggerSingleton(unittest.TestCase):
    def setUp(self):
        # Reset singleton for each test
        Logger._instances = {}

    def test_single_instance(self):
        logger1 = Logger()
        logger2 = Logger()
        self.assertIs(logger1, logger2)

    def test_shared_state(self):
        logger1 = Logger()
        logger2 = Logger()

        logger1.log("Test message")

        self.assertEqual(len(logger2.get_logs()), 1)
        self.assertIn("Test message", logger2.get_logs()[0])


if __name__ == '__main__':
    unittest.main()
```

---

## Advantages & Disadvantages

### Advantages ✅
- **Controlled access**: Single instance ensures controlled resource access
- **Reduced namespace pollution**: No global variables needed
- **Lazy initialization**: Can defer creation until needed
- **Consistent state**: All code uses same instance

### Disadvantages ❌
- **Global state**: Hidden dependencies, hard to test
- **Tight coupling**: Classes become dependent on singleton
- **Multithreading complexity**: Requires thread-safe implementation
- **Violates Single Responsibility**: Class manages both business logic and instance creation

---

## Common Pitfalls

### 1. Not Thread-Safe
```typescript
// ❌ BAD: Race condition
class BadSingleton {
    private static instance: BadSingleton;

    public static getInstance(): BadSingleton {
        if (!BadSingleton.instance) {
            // Multiple threads could reach here simultaneously
            BadSingleton.instance = new BadSingleton();
        }
        return BadSingleton.instance;
    }
}
```

### 2. Not Handling Serialization
```python
# ❌ BAD: Pickle creates new instance
import pickle

class BadSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# ✅ GOOD: Preserve singleton on deserialization
class GoodSingleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __reduce__(self):
        return (self.__class__, ())
```

### 3. Overusing Singleton
```typescript
// ❌ BAD: Singleton for everything
class UserService {} // Doesn't need to be singleton
class ProductService {} // Doesn't need to be singleton

// ✅ GOOD: Use dependency injection instead
class UserService {
    constructor(private logger: Logger, private db: DatabaseConnection) {}
}
```

---

## Alternatives to Singleton

### 1. Dependency Injection
```typescript
// Better approach for most cases
class UserService {
    constructor(
        private logger: Logger,
        private db: DatabaseConnection,
        private config: ConfigManager
    ) {}
}

// Container manages instances
const container = new DependencyContainer();
container.register('logger', new Logger());
container.register('db', new DatabaseConnection());
```

### 2. Module Pattern (JavaScript/TypeScript)
```typescript
// Modules are naturally singleton in ES6
// logger.ts
class Logger {
    private logs: string[] = [];

    log(message: string): void {
        this.logs.push(message);
    }
}

export const logger = new Logger(); // Single instance

// Usage
import { logger } from './logger';
logger.log('Message');
```

### 3. Static Class (When no state needed)
```typescript
class MathUtils {
    static add(a: number, b: number): number {
        return a + b;
    }

    static multiply(a: number, b: number): number {
        return a * b;
    }
}

// No instance needed
MathUtils.add(2, 3);
```

---

## Interview Questions

### Question 1: How do you make a thread-safe Singleton?
**Answer**: Use double-checked locking, early initialization, or language-specific features like `synchronized` (Java), `Lock` (Python), or atomic operations.

### Question 2: What's the difference between Singleton and static class?
**Answer**:
- Singleton can implement interfaces and be passed as parameter
- Singleton supports lazy initialization
- Static class can't have instance methods or state (in some languages)
- Singleton can be extended via inheritance (with care)

### Question 3: Why is Singleton considered an anti-pattern?
**Answer**: Global state, testing difficulties, hidden dependencies, violates SOLID principles (especially SRP and OCP).

### Question 4: How would you test code that uses Singletons?
**Answer**:
- Use dependency injection instead
- Provide reset/clear methods for tests
- Use test frameworks that can reset static state
- Mock the singleton instance

---

## Related Patterns

- **Factory Method**: Singletons often use factories for creation
- **Abstract Factory**: Can be implemented as Singleton
- **Builder**: Can be used to construct complex Singleton
- **Prototype**: Alternative to Singleton when you need multiple instances

---

## Summary

**Key Takeaways:**
1. Singleton ensures one instance globally
2. Use for resources that should be unique (logger, config, connection pool)
3. Be careful with multithreading
4. Consider alternatives (DI, modules) for better testability
5. Don't overuse - it can become an anti-pattern

**When to use**: Logging, configuration, connection pooling, caching
**When to avoid**: Most application code, when testability is important

---

*Next: [Factory Method Pattern](DesignPatterns-FactoryMethod.md)*
