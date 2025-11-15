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

#### Fixed-Size Window: The Sliding Curtain
Imagine a curtain of fixed width sliding across a stage. As it moves right, it reveals new elements and hides old ones.

```
Array: [1, 3, 2, 6, -1, 4, 1, 8, 2]
Index:  0  1  2  3   4  5  6  7  8

Step 1: Initial Window (k=3)
        ┌─────────┐
        │ 1  3  2 │  sum = 6
        └─────────┘
         L     R

Step 2: Slide Right (remove 1, add 6)
           ┌─────────┐
        1  │ 3  2  6 │  sum = 11  (removed 1, added 6)
           └─────────┘
            L     R

Step 3: Slide Right (remove 3, add -1)
              ┌──────────┐
        1  3  │ 2  6 -1 │  sum = 7  (removed 3, added -1)
              └──────────┘
               L      R

Step 4: Continue sliding...
                 ┌──────────┐
        1  3  2  │ 6 -1  4 │  sum = 9
                 └──────────┘
                  L      R

Pattern: Each step removes LEFT element, adds RIGHT element
```

#### Variable-Size Window: The Elastic Band
Imagine an elastic band that expands when possible and contracts when necessary.

```
Array: [2, 3, 1, 2, 4, 3], target_sum = 7
Index:  0  1  2  3  4  5

Phase 1: EXPAND until sum >= target
        ┌───┐
Step 1: │ 2 │            sum = 2 < 7  ➜ EXPAND
        └───┘
         L,R

        ┌───────┐
Step 2: │ 2  3 │         sum = 5 < 7  ➜ EXPAND
        └───────┘
         L     R

        ┌───────────┐
Step 3: │ 2  3  1 │     sum = 6 < 7  ➜ EXPAND
        └───────────┘
         L        R

        ┌───────────────┐
Step 4: │ 2  3  1  2 │  sum = 8 >= 7 ✓ VALID! length = 4
        └───────────────┘
         L           R

Phase 2: SHRINK while valid, looking for smaller window
           ┌───────────┐
Step 5:  2 │ 3  1  2 │  sum = 6 < 7  (shrank too much)
           └───────────┘
            L        R

Phase 3: EXPAND again
           ┌───────────────┐
Step 6:  2 │ 3  1  2  4 │  sum = 10 >= 7 ✓ length = 5
           └───────────────┘
            L           R

           SHRINK ↓
              ┌───────────┐
Step 7:  2  3 │ 1  2  4 │  sum = 7 >= 7 ✓ length = 3 (minimum!)
              └───────────┘
               L        R

Pattern: RIGHT expands, LEFT shrinks. Each element visited at most TWICE!
```

#### Character Frequency Window: The Letter Counter
Track character frequencies as the window slides - perfect for anagram/permutation problems.

```
String s2: "e i d b a o o o"
Index:      0 1 2 3 4 5 6 7
Pattern s1: "ab" → need {a:1, b:1}

Step 1: Window size 2, check "ei"
        ┌─────┐
        │ e i │  freq = {e:1, i:1} ≠ {a:1, b:1} ✗
        └─────┘
         L   R

Step 2: Slide → check "id"
           ┌─────┐
        e  │ i d │  freq = {i:1, d:1} ≠ {a:1, b:1} ✗
           └─────┘
            L   R

Step 3: Slide → check "db"
              ┌─────┐
        e  i  │ d b │  freq = {d:1, b:1} ≠ {a:1, b:1} ✗
              └─────┘
               L   R

Step 4: Slide → check "ba"  🎯 MATCH!
                 ┌─────┐
        e  i  d  │ b a │  freq = {b:1, a:1} = {a:1, b:1} ✓
                 └─────┘
                  L   R

Process: Remove left char, add right char, compare frequencies!
```

#### Expanding/Contracting Window: The Breathing Technique
Watch how the window "breathes" - expanding when valid, contracting when invalid.

```
Array: [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0]
Task: Max consecutive 1s with at most k=2 flips (0→1)

Animation of window movement:

        [1 1 1]              zeros=0 ✓ len=3
         ─────

        [1 1 1 0]            zeros=1 ✓ len=4 (flip one 0)
         ───────

        [1 1 1 0 0]          zeros=2 ✓ len=5 (flip two 0s)
         ─────────

        [1 1 1 0 0 0]        zeros=3 ✗ TOO MANY!
         ───────────          MUST SHRINK ↓

          [1 1 0 0 0]        zeros=3 ✗ STILL TOO MANY!
           ─────────          SHRINK MORE ↓

            [1 0 0 0]        zeros=3 ✗ KEEP SHRINKING!
             ───────          ↓

              [0 0 0]        zeros=3 ✗ SHRINK!
               ─────          ↓

                [0 0]        zeros=2 ✓ VALID! But small...
                 ───          NOW EXPAND ➜

                [0 0 1]      zeros=2 ✓ len=3
                 ─────        EXPAND ➜

                [0 0 1 1]    zeros=2 ✓ len=4
                 ───────      EXPAND ➜

                [0 0 1 1 1]  zeros=2 ✓ len=5
                 ─────────    EXPAND ➜

                [0 0 1 1 1 1]    zeros=2 ✓ len=6 🎯 MAXIMUM!
                 ───────────────

Key Insight: Window EXPANDS greedily, CONTRACTS reluctantly!
```

#### The Two-Pointer Dance
Visualize how left and right pointers coordinate their movement.

```
Array: [a, b, c, a, b, c, b, b]
Goal: Longest substring without repeating characters

L = Left pointer (removes)
R = Right pointer (adds)
Set = characters in current window

Step 0: L=0, R=0, Set={}
        ↓
        a  b  c  a  b  c  b  b
        R

Step 1: Add 'a', Set={a}, length=1
        ↓
        a  b  c  a  b  c  b  b
        LR

Step 2: Add 'b', Set={a,b}, length=2
        ↓     ↓
        a  b  c  a  b  c  b  b
        L     R

Step 3: Add 'c', Set={a,b,c}, length=3 ✓
        ↓        ↓
        a  b  c  a  b  c  b  b
        L        R

Step 4: Add 'a' → DUPLICATE! Remove from left until no duplicate
                 ↓
        a  b  c  a  b  c  b  b
        L           R
        Remove 'a' →

           ↓     ↓
        a  b  c  a  b  c  b  b
           L        R
        Set={b,c,a}, length=3

Step 5: Add 'b' → DUPLICATE! Remove from left
           ↓        ↓
        a  b  c  a  b  c  b  b
           L           R
        Remove 'b' →

              ↓     ↓
        a  b  c  a  b  c  b  b
              L        R
        Set={c,a,b}, length=3

The Dance: R moves right every beat, L moves right only when needed!
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

### Problem 14: Contains Duplicate II
**Difficulty**: Easy
**LeetCode Link**: [https://leetcode.com/problems/contains-duplicate-ii/](https://leetcode.com/problems/contains-duplicate-ii/)

**Description**: Check if array contains duplicate values within a window of size k.

#### Python Solution
```python
def containsNearbyDuplicate(nums: List[int], k: int) -> bool:
    # Step 1: Initialize window set
    # We maintain a sliding window of size k using a set
    window = set()

    # Step 2: Iterate through array
    for i in range(len(nums)):
        # Step 3: Check if current number is in window
        if nums[i] in window:
            return True  # Found duplicate within distance k

        # Step 4: Add current number to window
        window.add(nums[i])

        # Step 5: Remove element that's now outside window
        # If window size exceeds k, remove leftmost element
        if len(window) > k:
            window.remove(nums[i - k])

    return False

# Visualization for nums = [1,2,3,1], k = 3:
# i=0: window={1}, check 1? No, add it
# i=1: window={1,2}, check 2? No, add it
# i=2: window={1,2,3}, check 3? No, add it
# i=3: window={1,2,3}, check 1? Yes! ✓ Found duplicate
#
# Window visualization:
# [1, 2, 3, 1]
#  --------     i=0-2: window size = 3
#     --------  i=3: 1 already in window!
#
# Example 2: nums = [1,2,3,1,2,3], k = 2:
# i=0: window={1}
# i=1: window={1,2}
# i=2: window={2,3} (removed 1, size limit = 2)
# i=3: window={3,1} (removed 2)
# i=4: window={1,2} (removed 3)
# i=5: window={2,3} (removed 1)
# No duplicates within k=2 distance
```

#### TypeScript Solution
```typescript
function containsNearbyDuplicate(nums: number[], k: number): boolean {
    // Step 1: Initialize window set
    const window = new Set<number>();

    // Step 2: Iterate through array
    for (let i = 0; i < nums.length; i++) {
        // Step 3: Check for duplicate
        if (window.has(nums[i])) {
            return true;
        }

        // Step 4: Add to window
        window.add(nums[i]);

        // Step 5: Maintain window size
        if (window.size > k) {
            window.delete(nums[i - k]);
        }
    }

    return false;
}
```

**Time Complexity**: O(n) - single pass through array
**Space Complexity**: O(min(n, k)) - set stores at most k elements

---

### Problem 15: Subarray Product Less Than K
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/subarray-product-less-than-k/](https://leetcode.com/problems/subarray-product-less-than-k/)

**Description**: Count number of contiguous subarrays where product is less than k.

#### Python Solution
```python
def numSubarrayProductLessThanK(nums: List[int], k: int) -> int:
    # Step 1: Handle edge case
    if k <= 1:
        return 0  # Product can't be less than 1

    # Step 2: Initialize variables
    left = 0
    product = 1
    count = 0

    # Step 3: Expand window with right pointer
    for right in range(len(nums)):
        # Step 4: Multiply by new element
        product *= nums[right]

        # Step 5: Shrink window while product >= k
        while product >= k:
            # Step 6: Divide by leftmost element
            product //= nums[left]
            left += 1

        # Step 7: Count all subarrays ending at right
        # For window [left...right], number of subarrays = right - left + 1
        # These are: [right], [right-1, right], [right-2, right-1, right], ...
        count += right - left + 1

    return count

# Visualization for nums = [10, 5, 2, 6], k = 100:
#
# right=0: [10], product=10 < 100
#          Count subarrays: [10] → count += 1 = 1
#
# right=1: [10,5], product=50 < 100
#          Count subarrays: [5], [10,5] → count += 2 = 3
#
# right=2: [10,5,2], product=100 >= 100 (invalid!)
#          Shrink: [5,2], product=10 < 100
#          Count subarrays: [2], [5,2] → count += 2 = 5
#
# right=3: [5,2,6], product=60 < 100
#          Count subarrays: [6], [2,6], [5,2,6] → count += 3 = 8
#
# Total: 8 subarrays
#
# Visual diagram:
# [10, 5, 2, 6]
#  ▓           → [10]
#  ▓▓          → [10,5]
#     ▓        → [5]
#     ▓▓       → [5,2]
#        ▓     → [2]
#     ▓▓▓      → [5,2,6]
#        ▓▓    → [2,6]
#           ▓  → [6]
```

#### TypeScript Solution
```typescript
function numSubarrayProductLessThanK(nums: number[], k: number): number {
    // Step 1: Handle edge case
    if (k <= 1) return 0;

    // Step 2: Initialize
    let left = 0;
    let product = 1;
    let count = 0;

    // Step 3: Expand window
    for (let right = 0; right < nums.length; right++) {
        // Step 4: Update product
        product *= nums[right];

        // Step 5: Shrink while invalid
        while (product >= k) {
            product /= nums[left];
            left++;
        }

        // Step 6: Count subarrays
        count += right - left + 1;
    }

    return count;
}
```

**Time Complexity**: O(n) - each element added and removed once
**Space Complexity**: O(1) - constant space

---

### Problem 16: Grumpy Bookstore Owner
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/grumpy-bookstore-owner/](https://leetcode.com/problems/grumpy-bookstore-owner/)

**Description**: Maximize satisfied customers by using a technique for X minutes to not be grumpy.

#### Python Solution
```python
def maxSatisfied(customers: List[int], grumpy: List[int], minutes: int) -> int:
    # Step 1: Calculate base satisfied customers (when not grumpy)
    base_satisfied = 0
    for i in range(len(customers)):
        if grumpy[i] == 0:  # Not grumpy
            base_satisfied += customers[i]

    # Step 2: Find best window to apply technique
    # Calculate additional customers we can satisfy in first window
    additional = 0
    for i in range(minutes):
        if grumpy[i] == 1:  # Was grumpy, technique makes them satisfied
            additional += customers[i]

    max_additional = additional

    # Step 3: Slide window to find maximum additional customers
    for i in range(minutes, len(customers)):
        # Add new element (right side of window)
        if grumpy[i] == 1:
            additional += customers[i]

        # Remove old element (left side of window)
        if grumpy[i - minutes] == 1:
            additional -= customers[i - minutes]

        # Update maximum
        max_additional = max(max_additional, additional)

    # Step 4: Return total satisfied customers
    return base_satisfied + max_additional

# Visualization:
# customers = [1, 0, 1, 2, 1, 1, 7, 5]
# grumpy    = [0, 1, 0, 1, 0, 1, 0, 1]
# minutes   = 3
#
# Base satisfied (grumpy=0): 1 + 1 + 1 + 7 = 10
#
# Window analysis (grumpy=1 positions):
# Window [0,1,2]: grumpy positions: 1 → additional = 0
# Window [1,2,3]: grumpy positions: 1,3 → additional = 0+2 = 2
# Window [2,3,4]: grumpy positions: 3 → additional = 2
# Window [3,4,5]: grumpy positions: 3,5 → additional = 2+1 = 3
# Window [4,5,6]: grumpy positions: 5 → additional = 1
# Window [5,6,7]: grumpy positions: 5,7 → additional = 1+5 = 6 ← MAX!
#
# Total: 10 + 6 = 16
#
# Visual:
# Normally satisfied:    [1, _, 1, _, 1, _, 7, _] = 10
# Best technique window:  _ [_, _, _, 1, _, 5] = 6
# Total:                 [1, 0, 1, 2, 1, 1, 7, 5] = 16
```

#### TypeScript Solution
```typescript
function maxSatisfied(customers: number[], grumpy: number[], minutes: number): number {
    // Step 1: Base satisfied customers
    let baseSatisfied = 0;
    for (let i = 0; i < customers.length; i++) {
        if (grumpy[i] === 0) {
            baseSatisfied += customers[i];
        }
    }

    // Step 2: First window additional customers
    let additional = 0;
    for (let i = 0; i < minutes; i++) {
        if (grumpy[i] === 1) {
            additional += customers[i];
        }
    }

    let maxAdditional = additional;

    // Step 3: Slide window
    for (let i = minutes; i < customers.length; i++) {
        // Add right element
        if (grumpy[i] === 1) {
            additional += customers[i];
        }

        // Remove left element
        if (grumpy[i - minutes] === 1) {
            additional -= customers[i - minutes];
        }

        maxAdditional = Math.max(maxAdditional, additional);
    }

    // Step 4: Return total
    return baseSatisfied + maxAdditional;
}
```

**Time Complexity**: O(n) - two passes through array
**Space Complexity**: O(1) - constant space

---

### Problem 17: Longest Turbulent Subarray
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/longest-turbulent-subarray/](https://leetcode.com/problems/longest-turbulent-subarray/)

**Description**: Find length of longest turbulent subarray (alternating greater/less comparisons).

#### Python Solution
```python
def maxTurbulenceSize(arr: List[int]) -> int:
    # Step 1: Handle edge case
    if len(arr) <= 1:
        return len(arr)

    # Step 2: Initialize variables
    left = 0
    max_length = 1

    # Step 3: Iterate through array
    for right in range(1, len(arr)):
        # Step 4: Check if turbulent pattern continues
        if right >= 2:
            # Compare current comparison with previous comparison
            # Turbulent means comparisons alternate: > < > or < > <
            prev_comp = arr[right - 1] - arr[right - 2]
            curr_comp = arr[right] - arr[right - 1]

            # If same sign or either is 0, pattern breaks
            if prev_comp * curr_comp >= 0:
                left = right - 1  # Start new window

        # Step 5: Handle equal elements
        if arr[right] == arr[right - 1]:
            left = right  # Equal elements break turbulence

        # Step 6: Update max length
        max_length = max(max_length, right - left + 1)

    return max_length

# Visualization for arr = [9,4,2,10,7,8,8,1,9]:
#
# Index:  0  1  2  3   4  5  6  7  8
# Array: [9, 4, 2, 10, 7, 8, 8, 1, 9]
#         >  >  <   >  <  =  >  <     (comparisons)
#
# Step-by-step:
# i=1: [9,4], 9>4, length=2 ✓
# i=2: [9,4,2], 9>4>2 (same direction!), reset to [4,2], length=2
# i=3: [4,2,10], 4>2<10 (turbulent!), length=3 ✓
# i=4: [4,2,10,7], 4>2<10>7 (turbulent!), length=4 ✓
# i=5: [4,2,10,7,8], 4>2<10>7<8 (turbulent!), length=5 ✓
# i=6: [..8,8], equal! reset to [8], length=1
# i=7: [8,1], 8>1, length=2
# i=8: [8,1,9], 8>1<9 (turbulent!), length=3
#
# Maximum length = 5 (subarray [4,2,10,7,8])
#
# Turbulent pattern visual:
#     ╱╲
#    ╱  ╲╱╲
#   ╱      ╲
# [4, 2, 10, 7, 8]  ← Alternating peaks and valleys!
```

#### TypeScript Solution
```typescript
function maxTurbulenceSize(arr: number[]): number {
    // Step 1: Handle edge case
    if (arr.length <= 1) return arr.length;

    // Step 2: Initialize
    let left = 0;
    let maxLength = 1;

    // Step 3: Iterate
    for (let right = 1; right < arr.length; right++) {
        // Step 4: Check turbulent pattern
        if (right >= 2) {
            const prevComp = arr[right - 1] - arr[right - 2];
            const currComp = arr[right] - arr[right - 1];

            // Pattern breaks if same sign or either is 0
            if (prevComp * currComp >= 0) {
                left = right - 1;
            }
        }

        // Step 5: Handle equal elements
        if (arr[right] === arr[right - 1]) {
            left = right;
        }

        // Step 6: Update max
        maxLength = Math.max(maxLength, right - left + 1);
    }

    return maxLength;
}
```

**Time Complexity**: O(n) - single pass
**Space Complexity**: O(1) - constant space

---

### Problem 18: Number of Substrings Containing All Three Characters
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/number-of-substrings-containing-all-three-characters/](https://leetcode.com/problems/number-of-substrings-containing-all-three-characters/)

**Description**: Count substrings that contain at least one of each character 'a', 'b', and 'c'.

#### Python Solution
```python
def numberOfSubstrings(s: str) -> int:
    # Step 1: Initialize variables
    # Track last seen index of each character
    last_seen = {'a': -1, 'b': -1, 'c': -1}
    count = 0

    # Step 2: Iterate through string
    for i in range(len(s)):
        # Step 3: Update last seen index for current character
        last_seen[s[i]] = i

        # Step 4: Count valid substrings ending at position i
        # The leftmost valid starting position is min(last_seen) + 1
        # All positions from 0 to min(last_seen) are valid starts
        min_index = min(last_seen.values())

        # Step 5: Add count of valid substrings
        # If all characters have been seen (min_index >= 0),
        # we can form (min_index + 1) valid substrings ending at i
        if min_index >= 0:
            count += min_index + 1

    return count

# Visualization for s = "abcabc":
#
# Index:  0  1  2  3  4  5
# String: a  b  c  a  b  c
#
# i=0: 'a', last_seen={a:0, b:-1, c:-1}, min=-1, count=0
# i=1: 'b', last_seen={a:0, b:1, c:-1}, min=-1, count=0
# i=2: 'c', last_seen={a:0, b:1, c:2}, min=0, count+=1 = 1
#      Valid substrings: [abc]
#                         ^^^
#
# i=3: 'a', last_seen={a:3, b:1, c:2}, min=1, count+=2 = 3
#      Valid substrings: [abca], [bca]
#                         ^^^^    ^^^
#
# i=4: 'b', last_seen={a:3, b:4, c:2}, min=2, count+=3 = 6
#      Valid substrings: [abcab], [bcab], [cab]
#                         ^^^^^    ^^^^    ^^^
#
# i=5: 'c', last_seen={a:3, b:4, c:5}, min=3, count+=4 = 10
#      Valid substrings: [abcabc], [bcabc], [cabc], [abc]
#                         ^^^^^^    ^^^^^    ^^^^    ^^^
#
# Total: 10 substrings
#
# Key insight: For each position, count how many valid starting positions exist
# [a b c a b c]
#  0 1 2 3 4 5
#      ▓ ← First valid substring ends here
#      ▓▓ ← Two valid substrings end here
#      ▓▓▓ ← Three valid substrings end here
#      ▓▓▓▓ ← Four valid substrings end here
```

#### TypeScript Solution
```typescript
function numberOfSubstrings(s: string): number {
    // Step 1: Initialize
    const lastSeen = { a: -1, b: -1, c: -1 };
    let count = 0;

    // Step 2: Iterate through string
    for (let i = 0; i < s.length; i++) {
        // Step 3: Update last seen
        lastSeen[s[i] as 'a' | 'b' | 'c'] = i;

        // Step 4: Find minimum index
        const minIndex = Math.min(lastSeen.a, lastSeen.b, lastSeen.c);

        // Step 5: Count valid substrings
        if (minIndex >= 0) {
            count += minIndex + 1;
        }
    }

    return count;
}
```

**Time Complexity**: O(n) - single pass through string
**Space Complexity**: O(1) - storing only 3 indices

---

### Problem 19: Replace the Substring for Balanced String
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/replace-the-substring-for-balanced-string/](https://leetcode.com/problems/replace-the-substring-for-balanced-string/)

**Description**: Find minimum length substring to replace to make string balanced (each char appears n/4 times).

#### Python Solution
```python
def balancedString(s: str) -> int:
    # Step 1: Count character frequencies
    count = {'Q': 0, 'W': 0, 'E': 0, 'R': 0}
    for char in s:
        count[char] += 1

    # Step 2: Calculate target frequency (balanced)
    n = len(s)
    target = n // 4

    # Step 3: Check if already balanced
    if all(count[char] <= target for char in count):
        return 0

    # Step 4: Use sliding window to find minimum replacement length
    left = 0
    min_length = n

    # Step 5: Expand window with right pointer
    for right in range(n):
        # Step 6: Remove character from count (it's in replacement window)
        count[s[right]] -= 1

        # Step 7: Shrink window while valid
        # Valid: characters outside window don't exceed target
        while left < n and all(count[char] <= target for char in count):
            # Step 8: Update minimum length
            min_length = min(min_length, right - left + 1)

            # Step 9: Add back left character (shrink window)
            count[s[left]] += 1
            left += 1

    return min_length

# Visualization for s = "QWER":
# Already balanced: Q=1, W=1, E=1, R=1 (each appears 4/4 = 1 time)
# Return 0
#
# Example 2: s = "QQWE"
# Count: Q=2, W=1, E=1, R=0 (target = 1 each)
# Need to fix: Q appears 2 times (1 extra), R appears 0 times (1 missing)
#
# Window analysis:
# [Q Q W E]
#  ─         Count outside: Q=1, W=1, E=1, R=0 → R>target? No, but R<target
#  ───       Count outside: Q=0, W=1, E=1, R=0 → Q valid, but need R
#  ─────     Count outside: Q=0, W=0, E=1, R=0
#  ───────   Count outside: Q=0, W=0, E=0, R=0
#
# Need to replace "QQ" (length 2) to make balanced
#
# Visual representation:
# Original: [Q, Q, W, E]  frequencies: Q=2, W=1, E=1, R=0
# Replace:  [R, R, W, E]  frequencies: Q=0, W=1, E=1, R=2... no
# Replace:  [R, W, W, E]  frequencies: Q=0, W=2, E=1, R=1... no
# Replace:  [W, R, W, E]  frequencies: Q=0, W=2, E=1, R=1... no
# Replace:  [E, R, W, E]  frequencies: Q=0, W=1, E=2, R=1... no
# Replace:  [R, E, W, E]  frequencies: Q=0, W=1, E=2, R=1... no
# Replace:  [W, E, W, E]  frequencies: Q=0, W=2, E=2, R=0... no
# Replace:  [R, W, W, E]  frequencies: Q=0, W=2, E=1, R=1... no
# Best:     [E, R, W, E]  or similar → minimum replacement length = 2
```

#### TypeScript Solution
```typescript
function balancedString(s: string): number {
    // Step 1: Count frequencies
    const count = new Map<string, number>([
        ['Q', 0], ['W', 0], ['E', 0], ['R', 0]
    ]);

    for (const char of s) {
        count.set(char, (count.get(char) || 0) + 1);
    }

    // Step 2: Calculate target
    const n = s.length;
    const target = n / 4;

    // Step 3: Check if balanced
    const isBalanced = (): boolean => {
        for (const [char, freq] of count) {
            if (freq > target) return false;
        }
        return true;
    };

    if (isBalanced()) return 0;

    // Step 4: Sliding window
    let left = 0;
    let minLength = n;

    // Step 5: Expand window
    for (let right = 0; right < n; right++) {
        // Step 6: Remove from count
        count.set(s[right], count.get(s[right])! - 1);

        // Step 7: Shrink while valid
        while (isBalanced()) {
            // Step 8: Update minimum
            minLength = Math.min(minLength, right - left + 1);

            // Step 9: Add back left
            count.set(s[left], count.get(s[left])! + 1);
            left++;
        }
    }

    return minLength;
}
```

**Time Complexity**: O(n) - each character visited at most twice
**Space Complexity**: O(1) - fixed size map (4 characters)

---

### Problem 20: Count Number of Nice Subarrays
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/count-number-of-nice-subarrays/](https://leetcode.com/problems/count-number-of-nice-subarrays/)

**Description**: Count subarrays with exactly k odd numbers.

#### Python Solution
```python
def numberOfSubarrays(nums: List[int], k: int) -> int:
    # Step 1: Helper function - count subarrays with at most k odds
    def at_most_k_odds(k: int) -> int:
        left = 0
        odd_count = 0
        result = 0

        for right in range(len(nums)):
            # Count odd numbers
            if nums[right] % 2 == 1:
                odd_count += 1

            # Shrink while too many odds
            while odd_count > k:
                if nums[left] % 2 == 1:
                    odd_count -= 1
                left += 1

            # Count all subarrays ending at right
            result += right - left + 1

        return result

    # Step 2: Use subtraction trick
    # Exactly k = at_most(k) - at_most(k-1)
    return at_most_k_odds(k) - at_most_k_odds(k - 1)

# Visualization for nums = [1,1,2,1,1], k = 3:
#
# Array: [1, 1, 2, 1, 1]  (odd: 1,1,_,1,1)
#         ^  ^     ^  ^   ← odd numbers
#
# Step 1: Count at_most_k_odds(3):
# [1] → 1 odd, count subarrays: 1
# [1,1] → 2 odds, count subarrays: 1+2 = 3
# [1,1,2] → 2 odds, count subarrays: 3+3 = 6
# [1,1,2,1] → 3 odds, count subarrays: 6+4 = 10
# [1,1,2,1,1] → 4 odds > 3, shrink
#   [1,2,1,1] → 3 odds, count subarrays: 10+4 = 14
# Total: 14
#
# Step 2: Count at_most_k_odds(2):
# [1] → 1 odd, count: 1
# [1,1] → 2 odds, count: 1+2 = 3
# [1,1,2] → 2 odds, count: 3+3 = 6
# [1,1,2,1] → 3 odds > 2, shrink
#   [1,2,1] → 2 odds, count: 6+3 = 9
# [1,2,1,1] → 3 odds > 2, shrink
#   [2,1,1] → 2 odds, count: 9+3 = 12
# Total: 12
#
# Step 3: exactly_k = 14 - 12 = 2
#
# Valid subarrays with exactly 3 odds:
# [1, 1, 2, 1] → has 3 odds ✓
# [1, 2, 1, 1] → has 3 odds ✓
#
# Visual representation:
# [1, 1, 2, 1, 1]
#  ▓▓▓▓▓▓▓▓▓     ← [1,1,2,1] has 3 odds
#     ▓▓▓▓▓▓▓    ← [1,2,1,1] has 3 odds
```

#### TypeScript Solution
```typescript
function numberOfSubarrays(nums: number[], k: number): number {
    // Step 1: Helper function
    const atMostKOdds = (k: number): number => {
        let left = 0;
        let oddCount = 0;
        let result = 0;

        for (let right = 0; right < nums.length; right++) {
            // Count odds
            if (nums[right] % 2 === 1) {
                oddCount++;
            }

            // Shrink window
            while (oddCount > k) {
                if (nums[left] % 2 === 1) {
                    oddCount--;
                }
                left++;
            }

            // Count subarrays
            result += right - left + 1;
        }

        return result;
    };

    // Step 2: Exactly k = at most k - at most (k-1)
    return atMostKOdds(k) - atMostKOdds(k - 1);
}
```

**Time Complexity**: O(n) - two passes through array
**Space Complexity**: O(1) - constant space

---

### Problem 21: Frequency of the Most Frequent Element
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/frequency-of-the-most-frequent-element/](https://leetcode.com/problems/frequency-of-the-most-frequent-element/)

**Description**: Find maximum frequency of an element after performing at most k increment operations.

#### Python Solution
```python
def maxFrequency(nums: List[int], k: int) -> int:
    # Step 1: Sort the array
    # Key insight: It's optimal to make all elements in window equal to max element
    nums.sort()

    # Step 2: Initialize variables
    left = 0
    total = 0  # Sum of elements in current window
    max_freq = 1

    # Step 3: Expand window with right pointer
    for right in range(len(nums)):
        # Step 4: Add current element to window
        total += nums[right]

        # Step 5: Calculate operations needed to make all elements equal to nums[right]
        # If we make all elements in [left, right] equal to nums[right]:
        # Operations needed = nums[right] * window_size - total
        window_size = right - left + 1
        operations_needed = nums[right] * window_size - total

        # Step 6: Shrink window while operations exceed k
        while operations_needed > k:
            # Remove leftmost element
            total -= nums[left]
            left += 1
            window_size = right - left + 1
            operations_needed = nums[right] * window_size - total

        # Step 7: Update max frequency
        max_freq = max(max_freq, window_size)

    return max_freq

# Visualization for nums = [1,2,4], k = 5:
#
# After sorting: [1, 2, 4]
#
# Step-by-step window analysis:
#
# right=0: window=[1], total=1
#   Make all → 1: operations = 1*1 - 1 = 0 ≤ 5 ✓
#   max_freq = 1
#
# right=1: window=[1,2], total=3
#   Make all → 2: operations = 2*2 - 3 = 1 ≤ 5 ✓
#   [1→2, 2] uses 1 operation
#   max_freq = 2
#
# right=2: window=[1,2,4], total=7
#   Make all → 4: operations = 4*3 - 7 = 5 ≤ 5 ✓
#   [1→4, 2→4, 4] uses 3+2+0 = 5 operations
#   max_freq = 3
#
# Visual transformation:
# Original: [1, 2, 4]
#            ↓  ↓  ↓  (use k=5 operations)
# Target:   [4, 4, 4]
#           +3 +2 +0 = 5 operations total ✓
#
# Maximum frequency = 3
#
# Another example: nums = [1,4,8,13], k = 5:
# Sorted: [1, 4, 8, 13]
#
# Best window: [4, 8]
# Make all → 8: operations = 8*2 - 12 = 4 ≤ 5 ✓
# Result: [8, 8] → frequency = 2
```

#### TypeScript Solution
```typescript
function maxFrequency(nums: number[], k: number): number {
    // Step 1: Sort array
    nums.sort((a, b) => a - b);

    // Step 2: Initialize
    let left = 0;
    let total = 0;
    let maxFreq = 1;

    // Step 3: Expand window
    for (let right = 0; right < nums.length; right++) {
        // Step 4: Add to total
        total += nums[right];

        // Step 5: Check operations needed
        let windowSize = right - left + 1;
        let operationsNeeded = nums[right] * windowSize - total;

        // Step 6: Shrink if needed
        while (operationsNeeded > k) {
            total -= nums[left];
            left++;
            windowSize = right - left + 1;
            operationsNeeded = nums[right] * windowSize - total;
        }

        // Step 7: Update max
        maxFreq = Math.max(maxFreq, windowSize);
    }

    return maxFreq;
}
```

**Time Complexity**: O(n log n) - dominated by sorting
**Space Complexity**: O(1) - constant space (excluding sort)

---

### Problem 22: Subarrays with K Different Integers
**Difficulty**: Hard
**LeetCode Link**: [https://leetcode.com/problems/subarrays-with-k-different-integers/](https://leetcode.com/problems/subarrays-with-k-different-integers/)

**Description**: Count subarrays with exactly K different integers.

#### Python Solution
```python
def subarraysWithKDistinct(nums: List[int], k: int) -> int:
    # Step 1: Helper function - count subarrays with at most k distinct
    def at_most_k_distinct(k: int) -> int:
        count = {}  # Frequency map
        left = 0
        result = 0

        for right in range(len(nums)):
            # Add element to window
            count[nums[right]] = count.get(nums[right], 0) + 1

            # Shrink while too many distinct
            while len(count) > k:
                count[nums[left]] -= 1
                if count[nums[left]] == 0:
                    del count[nums[left]]
                left += 1

            # Count all subarrays ending at right
            result += right - left + 1

        return result

    # Step 2: Use subtraction trick
    # Exactly k = at_most(k) - at_most(k-1)
    return at_most_k_distinct(k) - at_most_k_distinct(k - 1)

# Visualization for nums = [1,2,1,2,3], k = 2:
#
# Step 1: Count at_most_k_distinct(2):
# Index: 0  1  2  3  4
# Array: 1  2  1  2  3
#
# right=0: [1], distinct=1, count subarrays: 1
#          Subarrays: [1]
#
# right=1: [1,2], distinct=2, count subarrays: 1+2 = 3
#          Subarrays: [2], [1,2]
#
# right=2: [1,2,1], distinct=2, count subarrays: 3+3 = 6
#          Subarrays: [1], [2,1], [1,2,1]
#
# right=3: [1,2,1,2], distinct=2, count subarrays: 6+4 = 10
#          Subarrays: [2], [1,2], [2,1,2], [1,2,1,2]
#
# right=4: [1,2,1,2,3], distinct=3 > 2, shrink
#          [2,1,2,3], distinct=3 > 2, shrink
#          [1,2,3], distinct=3 > 2, shrink
#          [2,3], distinct=2, count subarrays: 10+2 = 12
# Total: 12
#
# Step 2: Count at_most_k_distinct(1):
# right=0: [1], distinct=1, count: 1
# right=1: [1,2], distinct=2 > 1, shrink → [2], count: 1+1 = 2
# right=2: [2,1], distinct=2 > 1, shrink → [1], count: 2+1 = 3
# right=3: [1,2], distinct=2 > 1, shrink → [2], count: 3+1 = 4
# right=4: [2,3], distinct=2 > 1, shrink → [3], count: 4+1 = 5
# Total: 5
#
# Step 3: exactly_k = 12 - 5 = 7
#
# Valid subarrays with exactly 2 distinct integers:
# [1,2], [2,1], [1,2], [2,1], [1,2,1], [2,1,2], [1,2,1,2]
#
# Visual pattern:
# [1, 2, 1, 2, 3]
#  ▓▓           → [1,2]
#     ▓▓        → [2,1]
#  ▓▓▓▓         → [1,2,1]
#     ▓▓▓       → [2,1,2]
#        ▓▓     → [1,2]
#  ▓▓▓▓▓▓▓      → [1,2,1,2]
#     ▓▓▓▓      → [2,1,2]
#           ▓▓  → [2,3]
```

#### TypeScript Solution
```typescript
function subarraysWithKDistinct(nums: number[], k: number): number {
    // Step 1: Helper function
    const atMostKDistinct = (k: number): number => {
        const count = new Map<number, number>();
        let left = 0;
        let result = 0;

        for (let right = 0; right < nums.length; right++) {
            // Add to window
            count.set(nums[right], (count.get(nums[right]) || 0) + 1);

            // Shrink if needed
            while (count.size > k) {
                const leftCount = count.get(nums[left])! - 1;
                if (leftCount === 0) {
                    count.delete(nums[left]);
                } else {
                    count.set(nums[left], leftCount);
                }
                left++;
            }

            // Count subarrays
            result += right - left + 1;
        }

        return result;
    };

    // Step 2: Exactly k = at most k - at most (k-1)
    return atMostKDistinct(k) - atMostKDistinct(k - 1);
}
```

**Time Complexity**: O(n) - two passes through array
**Space Complexity**: O(k) - at most k distinct integers in map

---

### Problem 23: Minimum Number of Flips to Make Binary String Alternating
**Difficulty**: Medium
**LeetCode Link**: [https://leetcode.com/problems/minimum-number-of-flips-to-make-the-binary-string-alternating/](https://leetcode.com/problems/minimum-number-of-flips-to-make-the-binary-string-alternating/)

**Description**: Find minimum flips to make string alternating. Can perform type-1 (remove first, append to end) or type-2 (flip bit) operations.

#### Python Solution
```python
def minFlips(s: str) -> int:
    # Step 1: Understand the two possible alternating patterns
    n = len(s)
    # Pattern 1: starts with '0': 010101...
    # Pattern 2: starts with '1': 101010...

    # Step 2: Create extended string to simulate rotations
    # Doubling the string simulates all possible type-1 operations
    s_extended = s + s

    # Step 3: Build target patterns
    pattern1 = ""  # 010101...
    pattern2 = ""  # 101010...
    for i in range(len(s_extended)):
        pattern1 += '0' if i % 2 == 0 else '1'
        pattern2 += '1' if i % 2 == 0 else '0'

    # Step 4: Initialize sliding window
    diff1 = 0  # Differences with pattern1
    diff2 = 0  # Differences with pattern2

    # Calculate differences for first window
    for i in range(n):
        if s_extended[i] != pattern1[i]:
            diff1 += 1
        if s_extended[i] != pattern2[i]:
            diff2 += 1

    min_flips = min(diff1, diff2)

    # Step 5: Slide window across extended string
    for i in range(n, len(s_extended)):
        # Add new character (right side)
        if s_extended[i] != pattern1[i]:
            diff1 += 1
        if s_extended[i] != pattern2[i]:
            diff2 += 1

        # Remove old character (left side)
        left = i - n
        if s_extended[left] != pattern1[left]:
            diff1 -= 1
        if s_extended[left] != pattern2[left]:
            diff2 -= 1

        # Update minimum
        min_flips = min(min_flips, diff1, diff2)

    return min_flips

# Visualization for s = "111000":
#
# Original: "111000" (length 6)
# Extended: "111000111000" (simulate rotations)
#
# Pattern1: "010101010101" (starts with 0)
# Pattern2: "101010101010" (starts with 1)
#
# Window analysis (size = 6):
#
# Window 1: "111000" vs "010101" → diff=5, vs "101010" → diff=1
#           [1≠0, 1≠1, 1≠0, 0≠1, 0≠0, 0≠1] = 4 diffs
#           [1≠1, 1≠0, 1≠1, 0≠0, 0≠1, 0≠0] = 2 diffs ← better!
#
# Window 2: "110001" (rotate 1 step) vs patterns
#           After rotation: s becomes "110001"
#           Compare and count differences...
#
# Window 3: "100011" (rotate 2 steps)
# Window 4: "000111" (rotate 3 steps)
# Window 5: "001110" (rotate 4 steps)
# Window 6: "011100" (rotate 5 steps)
#
# Minimum across all rotations and patterns = 1
#
# Visual explanation:
# Original: 1 1 1 0 0 0
# Pattern:  1 0 1 0 1 0  (need to flip 2 positions)
#             ↓   ↓   ↓
# After:    1 0 1 0 1 0  (flipped positions 1, 3, 5)
#
# But with rotation:
# Rotate 3: 0 0 0 1 1 1
# Pattern:  0 1 0 1 0 1  (need to flip 1 position)
#             ↓     ↓
# After:    0 1 0 1 1 1  (flip just position 1 → gives us 010111)
# Then flip position 4: 0 1 0 1 0 1 ✓
#
# Key insight: Try all rotations (type-1) + both patterns
```

#### TypeScript Solution
```typescript
function minFlips(s: string): number {
    // Step 1: Setup
    const n = s.length;
    const sExtended = s + s;

    // Step 2: Build patterns
    let pattern1 = "";
    let pattern2 = "";
    for (let i = 0; i < sExtended.length; i++) {
        pattern1 += i % 2 === 0 ? '0' : '1';
        pattern2 += i % 2 === 0 ? '1' : '0';
    }

    // Step 3: Calculate initial differences
    let diff1 = 0;
    let diff2 = 0;
    for (let i = 0; i < n; i++) {
        if (sExtended[i] !== pattern1[i]) diff1++;
        if (sExtended[i] !== pattern2[i]) diff2++;
    }

    let minFlips = Math.min(diff1, diff2);

    // Step 4: Slide window
    for (let i = n; i < sExtended.length; i++) {
        // Add right
        if (sExtended[i] !== pattern1[i]) diff1++;
        if (sExtended[i] !== pattern2[i]) diff2++;

        // Remove left
        const left = i - n;
        if (sExtended[left] !== pattern1[left]) diff1--;
        if (sExtended[left] !== pattern2[left]) diff2--;

        // Update minimum
        minFlips = Math.min(minFlips, diff1, diff2);
    }

    return minFlips;
}
```

**Time Complexity**: O(n) - process extended string of length 2n
**Space Complexity**: O(n) - store extended string and patterns

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
