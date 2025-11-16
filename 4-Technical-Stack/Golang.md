# Golang (Go) Cheatsheet - Quick Reference

> **Official Documentation:**
> - [Go Docs](https://go.dev/doc/) | [Go Tour](https://go.dev/tour/)
> - [Effective Go](https://go.dev/doc/effective_go) | [Go by Example](https://gobyexample.com/)

Comprehensive Go guide for technical interviews and backend engineering.

---

## Table of Contents

1. [Essential Syntax](#essential-syntax)
2. [Data Types](#data-types)
3. [Arrays & Slices](#arrays--slices)
4. [Maps](#maps)
5. [Structs](#structs)
6. [Functions](#functions)
7. [Methods & Interfaces](#methods--interfaces)
8. [Goroutines & Channels](#goroutines--channels)
9. [Error Handling](#error-handling)
10. [Common Patterns](#common-patterns)
11. [Standard Library](#standard-library)

---

## Essential Syntax

```go
package main

import (
    "fmt"
    "strings"
)

// Variables
var x int = 10                  // Explicit type
var y = 20                      // Type inference
z := 30                         // Short declaration (inside functions only)

// Multiple declarations
var a, b, c int = 1, 2, 3
d, e := 4, 5

// Constants
const PI = 3.14159
const (
    StatusOK = 200
    StatusNotFound = 404
)

// iota for enums
const (
    Sunday = iota    // 0
    Monday           // 1
    Tuesday          // 2
)

// Conditionals
if x > 0 {
    // ...
} else if x < 0 {
    // ...
} else {
    // ...
}

// If with initialization
if val := compute(); val > 0 {
    // val is scoped to this if block
}

// Switch
switch value {
case 1:
    // No fallthrough by default
case 2, 3:
    // Multiple cases
case 4:
    fallthrough  // Explicit fallthrough
default:
    // ...
}

// Switch without expression (if-else chain)
switch {
case x > 0:
    // ...
case x < 0:
    // ...
default:
    // ...
}

// Type switch
switch v := value.(type) {
case int:
    fmt.Println("int:", v)
case string:
    fmt.Println("string:", v)
default:
    fmt.Println("unknown type")
}

// For loops (only loop construct in Go!)
for i := 0; i < 10; i++ {
    // ...
}

// While-style loop
for condition {
    // ...
}

// Infinite loop
for {
    // ...
    break
}

// Range over slice/array
for index, value := range slice {
    // ...
}

// Range over map
for key, value := range myMap {
    // ...
}

// Ignore index/key with _
for _, value := range slice {
    // ...
}

// Range over string (runes)
for index, char := range "hello" {
    fmt.Println(index, char)  // char is rune (int32)
}

func main() {
    fmt.Println("Hello, World!")
}
```

---

## Data Types

```go
// Basic types
var (
    b bool = true

    // Integers
    i int = 42           // Platform dependent (32 or 64 bit)
    i8 int8 = 127        // -128 to 127
    i16 int16 = 32767
    i32 int32 = 2147483647
    i64 int64 = 9223372036854775807

    ui uint = 42         // Unsigned, platform dependent
    ui8 uint8 = 255      // 0 to 255 (also called byte)
    ui16 uint16 = 65535
    ui32 uint32 = 4294967295
    ui64 uint64 = 18446744073709551615

    // Floating point
    f32 float32 = 3.14
    f64 float64 = 3.14159265359

    // Complex numbers
    c64 complex64 = 1 + 2i
    c128 complex128 = 1 + 2i

    // String
    s string = "hello"

    // Rune (alias for int32, represents Unicode code point)
    r rune = 'A'         // 65

    // Byte (alias for uint8)
    by byte = 'A'        // 65
)

// Zero values
var (
    zeroInt int          // 0
    zeroFloat float64    // 0.0
    zeroBool bool        // false
    zeroString string    // ""
    zeroPointer *int     // nil
    zeroSlice []int      // nil
    zeroMap map[string]int  // nil
    zeroFunc func()      // nil
    zeroInterface interface{}  // nil
)

// Type conversion (explicit only, no implicit conversion)
i := 42
f := float64(i)
u := uint(i)
s := string(i)           // "\" (converts to rune) - NOT "42"!
s2 := fmt.Sprint(i)      // "42" - correct way

// Pointers
x := 42
p := &x                  // Pointer to x
fmt.Println(*p)          // Dereference: 42
*p = 21                  // Change value through pointer
fmt.Println(x)           // 21

// No pointer arithmetic (like C/C++)
```

### Visual: Type Sizes

```
INTEGERS:
int8     [-128 to 127]                    1 byte
int16    [-32,768 to 32,767]              2 bytes
int32    [-2B to 2B]                      4 bytes
int64    [-9Q to 9Q]                      8 bytes

uint8    [0 to 255]                       1 byte
uint16   [0 to 65,535]                    2 bytes
uint32   [0 to 4B]                        4 bytes
uint64   [0 to 18Q]                       8 bytes

FLOATS:
float32  ±1.18×10⁻³⁸ to ±3.4×10³⁸         4 bytes
float64  ±2.23×10⁻³⁰⁸ to ±1.8×10³⁰⁸       8 bytes

MEMORY LAYOUT:
Variable x = 42
│
├─ Value:  42
└─ Pointer &x:  0x00001234 ──→ [42]
```

---

## Arrays & Slices

```go
// Arrays (fixed size)
var arr [5]int               // [0, 0, 0, 0, 0]
arr := [5]int{1, 2, 3, 4, 5} // [1, 2, 3, 4, 5]
arr := [...]int{1, 2, 3}     // Size inferred: [3]int

// Arrays are value types (copied when assigned)
a := [3]int{1, 2, 3}
b := a                       // b is a copy of a
b[0] = 99                    // a is unchanged

// Slices (dynamic, reference to underlying array)
var slice []int              // nil slice
slice = []int{}              // Empty slice
slice := []int{1, 2, 3}      // Literal
slice := make([]int, 5)      // Length 5, capacity 5, all zeros
slice := make([]int, 5, 10)  // Length 5, capacity 10

// Slice operations
len(slice)                   // Length
cap(slice)                   // Capacity
slice[i]                     // Access element
slice[start:end]             // Slice [start, end)
slice[:end]                  // From beginning to end
slice[start:]                // From start to end
slice[:]                     // Full slice (copy reference)

// Append (returns new slice if capacity exceeded)
slice = append(slice, 4)
slice = append(slice, 5, 6, 7)
slice = append(slice, otherSlice...)  // Unpack slice

// Copy
newSlice := make([]int, len(slice))
copy(newSlice, slice)

// Insert at index
slice = append(slice[:index], append([]int{value}, slice[index:]...)...)

// Delete at index
slice = append(slice[:index], slice[index+1:]...)

// Delete range
slice = append(slice[:start], slice[end:]...)

// Common patterns
// Filter
filtered := []int{}
for _, v := range slice {
    if v > 0 {
        filtered = append(filtered, v)
    }
}

// Map
mapped := make([]int, len(slice))
for i, v := range slice {
    mapped[i] = v * 2
}

// Reduce
sum := 0
for _, v := range slice {
    sum += v
}

// Multi-dimensional slices
matrix := [][]int{
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9},
}
```

### Visual: Slice Internals

```
SLICE STRUCTURE:
┌─────────┬──────────┬──────────┐
│ Pointer │ Length   │ Capacity │
│  *arr   │    3     │    5     │
└────┬────┴──────────┴──────────┘
     │
     └──→ Underlying Array: [10, 20, 30, 40, 50]
                             ↑───────↑
                             │       │
                          Used by slice

APPEND BEHAVIOR:
Original:  [1, 2, 3]  (len=3, cap=3)
           ↓
Append(4): [1, 2, 3]  →  NEW: [1, 2, 3, 4, _, _] (len=4, cap=6)
           Old array      New array (doubled capacity)

SLICING:
arr := [5]int{0, 1, 2, 3, 4}

s1 := arr[1:4]    →  [1, 2, 3]  (points to arr[1:4])
s2 := arr[2:]     →  [2, 3, 4]  (points to arr[2:5])

Modifying s1[0] changes arr[1]!
```

---

## Maps

```go
// Declaration
var m map[string]int                    // nil map (cannot assign!)
m = make(map[string]int)                // Empty map
m := map[string]int{}                   // Empty map (literal)
m := map[string]int{                    // With values
    "one": 1,
    "two": 2,
    "three": 3,
}

// Operations
m[key] = value                          // Set
value := m[key]                         // Get (0 if not exists)
value, ok := m[key]                     // Check existence
if value, ok := m[key]; ok {
    // Key exists
}

delete(m, key)                          // Delete
len(m)                                  // Number of keys

// Iterate
for key, value := range m {
    fmt.Println(key, value)
}

// Keys only
for key := range m {
    fmt.Println(key)
}

// Check if nil
if m == nil {
    // Map is nil
}

// Copy map (manual)
newMap := make(map[string]int, len(m))
for k, v := range m {
    newMap[k] = v
}

// Map with struct values
type Person struct {
    Name string
    Age  int
}

people := map[string]Person{
    "alice": {"Alice", 30},
    "bob":   {"Bob", 25},
}

// Map with slice values
groups := map[string][]string{
    "admins": {"alice", "bob"},
    "users":  {"charlie", "david"},
}
```

### Visual: Map Structure

```
MAP INTERNALS:
┌────────────────────────────────┐
│   Hash Table (buckets)         │
├────────────────────────────────┤
│ "alice" →  hash →  bucket[3]   │
│ "bob"   →  hash →  bucket[7]   │
│ "carol" →  hash →  bucket[3]   │ ← Collision handled
└────────────────────────────────┘

Bucket[3]:
┌──────────────┐
│ "alice" → 30 │
│ "carol" → 25 │
└──────────────┘

TIME COMPLEXITY:
Get:    O(1) average
Set:    O(1) average
Delete: O(1) average
Iteration: O(n)

NOTE: Map iteration order is NOT guaranteed!
```

---

## Structs

```go
// Define struct
type Person struct {
    Name    string
    Age     int
    Email   string
}

// Create struct
p1 := Person{Name: "Alice", Age: 30, Email: "alice@example.com"}
p2 := Person{"Bob", 25, "bob@example.com"}  // Order matters
p3 := Person{Name: "Charlie"}               // Zero values for omitted fields
p4 := new(Person)                           // Returns *Person (pointer)

// Anonymous struct
point := struct {
    X, Y int
}{10, 20}

// Access fields
fmt.Println(p1.Name)
p1.Age = 31

// Pointers to structs
p := &Person{Name: "Alice", Age: 30}
p.Age = 31                                  // Automatic dereferencing
(*p).Age = 31                               // Explicit (same as above)

// Embedded structs (composition)
type Address struct {
    Street string
    City   string
}

type Employee struct {
    Person                                  // Embedded (anonymous field)
    Address                                 // Embedded
    Salary int
}

emp := Employee{
    Person:  Person{Name: "Alice", Age: 30},
    Address: Address{Street: "123 Main St", City: "NYC"},
    Salary:  100000,
}

// Access embedded fields directly
fmt.Println(emp.Name)                       // From Person
fmt.Println(emp.City)                       // From Address

// Struct tags (for JSON, DB, etc.)
type User struct {
    ID       int    `json:"id" db:"user_id"`
    Name     string `json:"name" db:"username"`
    Password string `json:"-"`               // Omit from JSON
    Internal string `json:"internal,omitempty"`  // Omit if empty
}

// Get tags with reflection
import "reflect"
field, _ := reflect.TypeOf(User{}).FieldByName("ID")
tag := field.Tag.Get("json")                // "id"

// Struct comparison
p1 == p2                                    // true if all fields are equal
// Note: Cannot compare if struct contains slices/maps/functions

// Copy struct
p5 := p1                                    // Shallow copy (value copy)
```

### Visual: Struct Memory Layout

```
STRUCT LAYOUT:
type Person struct {
    Name  string  // 16 bytes (pointer + length)
    Age   int     // 8 bytes (on 64-bit)
    Email string  // 16 bytes
}

Memory:
┌───────────────────────────────────┐
│ Name (ptr)    │ Name (len)        │  16 bytes
├───────────────┼───────────────────┤
│ Age                               │  8 bytes
├───────────────────────────────────┤
│ Email (ptr)   │ Email (len)       │  16 bytes
└───────────────────────────────────┘
Total: 40 bytes (may vary with padding)

EMBEDDING:
type Employee struct {
    Person      // Embedded
    Salary int
}

┌─────────────────────────┐
│ Person.Name             │
│ Person.Age              │
│ Person.Email            │
├─────────────────────────┤
│ Salary                  │
└─────────────────────────┘

Access: emp.Name (promoted field)
```

---

## Functions

```go
// Basic function
func add(a int, b int) int {
    return a + b
}

// Multiple parameters of same type
func add(a, b int) int {
    return a + b
}

// Multiple return values
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

result, err := divide(10, 2)
if err != nil {
    // Handle error
}

// Named return values
func split(sum int) (x, y int) {
    x = sum * 4 / 9
    y = sum - x
    return  // Naked return
}

// Variadic functions
func sum(nums ...int) int {
    total := 0
    for _, num := range nums {
        total += num
    }
    return total
}

sum(1, 2, 3)
sum(1, 2, 3, 4, 5)
numbers := []int{1, 2, 3}
sum(numbers...)                             // Unpack slice

// Function as type
type MathOp func(int, int) int

func apply(a, b int, op MathOp) int {
    return op(a, b)
}

apply(5, 3, add)

// Anonymous function (lambda)
func(x int) {
    fmt.Println(x)
}(42)

// Closure
func counter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}

c := counter()
fmt.Println(c())                            // 1
fmt.Println(c())                            // 2

// Defer (executes after surrounding function returns)
func example() {
    defer fmt.Println("world")
    fmt.Println("hello")
}
// Output: hello, world

// Multiple defers (LIFO - stack)
func example() {
    defer fmt.Println("1")
    defer fmt.Println("2")
    defer fmt.Println("3")
}
// Output: 3, 2, 1

// Defer with arguments (evaluated immediately)
func example() {
    i := 0
    defer fmt.Println(i)                    // Prints 0
    i++
}

// Panic and recover
func example() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered:", r)
        }
    }()

    panic("something went wrong")           // Trigger panic
}

// Recursion
func factorial(n int) int {
    if n <= 1 {
        return 1
    }
    return n * factorial(n-1)
}
```

---

## Methods & Interfaces

```go
// Method on struct (value receiver)
type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// Method with pointer receiver
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

rect := Rectangle{Width: 10, Height: 5}
area := rect.Area()                         // Value receiver
rect.Scale(2)                               // Pointer receiver (modifies rect)

// Interface
type Shape interface {
    Area() float64
    Perimeter() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

// Implement interface (implicit)
var s Shape = Circle{Radius: 5}             // Circle implements Shape
fmt.Println(s.Area())

// Empty interface (any type)
var i interface{}
i = 42
i = "hello"
i = []int{1, 2, 3}

func printAnything(v interface{}) {
    fmt.Println(v)
}

// Type assertion
var i interface{} = "hello"
s := i.(string)                             // Assert as string
s, ok := i.(string)                         // Safe assertion
if ok {
    fmt.Println(s)
}

// Type switch
func describe(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("int: %v\n", v)
    case string:
        fmt.Printf("string: %v\n", v)
    case bool:
        fmt.Printf("bool: %v\n", v)
    default:
        fmt.Printf("unknown: %T\n", v)
    }
}

// Common interfaces
type Stringer interface {
    String() string                         // fmt.Println uses this
}

type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}

type ReadWriter interface {
    Reader
    Writer
}

// Interface composition
type ReadWriteCloser interface {
    Reader
    Writer
    Closer
}

type Closer interface {
    Close() error
}
```

### Visual: Interfaces

```
INTERFACE SATISFACTION:

type Shape interface {
    Area() float64
}

type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

┌──────────┐
│  Circle  │ implements ──→ ┌─────────────┐
└──────────┘                │   Shape     │
    │                       │  Area()     │
    │                       └─────────────┘
    ├─ Radius: 5
    └─ Area(): 78.54


INTERFACE VALUE:
┌─────────────────────────┐
│ Interface Value         │
├─────────────────────────┤
│ Type:  *Circle          │
│ Value: &Circle{Radius:5}│
└─────────────────────────┘

var s Shape = &Circle{Radius: 5}
             ↑
       Stores both type and value!
```

---

## Goroutines & Channels

```go
// Goroutine (lightweight thread)
go function()                               // Execute asynchronously

go func() {
    fmt.Println("Hello from goroutine")
}()

// Wait for goroutines (use WaitGroup)
import "sync"

var wg sync.WaitGroup

for i := 0; i < 5; i++ {
    wg.Add(1)
    go func(id int) {
        defer wg.Done()
        fmt.Println("Worker", id)
    }(i)
}

wg.Wait()                                   // Wait for all goroutines

// Channels (communication between goroutines)
ch := make(chan int)                        // Unbuffered channel
ch := make(chan int, 10)                    // Buffered (capacity 10)

// Send to channel
ch <- 42

// Receive from channel
value := <-ch

// Close channel
close(ch)

// Check if channel is closed
value, ok := <-ch
if !ok {
    // Channel is closed
}

// Range over channel (until closed)
for value := range ch {
    fmt.Println(value)
}

// Select (multiplex channels)
select {
case msg := <-ch1:
    fmt.Println("Received from ch1:", msg)
case msg := <-ch2:
    fmt.Println("Received from ch2:", msg)
case ch3 <- 42:
    fmt.Println("Sent to ch3")
default:
    fmt.Println("No communication")
}

// Timeout with select
select {
case msg := <-ch:
    fmt.Println(msg)
case <-time.After(time.Second):
    fmt.Println("Timeout")
}

// Worker pool pattern
func worker(id int, jobs <-chan int, results chan<- int) {
    for job := range jobs {
        fmt.Printf("Worker %d processing job %d\n", id, job)
        results <- job * 2
    }
}

jobs := make(chan int, 100)
results := make(chan int, 100)

// Start workers
for w := 1; w <= 3; w++ {
    go worker(w, jobs, results)
}

// Send jobs
for j := 1; j <= 9; j++ {
    jobs <- j
}
close(jobs)

// Collect results
for a := 1; a <= 9; a++ {
    <-results
}

// Mutex (mutual exclusion)
import "sync"

var (
    mu      sync.Mutex
    counter int
)

func increment() {
    mu.Lock()
    counter++
    mu.Unlock()
}

// RWMutex (read-write lock)
var (
    rwMu sync.RWMutex
    data map[string]int
)

func read(key string) int {
    rwMu.RLock()
    defer rwMu.RUnlock()
    return data[key]
}

func write(key string, value int) {
    rwMu.Lock()
    defer rwMu.Unlock()
    data[key] = value
}

// Once (execute only once)
var once sync.Once

func setup() {
    once.Do(func() {
        fmt.Println("Initialized once")
    })
}

// Context (cancellation, timeout)
import "context"

ctx, cancel := context.WithCancel(context.Background())
defer cancel()

ctx, cancel := context.WithTimeout(context.Background(), time.Second)
defer cancel()

ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(time.Second))
defer cancel()

// Use context in goroutine
go func(ctx context.Context) {
    select {
    case <-ctx.Done():
        fmt.Println("Cancelled:", ctx.Err())
        return
    case <-time.After(2 * time.Second):
        fmt.Println("Done")
    }
}(ctx)
```

### Visual: Channels & Goroutines

```
UNBUFFERED CHANNEL:
Goroutine 1          Channel         Goroutine 2
    │                   │                 │
    │ ───send(42)────→ [blocked]          │
    │                   │  ←───receive─── │
    │                   │                 │
    Synchronous! Both block until ready.


BUFFERED CHANNEL (capacity 3):
    │                                     │
    │ ───send(1)────→ [1|_|_]             │
    │ ───send(2)────→ [1|2|_]             │
    │ ───send(3)────→ [1|2|3]             │
    │ ───send(4)────→ [blocked] (full)    │
    │                   │  ←───receive─── │
    │                 [2|3|_]             │
    │ ───send(4)────→ [2|3|4]             │


SELECT STATEMENT:
┌─────────────────────────────────────┐
│ select {                            │
│   case msg := <-ch1:    ┌─ ch1      │
│   case msg := <-ch2:    ├─ ch2      │
│   case ch3 <- value:    ├─ ch3      │
│   default:              └─ none     │
│ }                                   │
└─────────────────────────────────────┘
Picks ONE ready case (random if multiple ready)
```

---

## Error Handling

```go
import "errors"

// Create error
err := errors.New("something went wrong")
err := fmt.Errorf("error: %s", "details")

// Return error
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

// Check error
result, err := divide(10, 0)
if err != nil {
    fmt.Println("Error:", err)
    return
}

// Error wrapping (Go 1.13+)
if err != nil {
    return fmt.Errorf("failed to process: %w", err)
}

// Unwrap error
underlying := errors.Unwrap(err)

// Is (check specific error)
if errors.Is(err, os.ErrNotExist) {
    // File doesn't exist
}

// As (extract specific error type)
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    fmt.Println("Path:", pathErr.Path)
}

// Custom error type
type MyError struct {
    Code    int
    Message string
}

func (e *MyError) Error() string {
    return fmt.Sprintf("error %d: %s", e.Code, e.Message)
}

func doSomething() error {
    return &MyError{Code: 404, Message: "not found"}
}

// Panic/Recover (avoid in most cases)
func riskyOperation() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered from panic:", r)
        }
    }()

    panic("critical error")
}
```

---

## Common Patterns

```go
// Options pattern
type ServerOptions struct {
    Host string
    Port int
    TLS  bool
}

type Option func(*ServerOptions)

func WithHost(host string) Option {
    return func(opts *ServerOptions) {
        opts.Host = host
    }
}

func WithPort(port int) Option {
    return func(opts *ServerOptions) {
        opts.Port = port
    }
}

func NewServer(options ...Option) *Server {
    opts := &ServerOptions{
        Host: "localhost",
        Port: 8080,
    }

    for _, option := range options {
        option(opts)
    }

    return &Server{options: opts}
}

// Usage
server := NewServer(
    WithHost("0.0.0.0"),
    WithPort(3000),
)

// Builder pattern
type QueryBuilder struct {
    table  string
    fields []string
    where  string
}

func NewQuery(table string) *QueryBuilder {
    return &QueryBuilder{table: table}
}

func (q *QueryBuilder) Select(fields ...string) *QueryBuilder {
    q.fields = fields
    return q
}

func (q *QueryBuilder) Where(condition string) *QueryBuilder {
    q.where = condition
    return q
}

func (q *QueryBuilder) Build() string {
    return fmt.Sprintf("SELECT %s FROM %s WHERE %s",
        strings.Join(q.fields, ", "), q.table, q.where)
}

// Usage
query := NewQuery("users").
    Select("id", "name", "email").
    Where("age > 18").
    Build()

// Singleton
var (
    instance *Singleton
    once     sync.Once
)

type Singleton struct {
    value int
}

func GetInstance() *Singleton {
    once.Do(func() {
        instance = &Singleton{value: 42}
    })
    return instance
}

// Table-driven tests
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 2, 3, 5},
        {"negative", -2, -3, -5},
        {"mixed", -2, 3, 1},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("got %d, want %d", result, tt.expected)
            }
        })
    }
}
```

---

## Standard Library

```go
// strings
import "strings"

strings.Contains("hello", "ll")             // true
strings.HasPrefix("hello", "he")            // true
strings.HasSuffix("hello", "lo")            // true
strings.ToUpper("hello")                    // "HELLO"
strings.ToLower("HELLO")                    // "hello"
strings.TrimSpace("  hello  ")              // "hello"
strings.Split("a,b,c", ",")                 // ["a", "b", "c"]
strings.Join([]string{"a", "b"}, ",")       // "a,b"
strings.Replace("hello", "l", "L", 2)       // "heLLo"
strings.ReplaceAll("hello", "l", "L")       // "heLLo"
strings.Repeat("ab", 3)                     // "ababab"

// fmt
import "fmt"

fmt.Println("Hello")                        // Print with newline
fmt.Printf("Number: %d\n", 42)              // Formatted print
fmt.Sprintf("Value: %v", value)             // Format to string

// Formatting verbs
%v    // Default format
%+v   // With field names (structs)
%#v   // Go-syntax representation
%T    // Type
%t    // Boolean
%d    // Decimal integer
%b    // Binary
%x    // Hexadecimal
%f    // Float
%.2f  // Float with precision
%s    // String
%q    // Quoted string
%p    // Pointer

// strconv
import "strconv"

strconv.Itoa(42)                            // "42"
strconv.Atoi("42")                          // 42, error
strconv.ParseInt("42", 10, 64)              // int64, error
strconv.ParseFloat("3.14", 64)              // float64, error
strconv.FormatInt(42, 10)                   // "42"
strconv.FormatFloat(3.14, 'f', 2, 64)       // "3.14"

// time
import "time"

now := time.Now()
now.Year()
now.Month()
now.Day()
now.Hour()
now.Minute()
now.Second()

time.Sleep(time.Second)
time.Sleep(100 * time.Millisecond)

future := now.Add(24 * time.Hour)
duration := future.Sub(now)

time.Parse("2006-01-02", "2024-01-15")
now.Format("2006-01-02 15:04:05")

// io
import "io"

io.Copy(dst, src)                           // Copy from src to dst
io.ReadAll(reader)                          // Read all data
io.WriteString(writer, "text")

// os
import "os"

os.Open("file.txt")                         // Open file
os.Create("file.txt")                       // Create file
os.Remove("file.txt")                       // Delete file
os.Mkdir("dir", 0755)                       // Create directory
os.Getenv("PATH")                           // Get environment variable
os.Setenv("KEY", "value")                   // Set environment variable
os.Exit(1)                                  // Exit with status code

// json
import "encoding/json"

// Marshal
data, err := json.Marshal(value)
data, err := json.MarshalIndent(value, "", "  ")

// Unmarshal
err := json.Unmarshal(data, &target)

// net/http
import "net/http"

// Server
http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!")
})
http.ListenAndServe(":8080", nil)

// Client
resp, err := http.Get("https://example.com")
defer resp.Body.Close()
body, err := io.ReadAll(resp.Body)

// POST
resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
```

---

**Last updated:** 2025-11-15
