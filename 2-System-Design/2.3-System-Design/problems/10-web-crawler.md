# Design Web Crawler

## Problem Statement

Design a distributed web crawler that downloads web pages at scale, respects politeness policies, handles deduplication, and extracts content for indexing (like Googlebot).

## Requirements

### Functional
- Crawl billions of web pages
- Respect robots.txt and crawl-delay
- Deduplication (don't crawl same URL twice)
- Extract and store content
- Handle different content types (HTML, PDF, images)
- Prioritize important pages

### Non-Functional
- **Scale**: 1B pages, 100K pages/sec
- **Politeness**: Max 1 request/sec per domain
- **Reliability**: Handle failures gracefully
- **Freshness**: Recrawl pages periodically

## Capacity Estimation

```
Pages to crawl: 1B pages
Crawl rate: 100K pages/sec
Time to crawl 1B: 1B ÷ 100K = 10,000 seconds = ~3 hours

Storage per page:
- HTML: 100 KB average
- Metadata: 1 KB
- Total: 101 KB

Total storage: 1B × 101 KB = 101 TB

Bandwidth:
- 100K pages/sec × 100 KB = 10 GB/sec
```

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Seed URLs                              │
│  (Starting points: popular sites, sitemaps)              │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                  URL Frontier (Queue)                    │
│  - Priority queue (important URLs first)                │
│  - Distributed queue (Kafka / RabbitMQ)                 │
└────────────────┬────────────────────────────────────────┘
                 │
       ┌─────────┴───────────────────────────┐
       │                                     │
┌──────▼──────────┐              ┌──────────▼──────────┐
│  Crawler Workers│              │  Crawler Workers    │
│  (1000s of      │      ...     │                     │
│   instances)    │              │                     │
└──────┬──────────┘              └──────────┬──────────┘
       │                                     │
       └──────────┬──────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼────────┐    ┌──────▼─────────┐
│  URL Dedup     │    │  Politeness    │
│  (Bloom Filter)│    │  Manager       │
│                │    │  (Rate Limit)  │
└────────────────┘    └────────────────┘
        │
┌───────▼────────────────────────────────────────┐
│            Content Processor                   │
│  - Parse HTML                                  │
│  - Extract links → back to URL Frontier        │
│  - Extract text → Indexer                      │
└───────┬────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────┐
│              Storage Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   HTML   │  │   URLs   │  │  Index   │    │
│  │   (S3)   │  │(Cassandra│  │(ElasticS)│    │
│  └──────────┘  └──────────┘  └──────────┘    │
└────────────────────────────────────────────────┘
```

## Design Decisions

### Decision 1: URL Frontier (Priority Queue)

**Why?**
- Not all pages equally important
- Limited resources → crawl important pages first
- BFS alone doesn't consider page rank

**Implementation:**

```python
class URLFrontier:
    def __init__(self):
        # Multiple queues by priority
        self.queues = {
            'high': PriorityQueue(),    # PageRank > 0.8
            'medium': PriorityQueue(),  # PageRank 0.3-0.8
            'low': PriorityQueue()      # PageRank < 0.3
        }

    def add_url(self, url, priority_score):
        if priority_score > 0.8:
            self.queues['high'].put((priority_score, url))
        elif priority_score > 0.3:
            self.queues['medium'].put((priority_score, url))
        else:
            self.queues['low'].put((priority_score, url))

    def get_next_url(self):
        # Try high priority first
        for queue_name in ['high', 'medium', 'low']:
            if not self.queues[queue_name].empty():
                score, url = self.queues[queue_name].get()
                return url
        return None
```

**Pros:**
- ✅ Crawl important content first
- ✅ Better resource utilization
- ✅ Faster to get valuable pages

**Cons:**
- ❌ Low-priority pages may starve
- ❌ Need to compute priority (PageRank)

### Decision 2: Politeness Manager

**Problem:** Don't overload servers (respect robots.txt, crawl-delay)

```python
class PolitenessManager:
    def __init__(self):
        # Track last request time per domain
        self.last_request = {}  # {domain: timestamp}
        self.min_delay = 1.0  # seconds

    def can_crawl(self, url):
        domain = self.extract_domain(url)

        # Check robots.txt
        if not self.is_allowed_by_robots(url):
            return False

        # Check rate limit
        last_time = self.last_request.get(domain)
        if last_time and (time.time() - last_time) < self.min_delay:
            return False

        return True

    def record_crawl(self, url):
        domain = self.extract_domain(url)
        self.last_request[domain] = time.time()

    def extract_domain(self, url):
        return urllib.parse.urlparse(url).netloc
```

**Distributed Politeness:**

```python
# Use Redis to coordinate across workers
def can_crawl_distributed(url):
    domain = extract_domain(url)
    lock_key = f"crawl_lock:{domain}"

    # Try to acquire lock with 1-second expiry
    acquired = redis.set(lock_key, "1", nx=True, ex=1)

    return acquired  # Only one worker can crawl domain at a time
```

### Decision 3: Deduplication (Bloom Filter)

**Problem:** 1B URLs → need to check "already crawled?" billions of times

**Approach 1: Exact (Hash Set)**

```python
crawled_urls = set()  # In-memory

if url in crawled_urls:
    skip_url()
else:
    crawl_url()
    crawled_urls.add(url)

# Memory: 1B URLs × 64 bytes (hash) = 64 GB (too large for single machine)
```

**Approach 2: Bloom Filter (Production)**

```python
from bloom_filter import BloomFilter

# Bloom filter: probabilistic data structure
# False positive possible, false negative never
bloom = BloomFilter(max_elements=1_000_000_000, error_rate=0.01)

if url in bloom:
    # Probably already crawled (99% sure)
    skip_url()
else:
    crawl_url()
    bloom.add(url)

# Memory: ~1.2 GB (vs 64 GB) - 50x savings!
```

**Pros:**
- ✅ Memory efficient (10-20x smaller)
- ✅ O(1) lookup
- ✅ 1% false positive acceptable

**Cons:**
- ❌ False positives (may skip 1% of URLs)
- ❌ Cannot delete from Bloom filter

**Distributed Bloom Filter:**

```python
# Partition Bloom filter across Redis cluster
def is_crawled(url):
    # Hash URL to shard
    shard = hash(url) % NUM_SHARDS

    # Check Bloom filter in Redis shard
    return redis_shards[shard].bf_exists("crawled_urls", url)
```

## Crawler Worker

```python
class CrawlerWorker:
    def run(self):
        while True:
            # 1. Get URL from frontier
            url = frontier.get_next_url()

            if not url:
                time.sleep(1)  # No URLs, wait
                continue

            # 2. Check if already crawled
            if bloom_filter.exists(url):
                continue

            # 3. Check politeness
            if not politeness_manager.can_crawl(url):
                # Put back in queue for later
                frontier.add_url(url, priority=0.5)
                continue

            # 4. Fetch page
            try:
                response = requests.get(url, timeout=10)
                html = response.text
            except Exception as e:
                logger.error(f"Failed to fetch {url}: {e}")
                continue

            # 5. Mark as crawled
            bloom_filter.add(url)
            politeness_manager.record_crawl(url)

            # 6. Store content
            storage.save(url, html)

            # 7. Extract links
            links = self.extract_links(html, base_url=url)

            # 8. Add links to frontier
            for link in links:
                priority = self.calculate_priority(link)
                frontier.add_url(link, priority)

    def extract_links(self, html, base_url):
        soup = BeautifulSoup(html, 'html.parser')
        links = []

        for a_tag in soup.find_all('a', href=True):
            # Resolve relative URLs
            absolute_url = urljoin(base_url, a_tag['href'])

            # Filter out non-HTTP URLs
            if absolute_url.startswith('http'):
                links.append(absolute_url)

        return links
```

## Robots.txt Handling

```python
class RobotsParser:
    def __init__(self):
        self.cache = {}  # Cache robots.txt per domain

    def is_allowed(self, url):
        domain = extract_domain(url)

        # Check cache
        if domain not in self.cache:
            # Fetch robots.txt
            robots_url = f"https://{domain}/robots.txt"
            try:
                response = requests.get(robots_url, timeout=5)
                self.cache[domain] = robotparser.RobotFileParser()
                self.cache[domain].parse(response.text.split('\n'))
            except:
                # No robots.txt or error → assume allowed
                return True

        # Check if URL allowed
        parser = self.cache[domain]
        return parser.can_fetch("Googlebot", url)
```

## Database Design

```sql
-- Cassandra for URLs (time-series)
CREATE TABLE crawled_urls (
  domain TEXT,
  url TEXT,
  crawled_at TIMESTAMP,
  status_code INT,
  content_hash TEXT,

  PRIMARY KEY (domain, crawled_at, url)
) WITH CLUSTERING ORDER BY (crawled_at DESC);

-- Store HTML in S3
# Key: sha256(url) → HTML content

-- Metadata in PostgreSQL
CREATE TABLE crawl_metadata (
  url_hash VARCHAR(64) PRIMARY KEY,
  url TEXT,
  title TEXT,
  last_crawled TIMESTAMP,
  page_rank DECIMAL(5,4),
  backlinks INT
);
```

## Scaling Strategies

### 1. Horizontal Scaling

```
1 worker: 100 pages/sec
1000 workers: 100K pages/sec

Distribute via Kafka:
- URL frontier = Kafka topic
- Workers consume from topic
- Each worker handles different URLs
```

### 2. DNS Caching

```python
# Avoid repeated DNS lookups
dns_cache = {}

def get_ip(domain):
    if domain in dns_cache:
        return dns_cache[domain]

    ip = socket.gethostbyname(domain)
    dns_cache[domain] = ip
    return ip
```

### 3. Content Deduplication

```python
# Avoid storing duplicate pages (mirrors, copies)
def content_hash(html):
    # Remove whitespace, extract text
    text = re.sub(r'\s+', '', BeautifulSoup(html).get_text())
    return hashlib.sha256(text.encode()).hexdigest()

if content_hash(html) in seen_hashes:
    # Duplicate content, don't store
    skip()
```

## Bottlenecks & Solutions

### Bottleneck 1: URL Frontier becomes huge

**Problem:** Billions of URLs in queue

**Solutions:**
- Use disk-backed queue (Kafka)
- Partition by domain
- Prune low-priority URLs after threshold

### Bottleneck 2: Politeness limits throughput

**Problem:** 1 req/sec per domain = can't crawl fast

**Solutions:**
- Crawl many domains in parallel (not same domain)
- Distribute workers across domains
- Cache domain → worker mapping

### Bottleneck 3: Storage grows infinitely

**Problem:** 100 TB/week of HTML

**Solutions:**
- Compress HTML (gzip: 70% reduction)
- Store only text (discard JS/CSS)
- Archive old crawls to cold storage (Glacier)

## Monitoring

```
Performance:
- Crawl rate: 100K pages/sec
- Average fetch time: p50 < 500ms
- URL frontier depth: < 100M

Reliability:
- Fetch success rate: > 95%
- Duplicate detection rate: > 99%
- Politeness violations: 0

Business:
- Pages crawled per day: 8.64B
- Storage used: 100 TB
- Domains crawled: 10M
```

## Interview Talking Points

"Web crawler's key challenges are scale (1B pages), politeness (respect servers), and deduplication. I'd use distributed queue (Kafka) for URL frontier with priority ranking, Bloom filter for O(1) dedup with 1% false positive rate, and Redis-based rate limiting (1 req/sec per domain). For storage, S3 for HTML and Cassandra for metadata. Scale horizontally with 1000+ workers."
