# Design Multi-Tenant SaaS Platform

## Problem Statement

Design a multi-tenant Software-as-a-Service (SaaS) platform that serves thousands of customers (tenants) from a shared infrastructure while ensuring data isolation, customization, and fair resource allocation. Think Salesforce, Slack for Enterprise, or Shopify.

## Requirements Clarification

### Functional Requirements

- **Tenant management**: Onboard, configure, and manage thousands of tenants
- **Data isolation**: Each tenant's data completely isolated from others
- **Customization**: Tenants can customize UI, workflows, features
- **User management**: Multiple users per tenant with roles/permissions
- **Billing & metering**: Track usage per tenant for billing
- **Tenant-specific configuration**: Different pricing tiers, feature flags

### Non-Functional Requirements

- **Isolation**: Complete data and security isolation between tenants
- **Performance**: No tenant can degrade others' performance (noisy neighbor)
- **Scalability**: Support 10,000+ tenants, 1M+ users
- **High availability**: 99.95% uptime SLA
- **Compliance**: Support different data residency requirements (GDPR, etc.)
- **Cost efficiency**: Maximize resource sharing while maintaining isolation

### Out of Scope

- Specific business logic (varies by application)
- Mobile apps
- Third-party integrations

## Key Challenges in Multi-Tenancy

1. **Data Isolation vs Cost Efficiency**: Separate DB per tenant vs shared DB
2. **Performance Isolation**: Prevent one tenant from affecting others
3. **Schema Customization**: Allow tenant-specific fields/tables
4. **Scalability**: Handle growth from 10 to 10,000 tenants
5. **Data Residency**: Store EU data in EU, US data in US (compliance)

## High-Level Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     Client Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Tenant A │  │ Tenant B │  │ Tenant C │                │
│  │  Users   │  │  Users   │  │  Users   │                │
│  └──────────┘  └──────────┘  └──────────┘                │
└────────────────┬───────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────┐
│              CDN + WAF (CloudFlare)                        │
│  - DDoS protection                                         │
│  - SSL termination                                         │
└────────────────┬───────────────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────────────┐
│         Load Balancer (with tenant routing)                │
│  - Extract tenant_id from subdomain/header                 │
│  - Route to appropriate region/cluster                     │
└────────────────┬───────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌───────▼─────────────────▼──────────────────────────────────┐
│              API Gateway (Kong / AWS API Gateway)          │
│  - Authentication (JWT with tenant_id)                     │
│  - Rate limiting (per tenant)                              │
│  - Routing to services                                     │
└───────┬────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────┐
│                    Service Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │  Tenant  │  │ Business │  │ Billing  │  │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  All services tenant-aware (tenant_id in every request)   │
└───────┬────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────┐
│                   Data Layer (Critical!)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Choose ONE of these strategies:              │  │
│  │  1. Database per tenant (highest isolation)         │  │
│  │  2. Schema per tenant (medium isolation)            │  │
│  │  3. Shared schema with tenant_id (lowest cost)      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Design Decisions & Critiques

### Decision 1: Multi-Tenancy Database Strategy

This is the MOST CRITICAL decision in multi-tenant architecture.

---

#### Option 1: Separate Database per Tenant

```
Tenant A → Database A
Tenant B → Database B
Tenant C → Database C
...
Tenant 1000 → Database 1000
```

**Implementation:**

```python
# Tenant configuration
TENANT_DB_CONFIG = {
    'tenant_a': {
        'host': 'db-cluster-1.us-east-1.rds.amazonaws.com',
        'database': 'tenant_a',
        'credentials': 'secret/tenant_a/db'
    },
    'tenant_b': {
        'host': 'db-cluster-1.us-east-1.rds.amazonaws.com',
        'database': 'tenant_b',
        'credentials': 'secret/tenant_b/db'
    }
}

# Connection pool per tenant
class TenantDatabaseManager:
    def __init__(self):
        self.pools = {}

    def get_connection(self, tenant_id):
        if tenant_id not in self.pools:
            config = TENANT_DB_CONFIG[tenant_id]
            self.pools[tenant_id] = create_connection_pool(config)

        return self.pools[tenant_id].get_connection()

# Usage in API
@app.route('/api/orders')
def get_orders():
    tenant_id = extract_tenant_id(request)  # From JWT or subdomain

    db = db_manager.get_connection(tenant_id)
    orders = db.execute("SELECT * FROM orders WHERE user_id = ?", user_id)

    return jsonify(orders)
```

**Pros:**
- ✅ **Strongest isolation** (complete database separation)
- ✅ **Performance isolation** (one tenant can't slow down others)
- ✅ **Easy to backup/restore** single tenant
- ✅ **Easy to migrate** tenant to different region/cluster
- ✅ **Customization** (tenant-specific schema changes)
- ✅ **Compliance** (data residency requirements)
- ✅ **Security** (breach limited to single tenant)

**Cons:**
- ❌ **High cost** (1000 tenants = 1000 databases!)
- ❌ **Management overhead** (schema migrations × 1000)
- ❌ **Resource waste** (small tenants don't need full database)
- ❌ **Connection pool limits** (can't have 1000 pools)
- ❌ **Cross-tenant analytics** difficult

**When to use:**
- Enterprise/large tenants (100+ users each)
- Strict compliance requirements (healthcare, finance)
- High revenue per tenant justifies cost
- Tenants need custom schema

**Cost Analysis:**
```
Database: AWS RDS PostgreSQL
- Small instance (db.t3.medium): $60/month
- 1000 tenants × $60 = $60,000/month

If tenants pay $500/month → $500K revenue
Cost ratio: 12% (acceptable)

If tenants pay $50/month → $50K revenue
Cost ratio: 120% (not sustainable!)
```

**This is what Salesforce does for their largest customers.**

---

#### Option 2: Shared Database, Separate Schema per Tenant

```
Database 1:
  ├─ Schema: tenant_a
  │    ├─ users
  │    ├─ orders
  │    └─ products
  ├─ Schema: tenant_b
  │    ├─ users
  │    ├─ orders
  │    └─ products
  └─ Schema: tenant_c
       ├─ users
       ├─ orders
       └─ products
```

**Implementation:**

```python
# PostgreSQL schemas
def create_tenant_schema(tenant_id):
    db.execute(f"CREATE SCHEMA IF NOT EXISTS {tenant_id}")
    db.execute(f"""
        CREATE TABLE {tenant_id}.users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(255)
        )
    """)
    db.execute(f"""
        CREATE TABLE {tenant_id}.orders (
            id SERIAL PRIMARY KEY,
            user_id INT,
            total DECIMAL(10, 2)
        )
    """)

# Set schema search path per request
@app.route('/api/orders')
def get_orders():
    tenant_id = extract_tenant_id(request)

    # Set schema for this session
    db.execute(f"SET search_path TO {tenant_id}")

    # Now queries automatically use tenant's schema
    orders = db.execute("SELECT * FROM orders WHERE user_id = ?", user_id)

    return jsonify(orders)
```

**Pros:**
- ✅ **Good isolation** (data in separate schemas)
- ✅ **Lower cost** than separate databases (share infrastructure)
- ✅ **Tenant-specific customization** (add columns to schema)
- ✅ **Easy backup/restore** per tenant (schema-level)
- ✅ **Connection pooling** more manageable

**Cons:**
- ❌ **Performance** not fully isolated (same database resources)
- ❌ **Schema proliferation** (1000 tenants = 1000 schemas)
- ❌ **Migration complexity** (need to migrate each schema)
- ❌ **Backup/restore** more complex than separate DB
- ❌ **Resource limits** (max schemas per database)

**When to use:**
- Medium-sized tenants (10-100 users)
- Need customization but not full database isolation
- Moderate scale (100-1000 tenants)
- Want balance between cost and isolation

**Cost Analysis:**
```
Database: Large RDS instance (db.r5.2xlarge): $800/month
Support 1000 tenants → $0.80/tenant/month

vs separate databases: $60/tenant/month
Savings: 98%!
```

---

#### Option 3: Shared Database, Shared Schema (with tenant_id column)

```
Database 1:
  Table: users
    ├─ tenant_id | user_id | name      | email
    ├─ tenant_a  | 1       | Alice     | alice@a.com
    ├─ tenant_a  | 2       | Bob       | bob@a.com
    ├─ tenant_b  | 1       | Charlie   | charlie@b.com
    └─ tenant_c  | 1       | Dave      | dave@c.com

  Table: orders
    ├─ tenant_id | order_id | user_id | total
    ├─ tenant_a  | 1        | 1       | 100.00
    ├─ tenant_a  | 2        | 2       | 200.00
    └─ tenant_b  | 1        | 1       | 50.00
```

**Implementation:**

```sql
-- Schema design
CREATE TABLE users (
  tenant_id UUID NOT NULL,
  user_id BIGSERIAL NOT NULL,
  name VARCHAR(100),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (tenant_id, user_id),
  INDEX idx_tenant (tenant_id),

  -- Ensure email unique per tenant
  UNIQUE (tenant_id, email)
);

CREATE TABLE orders (
  tenant_id UUID NOT NULL,
  order_id BIGSERIAL NOT NULL,
  user_id BIGINT NOT NULL,
  total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (tenant_id, order_id),
  INDEX idx_tenant (tenant_id),
  INDEX idx_tenant_user (tenant_id, user_id),

  FOREIGN KEY (tenant_id, user_id)
    REFERENCES users(tenant_id, user_id)
);

-- Partition by tenant_id for better performance
CREATE TABLE users_partitioned (
  LIKE users INCLUDING ALL
) PARTITION BY LIST (tenant_id);

CREATE TABLE users_tenant_a PARTITION OF users_partitioned
  FOR VALUES IN ('tenant_a_id');
CREATE TABLE users_tenant_b PARTITION OF users_partitioned
  FOR VALUES IN ('tenant_b_id');
```

**Application code with Row-Level Security (RLS):**

```python
# PostgreSQL Row-Level Security (RLS)
def setup_row_level_security():
    db.execute("""
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        CREATE POLICY tenant_isolation ON users
        USING (tenant_id = current_setting('app.current_tenant')::UUID);
    """)

# Set tenant context
@app.route('/api/orders')
def get_orders():
    tenant_id = extract_tenant_id(request)

    # Set tenant context (RLS enforces this automatically!)
    db.execute(f"SET app.current_tenant = '{tenant_id}'")

    # Query without tenant_id in WHERE clause
    # RLS automatically adds: WHERE tenant_id = 'tenant_a'
    orders = db.execute("SELECT * FROM orders WHERE user_id = ?", user_id)

    return jsonify(orders)
```

**CRITICAL: Always filter by tenant_id**

```python
# BAD - SQL injection risk + data leak!
def get_orders_bad(user_id):
    # Forgot to filter by tenant_id!!!
    return db.execute("SELECT * FROM orders WHERE user_id = ?", user_id)
    # Returns orders from ALL tenants with this user_id

# GOOD - Explicit tenant filtering
def get_orders_good(tenant_id, user_id):
    return db.execute("""
        SELECT * FROM orders
        WHERE tenant_id = ? AND user_id = ?
    """, tenant_id, user_id)

# BEST - Use RLS (enforced at database level)
def get_orders_best(user_id):
    # RLS automatically adds tenant_id filter
    return db.execute("SELECT * FROM orders WHERE user_id = ?", user_id)
```

**Pros:**
- ✅ **Lowest cost** (maximum resource sharing)
- ✅ **Simple schema** (single set of tables)
- ✅ **Easy migrations** (one schema to migrate)
- ✅ **Cross-tenant analytics** easy (single query)
- ✅ **Scales to 100,000+ tenants**

**Cons:**
- ❌ **Weak isolation** (bug can leak data across tenants!)
- ❌ **No customization** (all tenants share same schema)
- ❌ **Performance** can be affected by large tenants
- ❌ **Risk of data leakage** (if forget to filter tenant_id)
- ❌ **Compliance** challenges (shared database)

**When to use:**
- Small tenants (1-10 users each)
- Standardized product (no customization)
- Large scale (10,000+ tenants)
- Cost-sensitive (bootstrapped startup)

**Mitigation strategies:**
1. **Row-Level Security (RLS)**: Database enforces tenant filtering
2. **Partitioning by tenant_id**: Improve query performance
3. **Comprehensive testing**: Verify tenant isolation in every query
4. **Code reviews**: Catch missing tenant_id filters
5. **Monitoring**: Alert on cross-tenant queries

**This is what Slack, Stripe, and GitHub use for small/medium tenants.**

---

### Comparison Table

| Aspect | Separate DB | Separate Schema | Shared Schema |
|--------|-------------|-----------------|---------------|
| **Isolation** | ✅✅✅ Strongest | ✅✅ Strong | ⚠️ Weakest |
| **Cost** | ❌ Highest | ⚠️ Medium | ✅ Lowest |
| **Customization** | ✅✅✅ Full | ✅✅ Good | ❌ None |
| **Scalability** | ⚠️ 100s | ⚠️ 1000s | ✅ 100,000+ |
| **Migration complexity** | ❌ High | ⚠️ Medium | ✅ Low |
| **Data leak risk** | ✅ Lowest | ⚠️ Low | ❌ Highest |
| **Best for** | Enterprise | Medium business | SMB/Startups |

---

### Hybrid Approach (Recommended for Production) ⭐

**Strategy: Tier-based data isolation**

```
Tier 1 (Enterprise): Separate database per tenant
  - Fortune 500 companies
  - $10,000+/month
  - Custom SLA, compliance

Tier 2 (Business): Separate schema per tenant
  - Mid-market companies
  - $500-$10,000/month
  - Some customization

Tier 3 (Starter): Shared schema with tenant_id
  - Small businesses
  - $50-$500/month
  - Standardized product
```

**Implementation:**

```python
class TenantManager:
    def get_database_connection(self, tenant_id):
        tenant = self.get_tenant_config(tenant_id)

        if tenant['tier'] == 'enterprise':
            # Separate database
            return self.get_dedicated_db(tenant_id)

        elif tenant['tier'] == 'business':
            # Separate schema
            conn = self.get_shared_db(tenant['region'])
            conn.execute(f"SET search_path TO {tenant_id}")
            return conn

        else:  # starter
            # Shared schema
            conn = self.get_shared_db(tenant['region'])
            conn.execute(f"SET app.current_tenant = '{tenant_id}'")
            return conn
```

**Pros:**
- ✅ **Cost-optimized** (pay for what you need)
- ✅ **Flexible** (easy to upgrade tenant between tiers)
- ✅ **Scalable** (handle both enterprise and startups)

**This is the real-world production approach.**

---

### Decision 2: Tenant Identification Strategy

**How do we know which tenant a request belongs to?**

#### Option 1: Subdomain

```
https://acme-corp.myapp.com → tenant_id: acme-corp
https://startup-inc.myapp.com → tenant_id: startup-inc
```

**Pros:**
- ✅ Clear tenant separation (users can't access wrong tenant)
- ✅ Easy to brand (tenant's name in URL)
- ✅ SSL certificates per tenant (isolation)

**Cons:**
- ❌ DNS/SSL overhead (wildcard cert or cert per tenant)
- ❌ Hard to switch tenants (need to change URL)

#### Option 2: Path

```
https://myapp.com/acme-corp/dashboard → tenant_id: acme-corp
https://myapp.com/startup-inc/dashboard → tenant_id: startup-inc
```

**Pros:**
- ✅ Simple DNS/SSL (single domain)
- ✅ Easy for API testing

**Cons:**
- ❌ Less professional (tenant name in path)
- ❌ SEO implications

#### Option 3: Header

```
GET /api/orders
Authorization: Bearer <JWT>
X-Tenant-ID: acme-corp
```

**Pros:**
- ✅ Flexible (same URL for all tenants)
- ✅ Good for APIs

**Cons:**
- ❌ Easy to forget header (security risk)
- ❌ Not user-friendly for web

**Recommendation:** Subdomain for web, Header for API

---

### Decision 3: Rate Limiting per Tenant

**Why?**
- Prevent one tenant from consuming all resources
- Fair usage across all tenants
- Protect against abuse

**Implementation:**

```python
# Redis-based rate limiter
def rate_limit_check(tenant_id, endpoint):
    # Get tenant's plan
    tenant = get_tenant_config(tenant_id)
    limits = tenant['rate_limits']  # e.g., {api_calls: 1000/min}

    # Check rate limit
    key = f"rate_limit:{tenant_id}:{endpoint}"
    current = redis.incr(key)

    if current == 1:
        redis.expire(key, 60)  # 1 minute window

    if current > limits[endpoint]:
        raise RateLimitExceeded(f"Limit: {limits[endpoint]}/min")

    return True

# Middleware
@app.before_request
def check_rate_limit():
    tenant_id = extract_tenant_id(request)
    endpoint = request.endpoint

    if not rate_limit_check(tenant_id, endpoint):
        return jsonify({"error": "Rate limit exceeded"}), 429
```

**Tier-based limits:**

```
Enterprise tier: 10,000 API calls/min
Business tier: 1,000 API calls/min
Starter tier: 100 API calls/min
```

**Pros:**
- ✅ Fairness across tenants
- ✅ Prevent abuse
- ✅ Monetization (upsell higher limits)

---

### Decision 4: Tenant-Specific Feature Flags

**Why?**
- Enable/disable features per tenant
- A/B testing per tenant
- Gradual rollout to tenants

**Implementation:**

```python
# Feature flags stored in database
CREATE TABLE tenant_features (
  tenant_id UUID,
  feature_name VARCHAR(50),
  enabled BOOLEAN DEFAULT FALSE,
  config JSONB,

  PRIMARY KEY (tenant_id, feature_name)
);

# Insert
INSERT INTO tenant_features VALUES
('tenant_a', 'advanced_analytics', true, '{"retention_days": 90}'),
('tenant_b', 'advanced_analytics', false, NULL);

# Usage
def check_feature(tenant_id, feature_name):
    result = db.execute("""
        SELECT enabled, config FROM tenant_features
        WHERE tenant_id = ? AND feature_name = ?
    """, tenant_id, feature_name)

    if result and result['enabled']:
        return result['config']
    return None

# In application
@app.route('/api/analytics')
def get_analytics():
    tenant_id = extract_tenant_id(request)

    if not check_feature(tenant_id, 'advanced_analytics'):
        return jsonify({"error": "Feature not available"}), 403

    # Feature enabled, proceed
    return jsonify(get_advanced_analytics(tenant_id))
```

## Monitoring & Metrics (Per-Tenant!)

### Key Metrics

```
Per-Tenant Performance:
- API latency: p50, p95, p99 per tenant
- Error rate per tenant
- Database query time per tenant

Per-Tenant Resources:
- Storage used per tenant
- API calls per tenant
- Concurrent users per tenant
- Database connections per tenant

Tenant Health:
- Active users per tenant
- Churn risk indicators
- Usage trends
```

### Alerts

```
Noisy neighbor detection:
- Alert if tenant uses > 10% of total resources
- Alert if tenant's queries > 1 second consistently

Tenant-specific SLA:
- Alert if tenant's p99 latency > SLA threshold
- Alert if tenant's error rate > 1%
```

## Security Considerations

1. **Tenant isolation testing**: Automated tests verify data isolation
2. **Row-Level Security**: Database-enforced tenant filtering
3. **Audit logging**: Log all data access with tenant_id
4. **Encryption**: Tenant-specific encryption keys (optional)
5. **Penetration testing**: Try to access other tenant's data

## Cost Estimation

### Shared Schema Approach (1000 tenants)

```
Infrastructure:
- Database (RDS): $800/month
- Application servers: $2,000/month
- Cache (Redis): $500/month
- Load balancer: $200/month
Total: $3,500/month

Per tenant cost: $3.50/month
If tenants pay $50/month → 93% gross margin
```

### Separate Database Approach (100 enterprise tenants)

```
Infrastructure:
- 100 databases × $60 = $6,000/month
- Application servers: $2,000/month
- Cache: $500/month
Total: $8,500/month

Per tenant cost: $85/month
If tenants pay $5,000/month → 98% gross margin
```

## Interview Talking Points

**"The key trade-off is isolation vs cost"**
- "Separate databases provide strongest isolation but highest cost"
- "Shared schema provides lowest cost but requires careful tenant filtering"
- "I'd recommend a hybrid approach: tier-based isolation"

**"Tenant isolation must be tested rigorously"**
- "Use Row-Level Security to enforce at database level"
- "Automated tests should verify data cannot leak across tenants"
- "One bug can expose all tenant data - this is critical"

**"Different tenants have different needs"**
- "Enterprise customers need dedicated resources and custom SLA"
- "Startups need low cost and fast onboarding"
- "Tier-based pricing aligns with tier-based infrastructure"

**"Monitoring must be per-tenant"**
- "Aggregate metrics hide noisy neighbors"
- "Need to track resource usage per tenant for billing and capacity planning"
- "Tenant-specific SLAs require tenant-specific monitoring"

