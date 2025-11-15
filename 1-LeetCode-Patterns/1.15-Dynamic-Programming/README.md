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

Dynamic Programming builds solutions like assembling LEGO blocks - each piece uses the results from smaller pieces!

#### 1. Building Blocks Concept: How DP Combines Subproblems

```
Without DP - Repeated Work (Exponential Time):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        fib(5) = ?
                    ╱              ╲
                fib(4)              fib(3)
              ╱      ╲            ╱      ╲
          fib(3)    fib(2)    fib(2)    fib(1)
         ╱    ╲     ╱   ╲     ╱   ╲
     fib(2) fib(1) [1]  [0] [1]  [0]     [1]
     ╱   ╲
   [1]   [0]

❌ Notice: fib(3) calculated 2 times
❌ Notice: fib(2) calculated 3 times
❌ Notice: fib(1) calculated 5 times
Total calculations: ~15+ function calls for just fib(5)!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


With DP - Build Once, Reuse Many (Linear Time):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step-by-step building blocks:

Step 1: fib(0) = 0   [BASE CASE] ✓
        └─► memo[0] = 0

Step 2: fib(1) = 1   [BASE CASE] ✓
        └─► memo[1] = 1

Step 3: fib(2) = memo[1] + memo[0] = 1 + 0 = 1 ✓
        └─► memo[2] = 1

Step 4: fib(3) = memo[2] + memo[1] = 1 + 1 = 2 ✓
        └─► memo[3] = 2

Step 5: fib(4) = memo[3] + memo[2] = 2 + 1 = 3 ✓
        └─► memo[4] = 3

Step 6: fib(5) = memo[4] + memo[3] = 3 + 2 = 5 ✓
        └─► memo[5] = 5

Final Memo Table:
┌─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │ ← Index
├─────┼─────┼─────┼─────┼─────┼─────┤
│  0  │  1  │  1  │  2  │  3  │  5  │ ← Fibonacci Value
└─────┴─────┴─────┴─────┴─────┴─────┘

✓ Each value calculated exactly ONCE!
✓ Total calculations: Only 6 (one per number)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 2. Memoization vs Tabulation: Two Approaches

```
TOP-DOWN MEMOIZATION (Recursive + Cache):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Think: "I need fib(5), let me ask for smaller pieces"

Call fib(5):
  │
  ├─→ Need fib(4)?  → Not in memo, calculate it
  │     │
  │     ├─→ Need fib(3)?  → Not in memo, calculate it
  │     │     │
  │     │     ├─→ Need fib(2)?  → Not in memo, calculate it
  │     │     │     │
  │     │     │     ├─→ Need fib(1)?  → Base case! Return 1
  │     │     │     └─→ Need fib(0)?  → Base case! Return 0
  │     │     │
  │     │     │   fib(2) = 1 ✓ → Save to memo[2]
  │     │     │
  │     │     └─→ Need fib(1)?  → Base case! Return 1
  │     │
  │     │   fib(3) = 2 ✓ → Save to memo[3]
  │     │
  │     └─→ Need fib(2)?  → FOUND IN MEMO! Return 1 (no recursion)
  │
  │   fib(4) = 3 ✓ → Save to memo[4]
  │
  └─→ Need fib(3)?  → FOUND IN MEMO! Return 2 (no recursion)

Result: fib(5) = 5 ✓ → Save to memo[5]

Memo Cache:
┌──────────┬───────┐
│ State    │ Value │
├──────────┼───────┤
│ memo[2]  │   1   │ ← Saved during recursion
│ memo[3]  │   2   │ ← Reused later!
│ memo[4]  │   3   │ ← Saved and reused
│ memo[5]  │   5   │ ← Final answer
└──────────┴───────┘

Characteristics:
✓ Solves from top (goal) to bottom (base cases)
✓ Only computes needed subproblems
✓ More intuitive (follows natural recursion)
✓ Uses recursion stack memory
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


BOTTOM-UP TABULATION (Iterative + Table):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Think: "Build from smallest to largest systematically"

Initialize DP Table:
┌─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │ ← Index
├─────┼─────┼─────┼─────┼─────┼─────┤
│  0  │  1  │  ?  │  ?  │  ?  │  ?  │ ← Initial (base cases)
└─────┴─────┴─────┴─────┴─────┴─────┘

Iteration 1: Calculate dp[2]
┌─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │
├─────┼─────┼─────┼─────┼─────┼─────┤
│  0  │  1  │  1  │  ?  │  ?  │  ?  │
└─────┴─────┴─────┴─────┴─────┴─────┘
         ↑     ↑    ↑
         └─────┴────┘ dp[2] = dp[1] + dp[0] = 1 + 0 = 1

Iteration 2: Calculate dp[3]
┌─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │
├─────┼─────┼─────┼─────┼─────┼─────┤
│  0  │  1  │  1  │  2  │  ?  │  ?  │
└─────┴─────┴─────┴─────┴─────┴─────┘
              ↑     ↑    ↑
              └─────┴────┘ dp[3] = dp[2] + dp[1] = 1 + 1 = 2

Iteration 3: Calculate dp[4]
┌─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │
├─────┼─────┼─────┼─────┼─────┼─────┤
│  0  │  1  │  1  │  2  │  3  │  ?  │
└─────┴─────┴─────┴─────┴─────┴─────┘
                   ↑     ↑    ↑
                   └─────┴────┘ dp[4] = dp[3] + dp[2] = 2 + 1 = 3

Iteration 4: Calculate dp[5]
┌─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │
├─────┼─────┼─────┼─────┼─────┼─────┤
│  0  │  1  │  1  │  2  │  3  │  5  │ ← COMPLETE!
└─────┴─────┴─────┴─────┴─────┴─────┘
                        ↑     ↑    ↑
                        └─────┴────┘ dp[5] = dp[4] + dp[3] = 3 + 2 = 5

Characteristics:
✓ Solves from bottom (base cases) to top (goal)
✓ Computes all subproblems systematically
✓ Better performance (no recursion overhead)
✓ Uses array/table memory
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 3. Linear DP Pattern: Climbing Stairs Example

```
Problem: How many ways to climb n stairs (1 or 2 steps at a time)?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Visual: n = 5 stairs
                                    ┌───┐
                                    │ 5 │ ← GOAL: How many ways?
                                    ├───┤
                                    │ 4 │
                                    ├───┤
                                    │ 3 │
                                    ├───┤
                                    │ 2 │
                                    ├───┤
                                    │ 1 │
                                    ├───┤
                                    │ 0 │ ← START
                                    └───┘

Building the DP Table:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
State Definition: dp[i] = number of ways to reach stair i

Base Cases:
  dp[0] = 1  (one way: don't move)
  dp[1] = 1  (one way: single step)

Recurrence Relation:
  dp[i] = dp[i-1] + dp[i-2]
  (can reach stair i from stair i-1 OR stair i-2)

Step-by-Step Construction:
┌──────┬─────┬──────────────────────┬──────────────────┐
│ Step │Ways │ Calculation          │  Visualization   │
├──────┼─────┼──────────────────────┼──────────────────┤
│  0   │  1  │ Base case            │     •            │
│  1   │  1  │ Base case            │     •            │
│      │     │                      │    / \           │
│  2   │  2  │ dp[1] + dp[0]        │   •   •          │
│      │     │ = 1 + 1 = 2          │  (1+1) (2)       │
│      │     │                      │  /  |  \         │
│  3   │  3  │ dp[2] + dp[1]        │ •   •   •        │
│      │     │ = 2 + 1 = 3          │(1+1+1)(1+2)(2+1) │
│      │     │                      │/ | | | \ | | \   │
│  4   │  5  │ dp[3] + dp[2]        │• • • • •         │
│      │     │ = 3 + 2 = 5          │ (5 different     │
│      │     │                      │   sequences)     │
│  5   │  8  │ dp[4] + dp[3]        │ 8 total ways!    │
│      │     │ = 5 + 3 = 8          │                  │
└──────┴─────┴──────────────────────┴──────────────────┘

Final DP Table:
┌─────┬─────┬─────┬─────┬─────┬─────┐
│  0  │  1  │  2  │  3  │  4  │  5  │ ← Stair number
├─────┼─────┼─────┼─────┼─────┼─────┤
│  1  │  1  │  2  │  3  │  5  │  8  │ ← Ways to reach
└─────┴─────┴─────┴─────┴─────┴─────┘
  ↑     ↑     ↑
  Base  Base  Built from previous values!

Answer: 8 ways to climb 5 stairs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 4. 2D Grid DP Pattern: Unique Paths Example

```
Problem: Robot moves from top-left to bottom-right (only right/down)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3x4 Grid:
      Col 0  Col 1  Col 2  Col 3
    ┌──────┬──────┬──────┬──────┐
Row 0│START │      │      │      │
    ├──────┼──────┼──────┼──────┤
Row 1│      │      │      │      │
    ├──────┼──────┼──────┼──────┤
Row 2│      │      │      │ GOAL │
    └──────┴──────┴──────┴──────┘

State Definition: dp[i][j] = number of paths to cell (i,j)

Base Cases:
  - First row: dp[0][j] = 1 (can only go right)
  - First column: dp[i][0] = 1 (can only go down)

Recurrence:
  dp[i][j] = dp[i-1][j] + dp[i][j-1]
  (paths from above + paths from left)

Building the Table Step-by-Step:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Initialize base cases
      Col 0  Col 1  Col 2  Col 3
    ┌──────┬──────┬──────┬──────┐
Row 0│  1   │  1   │  1   │  1   │ ← Only one way (go right)
    ├──────┼──────┼──────┼──────┤
Row 1│  1   │  ?   │  ?   │  ?   │
    ├──────┼──────┼──────┼──────┤ ↑
Row 2│  1   │  ?   │  ?   │  ?   │ Only one way (go down)
    └──────┴──────┴──────┴──────┘


Step 2: Fill dp[1][1]
      Col 0  Col 1  Col 2  Col 3
    ┌──────┬──────┬──────┬──────┐
Row 0│  1   │  1 ← │  1   │  1   │
    ├──────┼──────┼──────┼──────┤
Row 1│  1 ← │  2   │  ?   │  ?   │
    └──────┴──────┴──────┴──────┘
       ↑      ↑
       └──────┘ dp[1][1] = 1 + 1 = 2


Step 3: Fill dp[1][2]
      Col 0  Col 1  Col 2  Col 3
    ┌──────┬──────┬──────┬──────┐
Row 0│  1   │  1   │  1 ← │  1   │
    ├──────┼──────┼──────┼──────┤
Row 1│  1   │  2 ← │  3   │  ?   │
    └──────┴──────┴──────┴──────┘
                ↑      ↑
                └──────┘ dp[1][2] = 1 + 2 = 3


Step 4: Fill dp[1][3]
      Col 0  Col 1  Col 2  Col 3
    ┌──────┬──────┬──────┬──────┐
Row 0│  1   │  1   │  1   │  1 ← │
    ├──────┼──────┼──────┼──────┤
Row 1│  1   │  2   │  3 ← │  4   │
    └──────┴──────┴──────┴──────┘
                     ↑      ↑
                     └──────┘ dp[1][3] = 1 + 3 = 4


Step 5: Fill dp[2][1]
      Col 0  Col 1  Col 2  Col 3
    ┌──────┬──────┬──────┬──────┐
Row 0│  1   │  1   │  1   │  1   │
    ├──────┼──────┼──────┼──────┤
Row 1│  1   │  2 ← │  3   │  4   │
    ├──────┼──────┼──────┼──────┤
Row 2│  1 ← │  3   │  ?   │  ?   │
    └──────┴──────┴──────┴──────┘
       ↑      ↑
       └──────┘ dp[2][1] = 1 + 2 = 3


Step 6: Fill dp[2][2]
      Col 0  Col 1  Col 2  Col 3
    ┌──────┬──────┬──────┬──────┐
Row 0│  1   │  1   │  1   │  1   │
    ├──────┼──────┼──────┼──────┤
Row 1│  1   │  2   │  3 ← │  4   │
    ├──────┼──────┼──────┼──────┤
Row 2│  1   │  3 ← │  6   │  ?   │
    └──────┴──────┴──────┴──────┘
                ↑      ↑
                └──────┘ dp[2][2] = 3 + 3 = 6


Step 7: Fill dp[2][3] - GOAL!
      Col 0  Col 1  Col 2  Col 3
    ┌──────┬──────┬──────┬──────┐
Row 0│  1   │  1   │  1   │  1   │
    ├──────┼──────┼──────┼──────┤
Row 1│  1   │  2   │  3   │  4 ← │
    ├──────┼──────┼──────┼──────┤
Row 2│  1   │  3   │  6 ← │ 10   │ ← Answer!
    └──────┴──────┴──────┴──────┘
                     ↑      ↑
                     └──────┘ dp[2][3] = 4 + 6 = 10

Final Complete Table:
      Col 0  Col 1  Col 2  Col 3
    ┌──────┬──────┬──────┬──────┐
Row 0│  1   │  1   │  1   │  1   │
    ├──────┼──────┼──────┼──────┤
Row 1│  1   │  2   │  3   │  4   │
    ├──────┼──────┼──────┼──────┤
Row 2│  1   │  3   │  6   │  10  │ ← 10 unique paths!
    └──────┴──────┴──────┴──────┘

Answer: 10 unique paths from top-left to bottom-right
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 5. Subsequence DP Pattern: Longest Common Subsequence

```
Problem: Find LCS of "ABCDGH" and "AEDFHR"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

State Definition:
  dp[i][j] = length of LCS for text1[0..i-1] and text2[0..j-1]

Recurrence:
  If text1[i-1] == text2[j-1]:
      dp[i][j] = dp[i-1][j-1] + 1    (match! extend LCS)
  Else:
      dp[i][j] = max(dp[i-1][j], dp[i][j-1])  (skip one char)

Building the DP Table:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

         ""  A  E  D  F  H  R  ← text2
       ┌───┬───┬───┬───┬───┬───┬───┐
    "" │ 0 │ 0 │ 0 │ 0 │ 0 │ 0 │ 0 │ ← Base case (empty string)
       ├───┼───┼───┼───┼───┼───┼───┤
    A  │ 0 │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │
       ├───┼───┼───┼───┼───┼───┼───┤
    B  │ 0 │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │
       ├───┼───┼───┼───┼───┼───┼───┤
    C  │ 0 │ 1 │ 1 │ 1 │ 1 │ 1 │ 1 │
       ├───┼───┼───┼───┼───┼───┼───┤
    D  │ 0 │ 1 │ 1 │ 2 │ 2 │ 2 │ 2 │
       ├───┼───┼───┼───┼───┼───┼───┤
    G  │ 0 │ 1 │ 1 │ 2 │ 2 │ 2 │ 2 │
       ├───┼───┼───┼───┼───┼───┼───┤
    H  │ 0 │ 1 │ 1 │ 2 │ 2 │ 3 │ 3 │ ← Answer: 3
       └───┴───┴───┴───┴───┴───┴───┘
text1 ↑

Detailed Example: Computing dp[4][3] (D vs D)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Comparing: text1[3] = 'D' with text2[2] = 'D'

         ""  A  E  D
       ┌───┬───┬───┬───┐
    "" │ 0 │ 0 │ 0 │ 0 │
       ├───┼───┼───┼───┤
    A  │ 0 │ 1 │ 1 │ 1 │
       ├───┼───┼───┼───┤
    B  │ 0 │ 1 │ 1 │ 1 │
       ├───┼───┼───┼───┤
    C  │ 0 │ 1 │ 1 │ 1 │
       ├───┼───┼───┼───┤
    D  │ 0 │ 1 │ 1 │ ? │ ← Computing this
       └───┴───┴───┴───┘
                  ↑
                  Diagonal (i-1, j-1)

'D' == 'D' → MATCH! ✓
dp[4][3] = dp[3][2] + 1 = 1 + 1 = 2

         ""  A  E  D
       ┌───┬───┬───┬───┐
    "" │ 0 │ 0 │ 0 │ 0 │
       ├───┼───┼───┼───┤
    A  │ 0 │ 1 │ 1 │ 1 │
       ├───┼───┼───┼───┤
    B  │ 0 │ 1 │ 1 │ 1 │
       ├───┼───┼───┼───┤
    C  │ 0 │ 1 │ 1 ↖ 1 │
       ├───┼───┼───┼───┤
    D  │ 0 │ 1 │ 1 │ 2 │ ← Extended LCS by 1!
       └───┴───┴───┴───┘

LCS = "ADH" (length 3)
Path through table (backtracking):
  (6,6) → (5,5) → (4,3) → (1,1) → (0,0)
   'H'     Match!  'D'     'A'     Done
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 6. Knapsack DP Pattern: 0/1 Knapsack Visualization

```
Problem: Items with weights [2, 3, 4, 5] and values [3, 4, 5, 6]
         Knapsack capacity = 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Decision Tree for Each Item:
                    Item 0 (w=2, v=3)
                   /                 \
              INCLUDE                EXCLUDE
           (cap=3, val=3)          (cap=5, val=0)
              /        \              /        \
         INCLUDE      EXCLUDE    INCLUDE      EXCLUDE
    Item 1: Can't fit   ...     (cap=2,v=4)    ...

State Definition:
  dp[i][w] = max value using items 0..i-1 with capacity w

Building the DP Table:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Items:  Item 0: w=2, v=3
        Item 1: w=3, v=4
        Item 2: w=4, v=5
        Item 3: w=5, v=6

       Capacity →
       0   1   2   3   4   5
     ┌───┬───┬───┬───┬───┬───┐
  0  │ 0 │ 0 │ 0 │ 0 │ 0 │ 0 │ ← No items
     ├───┼───┼───┼───┼───┼───┤
  1  │ 0 │ 0 │ 3 │ 3 │ 3 │ 3 │ ← Item 0 (w=2,v=3)
     ├───┼───┼───┼───┼───┼───┤
  2  │ 0 │ 0 │ 3 │ 4 │ 4 │ 7 │ ← Items 0,1
     ├───┼───┼───┼───┼───┼───┤
  3  │ 0 │ 0 │ 3 │ 4 │ 5 │ 7 │ ← Items 0,1,2
     ├───┼───┼───┼───┼───┼───┤
  4  │ 0 │ 0 │ 3 │ 4 │ 5 │ 7 │ ← Items 0,1,2,3
     └───┴───┴───┴───┴───┴───┘
Items ↑

Detailed Example: Computing dp[2][5] (Items 0,1 with capacity 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current item: Item 1 (weight=3, value=4)
Capacity available: 5

Option 1: EXCLUDE Item 1
  → Take value from previous row: dp[1][5] = 3

Option 2: INCLUDE Item 1
  → Need capacity 3, leaving 5-3=2 remaining
  → Value = item1_value + dp[1][5-3]
  → Value = 4 + dp[1][2]
  → Value = 4 + 3 = 7

Decision: max(3, 7) = 7 ✓ INCLUDE Item 1!

       Capacity 5
     ┌───┐
  1  │ 3 │ ← Don't include item 1
     ├───┤
  2  │ 7 │ ← Include item 1 (better!)
     └───┘

Visual representation of optimal solution:
┌─────────────────────────────────────┐
│ Knapsack (capacity = 5)             │
│ ┌─────────────┬─────────────┐       │
│ │  Item 0     │   Item 1    │       │
│ │  Weight: 2  │  Weight: 3  │       │
│ │  Value: 3   │  Value: 4   │       │
│ └─────────────┴─────────────┘       │
│ Total Weight: 2 + 3 = 5 ✓           │
│ Total Value:  3 + 4 = 7 ✓           │
└─────────────────────────────────────┘

Answer: Maximum value = 7
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

### 16. Triangle (Medium)
**LeetCode**: https://leetcode.com/problems/triangle/

**Description**: Given a triangle array, return the minimum path sum from top to bottom. For each step, you may move to an adjacent number on the row below.

**State Transition**:
```
dp[i][j] = minimum path sum to reach row i, column j
dp[i][j] = triangle[i][j] + min(dp[i-1][j-1], dp[i-1][j])

Example Triangle:
        2           ← row 0
       3 4          ← row 1
      6 5 7         ← row 2
     4 1 8 3        ← row 3

DP Table Visualization:
        2           dp[0][0] = 2
       / \
      3   4         dp[1][0] = 2+3=5    dp[1][1] = 2+4=6
     /|\ /|\
    6 5 7 ...       dp[2][0] = 5+6=11   dp[2][1] = min(5,6)+5=10   dp[2][2] = 6+7=13

Building from bottom up:
Row 3:  4   1   8   3
Row 2:  6   5   7
        ↓   ↓   ↓
      min paths:
        6+min(4,1)=7    5+min(1,8)=6    7+min(8,3)=10

Row 1:  3   4
        ↓   ↓
        3+min(7,6)=9    4+min(6,10)=10

Row 0:  2
        ↓
        2+min(9,10)=11  ← Answer!
```

**Python Solution (Top-Down)**:
```python
def minimumTotal(triangle: list[list[int]]) -> int:
    """
    Memoization: recursively find min path from top to bottom.
    """
    n = len(triangle)
    memo = {}

    def dp(row, col):
        # Step 1: Reached bottom row
        if row == n - 1:
            return triangle[row][col]

        # Step 2: Check memo
        if (row, col) in memo:
            return memo[(row, col)]

        # Step 3: Try both paths (down-left and down-right)
        # From (row, col), we can go to (row+1, col) or (row+1, col+1)
        left = dp(row + 1, col)
        right = dp(row + 1, col + 1)

        # Step 4: Current cell + minimum of two paths
        memo[(row, col)] = triangle[row][col] + min(left, right)

        return memo[(row, col)]

    return dp(0, 0)
```

**Python Solution (Bottom-Up)**:
```python
def minimumTotal(triangle: list[list[int]]) -> int:
    """
    Tabulation: build from bottom to top.
    """
    if not triangle:
        return 0

    n = len(triangle)

    # Step 1: Create DP table (can modify triangle in-place to save space)
    dp = [row[:] for row in triangle]  # Deep copy

    # Step 2: Start from second-to-last row, work upward
    for row in range(n - 2, -1, -1):
        for col in range(len(triangle[row])):
            # Step 3: Minimum of two adjacent cells below
            dp[row][col] = triangle[row][col] + min(
                dp[row + 1][col],
                dp[row + 1][col + 1]
            )

    return dp[0][0]
```

**Space Optimized (In-Place)**:
```python
def minimumTotal(triangle: list[list[int]]) -> int:
    """
    Modify triangle in-place, using only O(1) extra space.
    """
    n = len(triangle)

    # Step 1: Start from second-to-last row
    for row in range(n - 2, -1, -1):
        for col in range(len(triangle[row])):
            # Step 2: Update in-place
            triangle[row][col] += min(
                triangle[row + 1][col],
                triangle[row + 1][col + 1]
            )

    return triangle[0][0]
```

**TypeScript Solution**:
```typescript
function minimumTotal(triangle: number[][]): number {
    const n = triangle.length;

    // Step 1: Use last row as initial DP state
    let dp = [...triangle[n - 1]];

    // Step 2: Build from bottom to top
    for (let row = n - 2; row >= 0; row--) {
        const newDp: number[] = [];

        for (let col = 0; col < triangle[row].length; col++) {
            // Step 3: Current value + min of two paths below
            newDp[col] = triangle[row][col] + Math.min(dp[col], dp[col + 1]);
        }

        dp = newDp;
    }

    return dp[0];
}
```

**Complexity**:
- Time: O(n²) where n is number of rows
- Space: O(1) if modifying in-place, O(n) for space-optimized

---

### 17. Best Time to Buy and Sell Stock with Cooldown (Medium)
**LeetCode**: https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/

**Description**: You can buy and sell stock multiple times, but after selling you must wait one day (cooldown). Find maximum profit.

**State Transition**:
```
Three states at each day:
  hold[i] = max profit if holding stock on day i
  sold[i] = max profit if sold stock on day i
  rest[i] = max profit if resting (no stock) on day i

Transitions:
  hold[i] = max(hold[i-1], rest[i-1] - prices[i])
            (keep holding OR buy today after rest)

  sold[i] = hold[i-1] + prices[i]
            (sell the stock we were holding)

  rest[i] = max(rest[i-1], sold[i-1])
            (keep resting OR enter rest after selling)

Example: prices = [1, 2, 3, 0, 2]
Day 0: buy at 1
Day 1: sell at 2 (profit=1)
Day 2: cooldown (can't buy)
Day 3: buy at 0
Day 4: sell at 2 (profit=2)
Total: 1 + 2 = 3

State Table:
Day    Price   Hold    Sold    Rest
 0      1      -1       0       0
 1      2      -1       1       0
 2      3      -1       2       1
 3      0      1        2       2
 4      2      1        3       2
                        ↑ Answer!
```

**Python Solution (State Machine)**:
```python
def maxProfit(prices: list[int]) -> int:
    """
    Three-state DP: hold, sold, rest.

    Visualization of state machine:
         ┌──────┐  buy   ┌──────┐  sell  ┌──────┐
         │ REST │───────→│ HOLD │───────→│ SOLD │
         └──────┘        └──────┘        └──────┘
            ↑                                │
            │          (cooldown)            │
            └────────────────────────────────┘
    """
    if not prices:
        return 0

    n = len(prices)

    # Step 1: Initialize states for day 0
    hold = -prices[0]  # Buy on first day
    sold = 0           # Can't sell on first day
    rest = 0           # Start with rest

    # Step 2: Process each day
    for i in range(1, n):
        # Step 3: Calculate new states (use temp to avoid overwriting)
        new_hold = max(hold, rest - prices[i])  # Keep holding or buy after rest
        new_sold = hold + prices[i]              # Sell what we're holding
        new_rest = max(rest, sold)               # Keep resting or cooldown after sell

        # Step 4: Update states
        hold = new_hold
        sold = new_sold
        rest = new_rest

    # Step 5: Max of sold or rest (can't be holding at the end)
    return max(sold, rest)
```

**Python Solution (Array DP)**:
```python
def maxProfit(prices: list[int]) -> int:
    """
    Array-based DP for clarity.
    """
    n = len(prices)
    if n <= 1:
        return 0

    # Step 1: Create state arrays
    hold = [0] * n
    sold = [0] * n
    rest = [0] * n

    # Step 2: Base cases
    hold[0] = -prices[0]
    sold[0] = 0
    rest[0] = 0

    # Step 3: Fill arrays
    for i in range(1, n):
        hold[i] = max(hold[i-1], rest[i-1] - prices[i])
        sold[i] = hold[i-1] + prices[i]
        rest[i] = max(rest[i-1], sold[i-1])

    return max(sold[n-1], rest[n-1])
```

**TypeScript Solution**:
```typescript
function maxProfit(prices: number[]): number {
    if (prices.length <= 1) return 0;

    // Step 1: Initialize three states
    let hold = -prices[0];
    let sold = 0;
    let rest = 0;

    // Step 2: Process each day
    for (let i = 1; i < prices.length; i++) {
        // Step 3: Calculate new states
        const newHold = Math.max(hold, rest - prices[i]);
        const newSold = hold + prices[i];
        const newRest = Math.max(rest, sold);

        // Step 4: Update
        hold = newHold;
        sold = newSold;
        rest = newRest;
    }

    // Step 5: Return max of sold or rest
    return Math.max(sold, rest);
}
```

**Complexity**:
- Time: O(n)
- Space: O(1)

---

### 18. Counting Bits (Easy)
**LeetCode**: https://leetcode.com/problems/counting-bits/

**Description**: Given an integer n, return an array where ans[i] is the number of 1's in the binary representation of i.

**State Transition**:
```
dp[i] = number of 1-bits in i

Key insight:
  i >> 1 removes the last bit
  i & 1 gets the last bit

  dp[i] = dp[i >> 1] + (i & 1)

Example: n = 5
Number  Binary   1-bits  Calculation
  0     0000      0      base case
  1     0001      1      base case
  2     0010      1      dp[2>>1] + (2&1) = dp[1] + 0 = 1
  3     0011      2      dp[3>>1] + (3&1) = dp[1] + 1 = 2
  4     0100      1      dp[4>>1] + (4&1) = dp[2] + 0 = 1
  5     0101      2      dp[5>>1] + (5&1) = dp[2] + 1 = 2

Visualization:
  i=5 (0101)
    │
    ├─ i>>1 = 2 (010)  → has 1 one-bit
    └─ i&1  = 1        → last bit is 1

  Total: 1 + 1 = 2 one-bits
```

**Python Solution (DP with Bit Manipulation)**:
```python
def countBits(n: int) -> list[int]:
    """
    Use DP with right shift operation.

    Key insight: Removing last bit (i >> 1) gives us a smaller number
    we've already solved. Add back the last bit (i & 1).
    """
    # Step 1: Initialize result array
    dp = [0] * (n + 1)

    # Step 2: Base case (0 has zero 1-bits)
    dp[0] = 0

    # Step 3: Build solution for each number
    for i in range(1, n + 1):
        # Step 4: Number of bits in i = bits in (i without last bit) + last bit
        dp[i] = dp[i >> 1] + (i & 1)

        # Explanation:
        # i >> 1: shift right by 1 (divide by 2, remove last bit)
        # i & 1: check if last bit is 1

    return dp
```

**Alternative Solution (Last Set Bit)**:
```python
def countBits(n: int) -> list[int]:
    """
    Using i & (i-1) which removes the rightmost 1-bit.

    Example:
      i = 6 (110)
      i-1 = 5 (101)
      i & (i-1) = 4 (100)  ← rightmost 1 removed
    """
    dp = [0] * (n + 1)

    for i in range(1, n + 1):
        # dp[i] = dp[number with rightmost 1 removed] + 1
        dp[i] = dp[i & (i - 1)] + 1

    return dp
```

**TypeScript Solution**:
```typescript
function countBits(n: number): number[] {
    // Step 1: Initialize array
    const dp: number[] = Array(n + 1).fill(0);

    // Step 2: Fill using DP relation
    for (let i = 1; i <= n; i++) {
        // Step 3: Bits in i = bits in (i>>1) + last bit
        dp[i] = dp[i >> 1] + (i & 1);
    }

    return dp;
}
```

**Complexity**:
- Time: O(n)
- Space: O(n) for result array (required by problem)

---

### 19. Perfect Squares (Medium)
**LeetCode**: https://leetcode.com/problems/perfect-squares/

**Description**: Given an integer n, return the least number of perfect square numbers that sum to n.

**State Transition**:
```
dp[i] = minimum number of perfect squares that sum to i
dp[i] = min(dp[i - j²] + 1) for all j where j² ≤ i

Example: n = 12
Perfect squares ≤ 12: 1, 4, 9

Building DP table:
  i    Calculation                              Result
  0    base case                                0
  1    1 = 1²                                   1
  2    2 = 1² + 1²                              2
  3    3 = 1² + 1² + 1²                         3
  4    4 = 2²                                   1
  5    5 = 2² + 1²                              2
  6    6 = 2² + 1² + 1²                         3
  7    7 = 2² + 1² + 1² + 1²                    4
  8    8 = 2² + 2²                              2
  9    9 = 3²                                   1
  10   10 = 3² + 1²                             2
  11   11 = 3² + 1² + 1²                        3
  12   12 = 2² + 2² + 2²  OR  3² + 1² + 1² + 1² 3

Detailed for i=12:
  Try 1²: dp[12-1] + 1 = dp[11] + 1 = 3 + 1 = 4
  Try 2²: dp[12-4] + 1 = dp[8] + 1 = 2 + 1 = 3  ✓ best
  Try 3²: dp[12-9] + 1 = dp[3] + 1 = 3 + 1 = 4

  Answer: min(4, 3, 4) = 3
```

**Python Solution (BFS Approach)**:
```python
def numSquares(n: int) -> int:
    """
    BFS: find shortest path to n using perfect square steps.
    """
    from collections import deque

    # Step 1: Generate perfect squares up to n
    squares = []
    i = 1
    while i * i <= n:
        squares.append(i * i)
        i += 1

    # Step 2: BFS
    queue = deque([(n, 0)])  # (remaining, steps)
    visited = {n}

    while queue:
        remaining, steps = queue.popleft()

        # Step 3: Try each perfect square
        for square in squares:
            next_val = remaining - square

            # Step 4: Found answer
            if next_val == 0:
                return steps + 1

            # Step 5: Continue search
            if next_val > 0 and next_val not in visited:
                visited.add(next_val)
                queue.append((next_val, steps + 1))

    return 0
```

**Python Solution (DP)**:
```python
def numSquares(n: int) -> int:
    """
    Dynamic Programming approach.
    """
    # Step 1: Initialize DP array
    dp = [float('inf')] * (n + 1)
    dp[0] = 0

    # Step 2: Pre-compute perfect squares
    squares = []
    i = 1
    while i * i <= n:
        squares.append(i * i)
        i += 1

    # Step 3: For each number from 1 to n
    for i in range(1, n + 1):
        # Step 4: Try each perfect square
        for square in squares:
            if square > i:
                break
            # Step 5: Update minimum
            dp[i] = min(dp[i], dp[i - square] + 1)

    return dp[n]
```

**TypeScript Solution**:
```typescript
function numSquares(n: number): number {
    // Step 1: Initialize DP
    const dp: number[] = Array(n + 1).fill(Infinity);
    dp[0] = 0;

    // Step 2: Generate perfect squares
    const squares: number[] = [];
    for (let i = 1; i * i <= n; i++) {
        squares.push(i * i);
    }

    // Step 3: Fill DP table
    for (let i = 1; i <= n; i++) {
        for (const square of squares) {
            if (square > i) break;
            dp[i] = Math.min(dp[i], dp[i - square] + 1);
        }
    }

    return dp[n];
}
```

**Complexity**:
- Time: O(n × √n)
- Space: O(n)

---

### 20. Coin Change II (Medium)
**LeetCode**: https://leetcode.com/problems/coin-change-2/

**Description**: Given coins of different denominations and an amount, return the number of combinations that make up that amount.

**State Transition**:
```
dp[i] = number of ways to make amount i

This is an UNBOUNDED knapsack (can use each coin multiple times)

Example: coins = [1, 2, 5], amount = 5

DP Table Building:
Amount:    0  1  2  3  4  5
No coins:  1  0  0  0  0  0  ← base case (1 way to make 0)

Using [1]: 1  1  1  1  1  1  ← can make any amount with 1s
           ↑  ↑  ↑
        i=0 i=1 i=2
           dp[1] = dp[1-1] = dp[0] = 1
           dp[2] = dp[2-1] = dp[1] = 1

Using [1,2]:  1  1  2  2  3  3
                    ↑
                  dp[2] = dp[2](from coin 1) + dp[0] = 1 + 1 = 2
                  Ways: (1+1), (2)

Using [1,2,5]: 1  1  2  2  3  4
                              ↑
                          dp[5] combinations:
                          - 1+1+1+1+1
                          - 1+1+1+2
                          - 1+2+2
                          - 5
                          Total: 4 ways
```

**Python Solution (2D DP)**:
```python
def change(amount: int, coins: list[int]) -> int:
    """
    2D DP: dp[i][j] = ways to make amount j using first i coins.

    DP Table Visualization (coins=[1,2,5], amount=5):
           0  1  2  3  4  5
       []  1  0  0  0  0  0
      [1]  1  1  1  1  1  1
    [1,2]  1  1  2  2  3  3
  [1,2,5]  1  1  2  2  3  4
    """
    n = len(coins)

    # Step 1: Create DP table
    dp = [[0] * (amount + 1) for _ in range(n + 1)]

    # Step 2: Base case - one way to make 0
    for i in range(n + 1):
        dp[i][0] = 1

    # Step 3: Fill table
    for i in range(1, n + 1):
        for j in range(amount + 1):
            # Step 4: Don't use current coin
            dp[i][j] = dp[i-1][j]

            # Step 5: Use current coin (if possible)
            if j >= coins[i-1]:
                dp[i][j] += dp[i][j - coins[i-1]]
                # Note: dp[i] not dp[i-1] because we can reuse the same coin

    return dp[n][amount]
```

**Python Solution (1D DP - Space Optimized)**:
```python
def change(amount: int, coins: list[int]) -> int:
    """
    1D DP: optimize space to O(amount).
    """
    # Step 1: Initialize DP array
    dp = [0] * (amount + 1)
    dp[0] = 1  # One way to make 0

    # Step 2: Process each coin
    for coin in coins:
        # Step 3: Update all amounts that can use this coin
        for amt in range(coin, amount + 1):
            # Step 4: Add ways using this coin
            dp[amt] += dp[amt - coin]

            # Why iterate forward? Because we CAN reuse the same coin
            # (unbounded knapsack)

    return dp[amount]
```

**TypeScript Solution**:
```typescript
function change(amount: number, coins: number[]): number {
    // Step 1: Initialize DP
    const dp: number[] = Array(amount + 1).fill(0);
    dp[0] = 1;

    // Step 2: Process each coin type
    for (const coin of coins) {
        // Step 3: Update amounts
        for (let amt = coin; amt <= amount; amt++) {
            // Step 4: Add combinations using this coin
            dp[amt] += dp[amt - coin];
        }
    }

    return dp[amount];
}
```

**Complexity**:
- Time: O(amount × coins.length)
- Space: O(amount)

---

### 21. Palindromic Substrings (Medium)
**LeetCode**: https://leetcode.com/problems/palindromic-substrings/

**Description**: Count how many palindromic substrings are in a given string.

**State Transition**:
```
dp[i][j] = true if s[i:j+1] is a palindrome

Base cases:
  Single char: dp[i][i] = true
  Two chars: dp[i][i+1] = (s[i] == s[i+1])

Recurrence:
  dp[i][j] = (s[i] == s[j]) && dp[i+1][j-1]

Example: s = "aaa"
Substrings and their palindrome status:
  "a" (index 0) ✓
  "a" (index 1) ✓
  "a" (index 2) ✓
  "aa" (0,1) ✓
  "aa" (1,2) ✓
  "aaa" (0,2) ✓
  Total: 6 palindromes

DP Table (1=palindrome):
     0  1  2
  0  1  1  1
  1     1  1
  2        1

Fill order (by length):
  Length 1: diagonal (all 1)
  Length 2: (0,1), (1,2)
  Length 3: (0,2)
```

**Python Solution (DP)**:
```python
def countSubstrings(s: str) -> int:
    """
    2D DP to track all palindromic substrings.

    Visualization for "aba":
         a  b  a
      a  T  F  T    ← "a", "aba" are palindromes
      b     T  F    ← "b" is palindrome
      a        T    ← "a" is palindrome

    Count: 4 palindromes
    """
    n = len(s)

    # Step 1: Create DP table
    dp = [[False] * n for _ in range(n)]
    count = 0

    # Step 2: Every single character is a palindrome
    for i in range(n):
        dp[i][i] = True
        count += 1

    # Step 3: Check all substrings of length 2
    for i in range(n - 1):
        if s[i] == s[i + 1]:
            dp[i][i + 1] = True
            count += 1

    # Step 4: Check substrings of length 3 to n
    for length in range(3, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1

            # Step 5: Check if current substring is palindrome
            if s[i] == s[j] and dp[i + 1][j - 1]:
                dp[i][j] = True
                count += 1

    return count
```

**Python Solution (Expand Around Center)**:
```python
def countSubstrings(s: str) -> int:
    """
    Expand around each possible center (more space efficient).
    """
    def expand(left: int, right: int) -> int:
        # Step 1: Expand while characters match
        count = 0
        while left >= 0 and right < len(s) and s[left] == s[right]:
            count += 1
            left -= 1
            right += 1
        return count

    result = 0

    # Step 2: Try each position as center
    for i in range(len(s)):
        # Step 3: Odd length palindromes (single center)
        result += expand(i, i)

        # Step 4: Even length palindromes (two centers)
        result += expand(i, i + 1)

    return result
```

**TypeScript Solution**:
```typescript
function countSubstrings(s: string): number {
    function expand(left: number, right: number): number {
        let count = 0;

        // Step 1: Expand while valid palindrome
        while (left >= 0 && right < s.length && s[left] === s[right]) {
            count++;
            left--;
            right++;
        }

        return count;
    }

    let result = 0;

    // Step 2: Check each center
    for (let i = 0; i < s.length; i++) {
        // Odd and even length palindromes
        result += expand(i, i);
        result += expand(i, i + 1);
    }

    return result;
}
```

**Complexity**:
- Time: O(n²)
- Space: O(1) for expand method, O(n²) for DP

---

### 22. Target Sum (Medium)
**LeetCode**: https://leetcode.com/problems/target-sum/

**Description**: Assign + or - to each number in array to make them sum to target. Count number of ways.

**State Transition**:
```
Key insight: This is a subset sum problem in disguise!

Let P = subset with positive sign
Let N = subset with negative sign

sum(P) - sum(N) = target
sum(P) + sum(N) = sum(nums)

Adding these equations:
2 * sum(P) = target + sum(nums)
sum(P) = (target + sum(nums)) / 2

So we need to find: number of subsets with sum = (target + sum) / 2

Example: nums = [1,1,1,1,1], target = 3
sum(nums) = 5
sum(P) = (3 + 5) / 2 = 4

Find subsets summing to 4:
[1,1,1,1] → 5 ways to choose 4 elements from 5

DP Table (subset sum count):
       0  1  2  3  4
    []  1  0  0  0  0
   [1]  1  1  0  0  0
 [1,1]  1  2  1  0  0
[1,1,1] 1  3  3  1  0
...
```

**Python Solution (Subset Sum DP)**:
```python
def findTargetSumWays(nums: list[int], target: int) -> int:
    """
    Convert to subset sum problem.

    Visualization:
    nums = [1,2,3,4,5], target = 3
    sum = 15, need subset sum = (3+15)/2 = 9

    Find ways to make sum 9:
    {4,5}, {1,3,5}, {2,3,4}, {1,2,3,3} (if dups exist)
    """
    total = sum(nums)

    # Step 1: Check if solution is possible
    if abs(target) > total or (target + total) % 2 != 0:
        return 0

    # Step 2: Calculate target subset sum
    subset_sum = (target + total) // 2

    # Step 3: DP - count ways to make each sum
    dp = [0] * (subset_sum + 1)
    dp[0] = 1  # One way to make 0 (empty subset)

    # Step 4: Process each number
    for num in nums:
        # Step 5: Iterate backwards (0/1 knapsack)
        for s in range(subset_sum, num - 1, -1):
            # Step 6: Add ways by including current number
            dp[s] += dp[s - num]

    return dp[subset_sum]
```

**Python Solution (Memoization)**:
```python
def findTargetSumWays(nums: list[int], target: int) -> int:
    """
    Top-down memoization approach.
    """
    memo = {}

    def dp(index: int, current_sum: int) -> int:
        # Step 1: Base case - processed all numbers
        if index == len(nums):
            return 1 if current_sum == target else 0

        # Step 2: Check memo
        if (index, current_sum) in memo:
            return memo[(index, current_sum)]

        # Step 3: Try both + and -
        positive = dp(index + 1, current_sum + nums[index])
        negative = dp(index + 1, current_sum - nums[index])

        # Step 4: Store and return
        memo[(index, current_sum)] = positive + negative
        return memo[(index, current_sum)]

    return dp(0, 0)
```

**TypeScript Solution**:
```typescript
function findTargetSumWays(nums: number[], target: number): number {
    const total = nums.reduce((a, b) => a + b, 0);

    // Step 1: Check validity
    if (Math.abs(target) > total || (target + total) % 2 !== 0) {
        return 0;
    }

    // Step 2: Calculate subset sum
    const subsetSum = (target + total) / 2;

    // Step 3: DP array
    const dp: number[] = Array(subsetSum + 1).fill(0);
    dp[0] = 1;

    // Step 4: Fill DP table
    for (const num of nums) {
        for (let s = subsetSum; s >= num; s--) {
            dp[s] += dp[s - num];
        }
    }

    return dp[subsetSum];
}
```

**Complexity**:
- Time: O(n × sum)
- Space: O(sum)

---

### 23. Delete and Earn (Medium)
**LeetCode**: https://leetcode.com/problems/delete-and-earn/

**Description**: Given an array, you can take any element and earn points equal to it, but must delete all elements equal to num-1 and num+1. Maximize points.

**State Transition**:
```
Key insight: This is like House Robber on a frequency array!

Transform: nums = [3,4,2] → points = [0,0,2,3,4]
                             index     0 1 2 3 4

If we take value 3, we earn 3 points but can't take 2 or 4
This is identical to house robber!

Example: nums = [2,2,3,3,3,4]
Frequency count:
  2 appears 2 times → earn 2*2 = 4
  3 appears 3 times → earn 3*3 = 9
  4 appears 1 time  → earn 4*1 = 4

dp[i] = max points we can earn considering values 0 to i
dp[i] = max(
    dp[i-1],           # skip value i
    dp[i-2] + points[i] # take value i
)

DP Table:
Value:    0  1  2  3  4
Points:   0  0  4  9  4
dp[i]:    0  0  4  9  13

dp[2] = max(0, 0+4) = 4
dp[3] = max(4, 0+9) = 9
dp[4] = max(9, 4+4) = 13  ← can't take 3 and 4 together
```

**Python Solution**:
```python
def deleteAndEarn(nums: list[int]) -> int:
    """
    Transform to House Robber problem.

    Visualization for nums = [3,4,2]:

    Step 1: Create points array
      points[2] = 2 (one 2)
      points[3] = 3 (one 3)
      points[4] = 4 (one 4)

    Step 2: Apply house robber logic
      Can't take adjacent values
      dp[3] = max(take 3, skip 3)
            = max(points[3] + dp[1], dp[2])
    """
    if not nums:
        return 0

    # Step 1: Find max value to determine array size
    max_num = max(nums)

    # Step 2: Calculate total points for each value
    points = [0] * (max_num + 1)
    for num in nums:
        points[num] += num

    # Step 3: House Robber DP
    if len(points) == 1:
        return points[0]

    prev2 = points[0]
    prev1 = max(points[0], points[1])

    for i in range(2, len(points)):
        # Step 4: Max of take current or skip
        current = max(prev1, prev2 + points[i])
        prev2 = prev1
        prev1 = current

    return prev1
```

**Python Solution (With DP Array)**:
```python
def deleteAndEarn(nums: list[int]) -> int:
    """
    Explicit DP array version for clarity.
    """
    if not nums:
        return 0

    max_num = max(nums)
    points = [0] * (max_num + 1)

    # Step 1: Count points for each number
    for num in nums:
        points[num] += num

    # Step 2: Initialize DP
    n = len(points)
    if n == 1:
        return points[0]

    dp = [0] * n
    dp[0] = points[0]
    dp[1] = max(points[0], points[1])

    # Step 3: Fill DP table
    for i in range(2, n):
        # Take current or skip
        dp[i] = max(dp[i-1], dp[i-2] + points[i])

    return dp[n-1]
```

**TypeScript Solution**:
```typescript
function deleteAndEarn(nums: number[]): number {
    if (nums.length === 0) return 0;

    // Step 1: Find max and create points array
    const maxNum = Math.max(...nums);
    const points: number[] = Array(maxNum + 1).fill(0);

    // Step 2: Calculate points
    for (const num of nums) {
        points[num] += num;
    }

    // Step 3: Apply House Robber logic
    if (points.length === 1) return points[0];

    let prev2 = points[0];
    let prev1 = Math.max(points[0], points[1]);

    for (let i = 2; i < points.length; i++) {
        const current = Math.max(prev1, prev2 + points[i]);
        prev2 = prev1;
        prev1 = current;
    }

    return prev1;
}
```

**Complexity**:
- Time: O(n + m) where m is max(nums)
- Space: O(m)

---

### 24. Minimum Cost For Tickets (Medium)
**LeetCode**: https://leetcode.com/problems/minimum-cost-for-tickets/

**Description**: Travel on certain days. Can buy 1-day, 7-day, or 30-day passes with different costs. Find minimum cost to cover all travel days.

**State Transition**:
```
dp[i] = minimum cost to cover all travel days up to day i

For each day:
  If not traveling: dp[i] = dp[i-1]
  If traveling:
    dp[i] = min(
      dp[i-1] + cost[1-day],
      dp[i-7] + cost[7-day],
      dp[i-30] + cost[30-day]
    )

Example: days = [1,4,6,7,8,20], costs = [2,7,15]

Day-by-day analysis:
Day 1: Buy 1-day ($2) → total $2
Day 4: Buy 1-day ($2) → total $4
Day 6: Buy 7-day ($7) covers days 6,7,8 → total $9
Day 20: Buy 1-day ($2) → total $11

DP Table (for each travel day):
Day   1  4  6  7  8  20
dp[i] 2  4  7  7  7  11

Detailed for day 8:
  Option 1: Buy 1-day: dp[7] + 2 = 7 + 2 = 9
  Option 2: Buy 7-day on day 2: dp[1] + 7 = 2 + 7 = 9
  Option 3: Buy 30-day on day -22: 0 + 15 = 15

  Best: min(9, 9, 15) = 9
  But we already covered 8 with the 7-day pass bought for day 6!
```

**Python Solution (DP on Travel Days)**:
```python
def mincostTickets(days: list[int], costs: list[int]) -> int:
    """
    DP on travel days only (sparse DP).

    Visualization:
    days = [1, 4, 6, 7, 8, 20]

    For each day, try 3 options:
      1-day  pass: covers just this day
      7-day  pass: covers last 7 days
      30-day pass: covers last 30 days
    """
    day_set = set(days)
    last_day = days[-1]

    # Step 1: DP array for all days from 0 to last_day
    dp = [0] * (last_day + 1)

    # Step 2: Fill DP table
    for i in range(1, last_day + 1):
        if i not in day_set:
            # Step 3: Not traveling this day
            dp[i] = dp[i - 1]
        else:
            # Step 4: Traveling - try all pass options
            # Option 1: 1-day pass
            option1 = dp[i - 1] + costs[0]

            # Option 2: 7-day pass
            option2 = dp[max(0, i - 7)] + costs[1]

            # Option 3: 30-day pass
            option3 = dp[max(0, i - 30)] + costs[2]

            # Step 5: Take minimum
            dp[i] = min(option1, option2, option3)

    return dp[last_day]
```

**Python Solution (Optimized - Travel Days Only)**:
```python
def mincostTickets(days: list[int], costs: list[int]) -> int:
    """
    Only store DP values for actual travel days.
    """
    from collections import deque

    # Step 1: Queues to track costs within 7 and 30 day windows
    last_7 = deque()   # (day, cost)
    last_30 = deque()  # (day, cost)
    cost = 0

    for day in days:
        # Step 2: Remove expired 7-day passes
        while last_7 and last_7[0][0] + 7 <= day:
            last_7.popleft()

        # Step 3: Remove expired 30-day passes
        while last_30 and last_30[0][0] + 30 <= day:
            last_30.popleft()

        # Step 4: Add current day with each pass type
        last_7.append((day, cost + costs[1]))
        last_30.append((day, cost + costs[2]))

        # Step 5: Update cost with minimum option
        cost = min(
            cost + costs[0],      # 1-day pass
            last_7[0][1],         # 7-day pass
            last_30[0][1]         # 30-day pass
        )

    return cost
```

**TypeScript Solution**:
```typescript
function mincostTickets(days: number[], costs: number[]): number {
    const daySet = new Set(days);
    const lastDay = days[days.length - 1];

    // Step 1: DP array
    const dp: number[] = Array(lastDay + 1).fill(0);

    // Step 2: Process each day
    for (let i = 1; i <= lastDay; i++) {
        if (!daySet.has(i)) {
            // Step 3: Not traveling
            dp[i] = dp[i - 1];
        } else {
            // Step 4: Try all pass options
            const option1 = dp[i - 1] + costs[0];
            const option2 = dp[Math.max(0, i - 7)] + costs[1];
            const option3 = dp[Math.max(0, i - 30)] + costs[2];

            dp[i] = Math.min(option1, option2, option3);
        }
    }

    return dp[lastDay];
}
```

**Complexity**:
- Time: O(max(days)) or O(n) for optimized
- Space: O(max(days)) or O(1) for optimized

---

### 25. Unique Binary Search Trees (Medium)
**LeetCode**: https://leetcode.com/problems/unique-binary-search-trees/

**Description**: Given n, how many structurally unique BSTs can store values 1...n?

**State Transition**:
```
dp[n] = number of unique BSTs with n nodes

Key insight: For each value i as root:
  - Left subtree: values 1 to i-1 (i-1 nodes)
  - Right subtree: values i+1 to n (n-i nodes)

dp[n] = sum(dp[i-1] * dp[n-i]) for i from 1 to n

This is the Catalan number!

Example: n = 3
Try each value as root:
  Root = 1: left has 0 nodes, right has 2 nodes
            dp[0] * dp[2] = 1 * 2 = 2

  Root = 2: left has 1 node, right has 1 node
            dp[1] * dp[1] = 1 * 1 = 1

  Root = 3: left has 2 nodes, right has 0 nodes
            dp[2] * dp[0] = 2 * 1 = 2

Total: 2 + 1 + 2 = 5

Visualizations for n=3:
   1         1        2        3      3
    \         \      / \      /      /
     3         2    1   3    2      1
    /           \          /        \
   2             3        1          2

DP Table:
n     0  1  2  3  4  5
dp[n] 1  1  2  5  14 42  ← Catalan numbers
```

**Python Solution (DP)**:
```python
def numTrees(n: int) -> int:
    """
    Dynamic Programming using Catalan number formula.

    Visualization for n=4:
    For each root position i (1 to 4):
      i=1: left=0, right=3 → dp[0]*dp[3] = 1*5 = 5
      i=2: left=1, right=2 → dp[1]*dp[2] = 1*2 = 2
      i=3: left=2, right=1 → dp[2]*dp[1] = 2*1 = 2
      i=4: left=3, right=0 → dp[3]*dp[0] = 5*1 = 5
    Total: 5+2+2+5 = 14
    """
    # Step 1: Initialize DP array
    dp = [0] * (n + 1)

    # Step 2: Base cases
    dp[0] = 1  # Empty tree
    dp[1] = 1  # Single node

    # Step 3: Build up for each number of nodes
    for nodes in range(2, n + 1):
        # Step 4: Try each value as root
        for root in range(1, nodes + 1):
            # Step 5: Left subtree has (root-1) nodes
            left_trees = dp[root - 1]

            # Step 6: Right subtree has (nodes-root) nodes
            right_trees = dp[nodes - root]

            # Step 7: Multiply combinations
            dp[nodes] += left_trees * right_trees

    return dp[n]
```

**Python Solution (Mathematical - Catalan Number)**:
```python
def numTrees(n: int) -> int:
    """
    Direct Catalan number calculation.

    Catalan(n) = C(2n, n) / (n + 1)
                = (2n)! / ((n+1)! * n!)
    """
    # Step 1: Calculate binomial coefficient C(2n, n)
    catalan = 1

    for i in range(n):
        # Step 2: Catalan formula optimization
        catalan = catalan * 2 * (2 * i + 1) // (i + 2)

    return catalan
```

**Python Solution (Memoization)**:
```python
def numTrees(n: int) -> int:
    """
    Top-down with memoization.
    """
    memo = {}

    def dp(n: int) -> int:
        # Step 1: Base cases
        if n <= 1:
            return 1

        # Step 2: Check memo
        if n in memo:
            return memo[n]

        # Step 3: Calculate for n nodes
        total = 0
        for root in range(1, n + 1):
            # Left and right subtree combinations
            left = dp(root - 1)
            right = dp(n - root)
            total += left * right

        # Step 4: Store and return
        memo[n] = total
        return total

    return dp(n)
```

**TypeScript Solution**:
```typescript
function numTrees(n: number): number {
    // Step 1: DP array
    const dp: number[] = Array(n + 1).fill(0);

    // Step 2: Base cases
    dp[0] = 1;
    dp[1] = 1;

    // Step 3: Build for each size
    for (let nodes = 2; nodes <= n; nodes++) {
        // Step 4: Try each root position
        for (let root = 1; root <= nodes; root++) {
            const leftTrees = dp[root - 1];
            const rightTrees = dp[nodes - root];

            dp[nodes] += leftTrees * rightTrees;
        }
    }

    return dp[n];
}
```

**Complexity**:
- Time: O(n²)
- Space: O(n)

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
