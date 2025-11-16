# 1.13 Matrix Traversal Pattern

## Pattern Overview

### What is Matrix Traversal?
Matrix traversal is a pattern for navigating and processing 2D grids/matrices. It involves visiting cells in a specific order (row-wise, column-wise, spiral, diagonal, etc.) and often combines with DFS/BFS for exploring connected components or finding paths.

### When to Use It?
- Problems involving 2D grids, boards, or images
- Island counting, region coloring, or flood fill operations
- Path finding in a grid
- Matrix rotation, spiral traversal
- Game boards (chess, tic-tac-toe, etc.)

### Time/Space Complexity
- **Time**: O(m × n) - visiting each cell once
- **Space**: O(m × n) - for visited tracking or recursion stack (DFS)
- **BFS Space**: O(min(m, n)) - queue size in worst case

### Visual Diagram

```
═══════════════════════════════════════════════════════════════════════════════
                        DIRECTION ARRAYS & MOVEMENT
═══════════════════════════════════════════════════════════════════════════════

4-Directional Movement (Most Common):
        UP (-1, 0)
           ↑
           |
LEFT ←─────•─────→ RIGHT
(0,-1)     |     (0, +1)
           ↓
       DOWN (+1, 0)

directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
             [RIGHT,  DOWN,   LEFT,    UP]

8-Directional Movement (with diagonals):
  (-1,-1) (-1,0) (-1,+1)
     ↖      ↑      ↗
      \     |     /
(0,-1) ← • → (0,+1)
      /     |     \
     ↙      ↓      ↘
  (+1,-1) (+1,0) (+1,+1)

directions = [(-1,-1), (-1,0), (-1,+1),
              (0,-1),          (0,+1),
              (+1,-1), (+1,0), (+1,+1)]

═══════════════════════════════════════════════════════════════════════════════
                         TRAVERSAL PATTERNS
═══════════════════════════════════════════════════════════════════════════════

1. SPIRAL TRAVERSAL (Clockwise):
   ┌─────────────────────────────────┐
   │  1→  2→  3→  4→  5              │
   │                 ↓               │
   │ 14→ 15→ 16→ 17  6               │
   │  ↑           ↓  ↓               │
   │ 13  20→ 19  18  7               │
   │  ↑      ↑   ↓   ↓               │
   │ 12← 11← 10← 9   8               │
   └─────────────────────────────────┘

   Direction Order: RIGHT → DOWN → LEFT → UP → repeat
   Use 4 boundaries that shrink: top, bottom, left, right

2. DIAGONAL TRAVERSAL (Bottom-Left to Top-Right):
   Grid:                 Output Order:
   ┌──────────────┐      [1]
   │ 1   2   3  4 │      [2, 5]
   │ 5   6   7  8 │      [3, 6, 9]
   │ 9  10  11 12 │      [4, 7, 10, 13]
   │13  14  15 16 │      [8, 11, 14]
   └──────────────┘      [12, 15]
                         [16]
   Pattern: Process diagonals where sum of indices (i+j) is constant

3. ZIGZAG / WAVE TRAVERSAL:
   Row 0:  A → B → C → D     (Left to Right)
   Row 1:  H ← G ← F ← E     (Right to Left)
   Row 2:  I → J → K → L     (Left to Right)
   Row 3:  P ← O ← N ← M     (Right to Left)

   Output: [A,B,C,D, E,F,G,H, I,J,K,L, M,N,O,P]
   Toggle direction on each row

4. LAYER-BY-LAYER (Onion Pattern):
   ┌───────────────────┐
   │ 1   1   1   1   1 │  Layer 1 (outer)
   │ 1   2   2   2   1 │  Layer 2
   │ 1   2   3   2   1 │  Layer 3 (center)
   │ 1   2   2   2   1 │  Layer 2
   │ 1   1   1   1   1 │  Layer 1 (outer)
   └───────────────────┘
   Process from outside to inside (or vice versa)

═══════════════════════════════════════════════════════════════════════════════
                      DFS VISUALIZATION IN GRID
═══════════════════════════════════════════════════════════════════════════════

Finding Connected Components (Islands):

Initial Grid:          Step-by-Step DFS:           Final Result:
┌─────────────┐        ┌─────────────┐             ┌─────────────┐
│ 1  1  0  0 │        │ ①→ ②  0  0 │             │ V  V  0  0 │
│ 1  0  0  1 │        │ ↓   0  0  ⑤ │             │ V  0  0  V │
│ 0  0  1  1 │   →    │ 0   0  ⑥→ ↓ │      →      │ 0  0  V  V │
│ 0  1  1  0 │        │ 0   ③→ ④  ⑦ │             │ 0  V  V  0 │
└─────────────┘        └─────────────┘             └─────────────┘
                       (Numbers = visit order)      (V = visited)

Island Count: 2
- Island 1: cells {(0,0), (0,1), (1,0)} - visited at steps ①②③
- Island 2: cells {(1,3), (2,2), (2,3), (3,1), (3,2)} - visited at steps ⑤⑥⑦

DFS Recursion Stack Visualization:
Start at (0,0):
│ dfs(0,0) → mark visited
│   ├─→ dfs(0,1) → mark visited
│   │     ├─→ dfs(0,2) → return (water)
│   │     ├─→ dfs(1,1) → return (water)
│   │     └─→ returns
│   ├─→ dfs(1,0) → mark visited
│   │     └─→ all neighbors visited/water
│   └─→ returns

═══════════════════════════════════════════════════════════════════════════════
                      BFS VISUALIZATION IN GRID
═══════════════════════════════════════════════════════════════════════════════

Multi-Source BFS (Rotting Oranges):

Initial State:          Minute 1:              Minute 2:              Minute 3:
┌──────────┐           ┌──────────┐           ┌──────────┐           ┌──────────┐
│ 2  1  1 │           │ 2  2  1 │           │ 2  2  2 │           │ 2  2  2 │
│ 1  1  0 │    →      │ 2  1  0 │    →      │ 2  2  0 │    →      │ 2  2  0 │
│ 0  1  1 │           │ 0  1  1 │           │ 0  2  1 │           │ 0  2  2 │
└──────────┘           └──────────┘           └──────────┘           └──────────┘
Legend: 2=rotten, 1=fresh, 0=empty

BFS Queue Evolution:
Initial:  Queue = [(0,0)]                    (all rotten oranges)
Minute 1: Queue = [(0,1), (1,0)]            (newly rotten)
Minute 2: Queue = [(0,2), (1,1), (2,1)]     (spread continues)
Minute 3: Queue = [(2,2)]                    (final orange rots)

Level-by-Level Processing:
Level 0 (start): ■ ■ ■ ■ □ □ □ □ □
                 └─┬─┘
Level 1:           ■ ■ ■ ■ ■ □ □ □ □
                       └─┬─┘
Level 2:                 ■ ■ ■ ■ □ □ □
                             └┬┘
Level 3:                      ■ ■ □ □

═══════════════════════════════════════════════════════════════════════════════
                    SHORTEST PATH BFS EXAMPLE
═══════════════════════════════════════════════════════════════════════════════

Find shortest path from S to E (0=empty, 1=wall):

Grid:                  Distance Map:           Path Reconstruction:
┌──────────────┐      ┌──────────────┐        ┌──────────────┐
│ S  0  0  1 │      │ 0  1  2  ∞ │        │ ●→ ●→ ●  █ │
│ 0  1  0  1 │      │ 1  ∞  3  ∞ │        │ ●  █  ●  █ │
│ 0  0  0  0 │  →   │ 2  3  4  5 │   →    │ □  □  ●→ ●│
│ 1  1  0  E │      │ ∞  ∞  5  6 │        │ █  █  □  ●│
└──────────────┘      └──────────────┘        └──────────────┘
                      (Numbers = distance     (● = path)
                       from S)                (█ = wall)

BFS guarantees shortest path of length 7!

═══════════════════════════════════════════════════════════════════════════════
                    BOUNDARY HANDLING PATTERNS
═══════════════════════════════════════════════════════════════════════════════

1. Explicit Boundary Check:
   if (0 <= row < rows and 0 <= col < cols):
       # Valid cell, process it

2. Border-Connected Regions (Surrounded Regions Problem):
   ┌──────────────┐
   │ X  X  X  X │  ← Top border: Mark all 'O' as SAFE
   │ X  O  O  X │
   │ X  X  O  X │
   │ X  O  X  X │  ← Bottom border: Mark all 'O' as SAFE
   └──────────────┘
   ↑           ↑
   Left        Right borders

3. Four Corners Access:
   Top-Left:     (0, 0)
   Top-Right:    (0, cols-1)
   Bottom-Left:  (rows-1, 0)
   Bottom-Right: (rows-1, cols-1)

═══════════════════════════════════════════════════════════════════════════════
                    STATE ENCODING TRICKS
═══════════════════════════════════════════════════════════════════════════════

When you need to track both old and new states in-place:

Game of Life Example:
  Original → New     Encoded Value
  ────────────────────────────────
    0    →   0            0        (stay dead)
    1    →   0            2        (die)
    0    →   1            3        (become alive)
    1    →   1            1        (stay alive)

Decode: newState = encodedValue % 2
Check original: originalState = (encodedValue == 1 or encodedValue == 2)

Visual Example:
Before:           Encoded:          After Decode:
┌─────────┐      ┌─────────┐       ┌─────────┐
│ 0  1  0 │      │ 0  2  0 │       │ 0  0  0 │
│ 1  1  1 │  →   │ 3  1  2 │   →   │ 1  1  0 │
│ 0  1  0 │      │ 0  3  0 │       │ 0  1  0 │
└─────────┘      └─────────┘       └─────────┘

═══════════════════════════════════════════════════════════════════════════════
```

---

## Recognition Guidelines

### How to Identify This Pattern?
Look for these keywords in the problem:
- "2D grid", "matrix", "board", "image"
- "islands", "regions", "connected components"
- "flood fill", "surrounded regions"
- "shortest path in grid"
- "spiral order", "rotate matrix"
- "cells", "neighbors", "adjacent"

### Key Indicators:
1. Input is a 2D array/grid
2. Need to explore neighbors of a cell
3. Need to mark visited cells
4. Path finding or connectivity problems
5. Transforming matrix in-place

---

## Template/Pseudocode

### DFS Template
```python
def dfs(grid, row, col, visited):
    # Boundary check
    if row < 0 or row >= len(grid) or col < 0 or col >= len(grid[0]):
        return

    # Already visited or invalid cell
    if visited[row][col] or grid[row][col] == invalid_value:
        return

    # Mark as visited
    visited[row][col] = True

    # Process current cell
    # ... do something with grid[row][col]

    # Explore all 4 directions
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    for dr, dc in directions:
        dfs(grid, row + dr, col + dc, visited)
```

### BFS Template
```python
from collections import deque

def bfs(grid, start_row, start_col):
    queue = deque([(start_row, start_col)])
    visited = set([(start_row, start_col)])

    while queue:
        row, col = queue.popleft()

        # Process current cell
        # ... do something with grid[row][col]

        # Explore neighbors
        for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            new_row, new_col = row + dr, col + dc

            if (0 <= new_row < len(grid) and
                0 <= new_col < len(grid[0]) and
                (new_row, new_col) not in visited and
                grid[new_row][new_col] != invalid_value):

                visited.add((new_row, new_col))
                queue.append((new_row, new_col))
```

---

## Problems

### 1. Number of Islands (Medium)
**LeetCode**: https://leetcode.com/problems/number-of-islands/

**Description**: Given a 2D grid of '1's (land) and '0's (water), count the number of islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.

**Python Solution**:
```python
def numIslands(grid: list[list[str]]) -> int:
    """
    Use DFS to mark all connected land cells as visited.
    Each DFS call represents one island.
    """
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    island_count = 0

    def dfs(r, c):
        # Step 1: Check boundaries
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return

        # Step 2: Check if water or already visited
        if grid[r][c] != '1':
            return

        # Step 3: Mark as visited by changing to '0'
        grid[r][c] = '0'

        # Step 4: Explore all 4 directions
        dfs(r + 1, c)  # down
        dfs(r - 1, c)  # up
        dfs(r, c + 1)  # right
        dfs(r, c - 1)  # left

    # Step 5: Iterate through each cell
    for r in range(rows):
        for c in range(cols):
            # Step 6: Found new island, increment count and mark all connected land
            if grid[r][c] == '1':
                island_count += 1
                dfs(r, c)

    return island_count
```

**TypeScript Solution**:
```typescript
function numIslands(grid: string[][]): number {
    // Handle empty grid
    if (!grid || grid.length === 0) return 0;

    const rows = grid.length;
    const cols = grid[0].length;
    let islandCount = 0;

    function dfs(r: number, c: number): void {
        // Step 1: Boundary check
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
            return;
        }

        // Step 2: Check if water or already visited
        if (grid[r][c] !== '1') {
            return;
        }

        // Step 3: Mark current cell as visited
        grid[r][c] = '0';

        // Step 4: Explore all 4 directions
        dfs(r + 1, c);  // down
        dfs(r - 1, c);  // up
        dfs(r, c + 1);  // right
        dfs(r, c - 1);  // left
    }

    // Step 5: Scan entire grid
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Step 6: Found unvisited land - new island
            if (grid[r][c] === '1') {
                islandCount++;
                dfs(r, c);
            }
        }
    }

    return islandCount;
}
```

**Complexity**:
- Time: O(m × n) - visit each cell once
- Space: O(m × n) - recursion stack in worst case

---

### 2. Flood Fill (Easy)
**LeetCode**: https://leetcode.com/problems/flood-fill/

**Description**: Perform flood fill starting from pixel (sr, sc). Change the color of the starting pixel and all connected pixels with the same color.

**Python Solution**:
```python
def floodFill(image: list[list[int]], sr: int, sc: int, color: int) -> list[list[int]]:
    """
    DFS approach to fill all connected pixels with same starting color.
    """
    original_color = image[sr][sc]

    # Step 1: If color is same, no need to fill
    if original_color == color:
        return image

    rows, cols = len(image), len(image[0])

    def dfs(r, c):
        # Step 2: Boundary check
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return

        # Step 3: Check if pixel has original color
        if image[r][c] != original_color:
            return

        # Step 4: Fill with new color
        image[r][c] = color

        # Step 5: Fill all 4 directions
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    # Step 6: Start flood fill from given position
    dfs(sr, sc)
    return image
```

**TypeScript Solution**:
```typescript
function floodFill(image: number[][], sr: number, sc: number, color: number): number[][] {
    const originalColor = image[sr][sc];

    // Step 1: Already the target color, no work needed
    if (originalColor === color) return image;

    const rows = image.length;
    const cols = image[0].length;

    function dfs(r: number, c: number): void {
        // Step 2: Check boundaries
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
            return;
        }

        // Step 3: Check if current pixel has original color
        if (image[r][c] !== originalColor) {
            return;
        }

        // Step 4: Paint current pixel
        image[r][c] = color;

        // Step 5: Recursively fill neighbors
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
    }

    // Step 6: Begin flood fill
    dfs(sr, sc);
    return image;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n) - recursion depth

---

### 3. Surrounded Regions (Medium)
**LeetCode**: https://leetcode.com/problems/surrounded-regions/

**Description**: Capture all 'O' regions surrounded by 'X'. A region is captured by flipping all 'O's into 'X's in that surrounded region.

**Python Solution**:
```python
def solve(board: list[list[str]]) -> None:
    """
    Key insight: Mark all 'O's connected to border as safe.
    Then flip all remaining 'O's to 'X'.
    """
    if not board or not board[0]:
        return

    rows, cols = len(board), len(board[0])

    def dfs(r, c):
        # Step 1: Check boundaries
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return

        # Step 2: Only process 'O' cells
        if board[r][c] != 'O':
            return

        # Step 3: Mark as safe (temporary marker)
        board[r][c] = 'S'

        # Step 4: Mark all connected 'O's
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    # Step 5: Mark all border-connected 'O's as safe
    # Check first and last row
    for c in range(cols):
        dfs(0, c)
        dfs(rows - 1, c)

    # Check first and last column
    for r in range(rows):
        dfs(r, 0)
        dfs(r, cols - 1)

    # Step 6: Flip all remaining 'O's to 'X', restore 'S' to 'O'
    for r in range(rows):
        for c in range(cols):
            if board[r][c] == 'O':
                board[r][c] = 'X'  # Surrounded region
            elif board[r][c] == 'S':
                board[r][c] = 'O'  # Safe region
```

**TypeScript Solution**:
```typescript
function solve(board: string[][]): void {
    if (!board || board.length === 0) return;

    const rows = board.length;
    const cols = board[0].length;

    function dfs(r: number, c: number): void {
        // Step 1: Boundary validation
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
            return;
        }

        // Step 2: Only mark 'O' cells
        if (board[r][c] !== 'O') {
            return;
        }

        // Step 3: Mark as safe using temporary marker
        board[r][c] = 'S';

        // Step 4: Recursively mark connected cells
        dfs(r + 1, c);
        dfs(r - 1, c);
        dfs(r, c + 1);
        dfs(r, c - 1);
    }

    // Step 5: Mark border-connected 'O's
    // Top and bottom borders
    for (let c = 0; c < cols; c++) {
        dfs(0, c);
        dfs(rows - 1, c);
    }

    // Left and right borders
    for (let r = 0; r < rows; r++) {
        dfs(r, 0);
        dfs(r, cols - 1);
    }

    // Step 6: Process entire board
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c] === 'O') {
                board[r][c] = 'X';  // Captured
            } else if (board[r][c] === 'S') {
                board[r][c] = 'O';  // Safe
            }
        }
    }
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n)

---

### 4. Rotting Oranges (Medium)
**LeetCode**: https://leetcode.com/problems/rotting-oranges/

**Description**: In a grid, 0 = empty, 1 = fresh orange, 2 = rotten orange. Every minute, fresh oranges adjacent to rotten ones become rotten. Return minimum minutes until no fresh oranges remain, or -1 if impossible.

**Python Solution**:
```python
from collections import deque

def orangesRotting(grid: list[list[int]]) -> int:
    """
    BFS approach: Process all rotten oranges level by level.
    Each level represents one minute.
    """
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh_count = 0

    # Step 1: Find all initial rotten oranges and count fresh ones
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh_count += 1

    # Step 2: If no fresh oranges, return 0
    if fresh_count == 0:
        return 0

    minutes = 0
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

    # Step 3: BFS level by level
    while queue:
        # Step 4: Process all oranges that rot in this minute
        for _ in range(len(queue)):
            r, c = queue.popleft()

            # Step 5: Try to rot adjacent fresh oranges
            for dr, dc in directions:
                nr, nc = r + dr, c + dc

                # Step 6: Check if valid and fresh
                if (0 <= nr < rows and 0 <= nc < cols and
                    grid[nr][nc] == 1):
                    # Step 7: Rot this orange
                    grid[nr][nc] = 2
                    fresh_count -= 1
                    queue.append((nr, nc))

        # Step 8: Increment time after processing this level
        minutes += 1

    # Step 9: Check if all fresh oranges rotted
    # Subtract 1 because we increment after last level
    return minutes - 1 if fresh_count == 0 else -1
```

**TypeScript Solution**:
```typescript
function orangesRotting(grid: number[][]): number {
    const rows = grid.length;
    const cols = grid[0].length;
    const queue: [number, number][] = [];
    let freshCount = 0;

    // Step 1: Initialize queue with rotten oranges
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 2) {
                queue.push([r, c]);
            } else if (grid[r][c] === 1) {
                freshCount++;
            }
        }
    }

    // Step 2: No fresh oranges initially
    if (freshCount === 0) return 0;

    let minutes = 0;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    // Step 3: BFS traversal
    while (queue.length > 0) {
        const levelSize = queue.length;

        // Step 4: Process current minute's rotten oranges
        for (let i = 0; i < levelSize; i++) {
            const [r, c] = queue.shift()!;

            // Step 5: Check all 4 neighbors
            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;

                // Step 6: Valid and fresh orange
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                    grid[nr][nc] === 1) {
                    // Step 7: Make it rotten
                    grid[nr][nc] = 2;
                    freshCount--;
                    queue.push([nr, nc]);
                }
            }
        }

        // Step 8: One minute passed
        minutes++;
    }

    // Step 9: Return result
    return freshCount === 0 ? minutes - 1 : -1;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n)

---

### 5. Pacific Atlantic Water Flow (Medium)
**LeetCode**: https://leetcode.com/problems/pacific-atlantic-water-flow/

**Description**: Given a matrix of heights, find cells where water can flow to both Pacific (top/left edges) and Atlantic (bottom/right edges) oceans. Water flows from higher or equal height to lower height.

**Python Solution**:
```python
def pacificAtlantic(heights: list[list[int]]) -> list[list[int]]:
    """
    Reverse thinking: Start from oceans and flow upward.
    Find cells reachable from both oceans.
    """
    if not heights or not heights[0]:
        return []

    rows, cols = len(heights), len(heights[0])
    pacific = set()
    atlantic = set()

    def dfs(r, c, visited, prev_height):
        # Step 1: Boundary check
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            (r, c) in visited or heights[r][c] < prev_height):
            return

        # Step 2: Mark as reachable
        visited.add((r, c))

        # Step 3: Flow to higher or equal cells
        for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            dfs(r + dr, c + dc, visited, heights[r][c])

    # Step 4: Start DFS from Pacific borders (top and left)
    for c in range(cols):
        dfs(0, c, pacific, heights[0][c])
        dfs(rows - 1, c, atlantic, heights[rows - 1][c])

    for r in range(rows):
        dfs(r, 0, pacific, heights[r][0])
        dfs(r, cols - 1, atlantic, heights[r][cols - 1])

    # Step 5: Find intersection of both sets
    result = []
    for r in range(rows):
        for c in range(cols):
            if (r, c) in pacific and (r, c) in atlantic:
                result.append([r, c])

    return result
```

**TypeScript Solution**:
```typescript
function pacificAtlantic(heights: number[][]): number[][] {
    if (!heights || heights.length === 0) return [];

    const rows = heights.length;
    const cols = heights[0].length;
    const pacific = new Set<string>();
    const atlantic = new Set<string>();

    function dfs(r: number, c: number, visited: Set<string>, prevHeight: number): void {
        const key = `${r},${c}`;

        // Step 1: Validation checks
        if (r < 0 || r >= rows || c < 0 || c >= cols ||
            visited.has(key) || heights[r][c] < prevHeight) {
            return;
        }

        // Step 2: Mark as visited
        visited.add(key);

        // Step 3: Explore neighbors with flow logic
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (const [dr, dc] of directions) {
            dfs(r + dr, c + dc, visited, heights[r][c]);
        }
    }

    // Step 4: DFS from ocean borders
    for (let c = 0; c < cols; c++) {
        dfs(0, c, pacific, heights[0][c]);
        dfs(rows - 1, c, atlantic, heights[rows - 1][c]);
    }

    for (let r = 0; r < rows; r++) {
        dfs(r, 0, pacific, heights[r][0]);
        dfs(r, cols - 1, atlantic, heights[r][cols - 1]);
    }

    // Step 5: Find cells reachable from both oceans
    const result: number[][] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const key = `${r},${c}`;
            if (pacific.has(key) && atlantic.has(key)) {
                result.push([r, c]);
            }
        }
    }

    return result;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n)

---

### 6. Spiral Matrix (Medium)
**LeetCode**: https://leetcode.com/problems/spiral-matrix/

**Description**: Return all elements of a matrix in spiral order (right → down → left → up → repeat).

**Python Solution**:
```python
def spiralOrder(matrix: list[list[int]]) -> list[int]:
    """
    Use 4 boundaries that shrink as we traverse.
    Direction order: right, down, left, up.
    """
    if not matrix or not matrix[0]:
        return []

    result = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1

    while top <= bottom and left <= right:
        # Step 1: Move right along top row
        for c in range(left, right + 1):
            result.append(matrix[top][c])
        top += 1  # Shrink top boundary

        # Step 2: Move down along right column
        for r in range(top, bottom + 1):
            result.append(matrix[r][right])
        right -= 1  # Shrink right boundary

        # Step 3: Move left along bottom row (if still valid)
        if top <= bottom:
            for c in range(right, left - 1, -1):
                result.append(matrix[bottom][c])
            bottom -= 1  # Shrink bottom boundary

        # Step 4: Move up along left column (if still valid)
        if left <= right:
            for r in range(bottom, top - 1, -1):
                result.append(matrix[r][left])
            left += 1  # Shrink left boundary

    return result
```

**TypeScript Solution**:
```typescript
function spiralOrder(matrix: number[][]): number[] {
    if (!matrix || matrix.length === 0) return [];

    const result: number[] = [];
    let top = 0, bottom = matrix.length - 1;
    let left = 0, right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        // Step 1: Traverse right
        for (let c = left; c <= right; c++) {
            result.push(matrix[top][c]);
        }
        top++;

        // Step 2: Traverse down
        for (let r = top; r <= bottom; r++) {
            result.push(matrix[r][right]);
        }
        right--;

        // Step 3: Traverse left (check if row still exists)
        if (top <= bottom) {
            for (let c = right; c >= left; c--) {
                result.push(matrix[bottom][c]);
            }
            bottom--;
        }

        // Step 4: Traverse up (check if column still exists)
        if (left <= right) {
            for (let r = bottom; r >= top; r--) {
                result.push(matrix[r][left]);
            }
            left++;
        }
    }

    return result;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(1) excluding output

---

### 7. Rotate Image (Medium)
**LeetCode**: https://leetcode.com/problems/rotate-image/

**Description**: Rotate an n×n matrix by 90 degrees clockwise in-place.

**Python Solution**:
```python
def rotate(matrix: list[list[int]]) -> None:
    """
    Two-step approach:
    1. Transpose the matrix (swap rows and columns)
    2. Reverse each row

    Example:
    Original:        Transpose:       Reverse rows:
    [[1, 2, 3],      [[1, 4, 7],      [[7, 4, 1],
     [4, 5, 6],  →    [2, 5, 8],  →    [8, 5, 2],
     [7, 8, 9]]       [3, 6, 9]]       [9, 6, 3]]
    """
    n = len(matrix)

    # Step 1: Transpose matrix (swap matrix[i][j] with matrix[j][i])
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]

    # Step 2: Reverse each row
    for i in range(n):
        matrix[i].reverse()
```

**TypeScript Solution**:
```typescript
function rotate(matrix: number[][]): void {
    const n = matrix.length;

    // Step 1: Transpose the matrix
    // Swap elements across diagonal
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
        }
    }

    // Step 2: Reverse each row
    for (let i = 0; i < n; i++) {
        matrix[i].reverse();
    }
}
```

**Complexity**:
- Time: O(n²)
- Space: O(1)

---

### 8. Word Search (Medium)
**LeetCode**: https://leetcode.com/problems/word-search/

**Description**: Given a 2D board and a word, check if the word exists in the grid. The word can be constructed from letters of adjacent cells (horizontally or vertically). Same cell cannot be used twice.

**Python Solution**:
```python
def exist(board: list[list[str]], word: str) -> bool:
    """
    Backtracking DFS with visited tracking.
    Try starting from each cell.
    """
    rows, cols = len(board), len(board[0])

    def dfs(r, c, index):
        # Step 1: Found complete word
        if index == len(word):
            return True

        # Step 2: Boundary and character check
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            board[r][c] != word[index]):
            return False

        # Step 3: Mark current cell as visited
        temp = board[r][c]
        board[r][c] = '#'

        # Step 4: Explore all 4 directions
        found = (dfs(r + 1, c, index + 1) or
                 dfs(r - 1, c, index + 1) or
                 dfs(r, c + 1, index + 1) or
                 dfs(r, c - 1, index + 1))

        # Step 5: Backtrack - restore cell
        board[r][c] = temp

        return found

    # Step 6: Try starting from each cell
    for r in range(rows):
        for c in range(cols):
            if dfs(r, c, 0):
                return True

    return False
```

**TypeScript Solution**:
```typescript
function exist(board: string[][], word: string): boolean {
    const rows = board.length;
    const cols = board[0].length;

    function dfs(r: number, c: number, index: number): boolean {
        // Step 1: Complete match found
        if (index === word.length) {
            return true;
        }

        // Step 2: Invalid position or character mismatch
        if (r < 0 || r >= rows || c < 0 || c >= cols ||
            board[r][c] !== word[index]) {
            return false;
        }

        // Step 3: Mark as visited
        const temp = board[r][c];
        board[r][c] = '#';

        // Step 4: Try all directions
        const found = dfs(r + 1, c, index + 1) ||
                      dfs(r - 1, c, index + 1) ||
                      dfs(r, c + 1, index + 1) ||
                      dfs(r, c - 1, index + 1);

        // Step 5: Restore cell (backtrack)
        board[r][c] = temp;

        return found;
    }

    // Step 6: Check starting from every cell
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (dfs(r, c, 0)) {
                return true;
            }
        }
    }

    return false;
}
```

**Complexity**:
- Time: O(m × n × 4^L) where L is word length
- Space: O(L) for recursion

---

### 9. Shortest Path in Binary Matrix (Medium)
**LeetCode**: https://leetcode.com/problems/shortest-path-in-binary-matrix/

**Description**: Find shortest clear path from top-left to bottom-right in binary matrix. Can move in 8 directions. Return -1 if no path exists.

**Python Solution**:
```python
from collections import deque

def shortestPathBinaryMatrix(grid: list[list[int]]) -> int:
    """
    BFS to find shortest path.
    Use 8-directional movement.
    """
    n = len(grid)

    # Step 1: Check if start or end is blocked
    if grid[0][0] == 1 or grid[n-1][n-1] == 1:
        return -1

    # Step 2: Initialize BFS
    queue = deque([(0, 0, 1)])  # (row, col, distance)
    grid[0][0] = 1  # Mark as visited

    # Step 3: 8 directions
    directions = [(-1,-1), (-1,0), (-1,1), (0,-1),
                  (0,1), (1,-1), (1,0), (1,1)]

    while queue:
        r, c, dist = queue.popleft()

        # Step 4: Reached destination
        if r == n - 1 and c == n - 1:
            return dist

        # Step 5: Explore all 8 neighbors
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 6: Check validity
            if (0 <= nr < n and 0 <= nc < n and grid[nr][nc] == 0):
                # Step 7: Mark visited and add to queue
                grid[nr][nc] = 1
                queue.append((nr, nc, dist + 1))

    # Step 8: No path found
    return -1
```

**TypeScript Solution**:
```typescript
function shortestPathBinaryMatrix(grid: number[][]): number {
    const n = grid.length;

    // Step 1: Validate start and end
    if (grid[0][0] === 1 || grid[n-1][n-1] === 1) {
        return -1;
    }

    // Step 2: BFS initialization
    const queue: [number, number, number][] = [[0, 0, 1]];
    grid[0][0] = 1;

    // Step 3: 8-directional movement
    const directions = [
        [-1,-1], [-1,0], [-1,1],
        [0,-1],          [0,1],
        [1,-1],  [1,0],  [1,1]
    ];

    while (queue.length > 0) {
        const [r, c, dist] = queue.shift()!;

        // Step 4: Check if reached destination
        if (r === n - 1 && c === n - 1) {
            return dist;
        }

        // Step 5: Try all 8 directions
        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            // Step 6: Validate and process neighbor
            if (nr >= 0 && nr < n && nc >= 0 && nc < n &&
                grid[nr][nc] === 0) {
                grid[nr][nc] = 1;
                queue.push([nr, nc, dist + 1]);
            }
        }
    }

    // Step 7: No path exists
    return -1;
}
```

**Complexity**:
- Time: O(n²)
- Space: O(n²)

---

### 10. Set Matrix Zeroes (Medium)
**LeetCode**: https://leetcode.com/problems/set-matrix-zeroes/

**Description**: Given m×n matrix, if an element is 0, set its entire row and column to 0. Do it in-place.

**Python Solution**:
```python
def setZeroes(matrix: list[list[int]]) -> None:
    """
    Use first row and column as markers.
    Need special flag for first column.
    """
    rows, cols = len(matrix), len(matrix[0])
    first_col_has_zero = False

    # Step 1: Check if first column has zero
    for r in range(rows):
        if matrix[r][0] == 0:
            first_col_has_zero = True
            break

    # Step 2: Use first row/col to mark zeros
    for r in range(rows):
        for c in range(cols):
            if matrix[r][c] == 0:
                matrix[r][0] = 0  # Mark row
                matrix[0][c] = 0  # Mark column

    # Step 3: Set zeros based on markers (skip first row/col for now)
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0

    # Step 4: Handle first row
    if matrix[0][0] == 0:
        for c in range(cols):
            matrix[0][c] = 0

    # Step 5: Handle first column
    if first_col_has_zero:
        for r in range(rows):
            matrix[r][0] = 0
```

**TypeScript Solution**:
```typescript
function setZeroes(matrix: number[][]): void {
    const rows = matrix.length;
    const cols = matrix[0].length;
    let firstColHasZero = false;

    // Step 1: Check if first column contains zero
    for (let r = 0; r < rows; r++) {
        if (matrix[r][0] === 0) {
            firstColHasZero = true;
            break;
        }
    }

    // Step 2: Use first row/column as markers
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (matrix[r][c] === 0) {
                matrix[r][0] = 0;
                matrix[0][c] = 0;
            }
        }
    }

    // Step 3: Set zeros based on markers
    for (let r = 1; r < rows; r++) {
        for (let c = 1; c < cols; c++) {
            if (matrix[r][0] === 0 || matrix[0][c] === 0) {
                matrix[r][c] = 0;
            }
        }
    }

    // Step 4: Process first row
    if (matrix[0][0] === 0) {
        for (let c = 0; c < cols; c++) {
            matrix[0][c] = 0;
        }
    }

    // Step 5: Process first column
    if (firstColHasZero) {
        for (let r = 0; r < rows; r++) {
            matrix[r][0] = 0;
        }
    }
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(1)

---

### 11. Game of Life (Medium)
**LeetCode**: https://leetcode.com/problems/game-of-life/

**Description**: Implement Conway's Game of Life. Given current state, compute next state based on rules: 1) Live cell with <2 or >3 neighbors dies. 2) Live cell with 2-3 neighbors lives. 3) Dead cell with exactly 3 neighbors becomes alive.

**Python Solution**:
```python
def gameOfLife(board: list[list[int]]) -> None:
    """
    Use encoding to store old and new state:
    0 -> 0: stay dead (0)
    1 -> 0: die (2)
    0 -> 1: become alive (3)
    1 -> 1: stay alive (1)
    """
    rows, cols = len(board), len(board[0])

    def count_live_neighbors(r, c):
        # Step 1: Count live neighbors in 8 directions
        count = 0
        for dr in [-1, 0, 1]:
            for dc in [-1, 0, 1]:
                if dr == 0 and dc == 0:
                    continue
                nr, nc = r + dr, c + dc
                # Step 2: Check boundaries and original state
                if (0 <= nr < rows and 0 <= nc < cols and
                    board[nr][nc] in [1, 2]):  # Originally alive
                    count += 1
        return count

    # Step 3: Mark transitions
    for r in range(rows):
        for c in range(cols):
            live_neighbors = count_live_neighbors(r, c)

            # Step 4: Apply Game of Life rules
            if board[r][c] == 1:  # Currently alive
                if live_neighbors < 2 or live_neighbors > 3:
                    board[r][c] = 2  # Dies
            else:  # Currently dead
                if live_neighbors == 3:
                    board[r][c] = 3  # Becomes alive

    # Step 5: Decode to final state
    for r in range(rows):
        for c in range(cols):
            if board[r][c] == 2:
                board[r][c] = 0
            elif board[r][c] == 3:
                board[r][c] = 1
```

**TypeScript Solution**:
```typescript
function gameOfLife(board: number[][]): void {
    const rows = board.length;
    const cols = board[0].length;

    function countLiveNeighbors(r: number, c: number): number {
        let count = 0;

        // Step 1: Check all 8 directions
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;

                const nr = r + dr;
                const nc = c + dc;

                // Step 2: Count originally live cells
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                    (board[nr][nc] === 1 || board[nr][nc] === 2)) {
                    count++;
                }
            }
        }

        return count;
    }

    // Step 3: First pass - mark transitions
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const liveNeighbors = countLiveNeighbors(r, c);

            // Step 4: Apply rules
            if (board[r][c] === 1) {
                if (liveNeighbors < 2 || liveNeighbors > 3) {
                    board[r][c] = 2;  // Will die
                }
            } else {
                if (liveNeighbors === 3) {
                    board[r][c] = 3;  // Will become alive
                }
            }
        }
    }

    // Step 5: Second pass - update to final state
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            board[r][c] = board[r][c] % 2;
        }
    }
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(1)

---

### 12. Maximal Square (Medium)
**LeetCode**: https://leetcode.com/problems/maximal-square/

**Description**: Given a 2D binary matrix filled with 0's and 1's, find the largest square containing only 1's and return its area.

**Python Solution**:
```python
def maximalSquare(matrix: list[list[str]]) -> int:
    """
    DP approach: dp[i][j] = side length of largest square ending at (i,j)
    Formula: dp[i][j] = min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) + 1
    """
    if not matrix or not matrix[0]:
        return 0

    rows, cols = len(matrix), len(matrix[0])
    max_side = 0

    # Step 1: Create DP table
    dp = [[0] * cols for _ in range(rows)]

    # Step 2: Fill DP table
    for r in range(rows):
        for c in range(cols):
            if matrix[r][c] == '1':
                if r == 0 or c == 0:
                    # Step 3: First row/column - can only be 1x1 square
                    dp[r][c] = 1
                else:
                    # Step 4: Take minimum of three neighbors + 1
                    dp[r][c] = min(dp[r-1][c], dp[r][c-1], dp[r-1][c-1]) + 1

                # Step 5: Update max side length
                max_side = max(max_side, dp[r][c])

    # Step 6: Return area
    return max_side * max_side
```

**TypeScript Solution**:
```typescript
function maximalSquare(matrix: string[][]): number {
    if (!matrix || matrix.length === 0) return 0;

    const rows = matrix.length;
    const cols = matrix[0].length;
    let maxSide = 0;

    // Step 1: Initialize DP array
    const dp: number[][] = Array(rows).fill(0).map(() => Array(cols).fill(0));

    // Step 2: Process each cell
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (matrix[r][c] === '1') {
                if (r === 0 || c === 0) {
                    // Step 3: Edge cells
                    dp[r][c] = 1;
                } else {
                    // Step 4: DP formula
                    dp[r][c] = Math.min(
                        dp[r-1][c],
                        dp[r][c-1],
                        dp[r-1][c-1]
                    ) + 1;
                }

                // Step 5: Track maximum
                maxSide = Math.max(maxSide, dp[r][c]);
            }
        }
    }

    // Step 6: Return area
    return maxSide * maxSide;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n) - can optimize to O(n)

---

### 13. Valid Sudoku (Medium)
**LeetCode**: https://leetcode.com/problems/valid-sudoku/

**Description**: Determine if a 9×9 Sudoku board is valid. Only filled cells need to be validated according to Sudoku rules.

**Python Solution**:
```python
def isValidSudoku(board: list[list[str]]) -> bool:
    """
    Use sets to track seen numbers in rows, columns, and 3x3 boxes.
    """
    # Step 1: Initialize tracking sets
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]

    # Step 2: Scan entire board
    for r in range(9):
        for c in range(9):
            num = board[r][c]

            # Step 3: Skip empty cells
            if num == '.':
                continue

            # Step 4: Calculate which 3x3 box this cell belongs to
            box_index = (r // 3) * 3 + (c // 3)

            # Step 5: Check if number already seen in row/col/box
            if (num in rows[r] or
                num in cols[c] or
                num in boxes[box_index]):
                return False

            # Step 6: Add to tracking sets
            rows[r].add(num)
            cols[c].add(num)
            boxes[box_index].add(num)

    return True
```

**TypeScript Solution**:
```typescript
function isValidSudoku(board: string[][]): boolean {
    // Step 1: Create tracking structures
    const rows: Set<string>[] = Array(9).fill(0).map(() => new Set());
    const cols: Set<string>[] = Array(9).fill(0).map(() => new Set());
    const boxes: Set<string>[] = Array(9).fill(0).map(() => new Set());

    // Step 2: Iterate through board
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            const num = board[r][c];

            // Step 3: Skip empty cells
            if (num === '.') continue;

            // Step 4: Determine box index
            const boxIdx = Math.floor(r / 3) * 3 + Math.floor(c / 3);

            // Step 5: Validation check
            if (rows[r].has(num) || cols[c].has(num) || boxes[boxIdx].has(num)) {
                return false;
            }

            // Step 6: Record number
            rows[r].add(num);
            cols[c].add(num);
            boxes[boxIdx].add(num);
        }
    }

    return true;
}
```

**Complexity**:
- Time: O(1) - fixed 9×9 board
- Space: O(1) - fixed size sets

---

### 14. Word Search II (Hard)
**LeetCode**: https://leetcode.com/problems/word-search-ii/

**Description**: Find all words from a given word list that can be found in a 2D board. Words can be constructed from adjacent cells.

**Python Solution**:
```python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.word = None

def findWords(board: list[list[str]], words: list[str]) -> list[str]:
    """
    Build Trie from words, then DFS on board.
    Prune Trie nodes as words are found.
    """
    # Step 1: Build Trie
    root = TrieNode()
    for word in words:
        node = root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.word = word

    rows, cols = len(board), len(board[0])
    result = []

    def dfs(r, c, node):
        # Step 2: Get current character
        char = board[r][c]

        # Step 3: Check if character in Trie
        if char not in node.children:
            return

        # Step 4: Move to next Trie node
        node = node.children[char]

        # Step 5: Found a word
        if node.word:
            result.append(node.word)
            node.word = None  # Avoid duplicates

        # Step 6: Mark cell as visited
        board[r][c] = '#'

        # Step 7: Explore all 4 directions
        for dr, dc in [(0,1), (1,0), (0,-1), (-1,0)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != '#':
                dfs(nr, nc, node)

        # Step 8: Restore cell
        board[r][c] = char

        # Step 9: Prune Trie (optimization)
        if not node.children:
            del node.children[char]

    # Step 10: Start DFS from each cell
    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)

    return result
```

**TypeScript Solution**:
```typescript
class TrieNode {
    children: Map<string, TrieNode> = new Map();
    word: string | null = null;
}

function findWords(board: string[][], words: string[]): string[] {
    // Step 1: Build Trie from word list
    const root = new TrieNode();
    for (const word of words) {
        let node = root;
        for (const char of word) {
            if (!node.children.has(char)) {
                node.children.set(char, new TrieNode());
            }
            node = node.children.get(char)!;
        }
        node.word = word;
    }

    const rows = board.length;
    const cols = board[0].length;
    const result: string[] = [];

    function dfs(r: number, c: number, node: TrieNode): void {
        // Step 2: Get character at current position
        const char = board[r][c];

        // Step 3: Check if path exists in Trie
        if (!node.children.has(char)) return;

        // Step 4: Move down Trie
        node = node.children.get(char)!;

        // Step 5: Found complete word
        if (node.word) {
            result.push(node.word);
            node.word = null;  // Prevent duplicates
        }

        // Step 6: Mark as visited
        board[r][c] = '#';

        // Step 7: Explore neighbors
        const directions = [[0,1], [1,0], [0,-1], [-1,0]];
        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                board[nr][nc] !== '#') {
                dfs(nr, nc, node);
            }
        }

        // Step 8: Restore cell
        board[r][c] = char;
    }

    // Step 9: Try starting from every cell
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            dfs(r, c, root);
        }
    }

    return result;
}
```

**Complexity**:
- Time: O(m × n × 4^L) where L is max word length
- Space: O(total characters in all words)

---

### 15. The Maze (Medium)
**LeetCode**: https://leetcode.com/problems/the-maze/ (Premium)

**Description**: A ball in a maze can roll in 4 directions until it hits a wall. Determine if the ball can reach the destination.

**Python Solution**:
```python
from collections import deque

def hasPath(maze: list[list[int]], start: list[int], destination: list[int]) -> bool:
    """
    BFS where each move continues until hitting a wall.
    """
    rows, cols = len(maze), len(maze[0])
    visited = set()
    queue = deque([tuple(start)])
    visited.add(tuple(start))

    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

    while queue:
        r, c = queue.popleft()

        # Step 1: Check if reached destination
        if [r, c] == destination:
            return True

        # Step 2: Try rolling in each direction
        for dr, dc in directions:
            nr, nc = r, c

            # Step 3: Roll until hitting wall
            while (0 <= nr + dr < rows and
                   0 <= nc + dc < cols and
                   maze[nr + dr][nc + dc] == 0):
                nr += dr
                nc += dc

            # Step 4: Check if this stop position is new
            if (nr, nc) not in visited:
                visited.add((nr, nc))
                queue.append((nr, nc))

    return False
```

**TypeScript Solution**:
```typescript
function hasPath(maze: number[][], start: number[], destination: number[]): boolean {
    const rows = maze.length;
    const cols = maze[0].length;
    const visited = new Set<string>();
    const queue: [number, number][] = [[start[0], start[1]]];
    visited.add(`${start[0]},${start[1]}`);

    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    while (queue.length > 0) {
        const [r, c] = queue.shift()!;

        // Step 1: Destination check
        if (r === destination[0] && c === destination[1]) {
            return true;
        }

        // Step 2: Roll in each direction
        for (const [dr, dc] of directions) {
            let nr = r;
            let nc = c;

            // Step 3: Keep rolling until wall
            while (nr + dr >= 0 && nr + dr < rows &&
                   nc + dc >= 0 && nc + dc < cols &&
                   maze[nr + dr][nc + dc] === 0) {
                nr += dr;
                nc += dc;
            }

            // Step 4: Add new stopping position
            const key = `${nr},${nc}`;
            if (!visited.has(key)) {
                visited.add(key);
                queue.push([nr, nc]);
            }
        }
    }

    return false;
}
```

**Complexity**:
- Time: O(m × n × max(m, n))
- Space: O(m × n)

---

### 16. Max Area of Island (Medium)
**LeetCode**: https://leetcode.com/problems/max-area-of-island/

**Description**: Given a binary matrix where 1 represents land and 0 represents water, find the maximum area of an island. An island is a group of connected 1's (4-directionally).

**Python Solution**:
```python
def maxAreaOfIsland(grid: list[list[int]]) -> int:
    """
    DFS to calculate area of each island and track maximum.

    Visualization:
    ┌──────────────────┐
    │ 0  0  1  0  0  0 │
    │ 0  1  1  1  0  0 │  Island area = 6
    │ 0  1  0  1  0  0 │  (marked with *)
    │ 1  1  0  0  0  0 │
    │ 0  0  0  0  1  1 │  Island area = 2
    └──────────────────┘

    DFS Spread:
    Start at (0,2):
         *
       * * *
       *   *

    Area count: 6 cells
    """
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    max_area = 0

    def dfs(r, c):
        # Step 1: Boundary and validity check
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            grid[r][c] != 1):
            return 0

        # Step 2: Mark current cell as visited
        grid[r][c] = 0

        # Step 3: Count current cell + all connected cells
        area = 1

        # Step 4: Explore all 4 directions and sum areas
        area += dfs(r + 1, c)  # down
        area += dfs(r - 1, c)  # up
        area += dfs(r, c + 1)  # right
        area += dfs(r, c - 1)  # left

        return area

    # Step 5: Try each cell as potential island start
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                # Step 6: Calculate area and update maximum
                current_area = dfs(r, c)
                max_area = max(max_area, current_area)

    return max_area
```

**TypeScript Solution**:
```typescript
function maxAreaOfIsland(grid: number[][]): number {
    if (!grid || grid.length === 0) return 0;

    const rows = grid.length;
    const cols = grid[0].length;
    let maxArea = 0;

    function dfs(r: number, c: number): number {
        // Step 1: Validate boundaries and cell value
        if (r < 0 || r >= rows || c < 0 || c >= cols ||
            grid[r][c] !== 1) {
            return 0;
        }

        // Step 2: Mark as visited
        grid[r][c] = 0;

        // Step 3: Count this cell
        let area = 1;

        // Step 4: Add areas from all 4 directions
        area += dfs(r + 1, c);
        area += dfs(r - 1, c);
        area += dfs(r, c + 1);
        area += dfs(r, c - 1);

        return area;
    }

    // Step 5: Scan entire grid
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                // Step 6: Track maximum area
                const currentArea = dfs(r, c);
                maxArea = Math.max(maxArea, currentArea);
            }
        }
    }

    return maxArea;
}
```

**Complexity**:
- Time: O(m × n) - visit each cell once
- Space: O(m × n) - recursion stack depth

---

### 17. Island Perimeter (Easy)
**LeetCode**: https://leetcode.com/problems/island-perimeter/

**Description**: Given a grid where 1 is land and 0 is water, calculate the perimeter of the island. There is exactly one island, and it doesn't have lakes (water inside that isn't connected to water around the island).

**Python Solution**:
```python
def islandPerimeter(grid: list[list[int]]) -> int:
    """
    Count perimeter by checking each land cell's neighbors.
    Each land cell contributes 4, minus 1 for each adjacent land cell.

    Visualization:
    ┌─────────────┐
    │ 0  1  0  0 │   Perimeter breakdown:
    │ 1  1  1  0 │
    │ 0  1  0  0 │   Top cell (0,1):    3 edges exposed
    └─────────────┘   Left cell (1,0):  2 edges exposed
                      Center cell (1,1): 0 edges exposed
    Edge count:       Right cell (1,2): 2 edges exposed
       1              Bottom cell (2,1): 3 edges exposed
      ┌─┐
    1 │ │ 1          Total perimeter = 3+2+0+2+3 = 10
    ┌─┴─┴─┬─┐        Or: 5 cells × 4 - 4 internal edges × 2 = 20 - 8 = 12
    │     │ │ 2
    └──┬──┘ │        Alternative: Each cell adds 4, subtract 2 for
       │ 2  │        each neighbor pair
       └────┘
         3
    """
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    perimeter = 0

    # Step 1: Iterate through each cell
    for r in range(rows):
        for c in range(cols):
            # Step 2: Only process land cells
            if grid[r][c] == 1:
                # Step 3: Start with 4 sides
                perimeter += 4

                # Step 4: Subtract 1 for each adjacent land cell (shared edge)
                # Check up
                if r > 0 and grid[r-1][c] == 1:
                    perimeter -= 1

                # Check down
                if r < rows - 1 and grid[r+1][c] == 1:
                    perimeter -= 1

                # Check left
                if c > 0 and grid[r][c-1] == 1:
                    perimeter -= 1

                # Check right
                if c < cols - 1 and grid[r][c+1] == 1:
                    perimeter -= 1

    return perimeter
```

**TypeScript Solution**:
```typescript
function islandPerimeter(grid: number[][]): number {
    if (!grid || grid.length === 0) return 0;

    const rows = grid.length;
    const cols = grid[0].length;
    let perimeter = 0;

    // Step 1: Scan each cell
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Step 2: Process land cells only
            if (grid[r][c] === 1) {
                // Step 3: Each land cell starts with 4 edges
                perimeter += 4;

                // Step 4: Subtract shared edges with neighbors
                // Up neighbor
                if (r > 0 && grid[r-1][c] === 1) {
                    perimeter -= 1;
                }

                // Down neighbor
                if (r < rows - 1 && grid[r+1][c] === 1) {
                    perimeter -= 1;
                }

                // Left neighbor
                if (c > 0 && grid[r][c-1] === 1) {
                    perimeter -= 1;
                }

                // Right neighbor
                if (c < cols - 1 && grid[r][c+1] === 1) {
                    perimeter -= 1;
                }
            }
        }
    }

    return perimeter;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(1)

---

### 18. Walls and Gates (Medium)
**LeetCode**: https://leetcode.com/problems/walls-and-gates/ (Premium)

**Description**: Fill each empty room with the distance to its nearest gate. -1 is a wall, 0 is a gate, and INF (2147483647) is an empty room.

**Python Solution**:
```python
from collections import deque

def wallsAndGates(rooms: list[list[int]]) -> None:
    """
    Multi-source BFS from all gates simultaneously.
    BFS guarantees shortest distance.

    Visualization:
    Initial:              After BFS:
    ┌──────────────┐     ┌──────────────┐
    │ ∞  -1  0  ∞ │     │ 3  -1  0  1 │
    │ ∞   ∞  ∞ -1 │  →  │ 2   2  1 -1 │
    │ ∞  -1  ∞ -1 │     │ 1  -1  2 -1 │
    │ 0  -1  ∞  ∞ │     │ 0  -1  3  4 │
    └──────────────┘     └──────────────┘

    BFS Wave from gates:
    Level 0: [gates at (0,2) and (3,0)]
    Level 1: Cells at distance 1 from any gate
    Level 2: Cells at distance 2 from any gate
    ...

    Queue evolution:
    Start:    [(0,2,0), (3,0,0)]
    Round 1:  [(0,3,1), (1,2,1), (3,1,1)]
    Round 2:  [(1,1,2), (1,3,2), ...]
    """
    if not rooms or not rooms[0]:
        return

    rows, cols = len(rooms), len(rooms[0])
    INF = 2147483647
    queue = deque()

    # Step 1: Add all gates to queue (multi-source BFS)
    for r in range(rows):
        for c in range(cols):
            if rooms[r][c] == 0:
                queue.append((r, c))

    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

    # Step 2: BFS from all gates
    while queue:
        r, c = queue.popleft()

        # Step 3: Try all 4 directions
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 4: Check if valid empty room
            if (0 <= nr < rows and 0 <= nc < cols and
                rooms[nr][nc] == INF):
                # Step 5: Update distance (current distance + 1)
                rooms[nr][nc] = rooms[r][c] + 1
                # Step 6: Add to queue for further exploration
                queue.append((nr, nc))
```

**TypeScript Solution**:
```typescript
function wallsAndGates(rooms: number[][]): void {
    if (!rooms || rooms.length === 0) return;

    const rows = rooms.length;
    const cols = rooms[0].length;
    const INF = 2147483647;
    const queue: [number, number][] = [];

    // Step 1: Find all gates and initialize queue
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (rooms[r][c] === 0) {
                queue.push([r, c]);
            }
        }
    }

    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    // Step 2: Multi-source BFS
    while (queue.length > 0) {
        const [r, c] = queue.shift()!;

        // Step 3: Explore neighbors
        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            // Step 4: Validate and check if empty room
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                rooms[nr][nc] === INF) {
                // Step 5: Set distance
                rooms[nr][nc] = rooms[r][c] + 1;
                // Step 6: Continue BFS
                queue.push([nr, nc]);
            }
        }
    }
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n) - queue size

---

### 19. Diagonal Traverse (Medium)
**LeetCode**: https://leetcode.com/problems/diagonal-traverse/

**Description**: Given an m × n matrix, return all elements in diagonal order (zigzag pattern).

**Python Solution**:
```python
def findDiagonalOrder(mat: list[list[int]]) -> list[int]:
    """
    Traverse diagonals in zigzag pattern.

    Visualization (3×4 matrix):
    ┌─────────────────────┐
    │  1→  2   5   9    │  Diagonal 0: [1]
    │     ↗ ↓ ↗ ↓        │  Diagonal 1: [2,4] (going up)
    │  4   3   6  10    │  Diagonal 2: [3,5,7] (going down)
    │    ↗   ↗ ↓         │  Diagonal 3: [6,8] (going up)
    │  7   8  11         │  Diagonal 4: [9,11] (going down)
    │       ↗            │  Diagonal 5: [10]
    │     12             │
    └─────────────────────┘

    Pattern:
    - Even diagonals (0,2,4...): go DOWN-LEFT (↙)
    - Odd diagonals (1,3,5...):  go UP-RIGHT (↗)

    Algorithm: Use diagonal sum (r+c) to group elements
    """
    if not mat or not mat[0]:
        return []

    rows, cols = len(mat), len(mat[0])
    result = []

    # Step 1: Iterate through all diagonals (0 to rows+cols-2)
    for diagonal in range(rows + cols - 1):
        intermediate = []

        # Step 2: Find starting row for this diagonal
        # For diagonals 0 to rows-1: start from row=diagonal, col=0
        # For diagonals >= rows: start from row=rows-1, col increases
        row = 0 if diagonal < cols else diagonal - cols + 1
        col = diagonal if diagonal < cols else cols - 1

        # Step 3: Collect all elements in this diagonal
        while row < rows and col >= 0:
            intermediate.append(mat[row][col])
            row += 1
            col -= 1

        # Step 4: Reverse for odd diagonals (going up)
        if diagonal % 2 == 0:
            result.extend(intermediate[::-1])
        else:
            result.extend(intermediate)

    return result
```

**TypeScript Solution**:
```typescript
function findDiagonalOrder(mat: number[][]): number[] {
    if (!mat || mat.length === 0) return [];

    const rows = mat.length;
    const cols = mat[0].length;
    const result: number[] = [];

    // Step 1: Process each diagonal
    for (let diagonal = 0; diagonal < rows + cols - 1; diagonal++) {
        const intermediate: number[] = [];

        // Step 2: Determine starting position
        let row = diagonal < cols ? 0 : diagonal - cols + 1;
        let col = diagonal < cols ? diagonal : cols - 1;

        // Step 3: Traverse diagonal
        while (row < rows && col >= 0) {
            intermediate.push(mat[row][col]);
            row++;
            col--;
        }

        // Step 4: Reverse for even diagonals
        if (diagonal % 2 === 0) {
            result.push(...intermediate.reverse());
        } else {
            result.push(...intermediate);
        }
    }

    return result;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(1) excluding output

---

### 20. Number of Distinct Islands (Medium)
**LeetCode**: https://leetcode.com/problems/number-of-distinct-islands/ (Premium)

**Description**: Count the number of distinct islands. Two islands are considered the same if one can be translated (not rotated or reflected) to equal the other.

**Python Solution**:
```python
def numDistinctIslands(grid: list[list[int]]) -> int:
    """
    Use path signature to identify unique island shapes.
    Record the path taken during DFS as island's "signature".

    Visualization:
    ┌─────────────────┐
    │ 1  1  0  1  1 │  Island 1: "DRU" (Down,Right,Up)
    │ 0  1  0  0  1 │  Island 2: "DR" (Down,Right)
    │ 0  0  0  1  1 │  Island 3: "DRU" (same as Island 1)
    └─────────────────┘

    Path encoding during DFS:
    Start → D (down) → R (right) → U (up) → back

    Signature: "DRUB" where B = backtrack
    Using relative positions: [(0,0), (1,0), (1,1), (0,1)]
    """
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    distinct_islands = set()

    def dfs(r, c, start_r, start_c, path):
        # Step 1: Boundary check
        if (r < 0 or r >= rows or c < 0 or c >= cols or
            grid[r][c] != 1):
            return

        # Step 2: Mark visited
        grid[r][c] = 0

        # Step 3: Record relative position from island start
        path.append((r - start_r, c - start_c))

        # Step 4: Explore all 4 directions
        dfs(r + 1, c, start_r, start_c, path)  # Down
        dfs(r - 1, c, start_r, start_c, path)  # Up
        dfs(r, c + 1, start_r, start_c, path)  # Right
        dfs(r, c - 1, start_r, start_c, path)  # Left

    # Step 5: Find all islands
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                # Step 6: Explore island and record path
                path = []
                dfs(r, c, r, c, path)

                # Step 7: Add normalized path to set
                distinct_islands.add(tuple(path))

    return len(distinct_islands)
```

**TypeScript Solution**:
```typescript
function numDistinctIslands(grid: number[][]): number {
    if (!grid || grid.length === 0) return 0;

    const rows = grid.length;
    const cols = grid[0].length;
    const distinctIslands = new Set<string>();

    function dfs(r: number, c: number, startR: number, startC: number,
                 path: number[][]): void {
        // Step 1: Validate cell
        if (r < 0 || r >= rows || c < 0 || c >= cols ||
            grid[r][c] !== 1) {
            return;
        }

        // Step 2: Mark as visited
        grid[r][c] = 0;

        // Step 3: Store relative coordinates
        path.push([r - startR, c - startC]);

        // Step 4: DFS in all directions
        dfs(r + 1, c, startR, startC, path);
        dfs(r - 1, c, startR, startC, path);
        dfs(r, c + 1, startR, startC, path);
        dfs(r, c - 1, startR, startC, path);
    }

    // Step 5: Process each island
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                // Step 6: Get island signature
                const path: number[][] = [];
                dfs(r, c, r, c, path);

                // Step 7: Convert to string and store
                const signature = JSON.stringify(path);
                distinctIslands.add(signature);
            }
        }
    }

    return distinctIslands.size;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n)

---

### 21. Shortest Bridge (Medium)
**LeetCode**: https://leetcode.com/problems/shortest-bridge/

**Description**: Given a binary matrix with exactly two islands, find the smallest number of flips required to connect the two islands (change 0's to 1's).

**Python Solution**:
```python
from collections import deque

def shortestBridge(grid: list[list[int]]) -> int:
    """
    Two-phase approach:
    1. DFS to find first island and add all cells to queue
    2. BFS from first island to find shortest path to second island

    Visualization:
    ┌───────────────┐
    │ 0  1  0  0  0 │  Phase 1: Find island 1 (marked with A)
    │ 0  1  0  0  0 │  Phase 2: Expand from A until reaching B
    │ 0  0  0  1  0 │
    │ 0  0  0  1  1 │  Shortest bridge: 2 flips
    └───────────────┘  (cells between the islands)

    BFS Expansion:
    Distance 0: ██ (island 1)
    Distance 1: ░░ (1 flip)
    Distance 2: ▒▒ (2 flips) - reaches island 2!
    """
    n = len(grid)
    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

    # Step 1: Find first island using DFS
    def dfs(r, c):
        if (r < 0 or r >= n or c < 0 or c >= n or
            grid[r][c] != 1):
            return

        # Mark as visited and add to queue
        grid[r][c] = 2
        queue.append((r, c, 0))  # (row, col, distance)

        # Explore all cells in this island
        for dr, dc in directions:
            dfs(r + dr, c + dc)

    # Step 2: Find first 1 and mark entire first island
    queue = deque()
    found = False
    for r in range(n):
        if found:
            break
        for c in range(n):
            if grid[r][c] == 1:
                dfs(r, c)
                found = True
                break

    # Step 3: BFS from first island to second island
    while queue:
        r, c, dist = queue.popleft()

        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Check bounds
            if nr < 0 or nr >= n or nc < 0 or nc >= n:
                continue

            # Step 4: Found second island!
            if grid[nr][nc] == 1:
                return dist

            # Step 5: Expand through water
            if grid[nr][nc] == 0:
                grid[nr][nc] = 2  # Mark as visited
                queue.append((nr, nc, dist + 1))

    return -1
```

**TypeScript Solution**:
```typescript
function shortestBridge(grid: number[][]): number {
    const n = grid.length;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const queue: [number, number, number][] = [];

    // Step 1: DFS to mark first island
    function dfs(r: number, c: number): void {
        if (r < 0 || r >= n || c < 0 || c >= n ||
            grid[r][c] !== 1) {
            return;
        }

        // Mark cell and add to BFS queue
        grid[r][c] = 2;
        queue.push([r, c, 0]);

        // Continue DFS
        for (const [dr, dc] of directions) {
            dfs(r + dr, c + dc);
        }
    }

    // Step 2: Find and mark first island
    let found = false;
    for (let r = 0; r < n && !found; r++) {
        for (let c = 0; c < n && !found; c++) {
            if (grid[r][c] === 1) {
                dfs(r, c);
                found = true;
            }
        }
    }

    // Step 3: BFS to find shortest bridge
    while (queue.length > 0) {
        const [r, c, dist] = queue.shift()!;

        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            // Boundary check
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) {
                continue;
            }

            // Step 4: Reached second island
            if (grid[nr][nc] === 1) {
                return dist;
            }

            // Step 5: Continue through water
            if (grid[nr][nc] === 0) {
                grid[nr][nc] = 2;
                queue.push([nr, nc, dist + 1]);
            }
        }
    }

    return -1;
}
```

**Complexity**:
- Time: O(n²)
- Space: O(n²)

---

### 22. As Far from Land as Possible (Medium)
**LeetCode**: https://leetcode.com/problems/as-far-from-land-as-possible/

**Description**: Given an n×n grid containing only 0's (water) and 1's (land), find a water cell such that its distance to the nearest land cell is maximized. Return the distance. If no land or no water exists, return -1.

**Python Solution**:
```python
from collections import deque

def maxDistance(grid: list[list[int]]) -> int:
    """
    Multi-source BFS from all land cells.
    Track maximum distance reached.

    Visualization:
    Initial:           Distance map:
    ┌──────────┐      ┌──────────┐
    │ 1  0  0 │      │ 0  1  2 │
    │ 0  0  0 │  →   │ 1  2  3 │
    │ 0  0  1 │      │ 2  1  0 │
    └──────────┘      └──────────┘

    Max distance = 3 (center-right cell)

    BFS waves:
    Wave 0: ■ □ □    (land cells)
            □ □ □
            □ □ ■

    Wave 1: ■ ● □    (distance 1)
            ● □ □
            □ ● ■

    Wave 2: ■ ● ◆    (distance 2)
            ● ◆ ●
            ◆ ● ■
    """
    n = len(grid)
    queue = deque()

    # Step 1: Add all land cells to queue
    for r in range(n):
        for c in range(n):
            if grid[r][c] == 1:
                queue.append((r, c))

    # Step 2: Edge cases - all land or all water
    if len(queue) == 0 or len(queue) == n * n:
        return -1

    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    max_distance = -1

    # Step 3: BFS from all land cells
    while queue:
        r, c = queue.popleft()

        # Step 4: Try all 4 directions
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 5: Check if valid water cell
            if (0 <= nr < n and 0 <= nc < n and
                grid[nr][nc] == 0):
                # Step 6: Calculate distance (current + 1)
                grid[nr][nc] = grid[r][c] + 1
                max_distance = max(max_distance, grid[nr][nc] - 1)
                queue.append((nr, nc))

    return max_distance
```

**TypeScript Solution**:
```typescript
function maxDistance(grid: number[][]): number {
    const n = grid.length;
    const queue: [number, number][] = [];

    // Step 1: Initialize queue with all land cells
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (grid[r][c] === 1) {
                queue.push([r, c]);
            }
        }
    }

    // Step 2: Handle edge cases
    if (queue.length === 0 || queue.length === n * n) {
        return -1;
    }

    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    let maxDistance = -1;

    // Step 3: Multi-source BFS
    while (queue.length > 0) {
        const [r, c] = queue.shift()!;

        // Step 4: Explore neighbors
        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            // Step 5: Process water cells
            if (nr >= 0 && nr < n && nc >= 0 && nc < n &&
                grid[nr][nc] === 0) {
                // Step 6: Update distance
                grid[nr][nc] = grid[r][c] + 1;
                maxDistance = Math.max(maxDistance, grid[nr][nc] - 1);
                queue.push([nr, nc]);
            }
        }
    }

    return maxDistance;
}
```

**Complexity**:
- Time: O(n²)
- Space: O(n²)

---

### 23. Count Sub Islands (Medium)
**LeetCode**: https://leetcode.com/problems/count-sub-islands/

**Description**: Given two binary matrices grid1 and grid2, count the number of islands in grid2 that are also islands in grid1 (sub-islands). An island in grid2 is a sub-island if there exists an island in grid1 that contains all cells of this island.

**Python Solution**:
```python
def countSubIslands(grid1: list[list[int]], grid2: list[list[int]]) -> int:
    """
    DFS on grid2 islands, checking if all cells exist in grid1.

    Visualization:

    grid1:          grid2:          Analysis:
    ┌─────────┐    ┌─────────┐
    │ 1  1  1 │    │ 1  1  0 │    Island A: SUB-ISLAND ✓
    │ 0  0  1 │    │ 0  0  0 │    (all cells in grid1)
    │ 1  1  1 │    │ 1  1  1 │    Island B: NOT sub-island ✗
    │ 1  0  1 │    │ 0  1  1 │    (some cells not in grid1)
    └─────────┘    └─────────┘

    Check process for each island in grid2:
    1. DFS to find all cells in island
    2. Verify every cell is also land in grid1
    3. Count if verification passes
    """
    if not grid1 or not grid2:
        return 0

    rows, cols = len(grid2), len(grid2[0])

    def dfs(r, c):
        # Step 1: Boundary check
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return True

        # Step 2: Water or already visited
        if grid2[r][c] == 0:
            return True

        # Step 3: Mark as visited in grid2
        grid2[r][c] = 0

        # Step 4: Check if this cell exists in grid1
        is_sub_island = grid1[r][c] == 1

        # Step 5: Check all 4 directions (use AND to propagate failure)
        is_sub_island &= dfs(r + 1, c)
        is_sub_island &= dfs(r - 1, c)
        is_sub_island &= dfs(r, c + 1)
        is_sub_island &= dfs(r, c - 1)

        return is_sub_island

    # Step 6: Count sub-islands
    sub_island_count = 0
    for r in range(rows):
        for c in range(cols):
            if grid2[r][c] == 1:
                # Step 7: Check if entire island is a sub-island
                if dfs(r, c):
                    sub_island_count += 1

    return sub_island_count
```

**TypeScript Solution**:
```typescript
function countSubIslands(grid1: number[][], grid2: number[][]): number {
    if (!grid1 || !grid2) return 0;

    const rows = grid2.length;
    const cols = grid2[0].length;

    function dfs(r: number, c: number): boolean {
        // Step 1: Bounds check
        if (r < 0 || r >= rows || c < 0 || c >= cols) {
            return true;
        }

        // Step 2: Skip water and visited cells
        if (grid2[r][c] === 0) {
            return true;
        }

        // Step 3: Mark visited
        grid2[r][c] = 0;

        // Step 4: Verify cell exists in grid1
        let isSubIsland = grid1[r][c] === 1;

        // Step 5: Check all neighbors
        isSubIsland = dfs(r + 1, c) && isSubIsland;
        isSubIsland = dfs(r - 1, c) && isSubIsland;
        isSubIsland = dfs(r, c + 1) && isSubIsland;
        isSubIsland = dfs(r, c - 1) && isSubIsland;

        return isSubIsland;
    }

    // Step 6: Iterate and count
    let subIslandCount = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid2[r][c] === 1) {
                // Step 7: Validate entire island
                if (dfs(r, c)) {
                    subIslandCount++;
                }
            }
        }
    }

    return subIslandCount;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n) - recursion stack

---

### 24. Shortest Distance from All Buildings (Hard)
**LeetCode**: https://leetcode.com/problems/shortest-distance-from-all-buildings/ (Premium)

**Description**: You want to build a house on an empty land which reaches all buildings in the shortest distance. 0 is empty land, 1 is a building, and 2 is an obstacle. Return the shortest distance, or -1 if impossible.

**Python Solution**:
```python
from collections import deque

def shortestDistance(grid: list[list[int]]) -> int:
    """
    BFS from each building to calculate cumulative distances.
    Find empty land with minimum total distance to all buildings.

    Visualization:
    Grid:              Distance sums:
    ┌──────────┐      ┌──────────┐
    │ 1  0  2 │      │ 1  3  2 │
    │ 0  0  0 │  →   │ 3  4  ∞ │  (∞ = can't reach all buildings)
    │ 0  0  1 │      │ 4  3  1 │
    └──────────┘      └──────────┘

    Minimum total distance = 3

    For each building:
    - BFS to all reachable empty lands
    - Accumulate distances
    - Track which lands can reach all buildings
    """
    if not grid or not grid[0]:
        return -1

    rows, cols = len(grid), len(grid[0])
    total_buildings = sum(row.count(1) for row in grid)

    # Distance sum and reachable building count for each cell
    distance_sum = [[0] * cols for _ in range(rows)]
    reach_count = [[0] * cols for _ in range(rows)]

    directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

    def bfs(start_r, start_c):
        # Step 1: BFS from one building
        visited = [[False] * cols for _ in range(rows)]
        queue = deque([(start_r, start_c, 0)])
        visited[start_r][start_c] = True

        while queue:
            r, c, dist = queue.popleft()

            # Step 2: Explore neighbors
            for dr, dc in directions:
                nr, nc = r + dr, c + dc

                # Step 3: Check if valid empty land
                if (0 <= nr < rows and 0 <= nc < cols and
                    not visited[nr][nc] and grid[nr][nc] == 0):

                    visited[nr][nc] = True
                    # Step 4: Update distance and reach count
                    distance_sum[nr][nc] += dist + 1
                    reach_count[nr][nc] += 1
                    queue.append((nr, nc, dist + 1))

    # Step 5: Run BFS from each building
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                bfs(r, c)

    # Step 6: Find minimum distance among cells that reach all buildings
    min_distance = float('inf')
    for r in range(rows):
        for c in range(cols):
            # Step 7: Check if this empty land reaches all buildings
            if (grid[r][c] == 0 and
                reach_count[r][c] == total_buildings):
                min_distance = min(min_distance, distance_sum[r][c])

    return min_distance if min_distance != float('inf') else -1
```

**TypeScript Solution**:
```typescript
function shortestDistance(grid: number[][]): number {
    if (!grid || grid.length === 0) return -1;

    const rows = grid.length;
    const cols = grid[0].length;

    // Count total buildings
    let totalBuildings = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) totalBuildings++;
        }
    }

    // Track distance sums and building reach count
    const distanceSum: number[][] = Array(rows).fill(0)
        .map(() => Array(cols).fill(0));
    const reachCount: number[][] = Array(rows).fill(0)
        .map(() => Array(cols).fill(0));

    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

    function bfs(startR: number, startC: number): void {
        // Step 1: Initialize BFS
        const visited: boolean[][] = Array(rows).fill(false)
            .map(() => Array(cols).fill(false));
        const queue: [number, number, number][] = [[startR, startC, 0]];
        visited[startR][startC] = true;

        while (queue.length > 0) {
            const [r, c, dist] = queue.shift()!;

            // Step 2: Check all directions
            for (const [dr, dc] of directions) {
                const nr = r + dr;
                const nc = c + dc;

                // Step 3: Process empty land
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                    !visited[nr][nc] && grid[nr][nc] === 0) {

                    visited[nr][nc] = true;
                    // Step 4: Accumulate distance
                    distanceSum[nr][nc] += dist + 1;
                    reachCount[nr][nc]++;
                    queue.push([nr, nc, dist + 1]);
                }
            }
        }
    }

    // Step 5: BFS from each building
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 1) {
                bfs(r, c);
            }
        }
    }

    // Step 6: Find optimal location
    let minDistance = Infinity;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === 0 && reachCount[r][c] === totalBuildings) {
                minDistance = Math.min(minDistance, distanceSum[r][c]);
            }
        }
    }

    return minDistance === Infinity ? -1 : minDistance;
}
```

**Complexity**:
- Time: O(m² × n² × B) where B is number of buildings
- Space: O(m × n)

---

### 25. Detect Cycles in 2D Grid (Medium)
**LeetCode**: https://leetcode.com/problems/detect-cycles-in-2d-grid/

**Description**: Given a 2D grid of characters, return true if there is a cycle in the grid. A cycle is a path of same characters where you can return to the starting cell after at least 4 moves (in 4 directions).

**Python Solution**:
```python
def containsCycle(grid: list[list[str]]) -> bool:
    """
    Use DFS with parent tracking to detect cycles.
    A cycle exists if we visit a cell that's already visited,
    and it's not the parent cell we came from.

    Visualization of a cycle:
    ┌───────────────┐
    │ a  a  a  a  │
    │ a  b  b  a  │  'a' forms a cycle
    │ a  b  b  a  │  (outer ring)
    │ a  a  a  a  │
    └───────────────┘

    DFS path: (0,0)→(0,1)→(0,2)→(0,3)→(1,3)→(2,3)→(3,3)→...→(0,0) [CYCLE!]

    Parent tracking prevents false positives:
    Current at (1,1), came from (0,1)
    - (0,1) is parent → skip
    - (1,0) is visited but not parent → CYCLE FOUND
    """
    if not grid or not grid[0]:
        return False

    rows, cols = len(grid), len(grid[0])
    visited = [[False] * cols for _ in range(rows)]

    def dfs(r, c, parent_r, parent_c, char):
        # Step 1: Mark current cell as visited
        visited[r][c] = True

        # Step 2: Check all 4 directions
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]
        for dr, dc in directions:
            nr, nc = r + dr, c + dc

            # Step 3: Check boundaries and same character
            if (0 <= nr < rows and 0 <= nc < cols and
                grid[nr][nc] == char):

                # Step 4: Skip parent cell
                if nr == parent_r and nc == parent_c:
                    continue

                # Step 5: Found visited cell that's not parent → cycle!
                if visited[nr][nc]:
                    return True

                # Step 6: Continue DFS
                if dfs(nr, nc, r, c, char):
                    return True

        return False

    # Step 7: Try DFS from each unvisited cell
    for r in range(rows):
        for c in range(cols):
            if not visited[r][c]:
                if dfs(r, c, -1, -1, grid[r][c]):
                    return True

    return False
```

**TypeScript Solution**:
```typescript
function containsCycle(grid: string[][]): boolean {
    if (!grid || grid.length === 0) return false;

    const rows = grid.length;
    const cols = grid[0].length;
    const visited: boolean[][] = Array(rows).fill(false)
        .map(() => Array(cols).fill(false));

    function dfs(r: number, c: number, parentR: number,
                 parentC: number, char: string): boolean {
        // Step 1: Mark visited
        visited[r][c] = true;

        // Step 2: Explore neighbors
        const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
        for (const [dr, dc] of directions) {
            const nr = r + dr;
            const nc = c + dc;

            // Step 3: Check validity and same character
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                grid[nr][nc] === char) {

                // Step 4: Don't go back to parent
                if (nr === parentR && nc === parentC) {
                    continue;
                }

                // Step 5: Cycle detected
                if (visited[nr][nc]) {
                    return true;
                }

                // Step 6: Recursive DFS
                if (dfs(nr, nc, r, c, char)) {
                    return true;
                }
            }
        }

        return false;
    }

    // Step 7: Check all cells
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (!visited[r][c]) {
                if (dfs(r, c, -1, -1, grid[r][c])) {
                    return true;
                }
            }
        }
    }

    return false;
}
```

**Complexity**:
- Time: O(m × n)
- Space: O(m × n)

---

## Summary

Matrix traversal is essential for:
- Grid-based problems (islands, regions, paths)
- Game boards and simulations
- Image processing (flood fill, transformations)
- Shortest path in 2D space

**Key Techniques**:
1. **DFS** for connectivity and region marking
2. **BFS** for shortest path
3. **In-place modification** for space optimization
4. **Boundary shrinking** for spiral/layer-wise traversal
5. **State encoding** for tracking changes

**Common Patterns**:
- 4-directional: `[(0,1), (1,0), (0,-1), (-1,0)]`
- 8-directional: Add diagonals
- Visited tracking: Set, boolean array, or modify grid
- Level-by-level BFS for distance tracking
