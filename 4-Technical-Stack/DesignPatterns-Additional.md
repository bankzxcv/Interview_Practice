# Additional Design Patterns - Quick Reference

> Comprehensive quick reference for commonly used design patterns

This document provides concise explanations and examples for additional design patterns not covered in dedicated files.

---

## Creational Patterns

### Abstract Factory Pattern

**Purpose**: Create families of related objects without specifying concrete classes

**When to use**: Cross-platform UI, themed components, product families

```typescript
// TypeScript
interface Button {
    render(): void;
}

interface Checkbox {
    render(): void;
}

interface UIFactory {
    createButton(): Button;
    createCheckbox(): Checkbox;
}

class WindowsButton implements Button {
    render(): void { console.log('Windows Button'); }
}

class WindowsCheckbox implements Checkbox {
    render(): void { console.log('Windows Checkbox'); }
}

class MacButton implements Button {
    render(): void { console.log('Mac Button'); }
}

class MacCheckbox implements Checkbox {
    render(): void { console.log('Mac Checkbox'); }
}

class WindowsFactory implements UIFactory {
    createButton(): Button { return new WindowsButton(); }
    createCheckbox(): Checkbox { return new WindowsCheckbox(); }
}

class MacFactory implements UIFactory {
    createButton(): Button { return new MacButton(); }
    createCheckbox(): Checkbox { return new MacCheckbox(); }
}

// Usage
function createUI(factory: UIFactory) {
    const button = factory.createButton();
    const checkbox = factory.createCheckbox();
    button.render();
    checkbox.render();
}

createUI(new WindowsFactory());
```

```python
# Python
from abc import ABC, abstractmethod

class Button(ABC):
    @abstractmethod
    def render(self) -> None:
        pass

class Checkbox(ABC):
    @abstractmethod
    def render(self) -> None:
        pass

class UIFactory(ABC):
    @abstractmethod
    def create_button(self) -> Button:
        pass

    @abstractmethod
    def create_checkbox(self) -> Checkbox:
        pass

class WindowsButton(Button):
    def render(self) -> None:
        print('Windows Button')

class WindowsCheckbox(Checkbox):
    def render(self) -> None:
        print('Windows Checkbox')

class WindowsFactory(UIFactory):
    def create_button(self) -> Button:
        return WindowsButton()

    def create_checkbox(self) -> Checkbox:
        return WindowsCheckbox()

# Usage
def create_ui(factory: UIFactory):
    button = factory.create_button()
    checkbox = factory.create_checkbox()
    button.render()
    checkbox.render()

create_ui(WindowsFactory())
```

---

### Prototype Pattern

**Purpose**: Clone existing objects instead of creating new ones

**When to use**: Expensive object creation, configuration templates

```typescript
// TypeScript
interface Prototype<T> {
    clone(): T;
}

class Document implements Prototype<Document> {
    constructor(
        public title: string,
        public content: string,
        public metadata: Record<string, any>
    ) {}

    clone(): Document {
        return new Document(
            this.title,
            this.content,
            { ...this.metadata }
        );
    }

    display(): void {
        console.log(`Title: ${this.title}, Content: ${this.content}`);
    }
}

// Usage
const template = new Document('Template', 'Default content', { author: 'System' });
const doc1 = template.clone();
doc1.title = 'Document 1';

const doc2 = template.clone();
doc2.title = 'Document 2';
```

```python
# Python
from copy import deepcopy
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class Document:
    title: str
    content: str
    metadata: Dict[str, Any]

    def clone(self) -> 'Document':
        return Document(
            self.title,
            self.content,
            deepcopy(self.metadata)
        )

# Usage
template = Document('Template', 'Default content', {'author': 'System'})
doc1 = template.clone()
doc1.title = 'Document 1'

doc2 = template.clone()
doc2.title = 'Document 2'
```

---

## Structural Patterns

### Adapter Pattern

**Purpose**: Make incompatible interfaces work together

**When to use**: Legacy code integration, third-party library adaptation

```typescript
// TypeScript
// Legacy interface
class LegacyRectangle {
    constructor(public x1: number, public y1: number, public x2: number, public y2: number) {}
}

// Modern interface
interface Shape {
    draw(): void;
    getArea(): number;
}

// Adapter
class RectangleAdapter implements Shape {
    constructor(private legacy: LegacyRectangle) {}

    draw(): void {
        console.log(`Drawing rectangle from (${this.legacy.x1}, ${this.legacy.y1}) to (${this.legacy.x2}, ${this.legacy.y2})`);
    }

    getArea(): number {
        return Math.abs((this.legacy.x2 - this.legacy.x1) * (this.legacy.y2 - this.legacy.y1));
    }
}

// Usage
const legacy = new LegacyRectangle(0, 0, 10, 5);
const shape: Shape = new RectangleAdapter(legacy);
shape.draw();
console.log(`Area: ${shape.getArea()}`);
```

---

### Decorator Pattern

**Purpose**: Add behavior to objects dynamically

**When to use**: Adding features at runtime, middleware, logging

```typescript
// TypeScript
interface Coffee {
    cost(): number;
    description(): string;
}

class SimpleCoffee implements Coffee {
    cost(): number { return 5; }
    description(): string { return 'Simple coffee'; }
}

// Decorator base
abstract class CoffeeDecorator implements Coffee {
    constructor(protected coffee: Coffee) {}
    abstract cost(): number;
    abstract description(): string;
}

class MilkDecorator extends CoffeeDecorator {
    cost(): number { return this.coffee.cost() + 2; }
    description(): string { return this.coffee.description() + ', milk'; }
}

class SugarDecorator extends CoffeeDecorator {
    cost(): number { return this.coffee.cost() + 1; }
    description(): string { return this.coffee.description() + ', sugar'; }
}

// Usage
let coffee: Coffee = new SimpleCoffee();
console.log(`${coffee.description()}: $${coffee.cost()}`);

coffee = new MilkDecorator(coffee);
console.log(`${coffee.description()}: $${coffee.cost()}`);

coffee = new SugarDecorator(coffee);
console.log(`${coffee.description()}: $${coffee.cost()}`);
```

```python
# Python
from abc import ABC, abstractmethod

class Coffee(ABC):
    @abstractmethod
    def cost(self) -> float:
        pass

    @abstractmethod
    def description(self) -> str:
        pass

class SimpleCoffee(Coffee):
    def cost(self) -> float:
        return 5.0

    def description(self) -> str:
        return 'Simple coffee'

class CoffeeDecorator(Coffee):
    def __init__(self, coffee: Coffee):
        self._coffee = coffee

class MilkDecorator(CoffeeDecorator):
    def cost(self) -> float:
        return self._coffee.cost() + 2.0

    def description(self) -> str:
        return f"{self._coffee.description()}, milk"

class SugarDecorator(CoffeeDecorator):
    def cost(self) -> float:
        return self._coffee.cost() + 1.0

    def description(self) -> str:
        return f"{self._coffee.description()}, sugar"

# Usage
coffee = SimpleCoffee()
coffee = MilkDecorator(coffee)
coffee = SugarDecorator(coffee)
print(f"{coffee.description()}: ${coffee.cost()}")
```

---

### Facade Pattern

**Purpose**: Provide simplified interface to complex subsystem

**When to use**: Simplifying complex APIs, creating unified interface

```typescript
// TypeScript
// Complex subsystems
class CPU {
    freeze(): void { console.log('CPU: Freeze'); }
    jump(position: number): void { console.log(`CPU: Jump to ${position}`); }
    execute(): void { console.log('CPU: Execute'); }
}

class Memory {
    load(position: number, data: string): void {
        console.log(`Memory: Load ${data} at ${position}`);
    }
}

class HardDrive {
    read(sector: number, size: number): string {
        console.log(`HardDrive: Read ${size} bytes from sector ${sector}`);
        return 'boot data';
    }
}

// Facade
class ComputerFacade {
    private cpu = new CPU();
    private memory = new Memory();
    private hardDrive = new HardDrive();

    start(): void {
        console.log('Starting computer...');
        this.cpu.freeze();
        const bootData = this.hardDrive.read(0, 1024);
        this.memory.load(0, bootData);
        this.cpu.jump(0);
        this.cpu.execute();
        console.log('Computer started!');
    }
}

// Usage
const computer = new ComputerFacade();
computer.start(); // Simple interface to complex process
```

---

### Proxy Pattern

**Purpose**: Control access to another object

**When to use**: Lazy loading, caching, access control

```typescript
// TypeScript
interface Image {
    display(): void;
}

class RealImage implements Image {
    constructor(private filename: string) {
        this.loadFromDisk();
    }

    private loadFromDisk(): void {
        console.log(`Loading ${this.filename}`);
    }

    display(): void {
        console.log(`Displaying ${this.filename}`);
    }
}

class ProxyImage implements Image {
    private realImage: RealImage | null = null;

    constructor(private filename: string) {}

    display(): void {
        if (!this.realImage) {
            this.realImage = new RealImage(this.filename);
        }
        this.realImage.display();
    }
}

// Usage
const image = new ProxyImage('photo.jpg');
// Image not loaded yet
image.display(); // Loads and displays
image.display(); // Just displays (already loaded)
```

---

## Behavioral Patterns

### Observer Pattern

**Purpose**: Define one-to-many dependency, notify observers of changes

**When to use**: Event systems, reactive programming, pub/sub

```typescript
// TypeScript
interface Observer {
    update(data: any): void;
}

interface Subject {
    attach(observer: Observer): void;
    detach(observer: Observer): void;
    notify(): void;
}

class NewsAgency implements Subject {
    private observers: Observer[] = [];
    private news: string = '';

    attach(observer: Observer): void {
        this.observers.push(observer);
    }

    detach(observer: Observer): void {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    notify(): void {
        for (const observer of this.observers) {
            observer.update(this.news);
        }
    }

    setNews(news: string): void {
        this.news = news;
        this.notify();
    }

    getNews(): string {
        return this.news;
    }
}

class NewsChannel implements Observer {
    constructor(private name: string) {}

    update(news: string): void {
        console.log(`${this.name} received news: ${news}`);
    }
}

// Usage
const agency = new NewsAgency();
const cnn = new NewsChannel('CNN');
const bbc = new NewsChannel('BBC');

agency.attach(cnn);
agency.attach(bbc);

agency.setNews('Breaking: Design Patterns are awesome!');
```

```python
# Python
from abc import ABC, abstractmethod
from typing import List

class Observer(ABC):
    @abstractmethod
    def update(self, data: any) -> None:
        pass

class Subject(ABC):
    @abstractmethod
    def attach(self, observer: Observer) -> None:
        pass

    @abstractmethod
    def detach(self, observer: Observer) -> None:
        pass

    @abstractmethod
    def notify(self) -> None:
        pass

class NewsAgency(Subject):
    def __init__(self):
        self._observers: List[Observer] = []
        self._news: str = ''

    def attach(self, observer: Observer) -> None:
        self._observers.append(observer)

    def detach(self, observer: Observer) -> None:
        self._observers.remove(observer)

    def notify(self) -> None:
        for observer in self._observers:
            observer.update(self._news)

    def set_news(self, news: str) -> None:
        self._news = news
        self.notify()

class NewsChannel(Observer):
    def __init__(self, name: str):
        self._name = name

    def update(self, news: str) -> None:
        print(f"{self._name} received news: {news}")

# Usage
agency = NewsAgency()
cnn = NewsChannel('CNN')
bbc = NewsChannel('BBC')

agency.attach(cnn)
agency.attach(bbc)

agency.set_news('Breaking: Design Patterns are awesome!')
```

---

### Command Pattern

**Purpose**: Encapsulate requests as objects

**When to use**: Undo/redo, transaction queues, macro recording

```typescript
// TypeScript
interface Command {
    execute(): void;
    undo(): void;
}

class Light {
    on(): void { console.log('Light is ON'); }
    off(): void { console.log('Light is OFF'); }
}

class LightOnCommand implements Command {
    constructor(private light: Light) {}
    execute(): void { this.light.on(); }
    undo(): void { this.light.off(); }
}

class LightOffCommand implements Command {
    constructor(private light: Light) {}
    execute(): void { this.light.off(); }
    undo(): void { this.light.on(); }
}

class RemoteControl {
    private history: Command[] = [];

    executeCommand(command: Command): void {
        command.execute();
        this.history.push(command);
    }

    undo(): void {
        const command = this.history.pop();
        if (command) {
            command.undo();
        }
    }
}

// Usage
const light = new Light();
const remote = new RemoteControl();

remote.executeCommand(new LightOnCommand(light));  // Light is ON
remote.executeCommand(new LightOffCommand(light)); // Light is OFF
remote.undo();                                     // Light is ON
```

---

### State Pattern

**Purpose**: Change object behavior when internal state changes

**When to use**: State machines, workflow engines, game states

```typescript
// TypeScript
interface State {
    handle(context: Context): void;
}

class Context {
    private state: State;

    constructor(initialState: State) {
        this.state = initialState;
    }

    setState(state: State): void {
        this.state = state;
    }

    request(): void {
        this.state.handle(this);
    }
}

class ConcreteStateA implements State {
    handle(context: Context): void {
        console.log('State A handling request');
        context.setState(new ConcreteStateB());
    }
}

class ConcreteStateB implements State {
    handle(context: Context): void {
        console.log('State B handling request');
        context.setState(new ConcreteStateA());
    }
}

// Usage
const context = new Context(new ConcreteStateA());
context.request(); // State A
context.request(); // State B
context.request(); // State A
```

---

### Chain of Responsibility Pattern

**Purpose**: Pass requests along a chain of handlers

**When to use**: Middleware, validation chains, event bubbling

```typescript
// TypeScript
abstract class Handler {
    protected next: Handler | null = null;

    setNext(handler: Handler): Handler {
        this.next = handler;
        return handler;
    }

    handle(request: string): string | null {
        if (this.next) {
            return this.next.handle(request);
        }
        return null;
    }
}

class AuthHandler extends Handler {
    handle(request: string): string | null {
        if (request.includes('auth')) {
            return `AuthHandler: Processed ${request}`;
        }
        return super.handle(request);
    }
}

class LogHandler extends Handler {
    handle(request: string): string | null {
        console.log(`LogHandler: Logging ${request}`);
        return super.handle(request);
    }
}

class ValidationHandler extends Handler {
    handle(request: string): string | null {
        if (request.includes('invalid')) {
            return 'ValidationHandler: Request invalid';
        }
        return super.handle(request);
    }
}

// Usage
const auth = new AuthHandler();
const log = new LogHandler();
const validation = new ValidationHandler();

auth.setNext(log).setNext(validation);

console.log(auth.handle('auth request'));
console.log(auth.handle('invalid request'));
```

---

### Template Method Pattern

**Purpose**: Define algorithm skeleton, defer steps to subclasses

**When to use**: Framework design, common algorithm structure with varying steps

```typescript
// TypeScript
abstract class DataProcessor {
    // Template method
    process(): void {
        this.readData();
        this.processData();
        this.saveData();
    }

    protected abstract readData(): void;
    protected abstract processData(): void;
    protected abstract saveData(): void;
}

class CsvProcessor extends DataProcessor {
    protected readData(): void {
        console.log('Reading CSV file');
    }

    protected processData(): void {
        console.log('Processing CSV data');
    }

    protected saveData(): void {
        console.log('Saving CSV to database');
    }
}

class JsonProcessor extends DataProcessor {
    protected readData(): void {
        console.log('Reading JSON file');
    }

    protected processData(): void {
        console.log('Processing JSON data');
    }

    protected saveData(): void {
        console.log('Saving JSON to database');
    }
}

// Usage
const csvProcessor = new CsvProcessor();
csvProcessor.process();

const jsonProcessor = new JsonProcessor();
jsonProcessor.process();
```

```python
# Python
from abc import ABC, abstractmethod

class DataProcessor(ABC):
    def process(self) -> None:
        """Template method"""
        self.read_data()
        self.process_data()
        self.save_data()

    @abstractmethod
    def read_data(self) -> None:
        pass

    @abstractmethod
    def process_data(self) -> None:
        pass

    @abstractmethod
    def save_data(self) -> None:
        pass

class CsvProcessor(DataProcessor):
    def read_data(self) -> None:
        print('Reading CSV file')

    def process_data(self) -> None:
        print('Processing CSV data')

    def save_data(self) -> None:
        print('Saving CSV to database')

class JsonProcessor(DataProcessor):
    def read_data(self) -> None:
        print('Reading JSON file')

    def process_data(self) -> None:
        print('Processing JSON data')

    def save_data(self) -> None:
        print('Saving JSON to database')

# Usage
csv_processor = CsvProcessor()
csv_processor.process()

json_processor = JsonProcessor()
json_processor.process()
```

---

## Summary

This document covers additional patterns:

**Creational:**
- Abstract Factory (families of objects)
- Prototype (cloning)

**Structural:**
- Adapter (interface compatibility)
- Decorator (dynamic behavior)
- Facade (simplified interface)
- Proxy (access control)

**Behavioral:**
- Observer (event notification)
- Command (encapsulate requests)
- State (behavior changes with state)
- Chain of Responsibility (request handling chain)
- Template Method (algorithm skeleton)

For detailed examples, see individual pattern files.

---

*See also: [Design Patterns Index](DesignPatterns.md) | [Functional Programming](DesignPatterns-FunctionalProgramming.md)*
