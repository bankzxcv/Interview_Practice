# Technical Stack Reference - Interview Cheatsheets

Comprehensive technical reference guides covering programming languages, databases, infrastructure, and DevOps tools.

---

## Table of Contents

### Programming Languages
- [Python](Python.md) - Syntax, data structures, libraries, and best practices
- [TypeScript/JavaScript](TypeScript-JavaScript.md) - Modern JS/TS with types, async/await, and patterns
- [Golang](Golang.md) - Go syntax, goroutines, channels, and concurrency
- [Rust](Rust.md) - Ownership, borrowing, lifetimes, and systems programming

### Databases
- [SQL](SQL.md) - Queries, joins, indexing, clustering, and optimization
- [NoSQL](NoSQL.md) - MongoDB, Redis, Cassandra, DynamoDB, sharding, and replication

### Infrastructure & DevOps
- [Docker](Docker.md) - Containers, images, Dockerfile, volumes, and networking
- [Kubernetes](Kubernetes.md) - Container orchestration, deployments, services, and scaling
- [Terraform](Terraform.md) - Infrastructure as Code for AWS, GCP, Azure

### Caching & Performance
- [Caching](Caching.md) - Strategies, Redis, Memcached, and distributed caching

### Observability & Monitoring
- [Elasticsearch](Elasticsearch.md) - Search and analytics engine
- [Grafana](Grafana.md) - Monitoring dashboards and visualization

### Networking
- [Networking](Networking.md) - OSI model, TCP/IP, HTTP, and protocols

---

## Quick Links

| Topic | Key Concepts |
|-------|--------------|
| [Python](Python.md) | Lists, dicts, comprehensions, decorators |
| [TypeScript/JavaScript](TypeScript-JavaScript.md) | Promises, async/await, types, closures |
| [Golang](Golang.md) | Goroutines, channels, interfaces |
| [Rust](Rust.md) | Ownership, borrowing, lifetimes |
| [SQL](SQL.md) | Joins, indexes, transactions, optimization |
| [NoSQL](NoSQL.md) | MongoDB, Redis, Cassandra, sharding |
| [Docker](Docker.md) | Images, containers, Dockerfile, compose |
| [Kubernetes](Kubernetes.md) | Pods, deployments, services, scaling |
| [Terraform](Terraform.md) | Resources, modules, state management |
| [Caching](Caching.md) | Strategies, Redis, invalidation |
| [Elasticsearch](Elasticsearch.md) | Indexing, queries, aggregations |
| [Grafana](Grafana.md) | Dashboards, alerts, visualization |
| [Networking](Networking.md) | OSI, TCP/IP, HTTP, protocols |

---

## Python Quick Reference

### Essential Syntax

```python
# Variables and types
x = 10
s = "hello"
lst = [1, 2, 3]
dct = {"key": "value"}

# Conditionals
if condition:
    pass
elif other_condition:
    pass
else:
    pass

# Loops
for i in range(10):
    pass

for item in iterable:
    pass

while condition:
    pass

# Functions
def function_name(param1, param2=default):
    return result

# Lambda
lambda x: x * 2
```

### Common Data Structures & Time Complexities

| Data Structure | Access | Search | Insert | Delete | Notes |
|---|---|---|---|---|---|
| **List** | O(1) | O(n) | O(n) | O(n) | Ordered, mutable, duplicates allowed |
| **Dict** | O(1) | O(1) | O(1) | O(1) | Key-value pairs, unordered (Python 3.7+: ordered) |
| **Set** | - | O(1) | O(1) | O(1) | Unordered, unique elements only |
| **Tuple** | O(1) | O(n) | - | - | Immutable, ordered, hashable |
| **Deque** | O(1) | O(n) | O(1) | O(1) | Fast at both ends, import from collections |
| **Heap** | O(1) | O(n) | O(log n) | O(log n) | Min-heap by default, import heapq |

### List Comprehensions

```python
# Basic
[x * 2 for x in range(5)]  # [0, 2, 4, 6, 8]

# With condition
[x for x in range(10) if x % 2 == 0]  # [0, 2, 4, 6, 8]

# Nested
[[x * y for y in range(3)] for x in range(3)]

# Dict comprehension
{x: x**2 for x in range(5)}  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# Set comprehension
{x % 3 for x in range(10)}  # {0, 1, 2}
```

### String Operations

```python
s = "hello"

# Common methods
len(s)                    # 5
s.upper()                # "HELLO"
s.lower()                # "hello"
s.strip()                # Remove whitespace
s.split(',')             # Split by delimiter
','.join(['a', 'b'])     # "a,b"
s.replace('old', 'new')  # String replacement
s.find('substring')      # Index of substring (-1 if not found)
s.startswith('he')       # Boolean check
s.endswith('lo')         # Boolean check
s.isdigit()              # Check if all digits
s.isalpha()              # Check if all letters

# Indexing and slicing
s[0]      # 'h'
s[-1]     # 'o'
s[1:4]    # 'ell'
s[::-1]   # 'olleh' (reverse)
```

### Common Built-in Functions

```python
# map: Apply function to each element
list(map(lambda x: x * 2, [1, 2, 3]))  # [2, 4, 6]

# filter: Keep elements that satisfy condition
list(filter(lambda x: x > 2, [1, 2, 3, 4]))  # [3, 4]

# reduce: Accumulate values (from functools)
from functools import reduce
reduce(lambda x, y: x + y, [1, 2, 3, 4])  # 10

# zip: Combine multiple iterables
list(zip([1, 2], ['a', 'b']))  # [(1, 'a'), (2, 'b')]

# enumerate: Get index and value
list(enumerate(['a', 'b', 'c']))  # [(0, 'a'), (1, 'b'), (2, 'c')]

# sorted: Sort with custom function
sorted([3, 1, 2], reverse=True)  # [3, 2, 1]
sorted(items, key=lambda x: x[1])  # Sort by second element

# all/any
all([True, True, False])  # False
any([False, False, True])  # True

# sum, min, max
sum([1, 2, 3])  # 6
min([3, 1, 2])  # 1
max([3, 1, 2])  # 3
```

### Collections Module

```python
from collections import Counter, defaultdict, deque, OrderedDict

# Counter: Count occurrences
Counter([1, 1, 1, 2, 2, 3])  # Counter({1: 3, 2: 2, 3: 1})
counter.most_common(2)        # [(1, 3), (2, 2)]

# defaultdict: Dict with default values
dd = defaultdict(int)
dd['key'] += 1  # No KeyError, defaults to 0

dd = defaultdict(list)
dd['key'].append(1)  # No KeyError, defaults to []

# deque: Double-ended queue
dq = deque([1, 2, 3])
dq.append(4)      # Add to right: [1, 2, 3, 4]
dq.appendleft(0)  # Add to left: [0, 1, 2, 3, 4]
dq.pop()          # Remove from right: 4
dq.popleft()      # Remove from left: 0
```

### Heapq for Priority Queues

```python
import heapq

# Min-heap (default)
heap = []
heapq.heappush(heap, 3)
heapq.heappush(heap, 1)
heapq.heappush(heap, 2)
min_val = heapq.heappop(heap)  # 1

# Heapify existing list
heap = [3, 1, 2]
heapq.heapify(heap)  # [1, 3, 2]

# N smallest/largest
heapq.nsmallest(2, [3, 1, 2])  # [1, 2]
heapq.nlargest(2, [3, 1, 2])   # [3, 2]

# Max-heap: negate values
max_heap = []
heapq.heappush(max_heap, -3)
heapq.heappush(max_heap, -1)
max_val = -heapq.heappop(max_heap)  # 3
```

### Lambda Functions

```python
# Basic
f = lambda x: x * 2
f(5)  # 10

# Multiple arguments
f = lambda x, y: x + y
f(3, 4)  # 7

# With conditions
f = lambda x: x if x > 0 else 0

# Commonly used with map/filter/sorted
items = [(1, 'b'), (2, 'a'), (3, 'c')]
sorted(items, key=lambda x: x[1])  # Sort by second element
```

### Common Pitfalls

```python
# Mutable default arguments (DON'T DO THIS!)
def bad_function(lst=[]):
    lst.append(1)
    return lst
bad_function()  # [1]
bad_function()  # [1, 1] - UNEXPECTED!

# Solution: Use None as default
def good_function(lst=None):
    if lst is None:
        lst = []
    lst.append(1)
    return lst

# Integer division
5 / 2   # 2.5 (float)
5 // 2  # 2 (integer)

# Comparing None
x = None
x is None      # True (correct)
x == None      # Also works but less Pythonic

# List copy
lst1 = [1, 2, 3]
lst2 = lst1  # Reference, not copy
lst2.append(4)  # lst1 is also modified!

lst3 = lst1.copy()  # Shallow copy
lst4 = lst1[:]      # Shallow copy
lst5 = copy.deepcopy(lst1)  # Deep copy

# Set vs tuple
{1, 2, 3}   # Set, unordered
(1, 2, 3)   # Tuple, ordered

# String is immutable
s = "hello"
s[0] = 'H'  # TypeError!
s = 'H' + s[1:]  # Correct way
```

---

## TypeScript/JavaScript Quick Reference

### Essential Syntax

```typescript
// Variables
let x = 10;           // Block-scoped, mutable
const y = 20;         // Block-scoped, immutable
var z = 30;           // Function-scoped (avoid)

// Types (TypeScript)
let num: number = 10;
let str: string = "hello";
let bool: boolean = true;
let arr: number[] = [1, 2, 3];
let arr2: Array<number> = [1, 2, 3];

// Functions
function add(a: number, b: number): number {
    return a + b;
}

const multiply = (a: number, b: number): number => {
    return a * b;
};

// Conditionals
if (condition) {
    // ...
} else if (other) {
    // ...
} else {
    // ...
}

// Loops
for (let i = 0; i < 10; i++) {
    // ...
}

for (const item of array) {
    // ...
}

array.forEach((item, index) => {
    // ...
});

while (condition) {
    // ...
}
```

### Arrays and Methods

```typescript
const arr = [1, 2, 3, 4, 5];

// Basic operations - O(1) or O(n)
arr.length                      // 5
arr[0]                          // 1
arr.at(-1)                      // 5 (last element)
arr.slice(1, 3)                 // [2, 3] - creates new array
arr.splice(1, 2, 10, 20)        // Modifies: [1, 10, 20, 4, 5]
arr.push(6)                     // Add to end: [1, 2, 3, 4, 5, 6]
arr.pop()                       // Remove from end: 6
arr.unshift(0)                  // Add to start: [0, 1, 2, 3, 4, 5]
arr.shift()                     // Remove from start: 0

// Search - O(n)
arr.indexOf(3)                  // 2
arr.includes(3)                 // true
arr.find(x => x > 3)            // 4

// Transform - O(n)
arr.map(x => x * 2)             // [2, 4, 6, 8, 10]
arr.filter(x => x > 2)          // [3, 4, 5]
arr.reduce((sum, x) => sum + x) // 15

// Sort - O(n log n)
arr.sort()                      // Modifies array
arr.sort((a, b) => b - a)       // Descending

// Other
arr.reverse()                   // Modifies array
arr.join(',')                   // "1,2,3,4,5"
arr.concat([6, 7])              // [1, 2, 3, 4, 5, 6, 7]
```

### Objects and Maps

```typescript
// Objects
const obj = {
    name: "John",
    age: 30,
    city: "NYC"
};

obj.name                        // "John"
obj["age"]                      // 30
Object.keys(obj)                // ["name", "age", "city"]
Object.values(obj)              // ["John", 30, "NYC"]
Object.entries(obj)             // [["name", "John"], ["age", 30], ...]

// Map - O(1) operations
const map = new Map();
map.set("key1", "value1")       // Add
map.get("key1")                 // "value1"
map.has("key1")                 // true
map.delete("key1")              // Remove
map.size                        // Number of entries
map.clear()                     // Remove all

for (const [key, value] of map) {
    // Iterate
}

// WeakMap (for objects as keys, memory-efficient)
const weakMap = new WeakMap();
```

### Sets

```typescript
const set = new Set();
set.add(1)                      // {1}
set.add(2)                      // {1, 2}
set.has(1)                      // true
set.delete(1)                   // Removes 1
set.size                        // Number of elements
set.clear()                     // Remove all

// Set from array
const set2 = new Set([1, 2, 3, 1])  // {1, 2, 3}

// Unique elements from array
const unique = [...new Set(array)]

// Set operations
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);

// Union
const union = new Set([...a, ...b])  // {1, 2, 3, 4}

// Intersection
const intersection = new Set([...a].filter(x => b.has(x)))  // {2, 3}

// Difference
const diff = new Set([...a].filter(x => !b.has(x)))  // {1}
```

### String Operations

```typescript
const s = "hello";

// Properties and methods
s.length                        // 5
s.charAt(0)                     // "h"
s.charCodeAt(0)                 // 104
s.toUpperCase()                 // "HELLO"
s.toLowerCase()                 // "hello"
s.trim()                        // Remove whitespace
s.split(',')                    // Split by delimiter
s.substring(1, 4)               // "ell"
s.slice(1, 4)                   // "ell"
s.slice(-3)                     // "llo"
s.indexOf('l')                  // 2
s.includes('ell')               // true
s.startsWith('he')              // true
s.endsWith('lo')                // true
s.repeat(2)                     // "hellohello"
s.replace('l', 'L')             // "heLlo" (first only)
s.replaceAll('l', 'L')          // "heLLo"
s.padStart(8, '*')              // "***hello"
s.padEnd(8, '*')                // "hello***"

// Template literals
const name = "John";
const age = 30;
`Hello ${name}, you are ${age} years old`  // String interpolation
```

### Arrow Functions

```typescript
// No parameters
const greet = () => "Hello";

// One parameter (parentheses optional)
const double = x => x * 2;
const double2 = (x) => x * 2;

// Multiple parameters
const add = (a, b) => a + b;

// Multiple statements
const calculate = (x) => {
    const result = x * 2;
    return result + 1;
};
```

### Destructuring

```typescript
// Array destructuring
const [a, b] = [1, 2];         // a = 1, b = 2
const [x, , z] = [1, 2, 3];    // Skip middle: x = 1, z = 3
const [first, ...rest] = [1, 2, 3];  // first = 1, rest = [2, 3]

// Object destructuring
const { name, age } = { name: "John", age: 30 };
const { name: n, age: a } = { name: "John", age: 30 };  // Rename

// Nested destructuring
const { user: { name, email } } = obj;

// Function parameters
const printUser = ({ name, age }) => {
    console.log(`${name} is ${age}`);
};
```

### Spread Operator

```typescript
// Array spreading
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];  // [1, 2, 3, 4, 5, 6]

// Object spreading
const obj1 = { a: 1, b: 2 };
const obj2 = { b: 3, c: 4 };
const merged = { ...obj1, ...obj2 };  // { a: 1, b: 3, c: 4 }

// Function arguments
const numbers = [1, 2, 3];
Math.max(...numbers);  // 3

// Rest parameters
const sum = (...args) => args.reduce((a, b) => a + b, 0);
sum(1, 2, 3, 4);  // 10
```

### TypeScript Types and Interfaces

```typescript
// Basic types
let num: number = 10;
let str: string = "hello";
let bool: boolean = true;
let any_type: any = "anything";  // Avoid
let unknown_type: unknown = "anything";  // Better than any

// Union types
let id: string | number;
id = 123;      // OK
id = "abc";    // OK

// Type aliases
type Point = {
    x: number;
    y: number;
};

// Interfaces
interface User {
    name: string;
    age: number;
    email?: string;  // Optional
    readonly id: number;  // Readonly
}

// Extending interfaces
interface Admin extends User {
    role: string;
}

// Generics
function identity<T>(arg: T): T {
    return arg;
}

const result = identity<string>("hello");

interface Box<T> {
    contents: T;
}

// Enums
enum Color {
    Red = 0,
    Green = 1,
    Blue = 2
}

const color: Color = Color.Red;
```

### Common Pitfalls

```typescript
// Type coercion (unexpected behavior)
"5" + 3           // "53" (string concatenation)
"5" - 3           // 2 (numeric subtraction)
"5" == 5          // true (loose equality)
"5" === 5         // false (strict equality) - USE THIS!

// Null and undefined
let x = null;     // Intentional absence
let y = undefined;  // Uninitialized
x == y            // true
x === y           // false

// this binding
const obj = {
    name: "John",
    greet: function() {
        console.log(this.name);  // "John"
    },
    greetArrow: () => {
        console.log(this);  // Global object, not obj!
    }
};

// Async/await errors
async function getData() {
    return await fetch(url);  // Returns Promise
}

// NaN checks
NaN === NaN       // false!
Number.isNaN(NaN) // true - CORRECT WAY
isNaN("hello")    // true (coerces first)

// Array mutation vs immutability
const arr = [1, 2, 3];
arr.push(4);      // Mutates
const arr2 = [...arr, 5];  // Creates new array
```

---

## Time & Space Complexity Cheat Sheet

### Big O Notation Explained

Big O describes how an algorithm's runtime or space scales with input size `n`.

**Rule of thumb**: Keep the highest order term, drop constants.
- `3n + 2` → `O(n)`
- `n²/2 + 5n` → `O(n²)`
- `2^n + n²` → `O(2^n)`

### Complexity Rankings (Fastest to Slowest)

```
O(1)        ← Constant time (best)
O(log n)    ← Logarithmic (excellent)
O(n)        ← Linear (good)
O(n log n)  ← Linearithmic (common for good algorithms)
O(n²)       ← Quadratic (acceptable for small inputs)
O(n³)       ← Cubic (slow)
O(2^n)      ← Exponential (very slow)
O(n!)       ← Factorial (extremely slow)
```

### Common Operations & Complexities

| Operation | Time | Space | Notes |
|-----------|------|-------|-------|
| **Array/List Access** | O(1) | - | Direct index access |
| Array/List Search | O(n) | - | Linear search |
| Array/List Insert (middle) | O(n) | O(1) | Requires shifting |
| Array/List Append | O(1)* | O(1) | *Amortized for dynamic arrays |
| Array/List Delete (middle) | O(n) | O(1) | Requires shifting |
| **Hash Map/Dict Operations** | O(1)* | O(n) | *Average case |
| Hash Map/Dict Collisions | O(n) | - | Worst case, very rare |
| **Set Operations** | O(1)* | O(n) | *Average case |
| **Binary Search** | O(log n) | O(1) | Requires sorted array |
| **Sorting** | O(n log n) | O(n) | Most efficient general-purpose |
| **Bubble Sort** | O(n²) | O(1) | Only for learning |
| **BFS** | O(V + E) | O(V) | V=vertices, E=edges |
| **DFS** | O(V + E) | O(V) | Recursive (stack space) |
| **Dijkstra** | O((V + E) log V) | O(V) | With binary heap |
| **Hash Table Lookup** | O(1) | O(n) | Average case |
| **String Comparison** | O(min(n, m)) | O(1) | n, m = string lengths |

### How to Analyze Code Complexity

**Time Complexity Analysis:**

```python
# O(1) - Constant
x = 5
y = x + 1

# O(n) - Linear
for i in range(n):
    print(i)

# O(n²) - Quadratic
for i in range(n):
    for j in range(n):
        print(i, j)

# O(n³) - Cubic
for i in range(n):
    for j in range(n):
        for k in range(n):
            print(i, j, k)

# O(log n) - Logarithmic (binary search)
while left < right:
    mid = (left + right) // 2
    if target < arr[mid]:
        right = mid
    else:
        left = mid + 1

# O(n log n) - Linearithmic (efficient sorting)
arr.sort()  # Most languages use O(n log n) algorithms

# O(2^n) - Exponential (recursive fibonacci without memoization)
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)  # AVOID!
```

**Space Complexity Analysis:**

```python
# O(1) - Constant space
def sum_array(arr):
    total = 0
    for num in arr:
        total += num
    return total

# O(n) - Linear space
def create_array(n):
    new_arr = [0] * n  # Creating array of size n
    return new_arr

def recursion_depth(n):
    if n == 0:
        return 1
    return recursion_depth(n - 1) + 1  # Call stack depth is O(n)

# O(n²) - Quadratic space
def create_matrix(n):
    matrix = [[0] * n for _ in range(n)]  # n × n matrix
    return matrix

# O(log n) - Logarithmic space (binary search recursion)
def binary_search(arr, target, left, right):
    if left > right:
        return -1
    mid = (left + right) // 2
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        return binary_search(arr, target, mid + 1, right)
    else:
        return binary_search(arr, target, left, mid - 1)
```

---

## Data Structure Quick Reference

### Array/List

**Time Complexity:**
- Access: O(1)
- Search: O(n)
- Insert: O(n)
- Delete: O(n)

**When to use:**
- Ordered data access
- Known size or can grow dynamically
- Need fast random access

**Key operations:**
```python
arr = [1, 2, 3]
arr.append(4)       # O(1) amortized
arr.insert(0, 0)    # O(n)
arr.pop()           # O(1)
arr.pop(0)          # O(n)
arr[index]          # O(1)
```

### Hash Map/Dictionary

**Time Complexity:**
- Access: O(1) average
- Search: O(1) average
- Insert: O(1) average
- Delete: O(1) average

**When to use:**
- Fast lookups by key
- Caching/memoization
- Counting occurrences
- Store key-value relationships

**Key operations:**
```python
d = {}
d[key] = value      # O(1)
d.get(key)          # O(1)
key in d            # O(1)
del d[key]          # O(1)
```

### Set

**Time Complexity:**
- Insert: O(1) average
- Delete: O(1) average
- Search: O(1) average

**When to use:**
- Unique elements only
- Fast membership testing
- Remove duplicates
- Set operations (union, intersection)

**Key operations:**
```python
s = set()
s.add(1)            # O(1)
s.remove(1)         # O(1)
1 in s              # O(1)
s.union(other)      # O(n + m)
s.intersection(other)  # O(min(n, m))
```

### Stack

**Time Complexity:**
- Push: O(1)
- Pop: O(1)
- Peek: O(1)

**Use case:** LIFO (Last-In-First-Out)

**When to use:**
- Function call stack
- Undo/Redo functionality
- Expression evaluation
- Backtracking problems
- DFS (implicit)

**Implementation:**
```python
from collections import deque

stack = deque()
stack.append(1)     # Push: O(1)
stack.pop()         # Pop: O(1)
stack[-1]           # Peek: O(1)
```

### Queue

**Time Complexity:**
- Enqueue: O(1)
- Dequeue: O(1)
- Peek: O(1)

**Use case:** FIFO (First-In-First-Out)

**When to use:**
- Level-order traversal (BFS)
- Task scheduling
- Buffer/Stream processing
- Message queues

**Implementation:**
```python
from collections import deque

queue = deque()
queue.append(1)     # Enqueue: O(1)
queue.popleft()     # Dequeue: O(1)
queue[0]            # Peek: O(1)
```

### Heap/Priority Queue

**Time Complexity:**
- Insert: O(log n)
- Delete min/max: O(log n)
- Peek min/max: O(1)
- Heapify: O(n)

**Use case:** Min-heap or max-heap ordering

**When to use:**
- Find k largest/smallest elements
- Dijkstra's algorithm
- Huffman coding
- Priority queue implementation

**Implementation:**
```python
import heapq

heap = []
heapq.heappush(heap, 1)     # Insert: O(log n)
heapq.heappop(heap)         # Delete min: O(log n)
heap[0]                     # Peek min: O(1)

# Max-heap (negate values)
heapq.heappush(max_heap, -1)
-heapq.heappop(max_heap)
```

### Tree

**Time Complexity (Binary Search Tree):**
- Search: O(log n) average, O(n) worst
- Insert: O(log n) average, O(n) worst
- Delete: O(log n) average, O(n) worst

**Variants:**
- **Binary Search Tree (BST)**: Left < Root < Right
- **Balanced BST (AVL, Red-Black)**: O(log n) guaranteed
- **Binary Heap**: Heap property for priority queue
- **Trie**: Prefix tree for string problems

**When to use:**
- Hierarchical data
- Sorted/searchable data
- Autocomplete (Trie)
- Expression parsing
- Interval scheduling

**Tree traversals:**
```python
# In-order: Left, Root, Right (sorted for BST)
# Pre-order: Root, Left, Right (copy tree)
# Post-order: Left, Right, Root (delete tree)
# Level-order: BFS (by level)
```

### Graph

**Time Complexity:**
- BFS: O(V + E)
- DFS: O(V + E)
- Dijkstra: O((V + E) log V)
- Floyd-Warshall: O(V³)

**Representations:**
- Adjacency List: O(V + E) space, efficient for sparse graphs
- Adjacency Matrix: O(V²) space, efficient for dense graphs
- Edge List: O(E) space

**When to use:**
- Network/social graph problems
- Path finding
- Cycle detection
- Topological sorting
- Strongly connected components

**Key algorithms:**
- BFS: Shortest path in unweighted graph
- DFS: Topological sort, cycle detection
- Dijkstra: Shortest path with weights
- Union-Find: Connected components

---

## Common Algorithms Cheat Sheet

### Sorting Algorithms

| Algorithm | Time (Avg) | Time (Worst) | Space | Stable | When to use |
|-----------|-----------|------------|-------|--------|------------|
| **Merge Sort** | O(n log n) | O(n log n) | O(n) | Yes | Always safe choice |
| **Quick Sort** | O(n log n) | O(n²) | O(log n) | No* | Most efficient in practice |
| **Heap Sort** | O(n log n) | O(n log n) | O(1) | No | Guaranteed O(n log n) |
| **Insertion Sort** | O(n²) | O(n²) | O(1) | Yes | Small datasets, nearly sorted |
| **Bubble Sort** | O(n²) | O(n²) | O(1) | Yes | Educational only |
| **Counting Sort** | O(n + k) | O(n + k) | O(k) | Yes | Small integer range |
| **Radix Sort** | O(nk) | O(nk) | O(n + k) | Yes | Multiple digits/strings |

*Quick sort can be made stable with additional space

### Binary Search

```python
def binary_search(arr, target):
    """Returns index if found, -1 otherwise"""
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1  # Not found

# Variants
# Find leftmost: return left when exiting
# Find rightmost: return right when exiting
# Find insertion point: return left
```

**Time Complexity:** O(log n)
**Space Complexity:** O(1) iterative, O(log n) recursive
**Requirement:** Array must be sorted

### BFS and DFS Templates

**BFS (Breadth-First Search):**
```python
from collections import deque

def bfs(root):
    """Level-order traversal"""
    if not root:
        return []

    queue = deque([root])
    result = []

    while queue:
        node = queue.popleft()
        result.append(node.val)

        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)

    return result

# Graph BFS
def bfs_graph(start, graph):
    visited = set()
    queue = deque([start])
    visited.add(start)

    while queue:
        node = queue.popleft()
        print(node)

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
```

**DFS (Depth-First Search):**
```python
def dfs_recursive(node):
    """Recursive DFS"""
    if not node:
        return

    print(node.val)
    if node.left:
        dfs_recursive(node.left)
    if node.right:
        dfs_recursive(node.right)

def dfs_iterative(root):
    """Iterative DFS with stack"""
    if not root:
        return

    stack = [root]

    while stack:
        node = stack.pop()
        print(node.val)

        if node.right:
            stack.append(node.right)
        if node.left:
            stack.append(node.left)

# Graph DFS
def dfs_graph(node, graph, visited=None):
    if visited is None:
        visited = set()

    visited.add(node)
    print(node)

    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs_graph(neighbor, graph, visited)
```

**Time Complexity:** O(V + E) where V=vertices, E=edges
**Space Complexity:** O(V) for queue/stack and visited set

### Dynamic Programming Approach

**Steps:**
1. **Define subproblems:** Identify state/parameters
2. **Express recurrence:** How to compute from smaller problems
3. **Identify base cases:** Simple cases with known answers
4. **Compute result:** Bottom-up or top-down with memoization

**Example: Fibonacci**
```python
# Recursive (exponential, AVOID)
def fib(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)  # O(2^n) - TERRIBLE!

# Top-down (memoization)
def fib(n, memo=None):
    if memo is None:
        memo = {}
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]

# Bottom-up (tabulation)
def fib(n):
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]

# Space-optimized
def fib(n):
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
```

**Example: Climbing Stairs**
```python
# Problem: Climb n stairs, each step 1 or 2 stairs
# dp[i] = number of ways to reach stair i

def climbStairs(n):
    if n <= 2:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1  # 1 way to reach stair 1
    dp[2] = 2  # 2 ways to reach stair 2
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]
```

**Common DP Patterns:**
- **Linear DP:** Single dimension, iterate through values
- **2D DP:** Two parameters, often for string/array problems
- **Knapsack:** Select items to maximize value within capacity
- **Coin Change:** Minimum coins to make amount
- **Longest Subsequence:** LCS, LIS problems
- **Tree DP:** Problems on tree structures

### Bit Manipulation Tricks

```python
# Get bit at position i
bit = (num >> i) & 1

# Set bit at position i
num |= (1 << i)

# Clear bit at position i
num &= ~(1 << i)

# Toggle bit at position i
num ^= (1 << i)

# Check if power of 2
num > 0 and (num & (num - 1)) == 0

# Get lowest set bit
lowest = num & (-num)

# Clear lowest set bit
num &= (num - 1)

# Count set bits
bin(num).count('1')

# Multiply by 2^k
num << k

# Divide by 2^k (integer division)
num >> k

# Check if odd
num & 1 == 1

# Single number (appears once, others twice)
result = 0
for num in nums:
    result ^= num
```

### Pattern Matching & String Algorithms

**KMP (Knuth-Morris-Pratt):**
```python
def kmp_search(text, pattern):
    """Find pattern in text - O(n + m)"""
    # Build failure function
    m = len(pattern)
    failure = [0] * m
    j = 0
    for i in range(1, m):
        while j > 0 and pattern[i] != pattern[j]:
            j = failure[j - 1]
        if pattern[i] == pattern[j]:
            j += 1
        failure[i] = j

    # Search
    j = 0
    for i in range(len(text)):
        while j > 0 and text[i] != pattern[j]:
            j = failure[j - 1]
        if text[i] == pattern[j]:
            j += 1
        if j == m:
            return i - m + 1  # Found
    return -1  # Not found
```

---

## Quick Interview Tips

1. **Always clarify constraints** before coding
2. **Start with brute force**, optimize later
3. **Consider edge cases:** Empty input, single element, duplicates
4. **Practice space-time tradeoffs** - often can optimize one at expense of other
5. **Use correct data structures** - biggest impact on complexity
6. **Test your code** - walk through examples, especially edge cases
7. **Explain your approach** - interviewer wants to see thought process
8. **Optimize gradually** - don't over-engineer initially
9. **Know your language** - library functions, syntax, idiomatic patterns
10. **Time yourself** - similar time pressure as real interviews

---

**Last updated:** 2025-11-15
