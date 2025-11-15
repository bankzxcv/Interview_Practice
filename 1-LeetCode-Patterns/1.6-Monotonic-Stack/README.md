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

```
Example: Next Greater Element for [2, 1, 5, 6, 2, 3]

Monotonic Decreasing Stack (for next greater element):

Process 2: Stack: [2]
Process 1: Stack: [2, 1]  (1 < 2, keep decreasing)
Process 5: Pop 1 (5 > 1, next greater of 1 is 5)
           Pop 2 (5 > 2, next greater of 2 is 5)
           Stack: [5]
Process 6: Pop 5 (6 > 5, next greater of 5 is 6)
           Stack: [6]
Process 2: Stack: [6, 2]  (2 < 6, keep decreasing)
Process 3: Pop 2 (3 > 2, next greater of 2 is 3)
           Stack: [6, 3]

Result: [5, 5, 6, -1, 3, -1]
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
