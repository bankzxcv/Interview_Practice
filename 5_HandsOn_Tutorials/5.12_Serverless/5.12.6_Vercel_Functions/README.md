# Vercel Serverless Functions

Vercel Functions enable you to write serverless functions deployed on Vercel's global edge network.

## Overview

- **Runtimes**: Node.js, Go, Python, Ruby
- **Regions**: Global deployment with Edge Functions
- **Pricing**: Free tier: 100GB-hrs, 1M invocations/month
- **Max duration**: 10s (Hobby), 60s+ (Pro), 900s (Enterprise)
- **Max payload**: 4.5MB request/response

## Key Features

- Zero configuration
- Automatic deployments with Git
- TypeScript support
- Environment variables and secrets
- Edge Functions (ultra-low latency)
- Edge Middleware
- Streaming responses
- Built-in CORS handling

## Project Structure

```
my-vercel-app/
├── api/
│   ├── hello.ts
│   ├── users/
│   │   ├── index.ts
│   │   └── [id].ts
│   └── webhooks/
│       └── stripe.ts
├── public/
├── package.json
└── vercel.json
```

## Basic Serverless Function

```typescript
// api/hello.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { name = 'World' } = req.query

  res.status(200).json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    method: req.method,
  })
}
```

## REST API with Dynamic Routes

```typescript
// api/users/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface User {
  id: string
  name: string
  email: string
}

const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
]

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method === 'GET') {
    return res.status(200).json({ users })
  }

  if (req.method === 'POST') {
    const { name, email } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' })
    }

    const newUser: User = {
      id: String(users.length + 1),
      name,
      email,
    }

    users.push(newUser)

    return res.status(201).json(newUser)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

```typescript
// api/users/[id].ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface User {
  id: string
  name: string
  email: string
}

const users: Map<string, User> = new Map([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com' }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' }],
])

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query as { id: string }

  if (req.method === 'GET') {
    const user = users.get(id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json(user)
  }

  if (req.method === 'PUT') {
    const user = users.get(id)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { name, email } = req.body

    if (name) user.name = name
    if (email) user.email = email

    users.set(id, user)

    return res.status(200).json(user)
  }

  if (req.method === 'DELETE') {
    if (!users.has(id)) {
      return res.status(404).json({ error: 'User not found' })
    }

    users.delete(id)

    return res.status(204).end()
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
```

## Database Integration (Vercel Postgres)

```typescript
// api/db/users.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '@vercel/postgres'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM users`
      return res.status(200).json({ users: rows })
    }

    if (req.method === 'POST') {
      const { name, email } = req.body

      const result = await sql`
        INSERT INTO users (name, email, created_at)
        VALUES (${name}, ${email}, NOW())
        RETURNING *
      `

      return res.status(201).json(result.rows[0])
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    console.error('Database error:', error)
    return res.status(500).json({ error: error.message })
  }
}
```

## Vercel KV (Redis)

```typescript
// api/cache.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { key } = req.query as { key: string }

  try {
    if (req.method === 'GET') {
      const value = await kv.get(key)

      if (!value) {
        return res.status(404).json({ error: 'Not found' })
      }

      return res.status(200).json({ value })
    }

    if (req.method === 'POST') {
      const { value, ttl = 3600 } = req.body

      await kv.set(key, value, { ex: ttl })

      return res.status(201).json({ success: true })
    }

    if (req.method === 'DELETE') {
      await kv.del(key)
      return res.status(204).end()
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    return res.status(500).json({ error: error.message })
  }
}
```

## Webhook Handler

```typescript
// api/webhooks/stripe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { buffer } from 'micro'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for webhook
  },
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signature = req.headers['stripe-signature'] as string
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET!

  try {
    const buf = await buffer(req)
    const event = stripe.webhooks.constructEvent(buf, signature, signingSecret)

    console.log('Webhook event:', event.type)

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object
        console.log('Payment succeeded:', paymentIntent.id)
        // Handle successful payment
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object
        console.log('Payment failed:', failedPayment.id)
        // Handle failed payment
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return res.status(400).json({ error: error.message })
  }
}
```

## Edge Functions

```typescript
// api/edge-hello.ts
export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  const url = new URL(req.url)
  const name = url.searchParams.get('name') || 'World'

  return new Response(
    JSON.stringify({
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      region: process.env.VERCEL_REGION,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate',
      },
    }
  )
}
```

## Edge Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add custom header
  const response = NextResponse.next()
  response.headers.set('x-custom-header', 'my-value')

  // Geo-based routing
  const country = request.geo?.country || 'US'
  response.headers.set('x-user-country', country)

  // A/B testing
  const bucket = Math.random() < 0.5 ? 'A' : 'B'
  response.cookies.set('bucket', bucket)

  // Authentication check
  const token = request.cookies.get('auth-token')
  if (!token && request.nextUrl.pathname.startsWith('/api/protected')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return response
}

export const config = {
  matcher: '/api/:path*',
}
```

## Cron Jobs

```typescript
// api/cron/daily-report.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify cron secret
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  console.log('Running daily report...')

  try {
    const report = await generateReport()

    // Send report
    await sendReport(report)

    return res.status(200).json({ success: true })
  } catch (error: any) {
    console.error('Error:', error)
    return res.status(500).json({ error: error.message })
  }
}

async function generateReport() {
  return {
    date: new Date().toISOString(),
    metrics: {
      totalUsers: 100,
      revenue: 5000,
    },
  }
}

async function sendReport(report: any) {
  console.log('Report:', report)
  // Send via email, Slack, etc.
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Environment Variables

```bash
# .env.local (not committed to git)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CRON_SECRET=your-secret-key

# Add to Vercel dashboard or via CLI
vercel env add DATABASE_URL
```

## Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Start development server
vercel dev

# Test function
curl http://localhost:3000/api/hello?name=Vercel
```

## Deployment

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs
```

## Best Practices

1. Use TypeScript for type safety
2. Enable caching with appropriate headers
3. Use Edge Functions for global performance
4. Implement proper error handling
5. Use environment variables for secrets
6. Keep functions focused and small
7. Use Vercel KV for caching
8. Monitor function metrics
9. Set appropriate timeouts
10. Use Edge Middleware for common logic

## Use Cases

- REST APIs
- Webhooks
- Authentication endpoints
- Image optimization
- API proxies
- Scheduled tasks
- Real-time features
- Database operations
- Third-party integrations
- Static site generation (SSG/ISR)
