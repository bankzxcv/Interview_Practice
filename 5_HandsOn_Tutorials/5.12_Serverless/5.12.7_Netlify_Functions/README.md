# Netlify Functions

Netlify Functions enable you to deploy serverless functions on Netlify's infrastructure powered by AWS Lambda.

## Overview

- **Runtime**: AWS Lambda (Node.js, Go, TypeScript)
- **Pricing**: Free tier: 125K requests, 100 hours/month
- **Max duration**: 10s (free), 26s (Pro/Business)
- **Regions**: Auto-selected based on site location
- **Background functions**: Long-running tasks (up to 15 minutes)

## Key Features

- Zero configuration
- Git-based deployments
- TypeScript support
- Environment variables
- Event-triggered functions
- Background functions
- Edge Functions (Deno runtime)
- Built-in identity/authentication

## Project Structure

```
my-netlify-app/
├── netlify/functions/
│   ├── hello.ts
│   ├── users.ts
│   └── background-job.ts
├── public/
├── package.json
└── netlify.toml
```

## Basic Function

```typescript
// netlify/functions/hello.ts
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const { name = 'World' } = event.queryStringParameters || {}

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
    }),
  }
}
```

## REST API

```typescript
// netlify/functions/users.ts
import { Handler } from '@netlify/functions'

interface User {
  id: string
  name: string
  email: string
}

const users: Map<string, User> = new Map([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com' }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' }],
])

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  }

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  const path = event.path.replace('/.netlify/functions/users', '')
  const method = event.httpMethod

  try {
    // GET /users
    if (method === 'GET' && !path) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users: Array.from(users.values()) }),
      }
    }

    // GET /users/:id
    if (method === 'GET' && path) {
      const id = path.replace('/', '')
      const user = users.get(id)

      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'User not found' }),
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(user),
      }
    }

    // POST /users
    if (method === 'POST' && !path) {
      const body = JSON.parse(event.body || '{}')
      const { name, email } = body

      if (!name || !email) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Name and email required' }),
        }
      }

      const id = String(users.size + 1)
      const newUser: User = { id, name, email }
      users.set(id, newUser)

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newUser),
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    }
  }
}
```

## Background Function

```typescript
// netlify/functions/background-job.ts
import { Handler } from '@netlify/functions'

export const handler: Handler = async (event) => {
  console.log('Background job started at:', new Date().toISOString())

  try {
    const body = JSON.parse(event.body || '{}')

    // Long-running task (up to 15 minutes)
    await processLargeDataset(body)

    // Note: Response is sent immediately, processing continues in background
    return {
      statusCode: 202,
      body: JSON.stringify({ message: 'Job queued' }),
    }
  } catch (error: any) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }
}

async function processLargeDataset(data: any) {
  console.log('Processing dataset...')

  // Simulate long-running task
  await new Promise(resolve => setTimeout(resolve, 10000))

  console.log('Dataset processed')
}
```

## Database Integration (Supabase)

```typescript
// netlify/functions/db-users.ts
import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
)

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  try {
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase
        .from('users')
        .select('*')

      if (error) throw error

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users: data }),
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')

      const { data, error } = await supabase
        .from('users')
        .insert([body])
        .select()

      if (error) throw error

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(data[0]),
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    }
  }
}
```

## Scheduled Functions

```typescript
// netlify/functions/scheduled-report.ts
import { Handler, schedule } from '@netlify/functions'

// Runs daily at 9 AM
export const handler: Handler = schedule('0 9 * * *', async () => {
  console.log('Running scheduled report at:', new Date().toISOString())

  try {
    const report = await generateReport()

    console.log('Report generated:', report)

    // Send report via email, Slack, etc.
    await sendReport(report)

    return {
      statusCode: 200,
    }
  } catch (error: any) {
    console.error('Error:', error)
    return {
      statusCode: 500,
    }
  }
})

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
  console.log('Sending report...', report)
  // Implementation
}
```

## Event-Triggered Functions

```typescript
// netlify/functions/deploy-succeeded.ts
import { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  // This function is triggered after successful deployment
  console.log('Deploy succeeded!')

  const payload = JSON.parse(event.body || '{}')

  console.log('Deploy ID:', payload.id)
  console.log('Site ID:', payload.site_id)

  // Perform post-deployment tasks
  // - Clear CDN cache
  // - Send notifications
  // - Update external services

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Post-deployment tasks completed' }),
  }
}
```

## Edge Functions (Deno)

```typescript
// netlify/edge-functions/hello.ts
export default async (request: Request, context: any) => {
  const url = new URL(request.url)
  const name = url.searchParams.get('name') || 'World'

  return new Response(
    JSON.stringify({
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      geo: context.geo,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}
```

## Webhook Handler

```typescript
// netlify/functions/webhook.ts
import { Handler } from '@netlify/functions'
import crypto from 'crypto'

export const handler: Handler = async (event) => {
  // Verify webhook signature
  const signature = event.headers['x-webhook-signature']
  const secret = process.env.WEBHOOK_SECRET!

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(event.body || '')
    .digest('hex')

  if (signature !== expectedSignature) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Invalid signature' }),
    }
  }

  try {
    const payload = JSON.parse(event.body || '{}')

    console.log('Webhook received:', payload)

    // Process webhook
    await processWebhook(payload)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (error: any) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }
}

async function processWebhook(payload: any) {
  // Business logic
  console.log('Processing webhook...')
}
```

## netlify.toml Configuration

```toml
[build]
  functions = "netlify/functions"
  edge_functions = "netlify/edge-functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  # Set default Node.js version
  node_bundler = "esbuild"

[dev]
  functions = "netlify/functions"
  port = 8888
```

## Environment Variables

```bash
# .env (not committed)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
WEBHOOK_SECRET=your-secret

# Add via Netlify CLI
netlify env:set SUPABASE_URL "https://your-project.supabase.co"
```

## Local Development

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start development server
netlify dev

# Test function
curl http://localhost:8888/.netlify/functions/hello?name=Netlify
```

## Deployment

```bash
# Deploy via Git (automatic)
git push origin main

# Manual deploy
netlify deploy

# Deploy to production
netlify deploy --prod

# View logs
netlify functions:log hello
```

## Best Practices

1. Use TypeScript for type safety
2. Keep functions focused and small
3. Implement proper error handling
4. Use environment variables for secrets
5. Enable caching with appropriate headers
6. Use background functions for long tasks
7. Monitor function metrics
8. Test locally before deploying
9. Use Edge Functions for low latency
10. Implement retry logic for resilience

## Use Cases

- REST APIs
- Form handling
- Authentication
- Webhooks
- Scheduled tasks
- Image optimization
- Database operations
- Third-party integrations
- Payment processing
- Email/SMS notifications
