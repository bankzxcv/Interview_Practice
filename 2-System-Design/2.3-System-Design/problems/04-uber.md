# Design Uber/Lyft

## Problem Statement

Design a ride-sharing platform like Uber/Lyft that matches riders with nearby drivers in real-time, handles navigation, payments, and provides estimated arrival times.

## Requirements Clarification

### Functional Requirements

- Match riders with nearby available drivers
- Real-time location tracking for drivers
- Estimated time of arrival (ETA) and fare calculation
- Trip tracking and navigation
- Payment processing
- Ride history and ratings
- Surge pricing during high demand

### Non-Functional Requirements

- **High availability**: 99.99% uptime (critical service)
- **Low latency**: Driver matching < 2 seconds
- **Real-time updates**: Location updates every 4 seconds
- **Scale**: 100M users, 10M daily rides, 1M active drivers
- **Accuracy**: ETA within 10% of actual
- **Consistency**: Strong for payments, eventual for location

### Out of Scope

- Food delivery (Uber Eats)
- Multi-stop rides
- Scheduled rides
- Driver onboarding/background checks

## Capacity Estimation

### Users & Traffic

```
Users:
- 100M total riders
- 50M monthly active riders
- 10M daily active riders (DAU)
- 5M drivers (1M active daily)

Daily Rides:
- 10M rides per day
- Average: 10M ÷ 86,400 = ~116 rides/sec
- Peak (rush hour, 3x): ~350 rides/sec

Location Updates:
- 1M active drivers × 1 update/4 sec = 250,000 updates/sec
- Plus rider location during trip: ~100,000 updates/sec
- Total: ~350,000 location updates/sec
```

### Storage (5 Years)

```
Rides per day: 10M
Total rides: 10M × 365 × 5 = 18.25B rides

Ride Data:
- Per ride: rider_id, driver_id, start/end location, route, price, duration
- Size: ~2KB per ride
- Total: 18.25B × 2KB = 36.5TB

Location History:
- 1M drivers × 250 updates/day × 100 bytes = 25GB/day
- 5 years: 25GB × 365 × 5 = 45TB

User Profiles:
- 100M riders + 5M drivers × 5KB = 525GB (negligible)

Total Storage: ~82TB (with 3x replication: ~250TB)
```

### Bandwidth

```
Location updates: 350,000/sec × 100 bytes = 35MB/sec
Driver matching queries: 350 rides/sec × 1KB = 350KB/sec
Map tile requests: Heavy (handled by CDN)

Total: ~40MB/sec (excluding CDN)
```

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client Applications                        │
│  (Rider App, Driver App - iOS/Android/Web)                   │
└────────────────┬─────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                       API Gateway                             │
│  (Rate limiting, Auth, Routing)                               │
└────────────────┬─────────────────────────────────────────────┘
                 │
       ┌─────────┴─────────────────────────────────────┐
       │                                                │
┌──────▼──────────┐                          ┌─────────▼─────────┐
│  Location       │                          │  Ride Matching    │
│  Service        │                          │  Service          │
│  (WebSocket)    │                          │                   │
└──────┬──────────┘                          └─────────┬─────────┘
       │                                                │
       │                                        ┌───────▼──────────┐
       │                                        │  Geospatial DB   │
       │                                        │  (Redis +        │
       │                                        │   QuadTree)      │
       │                                        └──────────────────┘
       │
┌──────▼─────────────────────────────────────────────────────────┐
│               Message Queue (Kafka)                             │
│  Topics: location-update, ride-requested, ride-completed        │
└──────┬─────────────────────────────────────────────────────────┘
       │
       └─────────┬────────────────┬────────────────┬──────────────┐
                 │                │                │              │
       ┌─────────▼───────┐ ┌─────▼──────┐  ┌─────▼──────┐  ┌────▼─────┐
       │  ETA Service    │ │  Payment   │  │  Pricing   │  │Analytics │
       │                 │ │  Service   │  │  Service   │  │          │
       └─────────────────┘ └────────────┘  └────────────┘  └──────────┘
                                │
                         ┌──────▼───────┐
                         │  Payment     │
                         │  Gateway     │
                         │  (Stripe)    │
                         └──────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        Data Layer                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │   Cassandra  │  │  Redis Cache │       │
│  │ (Users, Rides│  │ (Locations,  │  │ (Sessions,   │       │
│  │  Payments)   │  │  History)    │  │  Geo Index)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   External Services                           │
│  Maps API (Google Maps), SMS/Push (Twilio), Monitoring       │
└──────────────────────────────────────────────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: WebSocket for Real-Time Location Updates

**Why?**
- Persistent connection avoids repeated handshakes
- Server can push updates to clients instantly
- Lower overhead than HTTP polling

**Pros:**
- ✅ Real-time bidirectional communication
- ✅ Lower latency than polling (no request/response cycles)
- ✅ Efficient for frequent updates (every 4 seconds)
- ✅ Server can push ride updates to clients

**Cons:**
- ❌ Connection management complexity (reconnection logic)
- ❌ Load balancer needs sticky sessions or support WebSocket
- ❌ Higher memory usage (maintain open connections)
- ❌ Scaling requires managing millions of connections

**When to use:**
- Real-time updates required (< 5 sec latency)
- Bidirectional communication needed
- Frequent updates (> 1 per minute)

**Alternative:**
- Server-Sent Events (SSE) for one-way updates
- HTTP polling for simpler implementation (higher latency/cost)

### Decision 2: Geospatial Indexing with QuadTree + Redis

**Why?**
- Need to find "nearby drivers" efficiently
- Lat/long queries on SQL very slow (full table scan)
- QuadTree divides space recursively
- Redis Geo provides built-in geospatial indexing

**Approach: Redis GEOADD/GEORADIUS**

```python
# Add driver location
redis.geoadd('drivers:available', longitude, latitude, driver_id)

# Find drivers within 5km of rider
drivers = redis.georadius('drivers:available',
                          rider_lon, rider_lat,
                          5, 'km',
                          count=10)
```

**Pros:**
- ✅ O(log N) search time with geohashing
- ✅ Built-in support in Redis
- ✅ Simple API
- ✅ Handles updates efficiently (constant time)

**Cons:**
- ❌ Redis memory limited (need sharding for 1M+ drivers)
- ❌ No persistence by default (need AOF/RDB)
- ❌ Geohash precision affects accuracy

**When to use:**
- Need proximity search (find nearby items)
- Data fits in memory
- High read/write throughput

**Alternative:**
- **QuadTree** (custom implementation): Better for non-uniform distribution
- **Geohash + PostgreSQL**: Use PostGIS extension
- **Google S2**: Better for global scale (handles spherical geometry)

**QuadTree Deep Dive:**

```
Split world into 4 quadrants recursively:
Level 0: Entire world
Level 1: 4 quadrants
Level 2: 16 quadrants
...
Level 10: 1M+ quadrants

Each leaf node contains drivers in that region.
Query: Find leaf for rider location, search nearby leaves.

Time Complexity: O(log N) insert, O(k log N) search (k = results)
```

### Decision 3: PostgreSQL for Rides, Cassandra for Location History

**Why PostgreSQL for rides?**
- ACID transactions needed (payment + ride creation)
- Complex queries (ride history, analytics)
- Moderate scale (10M rides/day manageable)
- Relationships between users, drivers, rides

**Why Cassandra for location history?**
- Time-series data (append-only)
- Massive write throughput (350K updates/sec)
- No complex joins needed
- TTL support (expire old data automatically)

**Pros:**
- ✅ Right tool for each use case
- ✅ PostgreSQL: ACID for critical transactions
- ✅ Cassandra: High write throughput for locations
- ✅ Independent scaling

**Cons:**
- ❌ Complexity of managing two databases
- ❌ Need to join data in application layer
- ❌ Different expertise required

**When to use:**
- Different data access patterns
- One dataset much larger than other
- Different consistency requirements

**Alternative:**
- Single PostgreSQL with partitioning (simpler, limits scale)
- DynamoDB for both (fully managed, higher cost)

## Database Design

### Rides (PostgreSQL)

```sql
CREATE TABLE rides (
  ride_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id),
  driver_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL, -- requested, matched, in_progress, completed, cancelled

  -- Location
  pickup_lat DECIMAL(9,6),
  pickup_lng DECIMAL(9,6),
  dropoff_lat DECIMAL(9,6),
  dropoff_lng DECIMAL(9,6),

  -- Pricing
  estimated_fare DECIMAL(10,2),
  actual_fare DECIMAL(10,2),
  surge_multiplier DECIMAL(3,2) DEFAULT 1.0,

  -- Timing
  requested_at TIMESTAMP DEFAULT NOW(),
  matched_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,

  -- Ratings
  rider_rating INT CHECK (rider_rating BETWEEN 1 AND 5),
  driver_rating INT CHECK (driver_rating BETWEEN 1 AND 5),

  INDEX idx_rider (rider_id, requested_at DESC),
  INDEX idx_driver (driver_id, requested_at DESC),
  INDEX idx_status (status, requested_at)
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  type VARCHAR(10) NOT NULL, -- rider, driver
  name VARCHAR(100),
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  average_rating DECIMAL(3,2),
  total_rides INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
  payment_id UUID PRIMARY KEY,
  ride_id UUID REFERENCES rides(ride_id),
  amount DECIMAL(10,2),
  status VARCHAR(20), -- pending, completed, failed
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100), -- Stripe transaction ID
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Design Critique:**

**Why denormalize average_rating?**
- ✅ Display on every driver/rider profile (very frequent)
- ✅ Avoid expensive aggregation query
- ❌ Need to update after each ride
- ❌ Potential race conditions

**Solution:** Use database trigger or event-driven update via Kafka.

### Location History (Cassandra)

```cql
CREATE TABLE driver_locations (
  driver_id UUID,
  timestamp TIMESTAMP,
  latitude DECIMAL,
  longitude DECIMAL,
  heading INT, -- 0-359 degrees
  speed DECIMAL, -- km/h

  PRIMARY KEY (driver_id, timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC)
  AND default_time_to_live = 2592000; -- 30 days TTL

CREATE TABLE active_drivers (
  grid_id TEXT, -- Geohash prefix (e.g., "9q8y")
  driver_id UUID,
  latitude DECIMAL,
  longitude DECIMAL,
  last_updated TIMESTAMP,

  PRIMARY KEY (grid_id, driver_id)
) WITH default_time_to_live = 3600; -- 1 hour TTL
```

**Design Critique:**

**Why partition by driver_id instead of timestamp?**
- ✅ Query pattern: "Get locations for driver X"
- ✅ All locations for one driver in same partition
- ❌ Hot partitions for very active drivers

**Why TTL?**
- ✅ Automatically expire old data (save storage)
- ✅ Compliance (GDPR - don't keep location > 30 days)
- ✅ Cassandra handles deletion efficiently

## API Design

```
POST /api/v1/rides
Authorization: Bearer <token>
Request:
{
  "pickup": {"lat": 37.7749, "lng": -122.4194},
  "dropoff": {"lat": 37.8044, "lng": -122.2712},
  "vehicle_type": "standard" // or "premium", "shared"
}
Response:
{
  "ride_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "searching",
  "estimated_fare": 25.50,
  "surge_multiplier": 1.5,
  "eta_seconds": 120
}

GET /api/v1/rides/{ride_id}
Response:
{
  "ride_id": "...",
  "status": "matched",
  "driver": {
    "id": "...",
    "name": "John Doe",
    "rating": 4.8,
    "vehicle": "Toyota Camry - ABC123",
    "location": {"lat": 37.7750, "lng": -122.4195},
    "eta_seconds": 180
  }
}

POST /api/v1/rides/{ride_id}/cancel
DELETE /api/v1/rides/{ride_id}

PUT /api/v1/drivers/location
Request:
{
  "location": {"lat": 37.7749, "lng": -122.4194},
  "heading": 270,
  "speed": 45.5
}

GET /api/v1/rides/history?limit=20&offset=0
```

## Driver Matching Algorithm

### Approach 1: Nearest Driver (Naive)

```python
def match_driver(rider_location, radius_km=5):
    # Find all available drivers within radius
    drivers = redis.georadius('drivers:available',
                              rider_location.lng,
                              rider_location.lat,
                              radius_km, 'km',
                              withdist=True)

    if not drivers:
        return None  # No drivers available

    # Return closest driver
    closest = min(drivers, key=lambda d: d['distance'])
    return closest['driver_id']
```

**Pros:**
- ✅ Simple implementation
- ✅ Low latency (single Redis query)
- ✅ Fair to riders (get closest driver)

**Cons:**
- ❌ Ignores driver direction (driver going away)
- ❌ Ignores traffic conditions
- ❌ Not optimal for driver earnings
- ❌ Can lead to driver starvation

**When to use:**
- MVP / Simple markets
- Low driver density

### Approach 2: ETA-Based Matching (Production)

```python
def match_driver(rider_location, dropoff_location):
    # 1. Find candidates within radius
    candidates = redis.georadius('drivers:available',
                                  rider_location.lng,
                                  rider_location.lat,
                                  10, 'km',
                                  count=20)

    # 2. Calculate score for each driver
    scores = []
    for driver in candidates:
        driver_loc = get_driver_location(driver.id)

        # ETA to pickup
        eta_to_pickup = maps_api.get_eta(driver_loc, rider_location)

        # Driver direction score
        heading_score = calculate_heading_score(
            driver.heading,
            driver_loc,
            rider_location
        )

        # Historical acceptance rate
        acceptance_rate = get_acceptance_rate(driver.id)

        # Combined score
        score = (
            -eta_to_pickup * 1.0 +  # Minimize ETA
            heading_score * 0.3 +    # Prefer drivers heading towards pickup
            acceptance_rate * 0.2    # Prefer reliable drivers
        )

        scores.append((driver.id, score))

    # 3. Offer to best driver first
    scores.sort(key=lambda x: x[1], reverse=True)

    for driver_id, score in scores:
        if offer_ride(driver_id, timeout=10):  # 10 sec to accept
            return driver_id

    return None  # No driver accepted
```

**Pros:**
- ✅ Considers traffic (via Maps API)
- ✅ Accounts for driver direction
- ✅ Better rider experience (faster pickup)
- ✅ Fallback if top driver declines

**Cons:**
- ❌ Higher latency (multiple API calls)
- ❌ Cost (Maps API calls)
- ❌ Complexity

**When to use:**
- Production systems
- High driver density
- Quality > speed

### Approach 3: Batch Matching (Shared Rides)

```python
def batch_match(pending_rides, interval=5):
    """Run every 5 seconds to match multiple rides."""

    # 1. Group rides by region (geohash prefix)
    regions = group_by_region(pending_rides)

    # 2. For each region, solve assignment problem
    for region, rides in regions.items():
        drivers = get_available_drivers(region)

        # 3. Build cost matrix (driver × ride)
        cost_matrix = []
        for driver in drivers:
            row = []
            for ride in rides:
                eta = calculate_eta(driver.location, ride.pickup)
                row.append(eta)
            cost_matrix.append(row)

        # 4. Solve using Hungarian algorithm (O(n³))
        assignments = hungarian_algorithm(cost_matrix)

        # 5. Create matches
        for driver_idx, ride_idx in assignments:
            match_driver_to_ride(drivers[driver_idx], rides[ride_idx])
```

**Pros:**
- ✅ Global optimization (minimize total ETA)
- ✅ Better for shared rides
- ✅ Higher efficiency

**Cons:**
- ❌ Delay (wait for batch window)
- ❌ Computational complexity O(n³)
- ❌ Not suitable for low-latency matching

**When to use:**
- Shared/pooled rides
- Low real-time requirements
- High utilization priority

## ETA Calculation

### Approach 1: Straight-Line Distance (Naive)

```python
from math import radians, cos, sin, asin, sqrt

def haversine(lat1, lon1, lat2, lon2):
    """Calculate distance in km between two lat/lng points."""
    R = 6371  # Earth radius in km

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))

    return R * c

def estimate_eta(driver_loc, rider_loc, avg_speed_kmh=40):
    distance_km = haversine(driver_loc.lat, driver_loc.lng,
                            rider_loc.lat, rider_loc.lng)

    eta_hours = distance_km / avg_speed_kmh
    eta_seconds = eta_hours * 3600

    return eta_seconds
```

**Pros:**
- ✅ Fast (no external API)
- ✅ No cost
- ✅ Works offline

**Cons:**
- ❌ Ignores roads (straight line)
- ❌ Ignores traffic
- ❌ Inaccurate in cities (can be 2-3x off)

**When to use:**
- Low-traffic rural areas
- Rough estimates
- Fallback when API unavailable

### Approach 2: Maps API (Production)

```python
def estimate_eta(driver_loc, rider_loc):
    response = google_maps.directions(
        origin=f"{driver_loc.lat},{driver_loc.lng}",
        destination=f"{rider_loc.lat},{rider_loc.lng}",
        mode="driving",
        departure_time="now",  # Include real-time traffic
        traffic_model="best_guess"
    )

    if response['status'] == 'OK':
        duration = response['routes'][0]['legs'][0]['duration_in_traffic']
        return duration['value']  # seconds

    # Fallback to haversine
    return estimate_eta_haversine(driver_loc, rider_loc)
```

**Pros:**
- ✅ Accurate (accounts for roads, traffic)
- ✅ Real-time traffic data
- ✅ Reliable

**Cons:**
- ❌ Cost ($5 per 1000 requests)
- ❌ Latency (~200-500ms per request)
- ❌ External dependency

**Cost Analysis:**
```
Daily ETA calculations:
- 10M rides × 20 candidates × 1 ETA = 200M requests/day
- Cost: 200M ÷ 1000 × $5 = $1M/day

Optimization:
- Cache ETAs by grid (15-min TTL)
- Batch requests
- Use haversine for pre-filtering
- Actual: ~50M requests/day = $250K/day
```

## Surge Pricing

```python
def calculate_surge_multiplier(region, current_time):
    # 1. Get demand (ride requests in last 5 min)
    demand = redis.zcount(f'ride_requests:{region}',
                          current_time - 300,
                          current_time)

    # 2. Get supply (available drivers)
    supply = redis.zcard(f'drivers:{region}')

    # 3. Calculate ratio
    if supply == 0:
        return MAX_SURGE  # 5.0x

    ratio = demand / supply

    # 4. Map ratio to multiplier
    if ratio < 1.0:
        return 1.0  # No surge
    elif ratio < 2.0:
        return 1.5
    elif ratio < 3.0:
        return 2.0
    elif ratio < 5.0:
        return 3.0
    else:
        return 5.0  # Max surge
```

**Design Critique:**

**Why time-based windows instead of real-time?**
- ✅ Smooth out spikes (avoid extreme surge)
- ✅ Easier to explain to users
- ❌ Slower to react to sudden demand

**Why caps at 5.0x?**
- ✅ Regulatory compliance
- ✅ User trust (avoid price gouging perception)
- ❌ May not be enough to balance supply/demand

## Scaling Strategies

### 1. Geosharding

```python
# Partition by geographic region
REGIONS = ['us-west', 'us-east', 'eu-west', 'asia-pacific']

def get_region(location):
    # Map lat/lng to region
    if location.lng < -100:
        return 'us-west'
    elif location.lng < -50:
        return 'us-east'
    # ...

# Each region has its own:
# - Redis instance (geospatial index)
# - Database shard (rides, users)
# - WebSocket servers (driver connections)
```

**Pros:**
- ✅ Scales horizontally
- ✅ Reduces latency (geographically close)
- ✅ Fault isolation (region failure)

**Cons:**
- ❌ Cross-region rides (edge cases)
- ❌ Complexity in managing shards

### 2. Read Replicas for Ride History

```
Master (writes) → Ride completed
  ↓
Slaves (reads) → Ride history queries
```

**Pros:**
- ✅ Offload read traffic from master
- ✅ Faster historical queries

**Cons:**
- ❌ Replication lag (stale data)

### 3. CDN for Maps & Static Assets

```
Client → CloudFront → S3 (map tiles, icons)
```

**Benefit:**
- 95% offload from origin
- < 50ms latency globally

## Bottlenecks & Solutions

### Bottleneck 1: Location Update Storm

**Problem:** 1M drivers × 1 update/4 sec = 250K writes/sec

**Solutions:**
- Use Redis for in-memory writes (100K+ writes/sec per instance)
- Cluster Redis (10 instances = 1M writes/sec)
- Batch updates (collect 10 updates, write once)
- Only update if moved > 50 meters (reduce by 70%)

### Bottleneck 2: Maps API Cost

**Problem:** $250K/day on ETA calculations

**Solutions:**
- Cache ETA by grid pair (15-min TTL)
- Pre-compute ETAs for popular routes
- Use haversine for filtering, Maps API for top 5 candidates only
- Self-host routing engine (OSRM) for high volume

### Bottleneck 3: Matching Latency During Surge

**Problem:** 10K ride requests/sec during New Year's Eve

**Solutions:**
- Scale matching service horizontally (100+ instances)
- Partition by region (independent matching)
- Increase timeout (accept slower matching during surge)

## Monitoring & Metrics

```
Performance:
- Match time: p50 < 2s, p99 < 10s
- Location update latency: p50 < 500ms
- ETA accuracy: within 10% actual

Availability:
- Uptime: 99.99% (52 min/year)
- Error rate: < 0.1%

Business:
- Match rate: > 95% (rides matched vs requested)
- Driver utilization: hours with passenger / hours online
- Surge frequency: % time surge active
- Revenue: rides × average fare

Alerts:
- Match rate < 80% for 5 min
- Location update lag > 10 sec
- Payment failure rate > 1%
- Database query p99 > 500ms
```

## Security

1. **Location Privacy:** Encrypt in transit (TLS), mask precise location
2. **Payment Security:** PCI compliance, tokenization (Stripe)
3. **Authentication:** JWT with refresh tokens
4. **Rate Limiting:** Prevent spam ride requests
5. **Fraud Detection:** ML models for suspicious patterns
6. **Driver Verification:** Background checks, document verification

## Interview Talking Points

### Geospatial Indexing

"The critical challenge is finding nearby drivers efficiently. I'd use Redis GEORADIUS with geohashing for O(log N) lookups. For global scale, I'd consider Google S2 or QuadTree for better handling of non-uniform distribution."

### Real-Time Updates

"I'd use WebSocket for real-time location updates to maintain persistent connections. This is more efficient than polling for 350K updates/sec. Challenge is connection management at scale - need sticky sessions or connection registry."

### Matching Algorithm

"I'd start with ETA-based matching considering driver direction and traffic. For shared rides, batch matching with Hungarian algorithm optimizes global utilization. Trade-off is latency vs optimization - real-time rides need < 2s matching."

### Database Choice

"I'd use PostgreSQL for rides (ACID for payments), Cassandra for location history (high write throughput, TTL support). This is polyglot persistence - right tool for right job."

### Surge Pricing

"Surge pricing is supply/demand balancing. Calculate demand/supply ratio per region every 5 minutes. Cap at 5x for regulatory compliance. Challenge is balancing revenue vs user trust."
