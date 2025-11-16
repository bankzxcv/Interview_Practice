# Factory Method Pattern

> Define an interface for creating an object, but let subclasses decide which class to instantiate

## Overview

The Factory Method pattern provides an interface for creating objects in a superclass, but allows subclasses to alter the type of objects that will be created. It promotes loose coupling by eliminating the need to bind application-specific classes into the code.

**Category**: Creational Pattern

---

## When to Use

✅ **Use Factory Method when:**
- You don't know the exact types of objects your code should work with
- You want to provide users of your library a way to extend its internal components
- You want to save system resources by reusing existing objects
- You want to organize object creation in one place
- You need to create different types based on runtime conditions

❌ **Avoid Factory Method when:**
- Object creation is simple and doesn't vary
- You only have one product type
- Adding new products requires changing factory code (violates OCP)

---

## Real-World Use Cases

1. **UI Frameworks**
   - Create platform-specific UI elements
   - Windows, macOS, Linux components
   - Responsive design elements

2. **Payment Processing**
   - Different payment gateways (PayPal, Stripe, Square)
   - Payment method selection
   - Regional payment providers

3. **Document Processing**
   - PDF, Word, Excel generators
   - Export formats
   - Template engines

4. **Notification Systems**
   - Email, SMS, Push notifications
   - Multi-channel delivery
   - Provider abstraction

5. **Database Connections**
   - MySQL, PostgreSQL, MongoDB
   - Connection string parsing
   - Driver selection

---

## Project Folder Structure

### Example 1: Payment Processing System
```
project/
├── src/
│   ├── payments/
│   │   ├── interfaces/
│   │   │   └── IPaymentProcessor.ts
│   │   ├── factories/
│   │   │   ├── PaymentFactory.ts        # Factory Method
│   │   │   └── PaymentFactoryRegistry.ts
│   │   ├── processors/
│   │   │   ├── StripeProcessor.ts
│   │   │   ├── PayPalProcessor.ts
│   │   │   └── SquareProcessor.ts
│   │   └── models/
│   │       └── PaymentRequest.ts
│   ├── services/
│   │   └── CheckoutService.ts           # Uses factory
│   └── index.ts
├── tests/
│   ├── PaymentFactory.test.ts
│   └── processors/
└── package.json
```

### Example 2: Notification System
```
project/
├── src/
│   ├── notifications/
│   │   ├── core/
│   │   │   ├── NotificationFactory.ts   # Abstract factory
│   │   │   └── INotification.ts
│   │   ├── providers/
│   │   │   ├── EmailNotification.ts
│   │   │   ├── SMSNotification.ts
│   │   │   ├── PushNotification.ts
│   │   │   └── SlackNotification.ts
│   │   ├── templates/
│   │   │   └── MessageTemplate.ts
│   │   └── config/
│   │       └── NotificationConfig.ts
│   ├── services/
│   │   └── NotificationService.ts
│   └── controllers/
│       └── UserController.ts
└── tests/
```

### Example 3: Multi-Database Application
```
project/
├── src/
│   ├── database/
│   │   ├── factories/
│   │   │   ├── DatabaseFactory.ts       # Factory for connections
│   │   │   └── QueryBuilderFactory.ts
│   │   ├── connections/
│   │   │   ├── MySQLConnection.ts
│   │   │   ├── PostgreSQLConnection.ts
│   │   │   └── MongoDBConnection.ts
│   │   ├── interfaces/
│   │   │   ├── IConnection.ts
│   │   │   └── IQueryBuilder.ts
│   │   └── config/
│   │       └── DatabaseConfig.ts
│   ├── repositories/
│   │   ├── UserRepository.ts
│   │   └── ProductRepository.ts
│   └── migrations/
└── tests/
```

---

## TypeScript Implementation

### Basic Factory Method

```typescript
// Product interface
interface Notification {
    send(recipient: string, message: string): void;
    validate(): boolean;
}

// Concrete products
class EmailNotification implements Notification {
    send(recipient: string, message: string): void {
        console.log(`Sending email to ${recipient}: ${message}`);
    }

    validate(): boolean {
        // Email validation logic
        return true;
    }
}

class SMSNotification implements Notification {
    send(recipient: string, message: string): void {
        console.log(`Sending SMS to ${recipient}: ${message}`);
    }

    validate(): boolean {
        // Phone number validation logic
        return true;
    }
}

class PushNotification implements Notification {
    send(recipient: string, message: string): void {
        console.log(`Sending push notification to ${recipient}: ${message}`);
    }

    validate(): boolean {
        // Device token validation
        return true;
    }
}

// Factory Method
class NotificationFactory {
    public static createNotification(type: string): Notification {
        switch (type.toLowerCase()) {
            case 'email':
                return new EmailNotification();
            case 'sms':
                return new SMSNotification();
            case 'push':
                return new PushNotification();
            default:
                throw new Error(`Unknown notification type: ${type}`);
        }
    }
}

// Usage
const notification1 = NotificationFactory.createNotification('email');
notification1.send('user@example.com', 'Hello via Email');

const notification2 = NotificationFactory.createNotification('sms');
notification2.send('+1234567890', 'Hello via SMS');
```

### Advanced Factory with Registry

```typescript
// Product interface
interface PaymentProcessor {
    processPayment(amount: number, currency: string): Promise<PaymentResult>;
    refund(transactionId: string, amount: number): Promise<boolean>;
}

interface PaymentResult {
    success: boolean;
    transactionId: string;
    message: string;
}

// Concrete products
class StripeProcessor implements PaymentProcessor {
    async processPayment(amount: number, currency: string): Promise<PaymentResult> {
        console.log(`Processing $${amount} ${currency} via Stripe`);
        return {
            success: true,
            transactionId: `stripe_${Date.now()}`,
            message: 'Payment successful'
        };
    }

    async refund(transactionId: string, amount: number): Promise<boolean> {
        console.log(`Refunding ${amount} for transaction ${transactionId}`);
        return true;
    }
}

class PayPalProcessor implements PaymentProcessor {
    async processPayment(amount: number, currency: string): Promise<PaymentResult> {
        console.log(`Processing $${amount} ${currency} via PayPal`);
        return {
            success: true,
            transactionId: `paypal_${Date.now()}`,
            message: 'Payment successful'
        };
    }

    async refund(transactionId: string, amount: number): Promise<boolean> {
        console.log(`Refunding ${amount} for transaction ${transactionId}`);
        return true;
    }
}

// Factory with registry pattern
type PaymentProcessorConstructor = new () => PaymentProcessor;

class PaymentFactory {
    private static processors: Map<string, PaymentProcessorConstructor> = new Map();

    // Register payment processors
    public static register(name: string, processor: PaymentProcessorConstructor): void {
        this.processors.set(name.toLowerCase(), processor);
    }

    // Create payment processor
    public static create(name: string): PaymentProcessor {
        const ProcessorClass = this.processors.get(name.toLowerCase());
        if (!ProcessorClass) {
            throw new Error(`Payment processor '${name}' not registered`);
        }
        return new ProcessorClass();
    }

    // Get available processors
    public static getAvailableProcessors(): string[] {
        return Array.from(this.processors.keys());
    }
}

// Register processors
PaymentFactory.register('stripe', StripeProcessor);
PaymentFactory.register('paypal', PayPalProcessor);

// Usage
async function processCheckout(processor: string, amount: number) {
    const payment = PaymentFactory.create(processor);
    const result = await payment.processPayment(amount, 'USD');
    console.log(result);
}

processCheckout('stripe', 100);
processCheckout('paypal', 50);

console.log('Available:', PaymentFactory.getAvailableProcessors());
```

### Factory Method with Parameters

```typescript
// Product interface
interface Document {
    open(): void;
    save(content: string): void;
    close(): void;
    export(format: string): Buffer;
}

// Concrete products
class PDFDocument implements Document {
    private content: string = '';

    constructor(private readonly title: string, private readonly author: string) {}

    open(): void {
        console.log(`Opening PDF: ${this.title} by ${this.author}`);
    }

    save(content: string): void {
        this.content = content;
        console.log(`Saving PDF: ${this.title}`);
    }

    close(): void {
        console.log(`Closing PDF: ${this.title}`);
    }

    export(format: string): Buffer {
        console.log(`Exporting PDF to ${format}`);
        return Buffer.from(this.content);
    }
}

class WordDocument implements Document {
    private content: string = '';

    constructor(private readonly title: string, private readonly template?: string) {}

    open(): void {
        console.log(`Opening Word doc: ${this.title}`);
        if (this.template) {
            console.log(`Using template: ${this.template}`);
        }
    }

    save(content: string): void {
        this.content = content;
        console.log(`Saving Word doc: ${this.title}`);
    }

    close(): void {
        console.log(`Closing Word doc: ${this.title}`);
    }

    export(format: string): Buffer {
        console.log(`Exporting Word doc to ${format}`);
        return Buffer.from(this.content);
    }
}

// Factory with configuration
interface DocumentConfig {
    title: string;
    author?: string;
    template?: string;
}

class DocumentFactory {
    public static createDocument(type: string, config: DocumentConfig): Document {
        switch (type.toLowerCase()) {
            case 'pdf':
                return new PDFDocument(
                    config.title,
                    config.author || 'Unknown'
                );
            case 'word':
                return new WordDocument(
                    config.title,
                    config.template
                );
            default:
                throw new Error(`Unsupported document type: ${type}`);
        }
    }
}

// Usage
const pdf = DocumentFactory.createDocument('pdf', {
    title: 'Report 2024',
    author: 'John Doe'
});

const word = DocumentFactory.createDocument('word', {
    title: 'Letter',
    template: 'business-letter'
});

pdf.open();
pdf.save('PDF content here');
pdf.close();
```

---

## Python Implementation

### Basic Factory Method

```python
from abc import ABC, abstractmethod
from typing import Protocol


# Product interface
class Notification(Protocol):
    def send(self, recipient: str, message: str) -> None:
        ...

    def validate(self) -> bool:
        ...


# Concrete products
class EmailNotification:
    def send(self, recipient: str, message: str) -> None:
        print(f"Sending email to {recipient}: {message}")

    def validate(self) -> bool:
        # Email validation logic
        return '@' in recipient


class SMSNotification:
    def send(self, recipient: str, message: str) -> None:
        print(f"Sending SMS to {recipient}: {message}")

    def validate(self) -> bool:
        # Phone validation logic
        return recipient.startswith('+')


class PushNotification:
    def send(self, recipient: str, message: str) -> None:
        print(f"Sending push to {recipient}: {message}")

    def validate(self) -> bool:
        # Device token validation
        return len(recipient) > 10


# Factory
class NotificationFactory:
    @staticmethod
    def create_notification(notification_type: str) -> Notification:
        notification_types = {
            'email': EmailNotification,
            'sms': SMSNotification,
            'push': PushNotification
        }

        notification_class = notification_types.get(notification_type.lower())
        if not notification_class:
            raise ValueError(f"Unknown notification type: {notification_type}")

        return notification_class()


# Usage
if __name__ == "__main__":
    email = NotificationFactory.create_notification('email')
    email.send('user@example.com', 'Hello via Email')

    sms = NotificationFactory.create_notification('sms')
    sms.send('+1234567890', 'Hello via SMS')
```

### Advanced Factory with Registry

```python
from abc import ABC, abstractmethod
from typing import Dict, Type, Optional
from dataclasses import dataclass


@dataclass
class PaymentResult:
    success: bool
    transaction_id: str
    message: str


class PaymentProcessor(ABC):
    @abstractmethod
    async def process_payment(self, amount: float, currency: str) -> PaymentResult:
        pass

    @abstractmethod
    async def refund(self, transaction_id: str, amount: float) -> bool:
        pass


class StripeProcessor(PaymentProcessor):
    async def process_payment(self, amount: float, currency: str) -> PaymentResult:
        print(f"Processing ${amount} {currency} via Stripe")
        import time
        return PaymentResult(
            success=True,
            transaction_id=f"stripe_{int(time.time())}",
            message="Payment successful"
        )

    async def refund(self, transaction_id: str, amount: float) -> bool:
        print(f"Refunding {amount} for transaction {transaction_id}")
        return True


class PayPalProcessor(PaymentProcessor):
    async def process_payment(self, amount: float, currency: str) -> PaymentResult:
        print(f"Processing ${amount} {currency} via PayPal")
        import time
        return PaymentResult(
            success=True,
            transaction_id=f"paypal_{int(time.time())}",
            message="Payment successful"
        )

    async def refund(self, transaction_id: str, amount: float) -> bool:
        print(f"Refunding {amount} for transaction {transaction_id}")
        return True


class PaymentFactory:
    _processors: Dict[str, Type[PaymentProcessor]] = {}

    @classmethod
    def register(cls, name: str, processor_class: Type[PaymentProcessor]) -> None:
        """Register a payment processor"""
        cls._processors[name.lower()] = processor_class

    @classmethod
    def create(cls, name: str) -> PaymentProcessor:
        """Create a payment processor instance"""
        processor_class = cls._processors.get(name.lower())
        if not processor_class:
            raise ValueError(f"Payment processor '{name}' not registered")
        return processor_class()

    @classmethod
    def get_available_processors(cls) -> list:
        """Get list of registered processors"""
        return list(cls._processors.keys())


# Register processors
PaymentFactory.register('stripe', StripeProcessor)
PaymentFactory.register('paypal', PayPalProcessor)


# Usage
async def process_checkout(processor_name: str, amount: float):
    payment = PaymentFactory.create(processor_name)
    result = await payment.process_payment(amount, 'USD')
    print(result)


if __name__ == "__main__":
    import asyncio

    asyncio.run(process_checkout('stripe', 100))
    asyncio.run(process_checkout('paypal', 50))

    print('Available:', PaymentFactory.get_available_processors())
```

### Factory with Dependency Injection

```python
from abc import ABC, abstractmethod
from typing import Optional
from dataclasses import dataclass


@dataclass
class DatabaseConfig:
    host: str
    port: int
    database: str
    username: str
    password: str


class DatabaseConnection(ABC):
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self.connected = False

    @abstractmethod
    def connect(self) -> None:
        pass

    @abstractmethod
    def execute(self, query: str) -> list:
        pass

    @abstractmethod
    def close(self) -> None:
        pass


class MySQLConnection(DatabaseConnection):
    def connect(self) -> None:
        print(f"Connecting to MySQL at {self.config.host}:{self.config.port}")
        self.connected = True

    def execute(self, query: str) -> list:
        if not self.connected:
            raise Exception("Not connected to database")
        print(f"MySQL executing: {query}")
        return []

    def close(self) -> None:
        if self.connected:
            print("Closing MySQL connection")
            self.connected = False


class PostgreSQLConnection(DatabaseConnection):
    def connect(self) -> None:
        print(f"Connecting to PostgreSQL at {self.config.host}:{self.config.port}")
        self.connected = True

    def execute(self, query: str) -> list:
        if not self.connected:
            raise Exception("Not connected to database")
        print(f"PostgreSQL executing: {query}")
        return []

    def close(self) -> None:
        if self.connected:
            print("Closing PostgreSQL connection")
            self.connected = False


class DatabaseFactory:
    @staticmethod
    def create_connection(
        db_type: str,
        config: DatabaseConfig
    ) -> DatabaseConnection:
        """Create database connection with configuration"""
        connections = {
            'mysql': MySQLConnection,
            'postgresql': PostgreSQLConnection,
            'postgres': PostgreSQLConnection
        }

        connection_class = connections.get(db_type.lower())
        if not connection_class:
            raise ValueError(f"Unsupported database type: {db_type}")

        return connection_class(config)


# Usage
if __name__ == "__main__":
    config = DatabaseConfig(
        host="localhost",
        port=5432,
        database="myapp",
        username="admin",
        password="secret"
    )

    # Create PostgreSQL connection
    db = DatabaseFactory.create_connection('postgresql', config)
    db.connect()
    db.execute("SELECT * FROM users")
    db.close()

    # Create MySQL connection
    mysql_config = DatabaseConfig(
        host="localhost",
        port=3306,
        database="myapp",
        username="root",
        password="secret"
    )
    db2 = DatabaseFactory.create_connection('mysql', mysql_config)
    db2.connect()
    db2.execute("SELECT * FROM products")
    db2.close()
```

---

## Testing Strategies

### TypeScript Testing

```typescript
// NotificationFactory.test.ts
import { NotificationFactory } from './NotificationFactory';
import { EmailNotification, SMSNotification } from './notifications';

describe('NotificationFactory', () => {
    it('should create email notification', () => {
        const notification = NotificationFactory.createNotification('email');
        expect(notification).toBeInstanceOf(EmailNotification);
    });

    it('should create SMS notification', () => {
        const notification = NotificationFactory.createNotification('sms');
        expect(notification).toBeInstanceOf(SMSNotification);
    });

    it('should throw error for unknown type', () => {
        expect(() => {
            NotificationFactory.createNotification('unknown');
        }).toThrow('Unknown notification type: unknown');
    });

    it('should be case insensitive', () => {
        const email1 = NotificationFactory.createNotification('EMAIL');
        const email2 = NotificationFactory.createNotification('email');
        expect(email1.constructor.name).toBe(email2.constructor.name);
    });
});
```

### Python Testing

```python
import unittest
from notification_factory import NotificationFactory, EmailNotification, SMSNotification


class TestNotificationFactory(unittest.TestCase):
    def test_create_email_notification(self):
        notification = NotificationFactory.create_notification('email')
        self.assertIsInstance(notification, EmailNotification)

    def test_create_sms_notification(self):
        notification = NotificationFactory.create_notification('sms')
        self.assertIsInstance(notification, SMSNotification)

    def test_unknown_type_raises_error(self):
        with self.assertRaises(ValueError):
            NotificationFactory.create_notification('unknown')

    def test_case_insensitive(self):
        email1 = NotificationFactory.create_notification('EMAIL')
        email2 = NotificationFactory.create_notification('email')
        self.assertEqual(type(email1), type(email2))


if __name__ == '__main__':
    unittest.main()
```

---

## Advantages & Disadvantages

### Advantages ✅
- **Loose coupling**: Code depends on interfaces, not concrete classes
- **Single Responsibility**: Creation logic in one place
- **Open/Closed Principle**: Easy to add new types without modifying existing code
- **Flexibility**: Easy to switch implementations
- **Testability**: Easy to mock products

### Disadvantages ❌
- **Complexity**: More classes and interfaces
- **Indirection**: Extra layer between client and product
- **Can be overkill**: Simple cases don't need factory
- **Registry maintenance**: Need to register new types

---

## Common Pitfalls

### 1. Violating Open/Closed Principle
```typescript
// ❌ BAD: Need to modify factory for every new type
class BadFactory {
    create(type: string) {
        if (type === 'email') return new Email();
        if (type === 'sms') return new SMS();
        // Need to add more if statements for new types
    }
}

// ✅ GOOD: Use registry pattern
class GoodFactory {
    private static types = new Map();

    static register(name: string, creator: Function) {
        this.types.set(name, creator);
    }

    static create(name: string) {
        const creator = this.types.get(name);
        if (!creator) throw new Error(`Unknown type: ${name}`);
        return creator();
    }
}
```

### 2. Not Using Interfaces
```python
# ❌ BAD: No interface, tight coupling
class EmailSender:
    def send_email(self, to, message):
        pass

class SMSSender:
    def send_sms(self, to, message):  # Different method name!
        pass

# ✅ GOOD: Common interface
from abc import ABC, abstractmethod

class NotificationSender(ABC):
    @abstractmethod
    def send(self, to: str, message: str) -> None:
        pass

class EmailSender(NotificationSender):
    def send(self, to: str, message: str) -> None:
        # Implementation
        pass
```

### 3. Creating Factory for Everything
```typescript
// ❌ BAD: Unnecessary factory
class StringFactory {
    static create(value: string): string {
        return value; // Pointless!
    }
}

// ✅ GOOD: Use factory only when needed
// Just use: const str = "hello";
```

---

## Related Patterns

- **Abstract Factory**: Creates families of related objects
- **Builder**: Constructs complex objects step by step
- **Prototype**: Creates objects by cloning
- **Singleton**: Often used with Factory to ensure one instance

---

## Interview Questions

### Q1: Difference between Factory Method and Abstract Factory?
**Answer:**
- **Factory Method**: Creates ONE type of product, subclasses decide which class
- **Abstract Factory**: Creates FAMILIES of related products

### Q2: When would you use Factory Method over direct instantiation?
**Answer:**
- When you don't know exact type at compile time
- When you want to provide extension points
- When creation logic is complex
- When you want to decouple client from concrete classes

### Q3: How do you handle factory registration in a plugin system?
**Answer:** Use registry pattern with dynamic registration:
```typescript
class PluginFactory {
    private static plugins = new Map();

    static register(name: string, plugin: any) {
        this.plugins.set(name, plugin);
    }

    static load(name: string) {
        return this.plugins.get(name);
    }
}
```

---

## Summary

**Key Takeaways:**
1. Factory Method delegates object creation to subclasses/functions
2. Promotes loose coupling through interfaces
3. Makes code more maintainable and testable
4. Use registry pattern for extensibility
5. Don't overuse - simple cases don't need factories

**When to use:**
- Multiple product types
- Runtime type decision
- Plugin systems
- Payment gateways
- Database drivers

**When to avoid:**
- Simple, fixed types
- Direct instantiation is clearer
- No variation in creation logic

---

*Next: [Abstract Factory Pattern](DesignPatterns-AbstractFactory.md)*
