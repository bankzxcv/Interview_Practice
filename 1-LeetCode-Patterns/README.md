# 🎯 LeetCode Patterns - Master Guide

## Overview

This comprehensive guide covers **15 essential coding patterns** that appear in 80%+ of LeetCode problems. Each pattern includes:

- 📖 **Pattern explanation** with visual diagrams
- 🔍 **Recognition guidelines** to identify the pattern
- 📝 **Code templates** in Python & TypeScript
- 💡 **10-15 curated problems** (Easy → Medium → Hard)
- 🔗 **Direct LeetCode links** for practice
- ⚡ **Time & space complexity** analysis
- 💬 **Step-by-step comments** (shadow speaking style)

---

## 📚 Pattern Categories

### Array & String Patterns
1. [**Prefix Sum**](#1-prefix-sum) - Range queries and cumulative calculations
2. [**Two Pointers**](#2-two-pointers) - Optimize array/string traversal
3. [**Sliding Window**](#3-sliding-window) - Subarray/substring optimization
4. [**Monotonic Stack**](#6-monotonic-stack) - Next greater/smaller elements

### LinkedList Patterns
5. [**Fast & Slow Pointers**](#4-fast--slow-pointers) - Cycle detection
6. [**LinkedList In-place Reversal**](#5-linkedlist-in-place-reversal) - Reverse segments

### Heap & Interval Patterns
7. [**Top 'K' Elements**](#7-top-k-elements) - Heap-based optimization
8. [**Overlapping Intervals**](#8-overlapping-intervals) - Merge & schedule

### Search Patterns
9. [**Modified Binary Search**](#9-modified-binary-search) - Advanced search techniques

### Tree & Graph Patterns
10. [**Binary Tree Traversal**](#10-binary-tree-traversal) - In/Pre/Post/Level-order
11. [**Depth-First Search (DFS)**](#11-depth-first-search-dfs) - Deep exploration
12. [**Breadth-First Search (BFS)**](#12-breadth-first-search-bfs) - Level-by-level
13. [**Matrix Traversal**](#13-matrix-traversal) - 2D grid problems

### Advanced Patterns
14. [**Backtracking**](#14-backtracking) - Combinatorial search
15. [**Dynamic Programming**](#15-dynamic-programming-patterns) - Optimization problems

---

## 📖 Pattern Details

### 1. Prefix Sum
**[→ View Full Guide](./1.1-Prefix-Sum/README.md)**

**Use When:**
- Need to calculate sum of subarrays efficiently
- Range sum queries appear multiple times
- Looking for subarrays with specific sum properties

**Key Insight:** Precompute cumulative sums to answer range queries in O(1)

**Example Problems:**
- Range Sum Query - Immutable (Easy)
- Subarray Sum Equals K (Medium)
- Continuous Subarray Sum (Medium)

**Pattern Signature:**
```python
# Build prefix sum
prefix = [0]
for num in arr:
    prefix.append(prefix[-1] + num)

# Query sum from i to j
range_sum = prefix[j+1] - prefix[i]
```

---

### 2. Two Pointers
**[→ View Full Guide](./1.2-Two-Pointers/README.md)**

**Use When:**
- Array/string is sorted or can be sorted
- Need to find pairs/triplets with specific properties
- Want to reduce O(n²) to O(n)

**Key Insight:** Use two pointers moving toward each other or in same direction

**Example Problems:**
- Two Sum II (Easy)
- 3Sum (Medium)
- Container With Most Water (Medium)

**Pattern Signature:**
```python
left, right = 0, len(arr) - 1
while left < right:
    # Process current pair
    # Move pointers based on condition
```

---

### 3. Sliding Window
**[→ View Full Guide](./1.3-Sliding-Window/README.md)**

**Use When:**
- Problem involves subarrays/substrings
- Looking for "maximum/minimum/longest/shortest" subarray
- Need to track elements in a range

**Key Insight:** Maintain a window and expand/shrink based on conditions

**Example Problems:**
- Maximum Average Subarray (Easy)
- Longest Substring Without Repeating Characters (Medium)
- Minimum Window Substring (Hard)

**Pattern Signature:**
```python
left = 0
for right in range(len(arr)):
    # Add arr[right] to window
    while window_invalid:
        # Remove arr[left] from window
        left += 1
```

---

### 4. Fast & Slow Pointers
**[→ View Full Guide](./1.4-Fast-Slow-Pointers/README.md)**

**Use When:**
- Detect cycles in linked list
- Find middle of linked list
- Detect duplicates in array with limited space

**Key Insight:** Two pointers move at different speeds

**Example Problems:**
- Linked List Cycle (Easy)
- Find the Duplicate Number (Medium)
- Linked List Cycle II (Medium)

**Pattern Signature:**
```python
slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow == fast:
        # Cycle detected
```

---

### 5. LinkedList In-place Reversal
**[→ View Full Guide](./1.5-LinkedList-Reversal/README.md)**

**Use When:**
- Need to reverse entire linked list or parts
- Reorder linked list nodes
- Space complexity must be O(1)

**Key Insight:** Manipulate pointers to reverse direction

**Example Problems:**
- Reverse Linked List (Easy)
- Reverse Linked List II (Medium)
- Reverse Nodes in k-Group (Hard)

**Pattern Signature:**
```python
prev = None
current = head
while current:
    next_node = current.next
    current.next = prev
    prev = current
    current = next_node
```

---

### 6. Monotonic Stack
**[→ View Full Guide](./1.6-Monotonic-Stack/README.md)**

**Use When:**
- Find next greater/smaller element
- Need to track increasing/decreasing sequence
- Histogram or bar chart problems

**Key Insight:** Stack maintains monotonic order (increasing or decreasing)

**Example Problems:**
- Next Greater Element I (Easy)
- Daily Temperatures (Medium)
- Largest Rectangle in Histogram (Hard)

**Pattern Signature:**
```python
stack = []
for i, num in enumerate(arr):
    while stack and arr[stack[-1]] < num:
        # Process previous smaller element
        stack.pop()
    stack.append(i)
```

---

### 7. Top 'K' Elements
**[→ View Full Guide](./1.7-Top-K-Elements/README.md)**

**Use When:**
- Find K largest/smallest elements
- Maintain K elements efficiently
- Need running median or percentile

**Key Insight:** Use heap to maintain K elements in O(n log k)

**Example Problems:**
- Kth Largest Element (Easy)
- Top K Frequent Elements (Medium)
- Find Median from Data Stream (Hard)

**Pattern Signature:**
```python
import heapq
heap = []
for num in arr:
    heapq.heappush(heap, num)
    if len(heap) > k:
        heapq.heappop(heap)
```

---

### 8. Overlapping Intervals
**[→ View Full Guide](./1.8-Overlapping-Intervals/README.md)**

**Use When:**
- Problems with time ranges or intervals
- Merging, inserting, or finding overlaps
- Scheduling or calendar problems

**Key Insight:** Sort by start time, then process sequentially

**Example Problems:**
- Merge Intervals (Medium)
- Insert Interval (Medium)
- Meeting Rooms II (Medium)

**Pattern Signature:**
```python
intervals.sort(key=lambda x: x[0])
merged = [intervals[0]]
for current in intervals[1:]:
    if current[0] <= merged[-1][1]:
        # Overlap - merge
        merged[-1][1] = max(merged[-1][1], current[1])
    else:
        merged.append(current)
```

---

### 9. Modified Binary Search
**[→ View Full Guide](./1.9-Modified-Binary-Search/README.md)**

**Use When:**
- Array is sorted (or rotated sorted)
- Need O(log n) search
- Search space can be reduced by half

**Key Insight:** Adapt binary search to various conditions

**Example Problems:**
- Binary Search (Easy)
- Search in Rotated Sorted Array (Medium)
- Find Minimum in Rotated Sorted Array (Medium)

**Pattern Signature:**
```python
left, right = 0, len(arr) - 1
while left <= right:
    mid = left + (right - left) // 2
    if condition(mid):
        # Found or adjust search space
```

---

### 10. Binary Tree Traversal
**[→ View Full Guide](./1.10-Binary-Tree-Traversal/README.md)**

**Use When:**
- Need to visit all tree nodes
- Process nodes in specific order
- Serialize/deserialize trees

**Key Insight:** Choose traversal based on when to process node

**Example Problems:**
- Binary Tree Inorder Traversal (Easy)
- Binary Tree Level Order Traversal (Medium)
- Serialize and Deserialize Binary Tree (Hard)

**Pattern Signature:**
```python
# Inorder (left -> root -> right)
def inorder(node):
    if not node:
        return
    inorder(node.left)
    process(node)
    inorder(node.right)
```

---

### 11. Depth-First Search (DFS)
**[→ View Full Guide](./1.11-Depth-First-Search/README.md)**

**Use When:**
- Explore all paths in graph/tree
- Need to go deep before wide
- Recursive solutions feel natural

**Key Insight:** Go as deep as possible before backtracking

**Example Problems:**
- Maximum Depth of Binary Tree (Easy)
- Number of Islands (Medium)
- Course Schedule (Medium)

**Pattern Signature:**
```python
def dfs(node, visited):
    if not node or node in visited:
        return
    visited.add(node)
    for neighbor in node.neighbors:
        dfs(neighbor, visited)
```

---

### 12. Breadth-First Search (BFS)
**[→ View Full Guide](./1.12-Breadth-First-Search/README.md)**

**Use When:**
- Find shortest path in unweighted graph
- Process nodes level by level
- Need minimum steps/distance

**Key Insight:** Use queue to process nodes by level

**Example Problems:**
- Binary Tree Level Order Traversal (Easy)
- Rotting Oranges (Medium)
- Word Ladder (Hard)

**Pattern Signature:**
```python
from collections import deque
queue = deque([start])
visited = {start}
while queue:
    node = queue.popleft()
    for neighbor in node.neighbors:
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append(neighbor)
```

---

### 13. Matrix Traversal
**[→ View Full Guide](./1.13-Matrix-Traversal/README.md)**

**Use When:**
- 2D grid or matrix problems
- Island counting, path finding
- Transforming matrices

**Key Insight:** Combine DFS/BFS with 4 or 8 directions

**Example Problems:**
- Number of Islands (Medium)
- Spiral Matrix (Medium)
- Rotting Oranges (Medium)

**Pattern Signature:**
```python
directions = [(0,1), (1,0), (0,-1), (-1,0)]
for dr, dc in directions:
    new_r, new_c = r + dr, c + dc
    if 0 <= new_r < rows and 0 <= new_c < cols:
        # Process neighbor
```

---

### 14. Backtracking
**[→ View Full Guide](./1.14-Backtracking/README.md)**

**Use When:**
- Generate all combinations/permutations
- Constraint satisfaction problems (Sudoku, N-Queens)
- Need to explore all possible solutions

**Key Insight:** Choose → Explore → Unchoose

**Example Problems:**
- Subsets (Medium)
- Permutations (Medium)
- N-Queens (Hard)

**Pattern Signature:**
```python
def backtrack(path):
    if is_solution(path):
        result.append(path[:])
        return
    for choice in choices:
        path.append(choice)
        backtrack(path)
        path.pop()  # Unchoose
```

---

### 15. Dynamic Programming Patterns
**[→ View Full Guide](./1.15-Dynamic-Programming/README.md)**

**Use When:**
- Problem has overlapping subproblems
- Optimal substructure exists
- Keywords: "maximum/minimum", "count ways", "longest/shortest"

**Key Insight:** Break into subproblems, cache results

**Example Problems:**
- Climbing Stairs (Easy)
- Longest Increasing Subsequence (Medium)
- Edit Distance (Hard)

**Pattern Signature:**
```python
# Top-down with memoization
memo = {}
def dp(state):
    if state in memo:
        return memo[state]
    # Base case
    # Recursive case
    memo[state] = result
    return result
```

---

## 🎯 How to Use This Guide

### Week-by-Week Plan

**Weeks 1-2: Arrays & Strings**
- Day 1-3: Prefix Sum + Two Pointers
- Day 4-7: Sliding Window + Monotonic Stack
- Goal: Solve 30-40 problems

**Weeks 3-4: LinkedLists & Heaps**
- Day 1-4: Fast/Slow Pointers + LinkedList Reversal
- Day 5-7: Top K Elements + Overlapping Intervals
- Goal: Solve 30-40 problems

**Weeks 5-6: Trees & Graphs**
- Day 1-2: Binary Search
- Day 3-5: Tree Traversal + DFS + BFS
- Day 6-7: Matrix Traversal
- Goal: Solve 40-50 problems

**Weeks 7-8: Advanced Patterns**
- Day 1-4: Backtracking
- Day 5-7: Dynamic Programming
- Goal: Solve 30-40 problems

**Total**: 130-170 problems over 8 weeks

### Daily Practice Routine

1. **Choose a pattern** (follow week-by-week plan)
2. **Read the pattern guide** (15-20 min)
3. **Solve easy problems** (2-3 problems)
4. **Progress to medium** (1-2 problems)
5. **Review solutions** (compare with guide)
6. **Identify pattern in new problems**

### Pattern Recognition Flow

```
See Problem
    ↓
Read Requirements
    ↓
Ask: Does it involve...
    ├─ Range queries? → Prefix Sum
    ├─ Pairs in sorted array? → Two Pointers
    ├─ Subarray/substring? → Sliding Window
    ├─ Linked list cycle? → Fast & Slow Pointers
    ├─ Reverse list? → In-place Reversal
    ├─ Next greater element? → Monotonic Stack
    ├─ K largest/smallest? → Heap
    ├─ Intervals/ranges? → Merge Intervals
    ├─ Sorted array search? → Binary Search
    ├─ Tree/graph traversal? → DFS/BFS
    ├─ All combinations? → Backtracking
    └─ Optimization problem? → Dynamic Programming
```

---

## 📊 Progress Tracking

Mark your progress as you complete each pattern:

- [ ] 1.1 Prefix Sum (15 problems)
- [ ] 1.2 Two Pointers (15 problems)
- [ ] 1.3 Sliding Window (13 problems)
- [ ] 1.4 Fast & Slow Pointers (15 problems)
- [ ] 1.5 LinkedList Reversal (12 problems)
- [ ] 1.6 Monotonic Stack (13 problems)
- [ ] 1.7 Top 'K' Elements (13 problems)
- [ ] 1.8 Overlapping Intervals (13 problems)
- [ ] 1.9 Modified Binary Search (15 problems)
- [ ] 1.10 Binary Tree Traversal (13 problems)
- [ ] 1.11 Depth-First Search (13 problems)
- [ ] 1.12 Breadth-First Search (13 problems)
- [ ] 1.13 Matrix Traversal (15 problems)
- [ ] 1.14 Backtracking (15 problems)
- [ ] 1.15 Dynamic Programming (15 problems)

**Total: 209 LeetCode problems**

---

## 💡 Tips for Success

1. **Master patterns, not problems** - Focus on recognizing which pattern to apply
2. **Code without looking** - Try to implement from memory after first read
3. **Time yourself** - Aim for 20-30 min for medium, 40-45 min for hard
4. **Explain out loud** - Practice articulating your thought process
5. **Review regularly** - Revisit patterns weekly to maintain proficiency
6. **Track weak areas** - Spend extra time on patterns you struggle with
7. **Mock interviews** - Practice pattern recognition under pressure
8. **Consistency over intensity** - 2 problems daily beats 14 on Sunday

---

## 🚀 Ready to Start?

Pick a pattern above and dive into the detailed guide. Each pattern page includes everything you need to master it!

**Remember**: These patterns appear in real interviews at Google, Meta, Amazon, Microsoft, Apple, and every other tech company. Master them and you'll be ready for anything!

*Good luck with your interview preparation! 💪*

---

[← Back to Main README](../README.md)
