# Functional Programming Patterns

> Comprehensive guide to functional programming techniques in TypeScript and Python

## Overview

Functional Programming (FP) is a programming paradigm that treats computation as the evaluation of mathematical functions and avoids changing state and mutable data. It emphasizes immutability, pure functions, and declarative code.

**Core Principles:**
1. **Pure Functions** - No side effects, same input = same output
2. **Immutability** - Data cannot be changed after creation
3. **First-Class Functions** - Functions are values
4. **Higher-Order Functions** - Functions that take/return functions
5. **Function Composition** - Combine simple functions to build complex ones

---

## Table of Contents

1. [Pure Functions & Immutability](#pure-functions--immutability)
2. [Higher-Order Functions](#higher-order-functions)
3. [Function Composition](#function-composition)
4. [Currying & Partial Application](#currying--partial-application)
5. [Functors](#functors)
6. [Monads](#monads)
7. [Lazy Evaluation](#lazy-evaluation)
8. [Pattern Matching](#pattern-matching)
9. [Recursion & Tail Call Optimization](#recursion--tail-call-optimization)
10. [Functional Error Handling](#functional-error-handling)

---

## Pure Functions & Immutability

### Pure Functions

A **pure function** always produces the same output for the same input and has no side effects.

#### TypeScript Examples

```typescript
// ❌ IMPURE: Depends on external state
let counter = 0;
function incrementImpure(): number {
    return ++counter; // Modifies external state
}

// ❌ IMPURE: Same input, different output
function getRandomImpure(max: number): number {
    return Math.random() * max; // Non-deterministic
}

// ✅ PURE: Same input = same output, no side effects
function add(a: number, b: number): number {
    return a + b;
}

// ✅ PURE: No external dependencies
function multiply(a: number, b: number): number {
    return a * b;
}

// ✅ PURE: Returns new array instead of mutating
function addItem<T>(arr: readonly T[], item: T): T[] {
    return [...arr, item]; // Creates new array
}

// ❌ IMPURE: Mutates input
function addItemImpure<T>(arr: T[], item: T): T[] {
    arr.push(item); // Modifies original array!
    return arr;
}
```

#### Python Examples

```python
# ❌ IMPURE: Depends on external state
counter = 0
def increment_impure():
    global counter
    counter += 1
    return counter

# ❌ IMPURE: Mutates input
def add_item_impure(lst, item):
    lst.append(item)  # Modifies original list!
    return lst

# ✅ PURE: Same input = same output
def add(a, b):
    return a + b

# ✅ PURE: Returns new list
def add_item(lst, item):
    return [*lst, item]  # Creates new list

# ✅ PURE: No side effects
def filter_even(numbers):
    return [n for n in numbers if n % 2 == 0]
```

### Immutability

**Immutable data** cannot be changed after creation.

#### TypeScript: Immutability

```typescript
// Immutable object with readonly
interface User {
    readonly id: number;
    readonly name: string;
    readonly email: string;
}

// Utility type for deep readonly
type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object
        ? DeepReadonly<T[P]>
        : T[P];
};

// Immutable operations
const user: User = { id: 1, name: 'John', email: 'john@example.com' };

// ✅ Create new object instead of mutating
function updateUser(user: User, updates: Partial<User>): User {
    return { ...user, ...updates };
}

const updatedUser = updateUser(user, { name: 'Jane' });

// Immutable array operations
const numbers: readonly number[] = [1, 2, 3, 4, 5];

// ✅ All return new arrays
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

// Using Immer for complex immutable updates
import produce from 'immer';

interface State {
    users: User[];
    settings: {
        theme: string;
        notifications: boolean;
    };
}

const state: State = {
    users: [user],
    settings: {
        theme: 'dark',
        notifications: true
    }
};

// ✅ Immutable update with Immer
const newState = produce(state, draft => {
    draft.users.push({ id: 2, name: 'Bob', email: 'bob@example.com' });
    draft.settings.theme = 'light';
});
```

#### Python: Immutability

```python
from dataclasses import dataclass
from typing import List, Tuple
from functools import reduce

# Immutable with dataclass
@dataclass(frozen=True)
class User:
    id: int
    name: str
    email: str

# Immutable with NamedTuple
from typing import NamedTuple

class Point(NamedTuple):
    x: float
    y: float

# ✅ Returns new object
def update_user(user: User, **updates) -> User:
    return dataclass.replace(user, **updates)

user = User(id=1, name='John', email='john@example.com')
updated = update_user(user, name='Jane')

# Immutable collections
numbers = (1, 2, 3, 4, 5)  # Tuple is immutable

# ✅ All return new iterables
doubled = tuple(n * 2 for n in numbers)
evens = tuple(n for n in numbers if n % 2 == 0)
total = reduce(lambda acc, n: acc + n, numbers, 0)

# Using pyrsistent for persistent data structures
from pyrsistent import pvector, pmap

# Immutable vector
vec = pvector([1, 2, 3])
new_vec = vec.append(4)  # Returns new vector

# Immutable map
mapping = pmap({'a': 1, 'b': 2})
new_map = mapping.set('c', 3)  # Returns new map
```

---

## Higher-Order Functions

Functions that take functions as arguments or return functions.

### TypeScript Examples

```typescript
// Higher-order function: takes function as argument
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
    const result: U[] = [];
    for (const item of arr) {
        result.push(fn(item));
    }
    return result;
}

// Higher-order function: returns function
function multiplyBy(factor: number): (n: number) => number {
    return (n: number) => n * factor;
}

const double = multiplyBy(2);
const triple = multiplyBy(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15

// Practical example: Logger wrapper
type LogLevel = 'info' | 'warn' | 'error';

function withLogging<T extends any[], R>(
    fn: (...args: T) => R,
    level: LogLevel = 'info'
): (...args: T) => R {
    return (...args: T): R => {
        console.log(`[${level.toUpperCase()}] Calling ${fn.name} with args:`, args);
        const result = fn(...args);
        console.log(`[${level.toUpperCase()}] Result:`, result);
        return result;
    };
}

function add(a: number, b: number): number {
    return a + b;
}

const loggedAdd = withLogging(add);
loggedAdd(2, 3); // Logs input and output

// Memoization (caching)
function memoize<T extends any[], R>(fn: (...args: T) => R): (...args: T) => R {
    const cache = new Map<string, R>();

    return (...args: T): R => {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            console.log('Cache hit!');
            return cache.get(key)!;
        }

        console.log('Cache miss, computing...');
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}

function fibonacci(n: number): number {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

const memoizedFib = memoize(fibonacci);
console.log(memoizedFib(40)); // Fast due to memoization
```

### Python Examples

```python
from typing import Callable, TypeVar, List
from functools import wraps
import time

T = TypeVar('T')
R = TypeVar('R')

# Higher-order function: takes function as argument
def map_list(fn: Callable[[T], R], items: List[T]) -> List[R]:
    return [fn(item) for item in items]

# Higher-order function: returns function
def multiply_by(factor: int) -> Callable[[int], int]:
    def multiplier(n: int) -> int:
        return n * factor
    return multiplier

double = multiply_by(2)
triple = multiply_by(3)

print(double(5))  # 10
print(triple(5))  # 15

# Decorator: Higher-order function for functions
def timing_decorator(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f}s")
        return result
    return wrapper

@timing_decorator
def slow_function():
    time.sleep(1)
    return "Done"

# Memoization decorator
def memoize(func):
    cache = {}

    @wraps(func)
    def wrapper(*args):
        if args not in cache:
            print(f"Cache miss for {args}")
            cache[args] = func(*args)
        else:
            print(f"Cache hit for {args}")
        return cache[args]

    return wrapper

@memoize
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(fibonacci(100))  # Fast due to memoization
```

---

## Function Composition

Combine simple functions to create complex ones.

### TypeScript Examples

```typescript
// Basic composition
function compose<A, B, C>(
    f: (b: B) => C,
    g: (a: A) => B
): (a: A) => C {
    return (a: A) => f(g(a));
}

// Multiple function composition
function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
    return (arg: T) => fns.reduce((result, fn) => fn(result), arg);
}

// Example functions
const addOne = (n: number): number => n + 1;
const double = (n: number): number => n * 2;
const square = (n: number): number => n * n;

// Composition
const addOneThenDouble = compose(double, addOne);
console.log(addOneThenDouble(5)); // (5 + 1) * 2 = 12

// Pipe (left to right)
const pipeline = pipe(
    addOne,   // 5 + 1 = 6
    double,   // 6 * 2 = 12
    square    // 12 * 12 = 144
);

console.log(pipeline(5)); // 144

// Practical example: Data transformation pipeline
interface User {
    id: number;
    name: string;
    email: string;
    age: number;
}

const users: User[] = [
    { id: 1, name: 'john doe', email: 'JOHN@EXAMPLE.COM', age: 25 },
    { id: 2, name: 'jane smith', email: 'JANE@EXAMPLE.COM', age: 30 }
];

// Transformation functions
const normalizeEmail = (user: User): User => ({
    ...user,
    email: user.email.toLowerCase()
});

const capitalizeName = (user: User): User => ({
    ...user,
    name: user.name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
});

const addFullName = (user: User): User & { fullName: string } => ({
    ...user,
    fullName: user.name
});

// Compose transformations
const transformUser = (user: User) =>
    pipe<any>(
        normalizeEmail,
        capitalizeName,
        addFullName
    )(user);

const transformedUsers = users.map(transformUser);
console.log(transformedUsers);
```

### Python Examples

```python
from typing import Callable, TypeVar
from functools import reduce

T = TypeVar('T')

# Basic composition
def compose(f: Callable, g: Callable) -> Callable:
    return lambda x: f(g(x))

# Multiple function composition
def pipe(*fns: Callable) -> Callable:
    def composed(arg):
        return reduce(lambda result, fn: fn(result), fns, arg)
    return composed

# Example functions
add_one = lambda n: n + 1
double = lambda n: n * 2
square = lambda n: n * n

# Composition
add_one_then_double = compose(double, add_one)
print(add_one_then_double(5))  # (5 + 1) * 2 = 12

# Pipe (left to right)
pipeline = pipe(
    add_one,   # 5 + 1 = 6
    double,    # 6 * 2 = 12
    square     # 12 * 12 = 144
)

print(pipeline(5))  # 144

# Practical example: Data transformation
from dataclasses import dataclass
from typing import List

@dataclass
class User:
    id: int
    name: str
    email: str
    age: int

users = [
    User(1, 'john doe', 'JOHN@EXAMPLE.COM', 25),
    User(2, 'jane smith', 'JANE@EXAMPLE.COM', 30)
]

# Transformation functions
def normalize_email(user: User) -> User:
    return User(user.id, user.name, user.email.lower(), user.age)

def capitalize_name(user: User) -> User:
    name = ' '.join(word.capitalize() for word in user.name.split())
    return User(user.id, name, user.email, user.age)

def filter_adults(users: List[User]) -> List[User]:
    return [u for u in users if u.age >= 18]

# Compose transformations
transform_user = pipe(
    normalize_email,
    capitalize_name
)

transformed_users = [transform_user(u) for u in users]
print(transformed_users)
```

---

## Currying & Partial Application

### Currying

Transform a function with multiple arguments into a sequence of functions each taking a single argument.

#### TypeScript: Currying

```typescript
// Regular function
function add(a: number, b: number, c: number): number {
    return a + b + c;
}

// Curried version
function addCurried(a: number): (b: number) => (c: number) => number {
    return (b: number) => (c: number) => a + b + c;
}

const add5 = addCurried(5);
const add5and3 = add5(3);
const result = add5and3(2); // 10

// Generic curry function
function curry<T extends any[], R>(
    fn: (...args: T) => R
): any {
    return function curried(...args: any[]): any {
        if (args.length >= fn.length) {
            return fn(...args as T);
        }
        return (...nextArgs: any[]) => curried(...args, ...nextArgs);
    };
}

// Usage
const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3));        // 6
console.log(curriedAdd(1, 2)(3));        // 6
console.log(curriedAdd(1)(2, 3));        // 6

// Practical example: Building URLs
function buildUrl(protocol: string): (domain: string) => (path: string) => string {
    return (domain: string) => (path: string) => `${protocol}://${domain}/${path}`;
}

const httpsUrl = buildUrl('https');
const apiUrl = httpsUrl('api.example.com');

console.log(apiUrl('users'));      // https://api.example.com/users
console.log(apiUrl('products'));   // https://api.example.com/products
```

#### Python: Currying

```python
from typing import Callable
from functools import partial

# Regular function
def add(a: int, b: int, c: int) -> int:
    return a + b + c

# Curried version
def add_curried(a: int) -> Callable:
    def add_b(b: int) -> Callable:
        def add_c(c: int) -> int:
            return a + b + c
        return add_c
    return add_b

add_5 = add_curried(5)
add_5_and_3 = add_5(3)
result = add_5_and_3(2)  # 10

# Using toolz for automatic currying
from toolz import curry as toolz_curry

@toolz_curry
def add_auto(a: int, b: int, c: int) -> int:
    return a + b + c

print(add_auto(1)(2)(3))         # 6
print(add_auto(1, 2)(3))         # 6
print(add_auto(1)(2, 3))         # 6

# Practical example: Building URLs
def build_url(protocol: str) -> Callable:
    def with_domain(domain: str) -> Callable:
        def with_path(path: str) -> str:
            return f"{protocol}://{domain}/{path}"
        return with_path
    return with_domain

https_url = build_url('https')
api_url = https_url('api.example.com')

print(api_url('users'))       # https://api.example.com/users
print(api_url('products'))    # https://api.example.com/products
```

### Partial Application

Create a new function by fixing some arguments of an existing function.

#### TypeScript: Partial Application

```typescript
// Partial application helper
function partial<T extends any[], R>(
    fn: (...args: T) => R,
    ...fixedArgs: Partial<T>
): (...remainingArgs: any[]) => R {
    return (...remainingArgs: any[]) => {
        return fn(...[...fixedArgs, ...remainingArgs] as T);
    };
}

// Example
function greet(greeting: string, name: string, punctuation: string): string {
    return `${greeting}, ${name}${punctuation}`;
}

const sayHello = partial(greet, 'Hello');
const sayHelloJohn = partial(greet, 'Hello', 'John');

console.log(sayHello('Alice', '!'));        // Hello, Alice!
console.log(sayHelloJohn('!'));             // Hello, John!

// Practical example: API fetcher
interface FetchOptions {
    method: string;
    headers: Record<string, string>;
    body?: string;
}

async function fetchApi(
    baseUrl: string,
    endpoint: string,
    options: FetchOptions
): Promise<Response> {
    return fetch(`${baseUrl}/${endpoint}`, options);
}

const fetchFromApi = partial(fetchApi, 'https://api.example.com');
const getFromApi = partial(fetchApi, 'https://api.example.com', 'users');

// Usage
await fetchFromApi('products', { method: 'GET', headers: {} });
await getFromApi({ method: 'GET', headers: {} });
```

#### Python: Partial Application

```python
from functools import partial

# Example
def greet(greeting: str, name: str, punctuation: str) -> str:
    return f"{greeting}, {name}{punctuation}"

say_hello = partial(greet, 'Hello')
say_hello_john = partial(greet, 'Hello', 'John')

print(say_hello('Alice', '!'))      # Hello, Alice!
print(say_hello_john('!'))          # Hello, John!

# Practical example: Database queries
def query_database(db_name: str, table: str, conditions: dict) -> list:
    print(f"Querying {db_name}.{table} with {conditions}")
    return []

# Partially apply database name
query_users_db = partial(query_database, 'users_db')

# Partially apply database and table
query_users_table = partial(query_database, 'users_db', 'users')

# Usage
query_users_db('orders', {'status': 'pending'})
query_users_table({'age': 25})
```

---

## Functors

A **functor** is a container that can be mapped over.

### TypeScript: Functor

```typescript
interface Functor<T> {
    map<U>(fn: (value: T) => U): Functor<U>;
}

// Maybe functor (handles null/undefined)
class Maybe<T> implements Functor<T> {
    private constructor(private value: T | null) {}

    static of<T>(value: T | null): Maybe<T> {
        return new Maybe(value);
    }

    static nothing<T>(): Maybe<T> {
        return new Maybe<T>(null);
    }

    isNothing(): boolean {
        return this.value === null || this.value === undefined;
    }

    map<U>(fn: (value: T) => U): Maybe<U> {
        if (this.isNothing()) {
            return Maybe.nothing<U>();
        }
        return Maybe.of(fn(this.value!));
    }

    getOrElse(defaultValue: T): T {
        return this.isNothing() ? defaultValue : this.value!;
    }

    toString(): string {
        return this.isNothing() ? 'Nothing' : `Just(${this.value})`;
    }
}

// Usage
const value1 = Maybe.of(5)
    .map(x => x * 2)      // Just(10)
    .map(x => x + 3)      // Just(13)
    .getOrElse(0);        // 13

const value2 = Maybe.of(null)
    .map(x => x * 2)      // Nothing
    .map(x => x + 3)      // Nothing
    .getOrElse(0);        // 0

console.log(value1, value2);

// Array is a functor
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(x => x * 2); // [2, 4, 6, 8, 10]
```

### Python: Functor

```python
from typing import Generic, TypeVar, Callable, Optional

T = TypeVar('T')
U = TypeVar('U')

# Maybe functor
class Maybe(Generic[T]):
    def __init__(self, value: Optional[T]):
        self._value = value

    @staticmethod
    def of(value: Optional[T]) -> 'Maybe[T]':
        return Maybe(value)

    @staticmethod
    def nothing() -> 'Maybe':
        return Maybe(None)

    def is_nothing(self) -> bool:
        return self._value is None

    def map(self, fn: Callable[[T], U]) -> 'Maybe[U]':
        if self.is_nothing():
            return Maybe.nothing()
        return Maybe.of(fn(self._value))

    def get_or_else(self, default: T) -> T:
        return default if self.is_nothing() else self._value

    def __repr__(self) -> str:
        return 'Nothing' if self.is_nothing() else f'Just({self._value})'

# Usage
value1 = (Maybe.of(5)
          .map(lambda x: x * 2)    # Just(10)
          .map(lambda x: x + 3)    # Just(13)
          .get_or_else(0))         # 13

value2 = (Maybe.of(None)
          .map(lambda x: x * 2)    # Nothing
          .map(lambda x: x + 3)    # Nothing
          .get_or_else(0))         # 0

print(value1, value2)  # 13, 0
```

---

## Monads

A **monad** is a functor with `flatMap` (also called `bind` or `chain`) that flattens nested structures.

### TypeScript: Monad

```typescript
// Result monad for error handling
type Result<T, E> = Success<T> | Failure<E>;

class Success<T> {
    readonly kind = 'success' as const;

    constructor(public value: T) {}

    map<U>(fn: (value: T) => U): Result<U, never> {
        return new Success(fn(this.value));
    }

    flatMap<U, E>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return fn(this.value);
    }

    getOrElse<U>(defaultValue: U): T {
        return this.value;
    }

    isSuccess(): this is Success<T> {
        return true;
    }

    isFailure(): this is never {
        return false;
    }
}

class Failure<E> {
    readonly kind = 'failure' as const;

    constructor(public error: E) {}

    map<U>(fn: (value: any) => U): Result<U, E> {
        return this as any;
    }

    flatMap<U, F>(fn: (value: any) => Result<U, F>): Result<U, E> {
        return this as any;
    }

    getOrElse<U>(defaultValue: U): U {
        return defaultValue;
    }

    isSuccess(): this is never {
        return false;
    }

    isFailure(): this is Failure<E> {
        return true;
    }
}

// Helper functions
function success<T>(value: T): Result<T, never> {
    return new Success(value);
}

function failure<E>(error: E): Result<never, E> {
    return new Failure(error);
}

// Example usage
function divide(a: number, b: number): Result<number, string> {
    if (b === 0) {
        return failure('Division by zero');
    }
    return success(a / b);
}

function sqrt(n: number): Result<number, string> {
    if (n < 0) {
        return failure('Cannot take square root of negative number');
    }
    return success(Math.sqrt(n));
}

// Chain operations
const result = divide(100, 4)
    .flatMap(x => sqrt(x))      // sqrt(25) = 5
    .map(x => x * 2)             // 5 * 2 = 10
    .getOrElse(0);

console.log(result); // 10

const errorResult = divide(100, 0)
    .flatMap(x => sqrt(x))
    .map(x => x * 2)
    .getOrElse(0);

console.log(errorResult); // 0 (fallback)
```

### Python: Monad

```python
from typing import Generic, TypeVar, Callable, Union
from dataclasses import dataclass

T = TypeVar('T')
U = TypeVar('U')
E = TypeVar('E')

# Result monad
@dataclass
class Success(Generic[T]):
    value: T

    def map(self, fn: Callable[[T], U]) -> 'Result[U, E]':
        return Success(fn(self.value))

    def flat_map(self, fn: Callable[[T], 'Result[U, E]']) -> 'Result[U, E]':
        return fn(self.value)

    def get_or_else(self, default):
        return self.value

    def is_success(self) -> bool:
        return True

    def is_failure(self) -> bool:
        return False

@dataclass
class Failure(Generic[E]):
    error: E

    def map(self, fn):
        return self

    def flat_map(self, fn):
        return self

    def get_or_else(self, default):
        return default

    def is_success(self) -> bool:
        return False

    def is_failure(self) -> bool:
        return True

Result = Union[Success[T], Failure[E]]

# Example usage
def divide(a: float, b: float) -> Result[float, str]:
    if b == 0:
        return Failure('Division by zero')
    return Success(a / b)

def sqrt(n: float) -> Result[float, str]:
    if n < 0:
        return Failure('Cannot take square root of negative number')
    return Success(n ** 0.5)

# Chain operations
result = (divide(100, 4)
          .flat_map(lambda x: sqrt(x))  # sqrt(25) = 5
          .map(lambda x: x * 2)          # 5 * 2 = 10
          .get_or_else(0))

print(result)  # 10.0

error_result = (divide(100, 0)
                .flat_map(lambda x: sqrt(x))
                .map(lambda x: x * 2)
                .get_or_else(0))

print(error_result)  # 0 (fallback)
```

---

## Summary

**Key Functional Programming Principles:**

1. **Pure Functions**: Predictable, testable, no side effects
2. **Immutability**: Safer concurrent code, easier reasoning
3. **Higher-Order Functions**: Code reuse, composition
4. **Function Composition**: Build complex from simple
5. **Currying/Partial Application**: Create specialized functions
6. **Functors/Monads**: Handle effects functionally

**Benefits:**
- More testable code
- Easier to reason about
- Better composition
- Safer concurrency
- Declarative style

**When to use:**
- Data transformation pipelines
- Error handling without exceptions
- Async operations
- State management
- Complex business logic

---

*See also: [Strategy Pattern](DesignPatterns-Strategy.md) | [Builder Pattern](DesignPatterns-Builder.md)*
