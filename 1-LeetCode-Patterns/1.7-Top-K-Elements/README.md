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

```
Finding K=3 largest elements in [3, 1, 5, 12, 2, 11]

Using Min Heap of size K=3:

Process 3:  Heap: [3]
Process 1:  Heap: [1, 3]
Process 5:  Heap: [1, 3, 5]
Process 12: Heap: [3, 5, 12]  (removed 1, as 12 > min(1))
Process 2:  Heap: [3, 5, 12]  (2 < min(3), don't add)
Process 11: Heap: [5, 11, 12] (removed 3, as 11 > min(3))

Result: [5, 11, 12]

Key Insight:
- For K largest: use MIN heap of size K (remove smallest when heap is full)
- For K smallest: use MAX heap of size K (remove largest when heap is full)
```

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
