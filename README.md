# @thinkfleet/sdk

TypeScript SDK for the ThinkFleet AI platform. Build apps on sandboxed Functions and connected Databases, give AI agents your tools over MCP, and drive Flows, Connections, customer intelligence (Lattice + engagement), Knowledge Bases and external Secret Managers — from any Node 18+, Bun, Deno, or modern-browser environment that supports `fetch`.

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

// Run a flow and wait for the result
const run = await tf.flows.run('flow-id', { input: { customer: 'acme' } })
console.log(run.status)
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
| `tf.functions`      | `FunctionsResource`         | Sandboxed code as an API: CRUD, run, test, runs, keys, public `invoke` |
| `tf.databases`      | `DatabasesResource`         | Connect Postgres, schema, FQL and SQL queries           |
| `tf.flows`          | `FlowsResource`             | CRUD flows, enable/disable, run, export/import templates|
| `tf.flowRuns`       | `FlowRunsResource`          | List runs, retry, wait until terminal                   |
| `tf.mcp`            | `McpResource`               | MCP server, token, tool-call audit log, `listTools` / `callTool` |
| `tf.contacts`       | `ContactsResource`          | Customer records, lookup by phone/email/external ID, events |
| `tf.lattice`        | `LatticeResource`           | Behavior patterns, predictions (pattern breaks), contact context |
| `tf.engagement`     | `EngagementResource`        | Engagement rules, executions, outcomes, promotions, dispatch log |
| `tf.connections`    | `ConnectionsResource`       | App connections (OAuth, API key, etc.) + test           |
| `tf.connections.global` | `GlobalConnectionsResource` | Platform-scoped connections shared across projects (admin) |
| `tf.oauth`          | `OAuthResource`             | OAuth provider catalog + integration configs (admin)    |
| `tf.secretManagers` | `SecretManagersResource`    | BYO external vault (HashiCorp/AWS/Conjur/1Password) for connection secrets |
| `tf.knowledgeBases` | `KnowledgeBasesResource`    | KB CRUD, search, documents, sources                     |
| `tf.locations`      | `LocationsResource`         | Locations, tree, members                                |
| `tf.projects`       | `ProjectsResource`          | Project list / get                                      |
| `tf.guardrails`     | `GuardrailsResource`        | Policy, pattern catalog, test-scan                      |
| `tf.eventDestinations` | `EventDestinationsResource` | Webhook subscriptions for platform events            |

---

## Common patterns

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

### Connections — OAuth + API key + Composio fallback

```ts
const all = await tf.connections.list()
const conn = await tf.connections.get(all.data[0].id)         // resolved client-side from list
const status = await tf.connections.test(conn.id)             // active | error
const method = await tf.connections.methodForPiece('gmail')
// → { method: 'native' | 'composio', hasCredentials: boolean }

// Start an OAuth Authorization-Code flow (returns a URL to redirect the user to)
const { authorizationUrl, sessionId } = await tf.connections.initiate({
  providerSlug: 'github',
  callbackUrl: 'https://your.app/oauth/callback',
})

// Direct-connect API key / basic creds
await tf.connections.connect({
  pieceName: 'stripe',
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

### Functions — your code as an API

Functions run in a sandbox (no filesystem, environment or private network) with
`ctx.db.<name>` for bound databases, `ctx.fetch` for the public internet and
`ctx.sleep`.

```ts
const fn = await tf.functions.create({
  name: 'top-customers',
  databases: ['shop'],
  inputs: { limit: 'number' },
  publicEnabled: true,   // POST /api/v1/fn/:id with the function key
  mcpEnabled: true,      // fn_top_customers_xxxx tool on the project MCP server
  sourceCode: {
    packageJson: '{}',
    code: `export default async ({ limit = 10 }, ctx) =>
      ctx.db.shop.find('customers', { orderBy: '-lifetime_value', limit })`,
  },
})

// Try unsaved code (editors, coding agents)
const trial = await tf.functions.test({ sourceCode: fn.sourceCode, input: { limit: 3 }, databases: ['shop'] })

// Run with your API key (resolves { success: false, errorCode } on failure)
const run = await tf.functions.run(fn.id, { limit: 5 })

// From your app's backend: the public endpoint and the fnk_ key
const { apiKey } = await tf.functions.rotateKey(fn.id) // shown once; store as a secret
const { output, runId } = await tf.functions.invoke(fn.id, { limit: 5 }, { key: apiKey })

const runs = await tf.functions.listRuns(fn.id, { limit: 20 })
```

### Databases — connect once, query with FQL or SQL

```ts
const db = await tf.databases.create({
  name: 'shop',                                   // ctx.db.shop in Functions
  connectionString: process.env.SHOP_DATABASE_URL, // tested before saving, encrypted, never returned
  access: 'READ_ONLY',
  mcpEnabled: true,                               // db_query for agents (always read-only)
})
const { tables } = await tf.databases.schema(db.id)
const { rows } = await tf.databases.find(db.id, { find: 'orders', where: { total: { gte: 100 } }, orderBy: '-created_at', limit: 20 })
const count = await tf.databases.sql(db.id, 'select count(*) from orders where status = $1', ['paid'])
```

### MCP server — your tools for AI agents

One endpoint exposes the project's Functions (`fn_*`), database tools
(`db_list`, `db_schema`, `db_query`), customer intelligence (`tf_*`) and flows.

```ts
console.log(await tf.mcp.claudeCodeCommand())        // claude mcp add ... (contains the token)
const { url, token } = await tf.mcp.getConnectionInfo() // Cursor, Codex, any MCP client

const tools = await tf.mcp.listTools()
const result = await tf.mcp.callTool('db_query', { database: 'shop', query: { find: 'orders', limit: 5 } })

await tf.mcp.update({ disabledTools: ['ap_delete_flow'] })
const audit = await tf.mcp.toolCalls.list({ statuses: ['FAILED', 'DENIED'], limit: 50 })
```

### Customer intelligence — events in, predictions and engagement out

Send events from any system (POS, CRM, support, your app). Lattice learns each
customer's patterns and emits a `pattern_break` event when an expected behavior
doesn't happen; engagement rules act on it.

```ts
const { contact } = await tf.contacts.lookup({ email: 'sam@example.com', autoCreate: true })
await tf.contacts.logEvent({ contactId: contact!.id, eventType: 'purchase', title: 'Trail runner', eventData: { sku: 'SS-101', total: 129 } })

await tf.lattice.extractPatterns({ contactId: contact!.id })
const ctx = await tf.lattice.getContext(contact!.id)   // patterns, recent events, facts — for AI messages

await tf.engagement.rules.create({
  name: 'Missed weekly visit',
  triggerConfig: { type: 'event', eventType: 'pattern_break' },
  contactFilter: { segments: ['loyal', 'at-risk'] },
  actionConfig: { actionType: 'dispatch_flow_event', channel: 'sms', linkedFlowId, promptTemplate: 'Friendly check-in about their usual order.' },
  enabled: true,
})
await tf.engagement.rules.recordOutcome(ruleId, { contactId: contact!.id, outcome: 'converted' })
```

> Customers, Lattice and engagement are segregated by project and location. Pass `locationId` to the client (or per call) to work inside one location; without it you see the whole project. Rules only reach customers in their own location.

### Secret Managers — BYO external vault

Store connection secrets in your own vault (HashiCorp Vault, AWS Secrets
Manager, CyberArk Conjur, 1Password). Secrets are resolved from your vault at
flow run time and never stored in ThinkFleet's database. Requires a
**platform-admin** API key.

```ts
import { SecretManagerProvider, SecretManagerScope, buildSecretReference } from '@thinkfleet/sdk'

// 1. Connect a vault (credentials are live-tested before saving)
const mgr = await tf.secretManagers.connect({
  name: 'Production Vault',
  providerId: SecretManagerProvider.HASHICORP,
  scope: SecretManagerScope.PLATFORM,
  config: { url: 'https://vault.example.com', roleId: '...', secretId: '...' },
})

// 2. Reference a secret from a connection value
const ref = buildSecretReference(mgr.id, 'secret/data/db:password')
await tf.connections.connect({
  pieceName: 'postgres',
  displayName: 'Prod DB',
  value: { type: 'SECRET_TEXT', secretText: ref },
})

// List status / update / delete
const { data } = await tf.secretManagers.list()   // each row: { ..., status: { configured, connected } }
await tf.secretManagers.delete(mgr.id)
```

### Locations

```ts
const tree = await tf.locations.tree()
const flat = await tf.locations.list()
const loc = await tf.locations.get(flat[0].id)
const members = await tf.locations.listMembers(loc.id)
```

### Guardrails

```ts
const policy = await tf.guardrails.get()
const catalog = await tf.guardrails.getPatternCatalog()
const scan = await tf.guardrails.testScan({ text: 'My SSN is 123-45-6789.' })
// → { matches: [{ patternId, matchedText, severity, ... }], ... }
```

### Event destinations — webhooks for platform events

```ts
import { ApplicationEventName } from '@thinkfleet/sdk'

await tf.eventDestinations.create({
  url: 'https://my-app.example.com/hooks/thinkfleet',
  events: [ApplicationEventName.FLOW_RUN_FINISHED],
})
```

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
  await tf.flows.run(flowId, { input })
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
