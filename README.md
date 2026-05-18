# @thinkfleet/sdk

TypeScript SDK for the ThinkFleet AI platform. Build apps that drive AI Agents, Crews, Knowledge Bases, OAuth-managed Connections, MCP Services, an Org Chart of autonomous AI workers, and more — from any Node 18+, Bun, Deno, or modern-browser environment that supports `fetch`.

> **Stability:** the surface is stable enough for internal app use. Every method shipped here is exercised against a live ThinkFleet platform via the integration test app (`test-app.ts`).

---

## Install

```bash
npm install @thinkfleet/sdk
# or: pnpm add @thinkfleet/sdk
# or: bun add @thinkfleet/sdk
```

## Quick start

```ts
import { ThinkFleet } from '@thinkfleet/sdk'

const tf = new ThinkFleet({
  apiKey: 'sk-...',                // Platform Admin → API Keys
  projectId: 'your-project-id',    // Default project for all calls
  baseUrl: 'https://app.thinkfleet.ai', // Optional. Defaults to https://app.thinkfleet.ai
})

// Chat with an agent
const reply = await tf.agents.chat('agent-id', {
  sessionId: 'session-1',
  message: 'Summarize today’s sales report.',
})
console.log(reply.content)
```

> The API lives at `app.thinkfleet.ai/api/v1/...`. The SDK adds the `/api/v1` prefix for you. Don’t put it in `baseUrl`.

---

## Configuration

```ts
const tf = new ThinkFleet({
  apiKey:    'sk-...',                    // Required
  projectId: 'proj_...',                  // Required (default project)
  baseUrl:   'https://app.thinkfleet.ai', // Default: https://app.thinkfleet.ai
  maxRetries: 2,                          // Retries 429/5xx with exponential backoff
  timeout:   30_000,                      // Default 30s. agents.chat overrides to 120s.
  fetch:     globalThis.fetch,            // Bring your own (e.g. node-fetch < 18)
  requestInterceptors:  [...],            // Mutate request init before send
  responseInterceptors: [...],            // Inspect Response before JSON parse
})
```

### Per-request project override

Pass `projectId` in the per-request options to call into a different project than the client default:

```ts
await tf.flows.list(undefined, { projectId: 'proj_other' })
```

---

## Resources

The client exposes one property per resource. Every method returns a typed Promise (or AsyncGenerator for streaming).

| Property            | Class                       | What it covers                                          |
| ------------------- | --------------------------- | ------------------------------------------------------- |
| `tf.agents`         | `AgentsResource`            | List/get agents, chat, streaming chat, manage tools     |
| `tf.tasks`          | `TasksResource`             | Smart routing: classify, dispatch, history, follow-up   |
| `tf.flows`          | `FlowsResource`             | CRUD flows, enable/disable, run, export/import templates|
| `tf.flowRuns`       | `FlowRunsResource`          | List runs, retry, wait until terminal                   |
| `tf.knowledgeBases` | `KnowledgeBasesResource`    | KB CRUD, search, documents, sources                     |
| `tf.memory`         | `MemoryResource`            | Agent / project / admin scope memory                    |
| `tf.connections`    | `ConnectionsResource`       | App connections (OAuth, API key, etc.) + test           |
| `tf.connections.global` | `GlobalConnectionsResource` | Platform-scoped connections shared across projects (admin) |
| `tf.oauth`          | `OAuthResource`             | OAuth provider catalog + integration configs (admin)    |
| `tf.mcp`            | `McpResource`               | MCP server, integrations, external servers, skills      |
| `tf.crews`          | `CrewsResource`             | Crews, projects, kanban boards, columns, tasks          |
| `tf.orgChart`       | `OrgChartResource`          | Positions, goals, connected agents, cost summary        |
| `tf.locations`      | `LocationsResource`         | Locations, tree, members                                |
| `tf.projects`       | `ProjectsResource`          | Project list / get                                      |
| `tf.guardrails`     | `GuardrailsResource`        | Policy, pattern catalog, test-scan                      |
| `tf.shield`         | `ShieldResource`            | Shield Dashboard analytics (when plan permits)          |
| `tf.voice`          | `VoiceResource`             | Voice catalog + TTS preview                             |
| `tf.lattice`        | `LatticeResource`           | Behavioral pattern intelligence — extract, monitor, retrieve, search |
| `tf.eventDestinations` | `EventDestinationsResource` | Webhook subscriptions for platform events            |

---

## Common patterns

### Agents — chat & streaming

```ts
// Non-streaming
const out = await tf.agents.chat(agentId, {
  sessionId: 'sess-1',
  message: 'What flows are failing today?',
})

// Streaming (SSE-backed AsyncGenerator)
for await (const event of tf.agents.chatStream(agentId, { sessionId: 'sess-1', message: 'Hello' })) {
  if (event.event === 'token') process.stdout.write(event.data)
}
```

### Agents — tools

```ts
await tf.agents.tools.addKnowledgeBase(agentId, {
  displayName: 'Company docs',
  knowledgeBaseIds: ['kb_...'],
  topK: 5,
})
await tf.agents.tools.addIntegration(agentId, {
  displayName: 'Send email via Gmail',
  pieceName: '@activepieces/piece-gmail',
  actionName: 'send_email',
  connectionId: 'conn_...',
})
```

### Smart Tasks — classify → dispatch

```ts
const cls = await tf.tasks.classify({ message: 'Write a Python script to parse CSV.' })
const { agentId, sessionId } = await tf.tasks.dispatch({
  personaId: cls.personaId,
  message: 'Write a Python script to parse CSV.',
})
const history = await tf.tasks.getHistory(agentId, sessionId)
```

### Flows — create, run, export

```ts
const flow = await tf.flows.create({ displayName: 'Lead-routing v1' })
await tf.flows.update(flow.id, { /* operations */ })
await tf.flows.enable(flow.id)
const run = await tf.flows.runAndWait(flow.id, { input: { foo: 'bar' } })
const exported = await tf.flows.getTemplate(flow.id) // FlowTemplateExport — name, type, summary, pieces, ...
```

### Knowledge bases

```ts
const kb = await tf.knowledgeBases.create({
  name: 'Company Docs',
  embeddingProvider: 'openai',
  embeddingModel: 'text-embedding-3-small',
  embeddingDimension: 1536,
})

const file = new File([new TextEncoder().encode('hello world')], 'note.txt', { type: 'text/plain' })
const doc = await tf.knowledgeBases.documents.upload(kb.id, file)
const chunks = await tf.knowledgeBases.documents.chunks(kb.id, doc.id)

const hits = await tf.knowledgeBases.search({
  query: 'PTO policy',
  knowledgeBaseIds: [kb.id],
})
```

### Memory (three scopes)

```ts
// Agent-scoped (default for agent learnings)
await tf.memory.create(agentId, {
  content: 'Customer prefers concise replies.',
  type: MemoryItemType.PREFERENCE,
  scope: MemoryScope.PROJECT,
})
const hits = await tf.memory.search(agentId, { query: 'preferences', limit: 5 })

// Admin (project-wide review queue, stats, promotion)
const stats = await tf.memory.admin.stats()
const queue = await tf.memory.admin.listPendingReview({ limit: 50 })

// User-scope (`tf.memory.user`) requires a per-user token, not a project API key.
```

### Connections — OAuth + API key + Composio fallback

```ts
const all = await tf.connections.list()
const conn = await tf.connections.get(all.data[0].id)         // resolved client-side from list
const status = await tf.connections.test(conn.id)             // active | error
const method = await tf.connections.methodForPiece('@activepieces/piece-gmail')
// → { method: 'native' | 'composio', hasCredentials: boolean }

// Start an OAuth Authorization-Code flow (returns a URL to redirect the user to)
const { authorizationUrl, sessionId } = await tf.connections.initiate({
  providerSlug: 'github',
  callbackUrl: 'https://your.app/oauth/callback',
})

// Direct-connect API key / basic creds
await tf.connections.connect({
  pieceName: '@activepieces/piece-stripe',
  displayName: 'Stripe — production',
  value: { type: 'SECRET_TEXT', secretText: 'sk_live_...' },
})
```

### Global connections — share one credential across many projects

A **global connection** is owned by the platform (not a single project) and made visible to one or more projects. Pass `allProjects: true` to share with every project on the platform, including projects created *after* the call — no more "add my new project to every global connection" toil.

Requires a **platform-admin** API key. Project-scoped keys hit `403`.

```ts
// Option A — set-and-forget: applies to all current AND future projects
const conn = await tf.connections.global.upsert({
  type: 'SECRET_TEXT',
  pieceName: 'openai',
  displayName: 'OpenAI (platform-wide)',
  value: { type: 'SECRET_TEXT', secret_text: process.env.OPENAI_API_KEY! },
  projectIds: [],         // ignored when allProjects: true — pass []
  allProjects: true,
})
console.log(conn.id, conn.allProjects) // → "<id>", true

// Option B — explicit allowlist
await tf.connections.global.upsert({
  type: 'SECRET_TEXT',
  pieceName: 'openai',
  displayName: 'OpenAI (team A + team B)',
  value: { type: 'SECRET_TEXT', secret_text: process.env.OPENAI_API_KEY! },
  projectIds: ['proj_a', 'proj_b'],
})

// Toggle "all projects" on an existing connection (no need to recreate)
await tf.connections.global.update(conn.id, {
  displayName: conn.displayName,
  allProjects: true,
})

// Idempotently grant a newly-created project access to existing globals
const project = await tf.projects.create({ displayName: 'New Project' })
await tf.connections.global.addProjects(conn.id, { projectIds: [project.id] })

// Other operations
await tf.connections.global.list({ pieceName: 'openai' })
await tf.connections.global.removeProjects(conn.id, { projectIds: ['proj_a'] })
await tf.connections.global.delete(conn.id)
```

### OAuth admin — provider catalog + integration configs

```ts
const providers = await tf.oauth.providers.list()  // SeekPage<OAuthProvider> — paginated
const google = await tf.oauth.providers.get('google')

const configs = await tf.oauth.configs.list()      // SeekPage<IntegrationConfig> — platform OAuth apps
const available = await tf.oauth.configs.listAvailable()
await tf.oauth.configs.create({
  providerSlug: 'github',
  clientId: '...',
  clientSecret: '...',
  scopes: ['repo', 'user'],
})
```

### MCP server

```ts
const server = await tf.mcp.get()
const { url, token } = await tf.mcp.getConnectionInfo() // share with Claude Code, Cursor, Codex, etc.
const integrations = await tf.mcp.integrations.list()
const externals    = await tf.mcp.externalServers.list()
const skills       = await tf.mcp.skills()              // McpSkillsManifest (JSON, Claude format)
const openapi      = await tf.mcp.skillsOpenApi()       // OpenAPI 3.0 YAML — raw string
```

### Crews + kanban boards

```ts
const crew = (await tf.crews.list())[0]
const projects = await tf.crews.listProjects(crew.id)
const board = await tf.crews.getBoard(crew.id, projects[0].id)
const cost  = await tf.crews.getCostSummary(crew.id, projects[0].id)
```

### Org Chart — positions, goals, agents

```ts
const positions = await tf.orgChart.positions.list()
const pos = await tf.orgChart.positions.get(positions[0].id)         // resolved from list
const reports = await tf.orgChart.positions.listReports(pos.id)
const deliverables = await tf.orgChart.positions.listDeliverables(pos.id)

const goals = await tf.orgChart.goals.list({ status: 'active' })
const goal = await tf.orgChart.goals.get(goals[0].id)                // resolved from list
const activity = await tf.orgChart.goals.getActivity(goal.id)
await tf.orgChart.goals.decompose(goal.id)                           // AI subdivides into sub-goals

const cost = await tf.orgChart.getCostSummary()
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

### Locations

```ts
const tree = await tf.locations.tree()
const flat = await tf.locations.list()
const loc = await tf.locations.get(flat[0].id)
const members = await tf.locations.listMembers(loc.id)
```

### Voice

```ts
const voices = tf.voice.listVoices()                          // sync — built-in catalog
const eleven = tf.voice.listVoicesByProvider('elevenlabs')
const audio  = await tf.voice.preview({ provider: 'elevenlabs', voiceId, text: 'Hello' }) // ArrayBuffer (audio/mpeg)
```

### Guardrails

```ts
const policy = await tf.guardrails.get()
const catalog = await tf.guardrails.getPatternCatalog()
const scan = await tf.guardrails.testScan({ text: 'My SSN is 123-45-6789.' })
// → { matches: [{ patternId, matchedText, severity, ... }], ... }
```

### Shield (when platform plan has `shieldEnabled`)

```ts
const overview = await tf.shield.overview()
const events   = await tf.shield.listEvents({ limit: 50 })
const cost     = await tf.shield.costAnalytics({ startDate, endDate })
const breakdown = await tf.shield.developerBreakdown()
```

### Lattice — behavioral pattern intelligence

```ts
// Bulk extract patterns across the project
const { patternsCreated, patternsRefreshed } = await tf.lattice.extractPatterns({ windowDays: 90 })

// List contacts that have at least one active pattern
const { contacts } = await tf.lattice.listContacts({ activeOnly: true })

// Drill into one contact's patterns + full retrieval bundle
const patterns = await tf.lattice.listPatterns(contactId)
const ctx      = await tf.lattice.getContext(contactId, { eventLimit: 15, memoryLimit: 10 })

// Manually run the monitor tick (cron does this every 15 min)
const tick = await tf.lattice.runMonitorTick()
console.log(`${tick.breaksEmitted} pattern_break events emitted`)

// Cross-entity search across contacts, events, and patterns
const hits = await tf.lattice.search({ q: 'pizza', types: ['contact', 'pattern'] })
```

When a pattern goes overdue past its tolerance window, the engine emits a
`pattern_break` contact event — subscribe to it via the
`customer-engagement` piece's `pattern-break` trigger (in flows) or via
`tf.eventDestinations` (as a webhook).

---

## Error handling

The SDK throws typed errors so consumers can `instanceof` and recover precisely:

```ts
import {
  ThinkFleetError,
  AuthenticationError,    // 401
  AuthorizationError,     // 403
  NotFoundError,          // 404
  ValidationError,        // 400 | 422
  RateLimitError,         // 429 (auto-retried up to maxRetries)
  ServerError,            // 5xx (auto-retried up to maxRetries)
  TimeoutError,           // request timed out
} from '@thinkfleet/sdk'

try {
  await tf.agents.chat(id, { sessionId, message })
} catch (err) {
  if (err instanceof RateLimitError)   { /* respect err.retryAfterMs */ }
  else if (err instanceof TimeoutError) { /* extend timeout */ }
  else if (err instanceof ThinkFleetError) { console.error(err.statusCode, err.code, err.message) }
  else throw err
}
```

---

## Validating against your platform

`test-app.ts` exercises every public endpoint against a live platform. To run it:

```bash
export THINKFLEET_API_KEY="sk-..."
export THINKFLEET_PROJECT_ID="proj_..."
export THINKFLEET_BASE_URL="https://app.thinkfleet.ai"
npx tsx test-app.ts
```

You should see roughly: **~73 passed, 0 failed, ~33 skipped** (skipped = destructive admin operations or features that need extra setup like ElevenLabs credits).

Tests use the prefix `SDK_TEST_<timestamp>` for any entity they create, then delete on success.

---

## Requirements

- Node 18+ (or Bun, Deno, or a modern browser supporting `fetch` + `ReadableStream`)
- A ThinkFleet API key with at least project-read scope
- A project ID (Platform Admin → Projects)

## License

Apache-2.0 © ThinkFleet
