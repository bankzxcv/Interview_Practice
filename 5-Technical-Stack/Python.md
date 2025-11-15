# Python Cheatsheet - Quick Reference

Comprehensive Python guide for technical interviews and software engineering.

---

## Table of Contents

1. [Essential Syntax](#essential-syntax)
2. [Data Structures & Time Complexities](#data-structures--time-complexities)
3. [List Comprehensions](#list-comprehensions)
4. [String Operations](#string-operations)
5. [Built-in Functions](#built-in-functions)
6. [Collections Module](#collections-module)
7. [Heapq for Priority Queues](#heapq-for-priority-queues)
8. [Lambda Functions](#lambda-functions)
9. [Common Pitfalls](#common-pitfalls)
10. [Advanced Features](#advanced-features)

---

## Essential Syntax

```python
# Variables and types
x = 10
s = "hello"
lst = [1, 2, 3]
dct = {"key": "value"}
tpl = (1, 2, 3)

# Conditionals
if condition:
    pass
elif other_condition:
    pass
else:
    pass

# Ternary operator
result = value_if_true if condition else value_if_false

# Loops
for i in range(10):
    pass

for item in iterable:
    pass

for index, value in enumerate(iterable):
    pass

while condition:
    pass

# Functions
def function_name(param1, param2=default):
    return result

# Type hints (Python 3.5+)
def add(a: int, b: int) -> int:
    return a + b

# Lambda
lambda x: x * 2
```

---

## Data Structures & Time Complexities

| Data Structure | Access | Search | Insert | Delete | Space | Notes |
|---|---|---|---|---|---|---|
| **List** | O(1) | O(n) | O(n) | O(n) | O(n) | Ordered, mutable, duplicates allowed |
| **Dict** | O(1) | O(1) | O(1) | O(1) | O(n) | Key-value pairs, ordered (3.7+) |
| **Set** | - | O(1) | O(1) | O(1) | O(n) | Unordered, unique elements only |
| **Tuple** | O(1) | O(n) | - | - | O(n) | Immutable, ordered, hashable |
| **Deque** | O(1) | O(n) | O(1) | O(1) | O(n) | Fast at both ends |
| **Heap** | O(1) | O(n) | O(log n) | O(log n) | O(n) | Min-heap by default |

### Visual Representation

```
LIST:     [1, 2, 3, 4, 5]
          ↑ O(1) access by index

DICT:     {"a": 1, "b": 2}
          ↑ O(1) lookup by key

SET:      {1, 2, 3, 4, 5}
          ↑ O(1) membership test

DEQUE:    [1, 2, 3, 4, 5]
          ↑ O(1) append/pop from both ends

HEAP:         1
           /    \
          2      3
         / \    /
        4   5  6
        ↑ Min-heap property (parent ≤ children)
```

---

## List Comprehensions

```python
# Basic
[x * 2 for x in range(5)]  # [0, 2, 4, 6, 8]

# With condition
[x for x in range(10) if x % 2 == 0]  # [0, 2, 4, 6, 8]

# With if-else
[x if x % 2 == 0 else -x for x in range(5)]  # [0, -1, 2, -3, 4]

# Nested
[[x * y for y in range(3)] for x in range(3)]
# [[0, 0, 0], [0, 1, 2], [0, 2, 4]]

# Flatten nested list
nested = [[1, 2], [3, 4], [5, 6]]
flattened = [item for sublist in nested for item in sublist]
# [1, 2, 3, 4, 5, 6]

# Dict comprehension
{x: x**2 for x in range(5)}  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# Set comprehension
{x % 3 for x in range(10)}  # {0, 1, 2}

# Generator expression (memory efficient)
sum(x * 2 for x in range(1000000))  # No list created
```

---

## String Operations

```python
s = "hello world"

# Common methods
len(s)                    # 11
s.upper()                 # "HELLO WORLD"
s.lower()                 # "hello world"
s.capitalize()            # "Hello world"
s.title()                 # "Hello World"
s.strip()                 # Remove whitespace
s.lstrip()                # Remove left whitespace
s.rstrip()                # Remove right whitespace
s.split()                 # ['hello', 'world']
s.split(',')              # Split by delimiter
','.join(['a', 'b'])      # "a,b"
s.replace('old', 'new')   # String replacement
s.find('substring')       # Index of substring (-1 if not found)
s.rfind('o')              # Last occurrence
s.index('substring')      # Like find but raises ValueError
s.startswith('he')        # True
s.endswith('ld')          # True
s.count('l')              # 3
s.isdigit()               # Check if all digits
s.isalpha()               # Check if all letters
s.isalnum()               # Check if alphanumeric
s.islower()               # Check if lowercase
s.isupper()               # Check if uppercase
s.isspace()               # Check if whitespace

# Indexing and slicing
s[0]      # 'h'
s[-1]     # 'd'
s[1:4]    # 'ell'
s[:5]     # 'hello'
s[6:]     # 'world'
s[::-1]   # 'dlrow olleh' (reverse)
s[::2]    # 'hlowrd' (every 2nd char)

# F-strings (Python 3.6+)
name = "John"
age = 30
f"Hello {name}, you are {age} years old"
f"{age:03d}"              # "030" (zero-padded)
f"{3.14159:.2f}"          # "3.14" (2 decimal places)

# Raw strings
r"C:\new\path"            # Backslashes not escaped

# Multi-line strings
"""
Multiple
lines
"""
```

---

## Built-in Functions

```python
# map: Apply function to each element
list(map(lambda x: x * 2, [1, 2, 3]))  # [2, 4, 6]
list(map(str, [1, 2, 3]))              # ['1', '2', '3']

# filter: Keep elements that satisfy condition
list(filter(lambda x: x > 2, [1, 2, 3, 4]))  # [3, 4]
list(filter(None, [0, 1, False, True, ""])   # [1, True] (removes falsy)

# reduce: Accumulate values (from functools)
from functools import reduce
reduce(lambda x, y: x + y, [1, 2, 3, 4])  # 10
reduce(lambda x, y: x * y, [1, 2, 3, 4])  # 24

# zip: Combine multiple iterables
list(zip([1, 2], ['a', 'b']))              # [(1, 'a'), (2, 'b')]
list(zip([1, 2, 3], ['a', 'b']))           # [(1, 'a'), (2, 'b')]
dict(zip(['a', 'b'], [1, 2]))              # {'a': 1, 'b': 2}

# enumerate: Get index and value
list(enumerate(['a', 'b', 'c']))           # [(0, 'a'), (1, 'b'), (2, 'c')]
list(enumerate(['a', 'b'], start=1))       # [(1, 'a'), (2, 'b')]

# sorted: Sort with custom function
sorted([3, 1, 2])                          # [1, 2, 3]
sorted([3, 1, 2], reverse=True)            # [3, 2, 1]
sorted(items, key=lambda x: x[1])          # Sort by second element
sorted(words, key=len)                     # Sort by length
sorted(words, key=str.lower)               # Case-insensitive sort

# all/any
all([True, True, False])   # False (all must be True)
any([False, False, True])  # True (at least one True)
all([])                    # True (vacuous truth)
any([])                    # False

# sum, min, max
sum([1, 2, 3])             # 6
sum([1, 2, 3], start=10)   # 16 (10 + 1 + 2 + 3)
min([3, 1, 2])             # 1
max([3, 1, 2])             # 3
min(items, key=lambda x: x[1])  # Min by second element

# range
range(5)                   # 0, 1, 2, 3, 4
range(2, 5)                # 2, 3, 4
range(0, 10, 2)            # 0, 2, 4, 6, 8
range(10, 0, -1)           # 10, 9, 8, ..., 1

# reversed
list(reversed([1, 2, 3]))  # [3, 2, 1]
list(reversed("hello"))    # ['o', 'l', 'l', 'e', 'h']

# abs, round, pow
abs(-5)                    # 5
round(3.14159, 2)          # 3.14
pow(2, 3)                  # 8 (2^3)
pow(2, 3, 5)               # 3 (2^3 % 5)

# divmod
divmod(17, 5)              # (3, 2) - quotient and remainder

# isinstance, type
isinstance(5, int)         # True
isinstance([], (list, tuple))  # True
type(5) == int             # True
```

---

## Collections Module

```python
from collections import Counter, defaultdict, deque, OrderedDict, namedtuple

# Counter: Count occurrences
counter = Counter([1, 1, 1, 2, 2, 3])      # Counter({1: 3, 2: 2, 3: 1})
counter.most_common(2)                      # [(1, 3), (2, 2)]
counter['key'] += 1                         # Increment count
counter1 + counter2                         # Add counts
counter1 - counter2                         # Subtract counts
counter1 & counter2                         # Intersection (min)
counter1 | counter2                         # Union (max)

# defaultdict: Dict with default values
dd = defaultdict(int)
dd['key'] += 1                              # No KeyError, defaults to 0

dd = defaultdict(list)
dd['key'].append(1)                         # No KeyError, defaults to []

dd = defaultdict(set)
dd['key'].add(1)                            # No KeyError, defaults to set()

# Custom default
dd = defaultdict(lambda: "N/A")
dd['missing']                               # "N/A"

# deque: Double-ended queue
dq = deque([1, 2, 3])
dq.append(4)                                # Add to right: [1, 2, 3, 4]
dq.appendleft(0)                            # Add to left: [0, 1, 2, 3, 4]
dq.pop()                                    # Remove from right: 4
dq.popleft()                                # Remove from left: 0
dq.extend([5, 6])                           # Extend right
dq.extendleft([0, -1])                      # Extend left (reversed!)
dq.rotate(1)                                # Rotate right
dq.rotate(-1)                               # Rotate left

# OrderedDict: Maintains insertion order (dict is ordered in 3.7+)
od = OrderedDict()
od['a'] = 1
od['b'] = 2
od.move_to_end('a')                         # Move to end
od.move_to_end('b', last=False)             # Move to beginning
od.popitem(last=True)                       # Pop last item
od.popitem(last=False)                      # Pop first item

# namedtuple: Tuple with named fields
Point = namedtuple('Point', ['x', 'y'])
p = Point(1, 2)
p.x, p.y                                    # 1, 2
p[0], p[1]                                  # 1, 2
p._asdict()                                 # {'x': 1, 'y': 2}
```

### Visual: Deque Operations

```
Initial:     [1, 2, 3, 4, 5]

appendleft(0):
[0, 1, 2, 3, 4, 5]
 ↑ Added here

append(6):
[0, 1, 2, 3, 4, 5, 6]
                   ↑ Added here

popleft():
[1, 2, 3, 4, 5, 6]
 ↑ Removed from here

pop():
[1, 2, 3, 4, 5]
             ↑ Removed from here
```

---

## Heapq for Priority Queues

```python
import heapq

# Min-heap (default)
heap = []
heapq.heappush(heap, 3)
heapq.heappush(heap, 1)
heapq.heappush(heap, 2)
min_val = heapq.heappop(heap)  # 1

# Heapify existing list
heap = [3, 1, 4, 1, 5, 9, 2, 6]
heapq.heapify(heap)             # O(n)

# Peek at min (without removing)
min_val = heap[0]

# N smallest/largest
heapq.nsmallest(3, [3, 1, 4, 1, 5])    # [1, 1, 3]
heapq.nlargest(3, [3, 1, 4, 1, 5])     # [5, 4, 3]

# With key function
heapq.nsmallest(2, items, key=lambda x: x[1])

# Max-heap: negate values
max_heap = []
heapq.heappush(max_heap, -3)
heapq.heappush(max_heap, -1)
heapq.heappush(max_heap, -2)
max_val = -heapq.heappop(max_heap)  # 3

# Priority queue with tuples
heap = []
heapq.heappush(heap, (priority, item))
priority, item = heapq.heappop(heap)

# Replace top element
heapq.heapreplace(heap, new_item)      # Pop then push
heapq.heappushpop(heap, item)          # Push then pop

# Merge sorted iterables
merged = heapq.merge([1, 3, 5], [2, 4, 6])  # Iterator: 1, 2, 3, 4, 5, 6
```

### Visual: Heap Structure

```
Min-Heap Example:
        1
       / \
      2   3
     / \ / \
    4  5 6  7

Property: Parent ≤ Children
heap[i] ≤ heap[2*i + 1]  (left child)
heap[i] ≤ heap[2*i + 2]  (right child)

Array representation: [1, 2, 3, 4, 5, 6, 7]
```

---

## Lambda Functions

```python
# Basic
f = lambda x: x * 2
f(5)  # 10

# Multiple arguments
f = lambda x, y: x + y
f(3, 4)  # 7

# With conditions
f = lambda x: x if x > 0 else 0

# Multiple statements (use regular function instead)
# Lambda is limited to single expression

# Commonly used with map/filter/sorted
items = [(1, 'b'), (2, 'a'), (3, 'c')]
sorted(items, key=lambda x: x[1])          # Sort by second element
list(map(lambda x: x * 2, [1, 2, 3]))      # [2, 4, 6]
list(filter(lambda x: x > 2, [1, 2, 3, 4])) # [3, 4]

# In max/min
max(items, key=lambda x: x[1])

# Lambda with default arguments
f = lambda x, y=10: x + y
f(5)     # 15
f(5, 20) # 25
```

---

## Common Pitfalls

```python
# 1. Mutable default arguments (DON'T DO THIS!)
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

# 2. Integer division
5 / 2   # 2.5 (float division)
5 // 2  # 2 (integer/floor division)
-5 // 2 # -3 (floors towards negative infinity)

# 3. Comparing None
x = None
x is None      # True (correct - identity check)
x == None      # Works but less Pythonic

# 4. List/dict copy
lst1 = [1, 2, 3]
lst2 = lst1                    # Reference, not copy!
lst2.append(4)                 # lst1 is also modified!

lst3 = lst1.copy()             # Shallow copy
lst4 = lst1[:]                 # Shallow copy
lst5 = list(lst1)              # Shallow copy

import copy
lst6 = copy.deepcopy(lst1)     # Deep copy

# Shallow vs deep copy
original = [[1, 2], [3, 4]]
shallow = original.copy()
shallow[0][0] = 99             # Modifies original!

deep = copy.deepcopy(original)
deep[0][0] = 99                # Does NOT modify original

# 5. Set vs tuple syntax
{1, 2, 3}       # Set
(1, 2, 3)       # Tuple
{1}             # Set with one element
(1,)            # Tuple with one element (note comma!)
(1)             # Just integer 1 in parentheses!

# 6. String is immutable
s = "hello"
s[0] = 'H'      # TypeError!
s = 'H' + s[1:] # Correct way

# 7. Truthy/Falsy values
# Falsy: None, False, 0, 0.0, "", [], {}, set()
# Truthy: Everything else

if []:          # False
if [0]:         # True (non-empty list)

# 8. Variable scope in loops
# Python 3 fixed this, but be aware:
for i in range(5):
    pass
print(i)        # 4 (i still exists!)

# List comprehension has its own scope:
[x for x in range(5)]
print(x)        # NameError (x doesn't exist)

# 9. Floating point precision
0.1 + 0.2 == 0.3                    # False!
0.1 + 0.2                           # 0.30000000000000004

# Use math.isclose for comparison
import math
math.isclose(0.1 + 0.2, 0.3)        # True

# Or use Decimal for exact decimal arithmetic
from decimal import Decimal
Decimal('0.1') + Decimal('0.2') == Decimal('0.3')  # True

# 10. is vs ==
a = [1, 2, 3]
b = [1, 2, 3]
a == b          # True (equal values)
a is b          # False (different objects)

# Exception: small integers and strings are cached
x = 256
y = 256
x is y          # True (cached)

x = 257
y = 257
x is y          # False (not cached)

# 11. Global variables in functions
x = 10

def modify():
    x = 20      # Creates local variable, doesn't modify global

def modify_global():
    global x
    x = 20      # Modifies global variable
```

---

## Advanced Features

### Decorators

```python
# Function decorator
def timer(func):
    import time
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.2f}s")
        return result
    return wrapper

@timer
def slow_function():
    time.sleep(1)

# Decorator with arguments
def repeat(times):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(3)
def greet():
    print("Hello")

# Class decorator
@dataclass
class Point:
    x: int
    y: int
```

### Context Managers

```python
# Using with statement
with open('file.txt', 'r') as f:
    content = f.read()
# File automatically closed

# Custom context manager
from contextlib import contextmanager

@contextmanager
def timer():
    import time
    start = time.time()
    yield
    end = time.time()
    print(f"Elapsed: {end - start:.2f}s")

with timer():
    # Your code here
    time.sleep(1)
```

### Generators

```python
# Generator function
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

for num in fibonacci(10):
    print(num)  # 0, 1, 1, 2, 3, 5, 8, 13, 21, 34

# Generator expression
gen = (x**2 for x in range(1000000))  # Memory efficient!

# Benefits: lazy evaluation, memory efficient
sum(x**2 for x in range(1000000))  # No list created
```

### Itertools

```python
from itertools import *

# Infinite iterators
count(10, 2)           # 10, 12, 14, 16, ...
cycle([1, 2, 3])       # 1, 2, 3, 1, 2, 3, ...
repeat(10, 3)          # 10, 10, 10

# Combinatoric iterators
combinations([1, 2, 3], 2)           # (1,2), (1,3), (2,3)
combinations_with_replacement([1, 2], 2)  # (1,1), (1,2), (2,2)
permutations([1, 2, 3], 2)           # (1,2), (1,3), (2,1), (2,3), (3,1), (3,2)
product([1, 2], ['a', 'b'])          # (1,'a'), (1,'b'), (2,'a'), (2,'b')

# Useful iterators
chain([1, 2], [3, 4])                # 1, 2, 3, 4
islice(range(100), 10, 20)           # Elements 10-19
groupby([1, 1, 2, 2, 3])             # Group consecutive equal elements
accumulate([1, 2, 3, 4])             # 1, 3, 6, 10 (cumulative sum)
```

### Exception Handling

```python
try:
    risky_operation()
except ValueError as e:
    print(f"ValueError: {e}")
except (TypeError, KeyError) as e:
    print(f"Type or Key Error: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
else:
    print("No exception occurred")
finally:
    print("Always executed")

# Raise exceptions
raise ValueError("Invalid value")
raise ValueError("Error") from original_exception

# Custom exceptions
class CustomError(Exception):
    pass
```

### Async/Await (Python 3.5+)

```python
import asyncio

async def fetch_data():
    await asyncio.sleep(1)
    return "data"

async def main():
    result = await fetch_data()
    print(result)

# Run async code
asyncio.run(main())

# Multiple async tasks
async def main():
    results = await asyncio.gather(
        fetch_data(),
        fetch_data(),
        fetch_data()
    )
```

---

## Performance Tips

1. **Use built-in functions** - They're implemented in C and faster
2. **List comprehensions > loops** - More concise and often faster
3. **Generators for large datasets** - Memory efficient
4. **Set for membership tests** - O(1) vs O(n) for lists
5. **Use `join()` for string concatenation** - Don't use `+= ` in loops
6. **Local variables are faster** - Avoid excessive global lookups
7. **Use `__slots__`** for classes with many instances
8. **Profile your code** - `cProfile`, `timeit`

```python
# Bad: String concatenation in loop
s = ""
for i in range(1000):
    s += str(i)

# Good: Join
s = "".join(str(i) for i in range(1000))

# Bad: Repeated membership test in list
for item in large_list:
    if item in another_large_list:  # O(n) each time
        pass

# Good: Convert to set first
another_set = set(another_large_list)
for item in large_list:
    if item in another_set:  # O(1) each time
        pass
```

---

**Last updated:** 2025-11-15
