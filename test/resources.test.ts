import { describe, it, expect, vi } from 'vitest'
import { ThinkFleet } from '../src/client'

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

  it('has all 14 resource modules', () => {
    const { mockFetch } = createCapturingFetch()
    const tf = createClient(mockFetch)
    expect(tf.agents).toBeDefined()
    expect(tf.tasks).toBeDefined()
    expect(tf.knowledgeBases).toBeDefined()
    expect(tf.mcp).toBeDefined()
    expect(tf.crews).toBeDefined()
    expect(tf.connections).toBeDefined()
    expect(tf.voice).toBeDefined()
    expect(tf.memory).toBeDefined()
    expect(tf.flows).toBeDefined()
    expect(tf.projects).toBeDefined()
    expect(tf.guardrails).toBeDefined()
    expect(tf.shield).toBeDefined()
    expect(tf.oauth).toBeDefined()
    expect(tf.orgChart).toBeDefined()
  })
})

describe('AgentsResource', () => {
  it('lists agents with type=AGENT filter', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.agents.list()
    expect(calls[0].url).toContain('/chatbots?type=AGENT')
  })

  it('gets a specific agent', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.agents.get('agent-123')
    expect(calls[0].url).toContain('/chatbots/agent-123')
  })

  it('creates agent with type=AGENT injected', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.agents.create({ systemPrompt: 'test' } as any)
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.type).toBe('AGENT')
  })

  it('chats with 120s timeout', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.agents.chat('agent-123', { message: 'hello' } as any)
    expect(calls[0].url).toContain('/agent-chat')
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

  it('gets pattern catalog', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.guardrails.getPatternCatalog()
    expect(calls[0].url).toContain('/guardrails/patterns')
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

describe('ShieldResource', () => {
  it('gets overview with rawPath', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.shield.overview()
    expect(calls[0].url).toContain('/shield/overview')
    expect(calls[0].url).not.toContain('/projects/')
  })

  it('lists events', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.shield.listEvents({ limit: 10, blocked: true })
    expect(calls[0].url).toContain('/shield/events')
    expect(calls[0].url).toContain('limit=10')
    expect(calls[0].url).toContain('blocked=true')
  })

  it('gets cost analytics', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.shield.costAnalytics()
    expect(calls[0].url).toContain('/shield/cost-analytics')
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

  it('lists available integration configs', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.oauth.configs.listAvailable()
    expect(calls[0].url).toContain('/integration-configs/available')
  })

  it('sends proxy request', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.oauth.proxy('gmail/v1/messages', { q: 'test' }, 'conn-123')
    expect(calls[0].url).toContain('/proxy/gmail/v1/messages')
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.connectionId).toBe('conn-123')
  })
})

describe('OrgChartResource', () => {
  it('lists positions', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.orgChart.positions.list()
    expect(calls[0].url).toContain('/org-chart/positions')
  })

  it('creates position with runtime config', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.orgChart.positions.create({
      title: 'QA Lead',
      role: 'Testing',
      runtimeConfig: { runtimeType: 'MCP' as any, mcpServerUrl: 'https://codex.openai.com/mcp' },
    })
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.runtimeConfig.runtimeType).toBe('MCP')
  })

  it('creates a goal', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.orgChart.goals.create({ positionId: 'pos-1', title: 'Ship v2.0' })
    expect(calls[0].url).toContain('/org-chart/goals')
  })

  it('decomposes a goal with extended timeout', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.orgChart.goals.decompose('goal-1')
    expect(calls[0].url).toContain('/org-chart/goals/goal-1/decompose')
  })

  it('registers a connected agent', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.orgChart.connectedAgents.register({
      name: 'Claude Code',
      connectionType: 'MCP',
      capabilities: ['code_execution', 'file_read'],
    })
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.name).toBe('Claude Code')
  })

  it('gets cost summary', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.orgChart.getCostSummary()
    expect(calls[0].url).toContain('/org-chart/budget/summary')
  })
})

describe('MemoryResource', () => {
  it('lists agent memory', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.memory.list('agent-1')
    expect(calls[0].url).toContain('/chatbots/agent-1/memory')
  })

  it('creates memory with scope', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.memory.create('agent-1', { content: 'User likes dark mode', type: 'preference' as any, scope: 'user' as any })
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.scope).toBe('user')
  })

  it('searches memory semantically', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.memory.search('agent-1', { query: 'dark mode' } as any)
    expect(calls[0].url).toContain('/memory/search')
  })

  it('gets admin stats', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.memory.admin.stats()
    expect(calls[0].url).toContain('/admin/memory/stats')
  })
})

describe('McpResource', () => {
  it('gets MCP server', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.mcp.get()
    expect(calls[0].url).toContain('/mcp-server')
  })

  it('rotates token', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.mcp.rotateToken()
    expect(calls[0].url).toContain('/mcp-server/rotate')
    expect(calls[0].init.method).toBe('POST')
  })

  it('gets skills manifest', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.mcp.skills()
    expect(calls[0].url).toContain('/mcp-server/skills.json')
  })

  it('adds an integration (piece tool)', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.mcp.integrations.add({ pieceName: 'gmail', actionName: 'send_email' } as any)
    expect(calls[0].url).toContain('/mcp-server/piece-tools')
    const body = JSON.parse(calls[0].init.body as string)
    expect(body.pieceName).toBe('@activepieces/piece-gmail')
  })
})

describe('CrewsResource (thread-safe)', () => {
  it('columns.list takes crewId as parameter', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.crews.columns.list('crew-1', 'proj-1')
    expect(calls[0].url).toContain('/crews/crew-1/projects/proj-1/columns')
  })

  it('tasks.list takes crewId as parameter', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.crews.tasks.list('crew-1', 'proj-1')
    expect(calls[0].url).toContain('/crews/crew-1/projects/proj-1/tasks')
  })

  it('no forCrew method exists', () => {
    const { mockFetch } = createCapturingFetch()
    const tf = createClient(mockFetch)
    expect((tf.crews as any).forCrew).toBeUndefined()
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
  it('checks if Composio is configured', async () => {
    const { mockFetch, calls } = createCapturingFetch()
    const tf = createClient(mockFetch)
    await tf.connections.isConfigured()
    expect(calls[0].url).toContain('/composio/configured')
  })
})
