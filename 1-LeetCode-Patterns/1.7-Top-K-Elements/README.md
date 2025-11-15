# Top 'K' Elements Pattern

## Pattern Overview

### What is this pattern?
The Top 'K' Elements pattern uses a Heap (Priority Queue) to efficiently find the K largest, smallest, or most frequent elements in a dataset. Instead of sorting the entire array (O(n log n)), we maintain a heap of size K (O(n log K)).

### When to use it?
- Finding K largest/smallest elements
- Finding K most/least frequent elements
- Finding K closest points to origin
- Merging K sorted arrays/lists
- Finding the Kth largest/smallest element
- Problems involving "top", "least", "most frequent", "closest"

### Time/Space Complexity Benefits
- **Time Complexity**: O(n log K) - much better than sorting O(n log n) when K << n
- **Space Complexity**: O(K) - only need to maintain K elements in heap

### Visual Diagram

#### 🏆 The Podium Metaphor: Understanding Top-K with Min Heap

Think of a **Min Heap of size K** as a podium with K spots. Only the top K performers stay on the podium!

```
Finding K=3 LARGEST elements in [3, 1, 5, 12, 2, 11]

🎯 Goal: Keep only the 3 LARGEST elements on our "Winner's Podium"
Strategy: Use MIN heap - the weakest winner guards the door!

══════════════════════════════════════════════════════════════════════════

Step 1: Process 3
   Podium (Min Heap):
        [3]
   Status: ✓ First contestant on podium

Step 2: Process 1
   Podium (Min Heap):
        [1]
       /
      3
   Status: ✓ Room for more (size < 3)
   Heap visualization: [1, 3]

Step 3: Process 5
   Podium (Min Heap):
        [1]
       /  \
      3    5
   Status: ✓ Podium full! (size = 3)
   Heap visualization: [1, 3, 5]
   Current Winners: 🥉1  🥈3  🥇5

Step 4: Process 12 ⭐
   Question: Is 12 > MIN(1)? YES!
   Action: Kick out 1 (weakest), add 12

   Before:              After:
        [1]                  [3]
       /  \                 /  \
      3    5               5   12

   Heap visualization: [3, 5, 12]
   Current Winners: 🥉3  🥈5  🥇12

Step 5: Process 2
   Question: Is 2 > MIN(3)? NO!
   Action: Reject 2 (not strong enough)

   Podium unchanged:
        [3]
       /  \
      5   12

   Heap visualization: [3, 5, 12]
   Current Winners: 🥉3  🥈5  🥇12

Step 6: Process 11 ⭐
   Question: Is 11 > MIN(3)? YES!
   Action: Kick out 3, add 11

   Before:              After:
        [3]                  [5]
       /  \                 /  \
      5   12              11   12

   Heap visualization: [5, 11, 12]
   Final Winners: 🥉5  🥈11  🥇12

══════════════════════════════════════════════════════════════════════════

🎊 RESULT: Top 3 largest = [5, 11, 12]

💡 Key Insight:
   - The MIN element (5) in our heap is the "gatekeeper"
   - New elements must beat the gatekeeper to join the podium
   - This keeps our heap size at exactly K!
```

#### 🏅 The Leaderboard: Min Heap vs Max Heap

```
════════════════════════════════════════════════════════════════════════════

SCENARIO A: Finding K LARGEST (use MIN HEAP)
─────────────────────────────────────────────

Array: [15, 3, 8, 20, 1, 12, 7]   K = 3

🎪 THE PODIUM SYSTEM (Min Heap)

     Round 1: [15, 3, 8]           Round 2: Add 20

     ┌─────┐                       ┌─────┐
     │  3  │ ← Gatekeeper          │  8  │ ← New Gatekeeper
     └─────┘                       └─────┘
      /   \                         /   \
   ┌───┐ ┌───┐                  ┌────┐ ┌────┐
   │15 │ │ 8 │                  │ 15 │ │ 20 │
   └───┘ └───┘                  └────┘ └────┘

   Min=3, others larger          Kicked out 3! Min=8

     Round 3: Add 1               Round 4: Add 12
     (1 < 8, REJECT)              (12 > 8, ACCEPT)

     ┌─────┐                       ┌─────┐
     │  8  │ ← Still Gatekeeper   │ 12  │ ← New Gatekeeper
     └─────┘                       └─────┘
      /   \                         /   \
   ┌────┐ ┌────┐                ┌────┐ ┌────┐
   │ 15 │ │ 20 │                │ 15 │ │ 20 │
   └────┘ └────┘                └────┘ └────┘

   Unchanged!                     Kicked out 8! Min=12

   📊 Final Result: [12, 15, 20] ✓

════════════════════════════════════════════════════════════════════════════

SCENARIO B: Finding K SMALLEST (use MAX HEAP)
─────────────────────────────────────────────

Array: [15, 3, 8, 20, 1, 12, 7]   K = 3

🎪 THE REVERSE PODIUM (Max Heap)

     Round 1: [15, 3, 8]           Round 2: Add 20
                                    (20 > 15, REJECT)
     ┌─────┐                       ┌─────┐
     │ 15  │ ← Ceiling             │ 15  │ ← Still Ceiling
     └─────┘                       └─────┘
      /   \                         /   \
   ┌───┐ ┌───┐                  ┌───┐ ┌───┐
   │ 3 │ │ 8 │                  │ 3 │ │ 8 │
   └───┘ └───┘                  └───┘ └───┘

   Max=15, others smaller         Unchanged!

     Round 3: Add 1 ⭐              Round 4: Add 12
     (1 < 15, ACCEPT)              (12 > 8, REJECT)

     ┌─────┐                       ┌─────┐
     │  8  │ ← New Ceiling         │  8  │ ← Still Ceiling
     └─────┘                       └─────┘
      /   \                         /   \
   ┌───┐ ┌───┐                  ┌───┐ ┌───┐
   │ 3 │ │ 1 │                  │ 3 │ │ 1 │
   └───┘ └───┘                  └───┘ └───┘

   Kicked out 15! Max=8           Unchanged!

   📊 Final Result: [8, 3, 1] ✓ (smallest 3)

════════════════════════════════════════════════════════════════════════════
```

#### 🔄 Heap Operations Visualized: Push and Pop

```
═══════════════════════════════════════════════════════════════════════════

OPERATION 1: HEAPPUSH (Adding element to Min Heap)
──────────────────────────────────────────────────

Example: Add 4 to heap [5, 8, 10, 15, 12]

Step 1: Add at bottom          Step 2: Bubble up (4 < 10)

         5                              5
       /   \                          /   \
      8     10                       8     4  ← Swapped!
     / \    /                       / \    /
   15  12  4  ← New                15  12  10


Step 3: Bubble up (4 < 5)      ✓ Final Heap

         4  ← Swapped!                 4
       /   \                         /   \
      8     5                       8     5
     / \    /                      / \    /
   15  12  10                    15  12  10

   Array representation: [4, 8, 5, 15, 12, 10]
   Time: O(log n) - height of tree

═══════════════════════════════════════════════════════════════════════════

OPERATION 2: HEAPPOP (Removing root from Min Heap)
──────────────────────────────────────────────────

Example: Remove min from heap [4, 8, 5, 15, 12, 10]

Step 1: Remove root & replace   Step 2: Bubble down (10 > 5)
        with last element
         4  ← Remove                  10
       /   \                         /   \
      8     5                       8     5  ← Swap with smaller
     / \    /                      / \
   15  12  10 → Move up           15  12


Step 3: Bubble down (10 > 8)    ✓ Final Heap

         5                             5
       /   \                         /   \
      8     10  ← Swap!              8     10
     / \                            / \
   15  12                          15  12

   Removed: 4 (minimum)
   New array: [5, 8, 10, 15, 12]
   Time: O(log n) - height of tree

═══════════════════════════════════════════════════════════════════════════
```

#### 📊 Step-by-Step: Building K=3 Heap from Stream

```
╔════════════════════════════════════════════════════════════════════════╗
║  STREAMING DATA: Find Top 3 Largest                                   ║
║  Input Stream: [7, 10, 4, 3, 20, 15, 1, 18]                           ║
╚════════════════════════════════════════════════════════════════════════╝

┌──────────────┬──────────────┬──────────────────┬─────────────────────┐
│   Element    │    Action    │   Heap State     │   Visualization     │
├──────────────┼──────────────┼──────────────────┼─────────────────────┤
│              │              │                  │                     │
│    7         │  Add         │     [7]          │        7            │
│              │              │                  │                     │
├──────────────┼──────────────┼──────────────────┼─────────────────────┤
│              │              │                  │        7            │
│    10        │  Add         │   [7, 10]        │       /             │
│              │              │                  │      10             │
├──────────────┼──────────────┼──────────────────┼─────────────────────┤
│              │              │                  │        4            │
│    4         │  Add         │  [4, 10, 7]      │       / \           │
│              │  (Heapify)   │                  │      10  7          │
│              │              │                  │  ⚡ Heap Full (K=3) │
├──────────────┼──────────────┼──────────────────┼─────────────────────┤
│              │  3 < 4?      │                  │        4            │
│    3         │  NO!         │  [4, 10, 7]      │       / \           │
│              │  REJECT ❌   │                  │      10  7          │
│              │              │                  │  Gatekeeper: 4      │
├──────────────┼──────────────┼──────────────────┼─────────────────────┤
│              │  20 > 4?     │                  │        7            │
│    20        │  YES! ✓      │  [7, 10, 20]     │       / \           │
│              │  Pop 4       │                  │      10  20         │
│              │  Push 20     │                  │  🔥 New Top!        │
├──────────────┼──────────────┼──────────────────┼─────────────────────┤
│              │  15 > 7?     │                  │       10            │
│    15        │  YES! ✓      │  [10, 15, 20]    │       / \           │
│              │  Pop 7       │                  │      15  20         │
│              │  Push 15     │                  │  🎯 Top 3 Updated   │
├──────────────┼──────────────┼──────────────────┼─────────────────────┤
│              │  1 < 10?     │                  │       10            │
│    1         │  NO!         │  [10, 15, 20]    │       / \           │
│              │  REJECT ❌   │                  │      15  20         │
│              │              │                  │                     │
├──────────────┼──────────────┼──────────────────┼─────────────────────┤
│              │  18 > 10?    │                  │       15            │
│    18        │  YES! ✓      │  [15, 18, 20]    │       / \           │
│              │  Pop 10      │                  │      18  20         │
│              │  Push 18     │                  │  🏆 FINAL TOP 3!    │
└──────────────┴──────────────┴──────────────────┴─────────────────────┘

📈 Analysis:
   • Processed: 8 elements
   • Heap size: Always ≤ 3 (K)
   • Accepted: 6 elements (7, 10, 4, 20, 15, 18)
   • Rejected: 2 elements (3, 1)
   • Time: O(8 log 3) = O(n log K)
   • Space: O(3) = O(K)

🎯 Final Answer: Top 3 Largest = [15, 18, 20]
```

#### 🎭 Min Heap vs Max Heap: The Complete Comparison

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    MIN HEAP vs MAX HEAP                               ║
╚═══════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────┬────────────────────────────────────┐
│         MIN HEAP                │          MAX HEAP                  │
│   (Parent ≤ Children)           │    (Parent ≥ Children)             │
├─────────────────────────────────┼────────────────────────────────────┤
│                                 │                                    │
│            1                    │            20                      │
│          /   \                  │          /    \                    │
│         3     2                 │        15      18                  │
│        / \   / \                │       /  \    /  \                 │
│       9  10 7  8                │      10   8  12   5                │
│                                 │                                    │
│  Root: SMALLEST (1)             │  Root: LARGEST (20)                │
│  Array: [1,3,2,9,10,7,8]        │  Array: [20,15,18,10,8,12,5]       │
│                                 │                                    │
├─────────────────────────────────┼────────────────────────────────────┤
│  USE CASE: Find K LARGEST       │  USE CASE: Find K SMALLEST         │
│                                 │                                    │
│  Why? Keep K largest elements   │  Why? Keep K smallest elements     │
│  The MIN is the "weakest"       │  The MAX is the "weakest"          │
│  winner who can be kicked out   │  winner who can be kicked out      │
│                                 │                                    │
│  Think: VIP Club with K spots   │  Think: Budget items, K cheapest   │
│  Bouncer kicks weakest member   │  Remove most expensive to stay     │
│  when stronger candidate comes  │  under budget                      │
│                                 │                                    │
├─────────────────────────────────┼────────────────────────────────────┤
│  PYTHON IMPLEMENTATION:         │  PYTHON IMPLEMENTATION:            │
│                                 │                                    │
│  import heapq                   │  import heapq                      │
│  heap = []                      │  heap = []                         │
│  heapq.heappush(heap, 5)        │  heapq.heappush(heap, -5) # ←Note! │
│  min_val = heapq.heappop(heap)  │  max_val = -heapq.heappop(heap)    │
│                                 │  # Negate to simulate max heap     │
│                                 │                                    │
└─────────────────────────────────┴────────────────────────────────────┘

🎯 MEMORY TRICK:

   "I want the LARGEST? Use MIN heap!"  (Counterintuitive!)

   Why? Because you want to quickly remove the SMALLEST of your top K.

   "I want the SMALLEST? Use MAX heap!"  (Counterintuitive!)

   Why? Because you want to quickly remove the LARGEST of your bottom K.
```

#### 🎪 Real-World Metaphor: The Contest Judge

```
═══════════════════════════════════════════════════════════════════════════

🎤 TALENT SHOW: Finding Top 3 Performers

Setup: 100 contestants, but only 3 spots for finals
Strategy: Use a "Rolling Qualification" system (Min Heap of size 3)

╔═══════════════════════════════════════════════════════════════════════╗
║  Current Finalists (Min Heap of size 3)                               ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │  🥉 Bronze Spot: Score 85  ← GATEKEEPER (minimum to beat)       │  ║
║  │  🥈 Silver Spot: Score 92                                        │  ║
║  │  🥇 Gold Spot:   Score 88                                        │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════════════╝

New Contestant: Score 90

┌────────────────────────────────────────────────────────────────────┐
│  Judge's Decision Process:                                         │
│                                                                     │
│  1️⃣  Check: Is 90 > 85 (current minimum)?                          │
│      ✓ YES! This contestant qualifies!                            │
│                                                                     │
│  2️⃣  Action: Remove current Bronze (85)                            │
│              Add new contestant (90)                               │
│                                                                     │
│  3️⃣  Reorder: Find new minimum                                     │
│      New Bronze: Score 88 (becomes new gatekeeper!)               │
│                                                                     │
│  Updated Finalists:                                                │
│  🥉 Bronze: 88  🥈 Silver: 92  🥇 Gold: 90                         │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘

New Contestant: Score 75

┌────────────────────────────────────────────────────────────────────┐
│  Judge's Decision Process:                                         │
│                                                                     │
│  1️⃣  Check: Is 75 > 88 (current minimum)?                          │
│      ❌ NO! This contestant does NOT qualify!                      │
│                                                                     │
│  2️⃣  Action: REJECT immediately                                    │
│              "Thank you, next!"                                    │
│                                                                     │
│  Finalists Unchanged:                                              │
│  🥉 Bronze: 88  🥈 Silver: 92  🥇 Gold: 90                         │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘

💡 The Insight:
   • We NEVER need to compare with all finalists
   • Only compare with the WEAKEST finalist (heap root)
   • This is why it's O(log K) not O(K)!
   • The heap automatically maintains the minimum at the top

═══════════════════════════════════════════════════════════════════════════

🚀 Efficiency Comparison:

❌ Naive Approach: Store all scores, sort at the end
   Time: O(n log n)  Space: O(n)

✓ Heap Approach: Maintain top K with rolling window
   Time: O(n log K)  Space: O(K)

📊 Example with n=1,000,000 and K=10:
   Naive: 1,000,000 log(1,000,000) ≈ 20,000,000 operations
   Heap:  1,000,000 log(10) ≈ 3,300,000 operations

   ⚡ ~6x FASTER!

═══════════════════════════════════════════════════════════════════════════
```

**Key Insights Summary:**
- **For K largest**: Use MIN heap of size K (remove smallest when heap is full)
- **For K smallest**: Use MAX heap of size K (remove largest when heap is full)
- **The root is always your "gatekeeper"** - new elements must beat it to enter
- **Think of it as a VIP club** - only the top K get in, and the weakest can be kicked out
- **Time complexity**: O(n log K) - much better than O(n log n) sorting when K << n
- **Space complexity**: O(K) - only store K elements, not all n elements

## Recognition Guidelines

### How to identify this pattern in interview questions?
Look for these indicators:
- Problem asks for "top K", "K largest", "K smallest"
- "K most frequent", "K closest"
- "Kth largest", "Kth smallest"
- Need to find a subset of size K with certain properties
- Merging K sorted lists
- Finding median from data stream

### Key Phrases/Indicators
- "Find the K largest/smallest elements"
- "K most frequent elements"
- "K closest points"
- "Kth largest element"
- "Top K frequent words"
- "Merge K sorted lists"
- "Find median"
- "Sort nearly sorted array"

## Template/Pseudocode

### K Largest Elements Template
```python
import heapq

def k_largest(nums, k):
    # Use a min heap of size k
    # The smallest element in heap is the kth largest overall
    min_heap = []

    for num in nums:
        # Add element to heap
        heapq.heappush(min_heap, num)

        # If heap size exceeds k, remove smallest
        if len(min_heap) > k:
            heapq.heappop(min_heap)

    # Heap now contains k largest elements
    return list(min_heap)
```

### K Smallest Elements Template
```python
import heapq

def k_smallest(nums, k):
    # Use a max heap of size k (negate values for max heap)
    # The largest element in heap is the kth smallest overall
    max_heap = []

    for num in nums:
        # Add element to heap (negate for max heap)
        heapq.heappush(max_heap, -num)

        # If heap size exceeds k, remove largest
        if len(max_heap) > k:
            heapq.heappop(max_heap)

    # Return absolute values (negate back)
    return [-x for x in max_heap]
```

### K Frequent Elements Template
```python
import heapq
from collections import Counter

def k_frequent(nums, k):
    # Count frequencies
    count = Counter(nums)

    # Use heap to find k most frequent
    # Heap stores (frequency, number) tuples
    return heapq.nlargest(k, count.keys(), key=count.get)
```

## Problems

### Problem 1: Kth Largest Element in an Array (Medium)
**LeetCode Link**: [215. Kth Largest Element in an Array](https://leetcode.com/problems/kth-largest-element-in-an-array/)

**Problem Description**:
Given an integer array nums and an integer k, return the kth largest element in the array. Note that it is the kth largest element in the sorted order, not the kth distinct element.

**Example**:
```
Input: nums = [3,2,1,5,6,4], k = 2
Output: 5
```

**Python Solution**:
```python
import heapq

def findKthLargest(nums: list[int], k: int) -> int:
    # Step 1: Create a min heap to store k largest elements
    # We use min heap because we want to remove smallest among k largest
    min_heap = []

    # Step 2: Process each number
    for num in nums:
        # Add current number to heap
        heapq.heappush(min_heap, num)

        # If heap size exceeds k, remove the smallest
        # This keeps only the k largest elements
        if len(min_heap) > k:
            heapq.heappop(min_heap)

    # Step 3: The root of min heap is the kth largest element
    # (smallest among the k largest elements)
    return min_heap[0]
```

**TypeScript Solution**:
```typescript
function findKthLargest(nums: number[], k: number): number {
    // Step 1: Create a min heap to store k largest elements
    // TypeScript doesn't have built-in heap, so we use a simple array
    // and keep it sorted (or use a heap library)
    const minHeap: number[] = [];

    // Helper function to maintain min heap property
    function heapPush(heap: number[], val: number): void {
        heap.push(val);
        heap.sort((a, b) => a - b);  // Keep sorted (min at front)
    }

    function heapPop(heap: number[]): number {
        return heap.shift()!;
    }

    // Step 2: Process each number
    for (const num of nums) {
        // Add current number to heap
        heapPush(minHeap, num);

        // If heap size exceeds k, remove the smallest
        // This keeps only the k largest elements
        if (minHeap.length > k) {
            heapPop(minHeap);
        }
    }

    // Step 3: The first element of min heap is the kth largest element
    // (smallest among the k largest elements)
    return minHeap[0];
}
```

**Complexity Analysis**:
- Time Complexity: O(n log k) - n insertions/deletions on heap of size k
- Space Complexity: O(k) - heap stores k elements

---

### Problem 2: Top K Frequent Elements (Medium)
**LeetCode Link**: [347. Top K Frequent Elements](https://leetcode.com/problems/top-k-frequent-elements/)

**Problem Description**:
Given an integer array nums and an integer k, return the k most frequent elements.

**Example**:
```
Input: nums = [1,1,1,2,2,3], k = 2
Output: [1,2]
```

**Python Solution**:
```python
import heapq
from collections import Counter

def topKFrequent(nums: list[int], k: int) -> list[int]:
    # Step 1: Count frequency of each element
    count = Counter(nums)

    # Step 2: Use min heap to keep track of k most frequent elements
    # Heap stores (frequency, number) tuples
    min_heap = []

    # Step 3: Process each unique number and its frequency
    for num, freq in count.items():
        # Add (frequency, number) to heap
        heapq.heappush(min_heap, (freq, num))

        # If heap size exceeds k, remove element with smallest frequency
        if len(min_heap) > k:
            heapq.heappop(min_heap)

    # Step 4: Extract numbers from heap (ignore frequencies)
    return [num for freq, num in min_heap]
```

**TypeScript Solution**:
```typescript
function topKFrequent(nums: number[], k: number): number[] {
    // Step 1: Count frequency of each element
    const count: Map<number, number> = new Map();
    for (const num of nums) {
        count.set(num, (count.get(num) || 0) + 1);
    }

    // Step 2: Convert to array and sort by frequency
    const freqArray: [number, number][] = Array.from(count.entries());
    freqArray.sort((a, b) => b[1] - a[1]);  // Sort by frequency descending

    // Step 3: Take top k elements
    return freqArray.slice(0, k).map(([num, freq]) => num);
}
```

**Complexity Analysis**:
- Time Complexity: O(n log k) - where n is unique elements
- Space Complexity: O(n) - for the frequency map

---

### Problem 3: K Closest Points to Origin (Medium)
**LeetCode Link**: [973. K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin/)

**Problem Description**:
Given an array of points where points[i] = [xi, yi] represents a point on the X-Y plane and an integer k, return the k closest points to the origin (0, 0).

**Example**:
```
Input: points = [[1,3],[-2,2]], k = 1
Output: [[-2,2]]
Explanation: Distance from origin: (1,3) = sqrt(10), (-2,2) = sqrt(8)
```

**Python Solution**:
```python
import heapq

def kClosest(points: list[list[int]], k: int) -> list[list[int]]:
    # Step 1: Create a max heap to store k closest points
    # We use max heap (negate distances) to remove farthest when heap is full
    max_heap = []

    # Step 2: Process each point
    for x, y in points:
        # Calculate squared distance (no need for sqrt, relative order is same)
        dist = -(x * x + y * y)  # Negate for max heap

        # Add (distance, point) to heap
        heapq.heappush(max_heap, (dist, [x, y]))

        # If heap size exceeds k, remove the farthest point
        if len(max_heap) > k:
            heapq.heappop(max_heap)

    # Step 3: Extract points from heap (ignore distances)
    return [point for dist, point in max_heap]
```

**TypeScript Solution**:
```typescript
function kClosest(points: number[][], k: number): number[][] {
    // Step 1: Calculate distances and pair with points
    const distPoints: [number, number[]][] = points.map(([x, y]) => {
        const dist = x * x + y * y;  // Squared distance
        return [dist, [x, y]];
    });

    // Step 2: Sort by distance
    distPoints.sort((a, b) => a[0] - b[0]);

    // Step 3: Take first k points
    return distPoints.slice(0, k).map(([dist, point]) => point);
}
```

**Complexity Analysis**:
- Time Complexity: O(n log k) - n insertions on heap of size k
- Space Complexity: O(k) - heap stores k elements

---

### Problem 4: Kth Smallest Element in a Sorted Matrix (Medium)
**LeetCode Link**: [378. Kth Smallest Element in a Sorted Matrix](https://leetcode.com/problems/kth-smallest-element-in-a-sorted-matrix/)

**Problem Description**:
Given an n x n matrix where each of the rows and columns is sorted in ascending order, return the kth smallest element in the matrix.

**Example**:
```
Input: matrix = [[1,5,9],[10,11,13],[12,13,15]], k = 8
Output: 13
```

**Python Solution**:
```python
import heapq

def kthSmallest(matrix: list[list[int]], k: int) -> int:
    n = len(matrix)

    # Step 1: Initialize min heap with first element of each row
    # Heap stores (value, row, col)
    min_heap = []
    for r in range(min(k, n)):  # Only need first k rows
        heapq.heappush(min_heap, (matrix[r][0], r, 0))

    # Step 2: Extract minimum k times
    result = 0
    for _ in range(k):
        # Get the smallest element
        result, r, c = heapq.heappop(min_heap)

        # If there's a next element in this row, add it to heap
        if c + 1 < n:
            heapq.heappush(min_heap, (matrix[r][c + 1], r, c + 1))

    # Step 3: Return the kth smallest element
    return result
```

**TypeScript Solution**:
```typescript
function kthSmallest(matrix: number[][], k: number): number {
    const n = matrix.length;

    // Step 1: Flatten and sort (simpler approach for small matrices)
    const flattened: number[] = [];
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            flattened.push(matrix[r][c]);
        }
    }

    // Step 2: Sort and return kth element
    flattened.sort((a, b) => a - b);
    return flattened[k - 1];
}
```

**Complexity Analysis**:
- Time Complexity: O(k log n) - k extractions from heap of size n
- Space Complexity: O(n) - heap size

---

### Problem 5: Find K Pairs with Smallest Sums (Medium)
**LeetCode Link**: [373. Find K Pairs with Smallest Sums](https://leetcode.com/problems/find-k-pairs-with-smallest-sums/)

**Problem Description**:
You are given two integer arrays nums1 and nums2 sorted in ascending order and an integer k. Define a pair (u, v) which consists of one element from the first array and one element from the second array. Return the k pairs with the smallest sums.

**Example**:
```
Input: nums1 = [1,7,11], nums2 = [2,4,6], k = 3
Output: [[1,2],[1,4],[1,6]]
```

**Python Solution**:
```python
import heapq

def kSmallestPairs(nums1: list[int], nums2: list[int], k: int) -> list[list[int]]:
    # Step 1: Handle edge cases
    if not nums1 or not nums2:
        return []

    # Step 2: Initialize min heap
    # Start with pairs formed by first element of nums1 and all of nums2
    # Heap stores (sum, index1, index2)
    min_heap = []
    for i in range(min(k, len(nums1))):
        heapq.heappush(min_heap, (nums1[i] + nums2[0], i, 0))

    # Step 3: Extract k smallest pairs
    result = []
    while min_heap and len(result) < k:
        # Get pair with smallest sum
        curr_sum, i, j = heapq.heappop(min_heap)
        result.append([nums1[i], nums2[j]])

        # If there's a next element in nums2, add next pair
        if j + 1 < len(nums2):
            heapq.heappush(min_heap, (nums1[i] + nums2[j + 1], i, j + 1))

    return result
```

**TypeScript Solution**:
```typescript
function kSmallestPairs(nums1: number[], nums2: number[], k: number): number[][] {
    // Step 1: Handle edge cases
    if (nums1.length === 0 || nums2.length === 0) {
        return [];
    }

    // Step 2: Create all pairs and sort by sum
    const pairs: [number, number, number][] = [];  // [sum, num1, num2]
    for (let i = 0; i < Math.min(k, nums1.length); i++) {
        for (let j = 0; j < Math.min(k, nums2.length); j++) {
            pairs.push([nums1[i] + nums2[j], nums1[i], nums2[j]]);
        }
    }

    // Step 3: Sort by sum and take first k
    pairs.sort((a, b) => a[0] - b[0]);
    return pairs.slice(0, k).map(([sum, num1, num2]) => [num1, num2]);
}
```

**Complexity Analysis**:
- Time Complexity: O(k log k) - k extractions from heap
- Space Complexity: O(k) - heap size

---

### Problem 6: Reorganize String (Medium)
**LeetCode Link**: [767. Reorganize String](https://leetcode.com/problems/reorganize-string/)

**Problem Description**:
Given a string s, rearrange the characters so that no two adjacent characters are the same. Return any possible rearrangement of s or return "" if not possible.

**Example**:
```
Input: s = "aab"
Output: "aba"

Input: s = "aaab"
Output: ""
```

**Python Solution**:
```python
import heapq
from collections import Counter

def reorganizeString(s: str) -> str:
    # Step 1: Count character frequencies
    count = Counter(s)

    # Step 2: Create max heap of (frequency, character)
    # Use negative frequency for max heap
    max_heap = [(-freq, char) for char, freq in count.items()]
    heapq.heapify(max_heap)

    # Step 3: Build result string
    result = []
    prev_freq, prev_char = 0, ''

    # Step 4: Process heap
    while max_heap:
        # Get most frequent character
        freq, char = heapq.heappop(max_heap)

        # Add it to result
        result.append(char)

        # If we have a previous character, add it back to heap
        if prev_freq < 0:
            heapq.heappush(max_heap, (prev_freq, prev_char))

        # Update previous character (decrement frequency)
        prev_freq, prev_char = freq + 1, char

    # Step 5: Check if we used all characters
    result_str = ''.join(result)
    return result_str if len(result_str) == len(s) else ""
```

**TypeScript Solution**:
```typescript
function reorganizeString(s: string): string {
    // Step 1: Count character frequencies
    const count: Map<string, number> = new Map();
    for (const char of s) {
        count.set(char, (count.get(char) || 0) + 1);
    }

    // Step 2: Sort characters by frequency (descending)
    const sorted = Array.from(count.entries()).sort((a, b) => b[1] - a[1]);

    // Step 3: Check if reorganization is possible
    // If most frequent char appears more than (n+1)/2 times, it's impossible
    if (sorted[0][1] > Math.ceil(s.length / 2)) {
        return "";
    }

    // Step 4: Fill result array
    const result: string[] = new Array(s.length);
    let idx = 0;

    // Place most frequent characters first at even indices
    for (const [char, freq] of sorted) {
        for (let i = 0; i < freq; i++) {
            if (idx >= s.length) {
                idx = 1;  // Switch to odd indices
            }
            result[idx] = char;
            idx += 2;
        }
    }

    return result.join('');
}
```

**Complexity Analysis**:
- Time Complexity: O(n log k) - where k is number of unique characters
- Space Complexity: O(k) - for the heap and frequency map

---

### Problem 7: Merge k Sorted Lists (Hard)
**LeetCode Link**: [23. Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists/)

**Problem Description**:
You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.

**Example**:
```
Input: lists = [[1,4,5],[1,3,4],[2,6]]
Output: [1,1,2,3,4,4,5,6]
```

**Python Solution**:
```python
import heapq

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def mergeKLists(lists: list[ListNode]) -> ListNode:
    # Step 1: Create min heap with first node from each list
    # Heap stores (value, index, node) - index prevents comparison of nodes
    min_heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(min_heap, (node.val, i, node))

    # Step 2: Create dummy node for result
    dummy = ListNode(0)
    current = dummy

    # Step 3: Process heap
    while min_heap:
        # Get node with smallest value
        val, i, node = heapq.heappop(min_heap)

        # Add it to result
        current.next = node
        current = current.next

        # If this list has more nodes, add next node to heap
        if node.next:
            heapq.heappush(min_heap, (node.next.val, i, node.next))

    # Step 4: Return merged list
    return dummy.next
```

**TypeScript Solution**:
```typescript
class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
    }
}

function mergeKLists(lists: Array<ListNode | null>): ListNode | null {
    // Step 1: Collect all values
    const values: number[] = [];
    for (const list of lists) {
        let node = list;
        while (node) {
            values.push(node.val);
            node = node.next;
        }
    }

    // Step 2: Sort values
    values.sort((a, b) => a - b);

    // Step 3: Build result list
    const dummy = new ListNode(0);
    let current = dummy;

    for (const val of values) {
        current.next = new ListNode(val);
        current = current.next;
    }

    return dummy.next;
}
```

**Complexity Analysis**:
- Time Complexity: O(N log k) - where N is total nodes, k is number of lists
- Space Complexity: O(k) - heap size

---

### Problem 8: Top K Frequent Words (Medium)
**LeetCode Link**: [692. Top K Frequent Words](https://leetcode.com/problems/top-k-frequent-words/)

**Problem Description**:
Given an array of strings words and an integer k, return the k most frequent strings. Return the answer sorted by frequency from highest to lowest, and if tied, sorted lexicographically.

**Example**:
```
Input: words = ["i","love","leetcode","i","love","coding"], k = 2
Output: ["i","love"]
```

**Python Solution**:
```python
import heapq
from collections import Counter

def topKFrequent(words: list[str], k: int) -> list[str]:
    # Step 1: Count word frequencies
    count = Counter(words)

    # Step 2: Use min heap with custom comparison
    # For min heap: lower frequency first, if tied then higher lexicographic order
    # We use negative frequency for max heap behavior on frequency
    # For lexicographic order, we want reverse order in heap
    min_heap = []

    # Step 3: Process each word
    for word, freq in count.items():
        # Push (-freq, word) but we need custom comparison
        # Use (freq, reverse_lexicographic) for min heap
        heapq.heappush(min_heap, (-freq, word))

    # Step 4: Extract k most frequent
    # Since we used negative frequency, heap is sorted by frequency descending
    result = []
    for _ in range(k):
        freq, word = heapq.heappop(min_heap)
        result.append(word)

    # Step 5: Sort result by frequency and lexicographic order
    # (already sorted by frequency due to heap, but ties need lexicographic sort)
    result.sort(key=lambda w: (-count[w], w))

    return result
```

**TypeScript Solution**:
```typescript
function topKFrequent(words: string[], k: number): string[] {
    // Step 1: Count word frequencies
    const count: Map<string, number> = new Map();
    for (const word of words) {
        count.set(word, (count.get(word) || 0) + 1);
    }

    // Step 2: Convert to array and sort
    const sorted = Array.from(count.entries())
        .sort((a, b) => {
            // First by frequency descending
            if (a[1] !== b[1]) {
                return b[1] - a[1];
            }
            // Then lexicographically ascending
            return a[0].localeCompare(b[0]);
        });

    // Step 3: Take first k words
    return sorted.slice(0, k).map(([word, freq]) => word);
}
```

**Complexity Analysis**:
- Time Complexity: O(n log k) - for heap operations
- Space Complexity: O(n) - for frequency map

---

### Problem 9: Find Median from Data Stream (Hard)
**LeetCode Link**: [295. Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/)

**Problem Description**:
The median is the middle value in an ordered integer list. Design a data structure that supports adding a number and finding the median.

**Example**:
```
Input: ["MedianFinder", "addNum", "addNum", "findMedian", "addNum", "findMedian"]
       [[], [1], [2], [], [3], []]
Output: [null, null, null, 1.5, null, 2.0]
```

**Python Solution**:
```python
import heapq

class MedianFinder:
    def __init__(self):
        # Step 1: Use two heaps
        # Max heap for smaller half (use negative values)
        self.small = []
        # Min heap for larger half
        self.large = []

    def addNum(self, num: int) -> None:
        # Step 2: Add to max heap (small) first
        heapq.heappush(self.small, -num)

        # Step 3: Balance - ensure every element in small <= every element in large
        # Move largest from small to large
        if self.small and self.large and (-self.small[0] > self.large[0]):
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)

        # Step 4: Balance sizes - small can have at most 1 more element than large
        if len(self.small) > len(self.large) + 1:
            val = -heapq.heappop(self.small)
            heapq.heappush(self.large, val)

        if len(self.large) > len(self.small):
            val = heapq.heappop(self.large)
            heapq.heappush(self.small, -val)

    def findMedian(self) -> float:
        # Step 5: Return median
        # If odd number of elements, median is top of small heap
        if len(self.small) > len(self.large):
            return -self.small[0]
        # If even, median is average of tops of both heaps
        return (-self.small[0] + self.large[0]) / 2
```

**TypeScript Solution**:
```typescript
class MedianFinder {
    private small: number[];  // Max heap (negative values)
    private large: number[];  // Min heap

    constructor() {
        this.small = [];
        this.large = [];
    }

    private heapPushMax(heap: number[], val: number): void {
        heap.push(-val);
        heap.sort((a, b) => a - b);
    }

    private heapPopMax(heap: number[]): number {
        return -heap.shift()!;
    }

    private heapPushMin(heap: number[], val: number): void {
        heap.push(val);
        heap.sort((a, b) => a - b);
    }

    private heapPopMin(heap: number[]): number {
        return heap.shift()!;
    }

    addNum(num: number): void {
        // Add to small heap (max heap)
        this.heapPushMax(this.small, num);

        // Balance heaps
        if (this.small.length > 0 && this.large.length > 0 && -this.small[0] > this.large[0]) {
            const val = this.heapPopMax(this.small);
            this.heapPushMin(this.large, val);
        }

        // Balance sizes
        if (this.small.length > this.large.length + 1) {
            const val = this.heapPopMax(this.small);
            this.heapPushMin(this.large, val);
        }

        if (this.large.length > this.small.length) {
            const val = this.heapPopMin(this.large);
            this.heapPushMax(this.small, val);
        }
    }

    findMedian(): number {
        if (this.small.length > this.large.length) {
            return -this.small[0];
        }
        return (-this.small[0] + this.large[0]) / 2;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(log n) for addNum, O(1) for findMedian
- Space Complexity: O(n) - storing all numbers

---

### Problem 10: Kth Largest Element in a Stream (Easy)
**LeetCode Link**: [703. Kth Largest Element in a Stream](https://leetcode.com/problems/kth-largest-element-in-a-stream/)

**Problem Description**:
Design a class to find the kth largest element in a stream. Note that it is the kth largest element in the sorted order, not the kth distinct element.

**Example**:
```
Input: ["KthLargest", "add", "add", "add", "add", "add"]
       [[3, [4, 5, 8, 2]], [3], [5], [10], [9], [4]]
Output: [null, 4, 5, 5, 8, 8]
```

**Python Solution**:
```python
import heapq

class KthLargest:
    def __init__(self, k: int, nums: list[int]):
        # Step 1: Store k and create min heap
        self.k = k
        self.min_heap = []

        # Step 2: Add all initial numbers
        for num in nums:
            self.add(num)

    def add(self, val: int) -> int:
        # Step 3: Add new value to heap
        heapq.heappush(self.min_heap, val)

        # Step 4: If heap size exceeds k, remove smallest
        if len(self.min_heap) > self.k:
            heapq.heappop(self.min_heap)

        # Step 5: Return kth largest (smallest in heap of k largest)
        return self.min_heap[0]
```

**TypeScript Solution**:
```typescript
class KthLargest {
    private k: number;
    private minHeap: number[];

    constructor(k: number, nums: number[]) {
        this.k = k;
        this.minHeap = [];

        // Add all initial numbers
        for (const num of nums) {
            this.add(num);
        }
    }

    add(val: number): number {
        // Add new value to heap
        this.minHeap.push(val);
        this.minHeap.sort((a, b) => a - b);

        // If heap size exceeds k, remove smallest
        if (this.minHeap.length > this.k) {
            this.minHeap.shift();
        }

        // Return kth largest
        return this.minHeap[0];
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(log k) for add operation
- Space Complexity: O(k) - heap stores k elements

---

### Problem 11: Ugly Number II (Medium)
**LeetCode Link**: [264. Ugly Number II](https://leetcode.com/problems/ugly-number-ii/)

**Problem Description**:
An ugly number is a positive integer whose prime factors are limited to 2, 3, and 5. Given an integer n, return the nth ugly number.

**Example**:
```
Input: n = 10
Output: 12
Explanation: [1, 2, 3, 4, 5, 6, 8, 9, 10, 12] is the sequence of the first 10 ugly numbers.
```

**Python Solution**:
```python
import heapq

def nthUglyNumber(n: int) -> int:
    # Step 1: Initialize min heap with 1
    min_heap = [1]
    seen = {1}  # Track seen numbers to avoid duplicates
    factors = [2, 3, 5]

    # Step 2: Extract n ugly numbers
    ugly = 1
    for _ in range(n):
        # Get smallest ugly number
        ugly = heapq.heappop(min_heap)

        # Generate next ugly numbers by multiplying with 2, 3, 5
        for factor in factors:
            new_ugly = ugly * factor
            # Only add if not seen before
            if new_ugly not in seen:
                seen.add(new_ugly)
                heapq.heappush(min_heap, new_ugly)

    # Step 3: Return nth ugly number
    return ugly
```

**TypeScript Solution**:
```typescript
function nthUglyNumber(n: number): number {
    // Step 1: Initialize min heap with 1
    const minHeap: number[] = [1];
    const seen: Set<number> = new Set([1]);
    const factors = [2, 3, 5];

    // Step 2: Extract n ugly numbers
    let ugly = 1;
    for (let i = 0; i < n; i++) {
        // Get smallest ugly number
        minHeap.sort((a, b) => a - b);
        ugly = minHeap.shift()!;

        // Generate next ugly numbers by multiplying with 2, 3, 5
        for (const factor of factors) {
            const newUgly = ugly * factor;
            // Only add if not seen before
            if (!seen.has(newUgly)) {
                seen.add(newUgly);
                minHeap.push(newUgly);
            }
        }
    }

    // Step 3: Return nth ugly number
    return ugly;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - n extractions and insertions
- Space Complexity: O(n) - heap and set size

---

### Problem 12: Sort Characters By Frequency (Medium)
**LeetCode Link**: [451. Sort Characters By Frequency](https://leetcode.com/problems/sort-characters-by-frequency/)

**Problem Description**:
Given a string s, sort it in decreasing order based on the frequency of the characters. The frequency of a character is the number of times it appears in the string.

**Example**:
```
Input: s = "tree"
Output: "eert"
Explanation: 'e' appears twice, 'r' and 't' both appear once.
```

**Python Solution**:
```python
import heapq
from collections import Counter

def frequencySort(s: str) -> str:
    # Step 1: Count character frequencies
    count = Counter(s)

    # Step 2: Create max heap of (frequency, character)
    # Use negative frequency for max heap
    max_heap = [(-freq, char) for char, freq in count.items()]
    heapq.heapify(max_heap)

    # Step 3: Build result string
    result = []
    while max_heap:
        # Get most frequent character
        freq, char = heapq.heappop(max_heap)
        # Add it freq times (freq is negative, so use -freq)
        result.append(char * (-freq))

    # Step 4: Join and return
    return ''.join(result)
```

**TypeScript Solution**:
```typescript
function frequencySort(s: string): string {
    // Step 1: Count character frequencies
    const count: Map<string, number> = new Map();
    for (const char of s) {
        count.set(char, (count.get(char) || 0) + 1);
    }

    // Step 2: Sort by frequency descending
    const sorted = Array.from(count.entries())
        .sort((a, b) => b[1] - a[1]);

    // Step 3: Build result string
    const result: string[] = [];
    for (const [char, freq] of sorted) {
        result.push(char.repeat(freq));
    }

    return result.join('');
}
```

**Complexity Analysis**:
- Time Complexity: O(n log k) - where k is unique characters
- Space Complexity: O(n) - for frequency map and result

---

### Problem 13: Task Scheduler (Medium)
**LeetCode Link**: [621. Task Scheduler](https://leetcode.com/problems/task-scheduler/)

**Problem Description**:
Given a characters array tasks, representing tasks a CPU needs to do, where each letter represents a different task. Tasks could be done in any order. Each task is done in one unit of time. For each unit of time, the CPU could complete either one task or just be idle. However, there is a non-negative integer n that represents the cooldown period between two same tasks.

**Example**:
```
Input: tasks = ["A","A","A","B","B","B"], n = 2
Output: 8
Explanation: A -> B -> idle -> A -> B -> idle -> A -> B
```

**Python Solution**:
```python
import heapq
from collections import Counter, deque

def leastInterval(tasks: list[str], n: int) -> int:
    # Step 1: Count task frequencies
    count = Counter(tasks)

    # Step 2: Create max heap of frequencies (use negative for max heap)
    max_heap = [-freq for freq in count.values()]
    heapq.heapify(max_heap)

    # Step 3: Use queue to track cooldown
    # Queue stores (frequency, time when it becomes available)
    cooldown_queue = deque()
    time = 0

    # Step 4: Process tasks
    while max_heap or cooldown_queue:
        time += 1

        if max_heap:
            # Process most frequent task
            freq = heapq.heappop(max_heap) + 1  # +1 because it's negative

            # If task has more occurrences, add to cooldown queue
            if freq < 0:  # Still negative means more tasks left
                cooldown_queue.append((freq, time + n))

        # Check if any task finished cooldown
        if cooldown_queue and cooldown_queue[0][1] == time:
            freq, _ = cooldown_queue.popleft()
            heapq.heappush(max_heap, freq)

    return time
```

**TypeScript Solution**:
```typescript
function leastInterval(tasks: string[], n: number): number {
    // Step 1: Count task frequencies
    const count: Map<string, number> = new Map();
    for (const task of tasks) {
        count.set(task, (count.get(task) || 0) + 1);
    }

    // Step 2: Get max frequency
    const frequencies = Array.from(count.values());
    const maxFreq = Math.max(...frequencies);

    // Step 3: Count how many tasks have max frequency
    const maxCount = frequencies.filter(f => f === maxFreq).length;

    // Step 4: Calculate minimum intervals
    // Either we need (maxFreq - 1) * (n + 1) + maxCount
    // Or the total number of tasks (if cooldown allows)
    const minIntervals = (maxFreq - 1) * (n + 1) + maxCount;
    return Math.max(minIntervals, tasks.length);
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - where n is number of tasks
- Space Complexity: O(1) - at most 26 different tasks

---

### Problem 14: Kth Smallest Element in a BST (Medium)
**LeetCode Link**: [230. Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst/)

**Problem Description**:
Given the root of a binary search tree and an integer k, return the kth smallest value (1-indexed) of all the values of the nodes in the tree.

**Example**:
```
Input: root = [3,1,4,null,2], k = 1
Output: 1

Input: root = [5,3,6,2,4,null,null,1], k = 3
Output: 3
```

**Visualization**:
```
Tree Structure:          In-order Traversal (sorted):
      5                  [1, 2, 3, 4, 5, 6]
     / \                         ↑
    3   6                     k=3 (answer is 3)
   / \
  2   4
 /
1

The BST property ensures in-order traversal gives sorted order!
We can use a max heap to keep track of k smallest elements.
```

**Python Solution**:
```python
import heapq

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def kthSmallest(root: TreeNode, k: int) -> int:
    # Step 1: Use max heap to store k smallest elements
    # Strategy: Keep heap size at k, remove largest when exceeded
    max_heap = []

    # Step 2: Helper function for in-order traversal
    def inorder(node):
        if not node:
            return

        # Process left subtree
        inorder(node.left)

        # Process current node
        # Add negative value for max heap behavior
        heapq.heappush(max_heap, -node.val)

        # If heap size exceeds k, remove largest
        if len(max_heap) > k:
            heapq.heappop(max_heap)

        # Process right subtree
        inorder(node.right)

    # Step 3: Perform traversal
    inorder(root)

    # Step 4: Return kth smallest (top of max heap, negate back)
    return -max_heap[0]

# Alternative approach: Early termination with counter
def kthSmallest_optimized(root: TreeNode, k: int) -> int:
    """
    More efficient: Stop traversal after finding kth element

    Visualization of early termination:
         5
        / \
       3   6
      / \
     2   4
    /
   1

   In-order: 1 (k=1) → STOP if k=1
   In-order: 1, 2 (k=2) → STOP if k=2
   In-order: 1, 2, 3 (k=3) → STOP if k=3
   """
    # Step 1: Counter to track position
    count = [0]
    result = [0]

    # Step 2: In-order traversal with early termination
    def inorder(node):
        if not node or count[0] >= k:
            return

        # Left subtree
        inorder(node.left)

        # Process current node
        count[0] += 1
        if count[0] == k:
            result[0] = node.val
            return

        # Right subtree
        inorder(node.right)

    inorder(root)
    return result[0]
```

**TypeScript Solution**:
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

function kthSmallest(root: TreeNode | null, k: number): number {
    // Step 1: Collect all values via in-order traversal
    const values: number[] = [];

    // Step 2: In-order traversal helper
    function inorder(node: TreeNode | null): void {
        if (!node) return;

        // Left -> Node -> Right (gives sorted order)
        inorder(node.left);
        values.push(node.val);
        inorder(node.right);
    }

    // Step 3: Perform traversal
    inorder(root);

    // Step 4: Return kth smallest (k-1 index for 0-based array)
    return values[k - 1];
}

// Optimized version with early termination
function kthSmallest_optimized(root: TreeNode | null, k: number): number {
    let count = 0;
    let result = 0;

    function inorder(node: TreeNode | null): void {
        if (!node || count >= k) return;

        inorder(node.left);

        count++;
        if (count === k) {
            result = node.val;
            return;
        }

        inorder(node.right);
    }

    inorder(root);
    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - worst case visit all nodes, but can terminate early
- Space Complexity: O(h) - recursion stack where h is tree height, O(k) for heap approach

---

### Problem 15: Super Ugly Number (Medium)
**LeetCode Link**: [313. Super Ugly Number](https://leetcode.com/problems/super-ugly-number/)

**Problem Description**:
A super ugly number is a positive integer whose prime factors are in the array primes. Given an integer n and an array of integers primes, return the nth super ugly number.

**Example**:
```
Input: n = 12, primes = [2,7,13,19]
Output: 32
Explanation: [1,2,4,7,8,14,16,19,26,28,32,38] is the sequence of the first 12 super ugly numbers.
```

**Visualization**:
```
Building Super Ugly Numbers with primes = [2, 3, 5]

Generation Process (Min Heap):

Round 1: Start with 1
   Heap: [1]
   Generate: 1×2=2, 1×3=3, 1×5=5

   ┌───────────────────────────┐
   │ Heap: [1, 2, 3, 5]        │
   │ Pop 1 → ugly[0] = 1       │
   └───────────────────────────┘

Round 2: Pop 2 (smallest)
   Generate: 2×2=4, 2×3=6, 2×5=10

   ┌───────────────────────────┐
   │ Heap: [3, 4, 5, 6, 10]    │
   │ Pop 2 → ugly[1] = 2       │
   └───────────────────────────┘

Round 3: Pop 3
   Generate: 3×2=6 (dup!), 3×3=9, 3×5=15

   ┌───────────────────────────┐
   │ Heap: [4, 5, 6, 9, 10, 15]│
   │ Pop 3 → ugly[2] = 3       │
   └───────────────────────────┘

Result sequence: 1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, ...
```

**Python Solution**:
```python
import heapq

def nthSuperUglyNumber(n: int, primes: list[int]) -> int:
    """
    Strategy: Use min heap to generate ugly numbers in sorted order

    Key Insight: Each ugly number = previous ugly number × prime

    Example visualization:
    primes = [2, 3, 5]

    1 → 2(1×2), 3(1×3), 5(1×5)
    2 → 4(2×2), 6(2×3), 10(2×5)
    3 → 6(3×2), 9(3×3), 15(3×5)
    ...

    Use heap to always get the smallest next ugly number!
    """
    # Step 1: Initialize heap with 1
    min_heap = [1]
    seen = {1}  # Avoid duplicates

    # Step 2: Generate n ugly numbers
    ugly = 1
    for i in range(n):
        # Get smallest ugly number
        ugly = heapq.heappop(min_heap)

        # Generate new candidates by multiplying with each prime
        for prime in primes:
            new_ugly = ugly * prime

            # Only add if not seen (avoid duplicates)
            # Example: 6 can be generated as 2×3 or 3×2
            if new_ugly not in seen:
                seen.add(new_ugly)
                heapq.heappush(min_heap, new_ugly)

    # Step 3: Return nth ugly number
    return ugly

# Alternative: Dynamic Programming approach (more efficient)
def nthSuperUglyNumber_dp(n: int, primes: list[int]) -> int:
    """
    DP approach with pointers

    Visualization:
    ugly = [1, _, _, _, ...]
    pointers = [0, 0, 0] for primes [2, 3, 5]

    Step 1: next candidates: 1×2=2, 1×3=3, 1×5=5 → min=2
    ugly = [1, 2, _, _, ...]

    Step 2: next candidates: 2×2=4, 1×3=3, 1×5=5 → min=3
    ugly = [1, 2, 3, _, ...]

    Step 3: next candidates: 2×2=4, 2×3=6, 1×5=5 → min=4
    ugly = [1, 2, 3, 4, ...]
    """
    ugly = [1]
    pointers = [0] * len(primes)  # Track which ugly number each prime points to

    for i in range(1, n):
        # Calculate next candidates
        candidates = [ugly[pointers[j]] * primes[j] for j in range(len(primes))]

        # Find minimum
        next_ugly = min(candidates)
        ugly.append(next_ugly)

        # Move pointers that generated this ugly number
        for j in range(len(primes)):
            if candidates[j] == next_ugly:
                pointers[j] += 1

    return ugly[-1]
```

**TypeScript Solution**:
```typescript
function nthSuperUglyNumber(n: number, primes: number[]): number {
    // Step 1: Initialize min heap with 1
    const minHeap: number[] = [1];
    const seen: Set<number> = new Set([1]);

    // Step 2: Generate n ugly numbers
    let ugly = 1;
    for (let i = 0; i < n; i++) {
        // Get smallest ugly number
        minHeap.sort((a, b) => a - b);
        ugly = minHeap.shift()!;

        // Generate new candidates
        for (const prime of primes) {
            const newUgly = ugly * prime;

            // Only add if not seen
            if (!seen.has(newUgly)) {
                seen.add(newUgly);
                minHeap.push(newUgly);
            }
        }
    }

    return ugly;
}

// DP approach
function nthSuperUglyNumber_dp(n: number, primes: number[]): number {
    const ugly: number[] = [1];
    const pointers: number[] = new Array(primes.length).fill(0);

    for (let i = 1; i < n; i++) {
        // Calculate next candidates
        const candidates = pointers.map((ptr, j) => ugly[ptr] * primes[j]);

        // Find minimum
        const nextUgly = Math.min(...candidates);
        ugly.push(nextUgly);

        // Move pointers
        for (let j = 0; j < primes.length; j++) {
            if (candidates[j] === nextUgly) {
                pointers[j]++;
            }
        }
    }

    return ugly[n - 1];
}
```

**Complexity Analysis**:
- Time Complexity: O(n × m log(n × m)) for heap approach, O(n × m) for DP where m = len(primes)
- Space Complexity: O(n × m) for heap/seen set, O(n) for DP

---

### Problem 16: Smallest Range Covering Elements from K Lists (Hard)
**LeetCode Link**: [632. Smallest Range Covering Elements from K Lists](https://leetcode.com/problems/smallest-range-covering-elements-from-k-lists/)

**Problem Description**:
You have k lists of sorted integers. Find the smallest range that includes at least one number from each of the k lists.

**Example**:
```
Input: nums = [[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]
Output: [20,24]

Explanation:
List 1: [4,10,15,24,26], 24 is in range [20,24]
List 2: [0,9,12,20], 20 is in range [20,24]
List 3: [5,18,22,30], 22 is in range [20,24]
```

**Visualization**:
```
Understanding the problem with a number line:

List 1: [4,   10,  15,      24, 26]
        ●    ●    ●        ●   ●

List 2: [0,   9,   12,     20]
        ●    ●    ●       ●

List 3: [5,        18, 22,     30]
        ●          ●   ●       ●

Goal: Find smallest [left, right] covering one from each list

Initial state (take first from each):
List 1: [4, ...]  ←
List 2: [0, ...]  ←
List 3: [5, ...]  ←

Range: [0, 5] (min=0, max=5) ✓ Covers all lists
Range size: 5 - 0 = 5

Move pointer at minimum (List 2):
List 1: [4, ...]  ←
List 2: [0, 9, ...] ←
List 3: [5, ...]    ←

Range: [4, 9] (min=4, max=9) ✓ Covers all lists
Range size: 9 - 4 = 5

Continue until we find [20, 24] with size 4!
```

**Python Solution**:
```python
import heapq

def smallestRange(nums: list[list[int]]) -> list[int]:
    """
    Strategy: Use min heap to track current minimum from each list

    Visualization of the sliding window approach:

    Heap contains: (value, list_index, element_index)
    Track: current_max to maintain the range

    Step-by-step:
    1. Initialize heap with first element from each list
    2. Track the current maximum
    3. Pop minimum, update range if smaller
    4. Add next element from same list, update max
    5. Repeat until one list exhausted
    """
    # Step 1: Initialize min heap with first element from each list
    # Heap stores: (value, list_index, element_index)
    min_heap = []
    current_max = float('-inf')

    for i in range(len(nums)):
        if nums[i]:  # Check list is not empty
            heapq.heappush(min_heap, (nums[i][0], i, 0))
            current_max = max(current_max, nums[i][0])

    # Step 2: Initialize result with infinite range
    result = [float('-inf'), float('inf')]

    # Step 3: Process until one list is exhausted
    while len(min_heap) == len(nums):  # Must have element from each list
        # Get minimum element
        current_min, list_idx, elem_idx = heapq.heappop(min_heap)

        # Step 4: Update result if current range is smaller
        # Range is [current_min, current_max]
        if current_max - current_min < result[1] - result[0]:
            result = [current_min, current_max]

        # Step 5: Add next element from the same list
        if elem_idx + 1 < len(nums[list_idx]):
            next_val = nums[list_idx][elem_idx + 1]
            heapq.heappush(min_heap, (next_val, list_idx, elem_idx + 1))
            current_max = max(current_max, next_val)
        # If no next element, loop will terminate

    return result

# Example walkthrough:
def smallestRange_with_visualization(nums: list[list[int]]) -> list[int]:
    """
    Example: nums = [[4,10,15,24,26], [0,9,12,20], [5,18,22,30]]

    Round 1: Heap = [(0,1,0), (4,0,0), (5,2,0)]
             min=0, max=5, range=[0,5], size=5
             Pop 0, add 9 from list 1

    Round 2: Heap = [(4,0,0), (5,2,0), (9,1,1)]
             min=4, max=9, range=[4,9], size=5
             Pop 4, add 10 from list 0

    Round 3: Heap = [(5,2,0), (9,1,1), (10,0,1)]
             min=5, max=10, range=[5,10], size=5
             Pop 5, add 18 from list 2

    ... continue until we find [20,24] with size 4
    """
    min_heap = []
    current_max = float('-inf')

    for i in range(len(nums)):
        if nums[i]:
            heapq.heappush(min_heap, (nums[i][0], i, 0))
            current_max = max(current_max, nums[i][0])

    result = [float('-inf'), float('inf')]

    while len(min_heap) == len(nums):
        current_min, list_idx, elem_idx = heapq.heappop(min_heap)

        if current_max - current_min < result[1] - result[0]:
            result = [current_min, current_max]

        if elem_idx + 1 < len(nums[list_idx]):
            next_val = nums[list_idx][elem_idx + 1]
            heapq.heappush(min_heap, (next_val, list_idx, elem_idx + 1))
            current_max = max(current_max, next_val)

    return result
```

**TypeScript Solution**:
```typescript
function smallestRange(nums: number[][]): number[] {
    // Step 1: Initialize min heap with first element from each list
    // Heap stores: [value, list_index, element_index]
    const minHeap: [number, number, number][] = [];
    let currentMax = -Infinity;

    for (let i = 0; i < nums.length; i++) {
        if (nums[i].length > 0) {
            minHeap.push([nums[i][0], i, 0]);
            currentMax = Math.max(currentMax, nums[i][0]);
        }
    }

    // Step 2: Initialize result
    let result = [-Infinity, Infinity];

    // Step 3: Process until one list is exhausted
    while (minHeap.length === nums.length) {
        // Sort to get minimum
        minHeap.sort((a, b) => a[0] - b[0]);

        // Get minimum element
        const [currentMin, listIdx, elemIdx] = minHeap.shift()!;

        // Step 4: Update result if current range is smaller
        if (currentMax - currentMin < result[1] - result[0]) {
            result = [currentMin, currentMax];
        }

        // Step 5: Add next element from same list
        if (elemIdx + 1 < nums[listIdx].length) {
            const nextVal = nums[listIdx][elemIdx + 1];
            minHeap.push([nextVal, listIdx, elemIdx + 1]);
            currentMax = Math.max(currentMax, nextVal);
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n × k log k) - where n is total elements, k is number of lists
- Space Complexity: O(k) - heap stores at most k elements

---

### Problem 17: Last Stone Weight (Easy)
**LeetCode Link**: [1046. Last Stone Weight](https://leetcode.com/problems/last-stone-weight/)

**Problem Description**:
You are given an array of integers stones where stones[i] is the weight of the ith stone. We are playing a game with the stones. On each turn, we choose the heaviest two stones and smash them together. The result is:
- If x == y, both stones are destroyed.
- If x != y, the stone of weight x is destroyed, and the stone of weight y has new weight y - x.

Return the weight of the last remaining stone, or 0 if there are no stones left.

**Example**:
```
Input: stones = [2,7,4,1,8,1]
Output: 1

Explanation:
Round 1: Smash 8 and 7 → remain 1, stones = [2,4,1,1,1]
Round 2: Smash 4 and 2 → remain 2, stones = [2,1,1,1]
Round 3: Smash 2 and 1 → remain 1, stones = [1,1,1]
Round 4: Smash 1 and 1 → both destroyed, stones = [1]
Round 5: One stone left, return 1
```

**Visualization**:
```
🪨 STONE SMASHING GAME 🪨

Initial stones: [2, 7, 4, 1, 8, 1]

Using MAX HEAP to always get two heaviest stones:

╔══════════════════════════════════════════════════════════╗
║  Round 1: Max Heap = [8, 7, 4, 2, 1, 1]                 ║
╚══════════════════════════════════════════════════════════╝

    Pick two heaviest:  8  and  7
                        🪨      🪨
                         \    /
                          \  /
                        SMASH!
                           💥
                         Result: 8 - 7 = 1

    Remaining: [4, 2, 1, 1, 1]

╔══════════════════════════════════════════════════════════╗
║  Round 2: Max Heap = [4, 2, 1, 1, 1]                    ║
╚══════════════════════════════════════════════════════════╝

    Pick two heaviest:  4  and  2
                        🪨      🪨
                         \    /
                        SMASH!
                           💥
                         Result: 4 - 2 = 2

    Remaining: [2, 1, 1, 1]

╔══════════════════════════════════════════════════════════╗
║  Round 3: Max Heap = [2, 1, 1, 1]                       ║
╚══════════════════════════════════════════════════════════╝

    Pick two heaviest:  2  and  1
                        🪨      🪨
                         \    /
                        SMASH!
                           💥
                         Result: 2 - 1 = 1

    Remaining: [1, 1, 1]

╔══════════════════════════════════════════════════════════╗
║  Round 4: Max Heap = [1, 1, 1]                          ║
╚══════════════════════════════════════════════════════════╗

    Pick two heaviest:  1  and  1
                        🪨      🪨
                         \    /
                        SMASH!
                           💥
                         Result: 1 - 1 = 0 (both destroyed!)

    Remaining: [1]

╔══════════════════════════════════════════════════════════╗
║  Round 5: Only 1 stone left → RETURN 1                  ║
╚══════════════════════════════════════════════════════════╝

Final Answer: 1 🎯
```

**Python Solution**:
```python
import heapq

def lastStoneWeight(stones: list[int]) -> int:
    """
    Strategy: Use max heap to always get two heaviest stones

    Key Insight: We need MAX heap, but Python's heapq is MIN heap
    Solution: Negate all values to simulate MAX heap

    Visualization:
    stones = [2, 7, 4, 1, 8, 1]
    max_heap = [-8, -7, -4, -2, -1, -1] (negated for max behavior)

    Pop two largest (most negative): -8 and -7
    Difference: 8 - 7 = 1
    Push back: -1

    Continue until 0 or 1 stone remains
    """
    # Step 1: Create max heap by negating all values
    max_heap = [-stone for stone in stones]
    heapq.heapify(max_heap)

    # Step 2: Smash stones until 0 or 1 left
    while len(max_heap) > 1:
        # Get two heaviest stones (pop twice)
        # Remember to negate back to get actual values
        first = -heapq.heappop(max_heap)   # Heaviest
        second = -heapq.heappop(max_heap)  # Second heaviest

        # Step 3: If stones have different weights
        if first != second:
            # Add remaining weight back to heap
            difference = first - second
            heapq.heappush(max_heap, -difference)
        # If equal, both destroyed (don't add anything back)

    # Step 4: Return last stone weight, or 0 if no stones left
    # Remember to negate back if stone exists
    return -max_heap[0] if max_heap else 0
```

**TypeScript Solution**:
```typescript
function lastStoneWeight(stones: number[]): number {
    // Step 1: Create max heap (simulate with sorted array)
    // In TypeScript, we'll maintain a sorted array
    const maxHeap = [...stones];

    // Step 2: Smash stones until 0 or 1 left
    while (maxHeap.length > 1) {
        // Sort descending to get max heap behavior
        maxHeap.sort((a, b) => b - a);

        // Get two heaviest stones
        const first = maxHeap.shift()!;   // Heaviest
        const second = maxHeap.shift()!;  // Second heaviest

        // Step 3: If different weights, add difference back
        if (first !== second) {
            const difference = first - second;
            maxHeap.push(difference);
        }
        // If equal, both destroyed
    }

    // Step 4: Return last stone or 0
    return maxHeap.length === 1 ? maxHeap[0] : 0;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - n operations, each with heap push/pop O(log n)
- Space Complexity: O(n) - heap stores all stones

---

### Problem 18: Distant Barcodes (Medium)
**LeetCode Link**: [1054. Distant Barcodes](https://leetcode.com/problems/distant-barcodes/)

**Problem Description**:
In a warehouse, there is a row of barcodes, where the ith barcode is barcodes[i]. Rearrange the barcodes so that no two adjacent barcodes are equal. You may return any answer, and it is guaranteed an answer exists.

**Example**:
```
Input: barcodes = [1,1,1,2,2,2]
Output: [2,1,2,1,2,1]

Input: barcodes = [1,1,1,1,2,2,3,3]
Output: [1,3,1,3,1,2,1,2]
```

**Visualization**:
```
🏭 BARCODE ARRANGEMENT STRATEGY 🏭

Input: [1,1,1,2,2,2]
Frequency: {1: 3, 2: 3}

Strategy: Use MAX HEAP by frequency, alternate placement

╔════════════════════════════════════════════════════════╗
║  MAX HEAP BY FREQUENCY                                 ║
╚════════════════════════════════════════════════════════╝

Initial Heap (freq, value):
    [(3, 1), (3, 2)]

Result array: [_, _, _, _, _, _]

═══════════════════════════════════════════════════════

Step 1: Pop most frequent: (3, 1)
   Place: 1
   Result: [1, _, _, _, _, _]
   Decrease freq: (2, 1)
   Previous: None → Save (2, 1) for next round

Step 2: Pop most frequent: (3, 2)
   Place: 2
   Result: [1, 2, _, _, _, _]
   Add back previous: Push (2, 1)
   Decrease freq: (2, 2)
   Previous: (2, 2)

Step 3: Pop most frequent: (2, 1)
   Place: 1
   Result: [1, 2, 1, _, _, _]
   Add back previous: Push (2, 2)
   Decrease freq: (1, 1)
   Previous: (1, 1)

Step 4: Pop most frequent: (2, 2)
   Place: 2
   Result: [1, 2, 1, 2, _, _]
   Add back previous: Push (1, 1)
   Decrease freq: (1, 2)
   Previous: (1, 2)

Step 5: Pop most frequent: (1, 1)
   Place: 1
   Result: [1, 2, 1, 2, 1, _]
   Add back previous: Push (1, 2)
   Decrease freq: (0, 1) → Don't add back
   Previous: (1, 2)

Step 6: Pop most frequent: (1, 2)
   Place: 2
   Result: [1, 2, 1, 2, 1, 2] ✓

═══════════════════════════════════════════════════════

Key Pattern: Always use most frequent, but skip one turn
to avoid adjacency!
```

**Python Solution**:
```python
import heapq
from collections import Counter

def rearrangeBarcodes(barcodes: list[int]) -> list[int]:
    """
    Strategy: Greedy approach with max heap

    Key Insight: Always place the most frequent barcode,
    but alternate to avoid adjacency

    Similar to "Reorganize String" problem!

    Visualization of the greedy strategy:

    Heap: [(freq, barcode), ...]
    Result: []
    Previous: None (barcode we just placed, on cooldown)

    Loop:
        1. Pop most frequent
        2. Place it in result
        3. Add previous back to heap (cooldown over)
        4. Save current as previous (start cooldown)
    """
    # Step 1: Count frequencies
    count = Counter(barcodes)

    # Step 2: Create max heap (negative frequency for max behavior)
    max_heap = [(-freq, barcode) for barcode, freq in count.items()]
    heapq.heapify(max_heap)

    # Step 3: Build result
    result = []
    prev_freq, prev_barcode = 0, 0

    # Step 4: Process heap
    while max_heap:
        # Get most frequent barcode
        freq, barcode = heapq.heappop(max_heap)

        # Add to result
        result.append(barcode)

        # Add previous barcode back to heap (if still has occurrences)
        if prev_freq < 0:
            heapq.heappush(max_heap, (prev_freq, prev_barcode))

        # Update previous (decrease frequency by 1)
        prev_freq, prev_barcode = freq + 1, barcode

    return result

# Alternative: Fill even positions first, then odd
def rearrangeBarcodes_alternate(barcodes: list[int]) -> list[int]:
    """
    Alternative strategy: Fill positions smartly

    Visualization:
    Input: [1,1,1,1,2,2,3,3]
    Count: {1: 4, 2: 2, 3: 2}

    Step 1: Sort by frequency: [(1,4), (2,2), (3,2)]

    Step 2: Fill even positions (0, 2, 4, 6, ...):
    [1, _, 1, _, 1, _, 1, _]
     ↑     ↑     ↑     ↑
     0     2     4     6

    Step 3: Fill odd positions (1, 3, 5, 7, ...):
    [1, 2, 1, 2, 1, 3, 1, 3]
        ↑     ↑     ↑     ↑
        1     3     5     7

    This ensures no two adjacent are same!
    """
    count = Counter(barcodes)
    # Sort by frequency descending
    sorted_barcodes = sorted(count.items(), key=lambda x: -x[1])

    result = [0] * len(barcodes)
    idx = 0

    # Fill positions
    for barcode, freq in sorted_barcodes:
        for _ in range(freq):
            result[idx] = barcode
            idx += 2
            # If exceeded, wrap to odd positions
            if idx >= len(barcodes):
                idx = 1

    return result
```

**TypeScript Solution**:
```typescript
function rearrangeBarcodes(barcodes: number[]): number[] {
    // Step 1: Count frequencies
    const count: Map<number, number> = new Map();
    for (const barcode of barcodes) {
        count.set(barcode, (count.get(barcode) || 0) + 1);
    }

    // Step 2: Sort by frequency descending
    const sorted = Array.from(count.entries())
        .sort((a, b) => b[1] - a[1]);

    // Step 3: Fill result array
    const result: number[] = new Array(barcodes.length);
    let idx = 0;

    // Fill even positions first, then odd
    for (const [barcode, freq] of sorted) {
        for (let i = 0; i < freq; i++) {
            result[idx] = barcode;
            idx += 2;
            // Wrap to odd positions
            if (idx >= barcodes.length) {
                idx = 1;
            }
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log k) - where k is unique barcodes
- Space Complexity: O(n) - for result array and frequency map

---

### Problem 19: Rearrange String k Distance Apart (Hard)
**LeetCode Link**: [358. Rearrange String k Distance Apart](https://leetcode.com/problems/rearrange-string-k-distance-apart/) (Premium)

**Problem Description**:
Given a string s and an integer k, rearrange s such that the same characters are at least distance k from each other. If it is not possible to rearrange the string, return an empty string "".

**Example**:
```
Input: s = "aabbcc", k = 3
Output: "abcabc"

Input: s = "aaabc", k = 3
Output: ""
Explanation: It is not possible to rearrange the string.

Input: s = "aaadbbcc", k = 2
Output: "abacabcd"
```

**Visualization**:
```
🔤 K-DISTANCE STRING REARRANGEMENT 🔤

Example: s = "aabbcc", k = 3

Constraint: Same characters must be ≥ k positions apart

╔═══════════════════════════════════════════════════════════╗
║  Strategy: Max Heap + Cooldown Queue                      ║
╚═══════════════════════════════════════════════════════════╝

Frequency count: {a: 2, b: 2, c: 2}

Max Heap (by frequency):     Cooldown Queue:
[(2,a), (2,b), (2,c)]        []

═══════════════════════════════════════════════════════════

Position 0: Pop 'a' (freq=2)
   Result: "a"
   Heap: [(2,b), (2,c)]
   Cooldown: [(1,a)] ← Available at position 0+3=3

Position 1: Pop 'b' (freq=2)
   Result: "ab"
   Heap: [(2,c)]
   Cooldown: [(1,a,3), (1,b,4)] ← Available at position 4

Position 2: Pop 'c' (freq=2)
   Result: "abc"
   Heap: []
   Cooldown: [(1,a,3), (1,b,4), (1,c,5)]

Position 3: Check cooldown → 'a' available! (pos 3)
   Add 'a' back to heap
   Pop 'a' (freq=1)
   Result: "abca"
   Heap: []
   Cooldown: [(1,b,4), (1,c,5), (0,a,6)]

Position 4: Check cooldown → 'b' available!
   Pop 'b' (freq=1)
   Result: "abcab"
   Heap: []
   Cooldown: [(1,c,5), (0,a,6), (0,b,7)]

Position 5: Check cooldown → 'c' available!
   Pop 'c' (freq=1)
   Result: "abcabc" ✓
   Heap: []
   Cooldown: [(0,a,6), (0,b,7), (0,c,8)]

Success! All characters placed with k=3 distance.

═══════════════════════════════════════════════════════════

Counter-example: s = "aaabc", k = 3
Frequency: {a: 3, b: 1, c: 1}

Positions: a _ _ a _ _ a
           ↑       ↑       ↑
           0       3       6

We have only 5 characters, but need 7 positions!
Result: "" (impossible)
```

**Python Solution**:
```python
import heapq
from collections import Counter, deque

def rearrangeString(s: str, k: int) -> str:
    """
    Strategy: Max heap + cooldown queue

    Key Insight:
    - Use max heap to always pick most frequent character
    - Use queue to track characters in "cooldown" period
    - When character's cooldown expires, add back to heap

    Visualization of cooldown concept:

    k = 3 means: a _ _ a (minimum 3 positions apart)
                 0 1 2 3

    If we place 'a' at position 0, next 'a' can be at position 3+
    Positions 1, 2 are "cooldown" for 'a'
    """
    # Edge case: k = 0 or 1, no rearrangement needed
    if k <= 1:
        return s

    # Step 1: Count frequencies
    count = Counter(s)

    # Step 2: Create max heap (negative frequency)
    max_heap = [(-freq, char) for char, freq in count.items()]
    heapq.heapify(max_heap)

    # Step 3: Build result and maintain cooldown queue
    result = []
    cooldown_queue = deque()  # Stores (freq, char, available_at_position)

    # Step 4: Process characters
    while max_heap or cooldown_queue:
        # Check if any character's cooldown expired
        if cooldown_queue and cooldown_queue[0][2] <= len(result):
            freq, char, _ = cooldown_queue.popleft()
            heapq.heappush(max_heap, (freq, char))

        # If no character available but result not complete, impossible
        if not max_heap:
            return ""

        # Get most frequent character
        freq, char = heapq.heappop(max_heap)
        result.append(char)

        # If character has more occurrences, add to cooldown
        if freq + 1 < 0:  # freq is negative, so +1 brings closer to 0
            # Available at: current_position + k
            cooldown_queue.append((freq + 1, char, len(result) + k))

    return ''.join(result)

# Alternative approach with queue-based solution
def rearrangeString_queue(s: str, k: int) -> str:
    """
    Simplified queue-based approach

    Visualization:
    For each position:
        1. Add back any characters whose cooldown expired
        2. Pick most frequent character
        3. Place it and update cooldown
    """
    if k <= 1:
        return s

    count = Counter(s)
    max_heap = [(-freq, char) for char, freq in count.items()]
    heapq.heapify(max_heap)

    result = []
    cooldown = deque()

    while max_heap:
        # Process k characters (or remaining characters)
        temp = []
        for _ in range(min(k, len(s) - len(result))):
            if not max_heap:
                return ""  # Not enough unique characters

            freq, char = heapq.heappop(max_heap)
            result.append(char)

            # Save for later if has more occurrences
            if freq + 1 < 0:
                temp.append((freq + 1, char))

        # Add all processed characters back to heap
        for item in temp:
            heapq.heappush(max_heap, item)

    return ''.join(result)
```

**TypeScript Solution**:
```typescript
function rearrangeString(s: string, k: number): string {
    // Edge case
    if (k <= 1) return s;

    // Step 1: Count frequencies
    const count: Map<string, number> = new Map();
    for (const char of s) {
        count.set(char, (count.get(char) || 0) + 1);
    }

    // Step 2: Sort by frequency
    const sorted = Array.from(count.entries())
        .sort((a, b) => b[1] - a[1]);

    // Step 3: Check if possible
    const maxFreq = sorted[0][1];
    const numChars = count.size;

    // Need at least k unique characters if max frequency > 1
    if (maxFreq > 1 && numChars < k) {
        return "";
    }

    // Step 4: Build result using round-robin
    const result: string[] = new Array(s.length);
    let idx = 0;

    for (const [char, freq] of sorted) {
        for (let i = 0; i < freq; i++) {
            if (idx >= s.length) {
                // Check if we can place here
                if (result[idx % s.length] !== undefined) {
                    return "";
                }
            }
            result[idx] = char;
            idx += k;
            if (idx >= s.length) {
                idx = Math.floor(idx / s.length) + (idx % s.length);
                // Find next available position
                while (idx < s.length && result[idx] !== undefined) {
                    idx++;
                }
            }
        }
    }

    return result.join('');
}
```

**Complexity Analysis**:
- Time Complexity: O(n log k) - where k is unique characters
- Space Complexity: O(n) - for result and frequency map

---

### Problem 20: Maximum Frequency Stack (Hard)
**LeetCode Link**: [895. Maximum Frequency Stack](https://leetcode.com/problems/maximum-frequency-stack/)

**Problem Description**:
Design a stack-like data structure to push elements to the stack and pop the most frequent element from the stack. Implement the FreqStack class with push(int val) and pop() operations.

**Example**:
```
Input: ["FreqStack", "push", "push", "push", "push", "push", "push", "pop", "pop", "pop", "pop"]
       [[], [5], [7], [5], [7], [4], [5], [], [], [], []]
Output: [null, null, null, null, null, null, null, 5, 7, 5, 4]

Explanation:
FreqStack freqStack = new FreqStack();
freqStack.push(5); // stack: [5]
freqStack.push(7); // stack: [5,7]
freqStack.push(5); // stack: [5,7,5]
freqStack.push(7); // stack: [5,7,5,7]
freqStack.push(4); // stack: [5,7,5,7,4]
freqStack.push(5); // stack: [5,7,5,7,4,5]
freqStack.pop();   // return 5 (freq 3, most recent)
freqStack.pop();   // return 7 (freq 2)
freqStack.pop();   // return 5 (freq 2)
freqStack.pop();   // return 4 (freq 1)
```

**Visualization**:
```
📚 FREQUENCY STACK - SMART ORGANIZATION 📚

Key Idea: Organize elements by frequency levels

╔════════════════════════════════════════════════════════════╗
║  Data Structure Design                                     ║
║  ─────────────────────────────────────────────────────────║
║  freq_map: {val → frequency}                              ║
║  group_map: {frequency → [vals with that frequency]}      ║
║  max_freq: current maximum frequency                       ║
╚════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════

Operation Sequence:

PUSH 5:
   freq_map: {5: 1}
   group_map: {1: [5]}
   max_freq: 1

   Visualization:
   Freq 1: [5]

PUSH 7:
   freq_map: {5: 1, 7: 1}
   group_map: {1: [5, 7]}
   max_freq: 1

   Visualization:
   Freq 1: [5, 7]

PUSH 5:
   freq_map: {5: 2, 7: 1}
   group_map: {1: [5, 7], 2: [5]}
   max_freq: 2

   Visualization:
   Freq 2: [5]        ← Most frequent
   Freq 1: [5, 7]

PUSH 7:
   freq_map: {5: 2, 7: 2}
   group_map: {1: [5, 7], 2: [5, 7]}
   max_freq: 2

   Visualization:
   Freq 2: [5, 7]     ← Most frequent
   Freq 1: [5, 7]

PUSH 4:
   freq_map: {5: 2, 7: 2, 4: 1}
   group_map: {1: [5, 7, 4], 2: [5, 7]}
   max_freq: 2

   Visualization:
   Freq 2: [5, 7]     ← Most frequent
   Freq 1: [5, 7, 4]

PUSH 5:
   freq_map: {5: 3, 7: 2, 4: 1}
   group_map: {1: [5, 7, 4], 2: [5, 7], 3: [5]}
   max_freq: 3

   Visualization:
   Freq 3: [5]        ← Most frequent (return this!)
   Freq 2: [5, 7]
   Freq 1: [5, 7, 4]

═══════════════════════════════════════════════════════════

POP: Return from highest frequency (max_freq = 3)
   Return: 5 (from Freq 3)
   Update freq_map: {5: 2, 7: 2, 4: 1}
   Update group_map: {1: [5, 7, 4], 2: [5, 7], 3: []}
   Update max_freq: 2 (since Freq 3 is now empty)

   Visualization after pop:
   Freq 2: [5, 7]     ← New most frequent
   Freq 1: [5, 7, 4]

POP: Return from highest frequency (max_freq = 2)
   Return: 7 (most recent in Freq 2)

   Visualization:
   Freq 2: [5]        ← Most frequent
   Freq 1: [5, 7, 4]

💡 Key Insight: We maintain stacks for each frequency level!
```

**Python Solution**:
```python
from collections import defaultdict

class FreqStack:
    """
    Strategy: Group elements by frequency level

    Data structures:
    1. freq_map: Track current frequency of each value
    2. group_map: Map frequency → stack of values with that frequency
    3. max_freq: Track current maximum frequency

    Why this works:
    - Push: Increment frequency, add to that frequency's stack
    - Pop: Get from max frequency stack, decrement frequency
    - Always O(1) time!

    Visualization of internal state:

    After pushes [5,7,5,7,4,5]:

    freq_map = {5: 3, 7: 2, 4: 1}

    group_map = {
        1: [5, 7, 4],    ← Elements that appeared once
        2: [5, 7],       ← Elements that appeared twice
        3: [5]           ← Elements that appeared thrice
    }

    max_freq = 3

    To pop: Take from group_map[3] → get 5
    """

    def __init__(self):
        # Step 1: Initialize data structures
        self.freq_map = defaultdict(int)      # val → frequency
        self.group_map = defaultdict(list)     # frequency → [vals]
        self.max_freq = 0                      # current max frequency

    def push(self, val: int) -> None:
        # Step 2: Increment frequency
        self.freq_map[val] += 1
        freq = self.freq_map[val]

        # Step 3: Add to appropriate frequency group
        self.group_map[freq].append(val)

        # Step 4: Update max frequency
        self.max_freq = max(self.max_freq, freq)

    def pop(self) -> int:
        # Step 5: Get value from highest frequency group
        val = self.group_map[self.max_freq].pop()

        # Step 6: Decrement frequency in freq_map
        self.freq_map[val] -= 1

        # Step 7: If this frequency group is empty, decrease max_freq
        if not self.group_map[self.max_freq]:
            self.max_freq -= 1

        return val

# Example usage with detailed tracking:
def demonstrate_freq_stack():
    """
    Demonstration with state tracking
    """
    stack = FreqStack()

    operations = [5, 7, 5, 7, 4, 5]
    print("PUSH operations:")
    for val in operations:
        stack.push(val)
        print(f"  Pushed {val}:")
        print(f"    freq_map: {dict(stack.freq_map)}")
        print(f"    max_freq: {stack.max_freq}")
        print(f"    group_map[{stack.max_freq}]: {stack.group_map[stack.max_freq]}")

    print("\nPOP operations:")
    for _ in range(4):
        popped = stack.pop()
        print(f"  Popped {popped}:")
        print(f"    max_freq: {stack.max_freq}")
```

**TypeScript Solution**:
```typescript
class FreqStack {
    private freqMap: Map<number, number>;      // val → frequency
    private groupMap: Map<number, number[]>;   // frequency → [vals]
    private maxFreq: number;                   // current max frequency

    constructor() {
        this.freqMap = new Map();
        this.groupMap = new Map();
        this.maxFreq = 0;
    }

    push(val: number): void {
        // Step 1: Increment frequency
        const freq = (this.freqMap.get(val) || 0) + 1;
        this.freqMap.set(val, freq);

        // Step 2: Add to frequency group
        if (!this.groupMap.has(freq)) {
            this.groupMap.set(freq, []);
        }
        this.groupMap.get(freq)!.push(val);

        // Step 3: Update max frequency
        this.maxFreq = Math.max(this.maxFreq, freq);
    }

    pop(): number {
        // Step 1: Get value from highest frequency group
        const group = this.groupMap.get(this.maxFreq)!;
        const val = group.pop()!;

        // Step 2: Decrement frequency
        this.freqMap.set(val, this.freqMap.get(val)! - 1);

        // Step 3: If group empty, decrease max frequency
        if (group.length === 0) {
            this.maxFreq--;
        }

        return val;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(1) for both push and pop operations
- Space Complexity: O(n) - where n is total number of elements pushed

---

### Problem 21: Minimize Deviation in Array (Hard)
**LeetCode Link**: [1675. Minimize Deviation in Array](https://leetcode.com/problems/minimize-deviation-in-array/)

**Problem Description**:
You are given an array nums of n positive integers. You can perform operations: for odd numbers, multiply by 2; for even numbers, divide by 2. The deviation is defined as the maximum difference between any two elements after some operations. Return the minimum deviation.

**Example**:
```
Input: nums = [1,2,3,4]
Output: 1
Explanation: Transform to [2,2,2,4], then [2,2,2,2] gives deviation = 0.
But we can also get [2,2,3,4] with deviation = 2-2 = 0 or 4-2 = 2, min is 1.

Input: nums = [4,1,5,20,3]
Output: 3
Explanation: [4,2,5,5,3] has deviation = 5-2 = 3
```

**Visualization**:
```
🎯 MINIMIZE DEVIATION STRATEGY 🎯

Key Insight: Make all numbers even first!
- Odd numbers: Can only increase (×2)
- Even numbers: Can only decrease (÷2)

Strategy:
1. Make all odd numbers even (×2) to maximize
2. Use MAX heap to track largest value
3. Keep dividing largest even number
4. Track minimum deviation

═══════════════════════════════════════════════════════════

Example: nums = [4, 1, 5, 20, 3]

Step 1: Convert all odd to even (multiply by 2)
   1 → 2
   5 → 10
   3 → 6
   Result: [4, 2, 10, 20, 6]

Step 2: Build max heap and track min
   Heap: [20, 10, 6, 4, 2]
   Max: 20, Min: 2
   Deviation: 20 - 2 = 18

╔═══════════════════════════════════════════════════════╗
║  Iteration Process                                    ║
╚═══════════════════════════════════════════════════════╝

Round 1:
   Pop max: 20 (even, can divide)
   Divide: 20 ÷ 2 = 10
   Heap: [10, 10, 6, 4, 2]
   Max: 10, Min: 2
   Deviation: 10 - 2 = 8  ← Better!

Round 2:
   Pop max: 10 (even, can divide)
   Divide: 10 ÷ 2 = 5
   Heap: [10, 6, 5, 4, 2]
   Max: 10, Min: 2
   Deviation: 10 - 2 = 8

Round 3:
   Pop max: 10 (even, can divide)
   Divide: 10 ÷ 2 = 5
   Heap: [6, 5, 5, 4, 2]
   Max: 6, Min: 2
   Deviation: 6 - 2 = 4  ← Better!

Round 4:
   Pop max: 6 (even, can divide)
   Divide: 6 ÷ 2 = 3
   Heap: [5, 5, 4, 3, 2]
   Max: 5, Min: 2
   Deviation: 5 - 2 = 3  ← Better! ✓

Round 5:
   Pop max: 5 (ODD, cannot divide!)
   STOP! We've reached minimum deviation.

Final Answer: 3

═══════════════════════════════════════════════════════════

Visual representation of the range shrinking:

Initial:  [2]────────────────────────[20]
          Min                          Max
          Deviation = 18

After R1: [2]───────────────[10]
          Min               Max
          Deviation = 8

After R3: [2]─────────[6]
          Min         Max
          Deviation = 4

After R4: [2]──────[5]
          Min      Max
          Deviation = 3 (Cannot improve further!)
```

**Python Solution**:
```python
import heapq

def minimumDeviation(nums: list[int]) -> int:
    """
    Strategy: Normalize and use max heap

    Key Insights:
    1. Odd numbers can only increase (×2)
    2. Even numbers can only decrease (÷2)
    3. To minimize range, normalize first: make all odd → even
    4. Then only decrease the maximum

    Visualization of the approach:

    Original: [1, 5, 3] (all odd)
    Maximized: [2, 10, 6] (all made even)

    Now we can only decrease:
    [2, 10, 6] → [2, 5, 6] (10÷2=5, now odd, stop for 10)
    [2, 5, 6] → [2, 5, 3] (6÷2=3, now odd, stop for 6)

    Deviation progression: 8 → 4 → 3
    """
    # Step 1: Make all numbers even (maximize odd numbers)
    # Use max heap (negate for Python's min heap)
    max_heap = []
    min_val = float('inf')

    for num in nums:
        # If odd, multiply by 2 to make even
        if num % 2 == 1:
            num *= 2

        heapq.heappush(max_heap, -num)
        min_val = min(min_val, num)

    # Step 2: Track minimum deviation
    min_deviation = float('inf')

    # Step 3: Keep dividing maximum until we hit an odd number
    while True:
        # Get current maximum (negate back)
        max_val = -heapq.heappop(max_heap)

        # Update minimum deviation
        min_deviation = min(min_deviation, max_val - min_val)

        # If max is odd, we can't divide further, stop
        if max_val % 2 == 1:
            break

        # Divide max by 2 and add back to heap
        max_val //= 2
        min_val = min(min_val, max_val)
        heapq.heappush(max_heap, -max_val)

    return min_deviation

# Alternative with detailed tracking:
def minimumDeviation_verbose(nums: list[int]) -> int:
    """
    Same algorithm with detailed state tracking
    """
    # Step 1: Normalize to all even
    max_heap = []
    min_val = float('inf')

    print("Normalization phase:")
    for num in nums:
        original = num
        if num % 2 == 1:
            num *= 2
        heapq.heappush(max_heap, -num)
        min_val = min(min_val, num)
        print(f"  {original} → {num}")

    print(f"\nInitial state:")
    print(f"  Heap (as array): {sorted([-x for x in max_heap], reverse=True)}")
    print(f"  Min: {min_val}, Max: {-max_heap[0]}")
    print(f"  Deviation: {-max_heap[0] - min_val}")

    min_deviation = float('inf')
    round_num = 0

    while True:
        max_val = -heapq.heappop(max_heap)
        min_deviation = min(min_deviation, max_val - min_val)

        round_num += 1
        print(f"\nRound {round_num}:")
        print(f"  Popped max: {max_val}")

        if max_val % 2 == 1:
            print(f"  Max is odd, cannot divide further!")
            break

        max_val //= 2
        min_val = min(min_val, max_val)
        heapq.heappush(max_heap, -max_val)

        print(f"  Divided to: {max_val}")
        print(f"  New min: {min_val}, New max: {-max_heap[0]}")
        print(f"  Deviation: {-max_heap[0] - min_val}")

    return min_deviation
```

**TypeScript Solution**:
```typescript
function minimumDeviation(nums: number[]): number {
    // Step 1: Make all numbers even and build max heap
    const maxHeap: number[] = [];
    let minVal = Infinity;

    for (let num of nums) {
        // If odd, make even
        if (num % 2 === 1) {
            num *= 2;
        }
        maxHeap.push(num);
        minVal = Math.min(minVal, num);
    }

    // Step 2: Track minimum deviation
    let minDeviation = Infinity;

    // Step 3: Keep dividing maximum
    while (true) {
        // Sort to get max (simulating max heap)
        maxHeap.sort((a, b) => b - a);
        const maxVal = maxHeap.shift()!;

        // Update minimum deviation
        minDeviation = Math.min(minDeviation, maxVal - minVal);

        // If max is odd, stop
        if (maxVal % 2 === 1) {
            break;
        }

        // Divide and add back
        const newVal = Math.floor(maxVal / 2);
        minVal = Math.min(minVal, newVal);
        maxHeap.push(newVal);
    }

    return minDeviation;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n log M) - where M is max value, each number can be divided log M times
- Space Complexity: O(n) - heap stores n elements

---

### Problem 22: IPO (Hard)
**LeetCode Link**: [502. IPO](https://leetcode.com/problems/ipo/)

**Problem Description**:
You are given n projects where the ith project has a pure profit profits[i] and requires capital[i] capital to start. Initially, you have w capital. When you finish a project, the profit will be added to your total capital. Pick k distinct projects to maximize your final capital.

**Example**:
```
Input: k = 2, w = 0, profits = [1,2,3], capital = [0,1,2]
Output: 4
Explanation:
Start with w=0
- Project 0 (capital=0, profit=1): w becomes 0+1=1
- Project 2 (capital=1, profit=2): w becomes 1+2=3
But we can also do:
- Project 0: w = 1
- Project 1: w = 1+2 = 3
Actually best:
- Project 0 (capital=0, profit=1): w=1
- Project 2 (capital=1, profit=2): Wait, capital requirement is 2, can't do it
- Project 1 (capital=1, profit=2): w=1+2=3
```

**Visualization**:
```
💰 IPO PROJECT SELECTION STRATEGY 💰

Input: k=2, w=0, profits=[1,2,3], capital=[0,1,2]

Projects available:
┌─────────┬──────────┬─────────┐
│ Project │ Capital  │ Profit  │
├─────────┼──────────┼─────────┤
│    0    │    0     │   1     │
│    1    │    1     │   2     │
│    2    │    2     │   3     │
└─────────┴──────────┴─────────┘

Strategy: Use TWO heaps!
1. Min heap by capital (all projects)
2. Max heap by profit (affordable projects)

═══════════════════════════════════════════════════════════

Initial State:
   Current capital: w = 0
   Projects to select: k = 2

   Capital Min Heap (all projects):
   [(0, profit=1), (1, profit=2), (2, profit=3)]

   Profit Max Heap (affordable):
   [] (empty initially)

╔═══════════════════════════════════════════════════════╗
║  Round 1: Select best affordable project             ║
╚═══════════════════════════════════════════════════════╝

Step 1: Move affordable projects to profit heap
   Current capital: 0
   From capital heap: (0, profit=1) ← affordable!

   Capital Min Heap: [(1, profit=2), (2, profit=3)]
   Profit Max Heap: [(1)] ← profit values only

Step 2: Select project with max profit
   Pop from profit heap: 1
   Complete project: w = 0 + 1 = 1

   ✓ Project 0 completed! Capital now: 1

╔═══════════════════════════════════════════════════════╗
║  Round 2: Select next best affordable project        ║
╚═══════════════════════════════════════════════════════╝

Step 1: Move affordable projects to profit heap
   Current capital: 1
   From capital heap: (1, profit=2) ← affordable!
   Not affordable: (2, profit=3) ← need capital=2

   Capital Min Heap: [(2, profit=3)]
   Profit Max Heap: [(2)]

Step 2: Select project with max profit
   Pop from profit heap: 2
   Complete project: w = 1 + 2 = 3

   ✓ Project 1 completed! Capital now: 3

═══════════════════════════════════════════════════════════

Final Result: w = 3 (after k=2 projects)

💡 Key Insight:
   - Capital heap sorted by requirement (increasing)
   - Profit heap sorted by profit (decreasing)
   - At each step, move all newly affordable projects
   - Always pick the most profitable affordable project
```

**Python Solution**:
```python
import heapq

def findMaximizedCapital(k: int, w: int, profits: list[int], capital: list[int]) -> int:
    """
    Strategy: Two heaps approach

    Key Insight:
    1. Sort projects by capital requirement (min heap)
    2. As capital grows, move affordable projects to profit heap
    3. Always pick most profitable affordable project

    Visualization:

    Capital Heap → Profit Heap → Select Best → Update Capital
         ↓              ↓             ↓              ↓
    [All projects] [Affordable]  [Max profit]   [w += profit]
    (sorted by     (sorted by     (greedy        (repeat k times)
     capital)       profit)        choice)

    This is greedy: always pick best available option!
    """
    # Step 1: Create list of (capital, profit) and sort by capital
    projects = list(zip(capital, profits))
    projects.sort()  # Sort by capital (first element of tuple)

    # Step 2: Create max heap for profits (negate for max behavior)
    profit_heap = []

    # Step 3: Index to track processed projects
    i = 0
    n = len(projects)

    # Step 4: Select k projects
    for _ in range(k):
        # Move all affordable projects to profit heap
        while i < n and projects[i][0] <= w:
            # Add profit to max heap (negate for max behavior)
            heapq.heappush(profit_heap, -projects[i][1])
            i += 1

        # If no affordable projects, stop early
        if not profit_heap:
            break

        # Select most profitable project
        max_profit = -heapq.heappop(profit_heap)
        w += max_profit

    return w

# Version with detailed tracking:
def findMaximizedCapital_verbose(k: int, w: int, profits: list[int], capital: list[int]) -> int:
    """
    Same algorithm with detailed output
    """
    projects = list(zip(capital, profits))
    projects.sort()

    profit_heap = []
    i = 0
    n = len(projects)

    print(f"Initial capital: {w}")
    print(f"Projects to select: {k}")
    print(f"Available projects (capital, profit): {projects}\n")

    for round_num in range(1, k + 1):
        print(f"Round {round_num}:")
        print(f"  Current capital: {w}")

        # Move affordable projects
        moved = []
        while i < n and projects[i][0] <= w:
            heapq.heappush(profit_heap, -projects[i][1])
            moved.append(projects[i])
            i += 1

        if moved:
            print(f"  Moved to profit heap: {moved}")

        if not profit_heap:
            print(f"  No affordable projects! Stopping.")
            break

        max_profit = -heapq.heappop(profit_heap)
        print(f"  Selected project with profit: {max_profit}")
        w += max_profit
        print(f"  New capital: {w}\n")

    return w

# Example usage:
# k=2, w=0, profits=[1,2,3], capital=[0,1,2]
# Output: 3
```

**TypeScript Solution**:
```typescript
function findMaximizedCapital(
    k: number,
    w: number,
    profits: number[],
    capital: number[]
): number {
    // Step 1: Create and sort projects by capital
    const projects: [number, number][] = capital.map((cap, i) => [cap, profits[i]]);
    projects.sort((a, b) => a[0] - b[0]);

    // Step 2: Create max heap for profits
    const profitHeap: number[] = [];

    // Step 3: Track processed projects
    let i = 0;
    const n = projects.length;

    // Step 4: Select k projects
    for (let round = 0; round < k; round++) {
        // Move affordable projects to profit heap
        while (i < n && projects[i][0] <= w) {
            profitHeap.push(projects[i][1]);
            i++;
        }

        // If no affordable projects, stop
        if (profitHeap.length === 0) {
            break;
        }

        // Sort descending to simulate max heap
        profitHeap.sort((a, b) => b - a);

        // Select most profitable
        const maxProfit = profitHeap.shift()!;
        w += maxProfit;
    }

    return w;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n + k log n) - sorting + k heap operations
- Space Complexity: O(n) - heap stores up to n projects

---

### Problem 23: Single-Threaded CPU (Medium)
**LeetCode Link**: [1834. Single-Threaded CPU](https://leetcode.com/problems/single-threaded-cpu/)

**Problem Description**:
You are given n tasks labeled from 0 to n-1 represented by a 2D array tasks, where tasks[i] = [enqueueTime, processingTime]. You have a single-threaded CPU that can process at most one task at a time. Return the order in which the CPU will process the tasks.

**Example**:
```
Input: tasks = [[1,2],[2,4],[3,2],[4,1]]
Output: [0,2,3,1]

Explanation:
Time 0: CPU idle
Time 1: Task 0 available, start processing (ends at time 3)
Time 3: Tasks 1,2 available, pick 2 (shorter processing time), start (ends at time 5)
Time 5: Task 1,3 available, pick 3 (shorter processing time), start (ends at time 6)
Time 6: Task 1 available, start (ends at time 10)
```

**Visualization**:
```
⚙️ SINGLE-THREADED CPU SCHEDULING ⚙️

Tasks: [[1,2], [2,4], [3,2], [4,1]]
       [enqueue, processing]

Timeline simulation:

╔════════════════════════════════════════════════════════════╗
║  Task Queue Strategy: Min Heap by Processing Time         ║
║  (Break ties by task index)                                ║
╚════════════════════════════════════════════════════════════╝

Time:  0  1  2  3  4  5  6  7  8  9  10
       │  │  │  │  │  │  │  │  │  │  │
Tasks: │  0  1  │  3  │  │  │  │  │  │
           ▼  ▼     ▼

CPU:   idle  ├─0─┤├─2─┤│3│├───1───┤
                  2    2  1    4

═══════════════════════════════════════════════════════════

Detailed Step-by-Step:

┌──────┬──────────────┬─────────────────┬──────────────────┐
│ Time │ Available    │ Queue (heap)    │ CPU Action       │
│      │ Tasks        │ [proc, idx]     │                  │
├──────┼──────────────┼─────────────────┼──────────────────┤
│  0   │ None         │ []              │ Idle             │
├──────┼──────────────┼─────────────────┼──────────────────┤
│  1   │ Task 0       │ [(2,0)]         │ Start Task 0     │
│      │ [1,2]        │                 │ (proc=2)         │
│      │              │                 │ Will end at t=3  │
├──────┼──────────────┼─────────────────┼──────────────────┤
│  2   │ Task 1       │ [(4,1)] (added) │ Processing...    │
│      │ [2,4]        │                 │                  │
├──────┼──────────────┼─────────────────┼──────────────────┤
│  3   │ Task 2       │ [(2,2), (4,1)]  │ Finish Task 0 ✓  │
│      │ [3,2]        │                 │ Start Task 2     │
│      │              │ ↑ Min: (2,2)    │ (proc=2)         │
│      │              │                 │ Will end at t=5  │
├──────┼──────────────┼─────────────────┼──────────────────┤
│  4   │ Task 3       │ [(1,3), (4,1)]  │ Processing...    │
│      │ [4,1]        │ (added)         │                  │
├──────┼──────────────┼─────────────────┼──────────────────┤
│  5   │ None         │ [(1,3), (4,1)]  │ Finish Task 2 ✓  │
│      │              │ ↑ Min: (1,3)    │ Start Task 3     │
│      │              │                 │ (proc=1)         │
│      │              │                 │ Will end at t=6  │
├──────┼──────────────┼─────────────────┼──────────────────┤
│  6   │ None         │ [(4,1)]         │ Finish Task 3 ✓  │
│      │              │                 │ Start Task 1     │
│      │              │                 │ (proc=4)         │
│      │              │                 │ Will end at t=10 │
├──────┼──────────────┼─────────────────┼──────────────────┤
│  10  │ None         │ []              │ Finish Task 1 ✓  │
│      │              │                 │ All done!        │
└──────┴──────────────┴─────────────────┴──────────────────┘

Processing Order: [0, 2, 3, 1] ✓

💡 Key Rules:
   1. Tasks available when: current_time >= enqueue_time
   2. Pick task with shortest processing time
   3. Ties broken by smallest index
   4. If no tasks available, jump to next enqueue time
```

**Python Solution**:
```python
import heapq

def getOrder(tasks: list[list[int]]) -> list[int]:
    """
    Strategy: Simulation with min heap

    Key Insight:
    1. Add task index to track original position
    2. Sort by enqueue time
    3. Use min heap to pick shortest processing time
    4. Simulate time progression

    Visualization of data flow:

    Input tasks → Add indices → Sort by enqueue
         ↓             ↓              ↓
    [[1,2],[2,4]] → [(1,2,0),(2,4,1)] → Sorted

    At each time:
    1. Add all available tasks to heap (enqueue_time <= current_time)
    2. Pop task with min processing time (break ties by index)
    3. Process task and advance time
    """
    # Step 1: Add original indices to tasks
    # indexed_tasks: [(enqueue_time, processing_time, original_index)]
    indexed_tasks = [(enqueue, process, i) for i, (enqueue, process) in enumerate(tasks)]

    # Step 2: Sort by enqueue time
    indexed_tasks.sort()

    # Step 3: Initialize variables
    result = []
    current_time = 0
    task_index = 0
    n = len(tasks)

    # Min heap: (processing_time, original_index)
    min_heap = []

    # Step 4: Process all tasks
    while len(result) < n:
        # Add all tasks that have arrived by current_time to heap
        while task_index < n and indexed_tasks[task_index][0] <= current_time:
            enqueue, process, orig_idx = indexed_tasks[task_index]
            # Heap by processing time, then by index
            heapq.heappush(min_heap, (process, orig_idx))
            task_index += 1

        if min_heap:
            # Process task with shortest processing time
            process_time, orig_idx = heapq.heappop(min_heap)
            result.append(orig_idx)
            current_time += process_time
        else:
            # No tasks available, jump to next task's enqueue time
            if task_index < n:
                current_time = indexed_tasks[task_index][0]

    return result

# Alternative with detailed tracking:
def getOrder_verbose(tasks: list[list[int]]) -> list[int]:
    """
    Same algorithm with detailed output
    """
    indexed_tasks = [(enqueue, process, i) for i, (enqueue, process) in enumerate(tasks)]
    indexed_tasks.sort()

    result = []
    current_time = 0
    task_index = 0
    n = len(tasks)
    min_heap = []

    print("Task Processing Simulation:\n")
    step = 0

    while len(result) < n:
        step += 1
        print(f"Step {step}:")
        print(f"  Current time: {current_time}")

        # Add available tasks
        added = []
        while task_index < n and indexed_tasks[task_index][0] <= current_time:
            enqueue, process, orig_idx = indexed_tasks[task_index]
            heapq.heappush(min_heap, (process, orig_idx))
            added.append(f"Task{orig_idx}(proc={process})")
            task_index += 1

        if added:
            print(f"  Added to queue: {', '.join(added)}")

        if min_heap:
            process_time, orig_idx = heapq.heappop(min_heap)
            result.append(orig_idx)
            print(f"  Processing: Task {orig_idx} (time={process_time})")
            current_time += process_time
            print(f"  Will finish at time: {current_time}")
        else:
            if task_index < n:
                print(f"  No tasks available, jumping to time {indexed_tasks[task_index][0]}")
                current_time = indexed_tasks[task_index][0]

        print()

    print(f"Processing order: {result}")
    return result
```

**TypeScript Solution**:
```typescript
function getOrder(tasks: number[][]): number[] {
    // Step 1: Add indices to tasks
    const indexedTasks: [number, number, number][] = tasks.map(
        ([enqueue, process], i) => [enqueue, process, i]
    );

    // Step 2: Sort by enqueue time
    indexedTasks.sort((a, b) => a[0] - b[0]);

    // Step 3: Initialize variables
    const result: number[] = [];
    let currentTime = 0;
    let taskIndex = 0;
    const n = tasks.length;

    // Min heap: [processing_time, original_index]
    const minHeap: [number, number][] = [];

    // Step 4: Process all tasks
    while (result.length < n) {
        // Add all available tasks to heap
        while (taskIndex < n && indexedTasks[taskIndex][0] <= currentTime) {
            const [enqueue, process, origIdx] = indexedTasks[taskIndex];
            minHeap.push([process, origIdx]);
            taskIndex++;
        }

        if (minHeap.length > 0) {
            // Sort to get minimum (simulate heap)
            minHeap.sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);

            // Process task with shortest processing time
            const [processTime, origIdx] = minHeap.shift()!;
            result.push(origIdx);
            currentTime += processTime;
        } else {
            // Jump to next task's enqueue time
            if (taskIndex < n) {
                currentTime = indexedTasks[taskIndex][0];
            }
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - sorting + n heap operations
- Space Complexity: O(n) - heap stores up to n tasks

---

## Practice Tips

1. **Choose the right heap**:
   - For K largest: use min heap of size K
   - For K smallest: use max heap of size K (or min heap with all elements)
   - For K most frequent: use min heap with frequency

2. **Heap size optimization**:
   - If finding K elements, maintain heap of size K (not n)
   - This reduces space from O(n) to O(k)

3. **Python heap notes**:
   - `heapq` is always min heap
   - For max heap, negate values: `heapq.heappush(heap, -value)`
   - For custom objects, use tuples: `(priority, value)`

4. **Common patterns**:
   - Top K elements: maintain heap of size K
   - Kth element: extract k times or maintain size K heap
   - Merge K lists: heap with one element from each list
   - Frequency problems: count first, then heap
   - Two heaps: for median/running statistics

5. **When not to use heap**:
   - If K is close to n, sorting might be faster
   - If you need all elements sorted (not just top K)
   - If K = 1, simple max/min is better

6. **Testing strategy**:
   - Test with K = 1
   - Test with K = array length
   - Test with all equal elements
   - Test with already sorted array
   - Test with duplicates

7. **Time complexity analysis**:
   - Heap insertion: O(log k)
   - Heap extraction: O(log k)
   - Processing n elements: O(n log k)
   - Building heap from array: O(n)
