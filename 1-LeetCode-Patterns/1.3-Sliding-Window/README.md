# 1.3 Sliding Window Pattern

## Pattern Overview

### What is Sliding Window?
Sliding Window is a technique that maintains a subset (window) of elements in an array or string and slides this window across the data structure. The window can be fixed-size or variable-size depending on the problem. This pattern is particularly useful for problems involving contiguous sequences.

### When to Use It?
- Finding longest/shortest subarray/substring with specific properties
- Maximum/minimum sum of subarray of size k
- Finding all anagrams or permutations in a string
- Problems with "contiguous" or "consecutive" elements
- Optimization problems on sequences

### Time/Space Complexity Benefits
- **Time**: O(n) instead of O(n²) or O(n³) with nested loops
- **Space**: O(k) where k is window size or character set size
- Each element processed at most twice (once when entering, once when leaving)

### Visual Diagram

```
Fixed Window (size = 3):
Array: [1, 3, 2, 6, -1, 4, 1, 8, 2]
        [-----]                      Window at position 0, sum = 6
           [-----]                   Window at position 1, sum = 11
              [-----]                Window at position 2, sum = 7
                  ...continue...

Variable Window (sum >= target):
Array: [2, 3, 1, 2, 4, 3], target = 7
        [----------]                 Window [2,3,1,2], sum = 8 >= 7
           [-------]                 Shrink: [3,1,2], sum = 6 < 7
           [----------]              Expand: [3,1,2,4], sum = 10 >= 7
```

## Recognition Guidelines

### How to Identify This Pattern
Look for these keywords and scenarios:
- "Maximum/minimum sum of subarray of size k"
- "Longest substring with k distinct characters"
- "Find all anagrams in a string"
- "Smallest subarray with sum >= target"
- "Maximum of all subarrays of size k"
- "Contiguous subarray"

### Key Indicators
1. Problem involves sequences (arrays/strings)
2. Need to find optimal contiguous subset
3. Keywords: "substring", "subarray", "contiguous", "consecutive"
4. Can define what enters/leaves the window
5. Window has clear boundaries and movement pattern

## Template/Pseudocode

### Fixed-Size Window
```
function fixedWindow(arr, k):
    // Step 1: Calculate first window
    window_sum = sum(arr[0...k-1])
    max_sum = window_sum

    // Step 2: Slide window
    for i from k to length(arr) - 1:
        // Remove leftmost element of previous window
        window_sum -= arr[i - k]
        // Add new element to window
        window_sum += arr[i]
        // Update result
        max_sum = max(max_sum, window_sum)

    return max_sum
```

### Variable-Size Window
```
function variableWindow(arr, target):
    left = 0
    window_state = initial_state
    result = initial_result

    for right from 0 to length(arr) - 1:
        // Expand window: add arr[right]
        update_window_state(arr[right])

        // Shrink window while condition met
        while window_invalid():
            remove_from_window(arr[left])
            left++

        // Update result with current window
        update_result()

    return result
```

---

## Problems

### Problem 1: Maximum Average Subarray I
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/maximum-average-subarray-i/](https://leetcode.com/problems/maximum-average-subarray-i/)

**Description**: Find contiguous subarray of length k with maximum average value.

#### Python Solution
```python
def findMaxAverage(nums: List[int], k: int) -> float:
    # Step 1: Calculate sum of first window
    window_sum = sum(nums[:k])
    max_sum = window_sum

    # Step 2: Slide window across array
    for i in range(k, len(nums)):
        # Step 3: Remove leftmost element of previous window
        window_sum -= nums[i - k]

        # Step 4: Add new element to window
        window_sum += nums[i]

        # Step 5: Update maximum sum
        max_sum = max(max_sum, window_sum)

    # Step 6: Return maximum average
    return max_sum / k

# Visualization for nums = [1,12,-5,-6,50,3], k = 4:
# Window 1: [1,12,-5,-6] sum=2
# Window 2: [12,-5,-6,50] sum=51 (remove 1, add 50)
# Window 3: [-5,-6,50,3] sum=42 (remove 12, add 3)
# Max sum = 51, average = 51/4 = 12.75
```

#### TypeScript Solution
```typescript
function findMaxAverage(nums: number[], k: number): number {
    // Step 1: Calculate first window sum
    let windowSum = 0;
    for (let i = 0; i < k; i++) {
        windowSum += nums[i];
    }

    let maxSum = windowSum;

    // Step 2: Slide window
    for (let i = k; i < nums.length; i++) {
        // Step 3: Update window (remove left, add right)
        windowSum = windowSum - nums[i - k] + nums[i];

        // Step 4: Update max
        maxSum = Math.max(maxSum, windowSum);
    }

    // Step 5: Return average
    return maxSum / k;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - only storing window sum

---

### Problem 2: Longest Substring Without Repeating Characters
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/longest-substring-without-repeating-characters/](https://leetcode.com/problems/longest-substring-without-repeating-characters/)

**Description**: Find the length of the longest substring without repeating characters.

#### Python Solution
```python
def lengthOfLongestSubstring(s: str) -> int:
    # Step 1: Initialize variables
    char_set = set()  # Track characters in current window
    left = 0
    max_length = 0

    # Step 2: Expand window with right pointer
    for right in range(len(s)):
        # Step 3: Shrink window while we have duplicate
        while s[right] in char_set:
            # Remove leftmost character
            char_set.remove(s[left])
            left += 1

        # Step 4: Add current character to window
        char_set.add(s[right])

        # Step 5: Update max length
        max_length = max(max_length, right - left + 1)

    return max_length

# Visualization for "abcabcbb":
# right=0: 'a', window="a", len=1
# right=1: 'b', window="ab", len=2
# right=2: 'c', window="abc", len=3
# right=3: 'a' (duplicate!), remove 'a', window="bca", len=3
# right=4: 'b' (duplicate!), remove 'b','c', window="ab", len=2
# right=5: 'c', window="abc", len=3
# right=6: 'b' (duplicate!), remove 'a','b', window="cb", len=2
# right=7: 'b' (duplicate!), remove 'c','b', window="b", len=1
# Max length = 3 (substring "abc")
```

#### TypeScript Solution
```typescript
function lengthOfLongestSubstring(s: string): number {
    // Step 1: Initialize
    const charSet = new Set<string>();
    let left = 0;
    let maxLength = 0;

    // Step 2: Expand window
    for (let right = 0; right < s.length; right++) {
        // Step 3: Shrink while duplicate exists
        while (charSet.has(s[right])) {
            charSet.delete(s[left]);
            left++;
        }

        // Step 4: Add current character
        charSet.add(s[right]);

        // Step 5: Update max length
        maxLength = Math.max(maxLength, right - left + 1);
    }

    return maxLength;
}
```

**Time Complexity**: O(n) - each character visited at most twice
**Space Complexity**: O(min(n, m)) - m is charset size

---

### Problem 3: Minimum Size Subarray Sum
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/minimum-size-subarray-sum/](https://leetcode.com/problems/minimum-size-subarray-sum/)

**Description**: Find minimal length of contiguous subarray with sum >= target.

#### Python Solution
```python
def minSubArrayLen(target: int, nums: List[int]) -> int:
    # Step 1: Initialize variables
    left = 0
    current_sum = 0
    min_length = float('inf')

    # Step 2: Expand window with right pointer
    for right in range(len(nums)):
        # Step 3: Add current element to sum
        current_sum += nums[right]

        # Step 4: Shrink window while sum >= target
        while current_sum >= target:
            # Step 5: Update min length
            min_length = min(min_length, right - left + 1)

            # Step 6: Remove leftmost element
            current_sum -= nums[left]
            left += 1

    # Step 7: Return result (0 if no valid subarray)
    return min_length if min_length != float('inf') else 0

# Visualization for target=7, nums=[2,3,1,2,4,3]:
# right=0: sum=2, len=1, not >= 7
# right=1: sum=5, len=2, not >= 7
# right=2: sum=6, len=3, not >= 7
# right=3: sum=8, len=4 >= 7, min_len=4
#   Shrink: sum=6, left=1
# right=4: sum=10, len=4 >= 7, min_len=4
#   Shrink: sum=7, left=2, min_len=3
#   Shrink: sum=6, left=3
# right=5: sum=7, len=3 >= 7, min_len=3
#   Shrink: sum=4, left=4
# Answer: 3 (subarray [4,3])
```

#### TypeScript Solution
```typescript
function minSubArrayLen(target: number, nums: number[]): number {
    // Step 1: Initialize
    let left = 0;
    let currentSum = 0;
    let minLength = Infinity;

    // Step 2: Expand window
    for (let right = 0; right < nums.length; right++) {
        // Step 3: Add to sum
        currentSum += nums[right];

        // Step 4: Shrink while valid
        while (currentSum >= target) {
            // Step 5: Update min length
            minLength = Math.min(minLength, right - left + 1);

            // Step 6: Remove from left
            currentSum -= nums[left];
            left++;
        }
    }

    return minLength === Infinity ? 0 : minLength;
}
```

**Time Complexity**: O(n) - each element added and removed at most once
**Space Complexity**: O(1) - only using constant space

---

### Problem 4: Longest Repeating Character Replacement
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/longest-repeating-character-replacement/](https://leetcode.com/problems/longest-repeating-character-replacement/)

**Description**: Find length of longest substring with same letters after replacing at most k characters.

#### Python Solution
```python
def characterReplacement(s: str, k: int) -> int:
    # Step 1: Initialize variables
    char_count = {}  # Count of each character in window
    left = 0
    max_count = 0    # Count of most frequent character in window
    max_length = 0

    # Step 2: Expand window with right pointer
    for right in range(len(s)):
        # Step 3: Add current character to window
        char_count[s[right]] = char_count.get(s[right], 0) + 1

        # Step 4: Update max count in current window
        max_count = max(max_count, char_count[s[right]])

        # Step 5: Check if window is valid
        # window_size - max_count = number of replacements needed
        # If replacements needed > k, shrink window
        while (right - left + 1) - max_count > k:
            # Step 6: Remove leftmost character
            char_count[s[left]] -= 1
            left += 1

        # Step 7: Update max length
        max_length = max(max_length, right - left + 1)

    return max_length

# Example: s = "AABABBA", k = 1
# right=0: 'A', count={A:1}, max_count=1, window="A", valid (1-1=0<=1)
# right=1: 'A', count={A:2}, max_count=2, window="AA", valid (2-2=0<=1)
# right=2: 'B', count={A:2,B:1}, max_count=2, window="AAB", valid (3-2=1<=1)
# right=3: 'A', count={A:3,B:1}, max_count=3, window="AABA", valid (4-3=1<=1)
# right=4: 'B', count={A:3,B:2}, max_count=3, window="AABAB", invalid (5-3=2>1)
#   Shrink: window="ABAB", still invalid
#   Shrink: window="BAB"
# ... continue
# Max length = 4 (e.g., "AABA")
```

#### TypeScript Solution
```typescript
function characterReplacement(s: string, k: number): number {
    // Step 1: Initialize
    const charCount = new Map<string, number>();
    let left = 0;
    let maxCount = 0;
    let maxLength = 0;

    // Step 2: Expand window
    for (let right = 0; right < s.length; right++) {
        // Step 3: Add character to window
        charCount.set(s[right], (charCount.get(s[right]) || 0) + 1);

        // Step 4: Update max count
        maxCount = Math.max(maxCount, charCount.get(s[right])!);

        // Step 5: Shrink if invalid
        while ((right - left + 1) - maxCount > k) {
            charCount.set(s[left], charCount.get(s[left])! - 1);
            left++;
        }

        // Step 6: Update max length
        maxLength = Math.max(maxLength, right - left + 1);
    }

    return maxLength;
}
```

**Time Complexity**: O(n) - single pass through string
**Space Complexity**: O(1) - at most 26 characters in map

---

### Problem 5: Permutation in String
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/permutation-in-string/](https://leetcode.com/problems/permutation-in-string/)

**Description**: Check if s2 contains a permutation of s1.

#### Python Solution
```python
def checkInclusion(s1: str, s2: str) -> bool:
    # Step 1: Handle edge case
    if len(s1) > len(s2):
        return False

    # Step 2: Create frequency maps
    s1_count = {}
    window_count = {}

    # Count characters in s1
    for char in s1:
        s1_count[char] = s1_count.get(char, 0) + 1

    # Step 3: Initialize first window
    for i in range(len(s1)):
        char = s2[i]
        window_count[char] = window_count.get(char, 0) + 1

    # Step 4: Check if first window is a permutation
    if window_count == s1_count:
        return True

    # Step 5: Slide window across s2
    for i in range(len(s1), len(s2)):
        # Step 6: Add new character to window
        new_char = s2[i]
        window_count[new_char] = window_count.get(new_char, 0) + 1

        # Step 7: Remove leftmost character from window
        old_char = s2[i - len(s1)]
        window_count[old_char] -= 1
        if window_count[old_char] == 0:
            del window_count[old_char]

        # Step 8: Check if current window is a permutation
        if window_count == s1_count:
            return True

    return False

# Example: s1 = "ab", s2 = "eidbaooo"
# s1_count = {a:1, b:1}
# Window "ei": {e:1, i:1} ≠ s1_count
# Window "id": {i:1, d:1} ≠ s1_count
# Window "db": {d:1, b:1} ≠ s1_count
# Window "ba": {b:1, a:1} == s1_count ✓ (permutation found!)
```

#### TypeScript Solution
```typescript
function checkInclusion(s1: string, s2: string): boolean {
    // Step 1: Handle edge case
    if (s1.length > s2.length) return false;

    // Step 2: Create frequency maps
    const s1Count = new Map<string, number>();
    const windowCount = new Map<string, number>();

    // Count s1 characters
    for (const char of s1) {
        s1Count.set(char, (s1Count.get(char) || 0) + 1);
    }

    // Step 3: Initialize first window
    for (let i = 0; i < s1.length; i++) {
        const char = s2[i];
        windowCount.set(char, (windowCount.get(char) || 0) + 1);
    }

    // Helper to compare maps
    const mapsEqual = (map1: Map<string, number>, map2: Map<string, number>): boolean => {
        if (map1.size !== map2.size) return false;
        for (const [key, val] of map1) {
            if (map2.get(key) !== val) return false;
        }
        return true;
    };

    // Step 4: Check first window
    if (mapsEqual(windowCount, s1Count)) return true;

    // Step 5: Slide window
    for (let i = s1.length; i < s2.length; i++) {
        // Step 6: Add new character
        const newChar = s2[i];
        windowCount.set(newChar, (windowCount.get(newChar) || 0) + 1);

        // Step 7: Remove old character
        const oldChar = s2[i - s1.length];
        const count = windowCount.get(oldChar)! - 1;
        if (count === 0) {
            windowCount.delete(oldChar);
        } else {
            windowCount.set(oldChar, count);
        }

        // Step 8: Check for permutation
        if (mapsEqual(windowCount, s1Count)) return true;
    }

    return false;
}
```

**Time Complexity**: O(n) where n is length of s2
**Space Complexity**: O(1) - at most 26 characters

---

### Problem 6: Find All Anagrams in a String
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/find-all-anagrams-in-a-string/](https://leetcode.com/problems/find-all-anagrams-in-a-string/)

**Description**: Find all starting indices of p's anagrams in s.

#### Python Solution
```python
def findAnagrams(s: str, p: str) -> List[int]:
    # Step 1: Handle edge case
    if len(p) > len(s):
        return []

    # Step 2: Create frequency maps
    p_count = {}
    window_count = {}
    result = []

    # Count characters in p
    for char in p:
        p_count[char] = p_count.get(char, 0) + 1

    # Step 3: Initialize first window
    for i in range(len(p)):
        char = s[i]
        window_count[char] = window_count.get(char, 0) + 1

    # Step 4: Check first window
    if window_count == p_count:
        result.append(0)

    # Step 5: Slide window
    for i in range(len(p), len(s)):
        # Step 6: Add new character
        new_char = s[i]
        window_count[new_char] = window_count.get(new_char, 0) + 1

        # Step 7: Remove old character
        old_char = s[i - len(p)]
        window_count[old_char] -= 1
        if window_count[old_char] == 0:
            del window_count[old_char]

        # Step 8: Check if anagram found
        if window_count == p_count:
            result.append(i - len(p) + 1)

    return result

# Example: s = "cbaebabacd", p = "abc"
# p_count = {a:1, b:1, c:1}
# Window "cba": {c:1, b:1, a:1} == p_count ✓ -> index 0
# Window "bae": {b:1, a:1, e:1} ≠ p_count
# Window "aeb": {a:1, e:1, b:1} ≠ p_count
# Window "eba": {e:1, b:1, a:1} ≠ p_count
# Window "bab": {b:2, a:1} ≠ p_count
# Window "aba": {a:2, b:1} ≠ p_count
# Window "bac": {b:1, a:1, c:1} == p_count ✓ -> index 6
# Result: [0, 6]
```

#### TypeScript Solution
```typescript
function findAnagrams(s: string, p: string): number[] {
    if (p.length > s.length) return [];

    // Create frequency maps
    const pCount = new Map<string, number>();
    const windowCount = new Map<string, number>();
    const result: number[] = [];

    // Count p characters
    for (const char of p) {
        pCount.set(char, (pCount.get(char) || 0) + 1);
    }

    // Initialize first window
    for (let i = 0; i < p.length; i++) {
        const char = s[i];
        windowCount.set(char, (windowCount.get(char) || 0) + 1);
    }

    // Helper to compare maps
    const mapsEqual = (map1: Map<string, number>, map2: Map<string, number>): boolean => {
        if (map1.size !== map2.size) return false;
        for (const [key, val] of map1) {
            if (map2.get(key) !== val) return false;
        }
        return true;
    };

    // Check first window
    if (mapsEqual(windowCount, pCount)) {
        result.push(0);
    }

    // Slide window
    for (let i = p.length; i < s.length; i++) {
        // Add new character
        const newChar = s[i];
        windowCount.set(newChar, (windowCount.get(newChar) || 0) + 1);

        // Remove old character
        const oldChar = s[i - p.length];
        const count = windowCount.get(oldChar)! - 1;
        if (count === 0) {
            windowCount.delete(oldChar);
        } else {
            windowCount.set(oldChar, count);
        }

        // Check for anagram
        if (mapsEqual(windowCount, pCount)) {
            result.push(i - p.length + 1);
        }
    }

    return result;
}
```

**Time Complexity**: O(n) where n is length of s
**Space Complexity**: O(1) - at most 26 characters

---

### Problem 7: Longest Substring with At Most K Distinct Characters
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/](https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/)

**Description**: Find length of longest substring with at most k distinct characters.

#### Python Solution
```python
def lengthOfLongestSubstringKDistinct(s: str, k: int) -> int:
    # Step 1: Handle edge cases
    if k == 0 or not s:
        return 0

    # Step 2: Initialize variables
    char_count = {}  # Count of each character in window
    left = 0
    max_length = 0

    # Step 3: Expand window with right pointer
    for right in range(len(s)):
        # Step 4: Add current character to window
        char_count[s[right]] = char_count.get(s[right], 0) + 1

        # Step 5: Shrink window while too many distinct characters
        while len(char_count) > k:
            # Step 6: Remove leftmost character
            char_count[s[left]] -= 1
            if char_count[s[left]] == 0:
                del char_count[s[left]]
            left += 1

        # Step 7: Update max length
        max_length = max(max_length, right - left + 1)

    return max_length

# Example: s = "eceba", k = 2
# right=0: 'e', count={e:1}, 1 distinct, window="e", len=1
# right=1: 'c', count={e:1,c:1}, 2 distinct, window="ec", len=2
# right=2: 'e', count={e:2,c:1}, 2 distinct, window="ece", len=3
# right=3: 'b', count={e:2,c:1,b:1}, 3 distinct > 2
#   Shrink: remove 'e', count={e:1,c:1,b:1}, still 3 distinct
#   Shrink: remove 'c', count={e:1,b:1}, 2 distinct, window="eb", len=2
# right=4: 'a', count={e:1,b:1,a:1}, 3 distinct > 2
#   Shrink: remove 'e', count={b:1,a:1}, window="ba", len=2
# Max length = 3 (substring "ece")
```

#### TypeScript Solution
```typescript
function lengthOfLongestSubstringKDistinct(s: string, k: number): number {
    // Step 1: Handle edge cases
    if (k === 0 || s.length === 0) return 0;

    // Step 2: Initialize
    const charCount = new Map<string, number>();
    let left = 0;
    let maxLength = 0;

    // Step 3: Expand window
    for (let right = 0; right < s.length; right++) {
        // Step 4: Add character
        charCount.set(s[right], (charCount.get(s[right]) || 0) + 1);

        // Step 5: Shrink if needed
        while (charCount.size > k) {
            const count = charCount.get(s[left])! - 1;
            if (count === 0) {
                charCount.delete(s[left]);
            } else {
                charCount.set(s[left], count);
            }
            left++;
        }

        // Step 6: Update max
        maxLength = Math.max(maxLength, right - left + 1);
    }

    return maxLength;
}
```

**Time Complexity**: O(n) - each character processed at most twice
**Space Complexity**: O(k) - at most k distinct characters

---

### Problem 8: Sliding Window Maximum
**Difficulty**: Hard
**LeetCode Link**: [https://leetcode.com/problems/sliding-window-maximum/](https://leetcode.com/problems/sliding-window-maximum/)

**Description**: Return array of maximum values for each window of size k.

#### Python Solution
```python
from collections import deque

def maxSlidingWindow(nums: List[int], k: int) -> List[int]:
    # Step 1: Initialize deque and result
    # Deque stores indices of potentially useful elements
    # Elements are in decreasing order of their values
    dq = deque()
    result = []

    # Step 2: Process each element
    for i in range(len(nums)):
        # Step 3: Remove indices outside current window
        while dq and dq[0] < i - k + 1:
            dq.popleft()

        # Step 4: Remove elements smaller than current
        # They can never be maximum while current element is in window
        while dq and nums[dq[-1]] < nums[i]:
            dq.pop()

        # Step 5: Add current index
        dq.append(i)

        # Step 6: Add maximum to result (once window is full)
        if i >= k - 1:
            result.append(nums[dq[0]])

    return result

# Visualization for nums = [1,3,-1,-3,5,3,6,7], k = 3:
# i=0: dq=[0], window not full yet
# i=1: nums[1]=3 > nums[0]=1, remove 0, dq=[1]
# i=2: nums[2]=-1 < nums[1]=3, dq=[1,2], window full, max=nums[1]=3
#
# i=3: dq=[1,2,3] (after removing smaller), max=nums[1]=3
# i=4: nums[4]=5 > all, dq=[4], max=5
# i=5: nums[5]=3 < nums[4]=5, dq=[4,5], max=5
# i=6: nums[6]=6 > all, dq=[6], max=6
# i=7: nums[7]=7 > nums[6]=6, dq=[7], max=7
#
# Result: [3,3,5,5,6,7]
```

#### TypeScript Solution
```typescript
function maxSlidingWindow(nums: number[], k: number): number[] {
    // Step 1: Initialize
    const dq: number[] = [];  // Store indices
    const result: number[] = [];

    // Step 2: Process each element
    for (let i = 0; i < nums.length; i++) {
        // Step 3: Remove indices outside window
        while (dq.length > 0 && dq[0] < i - k + 1) {
            dq.shift();
        }

        // Step 4: Remove smaller elements
        while (dq.length > 0 && nums[dq[dq.length - 1]] < nums[i]) {
            dq.pop();
        }

        // Step 5: Add current index
        dq.push(i);

        // Step 6: Add max to result
        if (i >= k - 1) {
            result.push(nums[dq[0]]);
        }
    }

    return result;
}
```

**Time Complexity**: O(n) - each element added and removed from deque once
**Space Complexity**: O(k) - deque stores at most k elements

---

### Problem 9: Minimum Window Substring
**Difficulty**: Hard
**LeetCode Link**: [https://leetcode.com/problems/minimum-window-substring/](https://leetcode.com/problems/minimum-window-substring/)

**Description**: Find minimum window in s that contains all characters from t.

#### Python Solution
```python
def minWindow(s: str, t: str) -> str:
    # Step 1: Handle edge case
    if not s or not t:
        return ""

    # Step 2: Count characters in t
    t_count = {}
    for char in t:
        t_count[char] = t_count.get(char, 0) + 1

    # Step 3: Initialize variables
    required = len(t_count)  # Number of unique characters in t
    formed = 0  # Number of unique characters in window with desired frequency
    window_count = {}
    left = 0
    min_length = float('inf')
    min_window = (0, 0)  # (start, end) of minimum window

    # Step 4: Expand window with right pointer
    for right in range(len(s)):
        # Step 5: Add character to window
        char = s[right]
        window_count[char] = window_count.get(char, 0) + 1

        # Step 6: Check if this character's frequency matches t
        if char in t_count and window_count[char] == t_count[char]:
            formed += 1

        # Step 7: Shrink window while it's valid
        while formed == required:
            # Step 8: Update minimum window
            if right - left + 1 < min_length:
                min_length = right - left + 1
                min_window = (left, right)

            # Step 9: Remove leftmost character
            char = s[left]
            window_count[char] -= 1
            if char in t_count and window_count[char] < t_count[char]:
                formed -= 1
            left += 1

    # Step 10: Return result
    start, end = min_window
    return s[start:end + 1] if min_length != float('inf') else ""

# Example: s = "ADOBECODEBANC", t = "ABC"
# t_count = {A:1, B:1, C:1}, required = 3
#
# Expand until "ADOBEC" (formed=3), then shrink to "DOBEC", "OBEC", "BEC"
# Continue sliding...
# Minimum window = "BANC"
```

#### TypeScript Solution
```typescript
function minWindow(s: string, t: string): string {
    // Step 1: Handle edge case
    if (!s || !t) return "";

    // Step 2: Count t characters
    const tCount = new Map<string, number>();
    for (const char of t) {
        tCount.set(char, (tCount.get(char) || 0) + 1);
    }

    // Step 3: Initialize
    const required = tCount.size;
    let formed = 0;
    const windowCount = new Map<string, number>();
    let left = 0;
    let minLength = Infinity;
    let minWindow: [number, number] = [0, 0];

    // Step 4: Expand window
    for (let right = 0; right < s.length; right++) {
        // Step 5: Add character
        const char = s[right];
        windowCount.set(char, (windowCount.get(char) || 0) + 1);

        // Step 6: Check frequency match
        if (tCount.has(char) && windowCount.get(char) === tCount.get(char)) {
            formed++;
        }

        // Step 7: Shrink while valid
        while (formed === required) {
            // Step 8: Update minimum
            if (right - left + 1 < minLength) {
                minLength = right - left + 1;
                minWindow = [left, right];
            }

            // Step 9: Remove left character
            const leftChar = s[left];
            windowCount.set(leftChar, windowCount.get(leftChar)! - 1);
            if (tCount.has(leftChar) && windowCount.get(leftChar)! < tCount.get(leftChar)!) {
                formed--;
            }
            left++;
        }
    }

    // Step 10: Return result
    const [start, end] = minWindow;
    return minLength === Infinity ? "" : s.substring(start, end + 1);
}
```

**Time Complexity**: O(n + m) where n = |s|, m = |t|
**Space Complexity**: O(m) - storing character frequencies

---

### Problem 10: Fruits Into Baskets
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/fruit-into-baskets/](https://leetcode.com/problems/fruit-into-baskets/)

**Description**: Pick maximum number of fruits with at most 2 types (longest subarray with at most 2 distinct elements).

#### Python Solution
```python
def totalFruit(fruits: List[int]) -> int:
    # Step 1: Initialize variables
    # This is same as "longest substring with at most k=2 distinct characters"
    fruit_count = {}  # Count of each fruit type in window
    left = 0
    max_fruits = 0

    # Step 2: Expand window with right pointer
    for right in range(len(fruits)):
        # Step 3: Add current fruit to basket
        fruit_count[fruits[right]] = fruit_count.get(fruits[right], 0) + 1

        # Step 4: Shrink window while more than 2 types
        while len(fruit_count) > 2:
            # Step 5: Remove leftmost fruit
            fruit_count[fruits[left]] -= 1
            if fruit_count[fruits[left]] == 0:
                del fruit_count[fruits[left]]
            left += 1

        # Step 6: Update max fruits collected
        max_fruits = max(max_fruits, right - left + 1)

    return max_fruits

# Example: fruits = [1,2,1,2,3,1,1]
# right=0: basket={1:1}, 1 type, total=1
# right=1: basket={1:1,2:1}, 2 types, total=2
# right=2: basket={1:2,2:1}, 2 types, total=3
# right=3: basket={1:2,2:2}, 2 types, total=4
# right=4: basket={1:2,2:2,3:1}, 3 types > 2
#   Shrink: basket={1:1,2:2,3:1}, still 3 types
#   Shrink: basket={1:1,3:1}, 2 types, total=2
# right=5: basket={1:2,3:1}, 2 types, total=3
# right=6: basket={1:3,3:1}, 2 types, total=4
# Max = 4
```

#### TypeScript Solution
```typescript
function totalFruit(fruits: number[]): number {
    // Step 1: Initialize
    const fruitCount = new Map<number, number>();
    let left = 0;
    let maxFruits = 0;

    // Step 2: Expand window
    for (let right = 0; right < fruits.length; right++) {
        // Step 3: Add fruit
        fruitCount.set(fruits[right], (fruitCount.get(fruits[right]) || 0) + 1);

        // Step 4: Shrink if needed
        while (fruitCount.size > 2) {
            const count = fruitCount.get(fruits[left])! - 1;
            if (count === 0) {
                fruitCount.delete(fruits[left]);
            } else {
                fruitCount.set(fruits[left], count);
            }
            left++;
        }

        // Step 5: Update max
        maxFruits = Math.max(maxFruits, right - left + 1);
    }

    return maxFruits;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - at most 3 elements in map

---

### Problem 11: Max Consecutive Ones III
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/max-consecutive-ones-iii/](https://leetcode.com/problems/max-consecutive-ones-iii/)

**Description**: Find maximum consecutive 1s if you can flip at most k 0s.

#### Python Solution
```python
def longestOnes(nums: List[int], k: int) -> int:
    # Step 1: Initialize variables
    left = 0
    zero_count = 0  # Count of 0s in current window
    max_length = 0

    # Step 2: Expand window with right pointer
    for right in range(len(nums)):
        # Step 3: Count zeros in window
        if nums[right] == 0:
            zero_count += 1

        # Step 4: Shrink window while too many zeros
        while zero_count > k:
            # Step 5: Remove leftmost element
            if nums[left] == 0:
                zero_count -= 1
            left += 1

        # Step 6: Update max length
        max_length = max(max_length, right - left + 1)

    return max_length

# Example: nums = [1,1,1,0,0,0,1,1,1,1,0], k = 2
# Can flip 2 zeros to 1s
#
# right=0-2: [1,1,1], zeros=0, len=3
# right=3: [1,1,1,0], zeros=1, len=4
# right=4: [1,1,1,0,0], zeros=2, len=5
# right=5: [1,1,1,0,0,0], zeros=3 > 2
#   Shrink until zeros=2: [1,0,0,0]
# right=6: [1,0,0,0,1], zeros=3 > 2
#   Shrink: [0,0,0,1], still too many
#   Shrink: [0,0,1], zeros=2, len=3
# right=7-9: [0,0,1,1,1,1], zeros=2, len=6
# right=10: [0,0,1,1,1,1,0], zeros=3 > 2
#   Shrink: [0,1,1,1,1,0], zeros=2, len=6
# Max = 6 (flip two 0s to get [0,0,1,1,1,1,1,1])
```

#### TypeScript Solution
```typescript
function longestOnes(nums: number[], k: number): number {
    // Step 1: Initialize
    let left = 0;
    let zeroCount = 0;
    let maxLength = 0;

    // Step 2: Expand window
    for (let right = 0; right < nums.length; right++) {
        // Step 3: Count zeros
        if (nums[right] === 0) {
            zeroCount++;
        }

        // Step 4: Shrink if too many zeros
        while (zeroCount > k) {
            if (nums[left] === 0) {
                zeroCount--;
            }
            left++;
        }

        // Step 5: Update max
        maxLength = Math.max(maxLength, right - left + 1);
    }

    return maxLength;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(1) - only using counters

---

### Problem 12: Substring with Concatenation of All Words
**Difficulty**: Hard
**LeetCode Link**: [https://leetcode.com/problems/substring-with-concatenation-of-all-words/](https://leetcode.com/problems/substring-with-concatenation-of-all-words/)

**Description**: Find all starting indices of substring(s) that is concatenation of each word in words exactly once.

#### Python Solution
```python
def findSubstring(s: str, words: List[str]) -> List[int]:
    # Step 1: Handle edge cases
    if not s or not words:
        return []

    # Step 2: Initialize variables
    word_len = len(words[0])
    word_count = len(words)
    total_len = word_len * word_count
    result = []

    # Step 3: Create frequency map of words
    words_freq = {}
    for word in words:
        words_freq[word] = words_freq.get(word, 0) + 1

    # Step 4: Try each possible starting position
    # We only need to try word_len different starting positions
    for i in range(word_len):
        # Step 5: Use sliding window for this starting position
        left = i
        right = i
        current_freq = {}
        count = 0  # Count of valid words in current window

        while right + word_len <= len(s):
            # Step 6: Get word at right pointer
            word = s[right:right + word_len]
            right += word_len

            # Step 7: If word is valid, add to window
            if word in words_freq:
                current_freq[word] = current_freq.get(word, 0) + 1
                count += 1

                # Step 8: If word appears too many times, shrink window
                while current_freq[word] > words_freq[word]:
                    left_word = s[left:left + word_len]
                    current_freq[left_word] -= 1
                    count -= 1
                    left += word_len

                # Step 9: If window contains all words, add to result
                if count == word_count:
                    result.append(left)

            # Step 10: Word not in list, reset window
            else:
                current_freq.clear()
                count = 0
                left = right

    return result

# Example: s = "barfoothefoobarman", words = ["foo","bar"]
# word_len=3, word_count=2, total_len=6
# words_freq = {foo:1, bar:1}
#
# Try starting at i=0: "barfoo" ✓ (index 0), "foobar" ✓ (index 9)
# Try starting at i=1: no matches
# Try starting at i=2: no matches
# Result: [0, 9]
```

#### TypeScript Solution
```typescript
function findSubstring(s: string, words: string[]): number[] {
    if (!s || !words || words.length === 0) return [];

    const wordLen = words[0].length;
    const wordCount = words.length;
    const totalLen = wordLen * wordCount;
    const result: number[] = [];

    // Create frequency map
    const wordsFreq = new Map<string, number>();
    for (const word of words) {
        wordsFreq.set(word, (wordsFreq.get(word) || 0) + 1);
    }

    // Try each starting position
    for (let i = 0; i < wordLen; i++) {
        let left = i;
        let right = i;
        const currentFreq = new Map<string, number>();
        let count = 0;

        while (right + wordLen <= s.length) {
            const word = s.substring(right, right + wordLen);
            right += wordLen;

            if (wordsFreq.has(word)) {
                currentFreq.set(word, (currentFreq.get(word) || 0) + 1);
                count++;

                while (currentFreq.get(word)! > wordsFreq.get(word)!) {
                    const leftWord = s.substring(left, left + wordLen);
                    currentFreq.set(leftWord, currentFreq.get(leftWord)! - 1);
                    count--;
                    left += wordLen;
                }

                if (count === wordCount) {
                    result.push(left);
                }
            } else {
                currentFreq.clear();
                count = 0;
                left = right;
            }
        }
    }

    return result;
}
```

**Time Complexity**: O(n × m) where n = |s|, m = word_len
**Space Complexity**: O(k) where k = number of unique words

---

### Problem 13: Longest Subarray of 1s After Deleting One Element
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/](https://leetcode.com/problems/longest-subarray-of-1s-after-deleting-one-element/)

**Description**: Find longest subarray of 1s after deleting exactly one element.

#### Python Solution
```python
def longestSubarray(nums: List[int]) -> int:
    # Step 1: Initialize variables
    # Similar to "Max Consecutive Ones III" with k=1, but must delete one element
    left = 0
    zero_count = 0
    max_length = 0

    # Step 2: Expand window with right pointer
    for right in range(len(nums)):
        # Step 3: Count zeros
        if nums[right] == 0:
            zero_count += 1

        # Step 4: Shrink window while more than 1 zero
        while zero_count > 1:
            if nums[left] == 0:
                zero_count -= 1
            left += 1

        # Step 5: Update max length
        # Subtract 1 because we must delete one element
        max_length = max(max_length, right - left)

    return max_length

# Example: nums = [1,1,0,1]
# right=0: [1], zeros=0, len=0 (must delete one)
# right=1: [1,1], zeros=0, len=1
# right=2: [1,1,0], zeros=1, len=2 (delete the 0)
# right=3: [1,1,0,1], zeros=1, len=3 (delete the 0)
# Max = 3 (delete 0 to get [1,1,1])
```

#### TypeScript Solution
```typescript
function longestSubarray(nums: number[]): number {
    // Step 1: Initialize
    let left = 0;
    let zeroCount = 0;
    let maxLength = 0;

    // Step 2: Expand window
    for (let right = 0; right < nums.length; right++) {
        // Step 3: Count zeros
        if (nums[right] === 0) {
            zeroCount++;
        }

        // Step 4: Shrink if needed
        while (zeroCount > 1) {
            if (nums[left] === 0) {
                zeroCount--;
            }
            left++;
        }

        // Step 5: Update max (subtract 1 for mandatory deletion)
        maxLength = Math.max(maxLength, right - left);
    }

    return maxLength;
}
```

**Time Complexity**: O(n) - single pass
**Space Complexity**: O(1) - constant space

---

## Summary

The **Sliding Window** pattern is a powerful technique for optimizing sequence problems. Key takeaways:

1. **Fixed Window**: Calculate once, slide by removing left and adding right
2. **Variable Window**: Expand until invalid, then shrink until valid
3. **Character Frequency**: Use hashmap to track window state
4. **Deque for Min/Max**: Maintain monotonic deque for range queries
5. **Two Types**:
   - **Fixed size**: Maximum/minimum of subarrays of size k
   - **Variable size**: Longest/shortest subarray meeting criteria

Master recognizing when to expand vs. shrink the window - that's the key to solving these problems efficiently!
