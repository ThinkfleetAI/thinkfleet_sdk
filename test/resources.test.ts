import { describe, it, expect, vi } from 'vitest'
import { ThinkFleet } from '../src/client'
import {
  normalizePieceName,
  denormalizeLegacyPiecePrefix,
  rewriteLegacyPiecePrefixDeep,
} from '../src/core/piece-name'
import { SecretManagerProvider, SecretManagerScope, buildSecretReference } from '../src/types/secret-managers'

// Mock fetch that captures requests for verification
function createCapturingFetch() {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const mockFetch = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      headers: { get: () => null },
      body: null,
    }
  })
  return { mockFetch, calls }
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  const text = JSON.stringify(body)
  return {
    ok: status < 400, status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(text),
    headers: { get: (k: string) => ({ 'content-type': 'application/json', ...headers } as Record<string, string>)[k.toLowerCase()] ?? null },
    body: null,
  }
}

function sseResponse(message: unknown) {
  const text = `event: message\ndata: ${JSON.stringify(message)}\n\n`
  return {
    ok: true, status: 200,
    json: () => Promise.reject(new Error('not json')),
    text: () => Promise.resolve(text),
    headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? 'text/event-stream' : null) },
    body: null,
  }
}

function createClient(mockFetch: any) {
  return new ThinkFleet({
    apiKey: 'sk-test-key',
    projectId: 'proj-abc',
    baseUrl: 'https://api.test.com',
    fetch: mockFetch,
  })
}

describe('ThinkFleet Client', () => {
  it('requires apiKey', () => {
    expect(() => new ThinkFleet({ apiKey: '', projectId: 'proj' })).toThrow('apiKey is required')
  })

  it('requires projectId', () => {
    expect(() => new ThinkFleet({ apiKey: 'key', projectId: '' })).toThrow('projectId is required')
  })

  it('exposes the MCP + Flows + Connect resource modules', () => {
    const { mockFetch } = createCapturingFetch()
    const tf = createClient(mockFetch)
    expect(tf.knowledgeBases).toBeDefined()
    expect(tf.mcp).toBeDefined()
    expect(tf.connections).toBeDefined()
    expect(tf.flows).toBeDefined()
    expect(tf.flowRuns).toBeDefined()
    expect(tf.locations).toBeDefined()
    expect(tf.projects).toBeDefined()
    expect(tf.guardrails).toBeDefined()
    expect(tf.oauth).toBeDefined()
    expect(tf.eventDestinations).toBeDefined()
    expect(tf.secretManagers).toBeDefined()
    expect(tf.functions).toBeDefined()
    expect(tf.databases).toBeDefined()
    expect(tf.contacts).toBeDefined()
    expect(tf.lattice).toBeDefined()
    expect(tf.engagement).toBeDefined()
  })

  it('no longer exposes removed resources', () => {
    const { mockFetch } = createCapturingFetch()
    const tf = createClient(mockFetch) as any
    for (const name of ['agents', 'crews', 'tasks', 'memory', 'orgChart', 'voice', 'media', 'messageTemplates', 'shield']) {
      expect(tf[name]).toBeUndefined()
    }
  })
})

describe('GuardrailsResource', () => {
  it('gets guardrail policy', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.guardrails.get()
    expect(calls[0].url).toContain('/guardrails')
    expect(calls[0].init.method).toBe('GET')
  })

  it('updates guardrail policy', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.guardrails.update({ piiDetection: { enabled: true, action: 'REDACT' as any } })
    expect(calls[0].init.method).toBe('PATCH')
  })

  it('test scans text', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.guardrails.testScan({ text: 'My SSN is 123-45-6789' })
    expect(calls[0].init.method).toBe('POST')
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.text).toContain('123-45-6789')
  })
})

describe('OAuthResource', () => {
  it('lists providers with rawPath', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.oauth.providers.list({ search: 'google' })
    expect(calls[0].url).toContain('/providers?search=google')
    expect(calls[0].url).not.toContain('/projects/')
  })

  it('initiates OAuth flow', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.oauth.initiate({
      providerSlug: 'google',
      callbackUrl: 'http://localhost:3000/callback',
    })
    expect(calls[0].url).toContain('/oauth/initiate')
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.providerSlug).toBe('google')
  })
})

describe('SecretManagersResource', () => {
  it('lists secret managers with rawPath', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.secretManagers.list()
    expect(calls[0].url).toContain('/secret-managers')
    expect(calls[0].url).not.toContain('/projects/')
  })

  it('connects a HashiCorp vault', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.secretManagers.connect({
      name: 'Prod Vault',
      providerId: SecretManagerProvider.HASHICORP,
      scope: SecretManagerScope.PLATFORM,
      config: { url: 'https://vault.example.com', roleId: 'r', secretId: 's' },
    })
    expect(calls[0].init.method).toBe('POST')
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.providerId).toBe('hashicorp')
  })

  it('builds a secret reference string', () => {
    expect(buildSecretReference('conn-1', 'secret/data/db:password')).toBe(
      '{{conn-1|ap_sep_v1|secret/data/db:password}}',
    )
  })
})

describe('McpResource', () => {
  it('gets MCP server', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.mcp.get()
    expect(calls[0].url).toContain('/mcp-server')
  })

  it('updates disabled tools, rotates, lists tool calls', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.mcp.update({ disabledTools: ['ap_list_flows'] })
    await tf.mcp.rotateToken()
    await tf.mcp.toolCalls.list({ toolName: 'db_query', statuses: ['FAILED', 'DENIED'], limit: 10 })
    expect(calls[0].url).toBe('https://api.test.com/api/v1/projects/proj-abc/mcp-server')
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ disabledTools: ['ap_list_flows'] })
    expect(calls[1].url).toContain('/mcp-server/rotate')
    expect(calls[2].url).toBe('https://api.test.com/api/v1/projects/proj-abc/mcp-server/tool-calls?toolName=db_query&statuses=FAILED&statuses=DENIED&limit=10')
  })

  it('lists tools over JSON-RPC with the MCP token, not the API key', async () => {
    const seen: Array<{ url: string; init: RequestInit }> = []
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      seen.push({ url, init })
      if (url.endsWith('/mcp-server')) return jsonResponse({ token: 'mcp-tok', disabledTools: null, flows: [] })
      const { id } = JSON.parse(init.body as string)
      return sseResponse({ jsonrpc: '2.0', id, result: { tools: [{ name: 'fn_top_customers_ab12', inputSchema: {} }] } })
    })
    const tf = createClient(fetch)
    const tools = await tf.mcp.listTools()
    expect(tools.map(t => t.name)).toEqual(['fn_top_customers_ab12'])
    const rpc = seen[1]
    expect(rpc.url).toBe('https://api.test.com/api/v1/projects/proj-abc/mcp-server/http')
    expect((rpc.init.headers as Record<string, string>).Authorization).toBe('Bearer mcp-tok')
    expect(JSON.parse(rpc.init.body as string).method).toBe('tools/list')
  })

  it('calls a tool and surfaces JSON-RPC errors', async () => {
    const fetch = vi.fn(async (_url: string, init: RequestInit) => {
      const { id, params } = JSON.parse(init.body as string)
      if (params.name === 'missing') return jsonResponse({ jsonrpc: '2.0', id, error: { code: -32602, message: 'Tool missing not found' } })
      return jsonResponse({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: '[]' }] } })
    })
    const tf = createClient(fetch)
    const ok = await tf.mcp.callTool('db_list', {}, { token: 't' })
    expect(ok.content[0].text).toBe('[]')
    await expect(tf.mcp.callTool('missing', {}, { token: 't' })).rejects.toMatchObject({ code: 'MCP_ERROR' })
  })
})

describe('FunctionsResource', () => {
  it('maps CRUD, run, test, runs and rotate-key to project routes', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.functions.create({ name: 'f', sourceCode: { code: 'export default () => 1', packageJson: '{}' } })
    await tf.functions.update('fn1', { mcpEnabled: true })
    await tf.functions.run('fn1', { limit: 5 })
    await tf.functions.test({ sourceCode: { code: 'x', packageJson: '{}' }, input: {} })
    await tf.functions.listRuns('fn1', { limit: 3 })
    await tf.functions.rotateKey('fn1')
    const base = 'https://api.test.com/api/v1/projects/proj-abc/functions'
    expect(calls.map(c => `${c.init.method} ${c.url}`)).toEqual([
      `POST ${base}`,
      `POST ${base}/fn1`,
      `POST ${base}/fn1/run`,
      `POST ${base}/test`,
      `GET ${base}/fn1/runs?limit=3`,
      `POST ${base}/fn1/rotate-key`,
    ])
    expect(JSON.parse(calls[2].init.body as string)).toEqual({ input: { limit: 5 } })
  })

  it('invokes the public endpoint with the function key and reads run headers', async () => {
    const seen: Array<{ url: string; init: RequestInit }> = []
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      seen.push({ url, init })
      return jsonResponse([{ id: 1 }], 200, { 'x-flobyte-run-id': 'run1', 'x-flobyte-duration-ms': '42' })
    })
    const tf = createClient(fetch)
    const res = await tf.functions.invoke('fn1', { limit: 1 }, { key: 'fnk_abc' })
    expect(seen[0].url).toBe('https://api.test.com/api/v1/fn/fn1')
    expect((seen[0].init.headers as Record<string, string>).Authorization).toBe('Bearer fnk_abc')
    expect(res).toEqual({ output: [{ id: 1 }], runId: 'run1', durationMs: 42 })
  })

  it('throws the function error code from the public endpoint', async () => {
    const fetch = vi.fn(async () => jsonResponse({ error: { code: 'INVALID_INPUT', message: 'Input "limit" must be of type Number' } }, 400))
    const tf = createClient(fetch)
    await expect(tf.functions.invoke('fn1', {}, { key: 'fnk_abc' })).rejects.toMatchObject({ code: 'INVALID_INPUT', statusCode: 400 })
    await expect(tf.functions.invoke('fn1', {}, { key: '' })).rejects.toThrow('function key')
  })
})

describe('DatabasesResource', () => {
  it('maps CRUD, test, schema and queries', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.databases.create({ name: 'shop', connectionString: 'postgres://u:p@h/db' })
    await tf.databases.test('db1')
    await tf.databases.schema('db1')
    await tf.databases.find('db1', { find: 'orders', where: { total: { gte: 100 } }, limit: 5 })
    await tf.databases.sql('db1', 'select 1 where $1', [true])
    const base = 'https://api.test.com/api/v1/projects/proj-abc/function-databases'
    expect(calls.map(c => `${c.init.method} ${c.url}`)).toEqual([
      `POST ${base}`, `POST ${base}/db1/test`, `GET ${base}/db1/schema`, `POST ${base}/db1/query`, `POST ${base}/db1/query`,
    ])
    expect(JSON.parse(calls[3].init.body as string)).toEqual({ query: { find: 'orders', where: { total: { gte: 100 } }, limit: 5 } })
    expect(JSON.parse(calls[4].init.body as string)).toEqual({ sql: 'select 1 where $1', params: [true] })
  })
})

describe('customer intelligence resources', () => {
  it('maps contacts, lattice and engagement rules to live routes', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.contacts.listAll()
    await tf.contacts.deleteEvent('ev1')
    await tf.lattice.getContext('c1')
    await tf.engagement.rules.list()
    await tf.engagement.rules.run('r1')
    await tf.engagement.rules.recordOutcome('r1', { outcome: 'converted', contactId: 'c1' })
    await tf.engagement.rules.cancelExecution('x1')
    const base = 'https://api.test.com/api/v1/projects/proj-abc'
    const got = calls.map(c => `${c.init.method} ${c.url.split('?')[0]}`)
    expect(got).toEqual([
      `GET ${base}/contacts`,
      `DELETE ${base}/contact-events/ev1`,
      `GET ${base}/lattice/contacts/c1/context`,
      `GET ${base}/engagement-rules`,
      `POST ${base}/engagement-rules/r1/run`,
      `POST ${base}/engagement-rules/r1/outcomes`,
      `POST ${base}/engagement-rules/executions/x1/cancel`,
    ])
  })

  it('drops lattice methods whose routes no longer exist', () => {
    const tf = createClient(vi.fn()) as any
    expect(tf.lattice.observe).toBeUndefined()
    expect(tf.lattice.runDemoSeed).toBeUndefined()
  })
})

describe('KnowledgeBasesResource', () => {
  it('searches knowledge base', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.knowledgeBases.search({ query: 'refund policy' } as any)
    expect(calls[0].url).toContain('/knowledge-bases/search')
  })
})

describe('ConnectionsResource', () => {
  it('lists connections', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.connections.list()
    expect(calls[0].url).toContain('/app-connections')
  })
})

describe('piece-name normalization', () => {
  it('expands short names to @thinkfleet/piece-*', () => {
    expect(normalizePieceName('gmail')).toBe('@thinkfleet/piece-gmail')
  })

  it('passes canonical @thinkfleet/piece-* through unchanged', () => {
    expect(normalizePieceName('@thinkfleet/piece-gmail')).toBe('@thinkfleet/piece-gmail')
  })

  it('upgrades legacy @activepieces/piece-* to canonical form (back-compat)', () => {
    expect(normalizePieceName('@activepieces/piece-gmail')).toBe('@thinkfleet/piece-gmail')
  })

  it('denormalizeLegacyPiecePrefix rewrites a single string', () => {
    expect(denormalizeLegacyPiecePrefix('@activepieces/piece-stripe')).toBe('@thinkfleet/piece-stripe')
  })

  it('rewriteLegacyPiecePrefixDeep walks nested objects and arrays', () => {
    const input = {
      pieceName: '@activepieces/piece-gmail',
      steps: [{ settings: { pieceName: '@activepieces/piece-stripe' } }],
      other: 'unrelated',
    }
    const out = rewriteLegacyPiecePrefixDeep(input) as typeof input
    expect(out.pieceName).toBe('@thinkfleet/piece-gmail')
    expect(out.steps[0].settings.pieceName).toBe('@thinkfleet/piece-stripe')
    expect(out.other).toBe('unrelated')
  })

  it('http response is auto-rewritten to canonical prefix', async () => {
    const responseBody = {
      data: [{ pieceName: '@activepieces/piece-slack', displayName: 'Slack' }],
      next: null,
      previous: null,
    }
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: () => Promise.resolve(responseBody),
      text: () => Promise.resolve(''),
      headers: { get: () => null },
      body: null,
    }))
    const tf = createClient(mockFetch)
    const page = await tf.connections.list()
    expect(page.data[0].pieceName).toBe('@thinkfleet/piece-slack')
  })
})
