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

// Clone a flow between projects or locations
const exported = await client.flows.getTemplate(sourceFlowId)
const cloned = await client.flows.createFromJson(exported.template, {
  displayName: 'Claims Intake — Denver',
  locationId: denverLocationId,
})

// Seed a flow from a stored template (marketplace or private)
const seeded = await client.flows.createFromTemplate('template-id', {
  displayName: 'Onboarding v2',
  locationId: denverLocationId,
})

// Kick off + poll for completion (alternative to runSync when flows are long-running)
const finished = await client.flows.runAndWait('flow-id',
  { payload: { caseId: '42' } },
  {
    timeoutMs: 10 * 60_000,
    pollIntervalMs: 2_000,
    onProgress: (run) => console.log(run.status),
  },
)
if (finished.status !== 'SUCCEEDED') {
  throw new Error(`Flow failed: ${finished.status}`)
}
```

### Flow Runs

Inspect historical runs and poll for completion manually:

```typescript
// List recent runs
const runs = await client.flowRuns.list({ status: 'FAILED', limit: 50 })

// Get a single run
const run = await client.flowRuns.get('run-id')

// Retry a failed run
await client.flowRuns.retry('run-id')

// Wait for a run that was started elsewhere
const started = await client.flows.run('flow-id', { payload: { q: 'hi' } })
const done = await client.flowRuns.wait(started.id, {
  timeoutMs: 60_000,
  onProgress: (r) => console.log(r.status),
})

// Check for terminal states
import { TERMINAL_FLOW_RUN_STATUSES } from '@thinkfleet/sdk'

if (TERMINAL_FLOW_RUN_STATUSES.includes(done.status)) {
  // SUCCEEDED | FAILED | INTERNAL_ERROR | TIMEOUT | CANCELED |
  // QUOTA_EXCEEDED | MEMORY_LIMIT_EXCEEDED
}
```

### Locations

Projects can contain a hierarchy of locations (regions → business units → stores/clinics/offices). Any location-scoped resource (flows, tasks, customers, interactions, memory, connections, knowledge-base, documents, voice calls, scheduled tasks) is automatically filtered by the active location when its id is passed.

```typescript
// Create a location tree
const region = await client.locations.create({
  name: 'West',
  type: 'region',
})
const denver = await client.locations.create({
  parentLocationId: region.id,
  name: 'Denver Clinic',
  type: 'clinic',
  timezone: 'America/Denver',
  address: {
    street1: '1234 Market St',
    city: 'Denver',
    region: 'CO',
    postalCode: '80202',
    country: 'US',
  },
})

// Fetch the full tree
const tree = await client.locations.tree()

// Scope a resource call to a specific location
const flowsInDenver = await client.flows.list(undefined, {
  locationId: denver.id,
})
const customersInDenver = await client.contacts.list({
  locationId: denver.id,
})

// Update and move a location
await client.locations.update(denver.id, { timezone: 'America/Denver' })
await client.locations.move(denver.id, { newParentLocationId: null }) // promote to root

// Members — control which users can access a location
await client.locations.addMember(denver.id, {
  userId: 'user-id',
  role: 'manager',
})
const members = await client.locations.listMembers(denver.id)
await client.locations.removeMember(denver.id, 'user-id')

// Archive (soft) vs hard delete
await client.locations.delete(denver.id)
await client.locations.delete(denver.id, { hard: true })
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
