# Design Patterns - Complete Reference Guide

> **Comprehensive guide** to software design patterns with TypeScript and Python implementations, real-world use cases, and project folder structures

Design patterns are reusable solutions to commonly occurring problems in software design. They represent best practices refined over time by experienced developers.

---

## Table of Contents

### Creational Patterns
Creational patterns deal with object creation mechanisms, trying to create objects in a manner suitable to the situation.

1. [Singleton Pattern](DesignPatterns-Singleton.md) - Ensure a class has only one instance
2. [Factory Method Pattern](DesignPatterns-FactoryMethod.md) - Create objects without specifying exact classes
3. [Abstract Factory Pattern](DesignPatterns-AbstractFactory.md) - Create families of related objects
4. [Builder Pattern](DesignPatterns-Builder.md) - Construct complex objects step by step
5. [Prototype Pattern](DesignPatterns-Prototype.md) - Clone existing objects

### Structural Patterns
Structural patterns deal with object composition, creating relationships between objects to form larger structures.

6. [Adapter Pattern](DesignPatterns-Adapter.md) - Make incompatible interfaces work together
7. [Decorator Pattern](DesignPatterns-Decorator.md) - Add behavior to objects dynamically
8. [Facade Pattern](DesignPatterns-Facade.md) - Provide simplified interface to complex subsystems
9. [Proxy Pattern](DesignPatterns-Proxy.md) - Control access to objects
10. [Composite Pattern](DesignPatterns-Composite.md) - Treat individual and composite objects uniformly
11. [Bridge Pattern](DesignPatterns-Bridge.md) - Separate abstraction from implementation
12. [Flyweight Pattern](DesignPatterns-Flyweight.md) - Share common state between objects

### Behavioral Patterns
Behavioral patterns focus on communication between objects, how objects interact and distribute responsibility.

13. [Strategy Pattern](DesignPatterns-Strategy.md) - Select algorithm at runtime
14. [Observer Pattern](DesignPatterns-Observer.md) - Notify multiple objects of state changes
15. [Command Pattern](DesignPatterns-Command.md) - Encapsulate requests as objects
16. [State Pattern](DesignPatterns-State.md) - Change behavior when internal state changes
17. [Chain of Responsibility Pattern](DesignPatterns-ChainOfResponsibility.md) - Pass requests along a chain of handlers
18. [Template Method Pattern](DesignPatterns-TemplateMethod.md) - Define algorithm skeleton, defer steps to subclasses
19. [Iterator Pattern](DesignPatterns-Iterator.md) - Access elements sequentially without exposing structure
20. [Mediator Pattern](DesignPatterns-Mediator.md) - Reduce dependencies between communicating objects
21. [Visitor Pattern](DesignPatterns-Visitor.md) - Separate algorithms from objects they operate on
22. [Memento Pattern](DesignPatterns-Memento.md) - Capture and restore object state

### Functional Programming Patterns
Functional patterns embrace immutability, pure functions, and declarative programming.

23. [Functional Programming Techniques](DesignPatterns-FunctionalProgramming.md)
    - Higher-Order Functions
    - Pure Functions & Immutability
    - Function Composition
    - Currying & Partial Application
    - Monads & Functors
    - Lazy Evaluation
    - Pattern Matching

### Real-World Applications
24. [Real-World Project Structures](DesignPatterns-ProjectStructures.md)
    - E-commerce Application
    - Social Media Platform
    - API Gateway
    - Game Engine
    - Content Management System
    - Microservices Architecture

---

## Quick Reference Table

| Pattern | Category | Purpose | Use When |
|---------|----------|---------|----------|
| **Singleton** | Creational | One instance globally | Logger, Config, Database Connection |
| **Factory Method** | Creational | Object creation delegation | Multiple types, runtime decision |
| **Abstract Factory** | Creational | Families of related objects | UI themes, cross-platform apps |
| **Builder** | Creational | Complex object construction | Many optional parameters |
| **Prototype** | Creational | Clone existing objects | Expensive object creation |
| **Adapter** | Structural | Interface compatibility | Legacy code integration |
| **Decorator** | Structural | Add responsibilities dynamically | Extend behavior without inheritance |
| **Facade** | Structural | Simplified interface | Complex subsystem interaction |
| **Proxy** | Structural | Control access | Lazy loading, caching, security |
| **Composite** | Structural | Tree structures | File systems, UI components |
| **Bridge** | Structural | Separate abstraction/implementation | Multiple dimensions of variation |
| **Flyweight** | Structural | Share objects for efficiency | Many similar objects |
| **Strategy** | Behavioral | Interchangeable algorithms | Runtime algorithm selection |
| **Observer** | Behavioral | One-to-many notifications | Event systems, reactive UI |
| **Command** | Behavioral | Encapsulate requests | Undo/redo, task queues |
| **State** | Behavioral | Change behavior with state | Finite state machines |
| **Chain of Responsibility** | Behavioral | Request handling chain | Middleware, validation chains |
| **Template Method** | Behavioral | Algorithm skeleton | Common structure, varying steps |
| **Iterator** | Behavioral | Sequential access | Custom collection traversal |
| **Mediator** | Behavioral | Centralize communication | Complex object interactions |
| **Visitor** | Behavioral | Operations on object structures | AST traversal, reporting |
| **Memento** | Behavioral | Save/restore state | Undo mechanisms, snapshots |

---

## Pattern Selection Guide

### By Problem Domain

**Object Creation:**
- Need single instance? → **Singleton**
- Complex construction? → **Builder**
- Different types at runtime? → **Factory Method**
- Family of related objects? → **Abstract Factory**
- Clone expensive objects? → **Prototype**

**Interface & Compatibility:**
- Incompatible interfaces? → **Adapter**
- Simplify complex system? → **Facade**
- Control access? → **Proxy**

**Adding Functionality:**
- Dynamic behavior addition? → **Decorator**
- Multiple algorithms? → **Strategy**
- Notify multiple objects? → **Observer**

**Handling Complexity:**
- Tree structures? → **Composite**
- Request processing chain? → **Chain of Responsibility**
- Centralize interactions? → **Mediator**

**State & Behavior:**
- State-dependent behavior? → **State**
- Undo/redo functionality? → **Command** + **Memento**
- Algorithm skeleton? → **Template Method**

---

## Language-Specific Implementations

### TypeScript Features
- **Interfaces & Types**: Define contracts
- **Classes & Inheritance**: OOP patterns
- **Decorators**: Meta-programming (Decorator pattern)
- **Generics**: Type-safe patterns
- **Private/Protected**: Encapsulation

### Python Features
- **Duck Typing**: Flexible interfaces
- **Decorators**: Function/class enhancement
- **Metaclasses**: Singleton implementation
- **ABC (Abstract Base Classes)**: Define interfaces
- **Data Classes**: Reduce boilerplate

---

## Best Practices

### When to Use Patterns
✅ **DO:**
- Use patterns to solve real problems, not for the sake of using patterns
- Understand the problem before applying a pattern
- Start simple, refactor to patterns when needed
- Combine patterns when appropriate

❌ **DON'T:**
- Over-engineer simple solutions
- Force patterns where they don't fit
- Use patterns you don't fully understand
- Apply all patterns at once

### Pattern Anti-Patterns
1. **God Object**: One class does everything (violates Single Responsibility)
2. **Spaghetti Code**: No clear structure or patterns
3. **Golden Hammer**: Using same pattern for every problem
4. **Cargo Cult**: Copying patterns without understanding

---

## SOLID Principles Alignment

Design patterns often implement SOLID principles:

- **S**ingle Responsibility: Strategy, Command, Decorator
- **O**pen/Closed: Decorator, Strategy, Template Method
- **L**iskov Substitution: All patterns respect this
- **I**nterface Segregation: Adapter, Facade
- **D**ependency Inversion: Factory, Abstract Factory, Strategy

---

## Learning Path

### Beginner (Start Here)
1. **Singleton** - Simplest pattern, understand instance control
2. **Factory Method** - Learn object creation abstraction
3. **Strategy** - Understand algorithm encapsulation
4. **Observer** - Event-driven programming basics

### Intermediate
5. **Decorator** - Dynamic behavior composition
6. **Adapter** - Interface compatibility
7. **Command** - Request encapsulation
8. **Template Method** - Algorithm structure

### Advanced
9. **Abstract Factory** - Complex object families
10. **Builder** - Complex object construction
11. **Composite** - Recursive structures
12. **Visitor** - Operations on complex structures

### Expert
13. **Bridge** - Multi-dimensional abstraction
14. **Flyweight** - Memory optimization
15. **Mediator** - Complex interaction management
16. **Memento** - State management

---

## Common Interview Questions

### Theory Questions
1. **Difference between Factory and Abstract Factory?**
   - Factory creates one type, Abstract Factory creates families

2. **When would you use Decorator over inheritance?**
   - Need runtime behavior changes or multiple combinations

3. **Singleton vs Static Class?**
   - Singleton can implement interfaces, lazy initialization, polymorphism

4. **Strategy vs State?**
   - Strategy: Client chooses algorithm
   - State: Object changes behavior based on internal state

### Coding Questions
1. **Implement a thread-safe Singleton**
2. **Design a logging system** (Singleton + Factory)
3. **Build a notification system** (Observer)
4. **Create a text editor with undo/redo** (Command + Memento)
5. **Design a payment processor** (Strategy + Factory)

---

## Resources

### Books
- "Design Patterns: Elements of Reusable Object-Oriented Software" (Gang of Four)
- "Head First Design Patterns" (Freeman & Freeman)
- "Refactoring to Patterns" (Joshua Kerievsky)

### Online
- [Refactoring Guru](https://refactoring.guru/design-patterns)
- [Source Making](https://sourcemaking.com/design_patterns)

---

## Pattern Comparison

### Factory Method vs Abstract Factory
| Factory Method | Abstract Factory |
|----------------|------------------|
| One product | Family of products |
| Subclass creation | Object composition |
| Single method | Multiple methods |

### Decorator vs Proxy
| Decorator | Proxy |
|-----------|-------|
| Add functionality | Control access |
| Multiple decorators | Usually one proxy |
| Composition focus | Access control focus |

### Strategy vs State
| Strategy | State |
|----------|-------|
| Client selects | Object changes internally |
| Algorithms are independent | States may know each other |
| Doesn't change context | Changes context behavior |

---

## Quick Start Examples

### TypeScript Quick Example
```typescript
// Strategy Pattern
interface PaymentStrategy {
    pay(amount: number): void;
}

class CreditCard implements PaymentStrategy {
    pay(amount: number): void {
        console.log(`Paid ${amount} with credit card`);
    }
}

class PayPal implements PaymentStrategy {
    pay(amount: number): void {
        console.log(`Paid ${amount} with PayPal`);
    }
}

class ShoppingCart {
    constructor(private strategy: PaymentStrategy) {}

    checkout(amount: number): void {
        this.strategy.pay(amount);
    }
}

// Usage
const cart = new ShoppingCart(new CreditCard());
cart.checkout(100);
```

### Python Quick Example
```python
# Observer Pattern
from abc import ABC, abstractmethod
from typing import List

class Observer(ABC):
    @abstractmethod
    def update(self, message: str) -> None:
        pass

class Subject:
    def __init__(self):
        self._observers: List[Observer] = []

    def attach(self, observer: Observer) -> None:
        self._observers.append(observer)

    def notify(self, message: str) -> None:
        for observer in self._observers:
            observer.update(message)

class EmailNotifier(Observer):
    def update(self, message: str) -> None:
        print(f"Email: {message}")

# Usage
subject = Subject()
subject.attach(EmailNotifier())
subject.notify("New order received!")
```

---

## Next Steps

1. **Choose a pattern** from the table of contents
2. **Read the detailed guide** for that pattern
3. **Implement the examples** in both TypeScript and Python
4. **Apply to a real project** using the folder structures provided
5. **Practice coding problems** related to each pattern

---

**Remember**: Patterns are tools in your toolbox. The key is knowing when and how to use them, not memorizing all of them.

---

*Last Updated: 2025-11-16*
