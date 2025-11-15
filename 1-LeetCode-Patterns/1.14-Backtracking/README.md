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

```
Backtracking Decision Tree:

                     []
            /        |        \
          [1]       [2]       [3]
         /   \      /  \      /  \
      [1,2] [1,3] [2,1] [2,3] [3,1] [3,2]
       |     |     |     |     |     |
    [1,2,3][1,3,2][2,1,3][2,3,1][3,1,2][3,2,1]

At each node: Make choice → Recurse → Undo choice

Pruning example (no duplicates):
                     []
            /        |        \
          [1]       [2]       [3]
         /   \         \         (pruned)
      [1,2] [1,3]     [2,3]
       |     |          |
    [1,2,3][1,3,2]   [2,3,1]
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
