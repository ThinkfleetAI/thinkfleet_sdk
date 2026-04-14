# @thinkfleet/sdk

TypeScript SDK for the ThinkFleet AI platform. Build mobile, desktop, and web apps powered by AI Agents, Crews, Knowledge Base, and MCP Services.

## Install

```bash
npm install @thinkfleet/sdk
```

## Quick Start

```typescript
import { ThinkFleet } from '@thinkfleet/sdk'

const client = new ThinkFleet({
  apiKey: 'sk-...',
  projectId: 'your-project-id',
  baseUrl: 'https://api.thinkfleet.ai',
})

// Chat with an agent
const response = await client.agents.chat('agent-id', {
  sessionId: 'session-1',
  message: 'Hello!',
})
console.log(response.content)
```

## Features

### Agents

```typescript
// List agents
const agents = await client.agents.list()

// Get agent details (includes tools)
const agent = await client.agents.get('agent-id')

// Create an agent
const newAgent = await client.agents.create({
  name: 'My Agent',
  systemPrompt: 'You are a helpful assistant.',
  aiProvider: AiProvider.ANTHROPIC,
  modelName: 'claude-sonnet-4-20250514',
})

// Chat (120s timeout for tool-heavy conversations)
const response = await client.agents.chat('agent-id', {
  sessionId: 'session-1',
  message: 'Analyze this data...',
})

// Manage agent tools
await client.agents.tools.addKnowledgeBase('agent-id', {
  displayName: 'Company Docs',
  knowledgeBaseIds: ['kb-id'],
  topK: 5,
})
```

### Tasks (Smart Routing)

```typescript
// Classify a task to find the best agent
const classification = await client.tasks.classify({
  message: 'Write a Python script to parse CSV files',
})
// → { personaId, personaName, complexity, needsCrew, ... }

// Dispatch to a single agent
const { agentId, sessionId } = await client.tasks.dispatch({
  personaId: classification.personaId,
  message: 'Write a Python script to parse CSV files',
})

// Dispatch to a crew for complex tasks
const crew = await client.tasks.dispatchCrew({
  title: 'Build REST API',
  personaIds: ['dev-persona', 'qa-persona'],
  objective: 'Build and test a REST API for user management',
})

// Get conversation history
const history = await client.tasks.getHistory(agentId, sessionId)

// Send follow-up messages
await client.tasks.sendFollowUp(agentId, sessionId, {
  message: 'Can you also add error handling?',
})
```

### Knowledge Base

```typescript
// Create a knowledge base
const kb = await client.knowledgeBases.create({
  name: 'Company Docs',
  embeddingProvider: 'openai',
  embeddingModel: 'text-embedding-3-small',
  embeddingDimension: 1536,
})

// Upload documents
await client.knowledgeBases.documents.upload(kb.id, file, 'report.pdf')

// Search across knowledge bases
const results = await client.knowledgeBases.search({
  query: 'What is our refund policy?',
  knowledgeBaseIds: [kb.id],
  topK: 5,
})
```

### Connections (OAuth)

Connect third-party services via OAuth — works in mobile, desktop, and web apps.

```typescript
// 1. Check if native OAuth is configured for a service
const method = await client.connections.methodForPiece('@activepieces/piece-gmail')
console.log(method.method) // 'native' if credentials are configured

// 2. Start OAuth flow
const { authorizationUrl, sessionId } = await client.connections.initiate({
  providerSlug: 'google',
  callbackUrl: 'https://myapp.com/oauth/callback',
  scopes: ['openid', 'email', 'https://www.googleapis.com/auth/gmail.modify'],
})

// 3. Open in browser/popup — user completes OAuth consent
window.open(authorizationUrl)
// Server handles the callback and creates the connection automatically

// 4. List connections
const { data: connections } = await client.connections.list()

// 5. Test a connection (validates token, refreshes if expired)
const result = await client.connections.test(connections[0].id)
console.log(result.status) // 'active' | 'error'
```

API key and Basic auth connections:

```typescript
// Direct connect (no OAuth flow needed)
const conn = await client.connections.connect({
  providerSlug: 'openai',
  connectionDisplayName: 'My OpenAI Key',
  credentials: { api_key: 'sk-...' },
})
```

Client Credentials grant (server-to-server):

```typescript
const conn = await client.connections.clientCredentials({
  providerSlug: 'microsoft',
  scopes: ['https://graph.microsoft.com/.default'],
})
```

### Flows

```typescript
// List flows
const flows = await client.flows.list({ status: 'ENABLED', limit: 20 })

// Run a flow asynchronously (returns immediately)
const run = await client.flows.run('flow-id', {
  payload: { email: 'user@example.com', name: 'John' },
})
console.log(run.id) // flow run ID

// Run a flow synchronously (waits for completion)
const result = await client.flows.runSync('flow-id', {
  payload: { query: 'summarize this document' },
})
console.log(result) // flow output

// CRUD operations
const flow = await client.flows.create({ displayName: 'My Flow' })
await client.flows.enable(flow.id)
await client.flows.rename(flow.id, 'New Name')
await client.flows.delete(flow.id)
```

### MCP Services

```typescript
// Get MCP server config
const server = await client.mcp.get()

// List integrations
const integrations = await client.mcp.integrations.list()

// Add an integration (just use the piece short name)
await client.mcp.integrations.add({
  pieceName: 'slack',
  pieceVersion: '0.1.0',
  actionName: 'send_message',
})

// Export skills
const skills = await client.mcp.skills()
```

### Crews

```typescript
// List crews
const crews = await client.crews.list()

// Get project board
const board = await client.crews.getBoard('crew-id', 'project-id')

// Create a task on the board
await client.crews.tasks.create('project-id', {
  title: 'Implement user auth',
  priority: BoardTaskPriority.HIGH,
})

// Run a task (agent executes it)
await client.crews.tasks.run('project-id', 'task-id')
```

### Message Templates (with RCS / MMS support)

Reusable, memory-aware message templates. Placeholders render from a
contact's `ContactProfile` plus extras you pass in.

```typescript
// List / get / create
const templates = await client.templates.list()
const tpl = await client.templates.get('tpl-id')

const newTpl = await client.templates.create({
  name: 'Win-back Offer',
  body: "Hey {contact.name}, it's been {pattern.daysSinceLastOrder} days — use {promotion.code}!",
  channel: 'sms',
})

// Server-side render (uses the real contact profile)
const rendered = await client.templates.render('tpl-id', {
  contactId: 'con_123',
  extras: { promotion: { code: 'PIZZA20', discountValue: 20 } },
})
// → { subject, body, mediaUrls, rcsPayload, unresolvedPlaceholders, policyWarnings, ... }

// Client-side render (no round trip — for live previews, mail-merge batches)
import { renderLocal } from '@thinkfleet/sdk'

const profile = await client.contacts.getProfile('con_123')
const out = client.templates.renderLocal(tpl, {
  profile,
  extras: { promotion: { code: 'PIZZA20', discountValue: 20 } },
})
// → { subject, body, unresolvedPlaceholders }

// Or with a raw input (no template required)
const ad = renderLocal({
  subject: 'Hey {contact.name}!',
  body: '{pattern.topItem} this Friday?',
  context: { profile },
})

// Channel policies (for building your own char counters)
const policies = await client.templates.channelPolicies()
```

**Placeholder resolution order** (same in server and `renderLocal`):
`extras.*` → `contact.*` → `preferences.*` → `facts[N]` → `patterns.*`
→ `recentEvents[N]` → `media.N`. Aliases: `{memory.topFact}`,
`{memory.topPreference}`, `{pattern.topItem}`.

### Media Library

Upload images / video / audio / PDFs. Used by RCS cards, MMS attachments,
and `{media.N}` placeholders in templates. Signed URLs default to 7-day
TTL; auto alt-text is generated via Claude Vision on image and video
uploads.

```typescript
import { readFileSync } from 'node:fs'

// Upload (Buffer or Blob)
const asset = await client.media.upload({
  file: readFileSync('pepperoni.jpg'),
  mimeType: 'image/jpeg',
  filename: 'pepperoni.jpg',
})
// → { id, url, altText, tags, type, width, height, ... }

// List / filter
const { data } = await client.media.list({ type: 'image', limit: 50 })

// Update alt text / tags
await client.media.update(asset.id, {
  altText: 'A classic pepperoni pizza',
  tags: ['food', 'pepperoni', 'bestseller'],
})

// Delete
await client.media.delete(asset.id)
```

## Configuration

```typescript
const client = new ThinkFleet({
  apiKey: 'sk-...',           // Required — from Platform Admin
  projectId: 'proj-...',      // Required — default project
  baseUrl: 'https://...',     // Default: https://api.thinkfleet.ai
  maxRetries: 2,              // Default: 2 (retries on 429/5xx)
  timeout: 30000,             // Default: 30s (agent chat uses 120s)
  fetch: customFetch,         // Custom fetch for React Native / testing
})
```

### Per-request project override

```typescript
// Use a different project for one call
const agents = await client.agents.list({ projectId: 'other-project' })
```

## Error Handling

```typescript
import { ThinkFleetError, AuthenticationError, NotFoundError } from '@thinkfleet/sdk'

try {
  await client.agents.get('invalid-id')
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid API key (401)
  } else if (error instanceof NotFoundError) {
    // Agent not found (404)
  } else if (error instanceof ThinkFleetError) {
    console.log(error.statusCode, error.code, error.message)
  }
}
```

Error classes: `AuthenticationError` (401), `AuthorizationError` (403), `NotFoundError` (404), `ValidationError` (400), `RateLimitError` (429), `ServerError` (5xx), `TimeoutError`.

## Requirements

- Node.js 18+ (uses native `fetch`)
- Works in browsers and React Native

## License

MIT
