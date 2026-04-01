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

Connect third-party services via OAuth — works in mobile and desktop apps.

```typescript
// One-liner: initiate → open browser → poll → finalize
const result = await client.connections.connect(
  {
    pieceName: 'gmail',
    projectId: 'your-project-id',
    displayName: 'Gmail',
  },
  (url) => Linking.openURL(url), // React Native
)

if (result.success) {
  console.log('Connected!', result.connectionId)
}
```

Or step-by-step for more control:

```typescript
// 1. Get OAuth URL
const { redirectUrl, composioAccountId } = await client.connections.initiate({
  pieceName: 'gmail',
  projectId: 'your-project-id',
  displayName: 'Gmail',
})

// 2. Open in browser/WebView
window.open(redirectUrl)

// 3. Poll until user completes OAuth
let status
do {
  await new Promise(r => setTimeout(r, 3000))
  ;({ status } = await client.connections.getStatus(composioAccountId))
} while (status === 'INITIATED')

// 4. Finalize
if (status === 'ACTIVE') {
  await client.connections.finalize({
    composioAccountId,
    pieceName: 'gmail',
    projectId: 'your-project-id',
    displayName: 'Gmail',
  })
}
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
