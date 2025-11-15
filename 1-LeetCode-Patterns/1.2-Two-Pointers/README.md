# 1.2 Two Pointers Pattern

## Pattern Overview

### What is Two Pointers?
Two Pointers is a technique that uses two references (pointers) to traverse a data structure, usually an array or linked list. The pointers can move toward each other, away from each other, or in the same direction at different speeds, depending on the problem.

### When to Use It?
- When dealing with sorted arrays or linked lists
- When searching for pairs or triplets with specific properties
- When you need to compare elements from both ends of an array
- When partitioning or rearranging arrays in-place
- When removing duplicates or elements from arrays

### Time/Space Complexity Benefits
- **Time**: O(n) instead of O(n²) for nested loops
- **Space**: O(1) - no extra data structures needed (in-place operations)
- Eliminates need for nested loops in many cases

### Visual Diagram

```
Technique 1: Opposite Direction (Converging)
Array: [1, 2, 3, 4, 5, 6, 7, 8]
        ↑                    ↑
       left                right

Move pointers toward each other based on condition

Technique 2: Same Direction (Fast & Slow)
Array: [1, 2, 3, 4, 5, 6, 7, 8]
        ↑  ↑
      slow fast

Both move left-to-right, fast moves faster

Technique 3: Sliding Window (Fixed/Variable)
Array: [1, 2, 3, 4, 5, 6, 7, 8]
        ↑     ↑
      start  end

Maintain a window between pointers
```

## Recognition Guidelines

### How to Identify This Pattern
Look for these keywords and scenarios:
- "Sorted array" or "sorted list"
- "Find pair/triplet that sums to X"
- "Remove duplicates in-place"
- "Partition array"
- "Reverse array/string"
- "Container with most water"
- "Valid palindrome"

### Key Indicators
1. Input is sorted (or can be sorted)
2. Need to find pairs or compare elements
3. Need to process array from both ends
4. In-place modification required
5. Linear time solution is possible but nested loops seem necessary

## Template/Pseudocode

### Opposite Direction (Converging Pointers)
```
function twoPointersOpposite(arr):
    left = 0
    right = length(arr) - 1

    while left < right:
        // Process current pair
        if condition_met(arr[left], arr[right]):
            return result

        // Move pointers based on condition
        if need_larger_value:
            left++
        else:
            right--

    return default_result
```

### Same Direction (Fast & Slow Pointers)
```
function twoPointersSameDirection(arr):
    slow = 0

    for fast = 0 to length(arr) - 1:
        if condition_met(arr[fast]):
            swap(arr[slow], arr[fast])
            slow++

    return slow  // Usually returns new length or slow pointer position
```

---

## Problems

### Problem 1: Two Sum II - Input Array Is Sorted
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/](https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/)

**Description**: Find two numbers in a sorted array that add up to a target. Return indices (1-indexed).

#### Python Solution
```python
def twoSum(numbers: List[int], target: int) -> List[int]:
    # Step 1: Initialize two pointers at start and end
    left = 0
    right = len(numbers) - 1

    # Step 2: Move pointers toward each other
    while left < right:
        # Step 3: Calculate current sum
        current_sum = numbers[left] + numbers[right]

        # Step 4: Check if we found the target
        if current_sum == target:
            # Return 1-indexed positions
            return [left + 1, right + 1]

        # Step 5: If sum too small, move left pointer right (increase sum)
        elif current_sum < target:
            left += 1

        # Step 6: If sum too large, move right pointer left (decrease sum)
        else:
            right -= 1

    # No solution found (problem guarantees exactly one solution)
    return []
```

#### TypeScript Solution
```typescript
function twoSum(numbers: number[], target: number): number[] {
    // Step 1: Initialize pointers
    let left = 0;
    let right = numbers.length - 1;

    // Step 2: Search for target sum
    while (left < right) {
        // Step 3: Calculate current sum
        const currentSum = numbers[left] + numbers[right];

        // Step 4: Check if found
        if (currentSum === target) {
            return [left + 1, right + 1];
        }

        // Step 5: Adjust pointers
        if (currentSum < target) {
            left++;
        } else {
            right--;
        }
    }

    return [];
}
```

**Time Complexity**: O(n) - single pass with two pointers
**Space Complexity**: O(1) - only using two pointer variables

---

### Problem 2: Valid Palindrome
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/valid-palindrome/](https://leetcode.com/problems/valid-palindrome/)

**Description**: Check if a string is a palindrome, considering only alphanumeric characters and ignoring cases.

#### Python Solution
```python
def isPalindrome(s: str) -> bool:
    # Step 1: Initialize two pointers
    left = 0
    right = len(s) - 1

    # Step 2: Move pointers toward each other
    while left < right:
        # Step 3: Skip non-alphanumeric characters from left
        while left < right and not s[left].isalnum():
            left += 1

        # Step 4: Skip non-alphanumeric characters from right
        while left < right and not s[right].isalnum():
            right -= 1

        # Step 5: Compare characters (case-insensitive)
        if s[left].lower() != s[right].lower():
            return False

        # Step 6: Move both pointers
        left += 1
        right -= 1

    # Step 7: All characters matched
    return True

# Example: "A man, a plan, a canal: Panama"
# After removing non-alphanumeric: "amanaplanacanalpanama"
# Palindrome check: a==a, m==m, a==a, ... -> True
```

#### TypeScript Solution
```typescript
function isPalindrome(s: string): boolean {
    // Step 1: Initialize pointers
    let left = 0;
    let right = s.length - 1;

    // Helper to check if alphanumeric
    const isAlphanumeric = (char: string): boolean => {
        const code = char.charCodeAt(0);
        return (code >= 48 && code <= 57) ||  // 0-9
               (code >= 65 && code <= 90) ||   // A-Z
               (code >= 97 && code <= 122);    // a-z
    };

    // Step 2: Check palindrome
    while (left < right) {
        // Step 3: Skip non-alphanumeric from left
        while (left < right && !isAlphanumeric(s[left])) {
            left++;
        }

        // Step 4: Skip non-alphanumeric from right
        while (left < right && !isAlphanumeric(s[right])) {
            right--;
        }

        // Step 5: Compare characters
        if (s[left].toLowerCase() !== s[right].toLowerCase()) {
            return false;
        }

        // Step 6: Move pointers
        left++;
        right--;
    }

    return true;
}
```

**Time Complexity**: O(n) - single pass through string
**Space Complexity**: O(1) - only using pointer variables

---

### Problem 3: Remove Duplicates from Sorted Array
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/remove-duplicates-from-sorted-array/](https://leetcode.com/problems/remove-duplicates-from-sorted-array/)

**Description**: Remove duplicates from sorted array in-place. Return the new length.

#### Python Solution
```python
def removeDuplicates(nums: List[int]) -> int:
    # Step 1: Handle edge case
    if not nums:
        return 0

    # Step 2: Initialize slow pointer
    # slow pointer tracks position of last unique element
    slow = 0

    # Step 3: Fast pointer scans through array
    for fast in range(1, len(nums)):
        # Step 4: If current element different from last unique element
        if nums[fast] != nums[slow]:
            # Step 5: Move slow pointer and copy unique element
            slow += 1
            nums[slow] = nums[fast]

    # Step 6: Return new length (slow + 1)
    return slow + 1

# Visualization for [1, 1, 2, 2, 3]:
# Initial: [1, 1, 2, 2, 3], slow=0
#           ↑  ↑
#         slow fast
#
# fast=1: nums[1]=1 == nums[0]=1, no change
# fast=2: nums[2]=2 != nums[0]=1, slow=1, nums[1]=2 -> [1, 2, 2, 2, 3]
# fast=3: nums[3]=2 == nums[1]=2, no change
# fast=4: nums[4]=3 != nums[1]=2, slow=2, nums[2]=3 -> [1, 2, 3, 2, 3]
# Return: 3
```

#### TypeScript Solution
```typescript
function removeDuplicates(nums: number[]): number {
    // Step 1: Handle edge case
    if (nums.length === 0) return 0;

    // Step 2: Initialize slow pointer
    let slow = 0;

    // Step 3: Scan with fast pointer
    for (let fast = 1; fast < nums.length; fast++) {
        // Step 4: Found new unique element
        if (nums[fast] !== nums[slow]) {
            // Step 5: Move slow and update
            slow++;
            nums[slow] = nums[fast];
        }
    }

    // Step 6: Return new length
    return slow + 1;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - in-place modification

---

### Problem 4: Container With Most Water
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/container-with-most-water/](https://leetcode.com/problems/container-with-most-water/)

**Description**: Find two lines that together with x-axis form a container that holds the most water.

#### Python Solution
```python
def maxArea(height: List[int]) -> int:
    # Step 1: Initialize two pointers at both ends
    left = 0
    right = len(height) - 1
    max_area = 0

    # Step 2: Move pointers toward each other
    while left < right:
        # Step 3: Calculate current area
        # Width is distance between pointers
        # Height is limited by shorter line
        width = right - left
        current_height = min(height[left], height[right])
        current_area = width * current_height

        # Step 4: Update max area
        max_area = max(max_area, current_area)

        # Step 5: Move pointer pointing to shorter line
        # Why? Moving taller line can only decrease area
        # Moving shorter line might find a taller line
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1

    return max_area

# Visualization for [1,8,6,2,5,4,8,3,7]:
#                    ↑                 ↑
#                   left             right
# Area = min(1,7) * 8 = 8
# Move left (shorter line)
#
#                      ↑               ↑
#                     left           right
# Area = min(8,7) * 7 = 49
# Move right (shorter line)
# ... continue until left meets right
```

#### TypeScript Solution
```typescript
function maxArea(height: number[]): number {
    // Step 1: Initialize pointers
    let left = 0;
    let right = height.length - 1;
    let maxArea = 0;

    // Step 2: Find maximum area
    while (left < right) {
        // Step 3: Calculate current area
        const width = right - left;
        const currentHeight = Math.min(height[left], height[right]);
        const currentArea = width * currentHeight;

        // Step 4: Update maximum
        maxArea = Math.max(maxArea, currentArea);

        // Step 5: Move pointer with shorter line
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }

    return maxArea;
}
```

**Time Complexity**: O(n) - single pass with two pointers
**Space Complexity**: O(1) - only using constant extra space

---

### Problem 5: 3Sum
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/3sum/](https://leetcode.com/problems/3sum/)

**Description**: Find all unique triplets in array that sum to zero.

#### Python Solution
```python
def threeSum(nums: List[int]) -> List[List[int]]:
    # Step 1: Sort the array (required for two pointers)
    nums.sort()
    result = []

    # Step 2: Iterate through array, fix one number at a time
    for i in range(len(nums) - 2):
        # Step 3: Skip duplicates for first number
        if i > 0 and nums[i] == nums[i - 1]:
            continue

        # Step 4: Two pointers for remaining two numbers
        left = i + 1
        right = len(nums) - 1
        target = -nums[i]  # We want nums[left] + nums[right] = -nums[i]

        # Step 5: Find pairs that sum to target
        while left < right:
            current_sum = nums[left] + nums[right]

            # Step 6: Found a triplet
            if current_sum == target:
                result.append([nums[i], nums[left], nums[right]])

                # Step 7: Skip duplicates for second number
                while left < right and nums[left] == nums[left + 1]:
                    left += 1

                # Step 8: Skip duplicates for third number
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1

                # Step 9: Move both pointers
                left += 1
                right -= 1

            # Step 10: Sum too small, need larger value
            elif current_sum < target:
                left += 1

            # Step 11: Sum too large, need smaller value
            else:
                right -= 1

    return result

# Example: [-1, 0, 1, 2, -1, -4]
# After sort: [-4, -1, -1, 0, 1, 2]
# i=0: nums[i]=-4, target=4, no pairs sum to 4
# i=1: nums[i]=-1, target=1, found [-1, 0, 1] and [-1, -1, 2]
# i=2: skip (duplicate of i=1)
# i=3: nums[i]=0, target=0, no pairs sum to 0
```

#### TypeScript Solution
```typescript
function threeSum(nums: number[]): number[][] {
    // Step 1: Sort array
    nums.sort((a, b) => a - b);
    const result: number[][] = [];

    // Step 2: Fix first number
    for (let i = 0; i < nums.length - 2; i++) {
        // Step 3: Skip duplicates
        if (i > 0 && nums[i] === nums[i - 1]) {
            continue;
        }

        // Step 4: Two pointers for remaining numbers
        let left = i + 1;
        let right = nums.length - 1;
        const target = -nums[i];

        // Step 5: Find pairs
        while (left < right) {
            const currentSum = nums[left] + nums[right];

            // Step 6: Found triplet
            if (currentSum === target) {
                result.push([nums[i], nums[left], nums[right]]);

                // Step 7-8: Skip duplicates
                while (left < right && nums[left] === nums[left + 1]) left++;
                while (left < right && nums[right] === nums[right - 1]) right--;

                // Step 9: Move pointers
                left++;
                right--;
            } else if (currentSum < target) {
                left++;
            } else {
                right--;
            }
        }
    }

    return result;
}
```

**Time Complexity**: O(n²) - O(n log n) for sort + O(n²) for finding triplets
**Space Complexity**: O(1) - not counting output array

---

### Problem 6: Sort Colors
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/sort-colors/](https://leetcode.com/problems/sort-colors/)

**Description**: Sort array with values 0, 1, 2 in-place (Dutch National Flag problem).

#### Python Solution
```python
def sortColors(nums: List[int]) -> None:
    # Step 1: Initialize three pointers
    # left: boundary of 0s (everything before left is 0)
    # right: boundary of 2s (everything after right is 2)
    # curr: current element being examined
    left = 0
    right = len(nums) - 1
    curr = 0

    # Step 2: Process array until curr passes right
    while curr <= right:
        # Step 3: Current element is 0, swap with left
        if nums[curr] == 0:
            nums[left], nums[curr] = nums[curr], nums[left]
            left += 1
            curr += 1  # Safe to move curr because we know left area is processed

        # Step 4: Current element is 2, swap with right
        elif nums[curr] == 2:
            nums[curr], nums[right] = nums[right], nums[curr]
            right -= 1
            # Don't move curr! We need to examine the swapped element

        # Step 5: Current element is 1, just move curr
        else:
            curr += 1

# Visualization for [2, 0, 2, 1, 1, 0]:
# Initial: [2, 0, 2, 1, 1, 0]
#           ↑              ↑
#        l,c              r
#
# curr=0, nums[curr]=2, swap with right: [0, 0, 2, 1, 1, 2]
#           ↑           ↑
#          l,c         r
#
# curr=0, nums[curr]=0, swap with left: [0, 0, 2, 1, 1, 2]
#              ↑        ↑
#             l,c      r
# ... continue until curr > right
# Final: [0, 0, 1, 1, 2, 2]
```

#### TypeScript Solution
```typescript
function sortColors(nums: number[]): void {
    // Step 1: Initialize three pointers
    let left = 0;
    let right = nums.length - 1;
    let curr = 0;

    // Step 2: Process array
    while (curr <= right) {
        // Step 3: Handle 0
        if (nums[curr] === 0) {
            [nums[left], nums[curr]] = [nums[curr], nums[left]];
            left++;
            curr++;
        }
        // Step 4: Handle 2
        else if (nums[curr] === 2) {
            [nums[curr], nums[right]] = [nums[right], nums[curr]];
            right--;
        }
        // Step 5: Handle 1
        else {
            curr++;
        }
    }
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - in-place sorting

---

### Problem 7: Move Zeroes
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/move-zeroes/](https://leetcode.com/problems/move-zeroes/)

**Description**: Move all zeros to end of array while maintaining relative order of non-zero elements.

#### Python Solution
```python
def moveZeroes(nums: List[int]) -> None:
    # Step 1: Initialize slow pointer
    # slow tracks position where next non-zero should go
    slow = 0

    # Step 2: Fast pointer scans entire array
    for fast in range(len(nums)):
        # Step 3: If current element is non-zero
        if nums[fast] != 0:
            # Step 4: Swap with slow pointer position
            # This moves non-zero forward and zero backward
            nums[slow], nums[fast] = nums[fast], nums[slow]
            slow += 1

    # Result: All non-zeros before slow, all zeros after slow

# Visualization for [0, 1, 0, 3, 12]:
# Initial: [0, 1, 0, 3, 12], slow=0
#           ↑  ↑
#          slow fast
#
# fast=1: nums[1]=1 != 0, swap: [1, 0, 0, 3, 12], slow=1
#              ↑  ↑
#            slow fast
#
# fast=2: nums[2]=0, no swap
# fast=3: nums[3]=3 != 0, swap: [1, 3, 0, 0, 12], slow=2
#                 ↑     ↑
#               slow  fast
#
# fast=4: nums[4]=12 != 0, swap: [1, 3, 12, 0, 0], slow=3
# Final: [1, 3, 12, 0, 0]
```

#### TypeScript Solution
```typescript
function moveZeroes(nums: number[]): void {
    // Step 1: Initialize slow pointer
    let slow = 0;

    // Step 2: Scan with fast pointer
    for (let fast = 0; fast < nums.length; fast++) {
        // Step 3: Found non-zero element
        if (nums[fast] !== 0) {
            // Step 4: Swap elements
            [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
            slow++;
        }
    }
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - in-place modification

---

### Problem 8: Trapping Rain Water
**Difficulty**: Hard
**LeetCode Link**: [https://leetcode.com/problems/trapping-rain-water/](https://leetcode.com/problems/trapping-rain-water/)

**Description**: Calculate how much water can be trapped after raining given elevation map.

#### Python Solution
```python
def trap(height: List[int]) -> int:
    # Step 1: Handle edge cases
    if not height:
        return 0

    # Step 2: Initialize two pointers and variables
    left = 0
    right = len(height) - 1
    left_max = 0   # Maximum height seen from left
    right_max = 0  # Maximum height seen from right
    water = 0

    # Step 3: Process array from both ends
    while left < right:
        # Step 4: Process side with smaller max height
        # Key insight: Water level is determined by minimum of left_max and right_max
        if height[left] < height[right]:
            # Step 5: Update left_max or add water
            if height[left] >= left_max:
                left_max = height[left]
            else:
                # Water trapped = left_max - current height
                water += left_max - height[left]
            left += 1
        else:
            # Step 6: Process from right side
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1

    return water

# Visualization for [0,1,0,2,1,0,1,3,2,1,2,1]:
#     3|       █
#     2|   █   █ █   █
#     1| █ █ █ █ █ █ █ █
#     0|0 1 0 2 1 0 1 3 2 1 2 1
#
# Water (marked with ~):
#     3|       █
#     2|   █~~~█~█~~~█
#     1| █~█~█~█~█~█~█~█
#
# Water trapped = 6 units
```

#### TypeScript Solution
```typescript
function trap(height: number[]): number {
    // Step 1: Handle edge cases
    if (height.length === 0) return 0;

    // Step 2: Initialize pointers and variables
    let left = 0;
    let right = height.length - 1;
    let leftMax = 0;
    let rightMax = 0;
    let water = 0;

    // Step 3: Two pointer approach
    while (left < right) {
        // Step 4: Process shorter side
        if (height[left] < height[right]) {
            // Step 5: Update or add water (left side)
            if (height[left] >= leftMax) {
                leftMax = height[left];
            } else {
                water += leftMax - height[left];
            }
            left++;
        } else {
            // Step 6: Process right side
            if (height[right] >= rightMax) {
                rightMax = height[right];
            } else {
                water += rightMax - height[right];
            }
            right--;
        }
    }

    return water;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - only using constant extra space

---

### Problem 9: 4Sum
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/4sum/](https://leetcode.com/problems/4sum/)

**Description**: Find all unique quadruplets that sum to target.

#### Python Solution
```python
def fourSum(nums: List[int], target: int) -> List[List[int]]:
    # Step 1: Sort array
    nums.sort()
    result = []
    n = len(nums)

    # Step 2: Fix first number
    for i in range(n - 3):
        # Step 3: Skip duplicates for first number
        if i > 0 and nums[i] == nums[i - 1]:
            continue

        # Step 4: Fix second number
        for j in range(i + 1, n - 2):
            # Step 5: Skip duplicates for second number
            if j > i + 1 and nums[j] == nums[j - 1]:
                continue

            # Step 6: Two pointers for last two numbers
            left = j + 1
            right = n - 1

            while left < right:
                # Step 7: Calculate current sum
                current_sum = nums[i] + nums[j] + nums[left] + nums[right]

                # Step 8: Found quadruplet
                if current_sum == target:
                    result.append([nums[i], nums[j], nums[left], nums[right]])

                    # Step 9: Skip duplicates for third number
                    while left < right and nums[left] == nums[left + 1]:
                        left += 1

                    # Step 10: Skip duplicates for fourth number
                    while left < right and nums[right] == nums[right - 1]:
                        right -= 1

                    # Step 11: Move both pointers
                    left += 1
                    right -= 1

                # Step 12: Adjust pointers based on sum
                elif current_sum < target:
                    left += 1
                else:
                    right -= 1

    return result

# Example: nums = [1,0,-1,0,-2,2], target = 0
# After sort: [-2,-1,0,0,1,2]
# Quadruplets: [-2,-1,1,2], [-2,0,0,2], [-1,0,0,1]
```

#### TypeScript Solution
```typescript
function fourSum(nums: number[], target: number): number[][] {
    // Step 1: Sort array
    nums.sort((a, b) => a - b);
    const result: number[][] = [];
    const n = nums.length;

    // Step 2: Fix first number
    for (let i = 0; i < n - 3; i++) {
        // Step 3: Skip duplicates
        if (i > 0 && nums[i] === nums[i - 1]) continue;

        // Step 4: Fix second number
        for (let j = i + 1; j < n - 2; j++) {
            // Step 5: Skip duplicates
            if (j > i + 1 && nums[j] === nums[j - 1]) continue;

            // Step 6: Two pointers
            let left = j + 1;
            let right = n - 1;

            while (left < right) {
                // Step 7: Calculate sum
                const currentSum = nums[i] + nums[j] + nums[left] + nums[right];

                // Step 8: Found quadruplet
                if (currentSum === target) {
                    result.push([nums[i], nums[j], nums[left], nums[right]]);

                    // Step 9-10: Skip duplicates
                    while (left < right && nums[left] === nums[left + 1]) left++;
                    while (left < right && nums[right] === nums[right - 1]) right--;

                    // Step 11: Move pointers
                    left++;
                    right--;
                } else if (currentSum < target) {
                    left++;
                } else {
                    right--;
                }
            }
        }
    }

    return result;
}
```

**Time Complexity**: O(n³) - two nested loops + two pointers
**Space Complexity**: O(1) - not counting output array

---

### Problem 10: Remove Element
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/remove-element/](https://leetcode.com/problems/remove-element/)

**Description**: Remove all occurrences of val in-place and return new length.

#### Python Solution
```python
def removeElement(nums: List[int], val: int) -> int:
    # Step 1: Initialize slow pointer
    # slow tracks where next non-val element should go
    slow = 0

    # Step 2: Fast pointer scans array
    for fast in range(len(nums)):
        # Step 3: If current element is not val
        if nums[fast] != val:
            # Step 4: Copy to slow position
            nums[slow] = nums[fast]
            slow += 1

    # Step 5: Return new length
    return slow

# Visualization for [3,2,2,3], val=3:
# Initial: [3,2,2,3], slow=0
#           ↑
#        slow,fast
#
# fast=0: nums[0]=3 == val, skip
# fast=1: nums[1]=2 != val, nums[0]=2, slow=1 -> [2,2,2,3]
# fast=2: nums[2]=2 != val, nums[1]=2, slow=2 -> [2,2,2,3]
# fast=3: nums[3]=3 == val, skip
# Return: 2, array: [2,2,_,_]
```

#### TypeScript Solution
```typescript
function removeElement(nums: number[], val: number): number {
    // Step 1: Initialize slow pointer
    let slow = 0;

    // Step 2: Scan with fast pointer
    for (let fast = 0; fast < nums.length; fast++) {
        // Step 3: Keep non-val elements
        if (nums[fast] !== val) {
            nums[slow] = nums[fast];
            slow++;
        }
    }

    return slow;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - in-place modification

---

### Problem 11: 3Sum Closest
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/3sum-closest/](https://leetcode.com/problems/3sum-closest/)

**Description**: Find three integers whose sum is closest to target.

#### Python Solution
```python
def threeSumClosest(nums: List[int], target: int) -> int:
    # Step 1: Sort array
    nums.sort()
    closest_sum = float('inf')
    min_diff = float('inf')

    # Step 2: Fix first number
    for i in range(len(nums) - 2):
        # Step 3: Two pointers for remaining numbers
        left = i + 1
        right = len(nums) - 1

        while left < right:
            # Step 4: Calculate current sum
            current_sum = nums[i] + nums[left] + nums[right]

            # Step 5: Calculate difference from target
            diff = abs(current_sum - target)

            # Step 6: Update closest sum if needed
            if diff < min_diff:
                min_diff = diff
                closest_sum = current_sum

            # Step 7: If exact match, return immediately
            if current_sum == target:
                return current_sum

            # Step 8: Adjust pointers to get closer to target
            elif current_sum < target:
                left += 1
            else:
                right -= 1

    return closest_sum

# Example: nums = [-1,2,1,-4], target = 1
# After sort: [-4,-1,1,2]
# i=0: nums[i]=-4
#   left=1, right=3: sum=-4+(-1)+2=-3, diff=4
#   left=2, right=3: sum=-4+1+2=-1, diff=2
# i=1: nums[i]=-1
#   left=2, right=3: sum=-1+1+2=2, diff=1 (closest)
# Return: 2
```

#### TypeScript Solution
```typescript
function threeSumClosest(nums: number[], target: number): number {
    // Step 1: Sort array
    nums.sort((a, b) => a - b);
    let closestSum = Infinity;
    let minDiff = Infinity;

    // Step 2: Fix first number
    for (let i = 0; i < nums.length - 2; i++) {
        // Step 3: Two pointers
        let left = i + 1;
        let right = nums.length - 1;

        while (left < right) {
            // Step 4: Calculate current sum
            const currentSum = nums[i] + nums[left] + nums[right];

            // Step 5: Calculate difference
            const diff = Math.abs(currentSum - target);

            // Step 6: Update closest
            if (diff < minDiff) {
                minDiff = diff;
                closestSum = currentSum;
            }

            // Step 7: Found exact match
            if (currentSum === target) {
                return currentSum;
            }

            // Step 8: Adjust pointers
            if (currentSum < target) {
                left++;
            } else {
                right--;
            }
        }
    }

    return closestSum;
}
```

**Time Complexity**: O(n²) - O(n log n) for sort + O(n²) for finding triplets
**Space Complexity**: O(1) - not counting space for sorting

---

### Problem 12: Squares of a Sorted Array
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/squares-of-a-sorted-array/](https://leetcode.com/problems/squares-of-a-sorted-array/)

**Description**: Return array of squares of sorted array, also in sorted order.

#### Python Solution
```python
def sortedSquares(nums: List[int]) -> List[int]:
    # Step 1: Initialize result array and two pointers
    n = len(nums)
    result = [0] * n
    left = 0
    right = n - 1

    # Step 2: Fill result from end to start (largest to smallest)
    # Key insight: Largest square comes from either end
    pos = n - 1

    # Step 3: Compare absolute values from both ends
    while left <= right:
        # Step 4: Calculate squares
        left_square = nums[left] * nums[left]
        right_square = nums[right] * nums[right]

        # Step 5: Place larger square at current position
        if left_square > right_square:
            result[pos] = left_square
            left += 1
        else:
            result[pos] = right_square
            right -= 1

        # Step 6: Move to next position (going backwards)
        pos -= 1

    return result

# Visualization for [-4,-1,0,3,10]:
# Squares: [16,1,0,9,100]
#
# Initial: left=-4, right=10
# 16 vs 100 -> place 100 at end: [_,_,_,_,100]
#
# left=-4, right=3
# 16 vs 9 -> place 16: [_,_,_,16,100]
#
# left=-1, right=3
# 1 vs 9 -> place 9: [_,_,9,16,100]
#
# left=-1, right=0
# 1 vs 0 -> place 1: [_,1,9,16,100]
#
# left=0, right=0
# 0 vs 0 -> place 0: [0,1,9,16,100]
```

#### TypeScript Solution
```typescript
function sortedSquares(nums: number[]): number[] {
    // Step 1: Initialize
    const n = nums.length;
    const result: number[] = new Array(n);
    let left = 0;
    let right = n - 1;
    let pos = n - 1;

    // Step 2: Fill from end to start
    while (left <= right) {
        // Step 3: Calculate squares
        const leftSquare = nums[left] * nums[left];
        const rightSquare = nums[right] * nums[right];

        // Step 4: Place larger square
        if (leftSquare > rightSquare) {
            result[pos] = leftSquare;
            left++;
        } else {
            result[pos] = rightSquare;
            right--;
        }

        pos--;
    }

    return result;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(n) - output array (O(1) if not counting output)

---

### Problem 13: Partition Labels
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/partition-labels/](https://leetcode.com/problems/partition-labels/)

**Description**: Partition string into as many parts as possible so each letter appears in at most one part.

#### Python Solution
```python
def partitionLabels(s: str) -> List[int]:
    # Step 1: Record last occurrence of each character
    last_occurrence = {}
    for i in range(len(s)):
        last_occurrence[s[i]] = i

    # Step 2: Initialize variables for partitioning
    result = []
    start = 0  # Start of current partition
    end = 0    # End of current partition (must reach this before splitting)

    # Step 3: Iterate through string
    for i in range(len(s)):
        # Step 4: Extend partition end if needed
        # We must include all characters up to last occurrence
        end = max(end, last_occurrence[s[i]])

        # Step 5: Reached end of partition
        if i == end:
            # Add partition length to result
            result.append(end - start + 1)
            start = i + 1  # Start new partition

    return result

# Example: "ababcbacadefegdehijhklij"
# Last occurrences: {a:8, b:5, c:7, d:14, e:15, f:11, g:13, h:19, i:22, j:23, k:20, l:21}
#
# i=0: s[0]='a', end=max(0,8)=8
# i=1: s[1]='b', end=max(8,5)=8
# ...
# i=8: s[8]='a', end=max(8,8)=8, i==end -> partition [0,8], length=9
# i=9: s[9]='d', end=max(9,14)=14
# ...
# Partitions: "ababcbaca" (9), "defegde" (7), "hijhklij" (8)
```

#### TypeScript Solution
```typescript
function partitionLabels(s: string): number[] {
    // Step 1: Record last occurrences
    const lastOccurrence = new Map<string, number>();
    for (let i = 0; i < s.length; i++) {
        lastOccurrence.set(s[i], i);
    }

    // Step 2: Initialize variables
    const result: number[] = [];
    let start = 0;
    let end = 0;

    // Step 3: Partition string
    for (let i = 0; i < s.length; i++) {
        // Step 4: Extend partition end
        end = Math.max(end, lastOccurrence.get(s[i])!);

        // Step 5: Complete partition
        if (i === end) {
            result.push(end - start + 1);
            start = i + 1;
        }
    }

    return result;
}
```

**Time Complexity**: O(n) - two passes through string
**Space Complexity**: O(1) - at most 26 characters in map

---

### Problem 14: Reverse String
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/reverse-string/](https://leetcode.com/problems/reverse-string/)

**Description**: Reverse a string in-place (represented as array of characters).

#### Python Solution
```python
def reverseString(s: List[str]) -> None:
    # Step 1: Initialize two pointers at both ends
    left = 0
    right = len(s) - 1

    # Step 2: Swap characters moving toward center
    while left < right:
        # Step 3: Swap characters
        s[left], s[right] = s[right], s[left]

        # Step 4: Move pointers toward center
        left += 1
        right -= 1

# Visualization for ['h','e','l','l','o']:
# Initial: ['h','e','l','l','o']
#            ↑           ↑
#          left        right
# Swap: ['o','e','l','l','h']
#               ↑  ↑
#             left right
# Swap: ['o','l','l','e','h']
#                 ↑
#              left,right (stop)
# Final: ['o','l','l','e','h']
```

#### TypeScript Solution
```typescript
function reverseString(s: string[]): void {
    // Step 1: Initialize pointers
    let left = 0;
    let right = s.length - 1;

    // Step 2: Swap characters
    while (left < right) {
        // Step 3: Swap
        [s[left], s[right]] = [s[right], s[left]];

        // Step 4: Move pointers
        left++;
        right--;
    }
}
```

**Time Complexity**: O(n) - single pass through half the array
**Space Complexity**: O(1) - in-place reversal

---

### Problem 15: Backspace String Compare
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/backspace-string-compare/](https://leetcode.com/problems/backspace-string-compare/)

**Description**: Compare two strings where '#' means backspace. Return true if they're equal after processing.

#### Python Solution
```python
def backspaceCompare(s: str, t: str) -> bool:
    # Helper function to get next valid character index
    def next_valid_char(string: str, index: int) -> int:
        # Step 1: Start from given index, move left
        backspace_count = 0

        while index >= 0:
            # Step 2: If backspace, increment count
            if string[index] == '#':
                backspace_count += 1
            # Step 3: If regular char and no pending backspaces, found it
            elif backspace_count == 0:
                return index
            # Step 4: Regular char but need to skip due to backspace
            else:
                backspace_count -= 1

            # Step 5: Move to previous character
            index -= 1

        return -1

    # Step 6: Use two pointers from end of both strings
    i = len(s) - 1
    j = len(t) - 1

    # Step 7: Compare characters from end to start
    while i >= 0 or j >= 0:
        # Step 8: Find next valid characters
        i = next_valid_char(s, i)
        j = next_valid_char(t, j)

        # Step 9: Both reached end
        if i < 0 and j < 0:
            return True

        # Step 10: One reached end but not other
        if i < 0 or j < 0:
            return False

        # Step 11: Characters don't match
        if s[i] != t[j]:
            return False

        # Step 12: Move to previous characters
        i -= 1
        j -= 1

    return True

# Example: s = "ab#c", t = "ad#c"
# Process s from right: c, skip b (backspace), a -> "ac"
# Process t from right: c, skip d (backspace), a -> "ac"
# Equal -> return True
```

#### TypeScript Solution
```typescript
function backspaceCompare(s: string, t: string): boolean {
    // Helper to find next valid character
    const nextValidChar = (str: string, index: number): number => {
        let backspaceCount = 0;

        while (index >= 0) {
            if (str[index] === '#') {
                backspaceCount++;
            } else if (backspaceCount === 0) {
                return index;
            } else {
                backspaceCount--;
            }
            index--;
        }

        return -1;
    };

    // Compare from end to start
    let i = s.length - 1;
    let j = t.length - 1;

    while (i >= 0 || j >= 0) {
        i = nextValidChar(s, i);
        j = nextValidChar(t, j);

        if (i < 0 && j < 0) return true;
        if (i < 0 || j < 0) return false;
        if (s[i] !== t[j]) return false;

        i--;
        j--;
    }

    return true;
}
```

**Time Complexity**: O(n + m) - process both strings once
**Space Complexity**: O(1) - only using pointers

---

## Summary

The **Two Pointers** pattern is extremely versatile and efficient for array/string problems. Key takeaways:

1. **Opposite Direction**: Great for sorted arrays, finding pairs, palindromes
2. **Same Direction**: Perfect for in-place modifications, removing duplicates
3. **Partitioning**: Dutch National Flag for categorizing elements
4. **Sorting Required**: Many two-pointer problems benefit from sorted input
5. **Space Efficiency**: Usually O(1) space complexity

Master this pattern - it appears in countless interview questions and real-world scenarios!
