# Design Real-Time Multiplayer Game Backend

## Problem Statement

Design a real-time multiplayer game backend (like Fortnite, Among Us) that handles low-latency game state synchronization, matchmaking, anti-cheat, and scales to millions of concurrent players.

## Requirements

- Real-time game state sync (< 50ms latency)
- Matchmaking (skill-based, region-based)
- Game server orchestration
- Anti-cheat detection
- Leaderboards
- In-game purchases
- Scale: 10M concurrent players, 100K matches simultaneously

## Architecture

```
Client (Game) → WebSocket/UDP → Game Server (Authoritative) → State DB
                                        ↓
                                 Matchmaking Service
                                        ↓
                                 Anti-Cheat Service
```

## Key Designs

### 1. Client-Server Model (Authoritative Server)

```python
# Server is source of truth (prevents cheating)
class GameServer:
    def __init__(self):
        self.game_state = {
            'players': {},
            'entities': {},
            'tick': 0
        }
        self.tick_rate = 60  # 60 Hz (16.67ms per tick)

    def run(self):
        while True:
            start = time.time()

            # 1. Process player inputs
            for player_id, inputs in self.pending_inputs.items():
                self.process_input(player_id, inputs)

            # 2. Update game state (physics, AI)
            self.update_game_state()

            # 3. Broadcast state to clients
            self.broadcast_state()

            # 4. Sleep to maintain tick rate
            elapsed = time.time() - start
            time.sleep(max(0, 1/self.tick_rate - elapsed))

            self.game_state['tick'] += 1

    def broadcast_state(self):
        # Send only delta (changed entities)
        delta = self.compute_delta()

        for player in self.players:
            # Area of Interest (only nearby entities)
            relevant_delta = self.filter_by_aoi(player, delta)

            # Compress and send
            player.send(msgpack.packb(relevant_delta))
```

### 2. Client-Side Prediction & Server Reconciliation

```javascript
// Client predicts movements immediately (no waiting for server)
class GameClient {
  onInput(input) {
    // 1. Apply input locally (instant feedback)
    this.applyInput(input);

    // 2. Send to server
    this.sendToServer({
      input: input,
      sequence: this.sequenceNumber++,
      timestamp: Date.now()
    });

    // 3. Store for reconciliation
    this.pendingInputs.push({seq: this.sequenceNumber, input});
  }

  onServerState(serverState) {
    // Server sends back authoritative state with last processed sequence
    const lastProcessedSeq = serverState.lastProcessedInput;

    // Remove confirmed inputs
    this.pendingInputs = this.pendingInputs.filter(i => i.seq > lastProcessedSeq);

    // Set to server state
    this.gameState = serverState;

    // Re-apply unconfirmed inputs (reconciliation)
    for (const pending of this.pendingInputs) {
      this.applyInput(pending.input);
    }
  }
}
```

### 3. Lag Compensation

```python
# Hit detection with lag compensation
def check_hit(shooter, target, timestamp):
    # Rewind game state to shooter's timestamp
    past_state = rewind_to_timestamp(timestamp)

    # Check hit in past state (where shooter saw target)
    hit = ray_intersects(shooter.aim, past_state.players[target].position)

    return hit

# Prevents "I shot him but missed" due to lag
```

### 4. Matchmaking

```python
class Matchmaker:
    def find_match(self, player):
        # Criteria:
        # 1. Skill rating (±200 ELO)
        # 2. Region (same region preferred)
        # 3. Wait time (expand criteria after 30s)

        skill_range = 200
        max_wait = player.wait_time_seconds

        # Expand skill range over time
        if max_wait > 30:
            skill_range += (max_wait - 30) * 10  # +10 ELO per second

        # Find candidates
        candidates = redis.zrangebyscore(
            f'queue:{player.region}',
            player.elo - skill_range,
            player.elo + skill_range
        )

        if len(candidates) >= 10:  # Need 10 players
            # Create match
            match_id = create_match(candidates[:10])

            # Provision game server
            server = allocate_game_server(region=player.region)
            server.initialize_match(match_id, candidates)

            # Notify players
            for player_id in candidates:
                notify(player_id, {'match_id': match_id, 'server_ip': server.ip})

            return match_id
```

### 5. Game Server Fleet Management

```python
# Kubernetes-based auto-scaling
class GameServerOrchestrator:
    def scale_fleet(self):
        # Metrics
        active_matches = len(get_active_matches())
        available_servers = len(get_idle_servers())

        # Each server handles 1 match (50 players)
        needed = active_matches
        buffer = 100  # Keep 100 spare servers

        target = needed + buffer

        if available_servers < target:
            # Scale up
            k8s.scale_deployment('game-server', replicas=target)
        elif available_servers > target + 200:
            # Scale down
            k8s.scale_deployment('game-server', replicas=target)

# Dedicated game servers (not peer-to-peer)
# Benefits: Authoritative (anti-cheat), Low latency (regional)
```

### 6. Anti-Cheat

```python
def detect_cheats(player):
    # 1. Impossible movement (teleportation)
    if distance(player.last_pos, player.current_pos) > max_speed * delta_time:
        flag_player(player, 'impossible_movement')

    # 2. Aimbot detection (too accurate)
    if player.headshot_percentage > 80:  # Pros are ~50%
        flag_player(player, 'aimbot_suspected')

    # 3. Wallhack (shot through walls)
    if not line_of_sight(player.pos, target.pos) and player.hit_target:
        flag_player(player, 'wallhack')

    # 4. Modified client detection
    client_hash = hash(player.game_files)
    if client_hash != official_hash:
        ban_player(player, 'modified_client')
```

## Database Design

```sql
CREATE TABLE players (
  player_id UUID PRIMARY KEY,
  username VARCHAR(50),
  elo_rating INT DEFAULT 1000,
  region VARCHAR(20),
  total_matches INT,
  wins INT,
  kills INT,
  deaths INT
);

CREATE TABLE matches (
  match_id UUID PRIMARY KEY,
  game_server_id UUID,
  status VARCHAR(20),  -- waiting, in_progress, completed
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE TABLE match_players (
  match_id UUID,
  player_id UUID,
  team INT,
  kills INT,
  deaths INT,
  placement INT,  -- 1st, 2nd, 3rd...
  elo_change INT,
  PRIMARY KEY (match_id, player_id)
);
```

## Leaderboards (Redis Sorted Set)

```python
# Update player ELO after match
redis.zadd('leaderboard:global', {player_id: new_elo})
redis.zadd(f'leaderboard:region:{region}', {player_id: new_elo})

# Get top 100
top_players = redis.zrevrange('leaderboard:global', 0, 99, withscores=True)

# Get player's rank
rank = redis.zrevrank('leaderboard:global', player_id)
```

## Network Optimization

```python
# Use UDP instead of TCP (lower latency, no retransmission delays)
# Acceptable to lose packets in games (just get next update)

# Delta compression (only send changes)
def compute_delta(prev_state, current_state):
    delta = {}
    for entity_id, entity in current_state.items():
        if entity_id not in prev_state or prev_state[entity_id] != entity:
            delta[entity_id] = entity
    return delta  # 90% smaller than full state

# Interest management (only send nearby entities)
def get_aoi(player, radius=100):
    # Only send entities within 100m
    nearby = quadtree.query_range(player.position, radius)
    return nearby
```

## Monitoring

```
Performance:
- Server tick rate: 60 Hz (16.67ms)
- Client-server latency: p50 < 30ms, p99 < 100ms
- Server CPU: < 70%

Matchmaking:
- Average queue time: < 60s
- Skill balance: avg team ELO diff < 50

Anti-Cheat:
- Cheat detection rate: 95%
- False positive rate: < 1%

Business:
- Concurrent players: 10M
- Active matches: 100K
- Average session: 30 minutes
```

## Interview Talking Points

"Real-time game needs authoritative server (anti-cheat), client prediction (responsiveness), and lag compensation (fairness). Use UDP for low latency, delta compression (90% bandwidth savings), and area-of-interest filtering. Matchmaking with ELO ±200, expand range over time. Orchestrate game servers on K8s with auto-scaling. Anti-cheat: detect impossible movements, aimbot, wallhacks. Leaderboards in Redis sorted sets."
