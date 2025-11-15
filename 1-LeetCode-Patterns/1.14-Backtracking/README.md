# 1.14 Backtracking Pattern

## Pattern Overview

### What is Backtracking?
Backtracking is a systematic way to explore all possible solutions by building candidates incrementally and abandoning ("backtracking") a candidate as soon as it's determined that it cannot lead to a valid solution. It's essentially a refined brute force approach with pruning.

### When to Use It?
- Generate all permutations, combinations, or subsets
- Find all possible solutions (not just one)
- Constraint satisfaction problems (N-Queens, Sudoku)
- Path finding where you need to explore all paths
- Decision problems with choices at each step

### Time/Space Complexity
- **Time**: Often O(2^n) or O(n!) depending on branching factor
- **Space**: O(n) for recursion stack + O(n) for current path

### Visual Diagram

#### 1. Complete Backtracking Decision Tree (Permutations)

```
Input: [1,2,3] → Generate all permutations

                                    []  <-- Start: Empty path
                     ┌───────────────┼───────────────┐
                     │               │               │
                    [1]             [2]             [3]  <-- Level 1: First choice
              ┌──────┴──────┐  ┌─────┴─────┐  ┌─────┴─────┐
              │             │  │           │  │           │
           [1,2]         [1,3][2,1]      [2,3][3,1]      [3,2]  <-- Level 2: Second choice
              │             │  │           │  │           │
          [1,2,3]       [1,3,2][2,1,3]  [2,3,1][3,1,2]  [3,2,1]  <-- Level 3: Complete! ✓

Total paths explored: 15 nodes
Total solutions found: 6 permutations
```

**Backtracking Flow at Each Node:**
```
┌─────────────────────────────────────┐
│  1. CHOOSE: Pick element            │
│  2. EXPLORE: Recurse deeper         │ ← Repeat for each branch
│  3. UNCHOOSE: Pop & try next option │
└─────────────────────────────────────┘
```

#### 2. Backtracking with Pruning (Combination Sum)

```
Input: candidates=[2,3,5], target=8

                                    [] sum=0
                    ┌───────────────┼──────────────┐
                    │               │              │
                  [2] sum=2       [3] sum=3      [5] sum=5
           ┌────────┼────────┐      │              │
           │        │        │      │              │
       [2,2]     [2,3]    [2,5]  [3,3]          [5,3] ✗ PRUNED!
       sum=4     sum=5    sum=7  sum=6          sum=8 (order matters)
     ┌───┼───┐    │        │      │
     │   │   │    │        │      │
   [222][223][225][235]  [237]  [333]
   sum=6 sum=7 sum=9✗ sum=10✗ sum=9✗ sum=9✗
     │    │
     │    │
  [2222][2223]
  sum=8✓sum=9✗

Valid Solutions: [2,2,2,2], [2,3,3], [3,5]
Pruned branches: ✗ (exceeded target or invalid order)
```

**Pruning Strategy:**
```
Before exploring a branch:
┌─────────────────────────────────┐
│ if total > target:              │
│     return  ← PRUNE! Stop early │
│                                 │
│ if total == target:             │
│     add to result ✓             │
└─────────────────────────────────┘
```

#### 3. Step-by-Step Execution (Subsets)

```
Input: [1,2,3] → Generate all subsets

Step 1: Start with empty set
┌──────────────────────┐
│ path = []            │  ← Add to result: [[]]
│ result = [[]]        │
└──────────────────────┘

Step 2: Include 1
┌──────────────────────┐
│ path = [1]           │  ← Add to result: [[],[1]]
│ Try adding 2...      │
└──────────────────────┘
        │
        ▼
Step 3: Include 1,2
┌──────────────────────┐
│ path = [1,2]         │  ← Add to result: [[],[1],[1,2]]
│ Try adding 3...      │
└──────────────────────┘
        │
        ▼
Step 4: Include 1,2,3
┌──────────────────────┐
│ path = [1,2,3]       │  ← Add: [[],[1],[1,2],[1,2,3]]
│ No more choices ✓    │
└──────────────────────┘
        │
        ▼ BACKTRACK (remove 3)
Step 5: Back to [1,2]
┌──────────────────────┐
│ path = [1,2]         │
│ Pop 2 ← BACKTRACK    │
└──────────────────────┘
        │
        ▼
Step 6: Try [1,3]
┌──────────────────────┐
│ path = [1,3]         │  ← Add: [[],[1],[1,2],[1,2,3],[1,3]]
└──────────────────────┘

... continues exploring all branches ...

Final Result: [[],[1],[2],[3],[1,2],[1,3],[2,3],[1,2,3]]
```

#### 4. Visual Template Structure

```
                    backtrack(state)
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
  BASE CASE?        ITERATE           EXPLORE DEEPER
        │           CHOICES                 │
        │              │                    │
        ▼              ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ if complete: │  │ for choice   │  │ 1. ADD choice│
│   add result │  │   in choices:│  │ 2. RECURSE   │
│   return     │  │              │  │ 3. POP choice│
└──────────────┘  └──────────────┘  └──────────────┘
                        │
                        ▼
                  ┌──────────────┐
                  │ PRUNE?       │
                  │ if invalid:  │
                  │   continue   │
                  └──────────────┘
```

#### 5. N-Queens Visualization (4x4 Board)

```
Row 0: Try each column
┌───┬───┬───┬───┐       ┌───┬───┬───┬───┐
│ Q │   │   │   │  ✗    │   │ Q │   │   │  ✗
├───┼───┼───┼───┤       ├───┼───┼───┼───┤
│   │   │ X │   │       │   │   │   │ X │
├───┼───┼───┼───┤       ├───┼───┼───┼───┤
│   │ X │   │   │       │ X │   │   │   │
├───┼───┼───┼───┤       ├───┼───┼───┼───┤
│ X │   │   │   │       │   │   │   │   │
└───┴───┴───┴───┘       └───┴───┴───┴───┘
Col 0 attacked          Col 1 attacked
PRUNE!                  PRUNE!

Row 0: Continue trying...
┌───┬───┬───┬───┐
│   │   │ Q │   │  ✓ Valid so far!
├───┼───┼───┼───┤
│   │   │   │   │  → Recurse to Row 1
├───┼───┼───┼───┤
│   │   │   │   │
├───┼───┼───┼───┤
│   │   │   │   │
└───┴───┴───┴───┘

Row 1: Try columns that aren't attacked
┌───┬───┬───┬───┐       ┌───┬───┬───┬───┐
│   │   │ Q │   │       │   │   │ Q │   │
├───┼───┼───┼───┤       ├───┼───┼───┼───┤
│ Q │   │ X │   │  ✗    │   │   │ X │ Q │  ✗
├───┼───┼───┼───┤       ├───┼───┼───┼───┤
│ X │   │ X │   │       │   │   │ X │ X │
├───┼───┼───┼───┤       ├───┼───┼───┼───┤
│   │   │ X │   │       │   │   │ X │   │
└───┴───┴───┴───┴───┘   └───┴───┴───┴───┘
PRUNE!                  PRUNE!

Backtracking happens when no valid column exists in current row!
```

#### 6. Decision Tree with State Tracking

```
Generate Parentheses (n=2)

                        "" (open=0, close=0)
                             │
                     ┌───────┴───────┐
                     │               │ (close < open? No, skip ')')
                    "("              ✗
              (open=1, close=0)
                     │
          ┌──────────┴──────────┐
          │                     │
        "(("                  "()"
   (open=2, close=0)    (open=1, close=1)
          │                     │
    ┌─────┴─────┐         ┌─────┴─────┐
    │           │         │           │
  "(()"       ✗(close<open) "()("     ✗(open<n fails)
(open=2, close=1)  skip   (open=2, close=1)
    │                           │
    │                           │
  "(())"                     "()()"
(open=2, close=2) ✓         (open=2, close=2) ✓

Valid solutions: ["(())", "()()"]

Constraints enforced:
  - Can add '(' if: open < n
  - Can add ')' if: close < open
```

#### 7. Backtracking vs Brute Force Comparison

```
BRUTE FORCE (No pruning):
Generate all 2^n possibilities, then filter valid ones

              All Subsets
                   │
        ┌──────────┼──────────┐
     Invalid    Valid     Invalid
        │          │          │
      (waste)  (keep)      (waste)

Time: Generate ALL → Filter → O(2^n)


BACKTRACKING (With pruning):
Only explore valid paths

              Start
                │
        ┌───────┼────────┐
     Valid    Invalid   Valid
        │      PRUNE!      │
      (keep)              (keep)
        │                   │
    Continue            Continue

Time: Only explore valid → O(k) where k < 2^n

Savings: Skip entire subtrees early! 🚀
```

---

## Recognition Guidelines

### How to Identify This Pattern?
Look for these keywords:
- "Find all possible...", "Generate all..."
- "Permutations", "combinations", "subsets"
- "All valid arrangements"
- "Solve the puzzle"
- "Place N items with constraints"
- "Find all paths from X to Y"

### Key Indicators:
1. Need to explore multiple possibilities
2. Choices at each step
3. Need to undo choices (backtrack)
4. Constraints that invalidate partial solutions
5. Output is a collection of solutions

---

## Template/Pseudocode

### Standard Backtracking Template
```python
def backtrack(state, choices, path, result):
    # Step 1: Base case - found valid solution
    if is_valid_solution(state):
        result.append(path[:])  # Make a copy!
        return

    # Step 2: Iterate through all choices
    for choice in choices:
        # Step 3: Check if choice is valid (pruning)
        if not is_valid(choice, state):
            continue

        # Step 4: Make choice
        path.append(choice)
        update_state(choice)

        # Step 5: Recurse with new state
        backtrack(new_state, remaining_choices, path, result)

        # Step 6: Undo choice (backtrack)
        path.pop()
        restore_state()
```

### Key Components:
1. **Choose**: Pick a candidate
2. **Explore**: Recursively try to complete the solution
3. **Unchoose**: Backtrack and try another candidate

---

## Problems

### 1. Subsets (Medium)
**LeetCode**: https://leetcode.com/problems/subsets/

**Description**: Given an integer array `nums` of unique elements, return all possible subsets (the power set). The solution set must not contain duplicate subsets.

**Python Solution**:
```python
def subsets(nums: list[int]) -> list[list[int]]:
    """
    Decision tree: At each element, choose to include it or not.
    This creates 2^n subsets.
    """
    result = []

    def backtrack(start, path):
        # Step 1: Every path is a valid subset
        result.append(path[:])

        # Step 2: Try adding each remaining element
        for i in range(start, len(nums)):
            # Step 3: Include nums[i]
            path.append(nums[i])

            # Step 4: Recurse with next starting position
            backtrack(i + 1, path)

            # Step 5: Backtrack - remove nums[i]
            path.pop()

    backtrack(0, [])
    return result
```

**TypeScript Solution**:
```typescript
function subsets(nums: number[]): number[][] {
    const result: number[][] = [];

    function backtrack(start: number, path: number[]): void {
        // Step 1: Add current subset to result
        result.push([...path]);

        // Step 2: Explore choices from current position
        for (let i = start; i < nums.length; i++) {
            // Step 3: Choose to include nums[i]
            path.push(nums[i]);

            // Step 4: Recurse
            backtrack(i + 1, path);

            // Step 5: Unchoose
            path.pop();
        }
    }

    backtrack(0, []);
    return result;
}
```

**Complexity**:
- Time: O(n × 2^n) - 2^n subsets, each takes O(n) to copy
- Space: O(n) recursion depth

**Visualization**:
```
nums = [1,2,3]

          []
        /    \
      [1]     []
     /  \    /  \
  [1,2]  [1] [2]  []
  /  \   |   |    |
[1,2,3][1,2][1,3][1] [2,3][2] [3] []
```

---

### 2. Permutations (Medium)
**LeetCode**: https://leetcode.com/problems/permutations/

**Description**: Given an array `nums` of distinct integers, return all possible permutations.

**Python Solution**:
```python
def permute(nums: list[int]) -> list[list[int]]:
    """
    Build permutations by trying each unused number at each position.
    """
    result = []

    def backtrack(path, remaining):
        # Step 1: Found complete permutation
        if len(path) == len(nums):
            result.append(path[:])
            return

        # Step 2: Try each remaining number
        for i in range(len(remaining)):
            # Step 3: Choose remaining[i]
            path.append(remaining[i])

            # Step 4: Recurse with remaining numbers
            backtrack(path, remaining[:i] + remaining[i+1:])

            # Step 5: Backtrack
            path.pop()

    backtrack([], nums)
    return result
```

**Alternative using set for tracking**:
```python
def permute(nums: list[int]) -> list[list[int]]:
    result = []
    used = set()

    def backtrack(path):
        # Step 1: Complete permutation
        if len(path) == len(nums):
            result.append(path[:])
            return

        # Step 2: Try each number
        for num in nums:
            # Step 3: Skip if already used
            if num in used:
                continue

            # Step 4: Choose num
            path.append(num)
            used.add(num)

            # Step 5: Recurse
            backtrack(path)

            # Step 6: Unchoose
            path.pop()
            used.remove(num)

    backtrack([])
    return result
```

**TypeScript Solution**:
```typescript
function permute(nums: number[]): number[][] {
    const result: number[][] = [];
    const used = new Set<number>();

    function backtrack(path: number[]): void {
        // Step 1: Base case - permutation complete
        if (path.length === nums.length) {
            result.push([...path]);
            return;
        }

        // Step 2: Try each number
        for (let i = 0; i < nums.length; i++) {
            // Step 3: Skip if already in path
            if (used.has(i)) continue;

            // Step 4: Make choice
            path.push(nums[i]);
            used.add(i);

            // Step 5: Explore
            backtrack(path);

            // Step 6: Undo choice
            path.pop();
            used.delete(i);
        }
    }

    backtrack([]);
    return result;
}
```

**Complexity**:
- Time: O(n × n!) - n! permutations
- Space: O(n)

---

### 3. Combination Sum (Medium)
**LeetCode**: https://leetcode.com/problems/combination-sum/

**Description**: Given an array of distinct integers `candidates` and a target integer, return all unique combinations where the chosen numbers sum to target. Same number can be used unlimited times.

**Python Solution**:
```python
def combinationSum(candidates: list[int], target: int) -> list[list[int]]:
    """
    Backtrack with running sum.
    Allow reusing same element by not advancing start index.
    """
    result = []

    def backtrack(start, path, total):
        # Step 1: Found valid combination
        if total == target:
            result.append(path[:])
            return

        # Step 2: Exceeded target, prune this branch
        if total > target:
            return

        # Step 3: Try each candidate from start onwards
        for i in range(start, len(candidates)):
            # Step 4: Choose candidates[i]
            path.append(candidates[i])

            # Step 5: Recurse (can reuse same element, so pass i not i+1)
            backtrack(i, path, total + candidates[i])

            # Step 6: Backtrack
            path.pop()

    backtrack(0, [], 0)
    return result
```

**TypeScript Solution**:
```typescript
function combinationSum(candidates: number[], target: number): number[][] {
    const result: number[][] = [];

    function backtrack(start: number, path: number[], total: number): void {
        // Step 1: Reached target
        if (total === target) {
            result.push([...path]);
            return;
        }

        // Step 2: Pruning - exceeded target
        if (total > target) {
            return;
        }

        // Step 3: Explore choices
        for (let i = start; i < candidates.length; i++) {
            // Step 4: Include current candidate
            path.push(candidates[i]);

            // Step 5: Recurse (i not i+1 allows reuse)
            backtrack(i, path, total + candidates[i]);

            // Step 6: Remove candidate
            path.pop();
        }
    }

    backtrack(0, [], 0);
    return result;
}
```

**Complexity**:
- Time: O(n^(t/m)) where t=target, m=min candidate
- Space: O(t/m) recursion depth

---

### 4. N-Queens (Hard)
**LeetCode**: https://leetcode.com/problems/n-queens/

**Description**: Place n queens on an n×n chessboard so that no two queens attack each other. Return all distinct solutions.

**Python Solution**:
```python
def solveNQueens(n: int) -> list[list[str]]:
    """
    Place queens row by row.
    Track columns, diagonals, and anti-diagonals under attack.
    """
    result = []
    cols = set()
    diag = set()  # row - col
    anti_diag = set()  # row + col

    def backtrack(row, board):
        # Step 1: Placed all queens successfully
        if row == n:
            result.append([''.join(r) for r in board])
            return

        # Step 2: Try placing queen in each column
        for col in range(n):
            # Step 3: Check if position is under attack
            if (col in cols or
                (row - col) in diag or
                (row + col) in anti_diag):
                continue

            # Step 4: Place queen
            board[row][col] = 'Q'
            cols.add(col)
            diag.add(row - col)
            anti_diag.add(row + col)

            # Step 5: Recurse to next row
            backtrack(row + 1, board)

            # Step 6: Remove queen (backtrack)
            board[row][col] = '.'
            cols.remove(col)
            diag.remove(row - col)
            anti_diag.remove(row + col)

    # Initialize empty board
    board = [['.' for _ in range(n)] for _ in range(n)]
    backtrack(0, board)
    return result
```

**TypeScript Solution**:
```typescript
function solveNQueens(n: number): string[][] {
    const result: string[][] = [];
    const cols = new Set<number>();
    const diag = new Set<number>();
    const antiDiag = new Set<number>();

    function backtrack(row: number, board: string[][]): void {
        // Step 1: All queens placed
        if (row === n) {
            result.push(board.map(r => r.join('')));
            return;
        }

        // Step 2: Try each column in current row
        for (let col = 0; col < n; col++) {
            // Step 3: Check if safe to place queen
            if (cols.has(col) ||
                diag.has(row - col) ||
                antiDiag.has(row + col)) {
                continue;
            }

            // Step 4: Place queen
            board[row][col] = 'Q';
            cols.add(col);
            diag.add(row - col);
            antiDiag.add(row + col);

            // Step 5: Move to next row
            backtrack(row + 1, board);

            // Step 6: Backtrack
            board[row][col] = '.';
            cols.delete(col);
            diag.delete(row - col);
            antiDiag.delete(row + col);
        }
    }

    // Create initial board
    const board = Array(n).fill(0).map(() => Array(n).fill('.'));
    backtrack(0, board);
    return result;
}
```

**Complexity**:
- Time: O(n!)
- Space: O(n²)

**Diagonal Explanation**:
```
For n=4:
     0   1   2   3
   +---+---+---+---+
0  | Q |   |   |   |  diag: 0-0=0,  anti: 0+0=0
   +---+---+---+---+
1  |   |   | Q |   |  diag: 1-2=-1, anti: 1+2=3
   +---+---+---+---+
2  |   | Q |   |   |  diag: 2-1=1,  anti: 2+1=3 (conflict!)
   +---+---+---+---+
3  |   |   |   | Q |  diag: 3-3=0,  anti: 3+3=6
   +---+---+---+---+

Diagonal (top-left to bottom-right): row - col = constant
Anti-diagonal (top-right to bottom-left): row + col = constant
```

---

### 5. Letter Combinations of a Phone Number (Medium)
**LeetCode**: https://leetcode.com/problems/letter-combinations-of-a-phone-number/

**Description**: Given a string containing digits from 2-9, return all possible letter combinations that the number could represent (like old phone keypads).

**Python Solution**:
```python
def letterCombinations(digits: str) -> list[str]:
    """
    Backtrack through digits, trying each letter for current digit.
    """
    if not digits:
        return []

    # Step 1: Map digits to letters
    phone = {
        '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
        '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
    }

    result = []

    def backtrack(index, path):
        # Step 2: Built complete combination
        if index == len(digits):
            result.append(''.join(path))
            return

        # Step 3: Get letters for current digit
        letters = phone[digits[index]]

        # Step 4: Try each letter
        for letter in letters:
            # Step 5: Choose letter
            path.append(letter)

            # Step 6: Move to next digit
            backtrack(index + 1, path)

            # Step 7: Backtrack
            path.pop()

    backtrack(0, [])
    return result
```

**TypeScript Solution**:
```typescript
function letterCombinations(digits: string): string[] {
    if (!digits) return [];

    // Step 1: Phone mapping
    const phone: Record<string, string> = {
        '2': 'abc', '3': 'def', '4': 'ghi', '5': 'jkl',
        '6': 'mno', '7': 'pqrs', '8': 'tuv', '9': 'wxyz'
    };

    const result: string[] = [];

    function backtrack(index: number, path: string[]): void {
        // Step 2: Combination complete
        if (index === digits.length) {
            result.push(path.join(''));
            return;
        }

        // Step 3: Get possible letters
        const letters = phone[digits[index]];

        // Step 4: Try each letter
        for (const letter of letters) {
            // Step 5: Add letter
            path.push(letter);

            // Step 6: Recurse
            backtrack(index + 1, path);

            // Step 7: Remove letter
            path.pop();
        }
    }

    backtrack(0, []);
    return result;
}
```

**Complexity**:
- Time: O(4^n) worst case (digit 7 and 9 have 4 letters)
- Space: O(n)

---

### 6. Palindrome Partitioning (Medium)
**LeetCode**: https://leetcode.com/problems/palindrome-partitioning/

**Description**: Given a string, partition it such that every substring is a palindrome. Return all possible palindrome partitioning.

**Python Solution**:
```python
def partition(s: str) -> list[list[str]]:
    """
    Try every possible partition, check if each part is palindrome.
    """
    result = []

    def is_palindrome(string):
        return string == string[::-1]

    def backtrack(start, path):
        # Step 1: Reached end of string
        if start == len(s):
            result.append(path[:])
            return

        # Step 2: Try all possible end positions
        for end in range(start + 1, len(s) + 1):
            substring = s[start:end]

            # Step 3: Only proceed if current part is palindrome
            if is_palindrome(substring):
                # Step 4: Add palindrome to path
                path.append(substring)

                # Step 5: Continue partitioning rest of string
                backtrack(end, path)

                # Step 6: Backtrack
                path.pop()

    backtrack(0, [])
    return result
```

**TypeScript Solution**:
```typescript
function partition(s: string): string[][] {
    const result: string[][] = [];

    function isPalindrome(str: string): boolean {
        let left = 0, right = str.length - 1;
        while (left < right) {
            if (str[left] !== str[right]) return false;
            left++;
            right--;
        }
        return true;
    }

    function backtrack(start: number, path: string[]): void {
        // Step 1: Partitioned entire string
        if (start === s.length) {
            result.push([...path]);
            return;
        }

        // Step 2: Try different partition points
        for (let end = start + 1; end <= s.length; end++) {
            const substring = s.slice(start, end);

            // Step 3: Check if valid palindrome
            if (isPalindrome(substring)) {
                // Step 4: Add to current partition
                path.push(substring);

                // Step 5: Recurse on remaining string
                backtrack(end, path);

                // Step 6: Remove partition
                path.pop();
            }
        }
    }

    backtrack(0, []);
    return result;
}
```

**Complexity**:
- Time: O(n × 2^n)
- Space: O(n)

---

### 7. Generate Parentheses (Medium)
**LeetCode**: https://leetcode.com/problems/generate-parentheses/

**Description**: Given n pairs of parentheses, write a function to generate all combinations of well-formed parentheses.

**Python Solution**:
```python
def generateParenthesis(n: int) -> list[str]:
    """
    Constraint: Only add '(' if open < n, only add ')' if close < open.
    """
    result = []

    def backtrack(path, open_count, close_count):
        # Step 1: Used all parentheses
        if len(path) == 2 * n:
            result.append(''.join(path))
            return

        # Step 2: Can add opening parenthesis
        if open_count < n:
            path.append('(')
            backtrack(path, open_count + 1, close_count)
            path.pop()

        # Step 3: Can add closing parenthesis (must have unmatched '(')
        if close_count < open_count:
            path.append(')')
            backtrack(path, open_count, close_count + 1)
            path.pop()

    backtrack([], 0, 0)
    return result
```

**TypeScript Solution**:
```typescript
function generateParenthesis(n: number): string[] {
    const result: string[] = [];

    function backtrack(path: string[], open: number, close: number): void {
        // Step 1: Combination complete
        if (path.length === 2 * n) {
            result.push(path.join(''));
            return;
        }

        // Step 2: Add '(' if available
        if (open < n) {
            path.push('(');
            backtrack(path, open + 1, close);
            path.pop();
        }

        // Step 3: Add ')' if it won't make invalid
        if (close < open) {
            path.push(')');
            backtrack(path, open, close + 1);
            path.pop();
        }
    }

    backtrack([], 0, 0);
    return result;
}
```

**Complexity**:
- Time: O(4^n / √n) - Catalan number
- Space: O(n)

**Visualization for n=3**:
```
                      ""
                    /    \
                  (
                /   \
              ((     ()
             /  \    |
           (((  (()  ()(
           |    / \   |
         ((() (()) ()((
         |    |    |
       (())()(())()()
```

---

### 8. Sudoku Solver (Hard)
**LeetCode**: https://leetcode.com/problems/sudoku-solver/

**Description**: Write a program to solve a Sudoku puzzle by filling the empty cells. A sudoku solution must satisfy all constraints.

**Python Solution**:
```python
def solveSudoku(board: list[list[str]]) -> None:
    """
    Try digits 1-9 in each empty cell.
    Backtrack if no valid digit found.
    """
    def is_valid(row, col, num):
        # Step 1: Check row
        if num in board[row]:
            return False

        # Step 2: Check column
        if num in [board[r][col] for r in range(9)]:
            return False

        # Step 3: Check 3x3 box
        box_row, box_col = 3 * (row // 3), 3 * (col // 3)
        for r in range(box_row, box_row + 3):
            for c in range(box_col, box_col + 3):
                if board[r][c] == num:
                    return False

        return True

    def backtrack():
        # Step 4: Find next empty cell
        for row in range(9):
            for col in range(9):
                if board[row][col] == '.':
                    # Step 5: Try digits 1-9
                    for num in '123456789':
                        if is_valid(row, col, num):
                            # Step 6: Place digit
                            board[row][col] = num

                            # Step 7: Recurse
                            if backtrack():
                                return True

                            # Step 8: Backtrack
                            board[row][col] = '.'

                    # Step 9: No valid digit, trigger backtrack
                    return False

        # Step 10: No empty cells, puzzle solved
        return True

    backtrack()
```

**TypeScript Solution**:
```typescript
function solveSudoku(board: string[][]): void {
    function isValid(row: number, col: number, num: string): boolean {
        // Step 1: Check row
        if (board[row].includes(num)) return false;

        // Step 2: Check column
        for (let r = 0; r < 9; r++) {
            if (board[r][col] === num) return false;
        }

        // Step 3: Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if (board[r][c] === num) return false;
            }
        }

        return true;
    }

    function backtrack(): boolean {
        // Step 4: Scan for empty cell
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === '.') {
                    // Step 5: Try each digit
                    for (let num = 1; num <= 9; num++) {
                        const digit = num.toString();

                        if (isValid(row, col, digit)) {
                            // Step 6: Choose
                            board[row][col] = digit;

                            // Step 7: Recurse
                            if (backtrack()) return true;

                            // Step 8: Unchoose
                            board[row][col] = '.';
                        }
                    }

                    // Step 9: No solution from this state
                    return false;
                }
            }
        }

        // Step 10: Filled all cells successfully
        return true;
    }

    backtrack();
}
```

**Complexity**:
- Time: O(9^(empty cells)) worst case
- Space: O(n) for recursion

---

### 9. Permutations II (Medium)
**LeetCode**: https://leetcode.com/problems/permutations-ii/

**Description**: Given a collection of numbers that might contain duplicates, return all possible unique permutations.

**Python Solution**:
```python
def permuteUnique(nums: list[int]) -> list[list[int]]:
    """
    Sort first, then skip duplicates at same recursion level.
    """
    result = []
    nums.sort()  # Step 1: Sort to group duplicates

    def backtrack(path, used):
        # Step 2: Found complete permutation
        if len(path) == len(nums):
            result.append(path[:])
            return

        # Step 3: Try each number
        for i in range(len(nums)):
            # Step 4: Skip if already used
            if used[i]:
                continue

            # Step 5: Skip duplicate at same level
            # If current number same as previous and previous not used,
            # it means we already explored this branch
            if i > 0 and nums[i] == nums[i-1] and not used[i-1]:
                continue

            # Step 6: Choose nums[i]
            path.append(nums[i])
            used[i] = True

            # Step 7: Recurse
            backtrack(path, used)

            # Step 8: Backtrack
            path.pop()
            used[i] = False

    backtrack([], [False] * len(nums))
    return result
```

**TypeScript Solution**:
```typescript
function permuteUnique(nums: number[]): number[][] {
    const result: number[][] = [];
    nums.sort((a, b) => a - b);  // Step 1: Sort

    function backtrack(path: number[], used: boolean[]): void {
        // Step 2: Complete permutation
        if (path.length === nums.length) {
            result.push([...path]);
            return;
        }

        // Step 3: Try each position
        for (let i = 0; i < nums.length; i++) {
            // Step 4: Skip used numbers
            if (used[i]) continue;

            // Step 5: Skip duplicates at same recursion level
            if (i > 0 && nums[i] === nums[i-1] && !used[i-1]) {
                continue;
            }

            // Step 6: Make choice
            path.push(nums[i]);
            used[i] = true;

            // Step 7: Explore
            backtrack(path, used);

            // Step 8: Undo
            path.pop();
            used[i] = false;
        }
    }

    backtrack([], Array(nums.length).fill(false));
    return result;
}
```

**Complexity**:
- Time: O(n × n!)
- Space: O(n)

---

### 10. Combination Sum II (Medium)
**LeetCode**: https://leetcode.com/problems/combination-sum-ii/

**Description**: Given a collection of candidate numbers and a target, find all unique combinations where candidates sum to target. Each number can only be used once.

**Python Solution**:
```python
def combinationSum2(candidates: list[int], target: int) -> list[list[int]]:
    """
    Sort to handle duplicates.
    Skip duplicate values at same recursion level.
    """
    result = []
    candidates.sort()  # Step 1: Sort for duplicate handling

    def backtrack(start, path, total):
        # Step 2: Found valid combination
        if total == target:
            result.append(path[:])
            return

        # Step 3: Exceeded target, prune
        if total > target:
            return

        # Step 4: Try each candidate from start
        for i in range(start, len(candidates)):
            # Step 5: Skip duplicates at same level
            if i > start and candidates[i] == candidates[i-1]:
                continue

            # Step 6: Choose candidates[i]
            path.append(candidates[i])

            # Step 7: Recurse (i+1 because can't reuse)
            backtrack(i + 1, path, total + candidates[i])

            # Step 8: Backtrack
            path.pop()

    backtrack(0, [], 0)
    return result
```

**TypeScript Solution**:
```typescript
function combinationSum2(candidates: number[], target: number): number[][] {
    const result: number[][] = [];
    candidates.sort((a, b) => a - b);

    function backtrack(start: number, path: number[], total: number): void {
        // Step 1: Target reached
        if (total === target) {
            result.push([...path]);
            return;
        }

        // Step 2: Exceeded, prune
        if (total > target) return;

        // Step 3: Explore candidates
        for (let i = start; i < candidates.length; i++) {
            // Step 4: Avoid duplicates at same level
            if (i > start && candidates[i] === candidates[i-1]) {
                continue;
            }

            // Step 5: Include candidate
            path.push(candidates[i]);

            // Step 6: Move to next
            backtrack(i + 1, path, total + candidates[i]);

            // Step 7: Remove
            path.pop();
        }
    }

    backtrack(0, [], 0);
    return result;
}
```

**Complexity**:
- Time: O(2^n)
- Space: O(n)

---

### 11. Restore IP Addresses (Medium)
**LeetCode**: https://leetcode.com/problems/restore-ip-addresses/

**Description**: Given a string containing only digits, return all possible valid IP addresses that can be obtained from the string.

**Python Solution**:
```python
def restoreIpAddresses(s: str) -> list[str]:
    """
    Try partitioning into 4 parts, each valid (0-255, no leading zeros).
    """
    result = []

    def is_valid(segment):
        # Step 1: Check length
        if len(segment) > 3:
            return False

        # Step 2: No leading zeros (except "0" itself)
        if len(segment) > 1 and segment[0] == '0':
            return False

        # Step 3: Check range 0-255
        return int(segment) <= 255

    def backtrack(start, parts):
        # Step 4: Have 4 parts and used all characters
        if len(parts) == 4:
            if start == len(s):
                result.append('.'.join(parts))
            return

        # Step 5: Already have 4 parts but string not finished
        if len(parts) == 4:
            return

        # Step 6: Try different lengths for next part (1-3 digits)
        for length in range(1, 4):
            if start + length > len(s):
                break

            segment = s[start:start + length]

            # Step 7: Check if valid IP segment
            if is_valid(segment):
                # Step 8: Add segment
                parts.append(segment)

                # Step 9: Recurse
                backtrack(start + length, parts)

                # Step 10: Backtrack
                parts.pop()

    backtrack(0, [])
    return result
```

**TypeScript Solution**:
```typescript
function restoreIpAddresses(s: string): string[] {
    const result: string[] = [];

    function isValid(segment: string): boolean {
        // Step 1: Length check
        if (segment.length > 3) return false;

        // Step 2: No leading zero
        if (segment.length > 1 && segment[0] === '0') return false;

        // Step 3: Range check
        return parseInt(segment) <= 255;
    }

    function backtrack(start: number, parts: string[]): void {
        // Step 4: Valid IP formed
        if (parts.length === 4) {
            if (start === s.length) {
                result.push(parts.join('.'));
            }
            return;
        }

        // Step 5: Try 1-3 digit segments
        for (let len = 1; len <= 3; len++) {
            if (start + len > s.length) break;

            const segment = s.slice(start, start + len);

            // Step 6: Validate segment
            if (isValid(segment)) {
                // Step 7: Add part
                parts.push(segment);

                // Step 8: Continue
                backtrack(start + len, parts);

                // Step 9: Remove part
                parts.pop();
            }
        }
    }

    backtrack(0, []);
    return result;
}
```

**Complexity**:
- Time: O(1) - at most 3^4 combinations
- Space: O(1)

---

### 12. Word Break II (Hard)
**LeetCode**: https://leetcode.com/problems/word-break-ii/

**Description**: Given a string and a dictionary, add spaces to construct sentences where each word is in the dictionary. Return all such possible sentences.

**Python Solution**:
```python
def wordBreak(s: str, wordDict: list[str]) -> list[str]:
    """
    Backtrack with memoization.
    Try matching each word at current position.
    """
    word_set = set(wordDict)
    memo = {}

    def backtrack(start):
        # Step 1: Check memo
        if start in memo:
            return memo[start]

        # Step 2: Reached end of string
        if start == len(s):
            return ['']

        sentences = []

        # Step 3: Try all possible words starting at current position
        for end in range(start + 1, len(s) + 1):
            word = s[start:end]

            # Step 4: Check if valid word
            if word in word_set:
                # Step 5: Get all sentences from rest of string
                rest_sentences = backtrack(end)

                # Step 6: Combine current word with each sentence
                for sentence in rest_sentences:
                    if sentence:
                        sentences.append(word + ' ' + sentence)
                    else:
                        sentences.append(word)

        # Step 7: Memoize and return
        memo[start] = sentences
        return sentences

    return backtrack(0)
```

**TypeScript Solution**:
```typescript
function wordBreak(s: string, wordDict: string[]): string[] {
    const wordSet = new Set(wordDict);
    const memo = new Map<number, string[]>();

    function backtrack(start: number): string[] {
        // Step 1: Return cached result
        if (memo.has(start)) {
            return memo.get(start)!;
        }

        // Step 2: Base case - end of string
        if (start === s.length) {
            return [''];
        }

        const sentences: string[] = [];

        // Step 3: Try each possible word
        for (let end = start + 1; end <= s.length; end++) {
            const word = s.slice(start, end);

            // Step 4: Word exists in dictionary
            if (wordSet.has(word)) {
                // Step 5: Get remaining sentences
                const restSentences = backtrack(end);

                // Step 6: Build complete sentences
                for (const sentence of restSentences) {
                    sentences.push(sentence ? `${word} ${sentence}` : word);
                }
            }
        }

        // Step 7: Cache result
        memo.set(start, sentences);
        return sentences;
    }

    return backtrack(0);
}
```

**Complexity**:
- Time: O(n × 2^n) with memoization
- Space: O(n × 2^n)

---

### 13. Subsets II (Medium)
**LeetCode**: https://leetcode.com/problems/subsets-ii/

**Description**: Given an integer array that may contain duplicates, return all possible subsets without duplicate subsets.

**Python Solution**:
```python
def subsetsWithDup(nums: list[int]) -> list[list[int]]:
    """
    Sort first, skip duplicates at same recursion level.
    """
    result = []
    nums.sort()  # Step 1: Sort to group duplicates

    def backtrack(start, path):
        # Step 2: Add current subset
        result.append(path[:])

        # Step 3: Try adding each remaining element
        for i in range(start, len(nums)):
            # Step 4: Skip duplicate elements at same level
            if i > start and nums[i] == nums[i-1]:
                continue

            # Step 5: Include nums[i]
            path.append(nums[i])

            # Step 6: Recurse
            backtrack(i + 1, path)

            # Step 7: Backtrack
            path.pop()

    backtrack(0, [])
    return result
```

**TypeScript Solution**:
```typescript
function subsetsWithDup(nums: number[]): number[][] {
    const result: number[][] = [];
    nums.sort((a, b) => a - b);

    function backtrack(start: number, path: number[]): void {
        // Step 1: Current subset is valid
        result.push([...path]);

        // Step 2: Explore further
        for (let i = start; i < nums.length; i++) {
            // Step 3: Skip duplicates
            if (i > start && nums[i] === nums[i-1]) {
                continue;
            }

            // Step 4: Choose
            path.push(nums[i]);

            // Step 5: Recurse
            backtrack(i + 1, path);

            // Step 6: Unchoose
            path.pop();
        }
    }

    backtrack(0, []);
    return result;
}
```

**Complexity**:
- Time: O(n × 2^n)
- Space: O(n)

---

### 14. Expression Add Operators (Hard)
**LeetCode**: https://leetcode.com/problems/expression-add-operators/

**Description**: Given a string of digits and a target, return all possible expressions formed by adding operators `+`, `-`, `*` that evaluate to target.

**Python Solution**:
```python
def addOperators(num: str, target: int) -> list[str]:
    """
    Backtrack trying +, -, * at each position.
    Track previous value for handling multiplication precedence.
    """
    result = []

    def backtrack(index, path, current_val, prev_val):
        # Step 1: Processed all digits
        if index == len(num):
            if current_val == target:
                result.append(path)
            return

        # Step 2: Try different number lengths
        for i in range(index, len(num)):
            # Step 3: Avoid leading zeros (except "0" itself)
            if i > index and num[index] == '0':
                break

            num_str = num[index:i+1]
            num_val = int(num_str)

            # Step 4: First number, no operator needed
            if index == 0:
                backtrack(i + 1, num_str, num_val, num_val)
            else:
                # Step 5: Try addition
                backtrack(i + 1, path + '+' + num_str,
                         current_val + num_val, num_val)

                # Step 6: Try subtraction
                backtrack(i + 1, path + '-' + num_str,
                         current_val - num_val, -num_val)

                # Step 7: Try multiplication (handle precedence)
                # Undo last operation, then multiply
                backtrack(i + 1, path + '*' + num_str,
                         current_val - prev_val + prev_val * num_val,
                         prev_val * num_val)

    backtrack(0, '', 0, 0)
    return result
```

**TypeScript Solution**:
```typescript
function addOperators(num: string, target: number): string[] {
    const result: string[] = [];

    function backtrack(
        index: number,
        path: string,
        currentVal: number,
        prevVal: number
    ): void {
        // Step 1: All digits used
        if (index === num.length) {
            if (currentVal === target) {
                result.push(path);
            }
            return;
        }

        // Step 2: Try different operand lengths
        for (let i = index; i < num.length; i++) {
            // Step 3: No leading zeros
            if (i > index && num[index] === '0') break;

            const numStr = num.slice(index, i + 1);
            const numVal = parseInt(numStr);

            // Step 4: First number
            if (index === 0) {
                backtrack(i + 1, numStr, numVal, numVal);
            } else {
                // Step 5: Addition
                backtrack(
                    i + 1,
                    `${path}+${numStr}`,
                    currentVal + numVal,
                    numVal
                );

                // Step 6: Subtraction
                backtrack(
                    i + 1,
                    `${path}-${numStr}`,
                    currentVal - numVal,
                    -numVal
                );

                // Step 7: Multiplication
                backtrack(
                    i + 1,
                    `${path}*${numStr}`,
                    currentVal - prevVal + prevVal * numVal,
                    prevVal * numVal
                );
            }
        }
    }

    backtrack(0, '', 0, 0);
    return result;
}
```

**Complexity**:
- Time: O(4^n)
- Space: O(n)

---

### 15. Beautiful Arrangement (Medium)
**LeetCode**: https://leetcode.com/problems/beautiful-arrangement/

**Description**: Suppose you have n integers from 1 to n. Count how many beautiful arrangements you can construct, where a beautiful arrangement is one where for every position i, either the number at position i is divisible by i or i is divisible by the number.

**Python Solution**:
```python
def countArrangement(n: int) -> int:
    """
    Backtrack building arrangement position by position.
    Track which numbers are used.
    """
    count = 0
    used = [False] * (n + 1)

    def backtrack(pos):
        nonlocal count

        # Step 1: Placed all numbers successfully
        if pos > n:
            count += 1
            return

        # Step 2: Try each number
        for num in range(1, n + 1):
            # Step 3: Skip if already used
            if used[num]:
                continue

            # Step 4: Check beautiful condition
            if num % pos == 0 or pos % num == 0:
                # Step 5: Place number
                used[num] = True

                # Step 6: Recurse to next position
                backtrack(pos + 1)

                # Step 7: Backtrack
                used[num] = False

    backtrack(1)
    return count
```

**TypeScript Solution**:
```typescript
function countArrangement(n: number): number {
    let count = 0;
    const used = Array(n + 1).fill(false);

    function backtrack(pos: number): void {
        // Step 1: Complete arrangement found
        if (pos > n) {
            count++;
            return;
        }

        // Step 2: Try placing each number
        for (let num = 1; num <= n; num++) {
            // Step 3: Skip used numbers
            if (used[num]) continue;

            // Step 4: Check divisibility condition
            if (num % pos === 0 || pos % num === 0) {
                // Step 5: Use this number
                used[num] = true;

                // Step 6: Move to next position
                backtrack(pos + 1);

                // Step 7: Unuse
                used[num] = false;
            }
        }
    }

    backtrack(1);
    return count;
}
```

**Complexity**:
- Time: O(k) where k is number of valid permutations
- Space: O(n)

---

### 16. Word Search (Medium)
**LeetCode**: https://leetcode.com/problems/word-search/

**Description**: Given an m x n grid of characters and a string word, return true if word exists in the grid. The word can be constructed from letters sequentially adjacent (horizontally or vertically), and the same letter cell may not be used more than once.

**Python Solution**:
```python
def exist(board: list[list[str]], word: str) -> bool:
    """
    DFS backtracking from each cell.
    Mark visited cells temporarily to avoid reuse.

    Decision tree visualization for board = [["A","B"],["C","D"]], word = "ABCD":

           Start at 'A'(0,0)
                 │
          ┌──────┴──────┐
          ▼              ▼
       Right to 'B'   Down to 'C'
       (0,1) ✓        (1,0) ✗
          │
       Down to 'D' ✗ (word[2]='C' but found 'D')

       BACKTRACK and try Down from 'B'
          │
       (1,1) = 'D' ✗ (word[2]='C' but found 'D')

    No valid path found!
    """
    rows, cols = len(board), len(board[0])

    def backtrack(r, c, index):
        # Step 1: Found complete word
        if index == len(word):
            return True

        # Step 2: Check boundaries
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            board[r][c] != word[index] or board[r][c] == '#'):
            return False

        # Step 3: Mark cell as visited
        temp = board[r][c]
        board[r][c] = '#'

        # Step 4: Explore all 4 directions
        found = (backtrack(r + 1, c, index + 1) or  # Down
                 backtrack(r - 1, c, index + 1) or  # Up
                 backtrack(r, c + 1, index + 1) or  # Right
                 backtrack(r, c - 1, index + 1))    # Left

        # Step 5: Restore cell (backtrack)
        board[r][c] = temp

        return found

    # Step 6: Try starting from each cell
    for r in range(rows):
        for c in range(cols):
            if backtrack(r, c, 0):
                return True

    return False
```

**TypeScript Solution**:
```typescript
function exist(board: string[][], word: string): boolean {
    const rows = board.length;
    const cols = board[0].length;

    function backtrack(r: number, c: number, index: number): boolean {
        // Step 1: Matched entire word
        if (index === word.length) return true;

        // Step 2: Boundary and character check
        if (r < 0 || r >= rows || c < 0 || c >= cols ||
            board[r][c] !== word[index] || board[r][c] === '#') {
            return false;
        }

        // Step 3: Mark visited
        const temp = board[r][c];
        board[r][c] = '#';

        // Step 4: Try all 4 directions
        const found = (
            backtrack(r + 1, c, index + 1) ||
            backtrack(r - 1, c, index + 1) ||
            backtrack(r, c + 1, index + 1) ||
            backtrack(r, c - 1, index + 1)
        );

        // Step 5: Unmark (backtrack)
        board[r][c] = temp;

        return found;
    }

    // Step 6: Try each starting position
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (backtrack(r, c, 0)) return true;
        }
    }

    return false;
}
```

**Complexity**:
- Time: O(m × n × 4^L) where L is word length
- Space: O(L) for recursion stack

**Visualization**:
```
Board: [["A","B","C","E"],
        ["S","F","C","S"],
        ["A","D","E","E"]]
Word: "ABCCED"

Search path visualization:
Step 1: Find 'A' at (0,0)
┌───┬───┬───┬───┐
│ A*│ B │ C │ E │  * = current
├───┼───┼───┼───┤
│ S │ F │ C │ S │
├───┼───┼───┼───┤
│ A │ D │ E │ E │
└───┴───┴───┴───┘

Step 2: Move right to 'B' at (0,1)
┌───┬───┬───┬───┐
│ # │ B*│ C │ E │  # = visited
├───┼───┼───┼───┤
│ S │ F │ C │ S │
├───┼───┼───┼───┤
│ A │ D │ E │ E │
└───┴───┴───┴───┘

Step 3-6: Continue path...
┌───┬───┬───┬───┐
│ # │ # │ # │ E*│
├───┼───┼───┼───┤
│ S │ F │ # │ S │
├───┼───┼───┼───┤
│ A │ D │ # │ E │
└───┴───┴───┴───┘
Path: A→B→C→C→E→D ✓
```

---

### 17. Combination Sum III (Medium)
**LeetCode**: https://leetcode.com/problems/combination-sum-iii/

**Description**: Find all valid combinations of k numbers that sum to n where only numbers 1-9 are used and each number is used at most once.

**Python Solution**:
```python
def combinationSum3(k: int, n: int) -> list[list[int]]:
    """
    Backtrack with constraints:
    - Exactly k numbers
    - Sum equals n
    - Use digits 1-9 only once

    Decision tree for k=3, n=9:

                        []
              ┌─────────┼─────────┐
              │         │         │
             [1]       [2]       [3]
            / | \       |         |
          [12][13][14] [23]     [34]
           |    |       |         |
         [123][124]   [234]     [345]
          sum=6 sum=7  sum=9✓   sum=12✗
           ✗     ✗              PRUNE!

    Valid: [2,3,4]
    """
    result = []

    def backtrack(start, path, total):
        # Step 1: Found valid combination
        if len(path) == k and total == n:
            result.append(path[:])
            return

        # Step 2: Pruning conditions
        if len(path) >= k or total >= n:
            return

        # Step 3: Try digits from start to 9
        for num in range(start, 10):
            # Step 4: Early pruning - if adding smallest remaining nums
            # still can't reach n, stop
            remaining_slots = k - len(path)
            min_sum = sum(range(num, num + remaining_slots))
            if total + min_sum > n:
                break

            # Step 5: Choose num
            path.append(num)

            # Step 6: Recurse
            backtrack(num + 1, path, total + num)

            # Step 7: Backtrack
            path.pop()

    backtrack(1, [], 0)
    return result
```

**TypeScript Solution**:
```typescript
function combinationSum3(k: number, n: number): number[][] {
    const result: number[][] = [];

    function backtrack(start: number, path: number[], total: number): void {
        // Step 1: Valid combination found
        if (path.length === k && total === n) {
            result.push([...path]);
            return;
        }

        // Step 2: Pruning
        if (path.length >= k || total >= n) return;

        // Step 3: Try each digit
        for (let num = start; num <= 9; num++) {
            // Step 4: Optimized pruning
            const remainingSlots = k - path.length;
            let minSum = 0;
            for (let i = 0; i < remainingSlots; i++) {
                minSum += num + i;
            }
            if (total + minSum > n) break;

            // Step 5: Add digit
            path.push(num);

            // Step 6: Explore
            backtrack(num + 1, path, total + num);

            // Step 7: Remove
            path.pop();
        }
    }

    backtrack(1, [], 0);
    return result;
}
```

**Complexity**:
- Time: O(C(9,k)) = O(9!/(k!(9-k)!))
- Space: O(k) for recursion

**Visualization**:
```
k=3, n=7

Level 0:                    []
                    ┌───────┼───────┐
Level 1:          [1]      [2]     [3]...
              ┌────┼────┐   |
Level 2:    [1,2] [1,3] [1,4]  [2,3]
              |     |     |      |
Level 3:   [1,2,4][1,2,5][1,3,4][2,3,4]
           sum=7✓ sum=8✗ sum=8✗ sum=9✗

Result: [[1,2,4]]

Pruning visualization:
At [1,2]: total=3, need 4 more
  - Try 3: 3+4+5=12>7, but path not full yet
  - Try 4: total=7, len=3 ✓
  - Try 5: total=8 > n, PRUNE!
```

---

### 18. Gray Code (Medium)
**LeetCode**: https://leetcode.com/problems/gray-code/

**Description**: An n-bit gray code sequence is a sequence of 2^n integers where every adjacent pair differs by exactly one bit and the first and last integers also differ by exactly one bit.

**Python Solution**:
```python
def grayCode(n: int) -> list[int]:
    """
    Backtracking approach: Build sequence ensuring each step changes 1 bit.

    For n=2, decision tree:

         0 (00)
           │
      ┌────┴────┐
      │         │
     1(01)    2(10)
      │         │
    ┌─┴─┐     ┌─┴─┐
   3(11)✓   3(11)✓
    │         │
   2(10)    0(00)
   DONE!    CYCLE!

    Sequences: [0,1,3,2] or [0,2,3,1]
    """
    result = [0]
    visited = {0}

    def backtrack():
        # Step 1: Generated all 2^n codes
        if len(result) == (1 << n):
            return True

        current = result[-1]

        # Step 2: Try flipping each bit
        for i in range(n):
            # Step 3: Flip bit i
            next_code = current ^ (1 << i)

            # Step 4: Check if not visited
            if next_code not in visited:
                # Step 5: Add to sequence
                result.append(next_code)
                visited.add(next_code)

                # Step 6: Recurse
                if backtrack():
                    return True

                # Step 7: Backtrack
                result.pop()
                visited.remove(next_code)

        return False

    backtrack()
    return result

# Optimized iterative solution (more efficient):
def grayCodeIterative(n: int) -> list[int]:
    """
    Pattern: G(n) = [0+G(n-1), 2^(n-1)+reverse(G(n-1))]

    n=1: [0, 1]
    n=2: [0, 1] + [3, 2] = [0, 1, 3, 2]
         └─┘    └──┘
         G(1)  2^1+reverse(G(1))
    """
    result = [0]
    for i in range(n):
        # Add reversed sequence with high bit set
        size = len(result)
        for j in range(size - 1, -1, -1):
            result.append(result[j] | (1 << i))
    return result
```

**TypeScript Solution**:
```typescript
function grayCode(n: number): number[] {
    const result: number[] = [0];

    // Iterative approach (most efficient)
    for (let i = 0; i < n; i++) {
        const size = result.length;
        // Add reversed sequence with bit i set
        for (let j = size - 1; j >= 0; j--) {
            result.push(result[j] | (1 << i));
        }
    }

    return result;
}

// Backtracking approach:
function grayCodeBacktrack(n: number): number[] {
    const result: number[] = [0];
    const visited = new Set<number>([0]);

    function backtrack(): boolean {
        // Step 1: Complete sequence
        if (result.length === (1 << n)) return true;

        const current = result[result.length - 1];

        // Step 2: Try flipping each bit
        for (let i = 0; i < n; i++) {
            // Step 3: Generate next code
            const nextCode = current ^ (1 << i);

            // Step 4: If unvisited
            if (!visited.has(nextCode)) {
                // Step 5: Choose
                result.push(nextCode);
                visited.add(nextCode);

                // Step 6: Recurse
                if (backtrack()) return true;

                // Step 7: Unchoose
                result.pop();
                visited.delete(nextCode);
            }
        }

        return false;
    }

    backtrack();
    return result;
}
```

**Complexity**:
- Time: O(2^n) - must generate all codes
- Space: O(2^n) for result

**Visualization**:
```
n=3 Gray Code generation (iterative method):

Step 0: [0]
        Binary: [000]

Step 1: Mirror and add bit 0
        [0] → [0, 1]
        Binary: [000, 001]
              Original ↑ ↑ Mirrored with bit 0

Step 2: Mirror and add bit 1
        [0, 1] → [0, 1, 3, 2]
        Binary: [000, 001, 011, 010]
                Original ↑ ↑ Reversed with bit 1

Step 3: Mirror and add bit 2
        [0,1,3,2] → [0,1,3,2,6,7,5,4]
        Binary: [000,001,011,010,110,111,101,100]
                Original         ↑ Reversed with bit 2

Bit differences (each adjacent pair differs by 1 bit):
0→1: 000→001 (bit 0 changes)
1→3: 001→011 (bit 1 changes)
3→2: 011→010 (bit 0 changes)
2→6: 010→110 (bit 2 changes)
6→7: 110→111 (bit 0 changes)
7→5: 111→101 (bit 1 changes)
5→4: 101→100 (bit 0 changes)
```

---

### 19. Additive Number (Medium)
**LeetCode**: https://leetcode.com/problems/additive-number/

**Description**: An additive number is a string whose digits can form additive sequence. Valid additive sequence should contain at least three numbers where num[i+2] = num[i] + num[i+1].

**Python Solution**:
```python
def isAdditiveNumber(num: str) -> bool:
    """
    Try all possible first two numbers, then check if rest forms sequence.

    Decision tree for "112358":

              "112358"
         ┌───────┼───────┐
    First="1" "11" "112"
       │
    Second="1" "12" "123"...
       │
    "1"+"1"="2" ✓
       │
    Check: "2358" starts with "2" ✓
       │
    "1"+"2"="3" ✓
       │
    Check: "358" starts with "3" ✓
       │
    "2"+"3"="5" ✓
       │
    Check: "58" starts with "5" ✓
       │
    "3"+"5"="8" ✓
       │
    Check: "8" starts with "8" ✓, reached end!
    VALID! ✓
    """
    n = len(num)

    def is_valid(num1, num2, remaining):
        # Step 1: No more digits to check
        if not remaining:
            return True

        # Step 2: Calculate next number
        next_num = num1 + num2
        next_str = str(next_num)

        # Step 3: Check if remaining starts with next_num
        if not remaining.startswith(next_str):
            return False

        # Step 4: Recurse with updated numbers
        return is_valid(num2, next_num, remaining[len(next_str):])

    # Step 5: Try all possible first two numbers
    for i in range(1, n):
        # Skip leading zeros
        if num[0] == '0' and i > 1:
            break

        for j in range(i + 1, n):
            # Skip leading zeros
            if num[i] == '0' and j > i + 1:
                break

            num1 = int(num[:i])
            num2 = int(num[i:j])

            # Step 6: Check if valid sequence
            if is_valid(num1, num2, num[j:]):
                return True

    return False
```

**TypeScript Solution**:
```typescript
function isAdditiveNumber(num: string): boolean {
    const n = num.length;

    function isValid(num1: number, num2: number, remaining: string): boolean {
        // Step 1: Reached end successfully
        if (remaining.length === 0) return true;

        // Step 2: Next number should be sum
        const nextNum = num1 + num2;
        const nextStr = nextNum.toString();

        // Step 3: Check if remaining starts with it
        if (!remaining.startsWith(nextStr)) return false;

        // Step 4: Continue checking
        return isValid(num2, nextNum, remaining.slice(nextStr.length));
    }

    // Step 5: Try all pairs for first two numbers
    for (let i = 1; i < n; i++) {
        // No leading zeros
        if (num[0] === '0' && i > 1) break;

        for (let j = i + 1; j < n; j++) {
            // No leading zeros
            if (num[i] === '0' && j > i + 1) break;

            const num1 = parseInt(num.slice(0, i));
            const num2 = parseInt(num.slice(i, j));

            // Step 6: Validate sequence
            if (isValid(num1, num2, num.slice(j))) {
                return true;
            }
        }
    }

    return false;
}
```

**Complexity**:
- Time: O(n^3) - two nested loops and string validation
- Space: O(n) for recursion

**Visualization**:
```
Input: "199100199"

Try first="1", second="99":
┌──────────────────────────────┐
│ 1 + 99 = 100                 │
│ Check: "100199" starts "100"✓│
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ 99 + 100 = 199               │
│ Check: "199" starts "199" ✓  │
└──────────────────────────────┘
         │
         ▼
    Remaining=""
    SUCCESS! ✓

Sequence: 1 → 99 → 100 → 199

Invalid example "123":
Try first="1", second="2":
┌──────────────────────────────┐
│ 1 + 2 = 3                    │
│ Check: "3" starts "3" ✓      │
└──────────────────────────────┘
    Remaining=""
    Only 3 numbers total
    But we need at least 3! ✓

Actually valid! Sequence: 1 → 2 → 3
```

---

### 20. Reconstruct Itinerary (Hard)
**LeetCode**: https://leetcode.com/problems/reconstruct-itinerary/

**Description**: Given a list of airline tickets, reconstruct the itinerary in order starting from "JFK". If there are multiple valid itineraries, return the lexicographically smallest one.

**Python Solution**:
```python
def findItinerary(tickets: list[list[str]]) -> list[str]:
    """
    Backtracking with DFS. Try paths in lexicographical order.

    Decision tree for [["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],
                       ["ATL","JFK"],["ATL","SFO"]]:

                        JFK
                    ┌────┴────┐
                  ATL        SFO
                 /   \         |
               JFK   SFO      ATL
                |     |        |
               SFO   ATL      JFK
                |     |        |
               ATL   JFK      SFO
                |     |
    (cycle)    JFK

    Lexicographically smallest: JFK→ATL→JFK→SFO→ATL→SFO
    """
    from collections import defaultdict
    import heapq

    # Step 1: Build graph with priority queue for lexicographical order
    graph = defaultdict(list)
    for src, dst in tickets:
        heapq.heappush(graph[src], dst)

    result = []

    def backtrack(airport):
        # Step 2: Visit all outgoing flights
        while graph[airport]:
            # Step 3: Take lexicographically smallest destination
            next_airport = heapq.heappop(graph[airport])
            backtrack(next_airport)

        # Step 4: Add to result (in reverse order)
        result.append(airport)

    # Step 5: Start from JFK
    backtrack("JFK")

    # Step 6: Reverse to get correct order
    return result[::-1]
```

**TypeScript Solution**:
```typescript
function findItinerary(tickets: string[][]): string[] {
    // Step 1: Build adjacency list (sorted)
    const graph = new Map<string, string[]>();

    for (const [src, dst] of tickets) {
        if (!graph.has(src)) graph.set(src, []);
        graph.get(src)!.push(dst);
    }

    // Step 2: Sort destinations lexicographically
    for (const destinations of graph.values()) {
        destinations.sort();
    }

    const result: string[] = [];

    function backtrack(airport: string): void {
        const destinations = graph.get(airport) || [];

        // Step 3: Visit destinations in sorted order
        while (destinations.length > 0) {
            const next = destinations.shift()!;
            backtrack(next);
        }

        // Step 4: Add to result (reverse order)
        result.push(airport);
    }

    // Step 5: Start from JFK
    backtrack("JFK");

    // Step 6: Reverse for correct order
    return result.reverse();
}
```

**Complexity**:
- Time: O(E log E) where E is number of tickets
- Space: O(E)

**Visualization**:
```
Tickets: [["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]

Graph:
JFK → [MUC]
MUC → [LHR]
LHR → [SFO]
SFO → [SJC]

Execution trace (Hierholzer's algorithm):

Call Stack         Result (building reverse)
─────────────────  ──────────────────────
backtrack(JFK)
  backtrack(MUC)
    backtrack(LHR)
      backtrack(SFO)
        backtrack(SJC)  → [SJC]
      ← return          → [SJC, SFO]
    ← return            → [SJC, SFO, LHR]
  ← return              → [SJC, SFO, LHR, MUC]
← return                → [SJC, SFO, LHR, MUC, JFK]

Reverse: [JFK, MUC, LHR, SFO, SJC] ✓

Path visualization:
JFK ──→ MUC ──→ LHR ──→ SFO ──→ SJC
```

---

### 21. Android Unlock Patterns (Medium)
**LeetCode**: https://leetcode.com/problems/android-unlock-patterns/ (Premium)

**Description**: Given an Android lock screen pattern (3x3 grid), count how many valid unlock patterns of length m to n exist. A pattern must connect at least m and at most n dots. When connecting two dots, any dot in between must have been visited.

**Python Solution**:
```python
def numberOfPatterns(m: int, n: int) -> int:
    """
    Backtrack trying each starting position and path.
    Track visited dots and ensure valid jumps.

    Grid layout:
    1 2 3
    4 5 6
    7 8 9

    Decision tree for m=1, n=2:

         Start
      /    |    \
    1     2...   9
   /|\   /|\    /|\
  234.. 134.. 124..

  Valid paths of length 1: 9 (each dot)
  Valid paths of length 2: 9×8 = 72 (but some invalid due to jump rules)

  Jump rules:
  - 1→3 requires 2 visited
  - 1→7 requires 4 visited
  - 1→9 requires 5 visited
  etc.
    """
    # Step 1: Define skip rules (jumps that require intermediate dot)
    skip = {}
    skip[(1, 3)] = skip[(3, 1)] = 2
    skip[(1, 7)] = skip[(7, 1)] = 4
    skip[(3, 9)] = skip[(9, 3)] = 6
    skip[(7, 9)] = skip[(9, 7)] = 8
    skip[(1, 9)] = skip[(9, 1)] = 5
    skip[(2, 8)] = skip[(8, 2)] = 5
    skip[(3, 7)] = skip[(7, 3)] = 5
    skip[(4, 6)] = skip[(6, 4)] = 5

    visited = [False] * 10  # dots 1-9

    def backtrack(current, length):
        # Step 2: Valid pattern length reached
        if length >= m:
            count = 1
        else:
            count = 0

        # Step 3: Exceeded max length
        if length >= n:
            return count

        # Step 4: Try moving to each unvisited dot
        for next_dot in range(1, 10):
            # Skip if already visited
            if visited[next_dot]:
                continue

            # Step 5: Check if jump is valid
            jump_key = (current, next_dot)
            if jump_key in skip:
                # Must have visited the intermediate dot
                if not visited[skip[jump_key]]:
                    continue

            # Step 6: Visit dot
            visited[next_dot] = True

            # Step 7: Recurse
            count += backtrack(next_dot, length + 1)

            # Step 8: Backtrack
            visited[next_dot] = False

        return count

    total = 0

    # Step 9: Try each starting position
    # Use symmetry: corners (1,3,7,9) are symmetric
    # edges (2,4,6,8) are symmetric, center (5) is unique
    visited[1] = True
    total += backtrack(1, 1) * 4  # 4 corners
    visited[1] = False

    visited[2] = True
    total += backtrack(2, 1) * 4  # 4 edges
    visited[2] = False

    visited[5] = True
    total += backtrack(5, 1)  # 1 center
    visited[5] = False

    return total
```

**TypeScript Solution**:
```typescript
function numberOfPatterns(m: number, n: number): number {
    // Step 1: Jump rules
    const skip = new Map<string, number>();
    const setSkip = (a: number, b: number, mid: number) => {
        skip.set(`${a},${b}`, mid);
        skip.set(`${b},${a}`, mid);
    };

    setSkip(1, 3, 2); setSkip(1, 7, 4); setSkip(3, 9, 6);
    setSkip(7, 9, 8); setSkip(1, 9, 5); setSkip(2, 8, 5);
    setSkip(3, 7, 5); setSkip(4, 6, 5);

    const visited = Array(10).fill(false);

    function backtrack(current: number, length: number): number {
        // Step 2: Count if valid length
        let count = length >= m ? 1 : 0;

        // Step 3: Stop if at max
        if (length >= n) return count;

        // Step 4: Try each next dot
        for (let next = 1; next <= 9; next++) {
            if (visited[next]) continue;

            // Step 5: Check jump validity
            const key = `${current},${next}`;
            if (skip.has(key)) {
                const mid = skip.get(key)!;
                if (!visited[mid]) continue;
            }

            // Step 6: Choose
            visited[next] = true;

            // Step 7: Recurse
            count += backtrack(next, length + 1);

            // Step 8: Unchoose
            visited[next] = false;
        }

        return count;
    }

    // Step 9: Use symmetry
    let total = 0;

    visited[1] = true;
    total += backtrack(1, 1) * 4;
    visited[1] = false;

    visited[2] = true;
    total += backtrack(2, 1) * 4;
    visited[2] = false;

    visited[5] = true;
    total += backtrack(5, 1);
    visited[5] = false;

    return total;
}
```

**Complexity**:
- Time: O(n!)
- Space: O(n)

**Visualization**:
```
3x3 Grid:
┌───┬───┬───┐
│ 1 │ 2 │ 3 │
├───┼───┼───┤
│ 4 │ 5 │ 6 │
├───┼───┼───┤
│ 7 │ 8 │ 9 │
└───┴───┴───┘

Example pattern: 1→5→9→6

Step 1: Start at 1
┌───┬───┬───┐
│ ● │   │   │
├───┼───┼───┤
│   │   │   │
├───┼───┼───┤
│   │   │   │
└───┴───┴───┘

Step 2: Move to 5 (valid, no skip)
┌───┬───┬───┐
│ × │   │   │
├───┼───┼───┤
│   │ ● │   │
├───┼───┼───┤
│   │   │   │
└───┴───┴───┘

Step 3: Move to 9 (valid, 5 is visited)
┌───┬───┬───┐
│ × │   │   │
├───┼───┼───┤
│   │ × │   │
├───┼───┼───┤
│   │   │ ● │
└───┴───┴───┘

Step 4: Move to 6 (valid)
┌───┬───┬───┐
│ × │   │   │
├───┼───┼───┤
│   │ × │ ● │
├───┼───┼───┤
│   │   │ × │
└───┴───┴───┘

Invalid example: 1→3 (2 not visited)
┌───┬───┬───┐
│ ● │ ? │ ● │  ← 2 must be visited first!
└───┴───┴───┘
   INVALID! ✗
```

---

### 22. Matchsticks to Square (Medium)
**LeetCode**: https://leetcode.com/problems/matchsticks-to-square/

**Description**: Given an integer array matchsticks where matchsticks[i] is the length of the ith matchstick, return true if you can make a square using all matchsticks without breaking any.

**Python Solution**:
```python
def makesquare(matchsticks: list[int]) -> bool:
    """
    Backtrack to partition sticks into 4 equal-length sides.

    For matchsticks=[1,1,2,2,2]:
    Total=8, side=2

    Decision tree (trying to fill 4 sides):

                    [0,0,0,0] (4 sides)
                         │
            ┌────────────┼────────────┐
            │            │            │
       Try stick 1   Try stick 2  Try stick 2
       on side 0     on side 0    on side 0
           │              │            │
       [1,0,0,0]      [2,0,0,0]✓   [2,0,0,0]✓
           │
    Continue filling...

    Goal: [2,2,2,2]
    """
    if len(matchsticks) < 4:
        return False

    total = sum(matchsticks)
    if total % 4 != 0:
        return False

    side_length = total // 4

    # Sort in descending order for faster pruning
    matchsticks.sort(reverse=True)

    # Prune if any stick is too long
    if matchsticks[0] > side_length:
        return False

    sides = [0] * 4

    def backtrack(index):
        # Step 1: Used all matchsticks
        if index == len(matchsticks):
            # Check if all sides are equal
            return all(side == side_length for side in sides)

        # Step 2: Try placing current stick on each side
        for i in range(4):
            # Step 3: Pruning - skip if adding would exceed side length
            if sides[i] + matchsticks[index] > side_length:
                continue

            # Step 4: Optimization - skip duplicate sides
            # If current side same as previous, we already tried this
            if i > 0 and sides[i] == sides[i-1]:
                continue

            # Step 5: Place matchstick
            sides[i] += matchsticks[index]

            # Step 6: Recurse
            if backtrack(index + 1):
                return True

            # Step 7: Remove matchstick (backtrack)
            sides[i] -= matchsticks[index]

        return False

    return backtrack(0)
```

**TypeScript Solution**:
```typescript
function makesquare(matchsticks: number[]): boolean {
    if (matchsticks.length < 4) return false;

    const total = matchsticks.reduce((a, b) => a + b, 0);
    if (total % 4 !== 0) return false;

    const sideLength = total / 4;

    // Step 1: Sort descending for pruning
    matchsticks.sort((a, b) => b - a);

    if (matchsticks[0] > sideLength) return false;

    const sides = [0, 0, 0, 0];

    function backtrack(index: number): boolean {
        // Step 2: All sticks placed
        if (index === matchsticks.length) {
            return sides.every(side => side === sideLength);
        }

        // Step 3: Try each side
        for (let i = 0; i < 4; i++) {
            // Step 4: Pruning
            if (sides[i] + matchsticks[index] > sideLength) {
                continue;
            }

            // Step 5: Skip duplicate sides
            if (i > 0 && sides[i] === sides[i-1]) {
                continue;
            }

            // Step 6: Place stick
            sides[i] += matchsticks[index];

            // Step 7: Recurse
            if (backtrack(index + 1)) return true;

            // Step 8: Remove stick
            sides[i] -= matchsticks[index];
        }

        return false;
    }

    return backtrack(0);
}
```

**Complexity**:
- Time: O(4^n) where n is number of matchsticks
- Space: O(n) for recursion

**Visualization**:
```
matchsticks = [1,1,2,2,2]
total = 8, side = 2

Goal: Create 4 sides of length 2

   Top
    ─ ─
  │     │  Left & Right
  │     │
    ─ ─
  Bottom

Decision tree (building sides):

                  [0,0,0,0]
                      │
         ┌────────────┼────────────┐
    stick=2      stick=2       stick=2
    side 0       side 1        side 2
         │            │             │
    [2,0,0,0]   [0,2,0,0]    [0,0,2,0]
         │
    stick=2
    ┌────┼────┐
   s0   s1   s2   (s0 would exceed, skip)
        │
   [2,2,0,0]
        │
   stick=2
   ┌────┼────┐
  s2   s3      (s0,s1 full, skip)
       │
  [2,2,0,2]
       │
  stick=1
  ┌────┼
  s2   s3     (try either)
  │
[2,2,1,2]
  │
stick=1
  │
 s2
  │
[2,2,2,2] ✓ SUCCESS!

Visual result:
┌───┬───┐
│ 2 │ 2 │  Top=2, Bottom=2
├───┼───┤
│ 2 │ 2 │  Left=2, Right=2
└───┴───┘
```

---

### 23. Split Array into Fibonacci Sequence (Medium)
**LeetCode**: https://leetcode.com/problems/split-array-into-fibonacci-sequence/

**Description**: Given a string of digits, split it into a Fibonacci-like sequence where each number is the sum of the previous two. Return any valid sequence, or an empty array if impossible.

**Python Solution**:
```python
def splitIntoFibonacci(num: str) -> list[int]:
    """
    Backtrack trying different splits for first two numbers.
    Then verify rest follows Fibonacci pattern.

    For "1101111":

         Split positions
              │
      ┌───────┼───────┐
    "1|1|..."  "1|10|..." "11|01|..."
       │          │           │
    Try 1+1   Try 1+10    Try 11+01
       │          │           │
      =2        =11          =12
       │          │           │
    "01111"    "1111"      "1111"
    starts 0✗  starts 11✓   starts 12✗
               │
           "1|10|11|111"
           Next: 10+11=21
           "11" doesn't start with 21 ✗

    No valid sequence.
    """
    n = len(num)
    result = []

    def backtrack(index, seq):
        # Step 1: Reached end with valid sequence
        if index == n and len(seq) >= 3:
            return True

        # Step 2: Try different lengths for next number
        for i in range(index, n):
            # Step 3: No leading zeros except "0" itself
            if num[index] == '0' and i > index:
                break

            # Step 4: Parse number
            num_str = num[index:i+1]
            num_val = int(num_str)

            # Step 5: Check 32-bit integer constraint
            if num_val > 2**31 - 1:
                break

            # Step 6: If we have fewer than 2 numbers, just add
            if len(seq) < 2:
                seq.append(num_val)
                if backtrack(i + 1, seq):
                    return True
                seq.pop()
            else:
                # Step 7: Check Fibonacci property
                if seq[-1] + seq[-2] == num_val:
                    seq.append(num_val)
                    if backtrack(i + 1, seq):
                        return True
                    seq.pop()
                # Step 8: If sum is less than current, try longer number
                elif seq[-1] + seq[-2] < num_val:
                    break

        return False

    # Step 9: Start backtracking
    if backtrack(0, result):
        return result
    return []
```

**TypeScript Solution**:
```typescript
function splitIntoFibonacci(num: string): number[] {
    const n = num.length;
    const result: number[] = [];
    const MAX_INT = 2**31 - 1;

    function backtrack(index: number, seq: number[]): boolean {
        // Step 1: Successfully split entire string
        if (index === n && seq.length >= 3) {
            return true;
        }

        // Step 2: Try different number lengths
        for (let i = index; i < n; i++) {
            // Step 3: No leading zeros
            if (num[index] === '0' && i > index) break;

            // Step 4: Extract number
            const numStr = num.slice(index, i + 1);
            const numVal = parseInt(numStr);

            // Step 5: Check constraints
            if (numVal > MAX_INT) break;

            // Step 6: First two numbers
            if (seq.length < 2) {
                seq.push(numVal);
                if (backtrack(i + 1, seq)) return true;
                seq.pop();
            } else {
                // Step 7: Must follow Fibonacci
                const expected = seq[seq.length - 1] + seq[seq.length - 2];
                if (expected === numVal) {
                    seq.push(numVal);
                    if (backtrack(i + 1, seq)) return true;
                    seq.pop();
                } else if (expected < numVal) {
                    // Step 8: Can't match with longer numbers
                    break;
                }
            }
        }

        return false;
    }

    backtrack(0, result);
    return result;
}
```

**Complexity**:
- Time: O(n^2) for trying splits
- Space: O(n) for recursion

**Visualization**:
```
Input: "112358"

Try first="1":
  Try second="1":
    Expected: 1+1=2
    ┌──────────────────────┐
    │ Check "2358"         │
    │ Starts with "2"? ✓   │
    └──────────────────────┘
    Next: 1+2=3
    ┌──────────────────────┐
    │ Check "358"          │
    │ Starts with "3"? ✓   │
    └──────────────────────┘
    Next: 2+3=5
    ┌──────────────────────┐
    │ Check "58"           │
    │ Starts with "5"? ✓   │
    └──────────────────────┘
    Next: 3+5=8
    ┌──────────────────────┐
    │ Check "8"            │
    │ Starts with "8"? ✓   │
    └──────────────────────┘
    Remaining=""
    SUCCESS! ✓

Result: [1, 1, 2, 3, 5, 8]

Visualization of sequence:
   1  +  1  =  2
         ↓     ↓
      1  +  2  =  3
            ↓     ↓
         2  +  3  =  5
               ↓     ↓
            3  +  5  =  8

Full path: 1 → 1 → 2 → 3 → 5 → 8
```

---

### 24. Maximum Length of a Concatenated String with Unique Characters (Medium)
**LeetCode**: https://leetcode.com/problems/maximum-length-of-a-concatenated-string-with-unique-characters/

**Description**: Given an array of strings, find the maximum length of a concatenated string that has all unique characters.

**Python Solution**:
```python
def maxLength(arr: list[str]) -> int:
    """
    Backtrack trying to include/exclude each string.
    Track characters used so far.

    For arr=["un","iq","ue"]:

                    ""
            ┌───────┼───────┐
            │       │       │
          "un"     skip    skip
        ┌──┴──┐
        │     │
    "uniq"   skip  ("un"+"iq"="uniq" ✓ unique)
    ┌──┴──┐
    │     │
  "unique" skip  ("uniq"+"ue"="unique" ✗ 'u' repeats!)

  Max length: 4 ("uniq")
    """

    def has_unique_chars(s):
        return len(set(s)) == len(s)

    # Step 1: Filter out strings with duplicate chars
    arr = [s for s in arr if has_unique_chars(s)]

    max_len = 0

    def backtrack(index, current):
        nonlocal max_len

        # Step 2: Update max length
        max_len = max(max_len, len(current))

        # Step 3: Try adding each remaining string
        for i in range(index, len(arr)):
            # Step 4: Check if can add without duplicates
            if not any(c in current for c in arr[i]):
                # Step 5: Add string
                backtrack(i + 1, current + arr[i])

    backtrack(0, "")
    return max_len

# Alternative using set for tracking:
def maxLengthSet(arr: list[str]) -> int:
    def backtrack(index, char_set):
        # Base case: tried all strings
        if index == len(arr):
            return len(char_set)

        # Option 1: Skip current string
        skip = backtrack(index + 1, char_set)

        # Option 2: Include current string (if no overlap)
        current_chars = set(arr[index])
        include = 0

        # Check: unique chars AND no overlap with existing
        if len(current_chars) == len(arr[index]) and \
           not (current_chars & char_set):
            include = backtrack(index + 1, char_set | current_chars)

        return max(skip, include)

    return backtrack(0, set())
```

**TypeScript Solution**:
```typescript
function maxLength(arr: string[]): number {
    function hasUniqueChars(s: string): boolean {
        return new Set(s).size === s.length;
    }

    // Step 1: Filter invalid strings
    arr = arr.filter(hasUniqueChars);

    let maxLen = 0;

    function backtrack(index: number, charSet: Set<string>): void {
        // Step 2: Update max
        maxLen = Math.max(maxLen, charSet.size);

        // Step 3: Try each remaining string
        for (let i = index; i < arr.length; i++) {
            const str = arr[i];

            // Step 4: Check for overlap
            let hasOverlap = false;
            for (const char of str) {
                if (charSet.has(char)) {
                    hasOverlap = true;
                    break;
                }
            }

            if (!hasOverlap) {
                // Step 5: Add characters
                const newSet = new Set(charSet);
                for (const char of str) {
                    newSet.add(char);
                }

                // Step 6: Recurse
                backtrack(i + 1, newSet);
            }
        }
    }

    backtrack(0, new Set());
    return maxLen;
}
```

**Complexity**:
- Time: O(2^n × m) where n is array length, m is avg string length
- Space: O(m) for character set

**Visualization**:
```
arr = ["abc", "def", "ghi", "aef"]

Decision tree:

                        {} len=0
          ┌──────────────┼──────────────┐
          │              │              │
     Include "abc"   Skip "abc"    ...
     {a,b,c} len=3   {} len=0
          │              │
    ┌─────┴─────┐   ┌────┴────┐
    │           │   │         │
 Include    Skip  Include  Skip
  "def"     "def"  "def"   "def"
{abcdef}  {abc}  {def}    {}
  len=6    len=3  len=3   len=0
    │
  ┌─┴─┐
  │   │
 Inc  Skip
"ghi" "ghi"
{abcdefghi} {abcdef}
  len=9✓    len=6
    │
  ┌─┴─┐
  │   │
 Inc  Skip  (Try "aef")
"aef" "aef"
  ✗    len=9  ("aef" has 'a' and 'e', conflict!)

Maximum: 9 ("abc" + "def" + "ghi")

Invalid path example:
["ab","ba"]
    │
Include "ab" → {a,b}
    │
Try Include "ba" → has 'b' and 'a' ✗ CONFLICT!
    │
Skip "ba" → len=2

Result: 2
```

---

### 25. Partition to K Equal Sum Subsets (Medium)
**LeetCode**: https://leetcode.com/problems/partition-to-k-equal-sum-subsets/

**Description**: Given an integer array nums and an integer k, return true if it is possible to divide this array into k non-empty subsets whose sums are all equal.

**Python Solution**:
```python
def canPartitionKSubsets(nums: list[int], k: int) -> bool:
    """
    Similar to matchsticks problem but with k groups.
    Backtrack assigning each number to a group.

    For nums=[4,3,2,3,5,2,1], k=4:
    Total=20, target=5 per subset

    Decision tree:

                [0,0,0,0] (4 subsets)
                     │
            Try assigning nums[0]=4
            ┌────────┼────────┐
        Group 0  Group 1  Group 2...
        [4,0,0,0] [0,4,0,0] [0,0,4,0]
            │
      Try nums[1]=3
        ┌───┴───┐
    Group 0  Group 1  (Group 0 would be 7>5, skip)
    [4,3,0,0]✗ [4,0,3,0]
                  │
            Continue filling...

    Goal: [5,5,5,5]
    """
    total = sum(nums)

    # Step 1: Check if partition possible
    if total % k != 0:
        return False

    target = total // k

    # Sort descending for faster pruning
    nums.sort(reverse=True)

    # Early exit if largest number exceeds target
    if nums[0] > target:
        return False

    subsets = [0] * k

    def backtrack(index):
        # Step 2: Assigned all numbers
        if index == len(nums):
            # All subsets should equal target
            return all(s == target for s in subsets)

        # Step 3: Try adding current number to each subset
        for i in range(k):
            # Step 4: Pruning - would exceed target
            if subsets[i] + nums[index] > target:
                continue

            # Step 5: Optimization - skip duplicate subset values
            # If this subset has same sum as previous, we already tried
            if i > 0 and subsets[i] == subsets[i-1]:
                continue

            # Step 6: Assign to subset
            subsets[i] += nums[index]

            # Step 7: Recurse
            if backtrack(index + 1):
                return True

            # Step 8: Backtrack
            subsets[i] -= nums[index]

            # Step 9: Optimization - if empty subset failed, no point trying others
            if subsets[i] == 0:
                break

        return False

    return backtrack(0)
```

**TypeScript Solution**:
```typescript
function canPartitionKSubsets(nums: number[], k: number): boolean {
    const total = nums.reduce((a, b) => a + b, 0);

    // Step 1: Validate partition
    if (total % k !== 0) return false;

    const target = total / k;

    // Step 2: Sort descending
    nums.sort((a, b) => b - a);

    if (nums[0] > target) return false;

    const subsets = Array(k).fill(0);

    function backtrack(index: number): boolean {
        // Step 3: All numbers assigned
        if (index === nums.length) {
            return subsets.every(s => s === target);
        }

        // Step 4: Try each subset
        for (let i = 0; i < k; i++) {
            // Step 5: Pruning
            if (subsets[i] + nums[index] > target) {
                continue;
            }

            // Step 6: Skip duplicates
            if (i > 0 && subsets[i] === subsets[i-1]) {
                continue;
            }

            // Step 7: Assign
            subsets[i] += nums[index];

            // Step 8: Recurse
            if (backtrack(index + 1)) return true;

            // Step 9: Unassign
            subsets[i] -= nums[index];

            // Step 10: Empty subset optimization
            if (subsets[i] === 0) break;
        }

        return false;
    }

    return backtrack(0);
}
```

**Complexity**:
- Time: O(k^n) where n is array length
- Space: O(n) for recursion

**Visualization**:
```
nums = [4,3,2,3,5,2,1], k = 4
total = 20, target = 5

Sorted descending: [5,4,3,3,2,2,1]

Building subsets:

Step 1: Assign 5
┌───┬───┬───┬───┐
│ 5 │ 0 │ 0 │ 0 │
└───┴───┴───┴───┘

Step 2: Assign 4
┌───┬───┬───┬───┐
│ 5 │ 4 │ 0 │ 0 │  (Can't add to subset 0: 5+4>5)
└───┴───┴───┴───┘

Step 3: Assign 3
┌───┬───┬───┬───┐
│ 5 │ 4 │ 3 │ 0 │  (Can't add to 0 or 1)
└───┴───┴───┴───┘

Step 4: Assign 3
┌───┬───┬───┬───┐
│ 5 │ 4 │ 3 │ 3 │  (Can't add to 0,1,2)
└───┴───┴───┴───┘

Step 5: Assign 2
┌───┬───┬───┬───┐
│ 5 │ 4 │ 3 │ 3 │  (Can't add to 0)
└───┴───┴───┴───┘
Try subset 1: 4+2=6 > 5 ✗
Try subset 2: 3+2=5 ✓
┌───┬───┬───┬───┐
│ 5 │ 4 │ 5*│ 3 │
└───┴───┴───┴───┘

Step 6: Assign 2
┌───┬───┬───┬───┐
│ 5 │ 4 │ 5 │ 3 │
└───┴───┴───┴───┘
Try subset 3: 3+2=5 ✓
┌───┬───┬───┬───┐
│ 5 │ 4 │ 5 │ 5*│
└───┴───┴───┴───┘

Step 7: Assign 1
┌───┬───┬───┬───┐
│ 5 │ 4 │ 5 │ 5 │
└───┴───┴───┴───┘
Only subset 1 can take it: 4+1=5 ✓
┌───┬───┬───┬───┐
│ 5 │ 5*│ 5 │ 5 │
└───┴───┴───┴───┘

All subsets = 5! SUCCESS! ✓

Final partition:
Group 0: [5]
Group 1: [4, 1]
Group 2: [3, 2]
Group 3: [3, 2]
```

---

## Summary

Backtracking is the go-to pattern for:
- **Generating** all permutations, combinations, or subsets
- **Exploring** all possible solutions with constraints
- **Solving** puzzles like Sudoku, N-Queens
- **Finding** all valid paths or arrangements

### Key Techniques:

1. **Make a choice** → **Explore** → **Undo the choice**
2. **Pruning**: Skip invalid branches early
3. **Duplicate handling**: Sort and skip same values at same level
4. **State tracking**: Use sets, arrays, or modify input to track used elements
5. **Base case**: When to add solution to result

### Common Patterns:

```python
# Pattern 1: Build path incrementally
def backtrack(path, remaining):
    if base_case:
        result.append(path[:])
        return

    for choice in choices:
        path.append(choice)
        backtrack(path, updated_remaining)
        path.pop()

# Pattern 2: Index-based traversal
def backtrack(start, path):
    result.append(path[:])

    for i in range(start, len(nums)):
        if should_skip(i):
            continue
        path.append(nums[i])
        backtrack(i + 1, path)
        path.pop()

# Pattern 3: Constraint checking
def backtrack(state):
    if is_complete(state):
        result.append(state)
        return

    for choice in get_valid_choices(state):
        make_choice(choice)
        backtrack(new_state)
        undo_choice(choice)
```

**Remember**: Backtracking explores the entire search space by trying all possibilities. Use pruning to make it efficient!
