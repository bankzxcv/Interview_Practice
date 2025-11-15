# Pattern 1.9: Modified Binary Search

## Pattern Overview

### What is Modified Binary Search?
Modified Binary Search extends the classic binary search algorithm to solve problems beyond simple element lookup in sorted arrays. It's a powerful technique that exploits the property of ordered data to achieve logarithmic time complexity even in complex scenarios.

### When to Use It?
- Searching in rotated sorted arrays
- Finding peak elements
- Searching in 2D sorted matrices
- Finding minimum/maximum in sorted or partially sorted data
- Finding the kth smallest/largest element
- Problems involving "search space" reduction
- Optimization problems where you can verify a solution quickly

### Time/Space Complexity Benefits
- **Time Complexity**: O(log n) - eliminates half of search space in each iteration
- **Space Complexity**: O(1) for iterative, O(log n) for recursive (call stack)
- Massive improvement over linear O(n) search

### Visual Diagram

```
Standard Binary Search:
[1, 2, 3, 4, 5, 6, 7, 8, 9] target = 6
 L              M           R
                ↓
          [6, 7, 8, 9]
           L  M     R
           ↓
          [6, 7]
           L=M=R  ✓ Found!

Modified Binary Search (Rotated Array):
[4, 5, 6, 7, 0, 1, 2] target = 0
 L        M        R
 ↓
 Left half [4,5,6,7] is sorted but target not in range
 Search right half → [0, 1, 2]
          L  M  R
          ✓ Found!
```

## Recognition Guidelines

### How to Identify This Pattern

Look for these **key indicators**:
1. Array/list is **sorted** or **partially sorted**
2. Need to find an element in **O(log n)** time
3. Problem mentions:
   - "Find target in rotated sorted array"
   - "Find peak element"
   - "Search in 2D matrix"
   - "Find minimum/maximum"
   - "Find first/last occurrence"
4. Input size is large (binary search efficiency matters)
5. Can eliminate half of search space based on some condition

### Key Phrases/Indicators
- "sorted array"
- "rotated"
- "find peak"
- "search in matrix"
- "minimum" / "maximum"
- "first occurrence" / "last occurrence"
- "O(log n) time"

## Template/Pseudocode

### Basic Template

```python
def binary_search_template(arr, target):
    # Step 1: Initialize boundaries
    left, right = 0, len(arr) - 1

    # Step 2: Search while valid search space exists
    while left <= right:
        # Step 3: Calculate middle (avoid overflow)
        mid = left + (right - left) // 2

        # Step 4: Check if found
        if arr[mid] == target:
            return mid

        # Step 5: Decide which half to search
        if condition_to_go_left:
            right = mid - 1
        else:
            left = mid + 1

    # Step 6: Target not found
    return -1
```

### Modified Template (For Finding Boundaries)

```python
def find_boundary(arr):
    left, right = 0, len(arr) - 1
    result = -1

    while left <= right:
        mid = left + (right - left) // 2

        # Check condition and save potential answer
        if meets_condition(arr[mid]):
            result = mid  # Save this as potential answer
            # Continue searching for better answer
            right = mid - 1  # or left = mid + 1
        else:
            left = mid + 1   # or right = mid - 1

    return result
```

---

## Problems

### Problem 1: Binary Search (Easy)
**LeetCode Link**: [704. Binary Search](https://leetcode.com/problems/binary-search/)

**Description**: Given a sorted array of integers `nums` and an integer `target`, write a function to search `target` in `nums`. If `target` exists, return its index. Otherwise, return -1.

#### Python Solution
```python
def search(nums: list[int], target: int) -> int:
    # Step 1: Initialize left and right pointers at array boundaries
    left, right = 0, len(nums) - 1

    # Step 2: Continue searching while search space exists
    while left <= right:
        # Step 3: Calculate middle index (prevents integer overflow)
        mid = left + (right - left) // 2

        # Step 4: Check if we found the target
        if nums[mid] == target:
            return mid

        # Step 5: Target is in right half
        elif nums[mid] < target:
            left = mid + 1

        # Step 6: Target is in left half
        else:
            right = mid - 1

    # Step 7: Target not found in array
    return -1
```

#### TypeScript Solution
```typescript
function search(nums: number[], target: number): number {
    // Step 1: Initialize left and right pointers at array boundaries
    let left = 0;
    let right = nums.length - 1;

    // Step 2: Continue searching while search space exists
    while (left <= right) {
        // Step 3: Calculate middle index (prevents integer overflow)
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Check if we found the target
        if (nums[mid] === target) {
            return mid;
        }

        // Step 5: Target is in right half
        else if (nums[mid] < target) {
            left = mid + 1;
        }

        // Step 6: Target is in left half
        else {
            right = mid - 1;
        }
    }

    // Step 7: Target not found in array
    return -1;
}
```

**Complexity Analysis**:
- Time: O(log n) - halve search space each iteration
- Space: O(1) - only use constant extra space

---

### Problem 2: First Bad Version (Easy)
**LeetCode Link**: [278. First Bad Version](https://leetcode.com/problems/first-bad-version/)

**Description**: You are a product manager and have `n` versions. Each version is based on the previous one. All versions after a bad version are also bad. Find the first bad version using minimum API calls to `isBadVersion(version)`.

#### Python Solution
```python
def firstBadVersion(n: int) -> int:
    # Step 1: Initialize search boundaries
    left, right = 1, n

    # Step 2: Binary search for first bad version
    while left < right:
        # Step 3: Calculate middle version
        mid = left + (right - left) // 2

        # Step 4: Check if current version is bad
        if isBadVersion(mid):
            # Current is bad, first bad might be earlier or is current
            right = mid
        else:
            # Current is good, first bad must be after
            left = mid + 1

    # Step 5: Left and right converge to first bad version
    return left
```

#### TypeScript Solution
```typescript
function firstBadVersion(n: number): number {
    // Step 1: Initialize search boundaries
    let left = 1;
    let right = n;

    // Step 2: Binary search for first bad version
    while (left < right) {
        // Step 3: Calculate middle version
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Check if current version is bad
        if (isBadVersion(mid)) {
            // Current is bad, first bad might be earlier or is current
            right = mid;
        } else {
            // Current is good, first bad must be after
            left = mid + 1;
        }
    }

    // Step 5: Left and right converge to first bad version
    return left;
}
```

**Complexity Analysis**:
- Time: O(log n) - binary search through versions
- Space: O(1) - constant extra space

---

### Problem 3: Search Insert Position (Easy)
**LeetCode Link**: [35. Search Insert Position](https://leetcode.com/problems/search-insert-position/)

**Description**: Given a sorted array and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.

#### Python Solution
```python
def searchInsert(nums: list[int], target: int) -> int:
    # Step 1: Initialize search boundaries
    left, right = 0, len(nums) - 1

    # Step 2: Binary search for target or insertion position
    while left <= right:
        # Step 3: Calculate middle index
        mid = left + (right - left) // 2

        # Step 4: Found exact match
        if nums[mid] == target:
            return mid

        # Step 5: Target is larger, search right half
        elif nums[mid] < target:
            left = mid + 1

        # Step 6: Target is smaller, search left half
        else:
            right = mid - 1

    # Step 7: Left pointer is at insertion position
    # After loop: left > right, left is where target should be inserted
    return left
```

#### TypeScript Solution
```typescript
function searchInsert(nums: number[], target: number): number {
    // Step 1: Initialize search boundaries
    let left = 0;
    let right = nums.length - 1;

    // Step 2: Binary search for target or insertion position
    while (left <= right) {
        // Step 3: Calculate middle index
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Found exact match
        if (nums[mid] === target) {
            return mid;
        }

        // Step 5: Target is larger, search right half
        else if (nums[mid] < target) {
            left = mid + 1;
        }

        // Step 6: Target is smaller, search left half
        else {
            right = mid - 1;
        }
    }

    // Step 7: Left pointer is at insertion position
    return left;
}
```

**Complexity Analysis**:
- Time: O(log n) - binary search
- Space: O(1) - constant space

---

### Problem 4: Find Peak Element (Medium)
**LeetCode Link**: [162. Find Peak Element](https://leetcode.com/problems/find-peak-element/)

**Description**: A peak element is an element that is strictly greater than its neighbors. Given an integer array `nums`, find a peak element and return its index. You may assume `nums[-1] = nums[n] = -∞`.

#### Python Solution
```python
def findPeakElement(nums: list[int]) -> int:
    # Step 1: Initialize search boundaries
    left, right = 0, len(nums) - 1

    # Step 2: Binary search for peak
    while left < right:
        # Step 3: Calculate middle index
        mid = left + (right - left) // 2

        # Step 4: Compare middle with next element
        if nums[mid] < nums[mid + 1]:
            # Ascending slope, peak must be on right
            left = mid + 1
        else:
            # Descending slope or peak, search left (including mid)
            right = mid

    # Step 5: Left and right converge to peak
    return left

# Visualization:
#     /\
#    /  \
#   /    \  /\
#  /      \/  \
# If mid is on ascending slope (/), peak is to the right
# If mid is on descending slope (\), peak is to the left or at mid
```

#### TypeScript Solution
```typescript
function findPeakElement(nums: number[]): number {
    // Step 1: Initialize search boundaries
    let left = 0;
    let right = nums.length - 1;

    // Step 2: Binary search for peak
    while (left < right) {
        // Step 3: Calculate middle index
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Compare middle with next element
        if (nums[mid] < nums[mid + 1]) {
            // Ascending slope, peak must be on right
            left = mid + 1;
        } else {
            // Descending slope or peak, search left (including mid)
            right = mid;
        }
    }

    // Step 5: Left and right converge to peak
    return left;
}
```

**Complexity Analysis**:
- Time: O(log n) - binary search
- Space: O(1) - constant space

---

### Problem 5: Search in Rotated Sorted Array (Medium)
**LeetCode Link**: [33. Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array/)

**Description**: Given a rotated sorted array (rotated at some unknown pivot), search for a target value. Return its index or -1.

#### Python Solution
```python
def search(nums: list[int], target: int) -> int:
    # Step 1: Initialize search boundaries
    left, right = 0, len(nums) - 1

    # Step 2: Binary search in rotated array
    while left <= right:
        # Step 3: Calculate middle index
        mid = left + (right - left) // 2

        # Step 4: Found target
        if nums[mid] == target:
            return mid

        # Step 5: Determine which half is properly sorted
        # Left half is sorted
        if nums[left] <= nums[mid]:
            # Step 6: Check if target is in sorted left half
            if nums[left] <= target < nums[mid]:
                right = mid - 1  # Search left
            else:
                left = mid + 1   # Search right

        # Right half is sorted
        else:
            # Step 7: Check if target is in sorted right half
            if nums[mid] < target <= nums[right]:
                left = mid + 1   # Search right
            else:
                right = mid - 1  # Search left

    # Step 8: Target not found
    return -1

# Example: [4,5,6,7,0,1,2], target = 0
# mid=7, left half [4,5,6,7] sorted, target not in [4,7], search right
# Now [0,1,2], mid=1, right half sorted, target in range, search left
# Found at index 4
```

#### TypeScript Solution
```typescript
function search(nums: number[], target: number): number {
    // Step 1: Initialize search boundaries
    let left = 0;
    let right = nums.length - 1;

    // Step 2: Binary search in rotated array
    while (left <= right) {
        // Step 3: Calculate middle index
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Found target
        if (nums[mid] === target) {
            return mid;
        }

        // Step 5: Determine which half is properly sorted
        if (nums[left] <= nums[mid]) {
            // Left half is sorted
            // Step 6: Check if target is in sorted left half
            if (nums[left] <= target && target < nums[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {
            // Right half is sorted
            // Step 7: Check if target is in sorted right half
            if (nums[mid] < target && target <= nums[right]) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }

    // Step 8: Target not found
    return -1;
}
```

**Complexity Analysis**:
- Time: O(log n) - binary search
- Space: O(1) - constant space

---

### Problem 6: Find Minimum in Rotated Sorted Array (Medium)
**LeetCode Link**: [153. Find Minimum in Rotated Sorted Array](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/)

**Description**: Given a rotated sorted array of unique elements, find the minimum element.

#### Python Solution
```python
def findMin(nums: list[int]) -> int:
    # Step 1: Initialize search boundaries
    left, right = 0, len(nums) - 1

    # Step 2: Binary search for minimum
    while left < right:
        # Step 3: Calculate middle index
        mid = left + (right - left) // 2

        # Step 4: Compare middle with right boundary
        if nums[mid] > nums[right]:
            # Minimum is in right half (mid is in higher part of rotation)
            left = mid + 1
        else:
            # Minimum is in left half or is mid (mid is in lower part)
            right = mid

    # Step 5: Left points to minimum
    return nums[left]

# Visualization:
# [4,5,6,7,0,1,2]
#          ^
#     minimum at rotation point
#
# If nums[mid] > nums[right]: [4,5,6,7] vs 2
#   Mid is in higher portion, min is right
# If nums[mid] <= nums[right]: [0,1,2] vs 2
#   Mid is in lower portion or min, search left
```

#### TypeScript Solution
```typescript
function findMin(nums: number[]): number {
    // Step 1: Initialize search boundaries
    let left = 0;
    let right = nums.length - 1;

    // Step 2: Binary search for minimum
    while (left < right) {
        // Step 3: Calculate middle index
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Compare middle with right boundary
        if (nums[mid] > nums[right]) {
            // Minimum is in right half
            left = mid + 1;
        } else {
            // Minimum is in left half or is mid
            right = mid;
        }
    }

    // Step 5: Left points to minimum
    return nums[left];
}
```

**Complexity Analysis**:
- Time: O(log n) - binary search
- Space: O(1) - constant space

---

### Problem 7: Find First and Last Position of Element (Medium)
**LeetCode Link**: [34. Find First and Last Position of Element in Sorted Array](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/)

**Description**: Given a sorted array of integers, find the starting and ending position of a given target value. Return `[-1, -1]` if target is not found.

#### Python Solution
```python
def searchRange(nums: list[int], target: int) -> list[int]:
    def findBoundary(nums: list[int], target: int, findLeft: bool) -> int:
        # Helper function to find left or right boundary
        left, right = 0, len(nums) - 1
        boundary = -1

        while left <= right:
            mid = left + (right - left) // 2

            if nums[mid] == target:
                boundary = mid  # Found target, but keep searching for boundary
                if findLeft:
                    right = mid - 1  # Search left for first occurrence
                else:
                    left = mid + 1   # Search right for last occurrence
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1

        return boundary

    # Step 1: Find leftmost (first) position
    leftBound = findBoundary(nums, target, True)

    # Step 2: If not found, return [-1, -1]
    if leftBound == -1:
        return [-1, -1]

    # Step 3: Find rightmost (last) position
    rightBound = findBoundary(nums, target, False)

    # Step 4: Return both boundaries
    return [leftBound, rightBound]

# Example: [5,7,7,8,8,10], target = 8
# Finding left: mid=8, save it, search left → finds index 3
# Finding right: mid=8, save it, search right → finds index 4
# Result: [3, 4]
```

#### TypeScript Solution
```typescript
function searchRange(nums: number[], target: number): number[] {
    function findBoundary(nums: number[], target: number, findLeft: boolean): number {
        // Helper function to find left or right boundary
        let left = 0;
        let right = nums.length - 1;
        let boundary = -1;

        while (left <= right) {
            const mid = left + Math.floor((right - left) / 2);

            if (nums[mid] === target) {
                boundary = mid;
                if (findLeft) {
                    right = mid - 1;  // Search left for first occurrence
                } else {
                    left = mid + 1;   // Search right for last occurrence
                }
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return boundary;
    }

    // Step 1: Find leftmost (first) position
    const leftBound = findBoundary(nums, target, true);

    // Step 2: If not found, return [-1, -1]
    if (leftBound === -1) {
        return [-1, -1];
    }

    // Step 3: Find rightmost (last) position
    const rightBound = findBoundary(nums, target, false);

    // Step 4: Return both boundaries
    return [leftBound, rightBound];
}
```

**Complexity Analysis**:
- Time: O(log n) - two binary searches
- Space: O(1) - constant space

---

### Problem 8: Search a 2D Matrix (Medium)
**LeetCode Link**: [74. Search a 2D Matrix](https://leetcode.com/problems/search-a-2d-matrix/)

**Description**: Write an efficient algorithm that searches for a value in an m x n matrix. The matrix has the following properties:
- Integers in each row are sorted from left to right
- The first integer of each row is greater than the last integer of the previous row

#### Python Solution
```python
def searchMatrix(matrix: list[list[int]], target: int) -> bool:
    # Step 1: Handle empty matrix
    if not matrix or not matrix[0]:
        return False

    # Step 2: Get matrix dimensions
    rows, cols = len(matrix), len(matrix[0])

    # Step 3: Treat 2D matrix as 1D sorted array
    # Total elements = rows * cols
    left, right = 0, rows * cols - 1

    # Step 4: Binary search on "virtual" 1D array
    while left <= right:
        # Step 5: Calculate middle index
        mid = left + (right - left) // 2

        # Step 6: Convert 1D index to 2D coordinates
        # row = mid // cols, col = mid % cols
        mid_value = matrix[mid // cols][mid % cols]

        # Step 7: Check if found
        if mid_value == target:
            return True

        # Step 8: Search right half
        elif mid_value < target:
            left = mid + 1

        # Step 9: Search left half
        else:
            right = mid - 1

    # Step 10: Target not found
    return False

# Visualization for 3x4 matrix:
# Index mapping: 1D index → 2D coordinate
# 0→(0,0), 1→(0,1), 2→(0,2), 3→(0,3)
# 4→(1,0), 5→(1,1), 6→(1,2), 7→(1,3)
# 8→(2,0), 9→(2,1), 10→(2,2), 11→(2,3)
# Formula: row = index // cols, col = index % cols
```

#### TypeScript Solution
```typescript
function searchMatrix(matrix: number[][], target: number): boolean {
    // Step 1: Handle empty matrix
    if (!matrix || !matrix[0]) {
        return false;
    }

    // Step 2: Get matrix dimensions
    const rows = matrix.length;
    const cols = matrix[0].length;

    // Step 3: Treat 2D matrix as 1D sorted array
    let left = 0;
    let right = rows * cols - 1;

    // Step 4: Binary search on "virtual" 1D array
    while (left <= right) {
        // Step 5: Calculate middle index
        const mid = left + Math.floor((right - left) / 2);

        // Step 6: Convert 1D index to 2D coordinates
        const midValue = matrix[Math.floor(mid / cols)][mid % cols];

        // Step 7: Check if found
        if (midValue === target) {
            return true;
        }

        // Step 8: Search right half
        else if (midValue < target) {
            left = mid + 1;
        }

        // Step 9: Search left half
        else {
            right = mid - 1;
        }
    }

    // Step 10: Target not found
    return false;
}
```

**Complexity Analysis**:
- Time: O(log(m*n)) = O(log m + log n) - binary search on m*n elements
- Space: O(1) - constant space

---

### Problem 9: Find Smallest Letter Greater Than Target (Easy)
**LeetCode Link**: [744. Find Smallest Letter Greater Than Target](https://leetcode.com/problems/find-smallest-letter-greater-than-target/)

**Description**: Given a sorted array of characters `letters` and a character `target`, find the smallest character in the array that is larger than `target`. Letters wrap around (if no such character exists, return the first character).

#### Python Solution
```python
def nextGreatestLetter(letters: list[str], target: str) -> str:
    # Step 1: Initialize search boundaries
    left, right = 0, len(letters) - 1

    # Step 2: Binary search for smallest letter > target
    while left <= right:
        # Step 3: Calculate middle index
        mid = left + (right - left) // 2

        # Step 4: Current letter is not greater, search right
        if letters[mid] <= target:
            left = mid + 1
        # Step 5: Current letter is greater, might be answer, search left
        else:
            right = mid - 1

    # Step 6: Left is at first element > target, or wraps to 0
    # If left == len(letters), wrap around to first element
    return letters[left % len(letters)]

# Example: letters = ['c','f','j'], target = 'c'
# Need smallest > 'c' → 'f'
# mid='f', 'f' > 'c', search left (save this position)
# Result: letters[1] = 'f'
```

#### TypeScript Solution
```typescript
function nextGreatestLetter(letters: string[], target: string): string {
    // Step 1: Initialize search boundaries
    let left = 0;
    let right = letters.length - 1;

    // Step 2: Binary search for smallest letter > target
    while (left <= right) {
        // Step 3: Calculate middle index
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Current letter is not greater, search right
        if (letters[mid] <= target) {
            left = mid + 1;
        }
        // Step 5: Current letter is greater, might be answer, search left
        else {
            right = mid - 1;
        }
    }

    // Step 6: Left is at first element > target, or wraps to 0
    return letters[left % letters.length];
}
```

**Complexity Analysis**:
- Time: O(log n) - binary search
- Space: O(1) - constant space

---

### Problem 10: Sqrt(x) (Easy)
**LeetCode Link**: [69. Sqrt(x)](https://leetcode.com/problems/sqrtx/)

**Description**: Given a non-negative integer `x`, compute and return the square root of `x` rounded down to the nearest integer.

#### Python Solution
```python
def mySqrt(x: int) -> int:
    # Step 1: Handle base cases
    if x < 2:
        return x

    # Step 2: Initialize search boundaries
    # Square root of x is between 1 and x/2 for x >= 2
    left, right = 1, x // 2

    # Step 3: Binary search for square root
    while left <= right:
        # Step 4: Calculate middle value
        mid = left + (right - left) // 2

        # Step 5: Calculate square of middle
        square = mid * mid

        # Step 6: Found exact square root
        if square == x:
            return mid

        # Step 7: Square too small, search right
        elif square < x:
            left = mid + 1

        # Step 8: Square too large, search left
        else:
            right = mid - 1

    # Step 9: Right is the floor of square root
    # After loop: right * right <= x < left * left
    return right

# Example: x = 8
# sqrt(8) ≈ 2.828, return 2
# Binary search: left=1, right=4
# mid=2: 2*2=4 < 8, search right
# mid=3: 3*3=9 > 8, search left
# Result: right=2
```

#### TypeScript Solution
```typescript
function mySqrt(x: number): number {
    // Step 1: Handle base cases
    if (x < 2) {
        return x;
    }

    // Step 2: Initialize search boundaries
    let left = 1;
    let right = Math.floor(x / 2);

    // Step 3: Binary search for square root
    while (left <= right) {
        // Step 4: Calculate middle value
        const mid = left + Math.floor((right - left) / 2);

        // Step 5: Calculate square of middle
        const square = mid * mid;

        // Step 6: Found exact square root
        if (square === x) {
            return mid;
        }

        // Step 7: Square too small, search right
        else if (square < x) {
            left = mid + 1;
        }

        // Step 8: Square too large, search left
        else {
            right = mid - 1;
        }
    }

    // Step 9: Right is the floor of square root
    return right;
}
```

**Complexity Analysis**:
- Time: O(log n) - binary search
- Space: O(1) - constant space

---

### Problem 11: Valid Perfect Square (Easy)
**LeetCode Link**: [367. Valid Perfect Square](https://leetcode.com/problems/valid-perfect-square/)

**Description**: Given a positive integer `num`, return true if `num` is a perfect square or false otherwise. A perfect square is an integer that is the square of an integer.

#### Python Solution
```python
def isPerfectSquare(num: int) -> bool:
    # Step 1: Handle base case
    if num < 2:
        return True

    # Step 2: Initialize search boundaries
    left, right = 2, num // 2

    # Step 3: Binary search for perfect square
    while left <= right:
        # Step 4: Calculate middle value
        mid = left + (right - left) // 2

        # Step 5: Calculate square
        square = mid * mid

        # Step 6: Found perfect square
        if square == num:
            return True

        # Step 7: Square too small, search right
        elif square < num:
            left = mid + 1

        # Step 8: Square too large, search left
        else:
            right = mid - 1

    # Step 9: No perfect square found
    return False
```

#### TypeScript Solution
```typescript
function isPerfectSquare(num: number): boolean {
    // Step 1: Handle base case
    if (num < 2) {
        return true;
    }

    // Step 2: Initialize search boundaries
    let left = 2;
    let right = Math.floor(num / 2);

    // Step 3: Binary search for perfect square
    while (left <= right) {
        // Step 4: Calculate middle value
        const mid = left + Math.floor((right - left) / 2);

        // Step 5: Calculate square
        const square = mid * mid;

        // Step 6: Found perfect square
        if (square === num) {
            return true;
        }

        // Step 7: Square too small, search right
        else if (square < num) {
            left = mid + 1;
        }

        // Step 8: Square too large, search left
        else {
            right = mid - 1;
        }
    }

    // Step 9: No perfect square found
    return false;
}
```

**Complexity Analysis**:
- Time: O(log n) - binary search
- Space: O(1) - constant space

---

### Problem 12: Koko Eating Bananas (Medium)
**LeetCode Link**: [875. Koko Eating Bananas](https://leetcode.com/problems/koko-eating-bananas/)

**Description**: Koko loves to eat bananas. There are `n` piles of bananas, the `i`th pile has `piles[i]` bananas. Koko can decide her bananas-per-hour eating speed `k`. Each hour, she chooses a pile and eats `k` bananas. If the pile has less than `k` bananas, she eats all of them and won't eat more during that hour. Return the minimum integer `k` such that she can eat all bananas within `h` hours.

#### Python Solution
```python
def minEatingSpeed(piles: list[int], h: int) -> int:
    def canFinish(piles: list[int], speed: int, h: int) -> bool:
        # Helper: Check if can finish all piles at given speed within h hours
        hours_needed = 0
        for pile in piles:
            # Ceiling division: (pile + speed - 1) // speed
            hours_needed += (pile + speed - 1) // speed
            if hours_needed > h:  # Early termination
                return False
        return hours_needed <= h

    # Step 1: Initialize search boundaries
    # Minimum speed: 1 banana/hour
    # Maximum speed: max pile size (eat any pile in 1 hour)
    left, right = 1, max(piles)

    # Step 2: Binary search for minimum valid speed
    while left < right:
        # Step 3: Calculate middle speed
        mid = left + (right - left) // 2

        # Step 4: Check if this speed works
        if canFinish(piles, mid, h):
            # This speed works, try slower speed
            right = mid
        else:
            # This speed too slow, need faster speed
            left = mid + 1

    # Step 5: Left is minimum valid speed
    return left

# Example: piles = [3,6,7,11], h = 8
# Binary search speeds from 1 to 11
# Try speed=6: 1+1+2+2=6 hours ✓
# Try speed=3: 1+2+3+4=10 hours ✗
# Try speed=4: 1+2+2+3=8 hours ✓
# Answer: 4
```

#### TypeScript Solution
```typescript
function minEatingSpeed(piles: number[], h: number): number {
    function canFinish(piles: number[], speed: number, h: number): boolean {
        // Helper: Check if can finish all piles at given speed within h hours
        let hoursNeeded = 0;
        for (const pile of piles) {
            hoursNeeded += Math.ceil(pile / speed);
            if (hoursNeeded > h) {
                return false;
            }
        }
        return hoursNeeded <= h;
    }

    // Step 1: Initialize search boundaries
    let left = 1;
    let right = Math.max(...piles);

    // Step 2: Binary search for minimum valid speed
    while (left < right) {
        // Step 3: Calculate middle speed
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Check if this speed works
        if (canFinish(piles, mid, h)) {
            // This speed works, try slower speed
            right = mid;
        } else {
            // This speed too slow, need faster speed
            left = mid + 1;
        }
    }

    // Step 5: Left is minimum valid speed
    return left;
}
```

**Complexity Analysis**:
- Time: O(n log m) - n is number of piles, m is max pile size, binary search on m with O(n) validation
- Space: O(1) - constant space

---

### Problem 13: Capacity To Ship Packages Within D Days (Medium)
**LeetCode Link**: [1011. Capacity To Ship Packages Within D Days](https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/)

**Description**: A conveyor belt has packages that must be shipped within `days` days. The `i`th package has a weight of `weights[i]`. Packages must be shipped in the order given. Find the minimum ship capacity that can ship all packages within `days` days.

#### Python Solution
```python
def shipWithinDays(weights: list[int], days: int) -> int:
    def canShip(weights: list[int], capacity: int, days: int) -> bool:
        # Helper: Check if can ship all packages with given capacity
        days_needed = 1
        current_load = 0

        for weight in weights:
            # Try to add package to current day
            if current_load + weight > capacity:
                # Need new day
                days_needed += 1
                current_load = weight
                if days_needed > days:  # Early termination
                    return False
            else:
                current_load += weight

        return days_needed <= days

    # Step 1: Initialize search boundaries
    # Minimum capacity: max weight (must carry heaviest package)
    # Maximum capacity: sum of all weights (carry everything in 1 day)
    left, right = max(weights), sum(weights)

    # Step 2: Binary search for minimum capacity
    while left < right:
        # Step 3: Calculate middle capacity
        mid = left + (right - left) // 2

        # Step 4: Check if this capacity works
        if canShip(weights, mid, days):
            # This capacity works, try smaller
            right = mid
        else:
            # This capacity too small, need larger
            left = mid + 1

    # Step 5: Left is minimum valid capacity
    return left

# Example: weights = [1,2,3,4,5,6,7,8,9,10], days = 5
# Binary search capacity from 10 to 55
# Try capacity=15: Day1:[1..5]=15, Day2:[6,7,8]=21✗
# Try capacity=20: Can ship in 5 days ✓
# Answer: minimum capacity that works
```

#### TypeScript Solution
```typescript
function shipWithinDays(weights: number[], days: number): number {
    function canShip(weights: number[], capacity: number, days: number): boolean {
        let daysNeeded = 1;
        let currentLoad = 0;

        for (const weight of weights) {
            if (currentLoad + weight > capacity) {
                daysNeeded++;
                currentLoad = weight;
                if (daysNeeded > days) {
                    return false;
                }
            } else {
                currentLoad += weight;
            }
        }

        return daysNeeded <= days;
    }

    // Step 1: Initialize search boundaries
    let left = Math.max(...weights);
    let right = weights.reduce((sum, w) => sum + w, 0);

    // Step 2: Binary search for minimum capacity
    while (left < right) {
        // Step 3: Calculate middle capacity
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Check if this capacity works
        if (canShip(weights, mid, days)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }

    // Step 5: Left is minimum valid capacity
    return left;
}
```

**Complexity Analysis**:
- Time: O(n log S) - n is number of packages, S is sum of weights, binary search on S with O(n) validation
- Space: O(1) - constant space

---

### Problem 14: Split Array Largest Sum (Hard)
**LeetCode Link**: [410. Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum/)

**Description**: Given an integer array `nums` and an integer `k`, split `nums` into `k` non-empty continuous subarrays. Minimize the largest sum among these `k` subarrays. Return the minimized largest sum.

#### Python Solution
```python
def splitArray(nums: list[int], k: int) -> int:
    def canSplit(nums: list[int], k: int, max_sum: int) -> bool:
        # Helper: Check if can split array into k subarrays with max sum <= max_sum
        subarrays = 1
        current_sum = 0

        for num in nums:
            # Try to add number to current subarray
            if current_sum + num > max_sum:
                # Need new subarray
                subarrays += 1
                current_sum = num
                if subarrays > k:  # Early termination
                    return False
            else:
                current_sum += num

        return subarrays <= k

    # Step 1: Initialize search boundaries
    # Minimum possible max sum: largest element (each in separate subarray)
    # Maximum possible max sum: sum of all elements (everything in 1 subarray)
    left, right = max(nums), sum(nums)

    # Step 2: Binary search for minimum largest sum
    while left < right:
        # Step 3: Calculate middle sum
        mid = left + (right - left) // 2

        # Step 4: Check if can split with this max sum
        if canSplit(nums, k, mid):
            # Can split with this max, try smaller
            right = mid
        else:
            # Cannot split with this max, need larger
            left = mid + 1

    # Step 5: Left is minimum largest sum
    return left

# Example: nums = [7,2,5,10,8], k = 2
# Binary search max_sum from 10 to 32
# Try max_sum=18: [7,2,5] (14), [10,8] (18) → 2 subarrays ✓
# Try max_sum=14: Cannot split into 2 subarrays ✗
# Answer: 18
#
# Visualization:
# [7, 2, 5, | 10, 8]
#  sum=14      sum=18
# Largest sum = 18 (minimized)
```

#### TypeScript Solution
```typescript
function splitArray(nums: number[], k: number): number {
    function canSplit(nums: number[], k: number, maxSum: number): boolean {
        let subarrays = 1;
        let currentSum = 0;

        for (const num of nums) {
            if (currentSum + num > maxSum) {
                subarrays++;
                currentSum = num;
                if (subarrays > k) {
                    return false;
                }
            } else {
                currentSum += num;
            }
        }

        return subarrays <= k;
    }

    // Step 1: Initialize search boundaries
    let left = Math.max(...nums);
    let right = nums.reduce((sum, num) => sum + num, 0);

    // Step 2: Binary search for minimum largest sum
    while (left < right) {
        // Step 3: Calculate middle sum
        const mid = left + Math.floor((right - left) / 2);

        // Step 4: Check if can split with this max sum
        if (canSplit(nums, k, mid)) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }

    // Step 5: Left is minimum largest sum
    return left;
}
```

**Complexity Analysis**:
- Time: O(n log S) - n is array length, S is sum of array, binary search on S with O(n) validation
- Space: O(1) - constant space

---

### Problem 15: Find K-th Smallest Pair Distance (Hard)
**LeetCode Link**: [719. Find K-th Smallest Pair Distance](https://leetcode.com/problems/find-k-th-smallest-pair-distance/)

**Description**: Given an integer array `nums` and an integer `k`, return the k-th smallest distance among all pairs. The distance of a pair `(a, b)` is defined as `|a - b|`.

#### Python Solution
```python
def smallestDistancePair(nums: list[int], k: int) -> int:
    def countPairsWithDistanceLTE(nums: list[int], distance: int) -> int:
        # Helper: Count pairs with distance <= given distance
        count = 0
        left = 0

        # Use sliding window on sorted array
        for right in range(len(nums)):
            # Shrink window while distance exceeds limit
            while nums[right] - nums[left] > distance:
                left += 1
            # All pairs (left, right), (left+1, right), ..., (right-1, right)
            # have distance <= distance
            count += right - left

        return count

    # Step 1: Sort array to use two pointers
    nums.sort()

    # Step 2: Initialize search boundaries
    # Minimum distance: 0 (duplicate elements)
    # Maximum distance: max(nums) - min(nums)
    left, right = 0, nums[-1] - nums[0]

    # Step 3: Binary search for k-th smallest distance
    while left < right:
        # Step 4: Calculate middle distance
        mid = left + (right - left) // 2

        # Step 5: Count pairs with distance <= mid
        pairs_count = countPairsWithDistanceLTE(nums, mid)

        # Step 6: Check if we have at least k pairs
        if pairs_count >= k:
            # Too many pairs, k-th distance is <= mid
            right = mid
        else:
            # Not enough pairs, k-th distance is > mid
            left = mid + 1

    # Step 7: Left is k-th smallest distance
    return left

# Example: nums = [1,3,1], k = 1
# Sorted: [1,1,3]
# Pairs: (1,1)=0, (1,3)=2, (1,3)=2
# 1st smallest distance = 0
#
# Binary search on distance [0, 2]
# mid=1: pairs with dist<=1 is 1 (the pair (1,1))
# Since 1 >= k=1, answer is <= 1
# Continue searching...
```

#### TypeScript Solution
```typescript
function smallestDistancePair(nums: number[], k: number): number {
    function countPairsWithDistanceLTE(nums: number[], distance: number): number {
        let count = 0;
        let left = 0;

        for (let right = 0; right < nums.length; right++) {
            while (nums[right] - nums[left] > distance) {
                left++;
            }
            count += right - left;
        }

        return count;
    }

    // Step 1: Sort array
    nums.sort((a, b) => a - b);

    // Step 2: Initialize search boundaries
    let left = 0;
    let right = nums[nums.length - 1] - nums[0];

    // Step 3: Binary search for k-th smallest distance
    while (left < right) {
        // Step 4: Calculate middle distance
        const mid = left + Math.floor((right - left) / 2);

        // Step 5: Count pairs with distance <= mid
        const pairsCount = countPairsWithDistanceLTE(nums, mid);

        // Step 6: Check if we have at least k pairs
        if (pairsCount >= k) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }

    // Step 7: Left is k-th smallest distance
    return left;
}
```

**Complexity Analysis**:
- Time: O(n log n + n log D) - n log n for sorting, n log D for binary search on distance D with O(n) counting
- Space: O(1) - constant extra space (excluding sorting space)

---

## Summary

Modified Binary Search is a versatile pattern that extends beyond simple element lookup. Key takeaways:

1. **Think in terms of search space reduction** - not just finding elements
2. **Identify the property to binary search on** - it might not be array indices
3. **Handle boundaries carefully** - use `left < right` vs `left <= right` appropriately
4. **Consider the invariant** - what does the search space represent at each step?
5. **Binary search on answer** - many optimization problems can be solved by binary searching the answer

**Practice Strategy**:
- Start with standard binary search problems
- Move to rotated arrays and 2D matrices
- Progress to "binary search on answer" problems
- Master boundary finding techniques

Remember: If you can verify a solution in O(n) or O(n log n) time, you can often find the optimal solution using binary search in O(n log n) or O(n log² n) time!
