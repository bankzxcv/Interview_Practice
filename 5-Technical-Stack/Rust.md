# Rust Cheatsheet - Quick Reference

Comprehensive Rust guide covering ownership, borrowing, lifetimes, and systems programming.

---

## Table of Contents

1. [Essential Syntax](#essential-syntax)
2. [Ownership & Borrowing](#ownership--borrowing)
3. [Data Types](#data-types)
4. [Collections](#collections)
5. [Structs & Enums](#structs--enums)
6. [Pattern Matching](#pattern-matching)
7. [Error Handling](#error-handling)
8. [Traits](#traits)
9. [Lifetimes](#lifetimes)
10. [Concurrency](#concurrency)
11. [Smart Pointers](#smart-pointers)

---

## Essential Syntax

```rust
// Variables
let x = 5;                      // Immutable by default
let mut y = 10;                 // Mutable
const MAX: u32 = 100_000;       // Constant (must be typed)

// Shadowing
let x = 5;
let x = x + 1;                  // Shadow previous x
let x = "hello";                // Can change type when shadowing

// Type annotation
let x: i32 = 5;
let y: f64 = 3.14;

// Functions
fn add(a: i32, b: i32) -> i32 {
    a + b                       // No semicolon = return value
}

fn no_return(x: i32) {
    println!("{}", x);          // Returns ()
}

// Conditionals
if x > 0 {
    println!("positive");
} else if x < 0 {
    println!("negative");
} else {
    println!("zero");
}

// If as expression
let number = if condition { 5 } else { 6 };

// Loops
loop {
    break;                      // Infinite loop
}

let result = loop {
    break 42;                   // Return value from loop
};

while condition {
    // ...
}

for i in 0..10 {                // Range (0 to 9)
    println!("{}", i);
}

for i in 0..=10 {               // Inclusive range (0 to 10)
    println!("{}", i);
}

for item in &collection {       // Iterate by reference
    println!("{}", item);
}

for (index, value) in collection.iter().enumerate() {
    println!("{}: {}", index, value);
}

// Match (pattern matching)
match value {
    1 => println!("one"),
    2 | 3 => println!("two or three"),
    4..=9 => println!("4 through 9"),
    _ => println!("something else"),
}

let result = match value {
    Some(x) => x,
    None => 0,
};

// Comments
// Single line comment
/* Multi-line
   comment */
/// Documentation comment
//! Module-level documentation
```

---

## Ownership & Borrowing

The most critical concept in Rust!

```rust
// OWNERSHIP RULES:
// 1. Each value has an owner
// 2. Only one owner at a time
// 3. When owner goes out of scope, value is dropped

// Move semantics (ownership transfer)
let s1 = String::from("hello");
let s2 = s1;                    // s1 moved to s2, s1 is invalid!
// println!("{}", s1);          // ERROR: s1 was moved

// Clone (deep copy)
let s1 = String::from("hello");
let s2 = s1.clone();            // Both s1 and s2 are valid
println!("{} {}", s1, s2);      // OK

// Copy trait (for stack-only data)
let x = 5;
let y = x;                      // x is copied, both valid
println!("{} {}", x, y);        // OK - integers implement Copy

// Types that implement Copy: integers, floats, bool, char, tuples of Copy types

// BORROWING (References)
// Immutable reference (&T)
let s1 = String::from("hello");
let len = calculate_length(&s1); // Borrow s1
println!("{}", s1);              // s1 still valid

fn calculate_length(s: &String) -> usize {
    s.len()                      // Can read, not modify
}

// Mutable reference (&mut T)
let mut s = String::from("hello");
change(&mut s);

fn change(s: &mut String) {
    s.push_str(", world");
}

// BORROWING RULES:
// 1. You can have either (not both):
//    - One mutable reference
//    - Any number of immutable references
// 2. References must always be valid (no dangling references)

// Valid: Multiple immutable references
let r1 = &s;
let r2 = &s;
println!("{} {}", r1, r2);

// Invalid: Mutable + immutable reference
let r1 = &s;
let r2 = &mut s;                // ERROR!

// Invalid: Multiple mutable references
let r1 = &mut s;
let r2 = &mut s;                // ERROR!

// Valid: Non-overlapping scopes
let r1 = &s;
println!("{}", r1);             // r1 last used here
let r2 = &mut s;                // OK - r1 no longer used

// Slices (reference to part of collection)
let s = String::from("hello world");
let hello = &s[0..5];           // "hello"
let world = &s[6..11];          // "world"
let hello = &s[..5];            // From start
let world = &s[6..];            // To end
let whole = &s[..];             // Entire string

// Array slices
let arr = [1, 2, 3, 4, 5];
let slice = &arr[1..3];         // [2, 3]
```

### Visual: Ownership & Borrowing

```
MOVE:
let s1 = String::from("hello");
┌────┬──────────┬─────────┐
│ptr │ len: 5   │ cap: 5  │ s1
└─┬──┴──────────┴─────────┘
  │
  └──→ [h][e][l][l][o]  (heap)

let s2 = s1;  // MOVE
┌────┬──────────┬─────────┐
│ptr │ len: 5   │ cap: 5  │ s2 (s1 invalid!)
└─┬──┴──────────┴─────────┘
  │
  └──→ [h][e][l][l][o]  (heap)


BORROWING:
let s1 = String::from("hello");
let r1 = &s1;  // Borrow

s1:  [ptr]──→ [h][e][l][l][o]  (heap)
      ↑
      │ borrow
r1:  [ptr]

Both s1 and r1 are valid!


BORROWING RULES:
┌───────────────────────────────────┐
│ At any time, you can have:       │
│                                   │
│ ONE mutable reference             │
│        OR                         │
│ ANY NUMBER of immutable refs      │
└───────────────────────────────────┘
```

---

## Data Types

```rust
// Scalar Types

// Integers
let i8_val: i8 = -128;          // -128 to 127
let i16_val: i16 = -32768;
let i32_val: i32 = -2147483648; // Default integer type
let i64_val: i64 = 0;
let i128_val: i128 = 0;
let isize_val: isize = 0;       // Pointer size (32 or 64 bit)

let u8_val: u8 = 255;           // 0 to 255
let u16_val: u16 = 65535;
let u32_val: u32 = 0;
let u64_val: u64 = 0;
let u128_val: u128 = 0;
let usize_val: usize = 0;       // Pointer size

// Integer literals
let decimal = 98_222;
let hex = 0xff;
let octal = 0o77;
let binary = 0b1111_0000;
let byte = b'A';                // u8 only

// Floating point
let f32_val: f32 = 3.14;
let f64_val: f64 = 2.71828;     // Default float type

// Boolean
let t = true;
let f: bool = false;

// Character (4 bytes, Unicode)
let c = 'z';
let emoji = '😊';
let chinese = '中';

// Compound Types

// Tuple
let tup: (i32, f64, u8) = (500, 6.4, 1);
let (x, y, z) = tup;            // Destructure
let five_hundred = tup.0;       // Access by index
let six_point_four = tup.1;

// Unit type (empty tuple)
let unit: () = ();

// Array (fixed size, stack allocated)
let arr: [i32; 5] = [1, 2, 3, 4, 5];
let arr = [3; 5];               // [3, 3, 3, 3, 3]
let first = arr[0];
let len = arr.len();

// Type conversion (explicit)
let x: i32 = 42;
let y: i64 = x as i64;
let z: f64 = x as f64;

// Option (nullable values)
let some_number: Option<i32> = Some(5);
let no_number: Option<i32> = None;

match some_number {
    Some(x) => println!("Value: {}", x),
    None => println!("No value"),
}

// Unwrap (panics if None)
let value = some_number.unwrap();

// unwrap_or (default value if None)
let value = no_number.unwrap_or(0);

// Result (error handling)
enum Result<T, E> {
    Ok(T),
    Err(E),
}

let result: Result<i32, &str> = Ok(42);
let error: Result<i32, &str> = Err("error");

// String vs &str
let s: String = String::from("hello");  // Heap-allocated, owned
let s: &str = "hello";                  // String slice, borrowed

// Convert between String and &str
let s: String = String::from("hello");
let slice: &str = &s;
let owned: String = slice.to_string();
```

---

## Collections

```rust
// Vector (dynamic array, heap allocated)
let mut vec: Vec<i32> = Vec::new();
let vec = vec![1, 2, 3];        // Macro

vec.push(4);                    // Add element
vec.pop();                      // Remove last
let third = &vec[2];            // Get by index (panics if out of bounds)
let third = vec.get(2);         // Returns Option<&T>

match vec.get(2) {
    Some(third) => println!("{}", third),
    None => println!("No element"),
}

// Iterate
for i in &vec {
    println!("{}", i);
}

for i in &mut vec {
    *i += 50;                   // Modify in place
}

// Common methods
vec.len()
vec.is_empty()
vec.contains(&value)
vec.clear()
vec.insert(index, value)
vec.remove(index)
vec.sort()
vec.reverse()
vec.iter()
vec.iter_mut()

// HashMap
use std::collections::HashMap;

let mut map = HashMap::new();
map.insert(String::from("Blue"), 10);
map.insert(String::from("Red"), 50);

let value = map.get("Blue");    // Option<&V>
let value = map.get("Blue").copied().unwrap_or(0);

// Iterate
for (key, value) in &map {
    println!("{}: {}", key, value);
}

// Update
map.insert(String::from("Blue"), 25);  // Overwrite

// Insert if not exists
map.entry(String::from("Yellow")).or_insert(50);

// Update based on old value
let count = map.entry(String::from("Blue")).or_insert(0);
*count += 1;

// HashSet
use std::collections::HashSet;

let mut set: HashSet<i32> = HashSet::new();
set.insert(1);
set.insert(2);

set.contains(&1);               // true
set.remove(&1);
set.len();

// Set operations
let set1: HashSet<_> = [1, 2, 3].iter().cloned().collect();
let set2: HashSet<_> = [2, 3, 4].iter().cloned().collect();

let union: HashSet<_> = set1.union(&set2).cloned().collect();
let intersection: HashSet<_> = set1.intersection(&set2).cloned().collect();
let difference: HashSet<_> = set1.difference(&set2).cloned().collect();

// VecDeque (double-ended queue)
use std::collections::VecDeque;

let mut deque = VecDeque::new();
deque.push_back(1);
deque.push_front(0);
deque.pop_back();
deque.pop_front();

// BTreeMap, BTreeSet (sorted)
use std::collections::{BTreeMap, BTreeSet};

let mut btree_map = BTreeMap::new();
btree_map.insert(3, "c");
btree_map.insert(1, "a");
btree_map.insert(2, "b");

for (key, value) in &btree_map {
    println!("{}: {}", key, value);  // Sorted by key
}
```

---

## Structs & Enums

```rust
// Struct
struct User {
    username: String,
    email: String,
    sign_in_count: u64,
    active: bool,
}

// Create instance
let mut user1 = User {
    email: String::from("user@example.com"),
    username: String::from("user123"),
    active: true,
    sign_in_count: 1,
};

// Access fields
user1.email = String::from("newemail@example.com");

// Struct update syntax
let user2 = User {
    email: String::from("another@example.com"),
    ..user1                     // Copy remaining fields from user1
};

// Tuple struct
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

let black = Color(0, 0, 0);
let origin = Point(0, 0, 0);

// Unit struct (no fields)
struct AlwaysEqual;
let subject = AlwaysEqual;

// Methods (impl block)
impl User {
    // Associated function (constructor)
    fn new(email: String, username: String) -> User {
        User {
            email,
            username,
            active: true,
            sign_in_count: 1,
        }
    }

    // Method (takes &self)
    fn is_active(&self) -> bool {
        self.active
    }

    // Mutable method
    fn deactivate(&mut self) {
        self.active = false;
    }

    // Takes ownership
    fn into_username(self) -> String {
        self.username
    }
}

// Usage
let user = User::new(
    String::from("user@example.com"),
    String::from("user123")
);

// Enums
enum IpAddr {
    V4(u8, u8, u8, u8),
    V6(String),
}

let home = IpAddr::V4(127, 0, 0, 1);
let loopback = IpAddr::V6(String::from("::1"));

// Enum with methods
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

impl Message {
    fn call(&self) {
        // Method body
    }
}

let m = Message::Write(String::from("hello"));
m.call();

// Option enum (built-in)
enum Option<T> {
    Some(T),
    None,
}

// Result enum (built-in)
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

---

## Pattern Matching

```rust
// Match
let number = 7;

match number {
    1 => println!("One!"),
    2 | 3 | 5 | 7 | 11 => println!("Prime"),
    13..=19 => println!("Teen"),
    _ => println!("Other"),
}

// Match with Option
fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

// if let (shorthand for match with one pattern)
let some_value = Some(3);

if let Some(3) = some_value {
    println!("three");
}

// while let
let mut stack = Vec::new();
stack.push(1);
stack.push(2);
stack.push(3);

while let Some(top) = stack.pop() {
    println!("{}", top);
}

// Destructuring
let (a, b, c) = (1, 2, 3);

let ((x, y), z) = ((1, 2), 3);

// Struct destructuring
struct Point {
    x: i32,
    y: i32,
}

let p = Point { x: 0, y: 7 };

let Point { x, y } = p;         // x = 0, y = 7

let Point { x: a, y: b } = p;   // Rename: a = 0, b = 7

// Match guards
let num = Some(4);

match num {
    Some(x) if x < 5 => println!("less than five: {}", x),
    Some(x) => println!("{}", x),
    None => (),
}

// @ bindings
match some_value {
    Some(x @ 1..=5) => println!("In range: {}", x),
    Some(x) => println!("Out of range: {}", x),
    None => println!("None"),
}

// Ignoring values
let (x, _, z) = (1, 2, 3);      // Ignore middle value

match some_value {
    Some(_) => println!("Got a value"),
    None => println!("Got nothing"),
}

// Rest pattern
let numbers = (2, 4, 8, 16, 32);
let (first, .., last) = numbers;  // first = 2, last = 32
```

---

## Error Handling

```rust
// Panic (unrecoverable error)
panic!("crash and burn");

// Result enum
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("division by zero"))
    } else {
        Ok(a / b)
    }
}

match divide(10.0, 2.0) {
    Ok(result) => println!("Result: {}", result),
    Err(e) => println!("Error: {}", e),
}

// ? operator (propagates error)
fn read_username() -> Result<String, io::Error> {
    let mut file = File::open("username.txt")?;  // Returns error if fails
    let mut username = String::new();
    file.read_to_string(&mut username)?;
    Ok(username)
}

// Chaining with ?
fn read_username_short() -> Result<String, io::Error> {
    let mut username = String::new();
    File::open("username.txt")?.read_to_string(&mut username)?;
    Ok(username)
}

// Even shorter
fn read_username_shortest() -> Result<String, io::Error> {
    fs::read_to_string("username.txt")
}

// unwrap (panics on Err)
let f = File::open("file.txt").unwrap();

// expect (panic with custom message)
let f = File::open("file.txt")
    .expect("Failed to open file.txt");

// unwrap_or (default value on Err)
let result = divide(10.0, 0.0).unwrap_or(0.0);

// unwrap_or_else (compute default value)
let result = divide(10.0, 0.0)
    .unwrap_or_else(|_| 0.0);

// Custom error types
use std::fmt;

#[derive(Debug)]
struct MyError {
    message: String,
}

impl fmt::Display for MyError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "MyError: {}", self.message)
    }
}

impl std::error::Error for MyError {}

fn do_something() -> Result<(), MyError> {
    Err(MyError {
        message: String::from("Something went wrong"),
    })
}

// anyhow crate (popular for applications)
use anyhow::{Context, Result};

fn process() -> Result<()> {
    let content = fs::read_to_string("file.txt")
        .context("Failed to read file")?;
    Ok(())
}

// thiserror crate (for libraries)
use thiserror::Error;

#[derive(Error, Debug)]
enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Parse error: {0}")]
    Parse(String),
}
```

---

## Traits

```rust
// Define trait
trait Summary {
    fn summarize(&self) -> String;

    // Default implementation
    fn summarize_default(&self) -> String {
        String::from("(Read more...)")
    }
}

// Implement trait
struct Article {
    headline: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.headline, self.content)
    }
}

// Trait as parameter
fn notify(item: &impl Summary) {
    println!("{}", item.summarize());
}

// Trait bound syntax (equivalent)
fn notify<T: Summary>(item: &T) {
    println!("{}", item.summarize());
}

// Multiple trait bounds
fn notify<T: Summary + Display>(item: &T) {
    // ...
}

// where clause (more readable)
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // ...
}

// Return trait
fn returns_summarizable() -> impl Summary {
    Article {
        headline: String::from("Title"),
        content: String::from("Content"),
    }
}

// Derive traits (automatic implementation)
#[derive(Debug, Clone, PartialEq, Eq)]
struct Point {
    x: i32,
    y: i32,
}

// Common derivable traits:
// Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash

// Trait objects (dynamic dispatch)
let items: Vec<Box<dyn Summary>> = vec![
    Box::new(article),
    Box::new(tweet),
];

for item in items {
    println!("{}", item.summarize());
}

// Associated types
trait Iterator {
    type Item;

    fn next(&mut self) -> Option<Self::Item>;
}

// Operator overloading
use std::ops::Add;

impl Add for Point {
    type Output = Point;

    fn add(self, other: Point) -> Point {
        Point {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

let p1 = Point { x: 1, y: 2 };
let p2 = Point { x: 3, y: 4 };
let p3 = p1 + p2;               // Uses Add trait
```

---

## Lifetimes

```rust
// Lifetime annotation
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// The return value lives as long as the smaller of x and y

// Lifetime in struct
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }

    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("Attention: {}", announcement);
        self.part
    }
}

// Multiple lifetimes
fn longest_with_announcement<'a, 'b>(
    x: &'a str,
    y: &'a str,
    ann: &'b str,
) -> &'a str {
    println!("Announcement: {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// Static lifetime (lives for entire program)
let s: &'static str = "I have a static lifetime.";

// Lifetime elision (compiler infers lifetimes)
fn first_word(s: &str) -> &str {  // Actually: fn first_word<'a>(s: &'a str) -> &'a str
    &s[..1]
}

// Rules:
// 1. Each parameter gets its own lifetime
// 2. If one input lifetime, output has same lifetime
// 3. If &self or &mut self, output has same lifetime as self
```

### Visual: Lifetimes

```
PROBLEM WITHOUT LIFETIMES:
let r;                          // ─────────────┐
{                               //              │
    let x = 5;                  // ─┐           │ r's lifetime
    r = &x;                     //  │ x's       │
}                               // ─┘ lifetime  │
println!("{}", r);              // ─────────────┘
// ERROR: x doesn't live long enough!


WITH LIFETIME ANNOTATIONS:
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

let string1 = String::from("long string");
let result;
{
    let string2 = String::from("short");
    result = longest(&string1, &string2);
}
// ERROR: result can't outlive string2

The lifetime 'a represents the overlap of x and y's lifetimes.
```

---

## Concurrency

```rust
use std::thread;
use std::sync::{Arc, Mutex, mpsc};
use std::time::Duration;

// Spawn thread
let handle = thread::spawn(|| {
    println!("Hello from thread!");
});

handle.join().unwrap();         // Wait for thread

// Move closure (transfer ownership)
let v = vec![1, 2, 3];
let handle = thread::spawn(move || {
    println!("{:?}", v);
});

// Message passing (channels)
let (tx, rx) = mpsc::channel();

thread::spawn(move || {
    let val = String::from("hi");
    tx.send(val).unwrap();
});

let received = rx.recv().unwrap();  // Blocks until message
let received = rx.try_recv();       // Non-blocking

// Multiple senders
let (tx, rx) = mpsc::channel();
let tx1 = tx.clone();

thread::spawn(move || {
    tx.send(String::from("thread 1")).unwrap();
});

thread::spawn(move || {
    tx1.send(String::from("thread 2")).unwrap();
});

// Iterate over messages
for received in rx {
    println!("{}", received);
}

// Shared state with Mutex
let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for _ in 0..10 {
    let counter = Arc::clone(&counter);
    let handle = thread::spawn(move || {
        let mut num = counter.lock().unwrap();
        *num += 1;
    });
    handles.push(handle);
}

for handle in handles {
    handle.join().unwrap();
}

println!("Result: {}", *counter.lock().unwrap());

// RwLock (multiple readers or one writer)
use std::sync::RwLock;

let lock = RwLock::new(5);

// Read
{
    let r1 = lock.read().unwrap();
    let r2 = lock.read().unwrap();
    println!("{} {}", r1, r2);
}

// Write
{
    let mut w = lock.write().unwrap();
    *w += 1;
}

// Atomic types
use std::sync::atomic::{AtomicUsize, Ordering};

let counter = AtomicUsize::new(0);
counter.fetch_add(1, Ordering::SeqCst);
let value = counter.load(Ordering::SeqCst);

// Async/await (tokio runtime)
use tokio::time::sleep;

#[tokio::main]
async fn main() {
    let task1 = async {
        sleep(Duration::from_secs(1)).await;
        println!("Task 1");
    };

    let task2 = async {
        sleep(Duration::from_secs(1)).await;
        println!("Task 2");
    };

    tokio::join!(task1, task2);  // Run concurrently
}

// Async function
async fn fetch_data() -> Result<String, Error> {
    // Async code
    Ok(String::from("data"))
}

// Spawn async task
tokio::spawn(async {
    println!("Async task");
});
```

### Visual: Arc & Mutex

```
ARC (ATOMIC REFERENCE COUNTED):

Thread 1         Thread 2         Thread 3
   │                │                │
   └────Arc::clone──┴────Arc::clone──┘
               │
               ▼
        ┌─────────────┐
        │ RefCount: 3 │
        │   Data: 42  │
        └─────────────┘

When all Arc clones are dropped, data is freed.


MUTEX (MUTUAL EXCLUSION):

Thread 1  Thread 2  Thread 3
   │         │         │
   ├─lock()  │         │
   │ ✓       │         │
   │         ├─lock()  │
   │         │ ⏸(wait)│
   │         │         ├─lock()
   │         │         │ ⏸(wait)
   unlock()──┤         │
   │         │ ✓       │
   │         unlock()──┤
   │         │         │ ✓
   │         │         unlock()

Only one thread can hold lock at a time.
```

---

## Smart Pointers

```rust
// Box<T> (heap allocation)
let b = Box::new(5);
println!("{}", b);

// Recursive type with Box
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));

// Deref trait (act like reference)
use std::ops::Deref;

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}

// Rc<T> (reference counted, single-threaded)
use std::rc::Rc;

let a = Rc::new(5);
let b = Rc::clone(&a);
let c = Rc::clone(&a);
println!("Count: {}", Rc::strong_count(&a));  // 3

// Arc<T> (atomic reference counted, thread-safe)
use std::sync::Arc;

let a = Arc::new(5);
let b = Arc::clone(&a);
// Can share across threads

// RefCell<T> (interior mutability)
use std::cell::RefCell;

let x = RefCell::new(5);
*x.borrow_mut() += 1;           // Mutable borrow (runtime checked)
let value = *x.borrow();        // Immutable borrow

// Rc + RefCell (shared mutable ownership)
use std::rc::Rc;
use std::cell::RefCell;

let value = Rc::new(RefCell::new(5));
let a = Rc::clone(&value);
let b = Rc::clone(&value);

*value.borrow_mut() += 10;
println!("{}", value.borrow());  // 15

// Weak<T> (break reference cycles)
use std::rc::Weak;

struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

// Cow (Clone on Write)
use std::borrow::Cow;

fn process(input: Cow<str>) -> Cow<str> {
    if input.contains("world") {
        Cow::Owned(input.replace("world", "Rust"))  // Clone when modified
    } else {
        input                                        // No clone needed
    }
}
```

---

**Last updated:** 2025-11-15
