# Design Yelp / Nearby Places

## Problem Statement

Design a location-based service like Yelp that allows users to search for nearby businesses (restaurants, shops, etc.) efficiently using geospatial indexing.

## Requirements

### Functional
- Search businesses by location (lat/long) and radius
- Add/update/delete businesses
- Filter by category, rating, price
- View business details and reviews

### Non-Functional
- **Low latency**: Search < 200ms
- **Scale**: 500M places, 100M daily searches
- **Accuracy**: Results within specified radius
- **Read-heavy**: 99:1 read/write ratio

## Architecture

```
┌──────────────────────────────────────────┐
│      Clients (Mobile, Web)                │
└────────────┬─────────────────────────────┘
             │
┌────────────▼─────────────────────────────┐
│        API Gateway / LB                   │
└────────────┬─────────────────────────────┘
             │
        ┌────┴───────┐
        │            │
┌───────▼──────┐ ┌──▼────────────┐
│ Search       │ │  Business     │
│ Service      │ │  Service      │
│(Geo Index)   │ │(CRUD)         │
└───────┬──────┘ └───────────────┘
        │
   ┌────┴────┬─────────────┐
   │         │             │
┌──▼───┐ ┌──▼────┐  ┌─────▼──────┐
│Redis │ │PostGIS│  │ElasticS    │
│(Geo) │ │(SQL)  │  │(Text Search│
└──────┘ └───────┘  └────────────┘
```

## Geospatial Indexing Solutions

### Solution 1: Geohash

**How it works:**

```
1. Divide world into grid
2. Encode lat/lng into string (precision = grid size)

Example:
  San Francisco: "9q8yy" (5 chars ≈ 4.9km × 4.9km)
  Precision levels:
    1 char: ±2500 km
    5 chars: ±2.4 km
    8 chars: ±19 m
```

**Implementation:**

```python
import geohash as gh

# Encode location
sf_geohash = gh.encode(37.7749, -122.4194, precision=6)  # "9q8yyk"

# Find nearby businesses
def search_nearby(lat, lng, radius_km):
    # Get geohash for query point
    center_hash = gh.encode(lat, lng, precision=5)

    # Get neighbors (9 cells: center + 8 surrounding)
    neighbors = gh.neighbors(center_hash) + [center_hash]

    # Query businesses in these geohashes
    businesses = []
    for geo in neighbors:
        results = db.query("""
            SELECT * FROM businesses
            WHERE geohash LIKE ?
        """, f"{geo}%")
        businesses.extend(results)

    # Filter by exact radius (geohash is approximate)
    filtered = []
    for biz in businesses:
        distance = haversine(lat, lng, biz.lat, biz.lng)
        if distance <= radius_km:
            filtered.append(biz)

    return sorted(filtered, key=lambda b: haversine(lat, lng, b.lat, b.lng))
```

**Pros:**
- ✅ Simple to implement
- ✅ Works with any database (just string prefix search)
- ✅ Good for nearby search

**Cons:**
- ❌ Edge cases (boundaries between cells)
- ❌ Non-uniform cell sizes near poles
- ❌ Need to search multiple cells for larger radius

### Solution 2: QuadTree

**How it works:**

```
1. Divide world into 4 quadrants
2. Recursively subdivide until max points per leaf
3. Search tree to find nearby points

Example tree:
          Root (World)
         /  |   |  \
      NW   NE  SW   SE
     / \    ...
   NW1 NE1
```

**Implementation:**

```python
class QuadTree:
    def __init__(self, bounds, max_points=100):
        self.bounds = bounds  # (min_lat, max_lat, min_lng, max_lng)
        self.max_points = max_points
        self.points = []
        self.divided = False
        self.children = [None, None, None, None]  # NW, NE, SW, SE

    def insert(self, point):
        if not self.contains(point):
            return False

        if len(self.points) < self.max_points:
            self.points.append(point)
            return True

        # Subdivide if not already
        if not self.divided:
            self.subdivide()

        # Insert into appropriate child
        for child in self.children:
            if child.insert(point):
                return True

    def subdivide(self):
        min_lat, max_lat, min_lng, max_lng = self.bounds
        mid_lat = (min_lat + max_lat) / 2
        mid_lng = (min_lng + max_lng) / 2

        # Create 4 children
        self.children[0] = QuadTree((mid_lat, max_lat, min_lng, mid_lng))  # NW
        self.children[1] = QuadTree((mid_lat, max_lat, mid_lng, max_lng))  # NE
        self.children[2] = QuadTree((min_lat, mid_lat, min_lng, mid_lng))  # SW
        self.children[3] = QuadTree((min_lat, mid_lat, mid_lng, max_lng))  # SE

        self.divided = True

    def search_radius(self, lat, lng, radius_km):
        # Check if search circle intersects this quad
        if not self.intersects_circle(lat, lng, radius_km):
            return []

        results = []

        # Check points in this quad
        for point in self.points:
            if haversine(lat, lng, point.lat, point.lng) <= radius_km:
                results.append(point)

        # Recursively search children
        if self.divided:
            for child in self.children:
                results.extend(child.search_radius(lat, lng, radius_km))

        return results
```

**Pros:**
- ✅ Efficient for sparse data
- ✅ Dynamic (adapts to data distribution)
- ✅ O(log n) search

**Cons:**
- ❌ Complex to implement
- ❌ Requires rebuilding on updates
- ❌ Memory overhead

### Solution 3: PostgreSQL PostGIS (Production)

**Why PostGIS?**
- Built-in geospatial support
- R-tree index for fast queries
- SQL familiar

**Implementation:**

```sql
-- Enable PostGIS extension
CREATE EXTENSION postgis;

CREATE TABLE businesses (
  business_id UUID PRIMARY KEY,
  name VARCHAR(200),
  category VARCHAR(50),
  rating DECIMAL(2,1),
  price_range INT,  -- 1-4 ($, $$, $$$, $$$$)
  location GEOGRAPHY(POINT, 4326)  -- WGS84 lat/lng
);

-- Create spatial index
CREATE INDEX idx_location ON businesses USING GIST(location);

-- Search within 5km
SELECT business_id, name, rating,
       ST_Distance(location, ST_MakePoint(-122.4194, 37.7749)::geography) as distance
FROM businesses
WHERE ST_DWithin(
    location,
    ST_MakePoint(-122.4194, 37.7749)::geography,
    5000  -- meters
)
AND category = 'restaurant'
AND rating >= 4.0
ORDER BY distance
LIMIT 20;
```

**Pros:**
- ✅ Production-ready
- ✅ Fast (R-tree index)
- ✅ Supports complex queries (polygon search, distance calculations)
- ✅ ACID guarantees

**Cons:**
- ❌ Harder to scale horizontally
- ❌ Postgres-specific (vendor lock-in)

### Solution 4: Redis Geo (Best for Cache)

```python
import redis

r = redis.Redis()

# Add businesses
r.geoadd('businesses', -122.4194, 37.7749, 'biz_123')
r.geoadd('businesses', -122.4084, 37.7849, 'biz_456')

# Search within 5km
results = r.georadius('businesses', -122.4194, 37.7749, 5, unit='km', withdist=True)
# Returns: [('biz_123', 0.0), ('biz_456', 1.2)]

# Get distance between two points
distance = r.geodist('businesses', 'biz_123', 'biz_456', unit='km')
```

**Pros:**
- ✅ Very fast (in-memory)
- ✅ Simple API
- ✅ Good for caching popular searches

**Cons:**
- ❌ No persistence (need to rebuild on restart)
- ❌ Limited filtering (can't filter by rating, etc.)

## Database Design

```sql
CREATE TABLE businesses (
  business_id UUID PRIMARY KEY,
  name VARCHAR(200),
  description TEXT,
  category VARCHAR(50),
  rating DECIMAL(2,1),
  review_count INT,
  price_range INT,
  phone VARCHAR(20),
  website TEXT,
  location GEOGRAPHY(POINT, 4326),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(10),
  created_at TIMESTAMP,

  INDEX idx_category (category),
  INDEX idx_rating (rating),
  SPATIAL INDEX idx_location (location)
);

CREATE TABLE reviews (
  review_id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(business_id),
  user_id UUID,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  text TEXT,
  created_at TIMESTAMP,

  INDEX idx_business (business_id, created_at DESC)
);
```

## API Design

```
GET /api/v1/businesses/search?lat=37.7749&lng=-122.4194&radius=5&category=restaurant&min_rating=4.0&limit=20
Response:
{
  "businesses": [
    {
      "business_id": "abc123",
      "name": "Best Pizza",
      "rating": 4.5,
      "review_count": 250,
      "price_range": 2,
      "distance_km": 0.8,
      "category": "restaurant"
    }
  ],
  "total": 45
}

GET /api/v1/businesses/{business_id}
POST /api/v1/businesses
PUT /api/v1/businesses/{business_id}
DELETE /api/v1/businesses/{business_id}

POST /api/v1/reviews
GET /api/v1/businesses/{business_id}/reviews
```

## Scaling Strategies

### 1. Read Replicas

```
Master (writes) → Business updates
Slaves (reads) → Search queries

10 read replicas = 10x read capacity
```

### 2. Caching Popular Searches

```python
def search_nearby(lat, lng, radius, category):
    # Round lat/lng to reduce cache keys
    cache_key = f"search:{round(lat, 2)}:{round(lng, 2)}:{radius}:{category}"

    # Check cache
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # Query database
    results = db.search_nearby(lat, lng, radius, category)

    # Cache for 5 minutes
    redis.setex(cache_key, 300, json.dumps(results))

    return results
```

### 3. Sharding by Geography

```python
# Shard by region
REGIONS = {
    'us-west': (-125, -110, 32, 49),  # (min_lng, max_lng, min_lat, max_lat)
    'us-east': (-85, -70, 36, 45),
    # ...
}

def get_shard(lat, lng):
    for region, bounds in REGIONS.items():
        min_lng, max_lng, min_lat, max_lat = bounds
        if min_lat <= lat <= max_lat and min_lng <= lng <= max_lng:
            return region
    return 'default'
```

## Monitoring

```
Performance:
- Search latency: p50 < 50ms, p99 < 200ms
- Cache hit rate: > 80%

Business:
- Daily searches: 100M
- Businesses indexed: 500M
- Average results per search: 20
```

## Interview Talking Points

"Yelp's key challenge is geospatial search at scale. I'd use PostgreSQL with PostGIS for production (R-tree index, O(log n) search) and Redis Geo for caching popular searches. For 100M searches/day, use read replicas and cache results (5-min TTL). Shard by geographic region for horizontal scaling. Monitor cache hit rate (>80%) and search latency (p99 < 200ms)."
