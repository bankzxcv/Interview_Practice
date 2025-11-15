# TypeScript/JavaScript Cheatsheet - Quick Reference

Comprehensive guide for TypeScript and JavaScript in technical interviews and software engineering.

---

## Table of Contents

1. [Essential Syntax](#essential-syntax)
2. [Arrays and Methods](#arrays-and-methods)
3. [Objects and Maps](#objects-and-maps)
4. [Sets](#sets)
5. [String Operations](#string-operations)
6. [Arrow Functions](#arrow-functions)
7. [Destructuring](#destructuring)
8. [Spread Operator](#spread-operator)
9. [TypeScript Types and Interfaces](#typescript-types-and-interfaces)
10. [Async/Await & Promises](#asyncawait--promises)
11. [Common Pitfalls](#common-pitfalls)

---

## Essential Syntax

```typescript
// Variables
let x = 10;           // Block-scoped, mutable
const y = 20;         // Block-scoped, immutable reference
var z = 30;           // Function-scoped (avoid - legacy)

// Types (TypeScript)
let num: number = 10;
let str: string = "hello";
let bool: boolean = true;
let arr: number[] = [1, 2, 3];
let arr2: Array<number> = [1, 2, 3];
let tuple: [string, number] = ["hello", 42];

// Functions
function add(a: number, b: number): number {
    return a + b;
}

const multiply = (a: number, b: number): number => {
    return a * b;
};

// Short arrow function
const double = (x: number): number => x * 2;

// Conditionals
if (condition) {
    // ...
} else if (other) {
    // ...
} else {
    // ...
}

// Ternary
const result = condition ? valueIfTrue : valueIfFalse;

// Switch
switch (value) {
    case 1:
        break;
    case 2:
        break;
    default:
        break;
}

// Loops
for (let i = 0; i < 10; i++) {
    // ...
}

for (const item of array) {
    // Iterate over values
}

for (const key in object) {
    // Iterate over keys (use with caution)
}

array.forEach((item, index) => {
    // Functional iteration
});

while (condition) {
    // ...
}

do {
    // ...
} while (condition);
```

---

## Arrays and Methods

```typescript
const arr = [1, 2, 3, 4, 5];

// Access & Basic Operations
arr.length                      // 5
arr[0]                          // 1 (first element)
arr[arr.length - 1]             // 5 (last element)
arr.at(-1)                      // 5 (last element, ES2022)
arr.at(-2)                      // 4 (second to last)

// Add/Remove Elements
arr.push(6)                     // Add to end → [1, 2, 3, 4, 5, 6]
arr.pop()                       // Remove from end → 6
arr.unshift(0)                  // Add to start → [0, 1, 2, 3, 4, 5]
arr.shift()                     // Remove from start → 0

// Slice & Splice
arr.slice(1, 3)                 // [2, 3] - creates new array, doesn't modify
arr.slice(-2)                   // [4, 5] - last 2 elements
arr.splice(1, 2)                // Removes [2, 3], modifies original
arr.splice(1, 0, 10, 20)        // Insert without removing
arr.splice(1, 2, 10, 20)        // Replace 2 elements with 10, 20

// Search - O(n)
arr.indexOf(3)                  // 2 (first index)
arr.lastIndexOf(3)              // Last index
arr.includes(3)                 // true
arr.find(x => x > 3)            // 4 (first match)
arr.findIndex(x => x > 3)       // 3 (index of first match)
arr.findLast(x => x > 3)        // 5 (last match, ES2023)
arr.some(x => x > 3)            // true (any match)
arr.every(x => x > 0)           // true (all match)

// Transform - O(n)
arr.map(x => x * 2)             // [2, 4, 6, 8, 10] - create new array
arr.filter(x => x > 2)          // [3, 4, 5] - create new array
arr.reduce((sum, x) => sum + x, 0)  // 15 - single value
arr.reduce((acc, x) => acc + x)     // 15 - no initial value
arr.reduceRight((acc, x) => acc - x)  // Right to left

// Flat & FlatMap
[1, [2, 3], [4, [5]]].flat()        // [1, 2, 3, 4, [5]]
[1, [2, 3], [4, [5]]].flat(2)       // [1, 2, 3, 4, 5]
[1, 2, 3].flatMap(x => [x, x * 2])  // [1, 2, 2, 4, 3, 6]

// Sort - O(n log n)
arr.sort()                      // Sorts in place (converts to strings!)
arr.sort((a, b) => a - b)       // Ascending numbers
arr.sort((a, b) => b - a)       // Descending numbers
arr.toSorted((a, b) => a - b)   // Creates new sorted array (ES2023)

// Other Methods
arr.reverse()                   // Reverses in place
arr.toReversed()                // Creates new reversed array (ES2023)
arr.join(',')                   // "1,2,3,4,5" - convert to string
arr.concat([6, 7])              // [1, 2, 3, 4, 5, 6, 7] - merge arrays
arr.fill(0)                     // Fill all with 0
arr.fill(0, 2, 4)               // Fill index 2-3 with 0
arr.copyWithin(0, 3)            // Copy elements within array

// Static Methods
Array.from('hello')             // ['h', 'e', 'l', 'l', 'o']
Array.from({length: 5}, (_, i) => i)  // [0, 1, 2, 3, 4]
Array.of(1, 2, 3)               // [1, 2, 3]
Array.isArray([])               // true
```

### Visual: Array Operations

```
Original:  [1, 2, 3, 4, 5]

push(6):   [1, 2, 3, 4, 5, 6]
                          ↑ Added here

pop():     [1, 2, 3, 4]
                       ↑ Removed from here

unshift(0):[0, 1, 2, 3, 4, 5]
           ↑ Added here

shift():   [2, 3, 4, 5]
           ↑ Removed from here

slice(1,3):[2, 3]
           ↑---↑ Extracted (doesn't modify original)

splice(1,2):[1, 4, 5]
               ↑ Removed 2,3 (modifies original)
```

---

## Objects and Maps

### Objects

```typescript
// Object creation
const obj = {
    name: "John",
    age: 30,
    city: "NYC"
};

// Access
obj.name                        // "John"
obj["age"]                      // 30
obj?.optionalProp               // Optional chaining (undefined if obj is null)
obj.nested?.deep?.prop          // Safe navigation

// Modify
obj.name = "Jane"               // Update
obj.country = "USA"             // Add new property
delete obj.city                 // Remove property

// Check existence
"name" in obj                   // true
obj.hasOwnProperty("name")      // true

// Object methods
Object.keys(obj)                // ["name", "age", "city"]
Object.values(obj)              // ["John", 30, "NYC"]
Object.entries(obj)             // [["name", "John"], ["age", 30], ...]
Object.fromEntries([["a", 1]])  // {a: 1}

// Copy/Merge
Object.assign({}, obj)          // Shallow copy
Object.assign(obj1, obj2)       // Merge obj2 into obj1
{...obj}                        // Shallow copy (spread)
{...obj1, ...obj2}              // Merge (obj2 overwrites)

// Property descriptors
Object.defineProperty(obj, 'prop', {
    value: 42,
    writable: false,
    enumerable: true,
    configurable: true
});

// Freeze/Seal
Object.freeze(obj)              // Immutable (shallow)
Object.seal(obj)                // Can't add/remove, can modify
Object.preventExtensions(obj)   // Can't add new properties

// Iteration
for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
        console.log(key, obj[key]);
    }
}

for (const [key, value] of Object.entries(obj)) {
    console.log(key, value);
}

// Computed property names
const key = "dynamicKey";
const obj2 = {
    [key]: "value",
    [`${key}2`]: "value2"
};

// Property shorthand
const name = "John";
const age = 30;
const person = { name, age };  // {name: "John", age: 30}

// Method shorthand
const obj3 = {
    greet() {                   // Instead of greet: function()
        return "Hello";
    }
};
```

### Maps

```typescript
// Map - Better for frequent additions/deletions
const map = new Map();

// Basic operations - O(1)
map.set("key1", "value1")       // Add/Update
map.set("key2", "value2")
map.get("key1")                 // "value1"
map.has("key1")                 // true
map.delete("key1")              // Remove
map.size                        // Number of entries
map.clear()                     // Remove all

// Any type as key
map.set(obj, "object key")
map.set(123, "number key")
map.set(true, "boolean key")

// Iteration
for (const [key, value] of map) {
    console.log(key, value);
}

map.forEach((value, key) => {
    console.log(key, value);
});

// Get keys, values, entries
Array.from(map.keys())          // All keys
Array.from(map.values())        // All values
Array.from(map.entries())       // All [key, value] pairs

// Convert between Map and Object
const obj4 = Object.fromEntries(map);
const map2 = new Map(Object.entries(obj4));

// WeakMap - Keys must be objects, no iteration
const weakMap = new WeakMap();
weakMap.set(objKey, "value");   // objKey will be garbage collected when not used
```

### Visual: Object vs Map

```
OBJECT:
{
  "key1": "value1",
  "key2": "value2"
}
✓ String/Symbol keys only
✓ Prototype chain
✓ JSON serializable
✗ No size property
✗ Not iterable by default

MAP:
Map {
  "key1" => "value1",
  obj => "value2",
  123 => "value3"
}
✓ Any type as key
✓ Size property
✓ Iterable
✓ Better performance for frequent add/delete
✗ Not JSON serializable
✗ No prototype
```

---

## Sets

```typescript
// Set - Collection of unique values
const set = new Set();

// Basic operations - O(1)
set.add(1)                      // {1}
set.add(2)                      // {1, 2}
set.add(2)                      // {1, 2} - no duplicates
set.has(1)                      // true
set.delete(1)                   // Removes 1
set.size                        // Number of elements
set.clear()                     // Remove all

// Set from array
const set2 = new Set([1, 2, 3, 1, 2])  // {1, 2, 3}

// Remove duplicates from array
const unique = [...new Set(array)]
const unique2 = Array.from(new Set(array))

// Iteration
for (const value of set) {
    console.log(value);
}

set.forEach(value => {
    console.log(value);
});

// Get values
Array.from(set)                 // Convert to array
[...set]                        // Convert to array (spread)

// Set operations
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);

// Union
const union = new Set([...a, ...b])              // {1, 2, 3, 4}

// Intersection
const intersection = new Set([...a].filter(x => b.has(x)))  // {2, 3}

// Difference
const difference = new Set([...a].filter(x => !b.has(x)))   // {1}

// Symmetric difference
const symDiff = new Set([
    ...[...a].filter(x => !b.has(x)),
    ...[...b].filter(x => !a.has(x))
])  // {1, 4}

// Subset check
const isSubset = (subset, superset) =>
    [...subset].every(x => superset.has(x));

// WeakSet - Values must be objects
const weakSet = new WeakSet();
weakSet.add(obj);               // Only objects allowed
```

### Visual: Set Operations

```
Set A: {1, 2, 3}
Set B: {2, 3, 4}

UNION (A ∪ B):
{1, 2, 3, 4}
 ↑  ↑  ↑  ↑
 A  Both  B

INTERSECTION (A ∩ B):
{2, 3}
 ↑  ↑
 Both

DIFFERENCE (A - B):
{1}
 ↑
 A only

SYMMETRIC DIFFERENCE:
{1, 4}
 ↑  ↑
 A  B
```

---

## String Operations

```typescript
const s = "Hello World";

// Properties
s.length                        // 11

// Access
s.charAt(0)                     // "H"
s.charCodeAt(0)                 // 72 (ASCII/Unicode)
s[0]                            // "H" (array notation)
s.at(-1)                        // "d" (ES2022)

// Case
s.toUpperCase()                 // "HELLO WORLD"
s.toLowerCase()                 // "hello world"

// Trim
s.trim()                        // Remove whitespace from both ends
s.trimStart()                   // Remove from start
s.trimEnd()                     // Remove from end

// Search
s.indexOf('l')                  // 2 (first occurrence)
s.lastIndexOf('l')              // 9 (last occurrence)
s.includes('ell')               // true
s.startsWith('He')              // true
s.endsWith('ld')                // true
s.search(/[A-Z]/)               // 0 (regex search)

// Extract
s.substring(0, 5)               // "Hello" (end index exclusive)
s.substring(6)                  // "World" (from index to end)
s.slice(0, 5)                   // "Hello" (like substring)
s.slice(-5)                     // "World" (negative indices work)
s.slice(-5, -1)                 // "Worl"
s.substr(0, 5)                  // "Hello" (deprecated, use slice)

// Split & Join
s.split(' ')                    // ["Hello", "World"]
s.split('')                     // ['H', 'e', 'l', 'l', 'o', ...]
['Hello', 'World'].join(' ')    // "Hello World"

// Replace
s.replace('World', 'Universe')  // "Hello Universe" (first only)
s.replaceAll('l', 'L')          // "HeLLo WorLd" (all occurrences)
s.replace(/l/g, 'L')            // "HeLLo WorLd" (regex global)

// Repeat & Pad
s.repeat(2)                     // "Hello WorldHello World"
s.padStart(15, '*')             // "****Hello World"
s.padEnd(15, '*')               // "Hello World****"

// Match
s.match(/[A-Z]/g)               // ["H", "W"]
s.matchAll(/[A-Z]/g)            // Iterator of matches

// Other
'5'.concat('3')                 // "53"
'   '.length                    // 3
s.localeCompare('Hello')        // 0 (equal), >0, or <0

// Template literals
const name = "John";
const age = 30;
`Hello ${name}, you are ${age} years old`

// Multi-line
`Line 1
Line 2
Line 3`

// Tagged templates
function tag(strings, ...values) {
    return strings[0] + values[0] + strings[1];
}
tag`Hello ${name}!`

// Raw strings (preserve escapes)
String.raw`C:\new\path`         // "C:\\new\\path"
```

---

## Arrow Functions

```typescript
// No parameters
const greet = () => "Hello";

// One parameter (parentheses optional)
const double = x => x * 2;
const double2 = (x) => x * 2;

// Multiple parameters
const add = (a, b) => a + b;

// Multiple statements (need braces and return)
const calculate = (x) => {
    const result = x * 2;
    return result + 1;
};

// Returning object literal (wrap in parentheses)
const makePoint = (x, y) => ({ x, y });
const makePoint2 = (x, y) => {
    return { x, y };
};

// Async arrow function
const fetchData = async () => {
    const response = await fetch(url);
    return response.json();
};

// IIFE (Immediately Invoked Function Expression)
(() => {
    console.log("Executed immediately");
})();

// No 'this' binding (lexical this)
const obj = {
    value: 42,
    regular: function() {
        console.log(this.value);  // 42
    },
    arrow: () => {
        console.log(this.value);  // undefined (this from outer scope)
    }
};

// No 'arguments' object
const regular = function() {
    console.log(arguments);      // Works
};
const arrow = () => {
    console.log(arguments);      // ReferenceError
};

// Use rest parameters instead
const sum = (...args) => args.reduce((a, b) => a + b, 0);
```

---

## Destructuring

```typescript
// Array destructuring
const [a, b] = [1, 2];                  // a = 1, b = 2
const [x, , z] = [1, 2, 3];             // Skip middle: x = 1, z = 3
const [first, ...rest] = [1, 2, 3, 4];  // first = 1, rest = [2, 3, 4]

// Default values
const [a = 0, b = 0] = [1];             // a = 1, b = 0

// Swapping
[a, b] = [b, a];

// Object destructuring
const { name, age } = { name: "John", age: 30 };

// Rename
const { name: n, age: a } = { name: "John", age: 30 };

// Default values
const { name = "Anonymous", age = 0 } = {};

// Nested destructuring
const { user: { name, email } } = obj;
const { user: { address: { city } } } = obj;

// Rest in objects
const { name, ...otherProps } = { name: "John", age: 30, city: "NYC" };
// otherProps = { age: 30, city: "NYC" }

// Function parameters
const printUser = ({ name, age }) => {
    console.log(`${name} is ${age}`);
};
printUser({ name: "John", age: 30 });

// With defaults
const printUser2 = ({ name = "Anonymous", age = 0 } = {}) => {
    console.log(`${name} is ${age}`);
};

// Mixed destructuring
const { users: [firstUser, secondUser] } = data;
```

---

## Spread Operator

```typescript
// Array spreading
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
const combined = [...arr1, ...arr2];    // [1, 2, 3, 4, 5, 6]
const withExtra = [0, ...arr1, 3.5, ...arr2];  // [0, 1, 2, 3, 3.5, 4, 5, 6]

// Array copy
const copy = [...arr1];                 // Shallow copy

// Object spreading
const obj1 = { a: 1, b: 2 };
const obj2 = { b: 3, c: 4 };
const merged = { ...obj1, ...obj2 };    // { a: 1, b: 3, c: 4 }

// Object copy
const copy2 = { ...obj1 };              // Shallow copy

// Override properties
const updated = { ...obj1, b: 99 };     // { a: 1, b: 99 }

// Conditional spreading
const conditionalObj = {
    a: 1,
    ...(condition && { b: 2 }),         // Only add if condition is true
    ...(condition ? { c: 3 } : {})
};

// Function arguments
const numbers = [1, 2, 3];
Math.max(...numbers);                   // 3
Math.min(...numbers);                   // 1

// Combine with other args
Math.max(0, ...numbers, 10);            // 10

// Rest parameters (collect arguments)
const sum = (...args) => args.reduce((a, b) => a + b, 0);
sum(1, 2, 3, 4);                        // 10

// With regular parameters
const multiply = (multiplier, ...numbers) => {
    return numbers.map(n => n * multiplier);
};
multiply(2, 1, 2, 3);                   // [2, 4, 6]

// String to array
const chars = [..."Hello"];             // ['H', 'e', 'l', 'l', 'o']

// Set to array
const arr3 = [...new Set([1, 2, 2, 3])];  // [1, 2, 3]
```

---

## TypeScript Types and Interfaces

```typescript
// Basic types
let num: number = 10;
let str: string = "hello";
let bool: boolean = true;
let any_type: any = "anything";         // Avoid when possible
let unknown_type: unknown = "anything"; // Safer than any
let never_type: never;                  // Function that never returns
let void_type: void;                    // Function returns nothing

// Arrays
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ["a", "b"];

// Tuples
let tuple: [string, number] = ["hello", 42];
let tuple2: [string, number, boolean?] = ["hello", 42];  // Optional element

// Union types
let id: string | number;
id = 123;                               // OK
id = "abc";                             // OK

// Intersection types
type A = { a: number };
type B = { b: string };
type C = A & B;                         // { a: number, b: string }

// Literal types
let direction: "up" | "down" | "left" | "right";
direction = "up";                       // OK
direction = "diagonal";                 // Error

// Type aliases
type Point = {
    x: number;
    y: number;
};

type ID = string | number;

// Interfaces
interface User {
    name: string;
    age: number;
    email?: string;                     // Optional
    readonly id: number;                // Readonly
}

// Extending interfaces
interface Admin extends User {
    role: string;
    permissions: string[];
}

// Interface merging (declaration merging)
interface Window {
    custom: string;
}
// Later...
interface Window {
    another: number;
}
// Both merge into one

// Generics
function identity<T>(arg: T): T {
    return arg;
}

const result = identity<string>("hello");
const result2 = identity(42);           // Type inferred

interface Box<T> {
    contents: T;
}

const box: Box<string> = { contents: "hello" };

// Generic constraints
function longest<T extends { length: number }>(a: T, b: T): T {
    return a.length > b.length ? a : b;
}

// Multiple type parameters
function pair<T, U>(first: T, second: U): [T, U] {
    return [first, second];
}

// Utility types
type Partial<T>                         // All properties optional
type Required<T>                        // All properties required
type Readonly<T>                        // All properties readonly
type Pick<T, K>                         // Subset of properties
type Omit<T, K>                         // Exclude properties
type Record<K, T>                       // Object type with keys K and values T
type Exclude<T, U>                      // Exclude U from T
type Extract<T, U>                      // Extract U from T
type NonNullable<T>                     // Exclude null and undefined
type ReturnType<T>                      // Return type of function
type Parameters<T>                      // Parameter types of function

// Examples
type PartialUser = Partial<User>;
type UserKeys = Pick<User, "name" | "email">;
type UserWithoutEmail = Omit<User, "email">;

// Enums
enum Color {
    Red,                                // 0
    Green,                              // 1
    Blue                                // 2
}

enum Color2 {
    Red = "#FF0000",
    Green = "#00FF00",
    Blue = "#0000FF"
}

const color: Color = Color.Red;

// Const enums (inlined at compile time)
const enum Direction {
    Up,
    Down,
    Left,
    Right
}

// Type guards
function isString(value: unknown): value is string {
    return typeof value === "string";
}

if (isString(value)) {
    // TypeScript knows value is string here
    value.toUpperCase();
}

// typeof type guards
if (typeof value === "string") {
    value.toUpperCase();
}

// instanceof type guards
if (value instanceof Date) {
    value.getTime();
}

// Discriminated unions
type Shape =
    | { kind: "circle"; radius: number }
    | { kind: "square"; size: number }
    | { kind: "rectangle"; width: number; height: number };

function area(shape: Shape): number {
    switch (shape.kind) {
        case "circle":
            return Math.PI * shape.radius ** 2;
        case "square":
            return shape.size ** 2;
        case "rectangle":
            return shape.width * shape.height;
    }
}

// Index signatures
interface StringMap {
    [key: string]: string;
}

interface NumberDict {
    [key: string]: number;
    length: number;                     // OK
    name: string;                       // Error: must be number
}

// Function types
type MathOp = (a: number, b: number) => number;
const add: MathOp = (a, b) => a + b;

interface Calculator {
    (a: number, b: number): number;     // Call signature
    description: string;                // Property
}
```

---

## Async/Await & Promises

```typescript
// Promise creation
const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve("Success!");
    }, 1000);
});

// Promise consumption
promise
    .then(result => console.log(result))
    .catch(error => console.error(error))
    .finally(() => console.log("Done"));

// Async/await
async function fetchData() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    } finally {
        console.log("Cleanup");
    }
}

// Parallel execution
async function fetchMultiple() {
    const [data1, data2, data3] = await Promise.all([
        fetch(url1).then(r => r.json()),
        fetch(url2).then(r => r.json()),
        fetch(url3).then(r => r.json())
    ]);
    return { data1, data2, data3 };
}

// Promise.all - Wait for all (fails if any fails)
await Promise.all([promise1, promise2, promise3]);

// Promise.allSettled - Wait for all (never fails)
const results = await Promise.allSettled([promise1, promise2, promise3]);
// results = [
//   { status: "fulfilled", value: ... },
//   { status: "rejected", reason: ... }
// ]

// Promise.race - First to complete
const winner = await Promise.race([promise1, promise2, promise3]);

// Promise.any - First to fulfill (ignore rejections)
const first = await Promise.any([promise1, promise2, promise3]);

// Error handling patterns
async function safeAsyncOp() {
    const [error, data] = await fetchData()
        .then(data => [null, data])
        .catch(error => [error, null]);

    if (error) {
        // Handle error
    }
    // Use data
}

// Top-level await (ES2022, in modules)
const data = await fetchData();

// Async iteration
async function* asyncGenerator() {
    yield await promise1;
    yield await promise2;
    yield await promise3;
}

for await (const value of asyncGenerator()) {
    console.log(value);
}
```

### Visual: Promise States

```
PROMISE LIFECYCLE:

Pending ──┬──> Fulfilled (resolved with value)
          │
          └──> Rejected (rejected with error)

Once settled (fulfilled or rejected), state cannot change.


ASYNC/AWAIT EXECUTION:

async function example() {
    console.log(1);           // Synchronous
    await promise;            // Pause here, wait for promise
    console.log(2);           // Resume after promise resolves
}

console.log(0);
example();
console.log(3);

Output: 0, 1, 3, 2
```

---

## Common Pitfalls

```typescript
// 1. Type coercion (unexpected behavior)
"5" + 3                         // "53" (string concatenation)
"5" - 3                         // 2 (numeric subtraction)
"5" * "2"                       // 10 (numeric multiplication)
"5" == 5                        // true (loose equality - AVOID)
"5" === 5                       // false (strict equality - USE THIS)
0 == false                      // true
0 === false                     // false
"" == false                     // true
"" === false                    // false

// 2. Null and undefined
let x = null;                   // Intentional absence
let y = undefined;              // Uninitialized
x == y                          // true (loose)
x === y                         // false (strict)
x == null                       // true
y == null                       // true (matches null and undefined)

// Nullish coalescing
const val = value ?? "default"; // Only if null/undefined
const val2 = value || "default"; // If any falsy value

// Optional chaining
obj?.property?.nested
arr?.[0]?.method?.()

// 3. this binding
const obj = {
    name: "John",
    greet: function() {
        console.log(this.name);  // "John"
    },
    greetArrow: () => {
        console.log(this.name);  // undefined (lexical this)
    },
    delayedGreet: function() {
        setTimeout(function() {
            console.log(this.name);  // undefined (this is window/global)
        }, 1000);

        setTimeout(() => {
            console.log(this.name);  // "John" (arrow function)
        }, 1000);
    }
};

// bind, call, apply
const boundGreet = obj.greet.bind(obj);
obj.greet.call(obj);
obj.greet.apply(obj, args);

// 4. Hoisting
console.log(x);                 // undefined (var is hoisted)
var x = 5;

console.log(y);                 // ReferenceError (let/const not hoisted)
let y = 5;

// Function hoisting
greet();                        // Works
function greet() { }

hello();                        // ReferenceError
const hello = () => { };

// 5. Array mutation vs immutability
const arr = [1, 2, 3];

// Mutates
arr.push(4);
arr.sort();
arr.reverse();
arr.splice(1, 1);

// Doesn't mutate (returns new array)
arr.concat([4, 5]);
arr.slice(1, 3);
arr.map(x => x * 2);
arr.filter(x => x > 2);
[...arr, 4, 5];

// 6. NaN checks
NaN === NaN                     // false!
NaN == NaN                      // false!
Number.isNaN(NaN)               // true - CORRECT WAY
isNaN("hello")                  // true (coerces to number first)
Number.isNaN("hello")           // false (doesn't coerce)

// 7. Floating point precision
0.1 + 0.2                       // 0.30000000000000004
0.1 + 0.2 === 0.3               // false

// Solution
Math.abs((0.1 + 0.2) - 0.3) < Number.EPSILON  // true

// 8. Truthy/Falsy
// Falsy: false, 0, -0, 0n, "", null, undefined, NaN
// Truthy: Everything else

if ([]) { }                     // true (empty array is truthy)
if ({}) { }                     // true (empty object is truthy)
if ("0") { }                    // true (string "0" is truthy)
if ("false") { }                // true (string "false" is truthy)

// 9. Array/Object comparison
[1, 2, 3] === [1, 2, 3]         // false (different references)
{a: 1} === {a: 1}               // false (different references)

// Deep equality (use library like lodash)
import { isEqual } from 'lodash';
isEqual([1, 2, 3], [1, 2, 3])   // true

// 10. setTimeout/setInterval with this
class MyClass {
    name = "MyClass";

    method() {
        setTimeout(function() {
            console.log(this.name);  // undefined
        }, 1000);

        setTimeout(() => {
            console.log(this.name);  // "MyClass"
        }, 1000);
    }
}

// 11. Async forEach (doesn't work as expected)
// WRONG
arr.forEach(async (item) => {
    await processItem(item);    // These run in parallel, not sequentially!
});

// CORRECT
for (const item of arr) {
    await processItem(item);    // Sequential
}

// Or parallel
await Promise.all(arr.map(item => processItem(item)));

// 12. parseInt without radix
parseInt("08")                  // 8
parseInt("08", 10)              // 8 (always specify radix)
parseInt("0x10")                // 16
parseInt("10", 2)               // 2 (binary)
```

---

**Last updated:** 2025-11-15
