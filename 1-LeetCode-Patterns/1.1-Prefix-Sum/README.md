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

#### Concept Visualization - Think of it as a Running Total
```
Original Array:     [2,  4,  1,  5,  3]
                     ↓   ↓   ↓   ↓   ↓
Prefix Sum Array:   [2,  6,  7, 12, 15]

Explanation - Building the Prefix Sum:
prefix[0] = 2                    (just 2)
prefix[1] = 2 + 4       = 6      (everything up to index 1)
prefix[2] = 2 + 4 + 1   = 7      (everything up to index 2)
prefix[3] = 2 + 4 + 1 + 5 = 12   (everything up to index 3)
prefix[4] = 2 + 4 + 1 + 5 + 3 = 15 (everything up to index 4)

Think of it like a water tank filling up:
   Tank capacity after each element added
   [2] → [6] → [7] → [12] → [15]
```

#### Range Sum Query Visualization
```
To find sum from index i to j:
sum(i, j) = prefix[j] - prefix[i-1]

Visual Example: What is the sum from index 1 to 3?

Array:  [2,  4,  1,  5,  3]
Index:   0   1   2   3   4
         └───┴───┴───┘
         We want this range (1 to 3)

prefix[3] = sum of [2, 4, 1, 5] = 12
prefix[0] = sum of [2] = 2
sum(1,3) = prefix[3] - prefix[0] = 12 - 2 = 10 ✓

Think: "Total up to 3" minus "Total up to 0" = "Middle portion (1 to 3)"

Visual representation:
[====2====][====4====][====1====][====5====][====3====]
 └─prefix[0]─┘
 └───────────────────prefix[3]─────────────┘
              └─────────sum(1,3)───────────┘
```

#### HashMap + Prefix Sum Visualization (For Subarray Sum = K)
```
Problem: Find subarrays with sum = 5 in [1, 2, 3, -1, 5]

Step-by-step visualization:
idx:  0   1   2   3   4
arr: [1,  2,  3, -1,  5]

i=0: prefix_sum = 1
     Looking for: 1 - 5 = -4 (not found)
     map = {0: 1, 1: 1}

i=1: prefix_sum = 3
     Looking for: 3 - 5 = -2 (not found)
     map = {0: 1, 1: 1, 3: 1}

i=2: prefix_sum = 6
     Looking for: 6 - 5 = 1 (FOUND! count += 1)
     This means: subarray from after index 0 to index 2 = [2, 3] sums to 5
     map = {0: 1, 1: 1, 3: 1, 6: 1}

i=3: prefix_sum = 5
     Looking for: 5 - 5 = 0 (FOUND! count += 1)
     This means: subarray from start to index 3 = [1, 2, 3, -1] sums to 5
     map = {0: 1, 1: 1, 3: 1, 6: 1, 5: 1}

i=4: prefix_sum = 10
     Looking for: 10 - 5 = 5 (FOUND! count += 1)
     This means: subarray from after index 3 to index 4 = [5] sums to 5
     map = {0: 1, 1: 1, 3: 1, 6: 1, 5: 1, 10: 1}

Total count = 3 subarrays: [2,3], [1,2,3,-1], [5]
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

### Problem 16: Running Sum of 1D Array
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/running-sum-of-1d-array/](https://leetcode.com/problems/running-sum-of-1d-array/)

**Description**: Calculate the running sum of an array where running sum is defined as runningSum[i] = sum(nums[0]…nums[i]).

#### Python Solution
```python
def runningSum(nums: List[int]) -> List[int]:
    # Step 1: Initialize result array
    # This is literally building a prefix sum array
    result = []
    running_total = 0

    # Step 2: Iterate through array
    for num in nums:
        # Step 3: Add current number to running total
        running_total += num

        # Step 4: Append to result
        result.append(running_total)

    return result

# Alternative: In-place modification
def runningSum_inplace(nums: List[int]) -> List[int]:
    # Modify array in-place to save space
    for i in range(1, len(nums)):
        nums[i] += nums[i - 1]

    return nums

# Visualization for nums = [1, 2, 3, 4]:
# i=0: running_total=1, result=[1]
# i=1: running_total=3, result=[1, 3]
# i=2: running_total=6, result=[1, 3, 6]
# i=3: running_total=10, result=[1, 3, 6, 10]
```

#### TypeScript Solution
```typescript
function runningSum(nums: number[]): number[] {
    // Step 1: Initialize result array
    const result: number[] = [];
    let runningTotal = 0;

    // Step 2: Build running sum
    for (const num of nums) {
        runningTotal += num;
        result.push(runningTotal);
    }

    return result;
}

// In-place version
function runningSumInPlace(nums: number[]): number[] {
    for (let i = 1; i < nums.length; i++) {
        nums[i] += nums[i - 1];
    }
    return nums;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) for in-place, O(n) for new array

---

### Problem 17: Find the Middle Index in Array
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/find-the-middle-index-in-array/](https://leetcode.com/problems/find-the-middle-index-in-array/)

**Description**: Find the index where sum of elements to the left equals sum of elements to the right.

#### Python Solution
```python
def findMiddleIndex(nums: List[int]) -> int:
    # Step 1: Calculate total sum
    total_sum = sum(nums)

    # Step 2: Track left sum
    left_sum = 0

    # Step 3: Iterate through array
    for i in range(len(nums)):
        # Step 4: Calculate right sum
        # right_sum = total - left - current
        right_sum = total_sum - left_sum - nums[i]

        # Step 5: Check if balanced
        if left_sum == right_sum:
            return i

        # Step 6: Update left sum
        left_sum += nums[i]

    return -1

# Visualization for nums = [2, 3, -1, 8, 4]:
# total = 16
# i=0: left=0, right=16-0-2=14, left!=right, left=2
# i=1: left=2, right=16-2-3=11, left!=right, left=5
# i=2: left=5, right=16-5-(-1)=12, left!=right, left=4
# i=3: left=4, right=16-4-8=4, left==right ✓, return 3
```

#### TypeScript Solution
```typescript
function findMiddleIndex(nums: number[]): number {
    // Step 1: Calculate total sum
    const totalSum = nums.reduce((acc, num) => acc + num, 0);

    // Step 2: Track left sum
    let leftSum = 0;

    // Step 3: Find middle index
    for (let i = 0; i < nums.length; i++) {
        const rightSum = totalSum - leftSum - nums[i];

        if (leftSum === rightSum) {
            return i;
        }

        leftSum += nums[i];
    }

    return -1;
}
```

**Time Complexity**: O(n) - single pass after calculating total
**Space Complexity**: O(1) - only using constant space

---

### Problem 18: Minimum Value to Get Positive Step by Step Sum
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/minimum-value-to-get-positive-step-by-step-sum/](https://leetcode.com/problems/minimum-value-to-get-positive-step-by-step-sum/)

**Description**: Find the minimum positive start value such that the step-by-step sum is never less than 1.

#### Python Solution
```python
def minStartValue(nums: List[int]) -> int:
    # Step 1: Calculate minimum prefix sum
    # If minimum prefix sum is negative, we need to add enough to make it positive

    prefix_sum = 0
    min_prefix = 0

    # Step 2: Find minimum prefix sum
    for num in nums:
        prefix_sum += num
        min_prefix = min(min_prefix, prefix_sum)

    # Step 3: Calculate required start value
    # If min_prefix is -5, we need startValue of 6 (so -5 + 6 = 1)
    return 1 - min_prefix

# Visualization for nums = [-3, 2, -3, 4, 2]:
# i=0: prefix=-3, min_prefix=-3
# i=1: prefix=-1, min_prefix=-3
# i=2: prefix=-4, min_prefix=-4
# i=3: prefix=0, min_prefix=-4
# i=4: prefix=2, min_prefix=-4
#
# min_prefix = -4, so startValue = 1 - (-4) = 5
# With startValue=5: [5, 2, 4, 1, 5, 7] ✓ all positive
```

#### TypeScript Solution
```typescript
function minStartValue(nums: number[]): number {
    // Step 1: Find minimum prefix sum
    let prefixSum = 0;
    let minPrefix = 0;

    for (const num of nums) {
        prefixSum += num;
        minPrefix = Math.min(minPrefix, prefixSum);
    }

    // Step 2: Calculate required start value
    return 1 - minPrefix;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - only using constant space

---

### Problem 19: Ways to Split Array Into Three Subarrays
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/ways-to-split-array-into-three-subarrays/](https://leetcode.com/problems/ways-to-split-array-into-three-subarrays/)

**Description**: Count ways to split array into three non-empty contiguous subarrays (left, mid, right) where sum(left) <= sum(mid) <= sum(right).

#### Python Solution
```python
def waysToSplit(nums: List[int]) -> int:
    MOD = 10**9 + 7
    n = len(nums)

    # Step 1: Build prefix sum
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]

    total = prefix[n]
    count = 0

    # Step 2: For each possible left partition
    for i in range(n - 2):  # Need at least 2 more elements
        left_sum = prefix[i + 1]

        # Step 3: Find valid range for mid partition using binary search
        # Condition 1: sum(mid) >= sum(left)
        # prefix[j+1] - prefix[i+1] >= prefix[i+1]
        # prefix[j+1] >= 2 * prefix[i+1]

        # Binary search for minimum j
        lo, hi = i + 1, n - 1
        min_j = n
        while lo <= hi:
            mid = (lo + hi) // 2
            mid_sum = prefix[mid + 1] - prefix[i + 1]
            if mid_sum >= left_sum:
                min_j = mid
                hi = mid - 1
            else:
                lo = mid + 1

        # Condition 2: sum(mid) <= sum(right)
        # prefix[j+1] - prefix[i+1] <= total - prefix[j+1]
        # 2 * prefix[j+1] <= total + prefix[i+1]

        # Binary search for maximum j
        lo, hi = i + 1, n - 1
        max_j = i
        while lo <= hi:
            mid = (lo + hi) // 2
            mid_sum = prefix[mid + 1] - prefix[i + 1]
            right_sum = total - prefix[mid + 1]
            if mid_sum <= right_sum:
                max_j = mid
                lo = mid + 1
            else:
                hi = mid - 1

        # Step 4: Add valid splits
        if max_j >= min_j:
            count = (count + max_j - min_j + 1) % MOD

    return count
```

#### TypeScript Solution
```typescript
function waysToSplit(nums: number[]): number {
    const MOD = 1e9 + 7;
    const n = nums.length;

    // Step 1: Build prefix sum
    const prefix: number[] = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }

    const total = prefix[n];
    let count = 0;

    // Step 2: Iterate through possible left partitions
    for (let i = 0; i < n - 2; i++) {
        const leftSum = prefix[i + 1];

        // Binary search for minimum valid mid endpoint
        let lo = i + 1, hi = n - 1, minJ = n;
        while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            const midSum = prefix[mid + 1] - prefix[i + 1];
            if (midSum >= leftSum) {
                minJ = mid;
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        }

        // Binary search for maximum valid mid endpoint
        lo = i + 1; hi = n - 1; let maxJ = i;
        while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            const midSum = prefix[mid + 1] - prefix[i + 1];
            const rightSum = total - prefix[mid + 1];
            if (midSum <= rightSum) {
                maxJ = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }

        if (maxJ >= minJ) {
            count = (count + maxJ - minJ + 1) % MOD;
        }
    }

    return count;
}
```

**Time Complexity**: O(n log n) - n iterations with binary search
**Space Complexity**: O(n) - prefix sum array

---

### Problem 20: Maximum Absolute Sum of Any Subarray
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/maximum-absolute-sum-of-any-subarray/](https://leetcode.com/problems/maximum-absolute-sum-of-any-subarray/)

**Description**: Find the maximum absolute value of sum of any subarray.

#### Python Solution
```python
def maxAbsoluteSum(nums: List[int]) -> int:
    # Step 1: Key insight - max absolute sum is either max sum or min sum (absolute)
    # We need to find both maximum subarray sum and minimum subarray sum

    # Step 2: Find maximum subarray sum (Kadane's algorithm)
    max_sum = float('-inf')
    current_max = 0

    for num in nums:
        current_max = max(num, current_max + num)
        max_sum = max(max_sum, current_max)

    # Step 3: Find minimum subarray sum (reverse Kadane's)
    min_sum = float('inf')
    current_min = 0

    for num in nums:
        current_min = min(num, current_min + num)
        min_sum = min(min_sum, current_min)

    # Step 4: Return maximum absolute value
    return max(abs(max_sum), abs(min_sum))

# Alternative: Using prefix sum approach
def maxAbsoluteSum_prefix(nums: List[int]) -> int:
    prefix_sum = 0
    max_prefix = 0
    min_prefix = 0
    result = 0

    for num in nums:
        prefix_sum += num

        # Maximum absolute sum ending here
        result = max(result, abs(prefix_sum - min_prefix))
        result = max(result, abs(prefix_sum - max_prefix))

        # Update max and min prefix sums
        max_prefix = max(max_prefix, prefix_sum)
        min_prefix = min(min_prefix, prefix_sum)

    return result

# Visualization for nums = [1, -3, 2, 3, -4]:
# Max sum: subarray [2, 3] = 5
# Min sum: subarray [-3] or [1,-3] or [-4] = -3 or -4
# Max absolute: max(5, |-4|) = 5
```

#### TypeScript Solution
```typescript
function maxAbsoluteSum(nums: number[]): number {
    // Kadane's algorithm for max and min
    let maxSum = -Infinity;
    let minSum = Infinity;
    let currentMax = 0;
    let currentMin = 0;

    for (const num of nums) {
        // Track maximum sum
        currentMax = Math.max(num, currentMax + num);
        maxSum = Math.max(maxSum, currentMax);

        // Track minimum sum
        currentMin = Math.min(num, currentMin + num);
        minSum = Math.min(minSum, currentMin);
    }

    return Math.max(Math.abs(maxSum), Math.abs(minSum));
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - only using constant space

---

### Problem 21: Corporate Flight Bookings
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/corporate-flight-bookings/](https://leetcode.com/problems/corporate-flight-bookings/)

**Description**: Given bookings where bookings[i] = [first, last, seats], add seats to flights first through last. Return array of total seats per flight.

#### Python Solution
```python
def corpFlightBookings(bookings: List[List[int]], n: int) -> List[int]:
    # Step 1: Use difference array technique (inverse of prefix sum)
    # Instead of updating range [l, r], we mark boundaries

    answer = [0] * n

    # Step 2: Process each booking
    for first, last, seats in bookings:
        # Step 3: Add seats at start of range (1-indexed to 0-indexed)
        answer[first - 1] += seats

        # Step 4: Subtract seats after end of range
        if last < n:
            answer[last] -= seats

    # Step 5: Calculate prefix sum to get actual values
    for i in range(1, n):
        answer[i] += answer[i - 1]

    return answer

# Visualization for bookings = [[1,2,10],[2,3,20],[2,5,25]], n = 5:
#
# After marking boundaries:
# answer = [10, 0, -10, 0, 0] (first booking [1,2,10])
# answer = [10, 20, -10, -20, 0] (second booking [2,3,20])
# answer = [10, 45, -10, -20, -25] (third booking [2,5,25])
#
# After prefix sum:
# answer[0] = 10
# answer[1] = 10 + 45 = 55
# answer[2] = 55 + (-10) = 45
# answer[3] = 45 + (-20) = 25
# answer[4] = 25 + (-25) = 0
# Result: [10, 55, 45, 25, 25]
```

#### TypeScript Solution
```typescript
function corpFlightBookings(bookings: number[][], n: number): number[] {
    // Step 1: Initialize difference array
    const answer: number[] = new Array(n).fill(0);

    // Step 2: Mark range boundaries
    for (const [first, last, seats] of bookings) {
        answer[first - 1] += seats;
        if (last < n) {
            answer[last] -= seats;
        }
    }

    // Step 3: Calculate prefix sum
    for (let i = 1; i < n; i++) {
        answer[i] += answer[i - 1];
    }

    return answer;
}
```

**Time Complexity**: O(bookings.length + n) - process bookings then build prefix
**Space Complexity**: O(1) - answer array doesn't count as extra space

---

### Problem 22: Car Pooling
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/car-pooling/](https://leetcode.com/problems/car-pooling/)

**Description**: Check if you can pick up and drop off all passengers given car capacity. trips[i] = [numPassengers, from, to].

#### Python Solution
```python
def carPooling(trips: List[List[int]], capacity: int) -> bool:
    # Step 1: Use difference array to track passenger changes
    # Find max location
    max_location = max(trip[2] for trip in trips)

    # Step 2: Create difference array
    passengers = [0] * (max_location + 1)

    # Step 3: Process each trip
    for num, start, end in trips:
        # Step 4: Add passengers at pickup location
        passengers[start] += num

        # Step 5: Remove passengers at drop-off location
        passengers[end] -= num

    # Step 6: Calculate running total and check capacity
    current_passengers = 0
    for change in passengers:
        current_passengers += change

        # Step 7: Check if over capacity
        if current_passengers > capacity:
            return False

    return True

# Alternative: Using sorted events
def carPooling_events(trips: List[List[int]], capacity: int) -> bool:
    # Create events: (location, passenger_change)
    events = []

    for num, start, end in trips:
        events.append((start, num))    # Pickup
        events.append((end, -num))     # Drop-off

    # Sort by location (drop-offs before pickups at same location)
    events.sort()

    current_passengers = 0
    for location, change in events:
        current_passengers += change
        if current_passengers > capacity:
            return False

    return True

# Visualization for trips = [[2,1,5],[3,3,7]], capacity = 4:
#
# Difference array:
# Location: 0  1  2  3  4  5  6  7
# Change:   0 +2  0 +3  0 -2  0 -3
#
# Running total:
# Location: 0  1  2  3  4  5  6  7
# Total:    0  2  2  5  5  3  3  0
#                     ^
#                     Over capacity (5 > 4)! Return False
```

#### TypeScript Solution
```typescript
function carPooling(trips: number[][], capacity: number): boolean {
    // Step 1: Find max location
    const maxLocation = Math.max(...trips.map(t => t[2]));

    // Step 2: Create difference array
    const passengers: number[] = new Array(maxLocation + 1).fill(0);

    // Step 3: Mark passenger changes
    for (const [num, start, end] of trips) {
        passengers[start] += num;
        passengers[end] -= num;
    }

    // Step 4: Check capacity
    let currentPassengers = 0;
    for (const change of passengers) {
        currentPassengers += change;
        if (currentPassengers > capacity) {
            return false;
        }
    }

    return true;
}
```

**Time Complexity**: O(n + max_location) where n is number of trips
**Space Complexity**: O(max_location) for difference array

---

### Problem 23: Number of Wonderful Substrings
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/number-of-wonderful-substrings/](https://leetcode.com/problems/number-of-wonderful-substrings/)

**Description**: Count substrings where at most one letter appears an odd number of times. String contains only letters 'a' to 'j'.

#### Python Solution
```python
def wonderfulSubstrings(word: str) -> int:
    # Step 1: Use bitmask to track odd/even counts of each character
    # Bit i is 1 if character i appears odd times, 0 if even

    # Step 2: Initialize count map
    # mask represents state of odd/even counts
    count_map = {0: 1}  # Empty prefix has all even counts
    mask = 0
    result = 0

    # Step 3: Iterate through string
    for char in word:
        # Step 4: Toggle bit for current character
        bit = ord(char) - ord('a')
        mask ^= (1 << bit)

        # Step 5: Count substrings with all even character counts
        # Same mask means substring between has all even counts
        if mask in count_map:
            result += count_map[mask]

        # Step 6: Count substrings with exactly one odd character
        # Try flipping each bit to find previous states
        for i in range(10):  # Characters 'a' to 'j'
            prev_mask = mask ^ (1 << i)
            if prev_mask in count_map:
                result += count_map[prev_mask]

        # Step 7: Add current mask to map
        count_map[mask] = count_map.get(mask, 0) + 1

    return result

# Visualization for word = "aba":
#
# i=0, char='a':
#   bit=0, mask=0^1=1 (binary: 0001, 'a' appears odd)
#   Check mask=1: not found
#   Check prev_masks: 0,2,3,4,5,6,7,8,9,10 → found 0 with count 1, result+=1
#   map = {0:1, 1:1}
#
# i=1, char='b':
#   bit=1, mask=1^2=3 (binary: 0011, 'a' and 'b' appear odd)
#   Check mask=3: not found
#   Check prev_masks: 2,1,7,3,11,... → found 1 with count 1, result+=1
#   map = {0:1, 1:1, 3:1}
#
# i=2, char='a':
#   bit=0, mask=3^1=2 (binary: 0010, only 'b' appears odd)
#   Check mask=2: not found
#   Check prev_masks: 3,0,6,2,... → found 3 with count 1, result+=1, found 0 with count 1, result+=1
#   map = {0:1, 1:1, 3:1, 2:1}
#
# Total: 4 ("a", "b", "a", "aba")
```

#### TypeScript Solution
```typescript
function wonderfulSubstrings(word: string): number {
    // Step 1: Initialize mask count map
    const countMap = new Map<number, number>();
    countMap.set(0, 1);

    let mask = 0;
    let result = 0;

    // Step 2: Process each character
    for (const char of word) {
        // Step 3: Toggle bit for current character
        const bit = char.charCodeAt(0) - 'a'.charCodeAt(0);
        mask ^= (1 << bit);

        // Step 4: Count substrings with all even counts
        result += countMap.get(mask) || 0;

        // Step 5: Count substrings with one odd count
        for (let i = 0; i < 10; i++) {
            const prevMask = mask ^ (1 << i);
            result += countMap.get(prevMask) || 0;
        }

        // Step 6: Update count map
        countMap.set(mask, (countMap.get(mask) || 0) + 1);
    }

    return result;
}
```

**Time Complexity**: O(n × 10) = O(n) - 10 is constant for 'a' to 'j'
**Space Complexity**: O(2^10) = O(1024) = O(1) - at most 1024 different masks

---

### Problem 24: Subarray Product Less Than K
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/subarray-product-less-than-k/](https://leetcode.com/problems/subarray-product-less-than-k/)

**Description**: Count number of contiguous subarrays where product of all elements is less than k.

#### Python Solution
```python
def numSubarrayProductLessThanK(nums: List[int], k: int) -> int:
    # Note: This is better solved with sliding window
    # But showing prefix product concept

    # Step 1: Edge case
    if k <= 1:
        return 0

    # Step 2: Use sliding window approach
    count = 0
    product = 1
    left = 0

    # Step 3: Expand window with right pointer
    for right in range(len(nums)):
        # Step 4: Update product
        product *= nums[right]

        # Step 5: Shrink window while product >= k
        while product >= k and left <= right:
            product //= nums[left]
            left += 1

        # Step 6: Add count of subarrays ending at right
        # All subarrays from [left, right], [left+1, right], ..., [right, right]
        count += right - left + 1

    return count

# Visualization for nums = [10, 5, 2, 6], k = 100:
#
# right=0: product=10, left=0, count+=1 (subarrays: [10])
# right=1: product=50, left=0, count+=2 (subarrays: [5], [10,5])
# right=2: product=100, shrink: product=10, left=1, count+=2 (subarrays: [2], [5,2])
# right=3: product=60, left=1, count+=3 (subarrays: [6], [2,6], [5,2,6])
# Total: 8 subarrays
```

#### TypeScript Solution
```typescript
function numSubarrayProductLessThanK(nums: number[], k: number): number {
    // Edge case
    if (k <= 1) return 0;

    let count = 0;
    let product = 1;
    let left = 0;

    // Sliding window
    for (let right = 0; right < nums.length; right++) {
        product *= nums[right];

        // Shrink window
        while (product >= k && left <= right) {
            product /= nums[left];
            left++;
        }

        // Count subarrays ending at right
        count += right - left + 1;
    }

    return count;
}
```

**Time Complexity**: O(n) - each element visited at most twice
**Space Complexity**: O(1) - only using constant space

---

### Problem 25: K Radius Subarray Averages
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/k-radius-subarray-averages/](https://leetcode.com/problems/k-radius-subarray-averages/)

**Description**: Calculate k-radius average for each element (average of elements from index-k to index+k).

#### Python Solution
```python
def getAverages(nums: List[int], k: int) -> List[int]:
    n = len(nums)
    result = [-1] * n

    # Step 1: Edge case - if window is larger than array
    window_size = 2 * k + 1
    if window_size > n:
        return result

    # Step 2: Build prefix sum array
    prefix = [0] * (n + 1)
    for i in range(n):
        prefix[i + 1] = prefix[i] + nums[i]

    # Step 3: Calculate average for each valid position
    for i in range(k, n - k):
        # Step 4: Get sum of window [i-k, i+k]
        left_idx = i - k
        right_idx = i + k

        window_sum = prefix[right_idx + 1] - prefix[left_idx]

        # Step 5: Calculate average
        result[i] = window_sum // window_size

    return result

# Alternative: Sliding window approach (more space efficient)
def getAverages_sliding_window(nums: List[int], k: int) -> List[int]:
    n = len(nums)
    result = [-1] * n
    window_size = 2 * k + 1

    if window_size > n:
        return result

    # Step 1: Calculate sum of first window
    window_sum = sum(nums[:window_size])
    result[k] = window_sum // window_size

    # Step 2: Slide window
    for i in range(k + 1, n - k):
        # Remove leftmost element, add new rightmost element
        window_sum = window_sum - nums[i - k - 1] + nums[i + k]
        result[i] = window_sum // window_size

    return result

# Visualization for nums = [7,4,3,9,1,8,5,2,6], k = 2:
# Window size = 5
#
# i=2: window=[7,4,3,9,1], sum=24, avg=24/5=4
# i=3: window=[4,3,9,1,8], sum=25, avg=5
# i=4: window=[3,9,1,8,5], sum=26, avg=5
# i=5: window=[9,1,8,5,2], sum=25, avg=5
# i=6: window=[1,8,5,2,6], sum=22, avg=4
#
# Result: [-1,-1,4,5,5,5,4,-1,-1]
```

#### TypeScript Solution
```typescript
function getAverages(nums: number[], k: number): number[] {
    const n = nums.length;
    const result: number[] = new Array(n).fill(-1);
    const windowSize = 2 * k + 1;

    // Edge case
    if (windowSize > n) return result;

    // Build prefix sum
    const prefix: number[] = new Array(n + 1).fill(0);
    for (let i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }

    // Calculate averages
    for (let i = k; i < n - k; i++) {
        const windowSum = prefix[i + k + 1] - prefix[i - k];
        result[i] = Math.floor(windowSum / windowSize);
    }

    return result;
}

// Sliding window approach
function getAveragesOptimized(nums: number[], k: number): number[] {
    const n = nums.length;
    const result: number[] = new Array(n).fill(-1);
    const windowSize = 2 * k + 1;

    if (windowSize > n) return result;

    // Initial window sum
    let windowSum = 0;
    for (let i = 0; i < windowSize; i++) {
        windowSum += nums[i];
    }
    result[k] = Math.floor(windowSum / windowSize);

    // Slide window
    for (let i = k + 1; i < n - k; i++) {
        windowSum = windowSum - nums[i - k - 1] + nums[i + k];
        result[i] = Math.floor(windowSum / windowSize);
    }

    return result;
}
```

**Time Complexity**: O(n) - single pass to build prefix, single pass to calculate averages
**Space Complexity**: O(n) for prefix sum, O(1) for sliding window (excluding result array)

---

## Summary

The **Prefix Sum** pattern is invaluable for efficiently handling range queries and subarray sum problems. Key takeaways:

1. **Preprocessing pays off**: Spend O(n) once to answer queries in O(1)
2. **HashMap + Prefix Sum**: Powerful combo for "subarray with sum X" problems
3. **Remainder tracking**: Use modulo with prefix sums for divisibility problems
4. **2D extension**: Same concept applies to matrices for rectangle sum queries
5. **Mathematical optimization**: Sometimes you can avoid storing prefix sums entirely

Practice recognizing when cumulative sums can simplify your solution!
