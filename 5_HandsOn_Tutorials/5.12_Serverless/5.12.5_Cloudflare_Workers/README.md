# Cloudflare Workers

Cloudflare Workers is a serverless platform that runs on Cloudflare's global edge network in 275+ cities worldwide.

## Overview

- **Runtime**: V8 JavaScript engine (JavaScript, TypeScript, Rust, C/C++)
- **Distribution**: Global edge network (sub-50ms latency globally)
- **Pricing**: Free tier: 100,000 requests/day, 10ms CPU time per request
- **Cold start**: Near-zero (Workers are always warm)
- **Execution limit**: 50ms CPU time (free), 50ms-30s (paid)

## Key Features

- Ultra-low latency (runs at edge)
- No cold starts
- TypeScript support
- Workers KV (edge key-value storage)
- Durable Objects (stateful serverless)
- R2 (S3-compatible object storage)
- D1 (SQLite at the edge)
- Workers AI (run AI models at edge)

## Prerequisites

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create new project
npm create cloudflare@latest my-worker
```

## Basic Worker

```typescript
// src/index.ts
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const name = url.searchParams.get('name') || 'World'

    return new Response(
      JSON.stringify({
        message: `Hello, ${name}!`,
        timestamp: new Date().toISOString(),
        location: request.cf?.city || 'Unknown',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  },
}
```

## REST API

```typescript
// src/index.ts
interface User {
  id: string
  name: string
  email: string
}

const users = new Map<string, User>([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com' }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' }],
])

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // CORS
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    try {
      if (method === 'GET' && path === '/users') {
        return jsonResponse(Array.from(users.values()))
      }

      if (method === 'GET' && path.startsWith('/users/')) {
        const id = path.split('/')[2]
        const user = users.get(id)

        if (!user) {
          return jsonResponse({ error: 'User not found' }, 404)
        }

        return jsonResponse(user)
      }

      if (method === 'POST' && path === '/users') {
        const body = await request.json<Partial<User>>()

        if (!body.name || !body.email) {
          return jsonResponse({ error: 'Name and email required' }, 400)
        }

        const id = (users.size + 1).toString()
        const user: User = { id, name: body.name, email: body.email }
        users.set(id, user)

        return jsonResponse(user, 201)
      }

      return jsonResponse({ error: 'Not found' }, 404)
    } catch (error) {
      return jsonResponse({ error: (error as Error).message }, 500)
    }
  },
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
```

## Workers KV Storage

```typescript
// src/index.ts
export interface Env {
  KV_NAMESPACE: KVNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    // GET /cache/:key
    if (method === 'GET' && path.startsWith('/cache/')) {
      const key = path.split('/')[2]
      const value = await env.KV_NAMESPACE.get(key)

      if (!value) {
        return new Response('Not found', { status: 404 })
      }

      return new Response(value, {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // PUT /cache/:key
    if (method === 'PUT' && path.startsWith('/cache/')) {
      const key = path.split('/')[2]
      const value = await request.text()

      // Store with 1 hour expiration
      await env.KV_NAMESPACE.put(key, value, {
        expirationTtl: 3600,
      })

      return new Response('Stored', { status: 201 })
    }

    // DELETE /cache/:key
    if (method === 'DELETE' && path.startsWith('/cache/')) {
      const key = path.split('/')[2]
      await env.KV_NAMESPACE.delete(key)

      return new Response('Deleted', { status: 204 })
    }

    return new Response('Not found', { status: 404 })
  },
}
```

## D1 Database Integration

```typescript
// src/index.ts
export interface Env {
  DB: D1Database
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/users' && request.method === 'GET') {
      const { results } = await env.DB.prepare(
        'SELECT * FROM users'
      ).all()

      return Response.json({ users: results })
    }

    if (url.pathname === '/users' && request.method === 'POST') {
      const { name, email } = await request.json<any>()

      const result = await env.DB.prepare(
        'INSERT INTO users (name, email) VALUES (?, ?)'
      )
        .bind(name, email)
        .run()

      return Response.json({ id: result.meta.last_row_id }, { status: 201 })
    }

    return new Response('Not found', { status: 404 })
  },
}
```

## Durable Objects (Stateful)

```typescript
// src/counter.ts
export class Counter {
  state: DurableObjectState
  value: number

  constructor(state: DurableObjectState) {
    this.state = state
    this.value = 0
  }

  async fetch(request: Request) {
    // Initialize value from storage
    const stored = await this.state.storage.get('value')
    this.value = stored || 0

    const url = new URL(request.url)

    if (url.pathname === '/increment') {
      this.value++
      await this.state.storage.put('value', this.value)
      return Response.json({ value: this.value })
    }

    if (url.pathname === '/decrement') {
      this.value--
      await this.state.storage.put('value', this.value)
      return Response.json({ value: this.value })
    }

    if (url.pathname === '/value') {
      return Response.json({ value: this.value })
    }

    return new Response('Not found', { status: 404 })
  }
}

// src/index.ts
export { Counter } from './counter'

export interface Env {
  COUNTER: DurableObjectNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.COUNTER.idFromName('global-counter')
    const stub = env.COUNTER.get(id)

    return stub.fetch(request)
  },
}
```

## R2 Object Storage

```typescript
// src/index.ts
export interface Env {
  BUCKET: R2Bucket
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const key = url.pathname.slice(1)

    // GET /file.txt
    if (request.method === 'GET') {
      const object = await env.BUCKET.get(key)

      if (!object) {
        return new Response('Not found', { status: 404 })
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
        },
      })
    }

    // PUT /file.txt
    if (request.method === 'PUT') {
      await env.BUCKET.put(key, request.body, {
        httpMetadata: {
          contentType: request.headers.get('Content-Type') || 'application/octet-stream',
        },
      })

      return new Response('Uploaded', { status: 201 })
    }

    // DELETE /file.txt
    if (request.method === 'DELETE') {
      await env.BUCKET.delete(key)
      return new Response('Deleted', { status: 204 })
    }

    return new Response('Method not allowed', { status: 405 })
  },
}
```

## Scheduled Workers (Cron)

```typescript
// src/index.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('Cron job running at:', new Date().toISOString())

    // Generate daily report
    const report = await generateReport()

    // Send report somewhere
    await sendReport(report)

    console.log('Cron job completed')
  },
}

async function generateReport() {
  return {
    date: new Date().toISOString(),
    metrics: {
      totalRequests: 1000,
      totalUsers: 50,
    },
  }
}

async function sendReport(report: any) {
  // Send to API, email, etc.
  console.log('Report:', report)
}
```

## wrangler.toml Configuration

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# KV Namespace
[[kv_namespaces]]
binding = "KV_NAMESPACE"
id = "your-kv-namespace-id"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"

# R2 Bucket
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-bucket"

# Durable Objects
[[durable_objects.bindings]]
name = "COUNTER"
class_name = "Counter"

# Environment variables
[vars]
ENVIRONMENT = "production"

# Scheduled/Cron triggers
[triggers]
crons = ["0 0 * * *"]  # Daily at midnight
```

## Local Development

```bash
# Start local dev server
wrangler dev

# Test locally
curl http://localhost:8787/users
```

## Deployment

```bash
# Deploy to Cloudflare
wrangler deploy

# View logs
wrangler tail

# List deployments
wrangler deployments list
```

## Best Practices

1. Keep workers lightweight (CPU time limits)
2. Use Workers KV for edge caching
3. Use Durable Objects for stateful logic
4. Implement proper error handling
5. Use TypeScript for type safety
6. Cache responses when possible
7. Monitor CPU time usage
8. Use R2 for large file storage
9. Leverage edge location data
10. Test locally before deploying

## Use Cases

- API gateways and proxies
- A/B testing and feature flags
- Bot management and rate limiting
- Image optimization and resizing
- Authentication and authorization
- Geo-routing and localization
- SEO optimization
- Real-time applications
- Serverless backends
- Static site hosting with dynamic features
