# Monotonic Stack Pattern

## Pattern Overview

### What is this pattern?
A Monotonic Stack is a stack data structure where elements are always in sorted order (either increasing or decreasing). We maintain this property by popping elements that violate the monotonic condition before pushing new elements.

### When to use it?
- Finding the next greater/smaller element
- Finding the previous greater/smaller element
- Calculating spans or ranges where an element is the maximum/minimum
- Problems involving temperature changes, stock prices, or histograms
- Any problem where you need to track "what comes next that's bigger/smaller"

### Time/Space Complexity Benefits
- **Time Complexity**: O(n) - each element is pushed and popped at most once
- **Space Complexity**: O(n) - stack can hold up to n elements in worst case

### Visual Diagram

#### 🏔️ Think of Monotonic Stack as a Mountain Range or Staircase

A **Monotonic Decreasing Stack** maintains elements like descending stairs:
```
        [6]           ← Top (smallest value visible from top)
      [6, 3]          ← Going down like stairs
    [6, 3, 1]         ← Each step is smaller than the one above
  [6, 3, 1, 0]        ← Perfectly descending staircase
```

A **Monotonic Increasing Stack** maintains elements like ascending stairs:
```
  [0, 1, 3, 6]        ← Perfectly ascending staircase
    [1, 3, 6]         ← Each step is taller than the one below
      [3, 6]          ← Going up like stairs
        [6]           ← Top (largest value visible from top)
```

#### 📊 Detailed Example: Next Greater Element for [2, 1, 5, 6, 2, 3]

**Goal**: For each element, find the first element to its right that is greater.

**Visual Representation of the Array**:
```
Index:  0  1  2  3  4  5
Array: [2, 1, 5, 6, 2, 3]
        ↓  ↓  ↓  ↓  ↓  ↓
Result:[5, 5, 6,-1, 3,-1]
```

**Step-by-Step Stack Evolution** (Monotonic Decreasing Stack):

```
STEP 1: Process nums[0] = 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stack is empty, push index 0

    Stack (indices): [0]
    Stack (values):  [2]
    Visual:    [2]  ← TOP


STEP 2: Process nums[1] = 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 < 2, maintains decreasing order, push index 1

    Stack (indices): [0, 1]
    Stack (values):  [2, 1]
    Visual:    [2]
               [1]  ← TOP (descending stairs!)


STEP 3: Process nums[2] = 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5 > 1 (top), VIOLATION! Pop and record answer

    Pop index 1 (value 1): Next greater = 5 ✓
    5 > 2 (new top), VIOLATION! Pop again
    Pop index 0 (value 2): Next greater = 5 ✓
    Stack empty, push index 2

    Stack (indices): [2]
    Stack (values):  [5]
    Visual:    [5]  ← TOP

    🎯 Found answers: nums[0]=2 → 5, nums[1]=1 → 5


STEP 4: Process nums[3] = 6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6 > 5 (top), VIOLATION! Pop and record answer

    Pop index 2 (value 5): Next greater = 6 ✓
    Stack empty, push index 3

    Stack (indices): [3]
    Stack (values):  [6]
    Visual:    [6]  ← TOP

    🎯 Found answer: nums[2]=5 → 6


STEP 5: Process nums[4] = 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2 < 6, maintains decreasing order, push index 4

    Stack (indices): [3, 4]
    Stack (values):  [6, 2]
    Visual:    [6]
               [2]  ← TOP (descending stairs!)


STEP 6: Process nums[5] = 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3 > 2 (top), VIOLATION! Pop and record answer

    Pop index 4 (value 2): Next greater = 3 ✓
    3 < 6 (new top), maintains order, push index 5

    Stack (indices): [3, 5]
    Stack (values):  [6, 3]
    Visual:    [6]
               [3]  ← TOP (descending stairs!)

    🎯 Found answer: nums[4]=2 → 3


FINAL: Elements still in stack have no next greater
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Stack contains: [3, 5] (values: [6, 3])
    These have no next greater → -1

    🎯 nums[3]=6 → -1, nums[5]=3 → -1
```

**Final Result**: [5, 5, 6, -1, 3, -1]

#### 🎨 Visual Metaphor: The Tower Demolition

Think of the monotonic stack as a **row of towers** being built from left to right:

```
Example: Building towers with heights [3, 1, 4, 2]

Step 1: Build tower of height 3
    [3]
    [3]
    [3]     Stack: [3]

Step 2: Try to build tower of height 1
    [3]
    [3]     [1]     Stack: [3, 1] (descending - OK!)
    [3]     [1]

Step 3: Try to build tower of height 4
    ❌ Tower 1 blocks the view! DEMOLISH IT! (Pop 1)
    ❌ Tower 3 blocks the view! DEMOLISH IT! (Pop 3)
            [4]
            [4]     Stack: [4]
            [4]     (When we demolish, we found their "next greater"!)
            [4]

Step 4: Try to build tower of height 2
            [4]
            [4]     [2]     Stack: [4, 2] (descending - OK!)
            [4]     [2]
            [4]     [2]
```

**Key Rules**:
- We can only see towers that form a **descending staircase** from left to right
- When a taller tower arrives, it **demolishes** shorter towers in front
- The demolishing moment reveals the "next greater element"!

#### 🔄 Push and Pop Operations Visualized

**Monotonic Decreasing Stack** (for finding Next Greater Element):

```
Input: [4, 2, 7, 1, 5]

        Push 4          Push 2          Pop 2! Pop 4!      Push 1          Pop 1!
                        (2 < 4 ✓)       Push 7             (1 < 7 ✓)       Push 5
                                        (7 > 2,4 ❌)                       (5 > 1 ❌)

     Stack: [4]      Stack: [4,2]     Stack: [7]      Stack: [7,1]     Stack: [7,5]

     Visual:            Visual:         Visual:         Visual:          Visual:
       [4]                [4]             [7]             [7]              [7]
                          [2]                             [1]              [5]

                                     🎯 2→7, 4→7                       🎯 1→5
```

**The Popping Action = Finding the Answer!**

```
When we pop element X because of element Y:

    Before:                 After:
    Stack:  [... X]        Stack:  [... Y]

    ⚡ This means: "Next greater element of X is Y"

    Why? Because:
    1. X was in stack (no greater element found yet)
    2. Y is greater than X (causes the pop)
    3. Y comes after X in the array (we process left to right)

    Therefore: Y is X's next greater element! ✓
```

#### 🎯 Comparing Monotonic Increasing vs Decreasing

```
Array: [5, 3, 7, 2, 8]

MONOTONIC DECREASING (Find Next GREATER):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Process: 5 → 3 → 7 → 2 → 8

    [5] → [5,3] → [7] → [7,2] → [8]
                   ↑             ↑
                Pop 3,5       Pop 2,7

    Result: 5→7, 3→7, 7→8, 2→8, 8→-1
    Pattern: Stack decreases like: ↘️ (stairs going down)


MONOTONIC INCREASING (Find Next SMALLER):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    Process: 5 → 3 → 7 → 2 → 8

    [5] → [3] → [3,7] → [2] → [2,8]
          ↑             ↑
        Pop 5         Pop 7

    Result: 5→3, 3→2, 7→2, 2→-1, 8→-1
    Pattern: Stack increases like: ↗️ (stairs going up)
```

**Key Insight**: When we pop an element, we've found the answer for that element!

## Recognition Guidelines

### How to identify this pattern in interview questions?
Look for these indicators:
- Need to find next/previous greater/smaller element
- Need to find the span/range where element is min/max
- Problems involving arrays with comparison operations
- Stock span, temperature problems
- Histogram or bar chart problems
- Range queries with min/max

### Key Phrases/Indicators
- "Next greater element"
- "Previous smaller element"
- "How many days until..."
- "Largest rectangle"
- "Maximum/minimum in a window"
- "Stock span"
- "Temperature rise"
- "Trapping water"

## Template/Pseudocode

### Next Greater Element Template
```python
def next_greater_elements(nums):
    n = len(nums)
    result = [-1] * n
    stack = []  # Store indices

    for i in range(n):
        # While stack is not empty AND
        # current element is greater than element at top of stack
        while stack and nums[i] > nums[stack[-1]]:
            # Pop index and record that nums[i] is its next greater
            index = stack.pop()
            result[index] = nums[i]

        # Push current index to stack
        stack.append(i)

    return result
```

### Next Smaller Element Template
```python
def next_smaller_elements(nums):
    n = len(nums)
    result = [-1] * n
    stack = []  # Store indices

    for i in range(n):
        # While stack is not empty AND
        # current element is smaller than element at top of stack
        while stack and nums[i] < nums[stack[-1]]:
            # Pop index and record that nums[i] is its next smaller
            index = stack.pop()
            result[index] = nums[i]

        # Push current index to stack
        stack.append(i)

    return result
```

## Problems

### Problem 1: Next Greater Element I (Easy)
**LeetCode Link**: [496. Next Greater Element I](https://leetcode.com/problems/next-greater-element-i/)

**Problem Description**:
You are given two arrays (without duplicates) nums1 and nums2 where nums1's elements are subset of nums2. Find all the next greater numbers for nums1's elements in the corresponding places of nums2.

**Example**:
```
Input: nums1 = [4,1,2], nums2 = [1,3,4,2]
Output: [-1,3,-1]
Explanation:
For 4: no next greater element, return -1
For 1: next greater element is 3
For 2: no next greater element, return -1
```

**Python Solution**:
```python
def nextGreaterElement(nums1: list[int], nums2: list[int]) -> list[int]:
    # Step 1: Build a map of next greater elements for all elements in nums2
    next_greater = {}
    stack = []

    # Step 2: Process each element in nums2
    for num in nums2:
        # While stack is not empty and current num is greater than top of stack
        while stack and num > stack[-1]:
            # Pop element and map it to current num (its next greater)
            smaller = stack.pop()
            next_greater[smaller] = num

        # Push current number to stack
        stack.append(num)

    # Step 3: For remaining elements in stack, there's no next greater
    # (we don't need to explicitly set them, we'll use -1 as default)

    # Step 4: Build result for nums1 using the map
    result = []
    for num in nums1:
        # Get next greater from map, or -1 if not found
        result.append(next_greater.get(num, -1))

    return result
```

**TypeScript Solution**:
```typescript
function nextGreaterElement(nums1: number[], nums2: number[]): number[] {
    // Step 1: Build a map of next greater elements for all elements in nums2
    const nextGreater: Map<number, number> = new Map();
    const stack: number[] = [];

    // Step 2: Process each element in nums2
    for (const num of nums2) {
        // While stack is not empty and current num is greater than top of stack
        while (stack.length > 0 && num > stack[stack.length - 1]) {
            // Pop element and map it to current num (its next greater)
            const smaller = stack.pop()!;
            nextGreater.set(smaller, num);
        }

        // Push current number to stack
        stack.push(num);
    }

    // Step 3: For remaining elements in stack, there's no next greater
    // (we don't need to explicitly set them, we'll use -1 as default)

    // Step 4: Build result for nums1 using the map
    const result: number[] = [];
    for (const num of nums1) {
        // Get next greater from map, or -1 if not found
        result.push(nextGreater.get(num) ?? -1);
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n + m) - where n is length of nums2, m is length of nums1
- Space Complexity: O(n) - for the stack and map

---

### Problem 2: Next Greater Element II (Medium)
**LeetCode Link**: [503. Next Greater Element II](https://leetcode.com/problems/next-greater-element-ii/)

**Problem Description**:
Given a circular integer array nums, return the next greater number for every element. The next greater number of a number x is the first greater number to its traversing-order next in the array, which means you could search circularly.

**Example**:
```
Input: nums = [1,2,1]
Output: [2,-1,2]
Explanation:
For 1 at index 0: next greater is 2
For 2 at index 1: no next greater (it's the max)
For 1 at index 2: next greater is 2 (circular)
```

**Python Solution**:
```python
def nextGreaterElements(nums: list[int]) -> list[int]:
    n = len(nums)
    result = [-1] * n
    stack = []  # Store indices

    # Step 1: Process array twice to handle circular nature
    # We don't actually duplicate the array, just iterate twice
    for i in range(2 * n):
        # Use modulo to get actual index in circular array
        index = i % n
        num = nums[index]

        # Step 2: While current number is greater than top of stack
        while stack and num > nums[stack[-1]]:
            # Pop the index and set its next greater element
            prev_index = stack.pop()
            result[prev_index] = num

        # Step 3: Only push indices in first iteration
        # (we don't want to process same elements twice)
        if i < n:
            stack.append(index)

    # Step 4: Return result (elements still in stack have no next greater)
    return result
```

**TypeScript Solution**:
```typescript
function nextGreaterElements(nums: number[]): number[] {
    const n = nums.length;
    const result: number[] = new Array(n).fill(-1);
    const stack: number[] = [];  // Store indices

    // Step 1: Process array twice to handle circular nature
    // We don't actually duplicate the array, just iterate twice
    for (let i = 0; i < 2 * n; i++) {
        // Use modulo to get actual index in circular array
        const index = i % n;
        const num = nums[index];

        // Step 2: While current number is greater than top of stack
        while (stack.length > 0 && num > nums[stack[stack.length - 1]]) {
            // Pop the index and set its next greater element
            const prevIndex = stack.pop()!;
            result[prevIndex] = num;
        }

        // Step 3: Only push indices in first iteration
        // (we don't want to process same elements twice)
        if (i < n) {
            stack.push(index);
        }
    }

    // Step 4: Return result (elements still in stack have no next greater)
    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - we process 2n elements, each pushed/popped once
- Space Complexity: O(n) - for the stack and result array

---

### Problem 3: Daily Temperatures (Medium)
**LeetCode Link**: [739. Daily Temperatures](https://leetcode.com/problems/daily-temperatures/)

**Problem Description**:
Given an array of integers temperatures representing daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature.

**Example**:
```
Input: temperatures = [73,74,75,71,69,72,76,73]
Output: [1,1,4,2,1,1,0,0]
Explanation:
Day 0: Tomorrow (day 1) is warmer
Day 1: Tomorrow (day 2) is warmer
Day 2: Day 6 is next warmer day (4 days later)
...
```

**Python Solution**:
```python
def dailyTemperatures(temperatures: list[int]) -> list[int]:
    n = len(temperatures)
    result = [0] * n  # Default 0 means no warmer day
    stack = []  # Store indices of days

    # Step 1: Process each day
    for i in range(n):
        current_temp = temperatures[i]

        # Step 2: While stack not empty and current temp is warmer
        while stack and current_temp > temperatures[stack[-1]]:
            # Pop the previous day index
            prev_day = stack.pop()

            # Calculate days to wait (current day - previous day)
            result[prev_day] = i - prev_day

        # Step 3: Push current day to stack
        stack.append(i)

    # Step 4: Return result (days still in stack have result 0)
    return result
```

**TypeScript Solution**:
```typescript
function dailyTemperatures(temperatures: number[]): number[] {
    const n = temperatures.length;
    const result: number[] = new Array(n).fill(0);  // Default 0 means no warmer day
    const stack: number[] = [];  // Store indices of days

    // Step 1: Process each day
    for (let i = 0; i < n; i++) {
        const currentTemp = temperatures[i];

        // Step 2: While stack not empty and current temp is warmer
        while (stack.length > 0 && currentTemp > temperatures[stack[stack.length - 1]]) {
            // Pop the previous day index
            const prevDay = stack.pop()!;

            // Calculate days to wait (current day - previous day)
            result[prevDay] = i - prevDay;
        }

        // Step 3: Push current day to stack
        stack.push(i);
    }

    // Step 4: Return result (days still in stack have result 0)
    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each element pushed and popped at most once
- Space Complexity: O(n) - for the stack

---

### Problem 4: Largest Rectangle in Histogram (Hard)
**LeetCode Link**: [84. Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/)

**Problem Description**:
Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle in the histogram.

**Example**:
```
Input: heights = [2,1,5,6,2,3]
Output: 10
Explanation: The largest rectangle has height 5 and width 2 (bars at index 2 and 3)
```

**Python Solution**:
```python
def largestRectangleArea(heights: list[int]) -> int:
    # Step 1: Add sentinel value 0 at the end to clear the stack
    heights.append(0)
    stack = []  # Store indices of bars
    max_area = 0

    # Step 2: Process each bar
    for i in range(len(heights)):
        # Step 3: While current bar is shorter than bar at top of stack
        while stack and heights[i] < heights[stack[-1]]:
            # Pop the top bar - it's the height of our rectangle
            height_index = stack.pop()
            height = heights[height_index]

            # Calculate width:
            # If stack is empty, rectangle extends from start (width = i)
            # Otherwise, rectangle is between stack top and current (width = i - stack[-1] - 1)
            width = i if not stack else i - stack[-1] - 1

            # Calculate area and update max
            area = height * width
            max_area = max(max_area, area)

        # Step 4: Push current index to stack
        stack.append(i)

    # Step 5: Remove the sentinel value we added
    heights.pop()

    return max_area
```

**TypeScript Solution**:
```typescript
function largestRectangleArea(heights: number[]): number {
    // Step 1: Add sentinel value 0 at the end to clear the stack
    heights.push(0);
    const stack: number[] = [];  // Store indices of bars
    let maxArea = 0;

    // Step 2: Process each bar
    for (let i = 0; i < heights.length; i++) {
        // Step 3: While current bar is shorter than bar at top of stack
        while (stack.length > 0 && heights[i] < heights[stack[stack.length - 1]]) {
            // Pop the top bar - it's the height of our rectangle
            const heightIndex = stack.pop()!;
            const height = heights[heightIndex];

            // Calculate width:
            // If stack is empty, rectangle extends from start (width = i)
            // Otherwise, rectangle is between stack top and current (width = i - stack[-1] - 1)
            const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;

            // Calculate area and update max
            const area = height * width;
            maxArea = Math.max(maxArea, area);
        }

        // Step 4: Push current index to stack
        stack.push(i);
    }

    // Step 5: Remove the sentinel value we added
    heights.pop();

    return maxArea;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each bar pushed and popped once
- Space Complexity: O(n) - for the stack

---

### Problem 5: Trapping Rain Water (Hard)
**LeetCode Link**: [42. Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water/)

**Problem Description**:
Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

**Example**:
```
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
```

**Python Solution**:
```python
def trap(height: list[int]) -> int:
    # Step 1: Handle edge case
    if not height:
        return 0

    stack = []  # Store indices
    water = 0

    # Step 2: Process each bar
    for i in range(len(height)):
        # Step 3: While stack not empty and current bar is taller than stack top
        while stack and height[i] > height[stack[-1]]:
            # Pop the bottom of the water container
            bottom_index = stack.pop()
            bottom_height = height[bottom_index]

            # If stack is empty, no left boundary to trap water
            if not stack:
                break

            # Calculate trapped water
            # Left boundary is at stack top
            left_index = stack[-1]
            # Width is distance between boundaries minus 1
            width = i - left_index - 1
            # Height is limited by shorter boundary minus bottom
            bounded_height = min(height[left_index], height[i]) - bottom_height
            # Add water trapped in this section
            water += width * bounded_height

        # Step 4: Push current index
        stack.append(i)

    return water
```

**TypeScript Solution**:
```typescript
function trap(height: number[]): number {
    // Step 1: Handle edge case
    if (height.length === 0) {
        return 0;
    }

    const stack: number[] = [];  // Store indices
    let water = 0;

    // Step 2: Process each bar
    for (let i = 0; i < height.length; i++) {
        // Step 3: While stack not empty and current bar is taller than stack top
        while (stack.length > 0 && height[i] > height[stack[stack.length - 1]]) {
            // Pop the bottom of the water container
            const bottomIndex = stack.pop()!;
            const bottomHeight = height[bottomIndex];

            // If stack is empty, no left boundary to trap water
            if (stack.length === 0) {
                break;
            }

            // Calculate trapped water
            // Left boundary is at stack top
            const leftIndex = stack[stack.length - 1];
            // Width is distance between boundaries minus 1
            const width = i - leftIndex - 1;
            // Height is limited by shorter boundary minus bottom
            const boundedHeight = Math.min(height[leftIndex], height[i]) - bottomHeight;
            // Add water trapped in this section
            water += width * boundedHeight;
        }

        // Step 4: Push current index
        stack.push(i);
    }

    return water;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each bar pushed and popped once
- Space Complexity: O(n) - for the stack

---

### Problem 6: Online Stock Span (Medium)
**LeetCode Link**: [901. Online Stock Span](https://leetcode.com/problems/online-stock-span/)

**Problem Description**:
Design an algorithm that collects daily price quotes for some stock and returns the span of that stock's price for the current day. The span is the maximum number of consecutive days (starting from today and going backward) for which the stock price was less than or equal to today's price.

**Example**:
```
Input: ["StockSpanner", "next", "next", "next", "next", "next", "next", "next"]
       [[], [100], [80], [60], [70], [60], [75], [85]]
Output: [null, 1, 1, 1, 2, 1, 4, 6]
```

**Python Solution**:
```python
class StockSpanner:
    def __init__(self):
        # Step 1: Initialize stack to store (price, span) pairs
        self.stack = []

    def next(self, price: int) -> int:
        # Step 2: Initialize span as 1 (at least today)
        span = 1

        # Step 3: Pop all prices less than or equal to current price
        # and accumulate their spans
        while self.stack and self.stack[-1][0] <= price:
            # Pop the top and add its span to current span
            prev_price, prev_span = self.stack.pop()
            span += prev_span

        # Step 4: Push current price and its span
        self.stack.append((price, span))

        # Step 5: Return the span
        return span
```

**TypeScript Solution**:
```typescript
class StockSpanner {
    private stack: [number, number][];  // [price, span] pairs

    constructor() {
        // Step 1: Initialize stack to store (price, span) pairs
        this.stack = [];
    }

    next(price: number): number {
        // Step 2: Initialize span as 1 (at least today)
        let span = 1;

        // Step 3: Pop all prices less than or equal to current price
        // and accumulate their spans
        while (this.stack.length > 0 && this.stack[this.stack.length - 1][0] <= price) {
            // Pop the top and add its span to current span
            const [prevPrice, prevSpan] = this.stack.pop()!;
            span += prevSpan;
        }

        // Step 4: Push current price and its span
        this.stack.push([price, span]);

        // Step 5: Return the span
        return span;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(1) amortized - each price is pushed and popped once
- Space Complexity: O(n) - for the stack

---

### Problem 7: Remove K Digits (Medium)
**LeetCode Link**: [402. Remove K Digits](https://leetcode.com/problems/remove-k-digits/)

**Problem Description**:
Given string num representing a non-negative integer, and an integer k, remove k digits from the number so that the new number is the smallest possible.

**Example**:
```
Input: num = "1432219", k = 3
Output: "1219"
Explanation: Remove digits 4, 3, and 2 to form 1219
```

**Python Solution**:
```python
def removeKdigits(num: str, k: int) -> str:
    # Step 1: Use stack to build the result
    stack = []
    removed = 0

    # Step 2: Process each digit
    for digit in num:
        # Step 3: Remove larger digits from stack (monotonic increasing)
        # while we still have removals left
        while stack and removed < k and stack[-1] > digit:
            stack.pop()
            removed += 1

        # Step 4: Push current digit
        stack.append(digit)

    # Step 5: If we haven't removed k digits yet, remove from the end
    # (these are the largest remaining digits)
    while removed < k:
        stack.pop()
        removed += 1

    # Step 6: Convert stack to string and remove leading zeros
    result = ''.join(stack).lstrip('0')

    # Step 7: Return result or "0" if empty
    return result if result else "0"
```

**TypeScript Solution**:
```typescript
function removeKdigits(num: string, k: number): string {
    // Step 1: Use stack to build the result
    const stack: string[] = [];
    let removed = 0;

    // Step 2: Process each digit
    for (const digit of num) {
        // Step 3: Remove larger digits from stack (monotonic increasing)
        // while we still have removals left
        while (stack.length > 0 && removed < k && stack[stack.length - 1] > digit) {
            stack.pop();
            removed++;
        }

        // Step 4: Push current digit
        stack.push(digit);
    }

    // Step 5: If we haven't removed k digits yet, remove from the end
    // (these are the largest remaining digits)
    while (removed < k) {
        stack.pop();
        removed++;
    }

    // Step 6: Convert stack to string and remove leading zeros
    let result = stack.join('').replace(/^0+/, '');

    // Step 7: Return result or "0" if empty
    return result || "0";
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each digit pushed and popped once
- Space Complexity: O(n) - for the stack

---

### Problem 8: Sum of Subarray Minimums (Medium)
**LeetCode Link**: [907. Sum of Subarray Minimums](https://leetcode.com/problems/sum-of-subarray-minimums/)

**Problem Description**:
Given an array of integers arr, find the sum of min(b), where b ranges over every (contiguous) subarray of arr.

**Example**:
```
Input: arr = [3,1,2,4]
Output: 17
Explanation: Subarrays are [3], [1], [2], [4], [3,1], [1,2], [2,4], [3,1,2], [1,2,4], [3,1,2,4]
Minimums are 3, 1, 2, 4, 1, 1, 2, 1, 1, 1
Sum = 3 + 1 + 2 + 4 + 1 + 1 + 2 + 1 + 1 + 1 = 17
```

**Python Solution**:
```python
def sumSubarrayMins(arr: list[int]) -> int:
    MOD = 10**9 + 7
    n = len(arr)

    # Step 1: Find previous less element index for each element
    left = [0] * n  # Distance to previous less element
    stack = []

    for i in range(n):
        # Pop elements >= current element
        while stack and arr[stack[-1]] >= arr[i]:
            stack.pop()

        # If stack is empty, no previous less element
        # Otherwise, previous less is at stack top
        left[i] = i - stack[-1] if stack else i + 1
        stack.append(i)

    # Step 2: Find next less element index for each element
    right = [0] * n  # Distance to next less element
    stack = []

    for i in range(n - 1, -1, -1):
        # Pop elements > current element (use > not >= to avoid double counting)
        while stack and arr[stack[-1]] > arr[i]:
            stack.pop()

        # If stack is empty, no next less element
        # Otherwise, next less is at stack top
        right[i] = stack[-1] - i if stack else n - i
        stack.append(i)

    # Step 3: Calculate sum
    # For each element, it's the minimum in left[i] * right[i] subarrays
    result = 0
    for i in range(n):
        result = (result + arr[i] * left[i] * right[i]) % MOD

    return result
```

**TypeScript Solution**:
```typescript
function sumSubarrayMins(arr: number[]): number {
    const MOD = 1e9 + 7;
    const n = arr.length;

    // Step 1: Find previous less element index for each element
    const left: number[] = new Array(n).fill(0);  // Distance to previous less element
    let stack: number[] = [];

    for (let i = 0; i < n; i++) {
        // Pop elements >= current element
        while (stack.length > 0 && arr[stack[stack.length - 1]] >= arr[i]) {
            stack.pop();
        }

        // If stack is empty, no previous less element
        // Otherwise, previous less is at stack top
        left[i] = stack.length === 0 ? i + 1 : i - stack[stack.length - 1];
        stack.push(i);
    }

    // Step 2: Find next less element index for each element
    const right: number[] = new Array(n).fill(0);  // Distance to next less element
    stack = [];

    for (let i = n - 1; i >= 0; i--) {
        // Pop elements > current element (use > not >= to avoid double counting)
        while (stack.length > 0 && arr[stack[stack.length - 1]] > arr[i]) {
            stack.pop();
        }

        // If stack is empty, no next less element
        // Otherwise, next less is at stack top
        right[i] = stack.length === 0 ? n - i : stack[stack.length - 1] - i;
        stack.push(i);
    }

    // Step 3: Calculate sum
    // For each element, it's the minimum in left[i] * right[i] subarrays
    let result = 0;
    for (let i = 0; i < n; i++) {
        result = (result + arr[i] * left[i] * right[i]) % MOD;
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - three passes through the array
- Space Complexity: O(n) - for the stack and auxiliary arrays

---

### Problem 9: Maximum Width Ramp (Medium)
**LeetCode Link**: [962. Maximum Width Ramp](https://leetcode.com/problems/maximum-width-ramp/)

**Problem Description**:
A ramp in an integer array nums is a pair (i, j) for which i < j and nums[i] <= nums[j]. The width of such a ramp is j - i. Return the maximum width of a ramp in nums.

**Example**:
```
Input: nums = [6,0,8,2,1,5]
Output: 4
Explanation: Maximum width ramp is between index 1 (value 0) and index 5 (value 5)
```

**Python Solution**:
```python
def maxWidthRamp(nums: list[int]) -> int:
    n = len(nums)
    stack = []

    # Step 1: Build a decreasing stack of indices
    # This gives us all potential left boundaries
    for i in range(n):
        # Only add to stack if it's smaller than current top
        # (or stack is empty)
        if not stack or nums[i] < nums[stack[-1]]:
            stack.append(i)

    # Step 2: Traverse from right to left to find max width
    max_width = 0

    for j in range(n - 1, -1, -1):
        # While stack not empty and current element >= stack top
        while stack and nums[j] >= nums[stack[-1]]:
            # Pop index and calculate width
            i = stack.pop()
            max_width = max(max_width, j - i)

    return max_width
```

**TypeScript Solution**:
```typescript
function maxWidthRamp(nums: number[]): number {
    const n = nums.length;
    const stack: number[] = [];

    // Step 1: Build a decreasing stack of indices
    // This gives us all potential left boundaries
    for (let i = 0; i < n; i++) {
        // Only add to stack if it's smaller than current top
        // (or stack is empty)
        if (stack.length === 0 || nums[i] < nums[stack[stack.length - 1]]) {
            stack.push(i);
        }
    }

    // Step 2: Traverse from right to left to find max width
    let maxWidth = 0;

    for (let j = n - 1; j >= 0; j--) {
        // While stack not empty and current element >= stack top
        while (stack.length > 0 && nums[j] >= nums[stack[stack.length - 1]]) {
            // Pop index and calculate width
            const i = stack.pop()!;
            maxWidth = Math.max(maxWidth, j - i);
        }
    }

    return maxWidth;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - two passes through the array
- Space Complexity: O(n) - for the stack

---

### Problem 10: Car Fleet (Medium)
**LeetCode Link**: [853. Car Fleet](https://leetcode.com/problems/car-fleet/)

**Problem Description**:
There are n cars going to the same destination along a one-lane road. You are given two arrays position and speed, both of length n. Return the number of car fleets that will arrive at the destination.

**Example**:
```
Input: target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]
Output: 3
Explanation:
Cars starting at 10 and 8 become a fleet, meeting at 12.
Car starting at 0 arrives alone.
Cars starting at 5 and 3 become a fleet, meeting at 6.
```

**Python Solution**:
```python
def carFleet(target: int, position: list[int], speed: list[int]) -> int:
    # Step 1: Pair position and speed, then sort by position (descending)
    cars = sorted(zip(position, speed), reverse=True)

    # Step 2: Use stack to track fleets (store time to reach target)
    stack = []

    # Step 3: Process each car from closest to target to farthest
    for pos, spd in cars:
        # Calculate time to reach target for this car
        time = (target - pos) / spd

        # Step 4: If stack is empty or this car is slower than previous
        # (takes more time), it forms a new fleet
        if not stack or time > stack[-1]:
            stack.append(time)
        # Otherwise, this car catches up to previous fleet
        # (we don't add to stack)

    # Step 5: Number of elements in stack = number of fleets
    return len(stack)
```

**TypeScript Solution**:
```typescript
function carFleet(target: number, position: number[], speed: number[]): number {
    // Step 1: Pair position and speed, then sort by position (descending)
    const cars: [number, number][] = position.map((pos, i) => [pos, speed[i]]);
    cars.sort((a, b) => b[0] - a[0]);

    // Step 2: Use stack to track fleets (store time to reach target)
    const stack: number[] = [];

    // Step 3: Process each car from closest to target to farthest
    for (const [pos, spd] of cars) {
        // Calculate time to reach target for this car
        const time = (target - pos) / spd;

        // Step 4: If stack is empty or this car is slower than previous
        // (takes more time), it forms a new fleet
        if (stack.length === 0 || time > stack[stack.length - 1]) {
            stack.push(time);
        }
        // Otherwise, this car catches up to previous fleet
        // (we don't add to stack)
    }

    // Step 5: Number of elements in stack = number of fleets
    return stack.length;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(n) - for the cars array and stack

---

### Problem 11: Remove Duplicate Letters (Medium)
**LeetCode Link**: [316. Remove Duplicate Letters](https://leetcode.com/problems/remove-duplicate-letters/)

**Problem Description**:
Given a string s, remove duplicate letters so that every letter appears once and only once. You must make sure your result is the smallest in lexicographical order among all possible results.

**Example**:
```
Input: s = "bcabc"
Output: "abc"

Input: s = "cbacdcbc"
Output: "acdb"
```

**Python Solution**:
```python
def removeDuplicateLetters(s: str) -> str:
    # Step 1: Count occurrences of each character
    count = {}
    for char in s:
        count[char] = count.get(char, 0) + 1

    # Step 2: Track which characters are in result
    in_stack = set()
    stack = []

    # Step 3: Process each character
    for char in s:
        # Decrement count for this character
        count[char] -= 1

        # If already in result, skip
        if char in in_stack:
            continue

        # Step 4: Remove characters that are:
        # 1. Larger than current char (lexicographically)
        # 2. Will appear again later (count > 0)
        while stack and stack[-1] > char and count[stack[-1]] > 0:
            removed = stack.pop()
            in_stack.remove(removed)

        # Step 5: Add current character
        stack.append(char)
        in_stack.add(char)

    # Step 6: Convert stack to string
    return ''.join(stack)
```

**TypeScript Solution**:
```typescript
function removeDuplicateLetters(s: string): string {
    // Step 1: Count occurrences of each character
    const count: Map<string, number> = new Map();
    for (const char of s) {
        count.set(char, (count.get(char) || 0) + 1);
    }

    // Step 2: Track which characters are in result
    const inStack: Set<string> = new Set();
    const stack: string[] = [];

    // Step 3: Process each character
    for (const char of s) {
        // Decrement count for this character
        count.set(char, count.get(char)! - 1);

        // If already in result, skip
        if (inStack.has(char)) {
            continue;
        }

        // Step 4: Remove characters that are:
        // 1. Larger than current char (lexicographically)
        // 2. Will appear again later (count > 0)
        while (stack.length > 0 && stack[stack.length - 1] > char && count.get(stack[stack.length - 1])! > 0) {
            const removed = stack.pop()!;
            inStack.delete(removed);
        }

        // Step 5: Add current character
        stack.push(char);
        inStack.add(char);
    }

    // Step 6: Convert stack to string
    return stack.join('');
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each character pushed and popped once
- Space Complexity: O(1) - stack size is at most 26 (English letters)

---

### Problem 12: 132 Pattern (Medium)
**LeetCode Link**: [456. 132 Pattern](https://leetcode.com/problems/132-pattern/)

**Problem Description**:
Given an array of n integers nums, a 132 pattern is a subsequence of three integers nums[i], nums[j] and nums[k] such that i < j < k and nums[i] < nums[k] < nums[j].

**Example**:
```
Input: nums = [3,1,4,2]
Output: true
Explanation: There is a 132 pattern: [1, 4, 2]
```

**Python Solution**:
```python
def find132pattern(nums: list[int]) -> bool:
    # Step 1: Track the "3" value (middle value in 132 pattern)
    # We want to maximize this value
    third = float('-inf')
    stack = []  # Monotonic decreasing stack

    # Step 2: Traverse from right to left
    for i in range(len(nums) - 1, -1, -1):
        # Step 3: If we find a value less than third, we have 132 pattern
        # (current is "1", third is "2", something in stack was "3")
        if nums[i] < third:
            return True

        # Step 4: Pop all elements smaller than current
        # These could be potential "2" values
        while stack and nums[i] > stack[-1]:
            # Update third to be the largest value we pop
            # (this becomes our "2" in the pattern)
            third = stack.pop()

        # Step 5: Push current element (potential "3")
        stack.append(nums[i])

    # Step 6: No 132 pattern found
    return False
```

**TypeScript Solution**:
```typescript
function find132pattern(nums: number[]): boolean {
    // Step 1: Track the "3" value (middle value in 132 pattern)
    // We want to maximize this value
    let third = -Infinity;
    const stack: number[] = [];  // Monotonic decreasing stack

    // Step 2: Traverse from right to left
    for (let i = nums.length - 1; i >= 0; i--) {
        // Step 3: If we find a value less than third, we have 132 pattern
        // (current is "1", third is "2", something in stack was "3")
        if (nums[i] < third) {
            return true;
        }

        // Step 4: Pop all elements smaller than current
        // These could be potential "2" values
        while (stack.length > 0 && nums[i] > stack[stack.length - 1]) {
            // Update third to be the largest value we pop
            // (this becomes our "2" in the pattern)
            third = stack.pop()!;
        }

        // Step 5: Push current element (potential "3")
        stack.push(nums[i]);
    }

    // Step 6: No 132 pattern found
    return false;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through array
- Space Complexity: O(n) - for the stack

---

### Problem 13: Maximal Rectangle (Hard)
**LeetCode Link**: [85. Maximal Rectangle](https://leetcode.com/problems/maximal-rectangle/)

**Problem Description**:
Given a rows x cols binary matrix filled with 0's and 1's, find the largest rectangle containing only 1's and return its area.

**Example**:
```
Input: matrix = [
  ["1","0","1","0","0"],
  ["1","0","1","1","1"],
  ["1","1","1","1","1"],
  ["1","0","0","1","0"]
]
Output: 6
```

**Python Solution**:
```python
def maximalRectangle(matrix: list[list[str]]) -> int:
    if not matrix or not matrix[0]:
        return 0

    # Step 1: Helper function to find largest rectangle in histogram
    def largestRectangleArea(heights):
        heights.append(0)
        stack = []
        max_area = 0

        for i in range(len(heights)):
            while stack and heights[i] < heights[stack[-1]]:
                h = heights[stack.pop()]
                w = i if not stack else i - stack[-1] - 1
                max_area = max(max_area, h * w)
            stack.append(i)

        heights.pop()
        return max_area

    # Step 2: Build histogram for each row
    rows, cols = len(matrix), len(matrix[0])
    heights = [0] * cols
    max_area = 0

    # Step 3: Process each row
    for i in range(rows):
        for j in range(cols):
            # Update height: if current cell is 1, increment height
            # Otherwise, reset to 0
            if matrix[i][j] == '1':
                heights[j] += 1
            else:
                heights[j] = 0

        # Step 4: Find max rectangle for current histogram
        max_area = max(max_area, largestRectangleArea(heights[:]))

    return max_area
```

**TypeScript Solution**:
```typescript
function maximalRectangle(matrix: string[][]): number {
    if (matrix.length === 0 || matrix[0].length === 0) {
        return 0;
    }

    // Step 1: Helper function to find largest rectangle in histogram
    function largestRectangleArea(heights: number[]): number {
        heights.push(0);
        const stack: number[] = [];
        let maxArea = 0;

        for (let i = 0; i < heights.length; i++) {
            while (stack.length > 0 && heights[i] < heights[stack[stack.length - 1]]) {
                const h = heights[stack.pop()!];
                const w = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
                maxArea = Math.max(maxArea, h * w);
            }
            stack.push(i);
        }

        heights.pop();
        return maxArea;
    }

    // Step 2: Build histogram for each row
    const rows = matrix.length;
    const cols = matrix[0].length;
    const heights: number[] = new Array(cols).fill(0);
    let maxArea = 0;

    // Step 3: Process each row
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            // Update height: if current cell is 1, increment height
            // Otherwise, reset to 0
            if (matrix[i][j] === '1') {
                heights[j]++;
            } else {
                heights[j] = 0;
            }
        }

        // Step 4: Find max rectangle for current histogram
        maxArea = Math.max(maxArea, largestRectangleArea([...heights]));
    }

    return maxArea;
}
```

**Complexity Analysis**:
- Time Complexity: O(m * n) - where m is rows and n is columns
- Space Complexity: O(n) - for heights array and stack

---

### Problem 14: Asteroid Collision (Medium)
**LeetCode Link**: [735. Asteroid Collision](https://leetcode.com/problems/asteroid-collision/)

**Problem Description**:
We are given an array asteroids of integers representing asteroids in a row. For each asteroid, the absolute value represents its size, and the sign represents its direction (positive = right, negative = left). Each asteroid moves at the same speed. Find out the state of the asteroids after all collisions.

**Example**:
```
Input: asteroids = [5,10,-5]
Output: [5,10]
Explanation: The 10 and -5 collide resulting in 10. The 5 and 10 never collide.

Input: asteroids = [8,-8]
Output: []
Explanation: The 8 and -8 collide exploding each other.

Input: asteroids = [10,2,-5]
Output: [10]
Explanation: The 2 and -5 collide resulting in -5. The 10 and -5 collide resulting in 10.
```

**Python Solution**:
```python
def asteroidCollision(asteroids: list[int]) -> list[int]:
    # Step 1: Use stack to track surviving asteroids
    # Stack contains asteroids moving right (positive values)
    # and all asteroids moving left after all right-moving ones exploded
    stack = []

    # Step 2: Process each asteroid
    for asteroid in asteroids:
        # Step 3: Handle collision scenarios
        # Only collide if current is negative (left) and stack top is positive (right)
        while stack and asteroid < 0 < stack[-1]:
            # Compare sizes
            if stack[-1] < abs(asteroid):
                # Right-moving asteroid is smaller, it explodes
                stack.pop()
                continue  # Keep checking for more collisions
            elif stack[-1] == abs(asteroid):
                # Both same size, both explode
                stack.pop()
            # If stack[-1] > abs(asteroid), current asteroid explodes
            # (we don't add it to stack)
            break
        else:
            # No collision (or all right-moving asteroids destroyed)
            stack.append(asteroid)

    return stack

# Visualization for [10, 2, -5]:
# Step 1: stack = [10]          (10 moves right)
# Step 2: stack = [10, 2]       (2 moves right)
# Step 3: Process -5 (moves left)
#         Collision with 2: 2 < 5, so 2 explodes → stack = [10]
#         Collision with 10: 10 > 5, so -5 explodes
#         Final: stack = [10]
```

**TypeScript Solution**:
```typescript
function asteroidCollision(asteroids: number[]): number[] {
    // Step 1: Use stack to track surviving asteroids
    const stack: number[] = [];

    // Step 2: Process each asteroid
    for (const asteroid of asteroids) {
        // Step 3: Handle collision scenarios
        let survived = true;

        // Only collide if current is negative (left) and stack top is positive (right)
        while (stack.length > 0 && asteroid < 0 && stack[stack.length - 1] > 0) {
            const top = stack[stack.length - 1];

            if (top < Math.abs(asteroid)) {
                // Right-moving asteroid is smaller, it explodes
                stack.pop();
                continue;
            } else if (top === Math.abs(asteroid)) {
                // Both same size, both explode
                stack.pop();
            }
            // If top > abs(asteroid), current asteroid explodes
            survived = false;
            break;
        }

        if (survived) {
            stack.push(asteroid);
        }
    }

    return stack;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each asteroid is pushed and popped at most once
- Space Complexity: O(n) - for the stack

---

### Problem 15: Score of Parentheses (Medium)
**LeetCode Link**: [856. Score of Parentheses](https://leetcode.com/problems/score-of-parentheses/)

**Problem Description**:
Given a balanced parentheses string s, return the score of the string. The score of a balanced parentheses string is based on the following rule:
- "()" has score 1
- "AB" has score A + B, where A and B are balanced parentheses strings
- "(A)" has score 2 * A, where A is a balanced parentheses string

**Example**:
```
Input: s = "()"
Output: 1

Input: s = "(())"
Output: 2

Input: s = "()()"
Output: 2

Input: s = "(()(()))"
Output: 6
Explanation: "()" + "(())" = 1 + 2*2 = 1 + 4 = 5, but "(()())" = 2*(1+1) = 4,
             and "(()(()))" = 2*(1 + 2*1) = 2*3 = 6
```

**Python Solution**:
```python
def scoreOfParentheses(s: str) -> int:
    # Step 1: Use stack to track scores at each depth level
    # Stack stores the accumulated score at each nesting level
    stack = [0]  # Initialize with 0 for the base level

    # Step 2: Process each character
    for char in s:
        if char == '(':
            # Step 3: Start a new nesting level
            # Push 0 to track score at this new level
            stack.append(0)
        else:
            # Step 4: Close current level with ')'
            # Pop the current level's score
            current_score = stack.pop()

            # Calculate the score to add to previous level:
            # - If current_score is 0, this is "()" which scores 1
            # - Otherwise, this is "(A)" which scores 2 * A
            score_to_add = max(2 * current_score, 1)

            # Add to the previous level's score
            stack[-1] += score_to_add

    # Step 5: Return the final score (at base level)
    return stack[0]

# Visualization for "(()(()))":
# Process '(': stack = [0, 0]                    depth 1
# Process '(': stack = [0, 0, 0]                 depth 2
# Process ')': stack = [0, 0+1] = [0, 1]         () = 1
# Process '(': stack = [0, 1, 0]                 depth 2
# Process '(': stack = [0, 1, 0, 0]              depth 3
# Process ')': stack = [0, 1, 0+1] = [0, 1, 1]   () = 1
# Process ')': stack = [0, 1+2*1] = [0, 3]       (()) = 2*1
# Process ')': stack = [0+2*3] = [6]             (()(())) = 2*3
```

**TypeScript Solution**:
```typescript
function scoreOfParentheses(s: string): number {
    // Step 1: Use stack to track scores at each depth level
    const stack: number[] = [0];  // Initialize with 0 for the base level

    // Step 2: Process each character
    for (const char of s) {
        if (char === '(') {
            // Step 3: Start a new nesting level
            stack.push(0);
        } else {
            // Step 4: Close current level with ')'
            const currentScore = stack.pop()!;

            // Calculate the score to add to previous level
            const scoreToAdd = Math.max(2 * currentScore, 1);

            // Add to the previous level's score
            stack[stack.length - 1] += scoreToAdd;
        }
    }

    // Step 5: Return the final score (at base level)
    return stack[0];
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through the string
- Space Complexity: O(n) - stack depth equals nesting depth

---

### Problem 16: Minimum Cost Tree From Leaf Values (Medium)
**LeetCode Link**: [1130. Minimum Cost Tree From Leaf Values](https://leetcode.com/problems/minimum-cost-tree-from-leaf-values/)

**Problem Description**:
Given an array arr of positive integers, consider all binary trees such that each node has either 0 or 2 children, and the values of arr correspond to the values of each leaf in an in-order traversal of the tree. The value of each non-leaf node is equal to the product of the largest leaf value in its left and right subtree. Return the smallest possible sum of the values of each non-leaf node.

**Example**:
```
Input: arr = [6,2,4]
Output: 32
Explanation: Two possible trees with sum 32:
       24          12
      /  \        /  \
     6   8       6   8
        / \          / \
       2   4        4   2
```

**Python Solution**:
```python
def mctFromLeafValues(arr: list[int]) -> int:
    # Step 1: Use monotonic decreasing stack
    # Key insight: Pair each element with its nearest larger neighbors
    # The cost is minimized by pairing smaller elements first

    result = 0
    stack = [float('inf')]  # Sentinel value to simplify logic

    # Step 2: Process each element
    for num in arr:
        # Step 3: While current num is larger than stack top
        # Pop smaller elements and calculate their contribution
        while stack[-1] <= num:
            # Pop the middle value (smallest among three)
            middle = stack.pop()

            # Pair middle with the smaller of its neighbors
            # left neighbor: stack[-1], right neighbor: num
            # Use the smaller one to minimize cost
            result += middle * min(stack[-1], num)

        # Step 4: Push current number
        stack.append(num)

    # Step 5: Process remaining elements in stack
    # Pair each with its left neighbor (larger one)
    while len(stack) > 2:
        middle = stack.pop()
        result += middle * stack[-1]

    return result

# Visualization for [6,2,4]:
# stack = [inf]
# Process 6: stack = [inf, 6]
# Process 2: 2 < 6, stack = [inf, 6, 2]
# Process 4: 4 > 2
#   - Pop 2, pair with min(6, 4) = 4 → cost += 2*4 = 8
#   - 4 < 6, stack = [inf, 6, 4]
# Cleanup: Pop 4, pair with 6 → cost += 4*6 = 24
# Total: 8 + 24 = 32
```

**TypeScript Solution**:
```typescript
function mctFromLeafValues(arr: number[]): number {
    // Step 1: Use monotonic decreasing stack
    let result = 0;
    const stack: number[] = [Infinity];  // Sentinel value

    // Step 2: Process each element
    for (const num of arr) {
        // Step 3: While current num is larger than stack top
        while (stack[stack.length - 1] <= num) {
            const middle = stack.pop()!;
            result += middle * Math.min(stack[stack.length - 1], num);
        }

        // Step 4: Push current number
        stack.push(num);
    }

    // Step 5: Process remaining elements in stack
    while (stack.length > 2) {
        const middle = stack.pop()!;
        result += middle * stack[stack.length - 1];
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each element pushed and popped once
- Space Complexity: O(n) - for the stack

---

### Problem 17: Sum of Subarray Ranges (Medium)
**LeetCode Link**: [2104. Sum of Subarray Ranges](https://leetcode.com/problems/sum-of-subarray-ranges/)

**Problem Description**:
You are given an integer array nums. The range of a subarray is the difference between the largest and smallest element in the subarray. Return the sum of all subarray ranges of nums.

**Example**:
```
Input: nums = [1,2,3]
Output: 4
Explanation: The 6 subarrays are:
[1], range = 0
[2], range = 0
[3], range = 0
[1,2], range = 2 - 1 = 1
[2,3], range = 3 - 2 = 1
[1,2,3], range = 3 - 1 = 2
Sum = 0 + 0 + 0 + 1 + 1 + 2 = 4
```

**Python Solution**:
```python
def subArrayRanges(nums: list[int]) -> int:
    # Step 1: Key insight - Range = Max - Min
    # Sum of ranges = Sum of max values - Sum of min values
    # Use monotonic stack to find contribution of each element

    n = len(nums)

    # Step 2: Calculate sum of maximums in all subarrays
    def sum_of_maxs():
        result = 0
        stack = []

        for i in range(n + 1):
            # Use sentinel value at the end
            current = nums[i] if i < n else float('inf')

            # Monotonic decreasing stack
            while stack and (i == n or nums[stack[-1]] < current):
                index = stack.pop()
                left = stack[-1] if stack else -1
                right = i

                # Count subarrays where nums[index] is the maximum
                count = (index - left) * (right - index)
                result += nums[index] * count

            if i < n:
                stack.append(i)

        return result

    # Step 3: Calculate sum of minimums in all subarrays
    def sum_of_mins():
        result = 0
        stack = []

        for i in range(n + 1):
            # Use sentinel value at the end
            current = nums[i] if i < n else float('-inf')

            # Monotonic increasing stack
            while stack and (i == n or nums[stack[-1]] > current):
                index = stack.pop()
                left = stack[-1] if stack else -1
                right = i

                # Count subarrays where nums[index] is the minimum
                count = (index - left) * (right - index)
                result += nums[index] * count

            if i < n:
                stack.append(i)

        return result

    # Step 4: Return difference
    return sum_of_maxs() - sum_of_mins()
```

**TypeScript Solution**:
```typescript
function subArrayRanges(nums: number[]): number {
    const n = nums.length;

    // Calculate sum of maximums in all subarrays
    function sumOfMaxs(): number {
        let result = 0;
        const stack: number[] = [];

        for (let i = 0; i <= n; i++) {
            const current = i < n ? nums[i] : Infinity;

            while (stack.length > 0 && (i === n || nums[stack[stack.length - 1]] < current)) {
                const index = stack.pop()!;
                const left = stack.length > 0 ? stack[stack.length - 1] : -1;
                const right = i;

                const count = (index - left) * (right - index);
                result += nums[index] * count;
            }

            if (i < n) {
                stack.push(i);
            }
        }

        return result;
    }

    // Calculate sum of minimums in all subarrays
    function sumOfMins(): number {
        let result = 0;
        const stack: number[] = [];

        for (let i = 0; i <= n; i++) {
            const current = i < n ? nums[i] : -Infinity;

            while (stack.length > 0 && (i === n || nums[stack[stack.length - 1]] > current)) {
                const index = stack.pop()!;
                const left = stack.length > 0 ? stack[stack.length - 1] : -1;
                const right = i;

                const count = (index - left) * (right - index);
                result += nums[index] * count;
            }

            if (i < n) {
                stack.push(i);
            }
        }

        return result;
    }

    return sumOfMaxs() - sumOfMins();
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - two passes through the array
- Space Complexity: O(n) - for the stack

---

### Problem 18: Number of Visible People in a Queue (Hard)
**LeetCode Link**: [1944. Number of Visible People in a Queue](https://leetcode.com/problems/number-of-visible-people-in-a-queue/)

**Problem Description**:
There are n people standing in a queue, and they are numbered from 0 to n - 1 in left to right order. You are given an array heights where heights[i] represents the height of the ith person. A person can see another person to their right if everybody in between is shorter than both of them. Return an array answer where answer[i] is the number of people the ith person can see to their right.

**Example**:
```
Input: heights = [10,6,8,5,11,9]
Output: [3,1,2,1,1,0]
Explanation:
Person 0 can see persons 1, 2, 4 (heights 6, 8, 11)
Person 1 can see person 2 (height 8)
Person 2 can see persons 3, 4 (heights 5, 11)
Person 3 can see person 4 (height 11)
Person 4 can see person 5 (height 9)
Person 5 can see nobody
```

**Python Solution**:
```python
def canSeePersonsCount(heights: list[int]) -> list[int]:
    # Step 1: Use monotonic decreasing stack
    # Each person can see people to their right until a taller person
    n = len(heights)
    result = [0] * n
    stack = []  # Store indices

    # Step 2: Process from right to left
    for i in range(n - 1, -1, -1):
        visible_count = 0

        # Step 3: Pop all shorter people from stack
        # Current person can see all of them
        while stack and heights[i] > heights[stack[-1]]:
            stack.pop()
            visible_count += 1

        # Step 4: If stack not empty, current person can also see
        # the first taller person (or equal)
        if stack:
            visible_count += 1

        result[i] = visible_count

        # Step 5: Push current index to stack
        stack.append(i)

    return result

# Visualization for [10,6,8,5,11,9]:
# i=5 (9): stack=[], visible=0, result[5]=0, stack=[5]
# i=4 (11): 11>9, pop 5, visible=1, stack empty, result[4]=1, stack=[4]
# i=3 (5): 5<11, visible=0+1=1, result[3]=1, stack=[4,3]
# i=2 (8): 8>5, pop 3, visible=1; 8<11, visible=2, result[2]=2, stack=[4,2]
# i=1 (6): 6<8, visible=0+1=1, result[1]=1, stack=[4,2,1]
# i=0 (10): 10>6, pop 1, visible=1; 10>8, pop 2, visible=2; 10<11, visible=3
#           result[0]=3, stack=[4,0]
```

**TypeScript Solution**:
```typescript
function canSeePersonsCount(heights: number[]): number[] {
    const n = heights.length;
    const result: number[] = new Array(n).fill(0);
    const stack: number[] = [];  // Store indices

    // Process from right to left
    for (let i = n - 1; i >= 0; i--) {
        let visibleCount = 0;

        // Pop all shorter people from stack
        while (stack.length > 0 && heights[i] > heights[stack[stack.length - 1]]) {
            stack.pop();
            visibleCount++;
        }

        // If stack not empty, can see the first taller person
        if (stack.length > 0) {
            visibleCount++;
        }

        result[i] = visibleCount;
        stack.push(i);
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each element pushed and popped once
- Space Complexity: O(n) - for the stack

---

### Problem 19: Longest Well-Performing Interval (Medium)
**LeetCode Link**: [1124. Longest Well-Performing Interval](https://leetcode.com/problems/longest-well-performing-interval/)

**Problem Description**:
We are given hours, a list of the number of hours worked per day for a given employee. A day is considered to be a tiring day if and only if the number of hours worked is strictly greater than 8. A well-performing interval is an interval of days for which the number of tiring days is strictly larger than the number of non-tiring days. Return the length of the longest well-performing interval.

**Example**:
```
Input: hours = [9,9,6,0,6,6,9]
Output: 3
Explanation: The longest well-performing interval is [9,9,6] (3 days)
```

**Python Solution**:
```python
def longestWPI(hours: list[int]) -> int:
    # Step 1: Transform problem - convert to +1 for tiring (>8), -1 for non-tiring
    # Find longest subarray with sum > 0

    # Step 2: Use prefix sum and monotonic stack
    # For each position, we want to find the earliest position with smaller prefix sum
    n = len(hours)
    prefix_sum = [0]  # prefix_sum[i] = sum of first i elements

    # Build prefix sum array
    for hour in hours:
        score = 1 if hour > 8 else -1
        prefix_sum.append(prefix_sum[-1] + score)

    # Step 3: Build monotonic decreasing stack of indices
    # Stack contains indices where prefix_sum is strictly decreasing
    stack = []
    for i in range(len(prefix_sum)):
        if not stack or prefix_sum[i] < prefix_sum[stack[-1]]:
            stack.append(i)

    # Step 4: Find longest interval by scanning from right
    max_length = 0

    # Scan from right to left
    for j in range(len(prefix_sum) - 1, -1, -1):
        # Pop all indices where prefix_sum[i] < prefix_sum[j]
        # This means interval (i, j] has sum > 0
        while stack and prefix_sum[stack[-1]] < prefix_sum[j]:
            i = stack.pop()
            max_length = max(max_length, j - i)

    return max_length

# Visualization for [9,9,6,0,6,6,9]:
# Transform: [1,1,-1,-1,-1,-1,1]
# Prefix: [0,1,2,1,0,-1,-2,-1]
# Indices: 0 1 2 3 4  5  6  7
#
# Stack (decreasing): [0,4,5,6] (values: [0,0,-1,-2])
# Scan from right:
#   j=7 (val=-1): pop 6 (val=-2), length=7-6=1
#   j=6 (val=-2): skip
#   j=5 (val=-1): skip
#   j=4 (val=0): skip
#   j=3 (val=1): pop 5 (val=-1), length=3-5=-2? No, 5 already popped
#                pop 4 (val=0), length=3-4=-1? No, 4 already popped
#                pop 0 (val=0), length=3-0=3 ✓
```

**TypeScript Solution**:
```typescript
function longestWPI(hours: number[]): number {
    const n = hours.length;
    const prefixSum: number[] = [0];

    // Build prefix sum array
    for (const hour of hours) {
        const score = hour > 8 ? 1 : -1;
        prefixSum.push(prefixSum[prefixSum.length - 1] + score);
    }

    // Build monotonic decreasing stack
    const stack: number[] = [];
    for (let i = 0; i < prefixSum.length; i++) {
        if (stack.length === 0 || prefixSum[i] < prefixSum[stack[stack.length - 1]]) {
            stack.push(i);
        }
    }

    // Find longest interval
    let maxLength = 0;

    for (let j = prefixSum.length - 1; j >= 0; j--) {
        while (stack.length > 0 && prefixSum[stack[stack.length - 1]] < prefixSum[j]) {
            const i = stack.pop()!;
            maxLength = Math.max(maxLength, j - i);
        }
    }

    return maxLength;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - building prefix sum, stack, and scanning
- Space Complexity: O(n) - for prefix sum array and stack

---

### Problem 20: Maximum Score of a Good Subarray (Hard)
**LeetCode Link**: [1793. Maximum Score of a Good Subarray](https://leetcode.com/problems/maximum-score-of-a-good-subarray/)

**Problem Description**:
You are given an array of integers nums (0-indexed) and an integer k. The score of a subarray (i, j) is defined as min(nums[i], nums[i+1], ..., nums[j]) * (j - i + 1). A good subarray is a subarray where i <= k <= j. Return the maximum possible score of a good subarray.

**Example**:
```
Input: nums = [1,4,3,7,4,5], k = 3
Output: 15
Explanation: The optimal subarray is (1, 5) with a score of min(4,3,7,4,5) * 5 = 3 * 5 = 15
```

**Python Solution**:
```python
def maximumScore(nums: list[int], k: int) -> int:
    # Step 1: Two-pointer approach from index k
    # Expand the window to include elements, tracking minimum
    n = len(nums)
    left = right = k
    min_val = nums[k]
    max_score = nums[k]

    # Step 2: Expand window while possible
    while left > 0 or right < n - 1:
        # Step 3: Choose which side to expand
        # Always expand towards the larger value to maximize score
        left_val = nums[left - 1] if left > 0 else -1
        right_val = nums[right + 1] if right < n - 1 else -1

        if left_val > right_val:
            # Expand left
            left -= 1
            min_val = min(min_val, nums[left])
        else:
            # Expand right
            right += 1
            min_val = min(min_val, nums[right])

        # Step 4: Calculate score with current window
        score = min_val * (right - left + 1)
        max_score = max(max_score, score)

    return max_score

# Alternative solution using monotonic stack:
def maximumScore_stack(nums: list[int], k: int) -> int:
    # Step 1: For each element as minimum, find the largest range containing k
    n = len(nums)

    # Find previous less element for each position
    left_bound = [-1] * n
    stack = []
    for i in range(n):
        while stack and nums[stack[-1]] >= nums[i]:
            stack.pop()
        left_bound[i] = stack[-1] if stack else -1
        stack.append(i)

    # Find next less element for each position
    right_bound = [n] * n
    stack = []
    for i in range(n - 1, -1, -1):
        while stack and nums[stack[-1]] >= nums[i]:
            stack.pop()
        right_bound[i] = stack[-1] if stack else n
        stack.append(i)

    # Calculate max score where range contains k
    max_score = 0
    for i in range(n):
        left = left_bound[i] + 1
        right = right_bound[i] - 1

        # Check if range contains k
        if left <= k <= right:
            score = nums[i] * (right - left + 1)
            max_score = max(max_score, score)

    return max_score
```

**TypeScript Solution**:
```typescript
function maximumScore(nums: number[], k: number): number {
    const n = nums.length;
    let left = k, right = k;
    let minVal = nums[k];
    let maxScore = nums[k];

    // Expand window while possible
    while (left > 0 || right < n - 1) {
        const leftVal = left > 0 ? nums[left - 1] : -1;
        const rightVal = right < n - 1 ? nums[right + 1] : -1;

        if (leftVal > rightVal) {
            left--;
            minVal = Math.min(minVal, nums[left]);
        } else {
            right++;
            minVal = Math.min(minVal, nums[right]);
        }

        const score = minVal * (right - left + 1);
        maxScore = Math.max(maxScore, score);
    }

    return maxScore;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - expanding window from k to both ends
- Space Complexity: O(1) - only using a few variables

---

### Problem 21: Steps to Make Array Non-decreasing (Medium)
**LeetCode Link**: [2289. Steps to Make Array Non-decreasing](https://leetcode.com/problems/steps-to-make-array-non-decreasing/)

**Problem Description**:
You are given a 0-indexed integer array nums. In one step, remove all elements nums[i] where nums[i - 1] > nums[i] for all 0 < i < nums.length. Return the number of steps performed until nums becomes a non-decreasing array.

**Example**:
```
Input: nums = [5,3,4,4,7,3,6,11,8,5,11]
Output: 3
Explanation:
Step 1: [5,3,4,4,7,3,6,11,8,5,11] → [5,4,4,7,6,11,11] (remove 3,3,8,5)
Step 2: [5,4,4,7,6,11,11] → [5,7,11,11] (remove 4,4,6)
Step 3: [5,7,11,11] → [5,7,11,11] (already non-decreasing)
```

**Python Solution**:
```python
def totalSteps(nums: list[int]) -> int:
    # Step 1: Use monotonic decreasing stack
    # Track how many steps each element needs to be removed
    n = len(nums)
    stack = []  # Store (value, steps_to_remove)
    max_steps = 0

    # Step 2: Process from right to left
    for i in range(n - 1, -1, -1):
        steps = 0

        # Step 3: Pop all smaller elements
        # They will be removed by current element
        while stack and nums[i] > stack[-1][0]:
            _, prev_steps = stack.pop()
            # Current element removes this, so it takes at least 1 step
            # But might take more if the removed element itself took steps
            steps = max(steps + 1, prev_steps)

        # Step 4: Track maximum steps needed
        max_steps = max(max_steps, steps)

        # Step 5: Push current element with its steps
        stack.append((nums[i], steps))

    return max_steps

# Visualization for [5,3,4,4,7,3,6,11,8,5,11]:
# Process from right to left:
# i=10 (11): stack=[(11,0)]
# i=9 (5): 5<11, stack=[(11,0),(5,0)]
# i=8 (8): 8>5, pop (5,0), steps=1; 8<11, stack=[(11,0),(8,1)]
# i=7 (11): 11>8, pop (8,1), steps=max(1,1)=1; 11>=11, stack=[(11,0),(11,1)]
# ... continue processing
```

**TypeScript Solution**:
```typescript
function totalSteps(nums: number[]): number {
    const n = nums.length;
    const stack: [number, number][] = [];  // [value, steps_to_remove]
    let maxSteps = 0;

    // Process from right to left
    for (let i = n - 1; i >= 0; i--) {
        let steps = 0;

        // Pop all smaller elements
        while (stack.length > 0 && nums[i] > stack[stack.length - 1][0]) {
            const [_, prevSteps] = stack.pop()!;
            steps = Math.max(steps + 1, prevSteps);
        }

        maxSteps = Math.max(maxSteps, steps);
        stack.push([nums[i], steps]);
    }

    return maxSteps;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each element pushed and popped once
- Space Complexity: O(n) - for the stack

---

### Problem 22: Find the Most Competitive Subsequence (Medium)
**LeetCode Link**: [1673. Find the Most Competitive Subsequence](https://leetcode.com/problems/find-the-most-competitive-subsequence/)

**Problem Description**:
Given an integer array nums and a positive integer k, return the most competitive subsequence of nums of size k. A subsequence is most competitive if it has the smallest lexicographical order among all subsequences of size k.

**Example**:
```
Input: nums = [3,5,2,6], k = 2
Output: [2,6]
Explanation: Among [3,5], [3,2], [3,6], [5,2], [5,6], [2,6],
the most competitive is [2,6]

Input: nums = [2,4,3,3,5,4,9,6], k = 4
Output: [2,3,3,4]
```

**Python Solution**:
```python
def mostCompetitive(nums: list[int], k: int) -> list[int]:
    # Step 1: Use monotonic increasing stack
    # Keep smaller elements, remove larger ones if we have room
    stack = []
    n = len(nums)

    # Step 2: Process each element
    for i in range(n):
        # Step 3: Remove larger elements from stack
        # Only if we have enough remaining elements to fill k positions
        # remaining = n - i (including current)
        # need = k - len(stack)
        # can remove if: len(stack) + remaining - 1 >= k
        #                → remaining > k - len(stack)
        #                → n - i > k - len(stack)

        while (stack and
               stack[-1] > nums[i] and
               len(stack) + n - i > k):
            stack.pop()

        # Step 4: Add current element if we haven't reached k yet
        if len(stack) < k:
            stack.append(nums[i])

    return stack

# Visualization for [3,5,2,6], k=2:
# i=0 (3): stack=[], add 3, stack=[3]
# i=1 (5): stack=[3], 5>3, add 5, stack=[3,5]
# i=2 (2): stack=[3,5], can remove? len(4-2)=2 > k-len(2-2)=0, yes!
#          pop 5, stack=[3]
#          can remove 3? len(4-2)=2 > k-len(2-1)=1, yes!
#          pop 3, stack=[]
#          add 2, stack=[2]
# i=3 (6): stack=[2], len(2)==k, don't add, stack=[2,6]
# Wait, that's wrong. Let me recalculate:
# i=3 (6): stack=[2], len(2)<k, add 6, stack=[2,6]
```

**TypeScript Solution**:
```typescript
function mostCompetitive(nums: number[], k: number): number[] {
    const stack: number[] = [];
    const n = nums.length;

    for (let i = 0; i < n; i++) {
        // Remove larger elements if we have enough remaining
        while (stack.length > 0 &&
               stack[stack.length - 1] > nums[i] &&
               stack.length + n - i > k) {
            stack.pop();
        }

        // Add current element if haven't reached k yet
        if (stack.length < k) {
            stack.push(nums[i]);
        }
    }

    return stack;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each element pushed and popped once
- Space Complexity: O(k) - stack holds at most k elements

---

### Problem 23: Count Collisions on a Road (Medium)
**LeetCode Link**: [2211. Count Collisions on a Road](https://leetcode.com/problems/count-collisions-on-a-road/)

**Problem Description**:
There are n cars on an infinitely long road. You are given a string directions where directions[i] can be 'L', 'R', or 'S' denoting whether the ith car is moving left, right, or staying respectively. Each moving car has the same speed. Count the number of collisions on the road.

**Example**:
```
Input: directions = "RLRSLL"
Output: 5
Explanation:
- Cars 0 and 1 collide (R meets L). Both become S. (2 collisions)
- Car 2 collides with car 1 (now S). (1 collision)
- Car 3 stays.
- Cars 4 and 5 collide with car 3. (2 collisions)
Total: 5 collisions

Input: directions = "LLRR"
Output: 0
Explanation: No collisions occur.
```

**Python Solution**:
```python
def countCollisions(directions: str) -> int:
    # Step 1: Use stack to simulate collisions
    # Stack tracks the current state of cars from left to right
    stack = []
    collisions = 0

    # Step 2: Process each car
    for direction in directions:
        # Step 3: Handle different cases
        if direction == 'R':
            # Moving right, just add to stack
            stack.append('R')

        elif direction == 'L':
            if not stack:
                # No collision possible, moving left into empty space
                stack.append('L')
            elif stack[-1] == 'L':
                # Both moving left, no collision
                stack.append('L')
            elif stack[-1] == 'S':
                # Collides with stationary car, becomes stationary
                collisions += 1
                # Stack top stays 'S'
            else:  # stack[-1] == 'R'
                # Right meets Left, both become stationary
                collisions += 2
                stack.pop()  # Remove 'R'

                # Chain reaction: check if more cars collide
                while stack and stack[-1] == 'R':
                    stack.pop()
                    collisions += 1

                # Add stationary car
                stack.append('S')

        else:  # direction == 'S'
            # Stationary car
            # Check if any right-moving cars collide with it
            while stack and stack[-1] == 'R':
                stack.pop()
                collisions += 1

            stack.append('S')

    return collisions

# Visualization for "RLRSLL":
# Process R: stack=['R']
# Process L: 'R' meets 'L', collisions+=2, stack=['S']
# Process R: stack=['S','R']
# Process S: 'R' meets 'S', collisions+=1, stack=['S','S']
# Process L: 'S' meets 'L', collisions+=1, stack=['S','S']
# Process L: 'S' meets 'L', collisions+=1, stack=['S','S']
# Total: 2+1+1+1 = 5
```

**TypeScript Solution**:
```typescript
function countCollisions(directions: string): number {
    const stack: string[] = [];
    let collisions = 0;

    for (const direction of directions) {
        if (direction === 'R') {
            stack.push('R');
        } else if (direction === 'L') {
            if (stack.length === 0 || stack[stack.length - 1] === 'L') {
                stack.push('L');
            } else if (stack[stack.length - 1] === 'S') {
                collisions++;
            } else {  // stack top is 'R'
                collisions += 2;
                stack.pop();

                // Chain reaction
                while (stack.length > 0 && stack[stack.length - 1] === 'R') {
                    stack.pop();
                    collisions++;
                }

                stack.push('S');
            }
        } else {  // direction === 'S'
            while (stack.length > 0 && stack[stack.length - 1] === 'R') {
                stack.pop();
                collisions++;
            }
            stack.push('S');
        }
    }

    return collisions;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - each car processed once, each pushed/popped at most once
- Space Complexity: O(n) - for the stack

---

## Practice Tips

1. **Understand the monotonic property**: Know when to use increasing vs decreasing stack
   - Decreasing stack: for next/previous greater element
   - Increasing stack: for next/previous smaller element

2. **Stack contents**: Usually store indices, not values
   - Indices allow you to calculate distances/widths
   - You can always access values via the index

3. **When to pop**: The popping condition is crucial
   - Pop when monotonic property is violated
   - When you pop, you've found the answer for that element

4. **Sentinel values**: Adding 0 or infinity at the end can simplify logic
   - Forces all elements to be processed
   - Avoids extra loop to handle remaining stack elements

5. **Common mistakes**:
   - Storing values instead of indices
   - Wrong comparison (> vs >=)
   - Forgetting to handle empty stack
   - Not considering circular arrays

6. **Pattern variations**:
   - Next greater/smaller element
   - Previous greater/smaller element
   - Histogram problems
   - Range where element is min/max
   - Stack with additional data (like span)

7. **Testing strategy**:
   - Test with strictly increasing array
   - Test with strictly decreasing array
   - Test with all equal elements
   - Test with circular array if applicable
