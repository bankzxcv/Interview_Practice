# 1.1 Prefix Sum Pattern

## Pattern Overview

### What is Prefix Sum?
Prefix Sum (also called Cumulative Sum) is a technique where we precompute the cumulative sum of elements from the start of an array up to each position. This allows us to calculate the sum of any subarray in **O(1)** time after an **O(n)** preprocessing step.

### When to Use It?
- When you need to calculate multiple range sum queries efficiently
- When checking if a subarray exists with a given sum
- When working with problems involving cumulative values or running totals
- When you need to find subarrays with specific sum properties

### Time/Space Complexity Benefits
- **Preprocessing**: O(n) time to build prefix sum array
- **Query**: O(1) time to get sum of any subarray
- **Space**: O(n) for storing prefix sum array
- **Without prefix sum**: Each range query would take O(n), making total O(n×q) for q queries

### Visual Diagram

```
Original Array:     [2,  4,  1,  5,  3]
                     ↓   ↓   ↓   ↓   ↓
Prefix Sum Array:   [2,  6,  7, 12, 15]

Explanation:
prefix[0] = 2           (2)
prefix[1] = 2 + 4       (6)
prefix[2] = 2 + 4 + 1   (7)
prefix[3] = 2 + 4 + 1 + 5 (12)
prefix[4] = 2 + 4 + 1 + 5 + 3 (15)

To find sum from index i to j:
sum(i, j) = prefix[j] - prefix[i-1]

Example: sum(1, 3) = prefix[3] - prefix[0] = 12 - 2 = 10
Verification: arr[1] + arr[2] + arr[3] = 4 + 1 + 5 = 10 ✓
```

## Recognition Guidelines

### How to Identify This Pattern
Look for these keywords and scenarios:
- "Sum of subarray"
- "Range sum queries"
- "Contiguous subarray with sum X"
- "Find subarray that sums to target"
- "Calculate sum between indices"
- Multiple queries asking for sums of different ranges

### Key Indicators
1. Need to perform multiple sum queries on same array
2. Questions about continuous/contiguous subarrays
3. Need to optimize repeated sum calculations
4. Problems involving "sum equals k" or "sum divisible by k"
5. 2D matrix range sum queries

## Template/Pseudocode

### Basic Prefix Sum (1D Array)
```
function buildPrefixSum(arr):
    n = length of arr
    prefix = new array of size n
    prefix[0] = arr[0]

    for i from 1 to n-1:
        prefix[i] = prefix[i-1] + arr[i]

    return prefix

function getRangeSum(prefix, left, right):
    if left == 0:
        return prefix[right]
    return prefix[right] - prefix[left-1]
```

### Prefix Sum with HashMap (for subarray sum problems)
```
function subarraySum(arr, target):
    prefixSum = 0
    count = 0
    map = {0: 1}  // Initialize with sum 0 appearing once

    for num in arr:
        prefixSum += num

        // Check if (prefixSum - target) exists
        if (prefixSum - target) in map:
            count += map[prefixSum - target]

        // Add current prefix sum to map
        map[prefixSum] = map.get(prefixSum, 0) + 1

    return count
```

---

## Problems

### Problem 1: Range Sum Query - Immutable
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/range-sum-query-immutable/](https://leetcode.com/problems/range-sum-query-immutable/)

**Description**: Given an integer array nums, handle multiple queries to calculate the sum of elements between indices left and right (inclusive).

#### Python Solution
```python
class NumArray:
    def __init__(self, nums: List[int]):
        # Step 1: Initialize prefix sum array
        # prefix[i] will store sum of all elements from index 0 to i
        self.prefix = []
        current_sum = 0

        # Step 2: Build prefix sum array
        for num in nums:
            current_sum += num
            self.prefix.append(current_sum)

    def sumRange(self, left: int, right: int) -> int:
        # Step 3: Calculate range sum using prefix array
        # If left is 0, return prefix[right] directly
        if left == 0:
            return self.prefix[right]

        # Otherwise, subtract prefix[left-1] from prefix[right]
        # This gives us sum from left to right
        return self.prefix[right] - self.prefix[left - 1]
```

#### TypeScript Solution
```typescript
class NumArray {
    private prefix: number[];

    constructor(nums: number[]) {
        // Step 1: Initialize prefix sum array
        this.prefix = [];
        let currentSum = 0;

        // Step 2: Build prefix sum array
        for (const num of nums) {
            currentSum += num;
            this.prefix.push(currentSum);
        }
    }

    sumRange(left: number, right: number): number {
        // Step 3: Calculate range sum using prefix array
        if (left === 0) {
            return this.prefix[right];
        }

        // Subtract to get sum from left to right
        return this.prefix[right] - this.prefix[left - 1];
    }
}
```

**Time Complexity**: O(n) for initialization, O(1) for each query
**Space Complexity**: O(n) for prefix sum array

---

### Problem 2: Find Pivot Index
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/find-pivot-index/](https://leetcode.com/problems/find-pivot-index/)

**Description**: Find the pivot index where sum of numbers to the left equals sum of numbers to the right.

#### Python Solution
```python
def pivotIndex(nums: List[int]) -> int:
    # Step 1: Calculate total sum of array
    total_sum = sum(nums)

    # Step 2: Initialize left sum as 0
    left_sum = 0

    # Step 3: Iterate through array
    for i in range(len(nums)):
        # Step 4: Calculate right sum
        # right_sum = total_sum - left_sum - current_element
        right_sum = total_sum - left_sum - nums[i]

        # Step 5: Check if left sum equals right sum
        if left_sum == right_sum:
            return i

        # Step 6: Update left sum for next iteration
        left_sum += nums[i]

    # Step 7: No pivot found
    return -1
```

#### TypeScript Solution
```typescript
function pivotIndex(nums: number[]): number {
    // Step 1: Calculate total sum of array
    const totalSum = nums.reduce((acc, num) => acc + num, 0);

    // Step 2: Initialize left sum as 0
    let leftSum = 0;

    // Step 3: Iterate through array
    for (let i = 0; i < nums.length; i++) {
        // Step 4: Calculate right sum
        const rightSum = totalSum - leftSum - nums[i];

        // Step 5: Check if left sum equals right sum
        if (leftSum === rightSum) {
            return i;
        }

        // Step 6: Update left sum for next iteration
        leftSum += nums[i];
    }

    // Step 7: No pivot found
    return -1;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - only using constant extra space

---

### Problem 3: Subarray Sum Equals K
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/subarray-sum-equals-k/](https://leetcode.com/problems/subarray-sum-equals-k/)

**Description**: Find the total number of continuous subarrays whose sum equals k.

#### Python Solution
```python
def subarraySum(nums: List[int], k: int) -> int:
    # Step 1: Initialize variables
    # count: number of subarrays with sum k
    # prefix_sum: running sum from start to current position
    # sum_count: hashmap to store frequency of each prefix sum
    count = 0
    prefix_sum = 0
    sum_count = {0: 1}  # Initialize with sum 0 appearing once

    # Step 2: Iterate through array
    for num in nums:
        # Step 3: Update prefix sum
        prefix_sum += num

        # Step 4: Check if (prefix_sum - k) exists in hashmap
        # If yes, it means there exist subarrays ending at current index with sum k
        # Why? Because prefix_sum - (prefix_sum - k) = k
        if prefix_sum - k in sum_count:
            count += sum_count[prefix_sum - k]

        # Step 5: Add current prefix sum to hashmap
        sum_count[prefix_sum] = sum_count.get(prefix_sum, 0) + 1

    return count

# Visualization for nums = [1, 2, 3], k = 3:
# i=0: num=1, prefix_sum=1, sum_count={0:1, 1:1}, count=0
# i=1: num=2, prefix_sum=3, (3-3=0) in map, count=1, sum_count={0:1, 1:1, 3:1}
# i=2: num=3, prefix_sum=6, (6-3=3) in map, count=2, sum_count={0:1, 1:1, 3:1, 6:1}
# Answer: 2 (subarrays [1,2] and [3])
```

#### TypeScript Solution
```typescript
function subarraySum(nums: number[], k: number): number {
    // Step 1: Initialize variables
    let count = 0;
    let prefixSum = 0;
    const sumCount = new Map<number, number>();
    sumCount.set(0, 1); // Initialize with sum 0 appearing once

    // Step 2: Iterate through array
    for (const num of nums) {
        // Step 3: Update prefix sum
        prefixSum += num;

        // Step 4: Check if (prefix_sum - k) exists
        const target = prefixSum - k;
        if (sumCount.has(target)) {
            count += sumCount.get(target)!;
        }

        // Step 5: Add current prefix sum to map
        sumCount.set(prefixSum, (sumCount.get(prefixSum) || 0) + 1);
    }

    return count;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(n) - hashmap can store up to n different prefix sums

---

### Problem 4: Contiguous Array
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/contiguous-array/](https://leetcode.com/problems/contiguous-array/)

**Description**: Find the maximum length of a contiguous subarray with equal number of 0s and 1s.

#### Python Solution
```python
def findMaxLength(nums: List[int]) -> int:
    # Step 1: Initialize variables
    # Key insight: Replace 0 with -1, then problem becomes finding longest subarray with sum 0
    max_length = 0
    count = 0  # Running sum (1 for '1', -1 for '0')
    count_index = {0: -1}  # Map: count -> first index where this count appears

    # Step 2: Iterate through array
    for i in range(len(nums)):
        # Step 3: Update count (+1 for 1, -1 for 0)
        count += 1 if nums[i] == 1 else -1

        # Step 4: If this count seen before, calculate length
        if count in count_index:
            # Length from first occurrence to current position
            length = i - count_index[count]
            max_length = max(max_length, length)
        else:
            # Step 5: Store first occurrence of this count
            count_index[count] = i

    return max_length

# Visualization for [0, 1, 0]:
# i=0: nums[0]=0, count=-1, count_index={0:-1, -1:0}, max_length=0
# i=1: nums[1]=1, count=0, seen before at -1, length=1-(-1)=2, max_length=2
# i=2: nums[2]=0, count=-1, seen before at 0, length=2-0=2, max_length=2
# Answer: 2 (subarray [0,1])
```

#### TypeScript Solution
```typescript
function findMaxLength(nums: number[]): number {
    // Step 1: Initialize variables
    let maxLength = 0;
    let count = 0;
    const countIndex = new Map<number, number>();
    countIndex.set(0, -1); // Base case

    // Step 2: Iterate through array
    for (let i = 0; i < nums.length; i++) {
        // Step 3: Update count
        count += nums[i] === 1 ? 1 : -1;

        // Step 4: Check if count seen before
        if (countIndex.has(count)) {
            const length = i - countIndex.get(count)!;
            maxLength = Math.max(maxLength, length);
        } else {
            // Step 5: Store first occurrence
            countIndex.set(count, i);
        }
    }

    return maxLength;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(n) - hashmap storing counts

---

### Problem 5: Product of Array Except Self
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/product-of-array-except-self/](https://leetcode.com/problems/product-of-array-except-self/)

**Description**: Return an array where each element is the product of all elements except itself (without division).

#### Python Solution
```python
def productExceptSelf(nums: List[int]) -> List[int]:
    n = len(nums)
    result = [1] * n

    # Step 1: Calculate prefix products (left to right)
    # result[i] will contain product of all elements to the left of i
    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]

    # Step 2: Calculate suffix products (right to left) and multiply
    # Multiply result[i] with product of all elements to the right of i
    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]

    return result

# Visualization for [1, 2, 3, 4]:
# After prefix pass: [1, 1, 2, 6]
#   result[0] = 1 (nothing to left)
#   result[1] = 1 (1 to left)
#   result[2] = 2 (1*2 to left)
#   result[3] = 6 (1*2*3 to left)
#
# After suffix pass: [24, 12, 8, 6]
#   result[3] = 6 * 1 = 6 (nothing to right)
#   result[2] = 2 * 4 = 8 (4 to right)
#   result[1] = 1 * 12 = 12 (3*4 to right)
#   result[0] = 1 * 24 = 24 (2*3*4 to right)
```

#### TypeScript Solution
```typescript
function productExceptSelf(nums: number[]): number[] {
    const n = nums.length;
    const result: number[] = new Array(n).fill(1);

    // Step 1: Calculate prefix products
    let prefix = 1;
    for (let i = 0; i < n; i++) {
        result[i] = prefix;
        prefix *= nums[i];
    }

    // Step 2: Calculate suffix products and multiply
    let suffix = 1;
    for (let i = n - 1; i >= 0; i--) {
        result[i] *= suffix;
        suffix *= nums[i];
    }

    return result;
}
```

**Time Complexity**: O(n) - two passes through array
**Space Complexity**: O(1) - output array doesn't count as extra space

---

### Problem 6: Range Sum Query 2D - Immutable
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/range-sum-query-2d-immutable/](https://leetcode.com/problems/range-sum-query-2d-immutable/)

**Description**: Calculate sum of elements in a 2D matrix within a rectangle defined by top-left and bottom-right corners.

#### Python Solution
```python
class NumMatrix:
    def __init__(self, matrix: List[List[int]]):
        if not matrix or not matrix[0]:
            return

        # Step 1: Get dimensions
        rows, cols = len(matrix), len(matrix[0])

        # Step 2: Create 2D prefix sum array (extra row and column for easier calculation)
        # prefix[i][j] = sum of all elements in rectangle from (0,0) to (i-1,j-1)
        self.prefix = [[0] * (cols + 1) for _ in range(rows + 1)]

        # Step 3: Build 2D prefix sum
        for i in range(1, rows + 1):
            for j in range(1, cols + 1):
                # Current cell + left + top - top-left (to avoid double counting)
                self.prefix[i][j] = (
                    matrix[i-1][j-1] +           # Current cell
                    self.prefix[i-1][j] +        # Sum from top
                    self.prefix[i][j-1] -        # Sum from left
                    self.prefix[i-1][j-1]        # Remove overlap
                )

    def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
        # Step 4: Calculate region sum using inclusion-exclusion principle
        # Add bottom-right, subtract top and left strips, add back top-left overlap
        return (
            self.prefix[row2+1][col2+1] -      # Bottom-right
            self.prefix[row1][col2+1] -        # Subtract top strip
            self.prefix[row2+1][col1] +        # Subtract left strip
            self.prefix[row1][col1]            # Add back top-left overlap
        )

# Visualization:
# Matrix:  [[3, 0, 1, 4, 2],
#           [5, 6, 3, 2, 1],
#           [1, 2, 0, 1, 5]]
#
# Prefix:  [[0, 0, 0,  0,  0,  0],
#           [0, 3, 3,  4,  8, 10],
#           [0, 8,14, 18, 24, 27],
#           [0, 9,17, 21, 28, 36]]
#
# Query (1,1) to (2,2):
#   prefix[3][3] - prefix[1][3] - prefix[3][1] + prefix[1][1]
#   = 21 - 4 - 9 + 3 = 11
```

#### TypeScript Solution
```typescript
class NumMatrix {
    private prefix: number[][];

    constructor(matrix: number[][]) {
        if (!matrix || !matrix.length || !matrix[0].length) {
            return;
        }

        // Step 1: Get dimensions
        const rows = matrix.length;
        const cols = matrix[0].length;

        // Step 2: Create 2D prefix sum array
        this.prefix = Array(rows + 1).fill(0)
            .map(() => Array(cols + 1).fill(0));

        // Step 3: Build 2D prefix sum
        for (let i = 1; i <= rows; i++) {
            for (let j = 1; j <= cols; j++) {
                this.prefix[i][j] =
                    matrix[i-1][j-1] +
                    this.prefix[i-1][j] +
                    this.prefix[i][j-1] -
                    this.prefix[i-1][j-1];
            }
        }
    }

    sumRegion(row1: number, col1: number, row2: number, col2: number): number {
        // Step 4: Calculate region sum
        return (
            this.prefix[row2+1][col2+1] -
            this.prefix[row1][col2+1] -
            this.prefix[row2+1][col1] +
            this.prefix[row1][col1]
        );
    }
}
```

**Time Complexity**: O(m×n) for initialization, O(1) for each query
**Space Complexity**: O(m×n) for prefix sum matrix

---

### Problem 7: Continuous Subarray Sum
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/continuous-subarray-sum/](https://leetcode.com/problems/continuous-subarray-sum/)

**Description**: Check if array has a continuous subarray of size at least 2 whose sum is a multiple of k.

#### Python Solution
```python
def checkSubarraySum(nums: List[int], k: int) -> bool:
    # Step 1: Initialize variables
    # Key insight: If (prefix_sum[j] - prefix_sum[i]) % k == 0,
    # then prefix_sum[j] % k == prefix_sum[i] % k
    remainder_index = {0: -1}  # Map: remainder -> first index
    prefix_sum = 0

    # Step 2: Iterate through array
    for i in range(len(nums)):
        # Step 3: Update prefix sum
        prefix_sum += nums[i]

        # Step 4: Calculate remainder
        remainder = prefix_sum % k

        # Step 5: Check if this remainder seen before
        if remainder in remainder_index:
            # Step 6: Check if subarray length >= 2
            if i - remainder_index[remainder] >= 2:
                return True
        else:
            # Step 7: Store first occurrence of this remainder
            remainder_index[remainder] = i

    return False

# Example: nums = [23, 2, 4, 6, 7], k = 6
# i=0: sum=23, rem=5, map={0:-1, 5:0}
# i=1: sum=25, rem=1, map={0:-1, 5:0, 1:1}
# i=2: sum=29, rem=5, seen at 0, length=2-0=2 >= 2, return True
# Subarray [2, 4] has sum 6 which is multiple of 6
```

#### TypeScript Solution
```typescript
function checkSubarraySum(nums: number[], k: number): boolean {
    // Step 1: Initialize variables
    const remainderIndex = new Map<number, number>();
    remainderIndex.set(0, -1); // Base case
    let prefixSum = 0;

    // Step 2: Iterate through array
    for (let i = 0; i < nums.length; i++) {
        // Step 3: Update prefix sum
        prefixSum += nums[i];

        // Step 4: Calculate remainder
        const remainder = prefixSum % k;

        // Step 5: Check if remainder seen before
        if (remainderIndex.has(remainder)) {
            // Step 6: Check subarray length
            if (i - remainderIndex.get(remainder)! >= 2) {
                return true;
            }
        } else {
            // Step 7: Store first occurrence
            remainderIndex.set(remainder, i);
        }
    }

    return false;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(min(n, k)) - at most k different remainders

---

### Problem 8: Subarray Sums Divisible by K
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/subarray-sums-divisible-by-k/](https://leetcode.com/problems/subarray-sums-divisible-by-k/)

**Description**: Find the number of subarrays whose sum is divisible by k.

#### Python Solution
```python
def subarraysDivByK(nums: List[int], k: int) -> int:
    # Step 1: Initialize variables
    count = 0
    prefix_sum = 0
    # Store frequency of each remainder
    remainder_count = {0: 1}  # Base case: remainder 0 appears once

    # Step 2: Iterate through array
    for num in nums:
        # Step 3: Update prefix sum
        prefix_sum += num

        # Step 4: Calculate remainder
        # Use modulo to handle negative numbers correctly
        remainder = prefix_sum % k

        # Step 5: In Python, -1 % 5 = 4, but we want consistent positive remainders
        # This is already handled correctly by Python's modulo

        # Step 6: If this remainder seen before, add its count
        # All previous positions with same remainder can form valid subarrays
        if remainder in remainder_count:
            count += remainder_count[remainder]

        # Step 7: Update remainder count
        remainder_count[remainder] = remainder_count.get(remainder, 0) + 1

    return count

# Example: nums = [4, 5, 0, -2, -3, 1], k = 5
# i=0: sum=4, rem=4, count=0, map={0:1, 4:1}
# i=1: sum=9, rem=4, count=1, map={0:1, 4:2}
# i=2: sum=9, rem=4, count=3, map={0:1, 4:3}
# i=3: sum=7, rem=2, count=3, map={0:1, 4:3, 2:1}
# i=4: sum=4, rem=4, count=6, map={0:1, 4:4, 2:1}
# i=5: sum=5, rem=0, count=7, map={0:2, 4:4, 2:1}
# Answer: 7
```

#### TypeScript Solution
```typescript
function subarraysDivByK(nums: number[], k: number): number {
    // Step 1: Initialize variables
    let count = 0;
    let prefixSum = 0;
    const remainderCount = new Map<number, number>();
    remainderCount.set(0, 1);

    // Step 2: Iterate through array
    for (const num of nums) {
        // Step 3: Update prefix sum
        prefixSum += num;

        // Step 4: Calculate remainder (handle negative numbers)
        let remainder = prefixSum % k;
        if (remainder < 0) {
            remainder += k; // Ensure positive remainder
        }

        // Step 5: Add count of previous occurrences
        if (remainderCount.has(remainder)) {
            count += remainderCount.get(remainder)!;
        }

        // Step 6: Update remainder count
        remainderCount.set(remainder, (remainderCount.get(remainder) || 0) + 1);
    }

    return count;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(k) - at most k different remainders

---

### Problem 9: Maximum Size Subarray Sum Equals k
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/maximum-size-subarray-sum-equals-k/](https://leetcode.com/problems/maximum-size-subarray-sum-equals-k/)

**Description**: Find the maximum length of a subarray that sums to k.

#### Python Solution
```python
def maxSubArrayLen(nums: List[int], k: int) -> int:
    # Step 1: Initialize variables
    max_length = 0
    prefix_sum = 0
    # Map: prefix_sum -> earliest index where this sum appears
    sum_index = {0: -1}  # Base case for subarrays starting at index 0

    # Step 2: Iterate through array
    for i in range(len(nums)):
        # Step 3: Update prefix sum
        prefix_sum += nums[i]

        # Step 4: Check if (prefix_sum - k) exists in map
        # This means there's a subarray ending at i with sum k
        target = prefix_sum - k
        if target in sum_index:
            # Step 5: Calculate length and update max
            length = i - sum_index[target]
            max_length = max(max_length, length)

        # Step 6: Store first occurrence of this prefix sum
        # We only store first occurrence to maximize subarray length
        if prefix_sum not in sum_index:
            sum_index[prefix_sum] = i

    return max_length

# Example: nums = [1, -1, 5, -2, 3], k = 3
# i=0: sum=1, target=-2, map={0:-1, 1:0}, max_len=0
# i=1: sum=0, target=-3, map={0:-1, 1:0}, max_len=0 (don't update 0's index)
# i=2: sum=5, target=2, map={0:-1, 1:0, 5:2}, max_len=0
# i=3: sum=3, target=0, found at -1, length=3-(-1)=4, max_len=4
# i=4: sum=6, target=3, map={0:-1, 1:0, 5:2, 3:3, 6:4}, max_len=4
# Answer: 4 (subarray [1, -1, 5, -2])
```

#### TypeScript Solution
```typescript
function maxSubArrayLen(nums: number[], k: number): number {
    // Step 1: Initialize variables
    let maxLength = 0;
    let prefixSum = 0;
    const sumIndex = new Map<number, number>();
    sumIndex.set(0, -1);

    // Step 2: Iterate through array
    for (let i = 0; i < nums.length; i++) {
        // Step 3: Update prefix sum
        prefixSum += nums[i];

        // Step 4: Check if target exists
        const target = prefixSum - k;
        if (sumIndex.has(target)) {
            // Step 5: Update max length
            const length = i - sumIndex.get(target)!;
            maxLength = Math.max(maxLength, length);
        }

        // Step 6: Store first occurrence only
        if (!sumIndex.has(prefixSum)) {
            sumIndex.set(prefixSum, i);
        }
    }

    return maxLength;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(n) - hashmap storing prefix sums

---

### Problem 10: Path Sum III
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/path-sum-iii/](https://leetcode.com/problems/path-sum-iii/)

**Description**: Find the number of paths in a binary tree that sum to a target value. Path doesn't need to start or end at root/leaf.

#### Python Solution
```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def pathSum(root: TreeNode, targetSum: int) -> int:
    # Step 1: Initialize hashmap to store prefix sums
    # Key insight: Use prefix sum concept in tree traversal
    prefix_count = {0: 1}  # Base case

    def dfs(node: TreeNode, current_sum: int) -> int:
        if not node:
            return 0

        # Step 2: Update current sum
        current_sum += node.val

        # Step 3: Check how many paths end at current node with target sum
        # Look for (current_sum - targetSum) in prefix counts
        count = prefix_count.get(current_sum - targetSum, 0)

        # Step 4: Add current sum to prefix counts
        prefix_count[current_sum] = prefix_count.get(current_sum, 0) + 1

        # Step 5: Recursively process left and right subtrees
        count += dfs(node.left, current_sum)
        count += dfs(node.right, current_sum)

        # Step 6: Backtrack - remove current sum from prefix counts
        # This is crucial for correct counting in other branches
        prefix_count[current_sum] -= 1

        return count

    return dfs(root, 0)

# Tree visualization:
#       10
#      /  \
#     5   -3
#    / \    \
#   3   2   11
#  / \   \
# 3  -2   1
#
# For targetSum = 8:
# Paths: [5, 3], [5, 2, 1], [-3, 11]
```

#### TypeScript Solution
```typescript
class TreeNode {
    val: number;
    left: TreeNode | null;
    right: TreeNode | null;
    constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
        this.val = (val === undefined ? 0 : val);
        this.left = (left === undefined ? null : left);
        this.right = (right === undefined ? null : right);
    }
}

function pathSum(root: TreeNode | null, targetSum: number): number {
    // Step 1: Initialize prefix count map
    const prefixCount = new Map<number, number>();
    prefixCount.set(0, 1);

    function dfs(node: TreeNode | null, currentSum: number): number {
        if (!node) return 0;

        // Step 2: Update current sum
        currentSum += node.val;

        // Step 3: Count paths ending at current node
        let count = prefixCount.get(currentSum - targetSum) || 0;

        // Step 4: Add current sum to map
        prefixCount.set(currentSum, (prefixCount.get(currentSum) || 0) + 1);

        // Step 5: Process subtrees
        count += dfs(node.left, currentSum);
        count += dfs(node.right, currentSum);

        // Step 6: Backtrack
        prefixCount.set(currentSum, prefixCount.get(currentSum)! - 1);

        return count;
    }

    return dfs(root, 0);
}
```

**Time Complexity**: O(n) - visit each node once
**Space Complexity**: O(h) - recursion stack and hashmap, where h is tree height

---

### Problem 11: Minimum Size Subarray Sum
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/minimum-size-subarray-sum/](https://leetcode.com/problems/minimum-size-subarray-sum/)

**Description**: Find the minimal length of a contiguous subarray whose sum is greater than or equal to target.

#### Python Solution
```python
def minSubArrayLen(target: int, nums: List[int]) -> int:
    # Note: This is better solved with sliding window, but showing prefix sum approach

    # Step 1: Build prefix sum array
    n = len(nums)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]

    # Step 2: Initialize min length
    min_length = float('inf')

    # Step 3: For each starting position
    for i in range(n):
        # Step 4: Binary search for ending position
        # Find smallest j where prefix[j] - prefix[i] >= target
        left, right = i + 1, n

        while left <= right:
            mid = (left + right) // 2
            current_sum = prefix[mid] - prefix[i]

            if current_sum >= target:
                # Step 5: Update min length
                min_length = min(min_length, mid - i)
                right = mid - 1  # Try to find smaller length
            else:
                left = mid + 1  # Need larger sum

    # Step 6: Return result
    return min_length if min_length != float('inf') else 0

# Alternative: Sliding Window approach (more efficient)
def minSubArrayLen_sliding_window(target: int, nums: List[int]) -> int:
    min_length = float('inf')
    current_sum = 0
    left = 0

    for right in range(len(nums)):
        current_sum += nums[right]

        while current_sum >= target:
            min_length = min(min_length, right - left + 1)
            current_sum -= nums[left]
            left += 1

    return min_length if min_length != float('inf') else 0
```

#### TypeScript Solution
```typescript
function minSubArrayLen(target: number, nums: number[]): number {
    // Sliding window approach (more efficient than prefix sum for this problem)
    let minLength = Infinity;
    let currentSum = 0;
    let left = 0;

    // Step 1: Expand window with right pointer
    for (let right = 0; right < nums.length; right++) {
        // Step 2: Add current element to sum
        currentSum += nums[right];

        // Step 3: Shrink window while sum >= target
        while (currentSum >= target) {
            // Step 4: Update min length
            minLength = Math.min(minLength, right - left + 1);

            // Step 5: Remove leftmost element
            currentSum -= nums[left];
            left++;
        }
    }

    // Step 6: Return result
    return minLength === Infinity ? 0 : minLength;
}
```

**Time Complexity**: O(n) for sliding window, O(n log n) for prefix sum + binary search
**Space Complexity**: O(1) for sliding window, O(n) for prefix sum array

---

### Problem 12: Make Sum Divisible by P
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/make-sum-divisible-by-p/](https://leetcode.com/problems/make-sum-divisible-by-p/)

**Description**: Remove the smallest subarray (possibly empty) such that the sum of remaining elements is divisible by p.

#### Python Solution
```python
def minSubarray(nums: List[int], p: int) -> int:
    # Step 1: Calculate total sum and target remainder
    total_sum = sum(nums)
    target_remainder = total_sum % p

    # Step 2: If already divisible, return 0
    if target_remainder == 0:
        return 0

    # Step 3: Initialize variables
    min_length = len(nums)
    prefix_sum = 0
    # Map: remainder -> most recent index
    remainder_index = {0: -1}

    # Step 4: Iterate through array
    for i in range(len(nums)):
        # Step 5: Update prefix sum and its remainder
        prefix_sum += nums[i]
        current_remainder = prefix_sum % p

        # Step 6: Calculate what remainder we need to remove
        # We want: (prefix_sum - subarray_sum) % p == (total_sum - target_remainder) % p
        # Which means: subarray_sum % p == target_remainder
        needed = (current_remainder - target_remainder + p) % p

        # Step 7: Check if we've seen this needed remainder
        if needed in remainder_index:
            # Step 8: Update min length
            length = i - remainder_index[needed]
            min_length = min(min_length, length)

        # Step 9: Store current remainder with index
        remainder_index[current_remainder] = i

    # Step 10: Return result (or -1 if we need to remove entire array)
    return min_length if min_length < len(nums) else -1

# Example: nums = [3, 1, 4, 2], p = 6
# total = 10, target_remainder = 4
# Need to remove subarray with sum % 6 == 4
# i=0: sum=3, rem=3, needed=(3-4+6)%6=5, map={0:-1, 3:0}
# i=1: sum=4, rem=4, needed=(4-4+6)%6=0, found at -1, len=1-(-1)=2, map={0:-1, 3:0, 4:1}
# i=2: sum=8, rem=2, needed=(2-4+6)%6=4, found at 1, len=2-1=1, map={0:-1, 3:0, 4:1, 2:2}
# i=3: sum=10, rem=4, needed=0, found at -1, len=3-(-1)=4, map={0:-1, 3:0, 4:3, 2:2}
# Answer: 1 (remove [4])
```

#### TypeScript Solution
```typescript
function minSubarray(nums: number[], p: number): number {
    // Step 1: Calculate total sum and target remainder
    const totalSum = nums.reduce((acc, num) => acc + num, 0);
    const targetRemainder = totalSum % p;

    // Step 2: Already divisible
    if (targetRemainder === 0) return 0;

    // Step 3: Initialize variables
    let minLength = nums.length;
    let prefixSum = 0;
    const remainderIndex = new Map<number, number>();
    remainderIndex.set(0, -1);

    // Step 4: Iterate through array
    for (let i = 0; i < nums.length; i++) {
        // Step 5: Update prefix sum
        prefixSum += nums[i];
        const currentRemainder = prefixSum % p;

        // Step 6: Calculate needed remainder
        const needed = (currentRemainder - targetRemainder + p) % p;

        // Step 7: Check if needed remainder exists
        if (remainderIndex.has(needed)) {
            const length = i - remainderIndex.get(needed)!;
            minLength = Math.min(minLength, length);
        }

        // Step 8: Store current remainder
        remainderIndex.set(currentRemainder, i);
    }

    // Step 9: Return result
    return minLength < nums.length ? minLength : -1;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(min(n, p)) - at most p different remainders

---

### Problem 13: Count Number of Nice Subarrays
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/count-number-of-nice-subarrays/](https://leetcode.com/problems/count-number-of-nice-subarrays/)

**Description**: Find the number of nice subarrays. A subarray is nice if it has exactly k odd numbers.

#### Python Solution
```python
def numberOfSubarrays(nums: List[int], k: int) -> int:
    # Step 1: Transform problem - count 1s for odd, 0s for even
    # Then find subarrays with sum exactly k

    # Step 2: Initialize variables
    count = 0
    prefix_sum = 0
    # Map: prefix_sum -> frequency
    sum_count = {0: 1}

    # Step 3: Iterate through array
    for num in nums:
        # Step 4: Add 1 if odd, 0 if even
        prefix_sum += num % 2

        # Step 5: Check if (prefix_sum - k) exists
        # This gives subarrays ending at current position with exactly k odds
        if prefix_sum - k in sum_count:
            count += sum_count[prefix_sum - k]

        # Step 6: Update sum count
        sum_count[prefix_sum] = sum_count.get(prefix_sum, 0) + 1

    return count

# Example: nums = [1, 1, 2, 1, 1], k = 3
# Transform to: [1, 1, 0, 1, 1] (odd counts)
# i=0: sum=1, target=-2, map={0:1, 1:1}, count=0
# i=1: sum=2, target=-1, map={0:1, 1:1, 2:1}, count=0
# i=2: sum=2, target=-1, map={0:1, 1:1, 2:2}, count=0
# i=3: sum=3, target=0, found with count=1, map={0:1, 1:1, 2:2, 3:1}, count=1
# i=4: sum=4, target=1, found with count=1, map={0:1, 1:1, 2:2, 3:1, 4:1}, count=2
# Subarrays: [1,1,2,1], [1,2,1,1]
```

#### TypeScript Solution
```typescript
function numberOfSubarrays(nums: number[], k: number): number {
    // Step 1: Initialize variables
    let count = 0;
    let prefixSum = 0;
    const sumCount = new Map<number, number>();
    sumCount.set(0, 1);

    // Step 2: Iterate through array
    for (const num of nums) {
        // Step 3: Count odd numbers (1 for odd, 0 for even)
        prefixSum += num % 2;

        // Step 4: Check if we can form nice subarrays
        const target = prefixSum - k;
        if (sumCount.has(target)) {
            count += sumCount.get(target)!;
        }

        // Step 5: Update sum count
        sumCount.set(prefixSum, (sumCount.get(prefixSum) || 0) + 1);
    }

    return count;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(n) - hashmap storing prefix sums

---

### Problem 14: Maximum Sum of Two Non-Overlapping Subarrays
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/maximum-sum-of-two-non-overlapping-subarrays/](https://leetcode.com/problems/maximum-sum-of-two-non-overlapping-subarrays/)

**Description**: Find the maximum sum of two non-overlapping subarrays with lengths firstLen and secondLen.

#### Python Solution
```python
def maxSumTwoNoOverlap(nums: List[int], firstLen: int, secondLen: int) -> int:
    # Step 1: Build prefix sum array
    n = len(nums)
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]

    # Helper function to get sum of subarray from i to j (inclusive)
    def get_sum(i: int, j: int) -> int:
        return prefix[j + 1] - prefix[i]

    # Step 2: Try firstLen subarray before secondLen subarray
    max_sum = 0
    max_first = 0

    for i in range(firstLen + secondLen - 1, n):
        # Step 3: Update max sum of firstLen subarray seen so far
        # This is the firstLen subarray ending at position (i - secondLen)
        max_first = max(max_first, get_sum(i - firstLen - secondLen + 1, i - secondLen))

        # Step 4: Current secondLen subarray sum
        current_second = get_sum(i - secondLen + 1, i)

        # Step 5: Update max sum
        max_sum = max(max_sum, max_first + current_second)

    # Step 6: Try secondLen subarray before firstLen subarray
    max_second = 0

    for i in range(firstLen + secondLen - 1, n):
        # Step 7: Update max sum of secondLen subarray seen so far
        max_second = max(max_second, get_sum(i - firstLen - secondLen + 1, i - firstLen))

        # Step 8: Current firstLen subarray sum
        current_first = get_sum(i - firstLen + 1, i)

        # Step 9: Update max sum
        max_sum = max(max_sum, max_second + current_first)

    return max_sum

# Visualization for nums = [0,6,5,2,2,5,1,9,4], firstLen = 1, secondLen = 2:
# Try first before second: [6] + [5,2] = 13 (not max)
# Try second before first: [5,2] + [9] = 16 or [2,5] + [9] = 16 (max)
```

#### TypeScript Solution
```typescript
function maxSumTwoNoOverlap(nums: number[], firstLen: number, secondLen: number): number {
    // Step 1: Build prefix sum
    const n = nums.length;
    const prefix: number[] = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }

    // Helper to get subarray sum
    const getSum = (i: number, j: number): number => {
        return prefix[j + 1] - prefix[i];
    };

    let maxSum = 0;

    // Step 2: Try firstLen before secondLen
    let maxFirst = 0;
    for (let i = firstLen + secondLen - 1; i < n; i++) {
        maxFirst = Math.max(maxFirst,
            getSum(i - firstLen - secondLen + 1, i - secondLen));
        const currentSecond = getSum(i - secondLen + 1, i);
        maxSum = Math.max(maxSum, maxFirst + currentSecond);
    }

    // Step 3: Try secondLen before firstLen
    let maxSecond = 0;
    for (let i = firstLen + secondLen - 1; i < n; i++) {
        maxSecond = Math.max(maxSecond,
            getSum(i - firstLen - secondLen + 1, i - firstLen));
        const currentFirst = getSum(i - firstLen + 1, i);
        maxSum = Math.max(maxSum, maxSecond + currentFirst);
    }

    return maxSum;
}
```

**Time Complexity**: O(n) - two passes through array
**Space Complexity**: O(n) - prefix sum array

---

### Problem 15: Sum of All Odd Length Subarrays
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/sum-of-all-odd-length-subarrays/](https://leetcode.com/problems/sum-of-all-odd-length-subarrays/)

**Description**: Calculate the sum of all possible odd-length subarrays.

#### Python Solution
```python
def sumOddLengthSubarrays(arr: List[int]) -> int:
    # Method 1: Using prefix sum (straightforward)
    n = len(arr)

    # Step 1: Build prefix sum array
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + arr[i]

    # Step 2: Calculate sum of all odd-length subarrays
    total_sum = 0

    # Step 3: Try all odd lengths
    for length in range(1, n + 1, 2):  # 1, 3, 5, 7, ...
        # Step 4: Try all starting positions for this length
        for start in range(n - length + 1):
            # Step 5: Get sum using prefix array
            end = start + length - 1
            subarray_sum = prefix[end + 1] - prefix[start]
            total_sum += subarray_sum

    return total_sum

# Method 2: Mathematical approach (more efficient)
def sumOddLengthSubarrays_optimized(arr: List[int]) -> int:
    total_sum = 0
    n = len(arr)

    # Step 1: For each element, count how many odd-length subarrays contain it
    for i in range(n):
        # Step 2: Calculate number of subarrays starting before/at i and ending at/after i
        left_count = i + 1  # Positions where subarray can start
        right_count = n - i  # Positions where subarray can end

        # Step 3: Total subarrays containing arr[i]
        total_subarrays = left_count * right_count

        # Step 4: Count odd-length subarrays
        # If total is even, half are odd-length; if odd, (total+1)/2 are odd-length
        odd_count = (total_subarrays + 1) // 2

        # Step 5: Add contribution of arr[i]
        total_sum += arr[i] * odd_count

    return total_sum

# Example: arr = [1, 4, 2, 5, 3]
# Odd-length subarrays:
# Length 1: [1], [4], [2], [5], [3] -> sum = 15
# Length 3: [1,4,2], [4,2,5], [2,5,3] -> sum = 7+11+10 = 28
# Length 5: [1,4,2,5,3] -> sum = 15
# Total: 58
```

#### TypeScript Solution
```typescript
function sumOddLengthSubarrays(arr: number[]): number {
    // Mathematical approach
    let totalSum = 0;
    const n = arr.length;

    // Step 1: For each element, count odd-length subarrays containing it
    for (let i = 0; i < n; i++) {
        // Step 2: Count possible start and end positions
        const leftCount = i + 1;
        const rightCount = n - i;

        // Step 3: Total subarrays containing arr[i]
        const totalSubarrays = leftCount * rightCount;

        // Step 4: Count odd-length subarrays
        const oddCount = Math.floor((totalSubarrays + 1) / 2);

        // Step 5: Add contribution
        totalSum += arr[i] * oddCount;
    }

    return totalSum;
}

// Alternative: Prefix sum approach
function sumOddLengthSubarrays_prefix(arr: number[]): number {
    const n = arr.length;

    // Step 1: Build prefix sum
    const prefix: number[] = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }

    let totalSum = 0;

    // Step 2: Try all odd lengths
    for (let length = 1; length <= n; length += 2) {
        // Step 3: Try all starting positions
        for (let start = 0; start <= n - length; start++) {
            const end = start + length - 1;
            totalSum += prefix[end + 1] - prefix[start];
        }
    }

    return totalSum;
}
```

**Time Complexity**: O(n) for optimized, O(n²) for prefix sum approach
**Space Complexity**: O(1) for optimized, O(n) for prefix sum approach

---

## Summary

The **Prefix Sum** pattern is invaluable for efficiently handling range queries and subarray sum problems. Key takeaways:

1. **Preprocessing pays off**: Spend O(n) once to answer queries in O(1)
2. **HashMap + Prefix Sum**: Powerful combo for "subarray with sum X" problems
3. **Remainder tracking**: Use modulo with prefix sums for divisibility problems
4. **2D extension**: Same concept applies to matrices for rectangle sum queries
5. **Mathematical optimization**: Sometimes you can avoid storing prefix sums entirely

Practice recognizing when cumulative sums can simplify your solution!
