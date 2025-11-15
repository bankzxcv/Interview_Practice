# 1.15 Dynamic Programming Patterns

## Pattern Overview

### What is Dynamic Programming?
Dynamic Programming (DP) is an optimization technique that solves complex problems by breaking them down into simpler subproblems and storing the results to avoid redundant calculations. It's the art of turning exponential brute force into polynomial time through memoization or tabulation.

### When to Use It?
- Problem has **overlapping subproblems** (same calculation repeated)
- Problem has **optimal substructure** (optimal solution contains optimal solutions to subproblems)
- Count total number of ways
- Find minimum/maximum value
- Decision making problems (pick or skip)

### Time/Space Complexity
- **Brute Force**: Often O(2^n) or O(n!)
- **DP**: Usually O(n), O(n²), or O(n³)
- **Space**: O(n) or O(n²) for memoization/table

### Visual Diagram

```
Fibonacci Without DP (Exponential):
                    fib(5)
                  /        \
              fib(4)        fib(3)
             /     \        /     \
         fib(3)  fib(2)  fib(2)  fib(1)
         /    \
     fib(2) fib(1)   ... many repeated calculations

Fibonacci With DP (Linear):
memo = {0: 0, 1: 1, 2: 1, 3: 2, 4: 3, 5: 5}
Each value calculated only once!

DP Table Example (Longest Common Subsequence):
       ""  A  B  C  D
    "" 0   0  0  0  0
    A  0   1  1  1  1
    C  0   1  1  2  2
    E  0   1  1  2  2
```

---

## Recognition Guidelines

### How to Identify DP Problems?
Look for these keywords:
- "Find the **maximum/minimum**..."
- "Count the **number of ways**..."
- "Is it **possible** to reach..."
- "What's the **longest/shortest**..."
- "**Optimize** some value"
- Problems involving sequences, strings, paths

### Key Indicators:
1. **Optimal solution** required (not just any solution)
2. **Choices** at each step affecting future choices
3. **Overlapping subproblems** - solving same thing multiple times
4. Can be solved with recursion but times out
5. Input size suggests polynomial solution exists

---

## Common DP Patterns

### 1. Linear DP (1D)
- State depends on previous elements
- Examples: Fibonacci, climbing stairs, house robber
- Template: `dp[i] = f(dp[i-1], dp[i-2], ...)`

### 2. 2D Grid DP
- State depends on two parameters
- Examples: Unique paths, edit distance, LCS
- Template: `dp[i][j] = f(dp[i-1][j], dp[i][j-1], ...)`

### 3. Knapsack DP
- Include/exclude decisions
- Examples: 0/1 knapsack, subset sum, partition
- Template: `dp[i][w] = max(include, exclude)`

### 4. Subsequence DP
- Build optimal subsequence
- Examples: LIS, LCS, palindrome subsequence
- Template: Match or skip characters

### 5. Interval DP
- Solve for all intervals [i, j]
- Examples: Palindrome partitioning, burst balloons
- Template: Try all split points

---

## Template/Pseudocode

### Top-Down (Memoization)
```python
def dp_problem(n):
    memo = {}

    def dp(state):
        # Base case
        if base_condition:
            return base_value

        # Check memo
        if state in memo:
            return memo[state]

        # Recurrence relation
        result = some_function(
            dp(next_state_1),
            dp(next_state_2),
            ...
        )

        # Store in memo
        memo[state] = result
        return result

    return dp(initial_state)
```

### Bottom-Up (Tabulation)
```python
def dp_problem(n):
    # Initialize DP table
    dp = [base_value] * (n + 1)

    # Fill base cases
    dp[0] = base_value_0
    dp[1] = base_value_1

    # Fill table using recurrence
    for i in range(2, n + 1):
        dp[i] = some_function(dp[i-1], dp[i-2], ...)

    return dp[n]
```

---

## Problems

### 1. Climbing Stairs (Easy)
**LeetCode**: https://leetcode.com/problems/climbing-stairs/

**Description**: You can climb 1 or 2 steps at a time. How many distinct ways can you climb to the top of n stairs?

**State Transition**:
```
dp[i] = number of ways to reach step i
dp[i] = dp[i-1] + dp[i-2]

Visualization (n=5):
Step 0: 1 way (start)
Step 1: 1 way (one 1-step)
Step 2: 2 ways (1+1, or 2)
Step 3: 3 ways (1+1+1, 1+2, 2+1)
Step 4: 5 ways
Step 5: 8 ways
```

**Python Solution (Top-Down)**:
```python
def climbStairs(n: int) -> int:
    """
    Memoization approach: solve recursively with caching.
    """
    memo = {}

    def dp(i):
        # Step 1: Base cases
        if i <= 1:
            return 1

        # Step 2: Check memo
        if i in memo:
            return memo[i]

        # Step 3: Recurrence - can come from step i-1 or i-2
        memo[i] = dp(i - 1) + dp(i - 2)

        return memo[i]

    return dp(n)
```

**Python Solution (Bottom-Up)**:
```python
def climbStairs(n: int) -> int:
    """
    Tabulation approach: build solution from bottom up.
    """
    # Step 1: Handle base cases
    if n <= 1:
        return 1

    # Step 2: Initialize DP array
    dp = [0] * (n + 1)
    dp[0] = 1  # One way to stay at ground
    dp[1] = 1  # One way to reach step 1

    # Step 3: Fill table
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]

    return dp[n]
```

**Space Optimized**:
```python
def climbStairs(n: int) -> int:
    """
    Only need last 2 values, not entire array.
    """
    if n <= 1:
        return 1

    # Step 1: Track only last two values
    prev2, prev1 = 1, 1

    # Step 2: Compute each step
    for i in range(2, n + 1):
        current = prev1 + prev2
        prev2 = prev1
        prev1 = current

    return prev1
```

**TypeScript Solution**:
```typescript
function climbStairs(n: number): number {
    // Step 1: Handle base cases
    if (n <= 1) return 1;

    // Step 2: Space-optimized approach
    let prev2 = 1, prev1 = 1;

    // Step 3: Build solution iteratively
    for (let i = 2; i <= n; i++) {
        const current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }

    return prev1;
}
```

**Complexity**:
- Time: O(n)
- Space: O(1) optimized, O(n) for tabulation

---

### 2. House Robber (Medium)
**LeetCode**: https://leetcode.com/problems/house-robber/

**Description**: Rob houses along a street (each with money). Cannot rob two adjacent houses. Maximize money robbed.

**State Transition**:
```
dp[i] = max money robbing houses 0..i
dp[i] = max(
    rob house i + dp[i-2],  // rob current, skip previous
    dp[i-1]                  // skip current
)

Example: [2, 7, 9, 3, 1]
House:    0  1  2  3  4
Money:    2  7  9  3  1
dp[i]:    2  7  11 11 12

At house 2: max(rob 2+7=9, skip 2=7) = 11
At house 4: max(rob 1+11=12, skip 4=11) = 12
```

**Python Solution (Top-Down)**:
```python
def rob(nums: list[int]) -> int:
    """
    Memoization: choose to rob or skip each house.
    """
    memo = {}

    def dp(i):
        # Step 1: No houses left
        if i < 0:
            return 0

        # Step 2: Check cache
        if i in memo:
            return memo[i]

        # Step 3: Choose max of rob or skip current house
        rob_current = nums[i] + dp(i - 2)
        skip_current = dp(i - 1)

        memo[i] = max(rob_current, skip_current)
        return memo[i]

    return dp(len(nums) - 1)
```

**Python Solution (Bottom-Up)**:
```python
def rob(nums: list[int]) -> int:
    """
    Tabulation: build from first house to last.
    """
    if not nums:
        return 0
    if len(nums) == 1:
        return nums[0]

    # Step 1: Initialize DP table
    n = len(nums)
    dp = [0] * n
    dp[0] = nums[0]
    dp[1] = max(nums[0], nums[1])

    # Step 2: Fill table
    for i in range(2, n):
        # Rob current house + max from 2 houses before
        # OR skip current house
        dp[i] = max(nums[i] + dp[i-2], dp[i-1])

    return dp[n-1]
```

**Space Optimized**:
```python
def rob(nums: list[int]) -> int:
    """
    Only need last 2 values.
    """
    prev2, prev1 = 0, 0

    for num in nums:
        # Step 1: Max of rob current or skip
        current = max(num + prev2, prev1)
        prev2 = prev1
        prev1 = current

    return prev1
```

**TypeScript Solution**:
```typescript
function rob(nums: number[]): number {
    // Step 1: Track previous two max values
    let prev2 = 0, prev1 = 0;

    // Step 2: Process each house
    for (const num of nums) {
        const current = Math.max(num + prev2, prev1);
        prev2 = prev1;
        prev1 = current;
    }

    return prev1;
}
```

**Complexity**:
- Time: O(n)
- Space: O(1)

---

### 3. Coin Change (Medium)
**LeetCode**: https://leetcode.com/problems/coin-change/

**Description**: Given coins of different denominations and a total amount, find the minimum number of coins needed to make that amount. Return -1 if impossible.

**State Transition**:
```
dp[i] = min coins needed to make amount i
dp[i] = min(dp[i - coin] + 1) for all coins

Example: coins=[1,2,5], amount=11
Amount: 0  1  2  3  4  5  6  7  8  9  10 11
dp[i]:  0  1  1  2  2  1  2  2  3  3  2  3

dp[11] = min(
    dp[11-1] + 1 = dp[10] + 1 = 3,
    dp[11-2] + 1 = dp[9] + 1 = 4,
    dp[11-5] + 1 = dp[6] + 1 = 3
) = 3 coins (5+5+1)
```

**Python Solution (Top-Down)**:
```python
def coinChange(coins: list[int], amount: int) -> int:
    """
    Memoization: try each coin and take minimum.
    """
    memo = {}

    def dp(remaining):
        # Step 1: Base cases
        if remaining == 0:
            return 0
        if remaining < 0:
            return float('inf')

        # Step 2: Check memo
        if remaining in memo:
            return memo[remaining]

        # Step 3: Try each coin, take minimum
        min_coins = float('inf')
        for coin in coins:
            result = dp(remaining - coin)
            if result != float('inf'):
                min_coins = min(min_coins, result + 1)

        memo[remaining] = min_coins
        return min_coins

    result = dp(amount)
    return result if result != float('inf') else -1
```

**Python Solution (Bottom-Up)**:
```python
def coinChange(coins: list[int], amount: int) -> int:
    """
    Tabulation: build solutions for amounts 0 to target.
    """
    # Step 1: Initialize DP array
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0  # 0 coins needed for amount 0

    # Step 2: For each amount
    for amt in range(1, amount + 1):
        # Step 3: Try each coin
        for coin in coins:
            if coin <= amt:
                # Step 4: Update minimum
                dp[amt] = min(dp[amt], dp[amt - coin] + 1)

    # Step 5: Return result
    return dp[amount] if dp[amount] != float('inf') else -1
```

**TypeScript Solution**:
```typescript
function coinChange(coins: number[], amount: number): number {
    // Step 1: Initialize DP table
    const dp = Array(amount + 1).fill(Infinity);
    dp[0] = 0;

    // Step 2: Build table for each amount
    for (let amt = 1; amt <= amount; amt++) {
        // Step 3: Try using each coin
        for (const coin of coins) {
            if (coin <= amt) {
                dp[amt] = Math.min(dp[amt], dp[amt - coin] + 1);
            }
        }
    }

    // Step 4: Return result
    return dp[amount] === Infinity ? -1 : dp[amount];
}
```

**Complexity**:
- Time: O(amount × coins)
- Space: O(amount)

---

### 4. Longest Increasing Subsequence (Medium)
**LeetCode**: https://leetcode.com/problems/longest-increasing-subsequence/

**Description**: Find the length of the longest strictly increasing subsequence in an array.

**State Transition**:
```
dp[i] = length of LIS ending at index i
dp[i] = max(dp[j] + 1) for all j < i where nums[j] < nums[i]

Example: [10, 9, 2, 5, 3, 7, 101, 18]
Index:    0   1  2  3  4  5   6    7
dp[i]:    1   1  1  2  2  3   4    4

At index 5 (val=7):
  Check all j < 5 where nums[j] < 7:
  j=2 (val=2): dp[2]=1, so dp[5] = max(dp[5], 1+1=2)
  j=3 (val=5): dp[3]=2, so dp[5] = max(2, 2+1=3)
  j=4 (val=3): dp[4]=2, so dp[5] = max(3, 2+1=3)
Result: max(dp) = 4 ([2,5,7,101] or [2,3,7,18])
```

**Python Solution (DP - O(n²))**:
```python
def lengthOfLIS(nums: list[int]) -> int:
    """
    DP approach: dp[i] = LIS length ending at i.
    """
    if not nums:
        return 0

    n = len(nums)
    # Step 1: Each element is a subsequence of length 1
    dp = [1] * n

    # Step 2: For each position
    for i in range(1, n):
        # Step 3: Check all previous elements
        for j in range(i):
            # Step 4: If can extend subsequence ending at j
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)

    # Step 5: Return maximum length found
    return max(dp)
```

**Python Solution (Binary Search - O(n log n))**:
```python
def lengthOfLIS(nums: list[int]) -> int:
    """
    Maintain array of smallest tail elements for each length.
    Use binary search to find position.
    """
    # Step 1: tails[i] = smallest tail of LIS with length i+1
    tails = []

    for num in nums:
        # Step 2: Binary search for position
        left, right = 0, len(tails)
        while left < right:
            mid = (left + right) // 2
            if tails[mid] < num:
                left = mid + 1
            else:
                right = mid

        # Step 3: Extend or replace
        if left == len(tails):
            tails.append(num)
        else:
            tails[left] = num

    return len(tails)
```

**TypeScript Solution**:
```typescript
function lengthOfLIS(nums: number[]): number {
    const n = nums.length;
    if (n === 0) return 0;

    // Step 1: Initialize DP array
    const dp = Array(n).fill(1);

    // Step 2: Build DP table
    for (let i = 1; i < n; i++) {
        for (let j = 0; j < i; j++) {
            // Step 3: Extend subsequence if possible
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
    }

    // Step 4: Find maximum
    return Math.max(...dp);
}
```

**Complexity**:
- Time: O(n²) DP, O(n log n) with binary search
- Space: O(n)

---

### 5. Unique Paths (Medium)
**LeetCode**: https://leetcode.com/problems/unique-paths/

**Description**: Robot in m×n grid starting at top-left. Can only move right or down. How many unique paths to bottom-right?

**State Transition**:
```
dp[i][j] = number of paths to cell (i,j)
dp[i][j] = dp[i-1][j] + dp[i][j-1]

Example: 3x7 grid
    0  1  2  3  4  5  6
0   1  1  1  1  1  1  1
1   1  2  3  4  5  6  7
2   1  3  6  10 15 21 28

Each cell = sum of cell above + cell to left
```

**Python Solution (2D DP)**:
```python
def uniquePaths(m: int, n: int) -> int:
    """
    2D DP: paths to each cell = paths from top + paths from left.
    """
    # Step 1: Initialize DP table
    dp = [[0] * n for _ in range(m)]

    # Step 2: First row and column have only 1 path
    for i in range(m):
        dp[i][0] = 1
    for j in range(n):
        dp[0][j] = 1

    # Step 3: Fill remaining cells
    for i in range(1, m):
        for j in range(1, n):
            # Paths from top + paths from left
            dp[i][j] = dp[i-1][j] + dp[i][j-1]

    return dp[m-1][n-1]
```

**Space Optimized (1D DP)**:
```python
def uniquePaths(m: int, n: int) -> int:
    """
    Only need current row, not entire grid.
    """
    # Step 1: Initialize single row
    dp = [1] * n

    # Step 2: Process each row
    for i in range(1, m):
        for j in range(1, n):
            # Step 3: Current cell = cell above (dp[j]) + cell left (dp[j-1])
            dp[j] = dp[j] + dp[j-1]

    return dp[n-1]
```

**TypeScript Solution**:
```typescript
function uniquePaths(m: number, n: number): number {
    // Step 1: Space-optimized 1D array
    const dp = Array(n).fill(1);

    // Step 2: Process each row
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            // Step 3: Add paths from left
            dp[j] += dp[j - 1];
        }
    }

    return dp[n - 1];
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(n) optimized, O(m × n) for 2D

---

### 6. Longest Common Subsequence (Medium)
**LeetCode**: https://leetcode.com/problems/longest-common-subsequence/

**Description**: Find the length of longest common subsequence of two strings.

**State Transition**:
```
dp[i][j] = LCS length for text1[0..i-1] and text2[0..j-1]

If text1[i-1] == text2[j-1]:
    dp[i][j] = dp[i-1][j-1] + 1
Else:
    dp[i][j] = max(dp[i-1][j], dp[i][j-1])

Example: text1="abcde", text2="ace"
       ""  a  c  e
    "" 0   0  0  0
    a  0   1  1  1
    b  0   1  1  1
    c  0   1  2  2
    d  0   1  2  2
    e  0   1  2  3

Result: 3 ("ace")
```

**Python Solution (Top-Down)**:
```python
def longestCommonSubsequence(text1: str, text2: str) -> int:
    """
    Memoization: compare character by character.
    """
    memo = {}

    def dp(i, j):
        # Step 1: One string exhausted
        if i < 0 or j < 0:
            return 0

        # Step 2: Check memo
        if (i, j) in memo:
            return memo[(i, j)]

        # Step 3: Characters match
        if text1[i] == text2[j]:
            result = dp(i - 1, j - 1) + 1
        else:
            # Step 4: Take max of skipping either character
            result = max(dp(i - 1, j), dp(i, j - 1))

        memo[(i, j)] = result
        return result

    return dp(len(text1) - 1, len(text2) - 1)
```

**Python Solution (Bottom-Up)**:
```python
def longestCommonSubsequence(text1: str, text2: str) -> int:
    """
    Tabulation: build 2D DP table.
    """
    m, n = len(text1), len(text2)

    # Step 1: Initialize DP table (with padding)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    # Step 2: Fill table
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            # Step 3: Characters match
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                # Step 4: Take max
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])

    return dp[m][n]
```

**TypeScript Solution**:
```typescript
function longestCommonSubsequence(text1: string, text2: string): number {
    const m = text1.length;
    const n = text2.length;

    // Step 1: Create DP table
    const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    // Step 2: Build table
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                // Step 3: Match found
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                // Step 4: No match
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    return dp[m][n];
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n), can optimize to O(min(m,n))

---

### 7. Edit Distance (Hard)
**LeetCode**: https://leetcode.com/problems/edit-distance/

**Description**: Given two strings, find minimum number of operations (insert, delete, replace) to convert one to other.

**State Transition**:
```
dp[i][j] = min operations to convert word1[0..i-1] to word2[0..j-1]

If word1[i-1] == word2[j-1]:
    dp[i][j] = dp[i-1][j-1]  // No operation needed
Else:
    dp[i][j] = 1 + min(
        dp[i-1][j],     // Delete from word1
        dp[i][j-1],     // Insert into word1
        dp[i-1][j-1]    // Replace
    )

Example: word1="horse", word2="ros"
       ""  r  o  s
    "" 0   1  2  3
    h  1   1  2  3
    o  2   2  1  2
    r  3   2  2  2
    s  4   3  3  2
    e  5   4  4  3

Result: 3 (replace h→r, remove r, remove e)
```

**Python Solution**:
```python
def minDistance(word1: str, word2: str) -> int:
    """
    DP table: try insert, delete, or replace.
    """
    m, n = len(word1), len(word2)

    # Step 1: Initialize DP table
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    # Step 2: Base cases - convert to/from empty string
    for i in range(m + 1):
        dp[i][0] = i  # Delete all characters
    for j in range(n + 1):
        dp[0][j] = j  # Insert all characters

    # Step 3: Fill table
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            # Step 4: Characters match - no operation
            if word1[i-1] == word2[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                # Step 5: Take minimum of three operations
                dp[i][j] = 1 + min(
                    dp[i-1][j],      # Delete
                    dp[i][j-1],      # Insert
                    dp[i-1][j-1]     # Replace
                )

    return dp[m][n]
```

**TypeScript Solution**:
```typescript
function minDistance(word1: string, word2: string): number {
    const m = word1.length;
    const n = word2.length;

    // Step 1: Create DP table
    const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    // Step 2: Initialize base cases
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Step 3: Fill table
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (word1[i - 1] === word2[j - 1]) {
                // Step 4: No change needed
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                // Step 5: Min of insert, delete, replace
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1]
                );
            }
        }
    }

    return dp[m][n];
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n)

---

### 8. 0/1 Knapsack (Classic DP)
**LeetCode**: https://leetcode.com/problems/partition-equal-subset-sum/ (variation)

**Description**: Given items with weights and values, and a knapsack capacity, maximize total value without exceeding capacity. Each item can be used at most once.

**State Transition**:
```
dp[i][w] = max value using items 0..i-1 with capacity w

For each item i with weight w[i] and value v[i]:
    dp[i][w] = max(
        dp[i-1][w],              // Don't include item i
        dp[i-1][w-w[i]] + v[i]   // Include item i
    )

Example: values=[60,100,120], weights=[10,20,30], capacity=50
        0   10  20  30  40  50
    0   0   0   0   0   0   0
    1   0   60  60  60  60  60   (item 0: w=10, v=60)
    2   0   60  100 160 160 160  (item 1: w=20, v=100)
    3   0   60  100 160 180 220  (item 2: w=30, v=120)

Result: 220 (items 1 and 2)
```

**Python Solution (2D DP)**:
```python
def knapsack(weights: list[int], values: list[int], capacity: int) -> int:
    """
    Classic 0/1 knapsack using 2D DP.
    """
    n = len(weights)

    # Step 1: Initialize DP table
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    # Step 2: Fill table
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            # Step 3: Can't include item (too heavy)
            if weights[i-1] > w:
                dp[i][w] = dp[i-1][w]
            else:
                # Step 4: Choose max of include or exclude
                include = dp[i-1][w - weights[i-1]] + values[i-1]
                exclude = dp[i-1][w]
                dp[i][w] = max(include, exclude)

    return dp[n][capacity]
```

**Space Optimized (1D DP)**:
```python
def knapsack(weights: list[int], values: list[int], capacity: int) -> int:
    """
    1D DP - iterate backwards to avoid overwriting needed values.
    """
    # Step 1: Initialize DP array
    dp = [0] * (capacity + 1)

    # Step 2: Process each item
    for i in range(len(weights)):
        # Step 3: Iterate backwards to preserve previous row
        for w in range(capacity, weights[i] - 1, -1):
            # Step 4: Choose max
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])

    return dp[capacity]
```

**TypeScript Solution**:
```typescript
function knapsack(weights: number[], values: number[], capacity: number): number {
    // Step 1: 1D DP array
    const dp = Array(capacity + 1).fill(0);

    // Step 2: Process each item
    for (let i = 0; i < weights.length; i++) {
        // Step 3: Backwards iteration
        for (let w = capacity; w >= weights[i]; w--) {
            // Step 4: Take max
            dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }

    return dp[capacity];
}
```

**Complexity**:
- Time: O(n × capacity)
- Space: O(capacity)

---

### 9. Partition Equal Subset Sum (Medium)
**LeetCode**: https://leetcode.com/problems/partition-equal-subset-sum/

**Description**: Determine if array can be partitioned into two subsets with equal sum.

**Python Solution**:
```python
def canPartition(nums: list[int]) -> bool:
    """
    If total sum is odd, impossible.
    Otherwise, it's a knapsack problem: can we make sum/2?
    """
    total = sum(nums)

    # Step 1: Odd sum can't be split equally
    if total % 2 != 0:
        return False

    target = total // 2

    # Step 2: DP set - track all possible sums
    dp = {0}  # Can always make sum 0

    for num in nums:
        # Step 3: For each existing sum, try adding current number
        # Use list to avoid modifying set during iteration
        new_sums = set()
        for s in dp:
            new_sum = s + num
            if new_sum == target:
                return True
            new_sums.add(new_sum)

        # Step 4: Add new sums to dp
        dp.update(new_sums)

    return target in dp
```

**Alternative with boolean array**:
```python
def canPartition(nums: list[int]) -> bool:
    """
    Boolean DP: dp[i] = True if sum i is achievable.
    """
    total = sum(nums)
    if total % 2 != 0:
        return False

    target = total // 2

    # Step 1: Initialize DP array
    dp = [False] * (target + 1)
    dp[0] = True  # Sum 0 is always possible

    # Step 2: Process each number
    for num in nums:
        # Step 3: Update backwards to avoid using same element twice
        for s in range(target, num - 1, -1):
            dp[s] = dp[s] or dp[s - num]

    return dp[target]
```

**TypeScript Solution**:
```typescript
function canPartition(nums: number[]): boolean {
    const total = nums.reduce((a, b) => a + b, 0);

    // Step 1: Odd sum check
    if (total % 2 !== 0) return false;

    const target = total / 2;

    // Step 2: DP array
    const dp = Array(target + 1).fill(false);
    dp[0] = true;

    // Step 3: Process each number
    for (const num of nums) {
        // Step 4: Backwards iteration
        for (let s = target; s >= num; s--) {
            dp[s] = dp[s] || dp[s - num];
        }
    }

    return dp[target];
}
```

**Complexity**:
- Time: O(n × sum/2)
- Space: O(sum/2)

---

### 10. Word Break (Medium)
**LeetCode**: https://leetcode.com/problems/word-break/

**Description**: Given a string and a dictionary, determine if the string can be segmented into dictionary words.

**Python Solution (Top-Down)**:
```python
def wordBreak(s: str, wordDict: list[str]) -> bool:
    """
    Memoization: try breaking at each position.
    """
    word_set = set(wordDict)
    memo = {}

    def dp(start):
        # Step 1: Reached end successfully
        if start == len(s):
            return True

        # Step 2: Check memo
        if start in memo:
            return memo[start]

        # Step 3: Try all possible words starting at current position
        for end in range(start + 1, len(s) + 1):
            word = s[start:end]
            # Step 4: If word exists and rest can be broken
            if word in word_set and dp(end):
                memo[start] = True
                return True

        memo[start] = False
        return False

    return dp(0)
```

**Python Solution (Bottom-Up)**:
```python
def wordBreak(s: str, wordDict: list[str]) -> bool:
    """
    DP array: dp[i] = True if s[0:i] can be segmented.
    """
    word_set = set(wordDict)
    n = len(s)

    # Step 1: Initialize DP array
    dp = [False] * (n + 1)
    dp[0] = True  # Empty string

    # Step 2: For each position
    for i in range(1, n + 1):
        # Step 3: Try all possible last words
        for j in range(i):
            # Step 4: If prefix can be broken and current word exists
            if dp[j] and s[j:i] in word_set:
                dp[i] = True
                break

    return dp[n]
```

**TypeScript Solution**:
```typescript
function wordBreak(s: string, wordDict: string[]): boolean {
    const wordSet = new Set(wordDict);
    const n = s.length;

    // Step 1: Initialize DP
    const dp = Array(n + 1).fill(false);
    dp[0] = true;

    // Step 2: Build table
    for (let i = 1; i <= n; i++) {
        // Step 3: Check all split points
        for (let j = 0; j < i; j++) {
            const word = s.slice(j, i);
            // Step 4: Valid break found
            if (dp[j] && wordSet.has(word)) {
                dp[i] = true;
                break;
            }
        }
    }

    return dp[n];
}
```

**Complexity**:
- Time: O(n² × m) where m is average word length
- Space: O(n)

---

### 11. Decode Ways (Medium)
**LeetCode**: https://leetcode.com/problems/decode-ways/

**Description**: A message containing letters A-Z is encoded to numbers (A=1, B=2,..., Z=26). Count number of ways to decode a given digit string.

**Python Solution**:
```python
def numDecodings(s: str) -> int:
    """
    DP: At each position, can decode 1 digit or 2 digits.
    """
    if not s or s[0] == '0':
        return 0

    n = len(s)
    # Step 1: dp[i] = number of ways to decode s[0:i]
    dp = [0] * (n + 1)
    dp[0] = 1  # Empty string
    dp[1] = 1  # First character (already validated)

    # Step 2: Process each position
    for i in range(2, n + 1):
        # Step 3: Decode as single digit
        one_digit = int(s[i-1:i])
        if one_digit >= 1 and one_digit <= 9:
            dp[i] += dp[i-1]

        # Step 4: Decode as two digits
        two_digits = int(s[i-2:i])
        if two_digits >= 10 and two_digits <= 26:
            dp[i] += dp[i-2]

    return dp[n]
```

**Space Optimized**:
```python
def numDecodings(s: str) -> int:
    """
    Only need last two values.
    """
    if not s or s[0] == '0':
        return 0

    # Step 1: Track previous two values
    prev2, prev1 = 1, 1

    # Step 2: Process each character
    for i in range(1, len(s)):
        current = 0

        # Step 3: Single digit decode
        if s[i] != '0':
            current += prev1

        # Step 4: Two digit decode
        two_digit = int(s[i-1:i+1])
        if 10 <= two_digit <= 26:
            current += prev2

        # Step 5: Update for next iteration
        prev2, prev1 = prev1, current

    return prev1
```

**TypeScript Solution**:
```typescript
function numDecodings(s: string): number {
    if (!s || s[0] === '0') return 0;

    // Step 1: Space-optimized variables
    let prev2 = 1, prev1 = 1;

    // Step 2: Process string
    for (let i = 1; i < s.length; i++) {
        let current = 0;

        // Step 3: Single digit
        if (s[i] !== '0') {
            current += prev1;
        }

        // Step 4: Two digits
        const twoDigit = parseInt(s.slice(i - 1, i + 1));
        if (twoDigit >= 10 && twoDigit <= 26) {
            current += prev2;
        }

        // Step 5: Shift values
        [prev2, prev1] = [prev1, current];
    }

    return prev1;
}
```

**Complexity**:
- Time: O(n)
- Space: O(1)

---

### 12. Maximum Product Subarray (Medium)
**LeetCode**: https://leetcode.com/problems/maximum-product-subarray/

**Description**: Find the contiguous subarray with the largest product.

**Python Solution**:
```python
def maxProduct(nums: list[int]) -> int:
    """
    Track both max and min (negative × negative = positive).
    """
    if not nums:
        return 0

    # Step 1: Initialize with first element
    max_so_far = min_so_far = result = nums[0]

    # Step 2: Process remaining elements
    for i in range(1, len(nums)):
        num = nums[i]

        # Step 3: If negative, swap max and min
        if num < 0:
            max_so_far, min_so_far = min_so_far, max_so_far

        # Step 4: Update max and min products ending here
        max_so_far = max(num, max_so_far * num)
        min_so_far = min(num, min_so_far * num)

        # Step 5: Update global maximum
        result = max(result, max_so_far)

    return result
```

**TypeScript Solution**:
```typescript
function maxProduct(nums: number[]): number {
    if (nums.length === 0) return 0;

    // Step 1: Initialize
    let maxSoFar = nums[0];
    let minSoFar = nums[0];
    let result = nums[0];

    // Step 2: Iterate through array
    for (let i = 1; i < nums.length; i++) {
        const num = nums[i];

        // Step 3: Swap if negative
        if (num < 0) {
            [maxSoFar, minSoFar] = [minSoFar, maxSoFar];
        }

        // Step 4: Update max and min
        maxSoFar = Math.max(num, maxSoFar * num);
        minSoFar = Math.min(num, minSoFar * num);

        // Step 5: Update result
        result = Math.max(result, maxSoFar);
    }

    return result;
}
```

**Complexity**:
- Time: O(n)
- Space: O(1)

---

### 13. Longest Palindromic Substring (Medium)
**LeetCode**: https://leetcode.com/problems/longest-palindromic-substring/

**Description**: Find the longest palindromic substring.

**Python Solution (DP)**:
```python
def longestPalindrome(s: str) -> str:
    """
    DP: dp[i][j] = True if s[i:j+1] is palindrome.
    """
    n = len(s)
    if n < 2:
        return s

    # Step 1: Initialize DP table
    dp = [[False] * n for _ in range(n)]

    start, max_len = 0, 1

    # Step 2: All single characters are palindromes
    for i in range(n):
        dp[i][i] = True

    # Step 3: Check for length 2
    for i in range(n - 1):
        if s[i] == s[i + 1]:
            dp[i][i + 1] = True
            start = i
            max_len = 2

    # Step 4: Check for lengths 3 to n
    for length in range(3, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1

            # Step 5: Check if palindrome
            if s[i] == s[j] and dp[i + 1][j - 1]:
                dp[i][j] = True
                start = i
                max_len = length

    return s[start:start + max_len]
```

**Python Solution (Expand Around Center)**:
```python
def longestPalindrome(s: str) -> str:
    """
    Expand around each possible center.
    """
    def expand(left, right):
        # Step 1: Expand while palindrome
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        # Step 2: Return length of palindrome
        return right - left - 1

    start, max_len = 0, 0

    # Step 3: Try each center
    for i in range(len(s)):
        # Step 4: Odd length palindrome (single center)
        len1 = expand(i, i)

        # Step 5: Even length palindrome (two centers)
        len2 = expand(i, i + 1)

        # Step 6: Take maximum
        length = max(len1, len2)

        # Step 7: Update if longer palindrome found
        if length > max_len:
            max_len = length
            start = i - (length - 1) // 2

    return s[start:start + max_len]
```

**TypeScript Solution**:
```typescript
function longestPalindrome(s: string): string {
    function expand(left: number, right: number): number {
        // Step 1: Expand outward
        while (left >= 0 && right < s.length && s[left] === s[right]) {
            left--;
            right++;
        }
        return right - left - 1;
    }

    let start = 0, maxLen = 0;

    // Step 2: Check each center
    for (let i = 0; i < s.length; i++) {
        const len1 = expand(i, i);       // Odd length
        const len2 = expand(i, i + 1);   // Even length
        const len = Math.max(len1, len2);

        // Step 3: Update if longer
        if (len > maxLen) {
            maxLen = len;
            start = i - Math.floor((len - 1) / 2);
        }
    }

    return s.slice(start, start + maxLen);
}
```

**Complexity**:
- Time: O(n²)
- Space: O(1) for expand, O(n²) for DP

---

### 14. Minimum Path Sum (Medium)
**LeetCode**: https://leetcode.com/problems/minimum-path-sum/

**Description**: Find a path from top-left to bottom-right in a grid that minimizes the sum of numbers along the path. Can only move right or down.

**Python Solution**:
```python
def minPathSum(grid: list[list[int]]) -> int:
    """
    DP: min path to each cell = cell value + min of top or left.
    """
    if not grid or not grid[0]:
        return 0

    m, n = len(grid), len(grid[0])

    # Step 1: Initialize DP table (can modify in-place to save space)
    dp = [[0] * n for _ in range(m)]
    dp[0][0] = grid[0][0]

    # Step 2: Fill first row (can only come from left)
    for j in range(1, n):
        dp[0][j] = dp[0][j-1] + grid[0][j]

    # Step 3: Fill first column (can only come from top)
    for i in range(1, m):
        dp[i][0] = dp[i-1][0] + grid[i][0]

    # Step 4: Fill remaining cells
    for i in range(1, m):
        for j in range(1, n):
            # Step 5: Take minimum of coming from top or left
            dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])

    return dp[m-1][n-1]
```

**Space Optimized (In-place)**:
```python
def minPathSum(grid: list[list[int]]) -> int:
    """
    Modify grid in-place to save space.
    """
    m, n = len(grid), len(grid[0])

    # Step 1: Fill first row
    for j in range(1, n):
        grid[0][j] += grid[0][j-1]

    # Step 2: Fill first column
    for i in range(1, m):
        grid[i][0] += grid[i-1][0]

    # Step 3: Fill rest
    for i in range(1, m):
        for j in range(1, n):
            grid[i][j] += min(grid[i-1][j], grid[i][j-1])

    return grid[m-1][n-1]
```

**TypeScript Solution**:
```typescript
function minPathSum(grid: number[][]): number {
    const m = grid.length;
    const n = grid[0].length;

    // Step 1: Process first row
    for (let j = 1; j < n; j++) {
        grid[0][j] += grid[0][j - 1];
    }

    // Step 2: Process first column
    for (let i = 1; i < m; i++) {
        grid[i][0] += grid[i - 1][0];
    }

    // Step 3: Process remaining cells
    for (let i = 1; i < m; i++) {
        for (let j = 1; j < n; j++) {
            grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]);
        }
    }

    return grid[m - 1][n - 1];
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(1) if modifying in-place

---

### 15. Burst Balloons (Hard)
**LeetCode**: https://leetcode.com/problems/burst-balloons/

**Description**: Given n balloons with coins on them, burst balloons to collect maximum coins. When you burst balloon i, you get `nums[i-1] * nums[i] * nums[i+1]` coins.

**Python Solution**:
```python
def maxCoins(nums: list[int]) -> int:
    """
    Interval DP: Think backwards - which balloon to burst LAST in range.
    Add padding balloons with value 1.
    """
    # Step 1: Add padding
    nums = [1] + nums + [1]
    n = len(nums)

    # Step 2: dp[i][j] = max coins from bursting balloons (i, j) exclusive
    dp = [[0] * n for _ in range(n)]

    # Step 3: Try all interval lengths
    for length in range(2, n):
        # Step 4: Try all starting positions
        for left in range(n - length):
            right = left + length

            # Step 5: Try each balloon as the last one to burst
            for k in range(left + 1, right):
                # Coins from bursting k last in range (left, right)
                coins = nums[left] * nums[k] * nums[right]
                # Plus coins from left and right subproblems
                total = coins + dp[left][k] + dp[k][right]
                dp[left][right] = max(dp[left][right], total)

    return dp[0][n-1]
```

**TypeScript Solution**:
```typescript
function maxCoins(nums: number[]): number {
    // Step 1: Add boundary balloons
    const arr = [1, ...nums, 1];
    const n = arr.length;

    // Step 2: DP table
    const dp: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    // Step 3: Process intervals of increasing length
    for (let len = 2; len < n; len++) {
        for (let left = 0; left < n - len; left++) {
            const right = left + len;

            // Step 4: Try bursting each balloon last
            for (let k = left + 1; k < right; k++) {
                const coins = arr[left] * arr[k] * arr[right];
                const total = coins + dp[left][k] + dp[k][right];
                dp[left][right] = Math.max(dp[left][right], total);
            }
        }
    }

    return dp[0][n - 1];
}
```

**Complexity**:
- Time: O(n³)
- Space: O(n²)

---

## DP Pattern Summary

### Linear DP (1D State)
- **Pattern**: `dp[i]` depends on `dp[i-1]`, `dp[i-2]`, etc.
- **Examples**: Fibonacci, Climbing Stairs, House Robber
- **Template**: Build from base case forward

### 2D Grid DP
- **Pattern**: `dp[i][j]` depends on neighbors
- **Examples**: Unique Paths, Min Path Sum
- **Template**: Fill row by row or column by column

### Knapsack DP
- **Pattern**: Include/exclude decisions
- **Examples**: 0/1 Knapsack, Subset Sum, Partition
- **Template**: Iterate items, update capacities backwards

### Subsequence DP
- **Pattern**: Match or skip characters/elements
- **Examples**: LCS, LIS, Edit Distance
- **Template**: Compare characters, take max/min

### Interval DP
- **Pattern**: Solve for all intervals [i, j]
- **Examples**: Burst Balloons, Palindrome Partitioning
- **Template**: Try all split points k where i < k < j

---

## Key Insights

1. **Identify State**: What information do I need to represent a subproblem?
2. **Find Recurrence**: How does current state relate to previous states?
3. **Base Cases**: What are the smallest subproblems?
4. **Top-Down vs Bottom-Up**:
   - Top-down: More intuitive, only solves needed subproblems
   - Bottom-up: Better performance, guaranteed to solve all subproblems
5. **Space Optimization**: Can we reduce dimensions? (2D → 1D, 1D → constants)

### Common DP Mistakes to Avoid:
- Forgetting to copy list when adding to result
- Not initializing base cases correctly
- Off-by-one errors in array indices
- Iterating forward when should iterate backward (knapsack)
- Not considering edge cases (empty input, single element)

**Remember**: If a problem asks for "minimum", "maximum", "count ways", or "is it possible" - think DP!
