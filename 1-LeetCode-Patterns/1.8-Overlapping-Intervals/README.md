# Overlapping Intervals Pattern

## Pattern Overview

### What is this pattern?
The Overlapping Intervals pattern deals with problems involving intervals (ranges) that may overlap, merge, or need to be processed in a specific order. The key technique is usually sorting intervals by start time, then processing them sequentially.

### When to use it?
- Merging overlapping intervals
- Finding conflicts in schedules/meetings
- Inserting intervals into sorted list
- Finding minimum rooms/resources needed
- Checking if intervals overlap
- Problems involving ranges, schedules, or time periods

### Time/Space Complexity Benefits
- **Time Complexity**: O(n log n) - dominated by sorting
- **Space Complexity**: O(n) - for storing results or auxiliary data structures

### Visual Diagram

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    INTERVAL VISUALIZATION GUIDE                            ║
╚════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Example 1: CALENDAR VIEW - Merge Overlapping Intervals
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input: [[1,3], [2,6], [8,10], [15,18]]

Timeline (hours of the day):
0    1    2    3    4    5    6    7    8    9    10   11   12   13   14   15   16   17   18
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
     [====A====]
          [=========B=========]
                                                  [====C====]
                                                                                   [====D====]

Step-by-Step Merge Process:

STEP 1: Sort by start time (already sorted in this case)
├─ [1,3]   starts at 1
├─ [2,6]   starts at 2
├─ [8,10]  starts at 8
└─ [15,18] starts at 15

STEP 2: Start with first interval
Current Merged: [[1,3]]
Timeline:
     [====]

STEP 3: Process [2,6]
Check: Does [2,6] overlap with [1,3]?
       2 <= 3? YES! → They overlap
Merge: [1, max(3,6)] = [1,6]
Current Merged: [[1,6]]
Timeline:
     [============]

STEP 4: Process [8,10]
Check: Does [8,10] overlap with [1,6]?
       8 <= 6? NO! → No overlap
Action: Add [1,6] to result, start new interval [8,10]
Current Merged: [[1,6], [8,10]]
Timeline:
     [============]                [====]

STEP 5: Process [15,18]
Check: Does [15,18] overlap with [8,10]?
       15 <= 10? NO! → No overlap
Action: Add both to result
Final Result: [[1,6], [8,10], [15,18]]
Timeline:
     [============]                [====]                         [====]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Example 2: MEETING ROOMS - Understanding Overlap Conditions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Think of intervals as meeting times in your calendar:

Overlap Condition: [a,b] overlaps with [c,d] if: a <= d AND c <= b

CASE 1: Clear Overlap
     9am              11am
     [====Meeting A====]
               10am              12pm
               [====Meeting B====]

     Conflict! Can't attend both meetings
     Overlap region: [10am, 11am]

CASE 2: One Contains Another
     9am                        12pm
     [========Meeting A==========]
          10am      11am
          [===B===]

     Complete overlap! Meeting B is during Meeting A
     Overlap region: [10am, 11am]

CASE 3: Touching But Not Overlapping
     9am       10am
     [===A===]
               10am      11am
               [===B===]

     No conflict! B starts exactly when A ends
     Can attend both meetings back-to-back

CASE 4: Separate Meetings
     9am       10am
     [===A===]
                         11am      12pm
                         [===B===]

     No conflict! Gap between meetings
     Free time: 10am to 11am

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Example 3: CONFERENCE ROOM SCHEDULING - Minimum Rooms Needed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input: [[0,30], [5,10], [15,20]]

Building Timeline (visualizing room usage):
Time:   0    5    10   15   20   25   30
        |----|----|----|----|----|----|

Meeting 1 [0,30]:
Room A: [================================]

Meeting 2 [5,10]:
Room A: [================================]  (OCCUPIED)
Room B:      [====]                         (NEED NEW ROOM)

Meeting 3 [15,20]:
Room A: [================================]  (STILL OCCUPIED)
Room B:      [====]    [====]               (FREE - REUSE!)

Sweep Line Approach:
Time:   0     5     10    15    20    30
Event:  +1    +1    -1    +1    -1    -1
Rooms:  1     2     1     2     1     0
        ↑     ↑
        │     └─ MAXIMUM = 2 rooms needed
        └─ First meeting starts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎈 Example 4: BALLOON POPPING - Minimum Arrows
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input: [[10,16], [2,8], [1,6], [7,12]]

Imagine balloons floating on a number line:

Before sorting:
Position: 0    2    4    6    8    10   12   14   16   18
          |----|----|----|----|----|----|----|----|----|----|
               [====Balloon 2====]
          [==Balloon 3==]
                         [==Balloon 4===]
                                   [====Balloon 1====]

After sorting by END position:
Sorted: [[1,6], [2,8], [7,12], [10,16]]

Position: 0    2    4    6    8    10   12   14   16   18
          |----|----|----|----|----|----|----|----|----|----|
          [==Balloon A==]
               [==Balloon B===]
                         [==Balloon C===]
                                   [==Balloon D====]

Greedy Strategy (shoot at end of each group):

Arrow 1 at position 6:
          [==Balloon A==]💥
               [==Balloon B===]💥  (BOTH POP!)

Arrow 2 at position 12:
                         [==Balloon C===]💥
                                   [==Balloon D====]💥  (BOTH POP!)

Result: 2 arrows needed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Example 5: INSERT INTERVAL - Three-Phase Approach
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Input: intervals = [[1,2], [3,5], [6,7], [8,10], [12,16]]
       newInterval = [4,8]

Original Timeline:
0    1    2    3    4    5    6    7    8    9    10   11   12   13   14   15   16
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
     [=A=]    [===B===]    [=C=]    [===D===]         [======E======]

New Interval to Insert:
               [===========NEW===========]

PHASE 1: Add all intervals BEFORE new interval
├─ [1,2] ends at 2, new starts at 4 → BEFORE (add to result)
│  Result: [[1,2]]
│
└─ [3,5] ends at 5, new starts at 4 → OVERLAPS (move to Phase 2)

PHASE 2: MERGE all overlapping intervals
├─ [3,5] overlaps with [4,8]
│  Merged: [min(3,4), max(5,8)] = [3,8]
│
├─ [6,7] starts at 6, merged ends at 8 → OVERLAPS
│  Merged: [min(3,6), max(8,7)] = [3,8]
│
└─ [8,10] starts at 8, merged ends at 8 → OVERLAPS
   Merged: [min(3,8), max(8,10)] = [3,10]
   Result: [[1,2], [3,10]]

PHASE 3: Add remaining intervals AFTER merged interval
└─ [12,16] starts at 12, merged ends at 10 → AFTER (add to result)
   Final Result: [[1,2], [3,10], [12,16]]

After Insertion Timeline:
0    1    2    3    4    5    6    7    8    9    10   11   12   13   14   15   16
|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|
     [=A=]    [===================MERGED==================]    [======E======]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Example 6: INTERVAL INTERSECTION - Two Pointer Technique
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

List A: [[0,2], [5,10], [13,23], [24,25]]
List B: [[1,5], [8,12], [15,24], [25,26]]

Think of this as two people's busy schedules - find when BOTH are busy:

Person A's Schedule:
Hour:   0    2    4    6    8    10   12   14   16   18   20   22   24   26
        |----|----|----|----|----|----|----|----|----|----|----|----|----|----|
        [=A1=]         [====A2====]              [=======A3=======]    [A4]

Person B's Schedule:
        [===B1===]                [===B2===]         [========B3========][B4]

Finding Common Busy Times:
Step 1: Compare A1[0,2] with B1[1,5]
        Intersection: [max(0,1), min(2,5)] = [1,2] ✓
        [=A1=]
        [===B1===]
         [X]  ← overlap region
        Move A1 (ends first at 2)

Step 2: Compare A2[5,10] with B1[1,5]
        Intersection: [max(5,1), min(10,5)] = [5,5] ✓
        Move B1 (ends first at 5)

Step 3: Compare A2[5,10] with B2[8,12]
        Intersection: [max(5,8), min(10,12)] = [8,10] ✓
                 [====A2====]
                          [===B2===]
                          [XX]  ← overlap
        Move A2 (ends first at 10)

Step 4: Compare A3[13,23] with B2[8,12]
        No intersection (13 > 12)
        Move B2

Step 5: Compare A3[13,23] with B3[15,24]
        Intersection: [max(13,15), min(23,24)] = [15,23] ✓
        Move A3

Step 6: Compare A4[24,25] with B3[15,24]
        Intersection: [max(24,15), min(25,24)] = [24,24] ✓
        Move B3

Step 7: Compare A4[24,25] with B4[25,26]
        Intersection: [max(24,25), min(25,26)] = [25,25] ✓
        Done!

Result: [[1,2], [5,5], [8,10], [15,23], [24,24], [25,25]]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 KEY FORMULAS FOR INTERVALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Given two intervals [a,b] and [c,d]:

1. OVERLAP CHECK:
   ✓ Overlaps if: a <= d AND c <= b
   ✗ No overlap if: b < c OR d < a

2. INTERSECTION (overlap region):
   start = max(a, c)
   end = min(b, d)
   Valid if: start <= end

3. UNION (merge):
   start = min(a, c)
   end = max(b, d)

4. VISUAL OVERLAP CASES:

   Case A: Partial Overlap        Case B: Complete Containment
   [====a====]                     [========a========]
        [====c====]                    [===c===]

   Case C: Touch (not overlap)    Case D: Separate
   [==a==][==c==]                 [==a==]    [==c==]

   Case E: Same Start             Case F: Same End
   [======a======]                [======a======]
   [==c==]                                [==c==]
```

## Recognition Guidelines

### How to identify this pattern in interview questions?
Look for these indicators:
- Problem mentions "intervals", "ranges", or "time periods"
- Need to merge overlapping intervals
- Schedule/calendar problems (meetings, rooms)
- Finding conflicts or free time
- Insert interval into sorted list
- Count minimum resources needed
- Any problem with start and end times

### Key Phrases/Indicators
- "Merge intervals"
- "Overlapping intervals"
- "Meeting rooms"
- "Insert interval"
- "Non-overlapping intervals"
- "Minimum number of arrows/platforms"
- "Employee free time"
- "Schedule"
- "Book appointments"

## Template/Pseudocode

### Merge Intervals Template
```python
def merge_intervals(intervals):
    # Step 1: Sort intervals by start time
    intervals.sort(key=lambda x: x[0])

    # Step 2: Initialize result with first interval
    merged = [intervals[0]]

    # Step 3: Process each interval
    for current in intervals[1:]:
        last_merged = merged[-1]

        # Check if current overlaps with last merged interval
        if current[0] <= last_merged[1]:
            # Merge: extend the end time
            last_merged[1] = max(last_merged[1], current[1])
        else:
            # No overlap: add current interval
            merged.append(current)

    return merged
```

### Insert Interval Template
```python
def insert_interval(intervals, new_interval):
    result = []
    i = 0
    n = len(intervals)

    # Add all intervals before new_interval
    while i < n and intervals[i][1] < new_interval[0]:
        result.append(intervals[i])
        i += 1

    # Merge overlapping intervals
    while i < n and intervals[i][0] <= new_interval[1]:
        new_interval[0] = min(new_interval[0], intervals[i][0])
        new_interval[1] = max(new_interval[1], intervals[i][1])
        i += 1
    result.append(new_interval)

    # Add remaining intervals
    while i < n:
        result.append(intervals[i])
        i += 1

    return result
```

## Problems

### Problem 1: Merge Intervals (Medium)
**LeetCode Link**: [56. Merge Intervals](https://leetcode.com/problems/merge-intervals/)

**Problem Description**:
Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals.

**Example**:
```
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: [1,3] and [2,6] overlap, merge to [1,6]
```

**Python Solution**:
```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    # Step 1: Sort intervals by start time
    intervals.sort(key=lambda x: x[0])

    # Step 2: Initialize result with first interval
    merged = [intervals[0]]

    # Step 3: Process each interval starting from second
    for current in intervals[1:]:
        # Get the last merged interval
        last_merged = merged[-1]

        # Step 4: Check if current interval overlaps with last merged
        if current[0] <= last_merged[1]:
            # Overlaps: merge by extending end time to max of both
            last_merged[1] = max(last_merged[1], current[1])
        else:
            # No overlap: add current interval to result
            merged.append(current)

    return merged
```

**TypeScript Solution**:
```typescript
function merge(intervals: number[][]): number[][] {
    // Step 1: Sort intervals by start time
    intervals.sort((a, b) => a[0] - b[0]);

    // Step 2: Initialize result with first interval
    const merged: number[][] = [intervals[0]];

    // Step 3: Process each interval starting from second
    for (let i = 1; i < intervals.length; i++) {
        const current = intervals[i];
        const lastMerged = merged[merged.length - 1];

        // Step 4: Check if current interval overlaps with last merged
        if (current[0] <= lastMerged[1]) {
            // Overlaps: merge by extending end time to max of both
            lastMerged[1] = Math.max(lastMerged[1], current[1]);
        } else {
            // No overlap: add current interval to result
            merged.push(current);
        }
    }

    return merged;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - sorting dominates
- Space Complexity: O(n) - for the result array

---

### Problem 2: Insert Interval (Medium)
**LeetCode Link**: [57. Insert Interval](https://leetcode.com/problems/insert-interval/)

**Problem Description**:
You are given an array of non-overlapping intervals where intervals[i] = [starti, endi] represent the start and end of the ith interval and intervals is sorted in ascending order by starti. Insert newInterval and merge if necessary.

**Example**:
```
Input: intervals = [[1,3],[6,9]], newInterval = [2,5]
Output: [[1,5],[6,9]]
```

**Python Solution**:
```python
def insert(intervals: list[list[int]], newInterval: list[int]) -> list[list[int]]:
    result = []
    i = 0
    n = len(intervals)

    # Step 1: Add all intervals that come before newInterval (no overlap)
    while i < n and intervals[i][1] < newInterval[0]:
        result.append(intervals[i])
        i += 1

    # Step 2: Merge all overlapping intervals with newInterval
    while i < n and intervals[i][0] <= newInterval[1]:
        # Expand newInterval to include current interval
        newInterval[0] = min(newInterval[0], intervals[i][0])
        newInterval[1] = max(newInterval[1], intervals[i][1])
        i += 1

    # Add the merged interval
    result.append(newInterval)

    # Step 3: Add all remaining intervals
    while i < n:
        result.append(intervals[i])
        i += 1

    return result
```

**TypeScript Solution**:
```typescript
function insert(intervals: number[][], newInterval: number[]): number[][] {
    const result: number[][] = [];
    let i = 0;
    const n = intervals.length;

    // Step 1: Add all intervals that come before newInterval (no overlap)
    while (i < n && intervals[i][1] < newInterval[0]) {
        result.push(intervals[i]);
        i++;
    }

    // Step 2: Merge all overlapping intervals with newInterval
    while (i < n && intervals[i][0] <= newInterval[1]) {
        // Expand newInterval to include current interval
        newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
        newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
        i++;
    }

    // Add the merged interval
    result.push(newInterval);

    // Step 3: Add all remaining intervals
    while (i < n) {
        result.push(intervals[i]);
        i++;
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass through intervals
- Space Complexity: O(n) - for result array

---

### Problem 3: Non-overlapping Intervals (Medium)
**LeetCode Link**: [435. Non-overlapping Intervals](https://leetcode.com/problems/non-overlapping-intervals/)

**Problem Description**:
Given an array of intervals, find the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.

**Example**:
```
Input: intervals = [[1,2],[2,3],[3,4],[1,3]]
Output: 1
Explanation: Remove [1,3] to make rest non-overlapping
```

**Python Solution**:
```python
def eraseOverlapIntervals(intervals: list[list[int]]) -> int:
    # Step 1: Sort intervals by end time
    # Greedy approach: keep interval that ends earliest
    intervals.sort(key=lambda x: x[1])

    # Step 2: Track the end of last kept interval
    prev_end = intervals[0][1]
    removed = 0

    # Step 3: Process each interval starting from second
    for i in range(1, len(intervals)):
        # Step 4: Check if current interval overlaps with last kept interval
        if intervals[i][0] < prev_end:
            # Overlaps: remove this interval (increment counter)
            removed += 1
        else:
            # No overlap: keep this interval, update prev_end
            prev_end = intervals[i][1]

    return removed
```

**TypeScript Solution**:
```typescript
function eraseOverlapIntervals(intervals: number[][]): number {
    // Step 1: Sort intervals by end time
    intervals.sort((a, b) => a[1] - b[1]);

    // Step 2: Track the end of last kept interval
    let prevEnd = intervals[0][1];
    let removed = 0;

    // Step 3: Process each interval starting from second
    for (let i = 1; i < intervals.length; i++) {
        // Step 4: Check if current interval overlaps with last kept interval
        if (intervals[i][0] < prevEnd) {
            // Overlaps: remove this interval (increment counter)
            removed++;
        } else {
            // No overlap: keep this interval, update prevEnd
            prevEnd = intervals[i][1];
        }
    }

    return removed;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(1) - only using variables

---

### Problem 4: Meeting Rooms (Easy)
**LeetCode Link**: [252. Meeting Rooms](https://leetcode.com/problems/meeting-rooms/) (Premium)

**Problem Description**:
Given an array of meeting time intervals where intervals[i] = [starti, endi], determine if a person could attend all meetings.

**Example**:
```
Input: intervals = [[0,30],[5,10],[15,20]]
Output: false
Explanation: [0,30] overlaps with [5,10] and [15,20]
```

**Python Solution**:
```python
def canAttendMeetings(intervals: list[list[int]]) -> bool:
    # Step 1: Sort meetings by start time
    intervals.sort(key=lambda x: x[0])

    # Step 2: Check each consecutive pair for overlap
    for i in range(len(intervals) - 1):
        # Step 3: If current meeting ends after next meeting starts, overlap!
        if intervals[i][1] > intervals[i + 1][0]:
            return False

    # Step 4: No overlaps found
    return True
```

**TypeScript Solution**:
```typescript
function canAttendMeetings(intervals: number[][]): boolean {
    // Step 1: Sort meetings by start time
    intervals.sort((a, b) => a[0] - b[0]);

    // Step 2: Check each consecutive pair for overlap
    for (let i = 0; i < intervals.length - 1; i++) {
        // Step 3: If current meeting ends after next meeting starts, overlap!
        if (intervals[i][1] > intervals[i + 1][0]) {
            return false;
        }
    }

    // Step 4: No overlaps found
    return true;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(1) - only using variables

---

### Problem 5: Meeting Rooms II (Medium)
**LeetCode Link**: [253. Meeting Rooms II](https://leetcode.com/problems/meeting-rooms-ii/) (Premium)

**Problem Description**:
Given an array of meeting time intervals, return the minimum number of conference rooms required.

**Example**:
```
Input: intervals = [[0,30],[5,10],[15,20]]
Output: 2
Explanation: Need 2 rooms at time 5-10 and 15-20 (both overlap with [0,30])
```

**Python Solution**:
```python
import heapq

def minMeetingRooms(intervals: list[list[int]]) -> int:
    # Step 1: Sort meetings by start time
    intervals.sort(key=lambda x: x[0])

    # Step 2: Min heap to track end times of ongoing meetings
    # Heap stores end times of meetings currently using rooms
    heap = []

    # Step 3: Process each meeting
    for start, end in intervals:
        # Step 4: If earliest ending meeting has finished, free up that room
        if heap and heap[0] <= start:
            heapq.heappop(heap)

        # Step 5: Allocate room for current meeting
        heapq.heappush(heap, end)

    # Step 6: Number of rooms needed = size of heap
    # (number of ongoing meetings at peak time)
    return len(heap)
```

**TypeScript Solution**:
```typescript
function minMeetingRooms(intervals: number[][]): number {
    // Step 1: Create separate arrays for start and end times
    const starts: number[] = intervals.map(i => i[0]).sort((a, b) => a - b);
    const ends: number[] = intervals.map(i => i[1]).sort((a, b) => a - b);

    // Step 2: Two pointers to track starts and ends
    let rooms = 0;
    let maxRooms = 0;
    let startPtr = 0;
    let endPtr = 0;

    // Step 3: Process all events
    while (startPtr < starts.length) {
        // Step 4: If a meeting starts before earliest ongoing meeting ends
        if (starts[startPtr] < ends[endPtr]) {
            // Need a new room
            rooms++;
            startPtr++;
        } else {
            // A meeting ended, room freed up
            rooms--;
            endPtr++;
        }

        // Track maximum rooms needed
        maxRooms = Math.max(maxRooms, rooms);
    }

    return maxRooms;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(n) - for heap or arrays

---

### Problem 6: Interval List Intersections (Medium)
**LeetCode Link**: [986. Interval List Intersections](https://leetcode.com/problems/interval-list-intersections/)

**Problem Description**:
You are given two lists of closed intervals, firstList and secondList. Return the intersection of these two interval lists.

**Example**:
```
Input: firstList = [[0,2],[5,10],[13,23],[24,25]],
       secondList = [[1,5],[8,12],[15,24],[25,26]]
Output: [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]
```

**Python Solution**:
```python
def intervalIntersection(firstList: list[list[int]], secondList: list[list[int]]) -> list[list[int]]:
    result = []
    i, j = 0, 0

    # Step 1: Use two pointers to traverse both lists
    while i < len(firstList) and j < len(secondList):
        # Step 2: Get current intervals
        start1, end1 = firstList[i]
        start2, end2 = secondList[j]

        # Step 3: Find intersection
        # Intersection start is max of both starts
        # Intersection end is min of both ends
        inter_start = max(start1, start2)
        inter_end = min(end1, end2)

        # Step 4: If intersection is valid, add to result
        if inter_start <= inter_end:
            result.append([inter_start, inter_end])

        # Step 5: Move pointer of interval that ends first
        if end1 < end2:
            i += 1
        else:
            j += 1

    return result
```

**TypeScript Solution**:
```typescript
function intervalIntersection(firstList: number[][], secondList: number[][]): number[][] {
    const result: number[][] = [];
    let i = 0, j = 0;

    // Step 1: Use two pointers to traverse both lists
    while (i < firstList.length && j < secondList.length) {
        // Step 2: Get current intervals
        const [start1, end1] = firstList[i];
        const [start2, end2] = secondList[j];

        // Step 3: Find intersection
        const interStart = Math.max(start1, start2);
        const interEnd = Math.min(end1, end2);

        // Step 4: If intersection is valid, add to result
        if (interStart <= interEnd) {
            result.push([interStart, interEnd]);
        }

        // Step 5: Move pointer of interval that ends first
        if (end1 < end2) {
            i++;
        } else {
            j++;
        }
    }

    return result;
}
```

**Complexity Analysis**:
- Time Complexity: O(m + n) - where m and n are lengths of the two lists
- Space Complexity: O(1) - excluding output array

---

### Problem 7: Minimum Number of Arrows to Burst Balloons (Medium)
**LeetCode Link**: [452. Minimum Number of Arrows to Burst Balloons](https://leetcode.com/problems/minimum-number-of-arrows-to-burst-balloons/)

**Problem Description**:
Given an array of balloons where points[i] = [xstart, xend], find the minimum number of arrows that must be shot to burst all balloons.

**Example**:
```
Input: points = [[10,16],[2,8],[1,6],[7,12]]
Output: 2
Explanation: Shoot arrows at x=6 and x=11
```

**Python Solution**:
```python
def findMinArrowShots(points: list[list[int]]) -> int:
    # Step 1: Sort balloons by end position
    points.sort(key=lambda x: x[1])

    # Step 2: Initialize arrows count and position of first arrow
    arrows = 1
    arrow_pos = points[0][1]

    # Step 3: Process each balloon
    for start, end in points[1:]:
        # Step 4: If current balloon starts after arrow position
        # need a new arrow
        if start > arrow_pos:
            arrows += 1
            arrow_pos = end  # Shoot arrow at end of current balloon

    return arrows
```

**TypeScript Solution**:
```typescript
function findMinArrowShots(points: number[][]): number {
    // Step 1: Sort balloons by end position
    points.sort((a, b) => a[1] - b[1]);

    // Step 2: Initialize arrows count and position of first arrow
    let arrows = 1;
    let arrowPos = points[0][1];

    // Step 3: Process each balloon
    for (let i = 1; i < points.length; i++) {
        const [start, end] = points[i];

        // Step 4: If current balloon starts after arrow position
        // need a new arrow
        if (start > arrowPos) {
            arrows++;
            arrowPos = end;  // Shoot arrow at end of current balloon
        }
    }

    return arrows;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(1) - only using variables

---

### Problem 8: Employee Free Time (Hard)
**LeetCode Link**: [759. Employee Free Time](https://leetcode.com/problems/employee-free-time/) (Premium)

**Problem Description**:
Given a list of employees' schedules (list of intervals), return the list of finite intervals representing common free time for all employees.

**Example**:
```
Input: schedule = [[[1,2],[5,6]],[[1,3]],[[4,10]]]
Output: [[3,4]]
Explanation: All employees are free between 3 and 4
```

**Python Solution**:
```python
def employeeFreeTime(schedule: list[list[list[int]]]) -> list[list[int]]:
    # Step 1: Flatten all intervals into a single list
    all_intervals = []
    for employee in schedule:
        for interval in employee:
            all_intervals.append(interval)

    # Step 2: Sort all intervals by start time
    all_intervals.sort(key=lambda x: x[0])

    # Step 3: Merge overlapping intervals to find busy times
    merged = [all_intervals[0]]
    for current in all_intervals[1:]:
        last = merged[-1]
        if current[0] <= last[1]:
            last[1] = max(last[1], current[1])
        else:
            merged.append(current)

    # Step 4: Find gaps between merged intervals (free times)
    free_time = []
    for i in range(len(merged) - 1):
        # Gap between end of current and start of next
        free_time.append([merged[i][1], merged[i + 1][0]])

    return free_time
```

**TypeScript Solution**:
```typescript
function employeeFreeTime(schedule: number[][][]): number[][] {
    // Step 1: Flatten all intervals into a single list
    const allIntervals: number[][] = [];
    for (const employee of schedule) {
        for (const interval of employee) {
            allIntervals.push(interval);
        }
    }

    // Step 2: Sort all intervals by start time
    allIntervals.sort((a, b) => a[0] - b[0]);

    // Step 3: Merge overlapping intervals to find busy times
    const merged: number[][] = [allIntervals[0]];
    for (let i = 1; i < allIntervals.length; i++) {
        const current = allIntervals[i];
        const last = merged[merged.length - 1];
        if (current[0] <= last[1]) {
            last[1] = Math.max(last[1], current[1]);
        } else {
            merged.push(current);
        }
    }

    // Step 4: Find gaps between merged intervals (free times)
    const freeTime: number[][] = [];
    for (let i = 0; i < merged.length - 1; i++) {
        freeTime.push([merged[i][1], merged[i + 1][0]]);
    }

    return freeTime;
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - where n is total number of intervals
- Space Complexity: O(n) - for storing flattened intervals

---

### Problem 9: My Calendar I (Medium)
**LeetCode Link**: [729. My Calendar I](https://leetcode.com/problems/my-calendar-i/)

**Problem Description**:
Implement a MyCalendar class to store your events. A new event can be added if it doesn't cause a double booking.

**Example**:
```
Input: ["MyCalendar", "book", "book", "book"]
       [[], [10, 20], [15, 25], [20, 30]]
Output: [null, true, false, true]
```

**Python Solution**:
```python
class MyCalendar:
    def __init__(self):
        # Step 1: Initialize list to store booked intervals
        self.bookings = []

    def book(self, start: int, end: int) -> bool:
        # Step 2: Check if new event overlaps with any existing booking
        for s, e in self.bookings:
            # Two intervals [start, end) and [s, e) overlap if:
            # start < e AND s < end
            if start < e and s < end:
                return False

        # Step 3: No overlap found, add the booking
        self.bookings.append((start, end))
        return True
```

**TypeScript Solution**:
```typescript
class MyCalendar {
    private bookings: [number, number][];

    constructor() {
        // Step 1: Initialize array to store booked intervals
        this.bookings = [];
    }

    book(start: number, end: number): boolean {
        // Step 2: Check if new event overlaps with any existing booking
        for (const [s, e] of this.bookings) {
            // Two intervals [start, end) and [s, e) overlap if:
            // start < e AND s < end
            if (start < e && s < end) {
                return false;
            }
        }

        // Step 3: No overlap found, add the booking
        this.bookings.push([start, end]);
        return true;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(n) per book operation - checking all existing bookings
- Space Complexity: O(n) - storing n bookings

---

### Problem 10: My Calendar II (Medium)
**LeetCode Link**: [731. My Calendar II](https://leetcode.com/problems/my-calendar-ii/)

**Problem Description**:
Implement a MyCalendarTwo class to store events. A new event can be added if it doesn't cause a triple booking.

**Example**:
```
Input: ["MyCalendarTwo", "book", "book", "book", "book", "book", "book"]
       [[], [10,20], [50,60], [10,40], [5,15], [5,10], [25,55]]
Output: [null, true, true, true, false, true, true]
```

**Python Solution**:
```python
class MyCalendarTwo:
    def __init__(self):
        # Step 1: Track single bookings and double bookings
        self.bookings = []
        self.overlaps = []  # Double booked intervals

    def book(self, start: int, end: int) -> bool:
        # Step 2: Check if new event would create triple booking
        # (overlaps with any double booking)
        for s, e in self.overlaps:
            if start < e and s < end:
                return False  # Would create triple booking

        # Step 3: Add overlaps with existing bookings to overlaps list
        for s, e in self.bookings:
            if start < e and s < end:
                # Calculate overlap and add to double bookings
                overlap_start = max(start, s)
                overlap_end = min(end, e)
                self.overlaps.append((overlap_start, overlap_end))

        # Step 4: Add to bookings
        self.bookings.append((start, end))
        return True
```

**TypeScript Solution**:
```typescript
class MyCalendarTwo {
    private bookings: [number, number][];
    private overlaps: [number, number][];

    constructor() {
        // Step 1: Track single bookings and double bookings
        this.bookings = [];
        this.overlaps = [];
    }

    book(start: number, end: number): boolean {
        // Step 2: Check if new event would create triple booking
        for (const [s, e] of this.overlaps) {
            if (start < e && s < end) {
                return false;  // Would create triple booking
            }
        }

        // Step 3: Add overlaps with existing bookings to overlaps list
        for (const [s, e] of this.bookings) {
            if (start < e && s < end) {
                const overlapStart = Math.max(start, s);
                const overlapEnd = Math.min(end, e);
                this.overlaps.push([overlapStart, overlapEnd]);
            }
        }

        // Step 4: Add to bookings
        this.bookings.push([start, end]);
        return true;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(n) per book operation
- Space Complexity: O(n) - for bookings and overlaps

---

### Problem 11: Data Stream as Disjoint Intervals (Hard)
**LeetCode Link**: [352. Data Stream as Disjoint Intervals](https://leetcode.com/problems/data-stream-as-disjoint-intervals/)

**Problem Description**:
Given a data stream of integers, implement a class that maintains intervals of consecutive integers.

**Example**:
```
Input: ["SummaryRanges", "addNum", "getIntervals", "addNum", "getIntervals", "addNum"]
       [[], [1], [], [3], [], [7]]
Output: [null, null, [[1,1]], null, [[1,1],[3,3]], null]
```

**Python Solution**:
```python
class SummaryRanges:
    def __init__(self):
        # Step 1: Use list to store disjoint intervals
        self.intervals = []

    def addNum(self, value: int) -> None:
        # Step 2: Find position to insert/merge
        new_interval = [value, value]
        merged = []
        i = 0

        # Add all intervals before new value
        while i < len(self.intervals) and self.intervals[i][1] < value - 1:
            merged.append(self.intervals[i])
            i += 1

        # Merge overlapping or adjacent intervals
        while i < len(self.intervals) and self.intervals[i][0] <= value + 1:
            new_interval[0] = min(new_interval[0], self.intervals[i][0])
            new_interval[1] = max(new_interval[1], self.intervals[i][1])
            i += 1

        merged.append(new_interval)

        # Add remaining intervals
        while i < len(self.intervals):
            merged.append(self.intervals[i])
            i += 1

        self.intervals = merged

    def getIntervals(self) -> list[list[int]]:
        # Step 3: Return current intervals
        return self.intervals
```

**TypeScript Solution**:
```typescript
class SummaryRanges {
    private intervals: number[][];

    constructor() {
        this.intervals = [];
    }

    addNum(value: number): void {
        const newInterval = [value, value];
        const merged: number[][] = [];
        let i = 0;

        // Add all intervals before new value
        while (i < this.intervals.length && this.intervals[i][1] < value - 1) {
            merged.push(this.intervals[i]);
            i++;
        }

        // Merge overlapping or adjacent intervals
        while (i < this.intervals.length && this.intervals[i][0] <= value + 1) {
            newInterval[0] = Math.min(newInterval[0], this.intervals[i][0]);
            newInterval[1] = Math.max(newInterval[1], this.intervals[i][1]);
            i++;
        }

        merged.push(newInterval);

        // Add remaining intervals
        while (i < this.intervals.length) {
            merged.push(this.intervals[i]);
            i++;
        }

        this.intervals = merged;
    }

    getIntervals(): number[][] {
        return this.intervals;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(n) per addNum operation
- Space Complexity: O(n) - storing intervals

---

### Problem 12: Range Module (Hard)
**LeetCode Link**: [715. Range Module](https://leetcode.com/problems/range-module/)

**Problem Description**:
Design a data structure to track ranges of numbers. Implement addRange, queryRange, and removeRange.

**Example**:
```
Input: ["RangeModule", "addRange", "removeRange", "queryRange", "queryRange"]
       [[], [10, 20], [14, 16], [10, 14], [13, 15]]
Output: [null, null, null, true, false]
```

**Python Solution**:
```python
class RangeModule:
    def __init__(self):
        # Step 1: Store intervals as list of [start, end]
        self.intervals = []

    def addRange(self, left: int, right: int) -> None:
        # Step 2: Merge new range with existing ranges
        result = []
        i = 0

        # Add intervals before new range
        while i < len(self.intervals) and self.intervals[i][1] < left:
            result.append(self.intervals[i])
            i += 1

        # Merge overlapping intervals
        while i < len(self.intervals) and self.intervals[i][0] <= right:
            left = min(left, self.intervals[i][0])
            right = max(right, self.intervals[i][1])
            i += 1

        result.append([left, right])

        # Add remaining intervals
        while i < len(self.intervals):
            result.append(self.intervals[i])
            i += 1

        self.intervals = result

    def queryRange(self, left: int, right: int) -> bool:
        # Step 3: Check if [left, right) is completely covered
        for start, end in self.intervals:
            if start <= left and right <= end:
                return True
        return False

    def removeRange(self, left: int, right: int) -> None:
        # Step 4: Remove [left, right) from existing ranges
        result = []

        for start, end in self.intervals:
            # If no overlap, keep interval
            if end <= left or start >= right:
                result.append([start, end])
            else:
                # Partial overlap - keep non-overlapping parts
                if start < left:
                    result.append([start, left])
                if right < end:
                    result.append([right, end])

        self.intervals = result
```

**TypeScript Solution**:
```typescript
class RangeModule {
    private intervals: number[][];

    constructor() {
        this.intervals = [];
    }

    addRange(left: number, right: number): void {
        const result: number[][] = [];
        let i = 0;

        // Add intervals before new range
        while (i < this.intervals.length && this.intervals[i][1] < left) {
            result.push(this.intervals[i]);
            i++;
        }

        // Merge overlapping intervals
        while (i < this.intervals.length && this.intervals[i][0] <= right) {
            left = Math.min(left, this.intervals[i][0]);
            right = Math.max(right, this.intervals[i][1]);
            i++;
        }

        result.push([left, right]);

        // Add remaining intervals
        while (i < this.intervals.length) {
            result.push(this.intervals[i]);
            i++;
        }

        this.intervals = result;
    }

    queryRange(left: number, right: number): boolean {
        for (const [start, end] of this.intervals) {
            if (start <= left && right <= end) {
                return true;
            }
        }
        return false;
    }

    removeRange(left: number, right: number): void {
        const result: number[][] = [];

        for (const [start, end] of this.intervals) {
            if (end <= left || start >= right) {
                result.push([start, end]);
            } else {
                if (start < left) {
                    result.push([start, left]);
                }
                if (right < end) {
                    result.push([right, end]);
                }
            }
        }

        this.intervals = result;
    }
}
```

**Complexity Analysis**:
- Time Complexity: O(n) for each operation
- Space Complexity: O(n) - for storing intervals

---

### Problem 13: Maximum Profit in Job Scheduling (Hard)
**LeetCode Link**: [1235. Maximum Profit in Job Scheduling](https://leetcode.com/problems/maximum-profit-in-job-scheduling/)

**Problem Description**:
Given startTime, endTime, and profit arrays for jobs, find the maximum profit such that chosen jobs don't overlap.

**Example**:
```
Input: startTime = [1,2,3,3], endTime = [3,4,5,6], profit = [50,10,40,70]
Output: 120
Explanation: Choose job 1 (profit 50) and job 4 (profit 70)
```

**Python Solution**:
```python
import bisect

def jobScheduling(startTime: list[int], endTime: list[int], profit: list[int]) -> int:
    # Step 1: Combine and sort jobs by end time
    jobs = sorted(zip(endTime, startTime, profit))

    # Step 2: DP array where dp[i] = (end_time, max_profit)
    dp = [[0, 0]]  # Base case: no jobs

    # Step 3: Process each job
    for end, start, p in jobs:
        # Step 4: Binary search for latest job that doesn't overlap
        # Find job with end_time <= current start_time
        i = bisect.bisect_right(dp, [start, float('inf')]) - 1

        # Step 5: Calculate profit if we take current job
        # max_profit_before + current_profit
        profit_with_current = dp[i][1] + p

        # Step 6: Compare with not taking current job
        if profit_with_current > dp[-1][1]:
            dp.append([end, profit_with_current])

    # Step 7: Return maximum profit
    return dp[-1][1]
```

**TypeScript Solution**:
```typescript
function jobScheduling(startTime: number[], endTime: number[], profit: number[]): number {
    // Step 1: Combine and sort jobs by end time
    const jobs: [number, number, number][] = [];
    for (let i = 0; i < startTime.length; i++) {
        jobs.push([endTime[i], startTime[i], profit[i]]);
    }
    jobs.sort((a, b) => a[0] - b[0]);

    // Step 2: DP array where dp[i] = [end_time, max_profit]
    const dp: [number, number][] = [[0, 0]];

    // Step 3: Process each job
    for (const [end, start, p] of jobs) {
        // Step 4: Binary search for latest non-overlapping job
        let left = 0, right = dp.length - 1;
        while (left < right) {
            const mid = Math.ceil((left + right) / 2);
            if (dp[mid][0] <= start) {
                left = mid;
            } else {
                right = mid - 1;
            }
        }

        // Step 5: Calculate profit with current job
        const profitWithCurrent = dp[left][1] + p;

        // Step 6: Update if better
        if (profitWithCurrent > dp[dp.length - 1][1]) {
            dp.push([end, profitWithCurrent]);
        }
    }

    // Step 7: Return maximum profit
    return dp[dp.length - 1][1];
}
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - sorting and binary searches
- Space Complexity: O(n) - for DP array

---

### Problem 14: Remove Covered Intervals (Medium)
**LeetCode Link**: [1288. Remove Covered Intervals](https://leetcode.com/problems/remove-covered-intervals/)

**Problem Description**:
Given an array of intervals where intervals[i] = [li, ri], remove all intervals that are covered by another interval in the list. An interval [a,b] is covered by [c,d] if c <= a and b <= d.

**Example**:
```
Input: intervals = [[1,4],[3,6],[2,8]]
Output: 2
Explanation: [1,4] is covered by [2,8], so remove it. Result has 2 intervals.

Visual:
Timeline: 1    2    3    4    5    6    7    8
          [====1====]
               [=====3=====]
          [===========2===========]

After removing covered intervals:
          [===========2===========]
               [=====3=====]
```

**Python Solution**:
```python
def removeCoveredIntervals(intervals: list[list[int]]) -> int:
    """
    Strategy: Sort intervals and use greedy approach to track coverage

    Visualization of the process:
    Input: [[1,4],[3,6],[2,8]]

    After sorting by start (ascending), then by end (descending):
    [[1,4],[2,8],[3,6]]

    Timeline walk:
    Step 1: [1,4] - first interval, set as current_end = 4, count = 1
    Step 2: [2,8] - starts at 2 <= 1? No. 8 > 4? Yes (extends) -> update end = 8, count = 2
    Step 3: [3,6] - starts at 3 <= 2? No. 6 > 8? No (covered by [2,8]) -> count stays 2
    """
    # Step 1: Sort by start time ascending, then by end time descending
    # This ensures intervals with same start but longer duration come first
    intervals.sort(key=lambda x: (x[0], -x[1]))

    # Step 2: Track the rightmost end point and count of non-covered intervals
    count = 0
    current_end = 0

    # Step 3: Process each interval
    for start, end in intervals:
        # Step 4: If current interval extends beyond previous end, it's not covered
        if end > current_end:
            count += 1
            current_end = end
        # else: current interval is covered (start >= prev_start due to sorting,
        #       and end <= current_end), so we skip it

    return count
```

**TypeScript Solution**:
```typescript
function removeCoveredIntervals(intervals: number[][]): number {
    // Step 1: Sort by start ascending, then by end descending
    intervals.sort((a, b) => {
        if (a[0] !== b[0]) {
            return a[0] - b[0];  // Sort by start ascending
        }
        return b[1] - a[1];  // If same start, longer interval first
    });

    // Step 2: Track rightmost end and count
    let count = 0;
    let currentEnd = 0;

    // Step 3: Process each interval
    for (const [start, end] of intervals) {
        // Step 4: If extends beyond current end, not covered
        if (end > currentEnd) {
            count++;
            currentEnd = end;
        }
    }

    return count;
}

/*
Example walkthrough:
Input: [[1,4],[3,6],[2,8]]

After sorting: [[1,4],[2,8],[3,6]]

Process:
i=0: [1,4] -> end(4) > currentEnd(0) -> count=1, currentEnd=4
     Timeline: [====]

i=1: [2,8] -> end(8) > currentEnd(4) -> count=2, currentEnd=8
     Timeline: [====]
               [===========]

i=2: [3,6] -> end(6) <= currentEnd(8) -> count=2 (covered, skip)
     Timeline: [====]
               [===========]
               (interval [3,6] is inside [2,8])

Result: 2
*/
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting
- Space Complexity: O(1) - only using constant extra space (excluding sort space)

---

### Problem 15: Determine if Two Events Have Conflict (Easy)
**LeetCode Link**: [2446. Determine if Two Events Have Conflict](https://leetcode.com/problems/determine-if-two-events-have-conflict/)

**Problem Description**:
You are given two arrays of strings that represent two inclusive events. Return true if there is a conflict between the two events.

**Example**:
```
Input: event1 = ["01:15","02:00"], event2 = ["02:00","03:00"]
Output: true
Explanation: Events overlap at time 02:00

Visual Calendar View:
01:00   01:30   02:00   02:30   03:00
|-------|-------|-------|-------|
        [===Event1====]
                [====Event2====]
                ↑ Overlap at 02:00
```

**Python Solution**:
```python
def haveConflict(event1: list[str], event2: list[str]) -> bool:
    """
    Think of this as two meetings in your calendar - do they conflict?

    Visualization:
    Event1: ["10:00", "11:00"]
    Event2: ["11:00", "12:00"]

    Timeline:
    10:00     10:30     11:00     11:30     12:00
    |---------|---------|---------|---------|
    [====Event1====]
                        [====Event2====]
                        ↑ They touch at 11:00 (conflict since intervals are inclusive)

    Two intervals overlap if: start1 <= end2 AND start2 <= end1
    """
    # Step 1: Extract start and end times (strings compare lexicographically for time format HH:MM)
    start1, end1 = event1[0], event1[1]
    start2, end2 = event2[0], event2[1]

    # Step 2: Check overlap condition
    # Event1 starts before/at Event2 ends AND Event2 starts before/at Event1 ends
    return start1 <= end2 and start2 <= end1
```

**TypeScript Solution**:
```typescript
function haveConflict(event1: string[], event2: string[]): boolean {
    // Step 1: Extract start and end times
    const [start1, end1] = event1;
    const [start2, end2] = event2;

    // Step 2: Check overlap using string comparison (works for "HH:MM" format)
    return start1 <= end2 && start2 <= end1;
}

/*
Visualization of all cases:

Case 1: Overlap
Event1: ["09:00", "10:00"]
Event2: ["09:30", "10:30"]
09:00        09:30        10:00        10:30
[=======Event1=======]
             [=======Event2=======]
Result: true (09:00 <= 10:30 && 09:30 <= 10:00)

Case 2: Touch (inclusive overlap)
Event1: ["09:00", "10:00"]
Event2: ["10:00", "11:00"]
09:00        10:00        11:00
[=======Event1=======]
                      [=======Event2=======]
Result: true (09:00 <= 11:00 && 10:00 <= 10:00)

Case 3: No overlap
Event1: ["09:00", "10:00"]
Event2: ["10:01", "11:00"]
09:00        10:00  10:01        11:00
[=======Event1=======]
                       [=======Event2=======]
Result: false (09:00 <= 11:00 but 10:01 > 10:00)
*/
```

**Complexity Analysis**:
- Time Complexity: O(1) - constant time string comparison
- Space Complexity: O(1) - only using constant space

---

### Problem 16: Divide Intervals Into Minimum Number of Groups (Medium)
**LeetCode Link**: [2406. Divide Intervals Into Minimum Number of Groups](https://leetcode.com/problems/divide-intervals-into-minimum-number-of-groups/)

**Problem Description**:
You are given a 2D array of intervals. You need to divide the intervals into one or more groups such that each interval is in exactly one group, and no two intervals in the same group intersect. Return the minimum number of groups needed.

**Example**:
```
Input: intervals = [[5,10],[6,8],[1,5],[2,3],[1,10]]
Output: 3

Visual representation of optimal grouping:
Timeline: 1    2    3    4    5    6    7    8    9    10
Group 1:  [==========[5,10]==========]
Group 2:                 [===[6,8]===]
Group 3:  [====[1,5]====]
          [=[2,3]=]
          [============[1,10]=============]
```

**Python Solution**:
```python
def minGroups(intervals: list[list[int]]) -> int:
    """
    This is equivalent to finding the maximum number of overlapping intervals
    at any point in time (same as Meeting Rooms II problem).

    Sweep Line Algorithm Visualization:
    intervals = [[5,10],[6,8],[1,5],[2,3],[1,10]]

    Events:
    Time:  1   2   3   4   5   6   7   8   9  10  11
    Start: +1      +1      +1  +1
    End:                   -1      -1      -1  -1  -1

    Running count (active intervals):
    Time:  1   2   3   4   5   6   7   8   9  10  11
    Count: 1   2   2   2   2   3   3   2   2   1   0
                               ↑ Maximum = 3 groups needed
    """
    # Step 1: Create events for all start and end points
    events = []
    for start, end in intervals:
        events.append((start, 1))    # Interval starts: +1
        events.append((end + 1, -1)) # Interval ends: -1 (end+1 since intervals are inclusive)

    # Step 2: Sort events by time
    # If times are same, process start events before end events
    events.sort()

    # Step 3: Sweep through events and track maximum concurrent intervals
    max_groups = 0
    active_intervals = 0

    for time, change in events:
        active_intervals += change
        max_groups = max(max_groups, active_intervals)

    return max_groups
```

**TypeScript Solution**:
```typescript
function minGroups(intervals: number[][]): number {
    // Step 1: Create events for start and end points
    const events: [number, number][] = [];

    for (const [start, end] of intervals) {
        events.push([start, 1]);      // Start: +1
        events.push([end + 1, -1]);   // End: -1 (end+1 for inclusive intervals)
    }

    // Step 2: Sort events
    events.sort((a, b) => {
        if (a[0] !== b[0]) return a[0] - b[0];  // Sort by time
        return a[1] - b[1];  // If same time, -1 (end) before +1 (start)
    });

    // Step 3: Sweep and find maximum concurrent intervals
    let maxGroups = 0;
    let activeIntervals = 0;

    for (const [time, change] of events) {
        activeIntervals += change;
        maxGroups = Math.max(maxGroups, activeIntervals);
    }

    return maxGroups;
}

/*
Detailed walkthrough with intervals = [[5,10],[6,8],[1,5],[2,3],[1,10]]:

Events after creation:
[1,+1], [6,-1]   from [1,5]
[2,+1], [4,-1]   from [2,3]
[5,+1], [11,-1]  from [5,10]
[6,+1], [9,-1]   from [6,8]
[1,+1], [11,-1]  from [1,10]

After sorting:
Time: 1  2  4  5  6  6  9  11 11
      +1 +1 -1 +1 +1 -1 -1 -1 -1

Sweep through:
Time  Change  Active  Max
1     +1      1       1
1     +1      2       2
2     +1      3       3  ← Maximum!
4     -1      2       3
5     +1      3       3
6     -1      2       3
6     +1      3       3
9     -1      2       3
11    -1      1       3
11    -1      0       3

Result: 3 groups needed
*/
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting events
- Space Complexity: O(n) - for storing events

---

### Problem 17: Video Stitching (Medium)
**LeetCode Link**: [1024. Video Stitching](https://leetcode.com/problems/video-stitching/)

**Problem Description**:
You are given a series of video clips from a sporting event that lasted time seconds. These video clips can overlap and have varying lengths. Return the minimum number of clips needed to cover [0, time]. Return -1 if impossible.

**Example**:
```
Input: clips = [[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]], time = 10
Output: 3
Explanation: Take clips [0,2], [1,9], [8,10]

Visual stitch plan:
Timeline: 0    1    2    3    4    5    6    7    8    9    10
Clip 1:   [===]
Clip 2:                                      [===]
Clip 3:        [==================]

Coverage: [====================================] (0 to 10 covered)
```

**Python Solution**:
```python
def videoStitching(clips: list[list[int]], time: int) -> int:
    """
    Greedy approach: Always pick the clip that extends coverage the farthest.

    Visualization with clips = [[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]], time = 10

    Timeline: 0    1    2    3    4    5    6    7    8    9    10
              |----|----|----|----|----|----|----|----|----|----|

    Sorted clips:
    [0,2]: [===]
    [1,5]:      [=========]
    [1,9]:      [=======================]
    [4,6]:                  [=====]
    [5,9]:                       [===========]
    [8,10]:                                   [=====]

    Greedy selection process:
    Step 1: current_end=0, need clip starting at/before 0
            Options: [0,2] (extends to 2) ✓ PICK THIS
            Coverage: [===] (0 to 2), clips=1

    Step 2: current_end=2, need clip starting at/before 2
            Options: [1,5] (extends to 5), [1,9] (extends to 9)
            Pick [1,9] (farthest) ✓
            Coverage: [=========================] (0 to 9), clips=2

    Step 3: current_end=9, need clip starting at/before 9
            Options: [8,10] (extends to 10) ✓ PICK THIS
            Coverage: [================================] (0 to 10), clips=3

    Done! Answer: 3 clips
    """
    # Step 1: Sort clips by start time
    clips.sort()

    # Step 2: Initialize tracking variables
    clips_used = 0
    current_end = 0  # End of current coverage
    next_end = 0     # Farthest we can reach with available clips
    i = 0

    # Step 3: Greedily extend coverage
    while current_end < time:
        # Step 4: Find all clips that start at or before current_end
        # and pick the one that extends farthest
        while i < len(clips) and clips[i][0] <= current_end:
            next_end = max(next_end, clips[i][1])
            i += 1

        # Step 5: If we couldn't extend coverage, impossible to cover [0, time]
        if next_end == current_end:
            return -1

        # Step 6: Use this clip, update current coverage
        clips_used += 1
        current_end = next_end

    return clips_used
```

**TypeScript Solution**:
```typescript
function videoStitching(clips: number[][], time: number): number {
    // Step 1: Sort clips by start time
    clips.sort((a, b) => a[0] - b[0]);

    // Step 2: Initialize variables
    let clipsUsed = 0;
    let currentEnd = 0;  // Current coverage end
    let nextEnd = 0;     // Farthest reachable end
    let i = 0;

    // Step 3: Greedily extend coverage
    while (currentEnd < time) {
        // Step 4: Find clip that extends coverage the most
        while (i < clips.length && clips[i][0] <= currentEnd) {
            nextEnd = Math.max(nextEnd, clips[i][1]);
            i++;
        }

        // Step 5: Check if we made progress
        if (nextEnd === currentEnd) {
            return -1;  // Cannot extend coverage
        }

        // Step 6: Use this clip
        clipsUsed++;
        currentEnd = nextEnd;
    }

    return clipsUsed;
}

/*
Example trace with clips = [[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]], time = 10:

After sorting: [[0,2],[1,5],[1,9],[4,6],[5,9],[8,10]]

Iteration 1: currentEnd=0, need to extend
  Check clips starting <= 0:
    [0,2]: extends to 2 → nextEnd=2
  clipsUsed=1, currentEnd=2

Iteration 2: currentEnd=2, need to extend
  Check clips starting <= 2:
    [1,5]: extends to 5 → nextEnd=5
    [1,9]: extends to 9 → nextEnd=9 (better!)
  clipsUsed=2, currentEnd=9

Iteration 3: currentEnd=9, need to extend (still < 10)
  Check clips starting <= 9:
    [4,6]: extends to 6 → nextEnd=9 (no improvement)
    [5,9]: extends to 9 → nextEnd=9 (no improvement)
    [8,10]: extends to 10 → nextEnd=10 (improvement!)
  clipsUsed=3, currentEnd=10

currentEnd >= time, done!
Return: 3
*/
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting clips
- Space Complexity: O(1) - only using constant extra space

---

### Problem 18: Minimum Interval to Include Each Query (Hard)
**LeetCode Link**: [1851. Minimum Interval to Include Each Query](https://leetcode.com/problems/minimum-interval-to-include-each-query/)

**Problem Description**:
You are given a 2D array intervals and an array queries. For each query, find the size of the smallest interval that contains the query. Return -1 if no interval contains the query.

**Example**:
```
Input: intervals = [[1,4],[2,4],[3,6],[4,4]], queries = [2,3,4,5]
Output: [3,3,1,4]

Visualization:
Timeline: 1    2    3    4    5    6
Interval: [====A====]
               [==B==]
                    [===C===]
                         [D]

Query 2: Inside A[1,4] (size 4), B[2,4] (size 3) → min = 3
Query 3: Inside A[1,4] (size 4), B[2,4] (size 3), C[3,6] (size 4) → min = 3
Query 4: Inside A[1,4] (size 4), B[2,4] (size 3), C[3,6] (size 4), D[4,4] (size 1) → min = 1
Query 5: Inside C[3,6] (size 4) → min = 4
```

**Python Solution**:
```python
import heapq

def minInterval(intervals: list[list[int]], queries: list[int]) -> list[int]:
    """
    Strategy: Process queries in sorted order, use min-heap to track valid intervals

    Visualization of algorithm:
    intervals = [[1,4],[2,4],[3,6],[4,4]]
    queries = [2,3,4,5]

    Step 1: Sort intervals by start time
    Sorted: [[1,4],[2,4],[3,6],[4,4]]

    Step 2: Process queries in order with heap

    Query 2:
      Add intervals starting <= 2: [1,4], [2,4]
      Heap: [(3,4), (3,4)] (size, end)
      Remove intervals ending < 2: none
      Min interval size: 3

    Query 3:
      Add intervals starting <= 3: [3,6]
      Heap: [(3,4), (3,4), (4,6)]
      Remove intervals ending < 3: none
      Min interval size: 3

    Query 4:
      Add intervals starting <= 4: [4,4]
      Heap: [(3,4), (3,4), (4,6), (1,4)]
      Remove intervals ending < 4: none
      Min interval size: 1

    Query 5:
      Add intervals starting <= 5: none more
      Heap: [(3,4), (3,4), (4,6), (1,4)]
      Remove intervals ending < 5: (3,4), (3,4), (1,4)
      Heap after cleanup: [(4,6)]
      Min interval size: 4
    """
    # Step 1: Sort intervals by start time
    intervals.sort()

    # Step 2: Create sorted queries with original indices
    sorted_queries = sorted((q, i) for i, q in enumerate(queries))

    # Step 3: Result array
    result = [-1] * len(queries)

    # Step 4: Min heap to store (interval_size, end_time)
    min_heap = []
    interval_idx = 0

    # Step 5: Process each query in sorted order
    for query, original_idx in sorted_queries:
        # Add all intervals that start at or before this query
        while interval_idx < len(intervals) and intervals[interval_idx][0] <= query:
            start, end = intervals[interval_idx]
            interval_size = end - start + 1
            heapq.heappush(min_heap, (interval_size, end))
            interval_idx += 1

        # Remove intervals that end before this query
        while min_heap and min_heap[0][1] < query:
            heapq.heappop(min_heap)

        # The top of heap is the smallest valid interval
        if min_heap:
            result[original_idx] = min_heap[0][0]

    return result
```

**TypeScript Solution**:
```typescript
function minInterval(intervals: number[][], queries: number[]): number[] {
    // Step 1: Sort intervals by start time
    intervals.sort((a, b) => a[0] - b[0]);

    // Step 2: Create sorted queries with indices
    const sortedQueries: [number, number][] = queries.map((q, i) => [q, i]);
    sortedQueries.sort((a, b) => a[0] - b[0]);

    // Step 3: Result array
    const result: number[] = new Array(queries.length).fill(-1);

    // Step 4: Min heap - implement using sorted array (JavaScript doesn't have built-in heap)
    const heap: [number, number][] = [];  // [size, end]
    let intervalIdx = 0;

    // Helper function to maintain heap property
    const addToHeap = (item: [number, number]) => {
        heap.push(item);
        heap.sort((a, b) => a[0] - b[0]);  // Sort by size
    };

    const removeFromHeap = () => heap.shift();

    // Step 5: Process queries
    for (const [query, originalIdx] of sortedQueries) {
        // Add intervals starting <= query
        while (intervalIdx < intervals.length && intervals[intervalIdx][0] <= query) {
            const [start, end] = intervals[intervalIdx];
            const size = end - start + 1;
            addToHeap([size, end]);
            intervalIdx++;
        }

        // Remove intervals ending < query
        while (heap.length > 0 && heap[0][1] < query) {
            removeFromHeap();
        }

        // Get minimum interval size
        if (heap.length > 0) {
            result[originalIdx] = heap[0][0];
        }
    }

    return result;
}

/*
Complete example walkthrough:
intervals = [[1,4],[2,4],[3,6],[4,4]]
queries = [2,3,4,5]

Timeline visualization:
Pos:  1    2    3    4    5    6
I1:   [=========]         (size 4)
I2:        [====]          (size 3)
I3:             [=======]  (size 4)
I4:                  [.]   (size 1)
Q:         ↑    ↑    ↑  ↑
           2    3    4  5

Processing:
Query=2: heap=[(3,[2,4]), (4,[1,4])] → answer=3
Query=3: heap=[(3,[2,4]), (4,[1,4]), (4,[3,6])] → answer=3
Query=4: heap=[(1,[4,4]), (3,[2,4]), (4,[1,4]), (4,[3,6])] → answer=1
Query=5: heap=[(4,[3,6])] after removing ended intervals → answer=4

Final result: [3,3,1,4]
*/
```

**Complexity Analysis**:
- Time Complexity: O((n + q) log n) - where n = intervals, q = queries. Sorting intervals and queries, heap operations
- Space Complexity: O(n + q) - for heap and sorted queries

---

### Problem 19: Count Ways to Group Overlapping Ranges (Medium)
**LeetCode Link**: [2580. Count Ways to Group Overlapping Ranges](https://leetcode.com/problems/count-ways-to-group-overlapping-ranges/)

**Problem Description**:
You are given a 2D array of ranges. Two ranges are considered overlapping if they share at least one common number. You need to divide ranges into two groups. Overlapping ranges must be in the same group. Return the total number of ways to make such division modulo 10^9 + 7.

**Example**:
```
Input: ranges = [[6,10],[5,15]]
Output: 2

Visual:
Timeline: 5    6    7    8    9    10   11   12   13   14   15
          [=========Range1=========]
               [====================Range2====================]

They overlap, so must be in same group.
Ways to group: Both in Group A, or Both in Group B = 2 ways

Input: ranges = [[1,3],[10,20],[2,5],[4,8]]
Output: 4

After merging overlapping: [[1,8],[10,20]] (2 independent groups)
Ways: 2^2 = 4 ways (each group can independently go to Group A or B)
```

**Python Solution**:
```python
def countWays(ranges: list[list[int]]) -> int:
    """
    Key insight: Merge overlapping ranges, then count independent groups.
    Answer = 2^(number of independent groups)

    Visualization with ranges = [[1,3],[10,20],[2,5],[4,8]]:

    Original ranges on timeline:
    Pos:  1    2    3    4    5    6    7    8    9    10   11   ...  20
          [==R1==]
               [===R3===]
                         [====R4====]
                                                [========R2========]

    After sorting by start: [[1,3],[2,5],[4,8],[10,20]]

    Merge process:
    Step 1: [1,3] - first group
    Step 2: [2,5] - overlaps with [1,3] (2 <= 3), merge to [1,5]
    Step 3: [4,8] - overlaps with [1,5] (4 <= 5), merge to [1,8]
    Step 4: [10,20] - doesn't overlap (10 > 8), new group

    Result after merging: [[1,8], [10,20]]
    Number of independent groups: 2

    Ways to distribute:
    Group [1,8]:  Can go to Set A or Set B (2 choices)
    Group [10,20]: Can go to Set A or Set B (2 choices)
    Total: 2 × 2 = 2^2 = 4 ways

    Possible distributions:
    1. [1,8]→A, [10,20]→A
    2. [1,8]→A, [10,20]→B
    3. [1,8]→B, [10,20]→A
    4. [1,8]→B, [10,20]→B
    """
    MOD = 10**9 + 7

    # Step 1: Sort ranges by start position
    ranges.sort()

    # Step 2: Merge overlapping ranges and count groups
    merged_groups = 1  # Start with first group
    current_end = ranges[0][1]

    for i in range(1, len(ranges)):
        start, end = ranges[i]

        # Step 3: Check if current range overlaps with previous merged range
        if start <= current_end:
            # Overlaps - extend the current group
            current_end = max(current_end, end)
        else:
            # No overlap - start a new independent group
            merged_groups += 1
            current_end = end

    # Step 4: Calculate 2^(number of groups) mod 10^9+7
    return pow(2, merged_groups, MOD)
```

**TypeScript Solution**:
```typescript
function countWays(ranges: number[][]): number {
    const MOD = 1e9 + 7;

    // Step 1: Sort ranges by start position
    ranges.sort((a, b) => a[0] - b[0]);

    // Step 2: Count independent groups by merging overlapping ranges
    let mergedGroups = 1;
    let currentEnd = ranges[0][1];

    for (let i = 1; i < ranges.length; i++) {
        const [start, end] = ranges[i];

        if (start <= currentEnd) {
            // Overlaps - extend current group
            currentEnd = Math.max(currentEnd, end);
        } else {
            // No overlap - new independent group
            mergedGroups++;
            currentEnd = end;
        }
    }

    // Step 3: Calculate 2^mergedGroups mod MOD
    let result = 1;
    for (let i = 0; i < mergedGroups; i++) {
        result = (result * 2) % MOD;
    }

    return result;
}

/*
Detailed example: ranges = [[1,3],[10,20],[2,5],[4,8]]

After sorting: [[1,3],[2,5],[4,8],[10,20]]

Visual merge process:
Position: 1    2    3    4    5    6    7    8    9    10   ...   20
          |----|----|----|----|----|----|----|----|----|----|------|

i=0: [1,3]
     [==]
     mergedGroups=1, currentEnd=3

i=1: [2,5]
     [==]
        [===]
     start(2) <= currentEnd(3)? YES → Merge
     [=====]
     mergedGroups=1, currentEnd=5

i=2: [4,8]
     [=====]
            [====]
     start(4) <= currentEnd(5)? YES → Merge
     [==========]
     mergedGroups=1, currentEnd=8

i=3: [10,20]
     [==========]                [===========]
     start(10) <= currentEnd(8)? NO → New group
     mergedGroups=2, currentEnd=20

Final: 2 independent groups
Answer: 2^2 = 4
*/
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - for sorting ranges
- Space Complexity: O(1) - only using constant extra space (excluding sort space)

---

### Problem 20: Partition Labels (Medium)
**LeetCode Link**: [763. Partition Labels](https://leetcode.com/problems/partition-labels/)

**Problem Description**:
You are given a string s. Partition the string into as many parts as possible so that each letter appears in at most one part. Return a list of integers representing the size of these parts.

**Example**:
```
Input: s = "ababcbacadefegdehijhklij"
Output: [9,7,8]
Explanation: "ababcbaca", "defegde", "hijhklij"

Visual representation (showing last occurrence of each character):
Position: 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23
String:   a b a b c b a c a d e  f  e  g  d  e  h  i  j  h  k  l  i  j
          ↓                 ↑
          └─────────────────┘ 'a' last at 8, 'b' last at 5, 'c' last at 7
                            Must include 0-8 in first partition
```

**Python Solution**:
```python
def partitionLabels(s: str) -> list[int]:
    """
    Think of this as merging intervals!
    Each character defines an interval [first_occurrence, last_occurrence]

    Visualization with s = "ababcbacadefegdehijhklij":

    Character intervals (first to last occurrence):
    a: [0, 8]   ========>
    b: [1, 5]   ====>
    c: [4, 7]      ===>
    d: [9, 14]          =====>
    e: [10, 15]          ======>
    f: [11, 11]             >
    g: [13, 13]              >
    h: [16, 19]                 ===>
    i: [17, 22]                  =====>
    j: [18, 23]                   ======>
    k: [20, 20]                      >
    l: [21, 21]                       >

    Merge overlapping intervals:
    Group 1: [0,8] (a, b, c all overlap)
    Group 2: [9,15] (d, e, f, g all overlap)
    Group 3: [16,23] (h, i, j, k, l all overlap)

    Partition sizes: [9, 7, 8]
    """
    # Step 1: Find last occurrence of each character
    last_occurrence = {char: idx for idx, char in enumerate(s)}

    # Step 2: Track partitions using interval merging approach
    result = []
    partition_start = 0
    partition_end = 0

    # Step 3: Process each character
    for i, char in enumerate(s):
        # Extend partition to include last occurrence of current char
        partition_end = max(partition_end, last_occurrence[char])

        # Step 4: If we've reached the end of partition, record its size
        if i == partition_end:
            result.append(partition_end - partition_start + 1)
            partition_start = i + 1  # Start next partition

    return result
```

**TypeScript Solution**:
```typescript
function partitionLabels(s: string): number[] {
    // Step 1: Find last occurrence of each character
    const lastOccurrence = new Map<string, number>();
    for (let i = 0; i < s.length; i++) {
        lastOccurrence.set(s[i], i);
    }

    // Step 2: Track partitions
    const result: number[] = [];
    let partitionStart = 0;
    let partitionEnd = 0;

    // Step 3: Process each character
    for (let i = 0; i < s.length; i++) {
        const char = s[i];

        // Extend partition to include last occurrence
        partitionEnd = Math.max(partitionEnd, lastOccurrence.get(char)!);

        // Step 4: Check if we've reached partition end
        if (i === partitionEnd) {
            result.push(partitionEnd - partitionStart + 1);
            partitionStart = i + 1;
        }
    }

    return result;
}

/*
Step-by-step trace with s = "ababcbacadefegdehijhklij":

Last occurrences: {a:8, b:5, c:7, d:14, e:15, f:11, g:13, h:19, i:22, j:23, k:20, l:21}

Timeline view:
Pos:  0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18 19 20 21 22 23
Char: a  b  a  b  c  b  a  c  a  d  e  f  e  g  d  e  h  i  j  h  k  l  i  j
End:  8  8  8  8  8  8  8  8  8  15 15 15 15 15 15 15 23 23 23 23 23 23 23 23
Part: [========Partition 1========] [======Partition 2======] [====Partition 3====]

Process:
i=0: char='a', end=max(0,8)=8
i=1: char='b', end=max(8,5)=8
i=2: char='a', end=max(8,8)=8
...
i=8: char='a', end=8, i==end → partition size = 9, start next at 9
i=9: char='d', end=max(9,14)=14
...
i=15: char='e', end=15, i==end → partition size = 7, start next at 16
i=16: char='h', end=max(16,19)=19
...
i=23: char='j', end=23, i==end → partition size = 8

Result: [9, 7, 8]
*/
```

**Complexity Analysis**:
- Time Complexity: O(n) - single pass to find last occurrences, single pass to partition
- Space Complexity: O(1) - at most 26 characters in the map (constant space for English alphabet)

---

### Problem 21: Amount of New Area Painted Each Day (Hard)
**LeetCode Link**: [2158. Amount of New Area Painted Each Day](https://leetcode.com/problems/amount-of-new-area-painted-each-day/)

**Problem Description**:
You are painting a wall. The wall is divided into positions from 0 to 5 * 10^4. You are given a 2D array paint where paint[i] = [start_i, end_i] indicates that on day i, you paint from start_i to end_i - 1 (inclusive). Return an array where result[i] is the amount of new area painted on day i.

**Example**:
```
Input: paint = [[1,4],[4,7],[5,8]]
Output: [3,3,1]

Visual day-by-day painting:
Day 1: Paint [1,4)
Wall:  0    1    2    3    4    5    6    7    8
       |----|####|####|####|----|----|----|----|
       New area painted: 3 units

Day 2: Paint [4,7)
Wall:  0    1    2    3    4    5    6    7    8
       |----|####|####|####|####|####|####|----|
       New area painted: 3 units (4,5,6 were unpainted)

Day 3: Paint [5,8)
Wall:  0    1    2    3    4    5    6    7    8
       |----|####|####|####|####|####|####|####|
       New area painted: 1 unit (only 7 was unpainted)
```

**Python Solution**:
```python
def amountPainted(paint: list[list[int]]) -> list[int]:
    """
    Use Union-Find / Jump technique to efficiently skip painted areas.

    Visualization of the "jump" technique:

    After Day 1 paints [1,4):
    Position: 0  1  2  3  4  5  6  7  8
    Painted:     P  P  P
    Jump:     0  4  4  4  4  5  6  7  8  (jump[i] = next unpainted position)

    After Day 2 paints [4,7):
    Position: 0  1  2  3  4  5  6  7  8
    Painted:     P  P  P  P  P  P
    Jump:     0  4  4  4  7  7  7  7  8

    When painting Day 3 [5,8):
    - Start at 5: jump[5]=7, so skip 5,6 (already painted), jump to 7
    - At 7: paint it, set jump[7]=8
    - New area = 1
    """
    # Step 1: Track painted positions using jump array
    # jump[i] = next unpainted position >= i
    max_pos = max(end for _, end in paint)
    jump = list(range(max_pos + 1))  # Initially, jump[i] = i (all unpainted)

    result = []

    # Step 2: Process each day's painting
    for start, end in paint:
        new_area = 0
        pos = start

        # Step 3: Paint from start to end, jumping over painted areas
        while pos < end:
            if jump[pos] == pos:
                # This position is unpainted, paint it
                new_area += 1
                next_pos = pos + 1
                jump[pos] = next_pos  # Mark as painted
                pos = next_pos
            else:
                # This position is painted, jump to next unpainted
                next_unpainted = jump[pos]
                jump[pos] = max(jump[pos], end)  # Update jump to skip this range
                pos = next_unpainted
                if pos >= end:
                    break

        result.append(new_area)

    return result
```

**TypeScript Solution**:
```typescript
function amountPainted(paint: number[][]): number[] {
    // Step 1: Create jump array to track next unpainted position
    const maxPos = Math.max(...paint.map(p => p[1]));
    const jump: number[] = Array.from({length: maxPos + 1}, (_, i) => i);

    const result: number[] = [];

    // Step 2: Process each day
    for (const [start, end] of paint) {
        let newArea = 0;
        let pos = start;

        // Step 3: Paint range, jumping over painted areas
        while (pos < end) {
            if (jump[pos] === pos) {
                // Unpainted - paint it
                newArea++;
                const nextPos = pos + 1;
                jump[pos] = nextPos;
                pos = nextPos;
            } else {
                // Painted - jump to next unpainted
                const nextUnpainted = jump[pos];
                jump[pos] = Math.max(jump[pos], end);
                pos = nextUnpainted;
                if (pos >= end) break;
            }
        }

        result.push(newArea);
    }

    return result;
}

/*
Detailed trace with paint = [[1,4],[4,7],[5,8]]:

Initial state:
jump = [0,1,2,3,4,5,6,7,8,...]

Day 1: Paint [1,4)
  pos=1: jump[1]=1 (unpainted) → paint, newArea=1, jump[1]=2, pos=2
  pos=2: jump[2]=2 (unpainted) → paint, newArea=2, jump[2]=3, pos=3
  pos=3: jump[3]=3 (unpainted) → paint, newArea=3, jump[3]=4, pos=4
  pos=4: >= end, done
  result = [3]
  jump = [0,2,3,4,4,5,6,7,8,...]

Day 2: Paint [4,7)
  pos=4: jump[4]=4 (unpainted) → paint, newArea=1, jump[4]=5, pos=5
  pos=5: jump[5]=5 (unpainted) → paint, newArea=2, jump[5]=6, pos=6
  pos=6: jump[6]=6 (unpainted) → paint, newArea=3, jump[6]=7, pos=7
  pos=7: >= end, done
  result = [3,3]
  jump = [0,2,3,4,5,6,7,7,8,...]

Day 3: Paint [5,8)
  pos=5: jump[5]=6 (painted) → jump to 6, update jump[5]=max(6,8)=8
  pos=6: jump[6]=7 (painted) → jump to 7, update jump[6]=max(7,8)=8
  pos=7: jump[7]=7 (unpainted) → paint, newArea=1, jump[7]=8, pos=8
  pos=8: >= end, done
  result = [3,3,1]
  jump = [0,2,3,4,8,8,8,8,8,...]

Final answer: [3,3,1]
*/
```

**Complexity Analysis**:
- Time Complexity: O(n * m) - where n is number of paint operations, m is average range size (amortized O(n) with jump optimization)
- Space Complexity: O(max_position) - for jump array

---

### Problem 22: Describe the Painting (Hard)
**LeetCode Link**: [1943. Describe the Painting](https://leetcode.com/problems/describe-the-painting/)

**Problem Description**:
You are given a 2D array segments where segments[i] = [start_i, end_i, color_i]. Multiple segments can overlap and colors mix (add together). Return a 2D array describing the painting where each element is [start, end, total_color] for segments with non-zero color.

**Example**:
```
Input: segments = [[1,4,5],[4,7,7],[1,7,9]]
Output: [[1,4,14],[4,7,16]]

Visual color mixing:
Position: 1    2    3    4    5    6    7
Segment1: [color=5......]
Segment2:                [color=7........]
Segment3: [color=9......................]

Color timeline:
[1,4):  5 + 9 = 14
[4,7):  7 + 9 = 16
```

**Python Solution**:
```python
def splitPainting(segments: list[list[int]]) -> list[list[int]]:
    """
    Use sweep line algorithm with color deltas.

    Visualization with segments = [[1,4,5],[4,7,7],[1,7,9]]:

    Create events:
    Position 1: +5 (segment1 starts), +9 (segment3 starts)
    Position 4: -5 (segment1 ends), +7 (segment2 starts)
    Position 7: -7 (segment2 ends), -9 (segment3 ends)

    Sweep line process:
    Pos  Event    CurrentColor  Result
    1    +5,+9    14            [1,4,14] starts
    4    -5,+7    16            [1,4,14] ends, [4,7,16] starts
    7    -7,-9    0             [4,7,16] ends

    Timeline visualization:
    Pos:  1    2    3    4    5    6    7
          |----|----|----|----|----|----|
    Mix:  14   14   14   16   16   16
          └─────────┘    └─────────┘
          [1,4,14]       [4,7,16]
    """
    # Step 1: Create color change events
    events = {}  # position -> color delta

    for start, end, color in segments:
        events[start] = events.get(start, 0) + color   # Start adds color
        events[end] = events.get(end, 0) - color       # End removes color

    # Step 2: Sort positions
    sorted_positions = sorted(events.keys())

    # Step 3: Sweep through positions and build result
    result = []
    current_color = 0

    for i in range(len(sorted_positions)):
        pos = sorted_positions[i]

        # If current segment has color, add it to result
        if current_color > 0 and i > 0:
            result.append([sorted_positions[i-1], pos, current_color])

        # Update current color with events at this position
        current_color += events[pos]

    return result
```

**TypeScript Solution**:
```typescript
function splitPainting(segments: number[][]): number[][] {
    // Step 1: Create color delta events
    const events = new Map<number, number>();

    for (const [start, end, color] of segments) {
        events.set(start, (events.get(start) || 0) + color);
        events.set(end, (events.get(end) || 0) - color);
    }

    // Step 2: Sort positions
    const positions = Array.from(events.keys()).sort((a, b) => a - b);

    // Step 3: Sweep and build result
    const result: number[][] = [];
    let currentColor = 0;

    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];

        // Add previous segment if it had color
        if (currentColor > 0 && i > 0) {
            result.push([positions[i-1], pos, currentColor]);
        }

        // Update color
        currentColor += events.get(pos)!;
    }

    return result;
}

/*
Complete walkthrough with segments = [[1,4,5],[4,7,7],[1,7,9]]:

Step 1: Create events
  Segment [1,4,5]: events[1] += 5, events[4] += -5
  Segment [4,7,7]: events[4] += 7, events[7] += -7
  Segment [1,7,9]: events[1] += 9, events[7] += -9

  events = {1: 14, 4: 2, 7: -16}

Step 2: Sorted positions = [1, 4, 7]

Step 3: Sweep through
  i=0, pos=1:
    currentColor=0, i=0 → no segment to add
    currentColor += events[1] = 14

  i=1, pos=4:
    currentColor=14 > 0, i>0 → add [positions[0], pos, 14] = [1,4,14]
    currentColor += events[4] = 14 + 2 = 16

  i=2, pos=7:
    currentColor=16 > 0, i>0 → add [positions[1], pos, 16] = [4,7,16]
    currentColor += events[7] = 16 + (-16) = 0

Result: [[1,4,14],[4,7,16]]

Visual representation:
Position: 1         4         7
          |---------|---------|
Color:    14        16        0
Segments: [1,4,14]  [4,7,16]
*/
```

**Complexity Analysis**:
- Time Complexity: O(n log n) - where n is the number of segments, dominated by sorting
- Space Complexity: O(n) - for events map

---

### Problem 23: Maximum Population Year (Easy)
**LeetCode Link**: [1854. Maximum Population Year](https://leetcode.com/problems/maximum-population-year/)

**Problem Description**:
You are given a 2D array logs where logs[i] = [birth_i, death_i] indicates the birth and death years of person i. Return the earliest year with the maximum population.

**Example**:
```
Input: logs = [[1993,1999],[2000,2010]]
Output: 1993

Visual population timeline:
Year:  1993 1994 1995 1996 1997 1998 1999 2000 2001 ... 2010
Pop:   1    1    1    1    1    1    0    1    1   ...  0
       └────Person 1────────────┘    └──Person 2───────┘

Maximum population: 1 (years 1993-1998 and 2000-2009)
Earliest year: 1993
```

**Python Solution**:
```python
def maximumPopulation(logs: list[list[int]]) -> int:
    """
    Use sweep line / difference array technique.

    Visualization with logs = [[1950,1961],[1960,1971],[1970,1981]]:

    Timeline (showing population changes):
    Year:  1950  1960  1961  1970  1971  1981
    Event: +1    +1    -1    +1    -1    -1

    Running population count:
    [1950,1960): 1 person  (Person 1)
    [1960,1961): 2 people  (Person 1 + Person 2) ← Maximum!
    [1961,1970): 1 person  (Person 2)
    [1970,1971): 2 people  (Person 2 + Person 3)
    [1971,1981): 1 person  (Person 3)

    Visual bar chart:
    Pop
    2 |     ■           ■
    1 |  ■  ■  ■  ■  ■  ■  ■
    0 |__|__|__|__|__|__|__|
       1950 60  61  70  71  81

    First year with max population: 1960
    """
    # Step 1: Create event array for years 1950-2050
    events = [0] * 101  # Covers years 1950 to 2050 (index 0 = year 1950)

    # Step 2: Mark birth (+1) and death (-1) events
    for birth, death in logs:
        events[birth - 1950] += 1     # Birth year: population increases
        events[death - 1950] -= 1     # Death year: population decreases

    # Step 3: Sweep through years and track maximum population
    max_population = 0
    current_population = 0
    max_year = 1950

    for i in range(101):
        current_population += events[i]

        # Update maximum if current population is greater
        if current_population > max_population:
            max_population = current_population
            max_year = 1950 + i

    return max_year
```

**TypeScript Solution**:
```typescript
function maximumPopulation(logs: number[][]): number {
    // Step 1: Create event array (year 1950-2050)
    const events = new Array(101).fill(0);  // Index 0 = 1950

    // Step 2: Record birth and death events
    for (const [birth, death] of logs) {
        events[birth - 1950] += 1;   // Population increases
        events[death - 1950] -= 1;   // Population decreases
    }

    // Step 3: Sweep and find maximum population year
    let maxPopulation = 0;
    let currentPopulation = 0;
    let maxYear = 1950;

    for (let i = 0; i < 101; i++) {
        currentPopulation += events[i];

        if (currentPopulation > maxPopulation) {
            maxPopulation = currentPopulation;
            maxYear = 1950 + i;
        }
    }

    return maxYear;
}

/*
Detailed example with logs = [[1993,1999],[2000,2010]]:

Step 1: Create events array (size 101 for years 1950-2050)

Step 2: Mark events
  [1993,1999]: events[1993-1950=43] += 1, events[1999-1950=49] -= 1
  [2000,2010]: events[2000-1950=50] += 1, events[2010-1950=60] -= 1

  events = [0,0,...,0,1,0,...,0,-1,0,1,0,...,0,-1,0,...]
                    ↑43      ↑49  ↑50      ↑60

Step 3: Sweep through
  Year 1950-1992 (i=0-42): population=0
  Year 1993 (i=43): population=0+1=1, max=1, maxYear=1993
  Year 1994-1998 (i=44-48): population=1
  Year 1999 (i=49): population=1-1=0
  Year 2000 (i=50): population=0+1=1 (not > max)
  Year 2001-2009 (i=51-59): population=1
  Year 2010 (i=60): population=1-1=0

Result: 1993 (earliest year with maximum population of 1)

Visual timeline:
Year:     1993      1999 2000      2010
          |---------|    |---------|
Person1:  [=========]
Person2:                 [=========]
Pop:      111111110000   1111111110
                ↑
          First max at 1993
*/
```

**Complexity Analysis**:
- Time Complexity: O(n + range) - where n is number of logs, range is 101 years
- Space Complexity: O(range) - for events array (101 constant space)

---

## Practice Tips

1. **Always sort first**: Most interval problems require sorting by start time (or sometimes end time)

2. **Overlap condition**: Two intervals [a,b] and [c,d] overlap if: `a < d AND c < b`
   - Or equivalently: `max(a,c) < min(b,d)`

3. **Merge intervals pattern**:
   - Sort by start time
   - Compare current interval with last merged interval
   - If overlap: extend end time
   - If no overlap: add new interval

4. **Common sorting strategies**:
   - By start time: for merging, inserting
   - By end time: for greedy problems (min arrows, max activities)
   - Both: create separate arrays for sweep line algorithm

5. **Edge cases to test**:
   - Empty input
   - Single interval
   - All overlapping intervals
   - No overlapping intervals
   - Intervals that touch but don't overlap ([1,2], [2,3])

6. **Pattern variations**:
   - Merge intervals: sort + scan
   - Find conflicts: sort + check consecutive pairs
   - Min resources: sort + heap or sweep line
   - Insert interval: three-phase scan (before, merge, after)
   - Intersection: two pointers

7. **Greedy vs DP**:
   - Greedy: when choosing earliest/latest ending works (min arrows, max activities)
   - DP: when you need to maximize profit or consider subset selection

8. **Data structures**:
   - List/Array: most common, for sorted intervals
   - Heap: for meeting rooms (tracking end times)
   - TreeMap/Balanced BST: for range queries and updates
   - Sweep line: for complex overlapping scenarios
