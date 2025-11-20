# Supabase Edge Functions

Supabase Edge Functions are server-side TypeScript functions distributed globally at the edge, powered by Deno.

## Overview

- **Runtime**: Deno (TypeScript/JavaScript)
- **Distribution**: Global edge network
- **Integration**: Native Supabase integration (Auth, Database, Storage)
- **Pricing**: Free tier: 500K function invocations/month
- **Cold start**: Fast (typically <1s)

## Key Features

- TypeScript/JavaScript support
- Run at the edge (low latency)
- Native Supabase SDK integration
- Import npm modules via CDN (esm.sh, skypack)
- Environment variables and secrets
- HTTP webhooks and cron jobs
- CORS handling

## Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init
```

## Project Structure

```
supabase/
├── functions/
│   ├── hello-world/
│   │   └── index.ts
│   ├── users-api/
│   │   └── index.ts
│   └── process-webhook/
│       └── index.ts
└── config.toml
```

## Basic Edge Function

```typescript
// supabase/functions/hello-world/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req) => {
  const { name } = await req.json()

  const data = {
    message: `Hello ${name || 'World'}!`,
    timestamp: new Date().toISOString(),
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  )
})
```

## REST API with Supabase Client

```typescript
// supabase/functions/users-api/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // Route handling
    if (method === 'GET' && path.includes('/users')) {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')

      if (error) throw error

      return new Response(
        JSON.stringify({ users: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    else if (method === 'POST' && path.includes('/users')) {
      const body = await req.json()

      const { data, error } = await supabaseClient
        .from('users')
        .insert([body])
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify(data[0]),
        {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## With Authentication

```typescript
// supabase/functions/protected-route/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    }
  )

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // User is authenticated, proceed with logic
  return new Response(
    JSON.stringify({
      message: 'Protected data',
      userId: user.id,
      email: user.email,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

## Webhook Processing

```typescript
// supabase/functions/process-webhook/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const payload = await req.json()

    console.log('Webhook received:', payload)

    // Verify webhook signature (example)
    const signature = req.headers.get('x-webhook-signature')
    if (!verifySignature(signature, payload)) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401 }
      )
    }

    // Process the webhook
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data, error } = await supabaseClient
      .from('webhook_events')
      .insert([
        {
          event_type: payload.type,
          payload: payload,
          received_at: new Date().toISOString(),
        },
      ])

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

function verifySignature(signature: string | null, payload: any): boolean {
  // Implement signature verification
  return true
}
```

## External API Integration

```typescript
// supabase/functions/fetch-external-api/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

serve(async (req) => {
  try {
    const { query } = await req.json()

    // Fetch from external API
    const apiKey = Deno.env.get('EXTERNAL_API_KEY')
    const response = await fetch(`https://api.example.com/search?q=${query}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

## Local Development

```bash
# Start Supabase locally
supabase start

# Serve function locally
supabase functions serve hello-world

# Test function
curl -i --location --request POST 'http://localhost:54321/functions/v1/hello-world' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"name":"Supabase"}'
```

## Deployment

```bash
# Deploy single function
supabase functions deploy hello-world

# Deploy all functions
supabase functions deploy

# Set secrets
supabase secrets set EXTERNAL_API_KEY=your-api-key

# View logs
supabase functions logs hello-world
```

## Environment Variables

```typescript
// Access environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const customSecret = Deno.env.get('MY_SECRET')
```

## Calling from Client

```typescript
// JavaScript/TypeScript client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Invoke function
const { data, error } = await supabase.functions.invoke('hello-world', {
  body: { name: 'World' }
})

// With authentication
const { data, error } = await supabase.functions.invoke('protected-route', {
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
})
```

## Best Practices

1. Use TypeScript for type safety
2. Handle CORS properly for browser clients
3. Implement error handling and logging
4. Use Supabase Auth for authentication
5. Store secrets in environment variables
6. Keep functions focused and small
7. Use Supabase client for database operations
8. Implement rate limiting for public endpoints
9. Test locally before deploying
10. Monitor function logs and errors

## Use Cases

- REST APIs for mobile/web apps
- Webhook handlers
- Scheduled jobs (with pg_cron)
- Data transformations
- Third-party API integrations
- Authentication flows
- Payment processing
- Email/SMS notifications
- Image processing
- AI/ML model inference
