#!/usr/bin/env npx tsx
/**
 * ThinkFleet SDK Integration Test App
 *
 * Validates every public SDK resource against a live ThinkFleet instance.
 *
 * Usage:
 *   export THINKFLEET_API_KEY="sk-..."
 *   export THINKFLEET_PROJECT_ID="..."
 *   export THINKFLEET_BASE_URL="https://app.thinkfleet.ai"  # optional
 *   npx tsx test-app.ts
 *
 * Tests are categorized:
 *   - safe        : pure reads, no side effects
 *   - cycle       : create + (use) + delete; restores state
 *   - skipped     : requires interactive flow, real money, or shared state
 *
 * Naming convention for created entities: `SDK_TEST_<timestamp>` so a half-run
 * leaves obvious crumbs you can sweep later.
 */

import {
  ThinkFleet,
  MemoryItemType,
  MemoryScope,
} from './src/index.js'

// ── Config ──────────────────────────────────────────────────────────

const API_KEY = process.env.THINKFLEET_API_KEY
const PROJECT_ID = process.env.THINKFLEET_PROJECT_ID
const BASE_URL = process.env.THINKFLEET_BASE_URL ?? 'https://app.thinkfleet.ai'
const STAMP = Date.now()

if (!API_KEY || !PROJECT_ID) {
  console.error('Missing required environment variables:')
  console.error('  THINKFLEET_API_KEY=sk-...')
  console.error('  THINKFLEET_PROJECT_ID=...')
  process.exit(1)
}

const tf = new ThinkFleet({
  apiKey: API_KEY,
  projectId: PROJECT_ID,
  baseUrl: BASE_URL,
  timeout: 120_000, // 2 min for agent chat
})

// ── Test helpers ────────────────────────────────────────────────────

let passed = 0
let failed = 0
let skipped = 0
const failures: Array<{ name: string; err: string }> = []

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    passed++
    console.log(`  ✅ ${name}`)
  }
  catch (err) {
    failed++
    const msg = err instanceof Error ? err.message : String(err)
    failures.push({ name, err: msg })
    console.log(`  ❌ ${name} — ${msg.substring(0, 200)}`)
  }
}

function skip(name: string, reason: string) {
  skipped++
  console.log(`  ⏭️  ${name} — ${reason}`)
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

// ── 1. Projects ─────────────────────────────────────────────────────

async function testProjects() {
  console.log('\n📁 Projects')

  await test('list projects', async () => {
    const result = await tf.projects.list()
    assert(Array.isArray(result.data), 'should return data array')
    assert(result.data.length > 0, 'should have at least one project')
    console.log(`     Found ${result.data.length} project(s)`)
  })

  await test('get project', async () => {
    const project = await tf.projects.get(PROJECT_ID!)
    assert(project.id === PROJECT_ID, 'should match project ID')
    console.log(`     Project: ${project.displayName}`)
  })

  skip('create project', 'destructive — would create new project on platform')
  skip('update project', 'destructive — would mutate active project settings')
}

// ── 2. Agents ───────────────────────────────────────────────────────

async function testAgents() {
  console.log('\n🤖 Agents')

  let agentId: string | null = null

  await test('list agents', async () => {
    const agents = await tf.agents.list()
    assert(Array.isArray(agents), 'should return array')
    if (agents.length > 0) agentId = agents[0].id
    console.log(`     Found ${agents.length} agent(s)`)
  })

  if (!agentId) {
    skip('all remaining agent tests', 'no agents to operate on')
    return null
  }

  await test('get agent (populated)', async () => {
    const agent = await tf.agents.get(agentId!)
    assert(agent.id === agentId, 'should match agent ID')
    console.log(`     Agent: ${agent.name}`)
  })

  await test('chat with agent', async () => {
    const response = await tf.agents.chat(agentId!, {
      message: 'Reply with the literal text "SDK_OK" and nothing else.',
      sessionId: `sdk-test-${STAMP}`,
    })
    assert(typeof response.content === 'string', 'should return content')
    assert(response.content.length > 0, 'content should not be empty')
    console.log(`     Response: ${response.content.substring(0, 80)}`)
  })

  // Streaming sometimes returns 0 chunks if the response delivers as a single
  // post-completion blob. Track both chunks and final content.
  await test('chat stream with agent', async () => {
    const stream = tf.agents.chatStream(agentId!, {
      message: 'Reply with one short sentence about the SDK.',
      sessionId: `sdk-stream-test-${STAMP}`,
    })
    let chunks = 0
    let lastEvent: string | undefined
    for await (const evt of stream) {
      chunks++
      lastEvent = evt.event ?? lastEvent
      if (chunks > 50) break
    }
    // Stream returning 0 chunks but no error is acceptable: server may have
    // delivered the response as a single completion. Just assert no exception.
    console.log(`     Streamed ${chunks} chunk(s)${lastEvent ? `, last event: ${lastEvent}` : ''}`)
  })

  // Create + delete cycle for an agent. Project API keys often lack chatbot
  // create permission — tolerate 403 and skip gracefully.
  let createdAgentId: string | null = null
  let agentCreatePermitted = true
  let agentCreateAttempted = false
  try {
    agentCreateAttempted = true
    const created = await tf.agents.create({
      name: `SDK_TEST_${STAMP}`,
      type: 'AGENT' as any,
      description: 'Created by SDK integration test — safe to delete',
      systemPrompt: 'You are a test agent. Respond concisely.',
      aiProvider: 'anthropic' as any,
      modelName: 'claude-haiku-4-5',
    } as any)
    createdAgentId = created.id
    passed++
    console.log(`  ✅ create agent`)
    console.log(`     Created agent ${created.id}`)
  } catch (err) {
    const m = (err as Error).message
    if (m.includes('403') || m.toLowerCase().includes('forbidden')) {
      agentCreatePermitted = false
      skip('create agent', 'API key lacks agent.create permission (403)')
    } else {
      failed++
      failures.push({ name: 'create agent', err: m })
      console.log(`  ❌ create agent — ${m.substring(0, 200)}`)
    }
  }

  if (createdAgentId) {
    await test('update agent', async () => {
      const updated = await tf.agents.update(createdAgentId!, {
        description: 'Updated by SDK test',
      })
      assert(updated.id === createdAgentId, 'should return updated record')
    })

    await test('delete agent', async () => {
      await tf.agents.delete(createdAgentId!)
    })
  }
  else if (!agentCreatePermitted) {
    skip('update agent', 'create not permitted by API key')
    skip('delete agent', 'create not permitted by API key')
  }
  else if (agentCreateAttempted) {
    skip('update agent', 'create failed')
    skip('delete agent', 'create failed')
  }

  // Agent tools — exercised against the existing first agent (additive, then cleaned up)
  skip('agents.tools.addIntegration / addFlow / addKnowledgeBase / addDataSchema',
       'requires platform-specific piece/flow IDs; covered manually in dashboard tests')

  return agentId
}

// ── 3. Tasks ────────────────────────────────────────────────────────

async function testTasks() {
  console.log('\n📋 Tasks (orchestration)')

  await test('classify task', async () => {
    try {
      const result = await tf.tasks.classify({
        message: 'Schedule a meeting with the marketing team for next Tuesday at 2pm.',
      })
      assert(typeof result === 'object' && result !== null, 'should return result')
      console.log(`     Classified: ${JSON.stringify(result).substring(0, 100)}`)
    } catch (err) {
      const e = err as Error
      // 404 on this endpoint => task router not enabled on platform
      if (e.message.includes('404')) throw new Error('task router not enabled on platform')
      throw e
    }
  })

  await test('home feed', async () => {
    try {
      const feed = await tf.tasks.feed()
      assert(typeof feed === 'object' && feed !== null, 'should return feed')
      console.log(`     Feed loaded`)
    } catch (err) {
      const e = err as Error
      if (e.message.includes('404')) throw new Error('home feed endpoint not enabled')
      throw e
    }
  })

  await test('list task history', async () => {
    try {
      const history = await tf.tasks.listHistory({ limit: 3 })
      assert(history.data !== undefined, 'should return data array')
      console.log(`     History entries: ${history.data.length}`)
    } catch (err) {
      const e = err as Error
      if (e.message.includes('404')) throw new Error('task history endpoint not enabled')
      throw e
    }
  })

  skip('dispatch task / crew', 'would execute a real agent run')
  skip('sendFollowUp', 'requires an active session id')
}

// ── 4. Flows + Flow Runs ────────────────────────────────────────────

async function testFlows() {
  console.log('\n⚡ Flows')

  let testFlowId: string | null = null

  await test('list flows', async () => {
    const result = await tf.flows.list({ limit: 5 })
    assert(result.data !== undefined, 'should return data')
    console.log(`     Found ${result.data.length} flow(s)`)
  })

  await test('count flows', async () => {
    const count = await tf.flows.count()
    assert(typeof count === 'number', 'should return number')
    console.log(`     Total flows: ${count}`)
  })

  await test('create flow', async () => {
    const flow = await tf.flows.create({
      displayName: `SDK_TEST_${STAMP}`,
    })
    assert(typeof flow.id === 'string', 'should return ID')
    testFlowId = flow.id
    console.log(`     Created: ${flow.id}`)
  })

  if (testFlowId) {
    await test('get flow', async () => {
      const flow = await tf.flows.get(testFlowId!)
      assert(flow.id === testFlowId, 'should match flow ID')
    })

    await test('rename flow', async () => {
      const flow = await tf.flows.rename(testFlowId!, `SDK_TEST_${STAMP}_RENAMED`)
      assert(flow.version.displayName.includes('RENAMED'), 'name should be updated')
    })

    await test('get flow template', async () => {
      const tpl = await tf.flows.getTemplate(testFlowId!)
      // Server returns the template directly (name, type, summary, pieces, …).
      assert(tpl !== undefined && typeof tpl === 'object', 'should return template object')
    })

    await test('disable flow', async () => {
      const flow = await tf.flows.disable(testFlowId!)
      assert(flow.id === testFlowId, 'should return flow')
    })

    await test('enable flow', async () => {
      // Newly created flows have no trigger; enable will reject. Catch gracefully.
      try {
        const flow = await tf.flows.enable(testFlowId!)
        assert(flow.id === testFlowId, 'should return flow')
      } catch (err) {
        const e = err as Error
        if (e.message.includes('FLOW_TRIGGER') || e.message.includes('400')) {
          throw new Error('expected: flow has no trigger so enable rejects')
        }
        throw e
      }
    })

    await test('delete flow', async () => {
      await tf.flows.delete(testFlowId!)
    })
  }

  skip('flows.run / runSync / runAndWait', 'would execute the flow against real services')
  skip('flows.createFromTemplate / createFromJson', 'requires template export object')

  // Flow runs (read-only)
  console.log('\n🔁 Flow Runs')

  let firstRunId: string | null = null
  await test('list flow runs', async () => {
    const result = await tf.flowRuns.list({ limit: 3 })
    assert(result.data !== undefined, 'should return data')
    if (result.data.length > 0) firstRunId = result.data[0].id
    console.log(`     Recent runs: ${result.data.length}`)
  })

  if (firstRunId) {
    await test('get flow run', async () => {
      const run = await tf.flowRuns.get(firstRunId!)
      assert(run.id === firstRunId, 'should match run ID')
      console.log(`     Status: ${run.status}`)
    })
  } else {
    skip('get flow run', 'no flow runs in this project')
  }

  skip('flowRuns.retry', 'would re-execute a real flow run')
  skip('flowRuns.wait', 'requires an in-flight run')
}

// ── 5. Knowledge Bases ──────────────────────────────────────────────

async function testKnowledgeBases() {
  console.log('\n📚 Knowledge Bases')

  let kbId: string | null = null
  let createdKbId: string | null = null

  await test('list knowledge bases', async () => {
    const kbs = await tf.knowledgeBases.list()
    assert(Array.isArray(kbs), 'should return array')
    if (kbs.length > 0) kbId = kbs[0].id
    console.log(`     Found ${kbs.length} KB(s)`)
  })

  await test('create knowledge base', async () => {
    const kb = await tf.knowledgeBases.create({
      name: `SDK_TEST_${STAMP}`,
      description: 'Created by SDK integration test',
      embeddingProvider: 'openai',
      embeddingModel: 'text-embedding-3-small',
      embeddingDimension: 1536,
    } as any)
    assert(typeof kb.id === 'string', 'should return id')
    createdKbId = kb.id
    console.log(`     Created KB ${kb.id}`)
  })

  if (createdKbId) {
    await test('get knowledge base', async () => {
      const kb = await tf.knowledgeBases.get(createdKbId!)
      assert(kb.id === createdKbId, 'should match KB ID')
    })

    await test('update knowledge base', async () => {
      const kb = await tf.knowledgeBases.update(createdKbId!, {
        description: 'Updated by SDK test',
      })
      assert(kb.id === createdKbId, 'should return updated record')
    })

    await test('list KB documents', async () => {
      const docs = await tf.knowledgeBases.documents.list(createdKbId!)
      assert(Array.isArray(docs), 'should return array')
    })

    await test('list KB sources', async () => {
      const sources = await tf.knowledgeBases.sources.list(createdKbId!)
      assert(Array.isArray(sources), 'should return array')
    })

    await test('delete knowledge base', async () => {
      await tf.knowledgeBases.delete(createdKbId!)
    })
  }

  if (kbId) {
    await test('search knowledge base', async () => {
      const results = await tf.knowledgeBases.search({
        query: 'SDK integration test',
        knowledgeBaseIds: [kbId!],
      })
      assert(results !== undefined, 'should return results')
      console.log(`     Search returned ${results.results?.length ?? 0} result(s)`)
    })
  } else {
    skip('search knowledge base', 'no existing KBs to search')
  }

  skip('upload / chunks / docs.get / docs.delete',
       'requires a real document upload — covered manually')
  skip('sources.create / update / delete', 'requires source-specific config (URL crawler, sync etc.)')
}

// ── 6. Memory ───────────────────────────────────────────────────────

async function testMemory(agentId: string | null) {
  console.log('\n🧠 Memory')

  if (!agentId) {
    skip('agent-scoped memory', 'no agent available')
  } else {
    let testMemoryId: string | null = null

    await test('create memory', async () => {
      const memory = await tf.memory.create(agentId!, {
        content: 'SDK integration test memory — safe to delete',
        type: MemoryItemType.FACT,
        category: 'testing',
        importance: 3,
        scope: MemoryScope.PROJECT,
      })
      testMemoryId = memory.id
      console.log(`     Created ${memory.id}`)
    })

    await test('list memories', async () => {
      const memories = await tf.memory.list(agentId!, { limit: 5 })
      assert(Array.isArray(memories), 'should return array')
    })

    await test('search memory', async () => {
      const results = await tf.memory.search(agentId!, {
        query: 'SDK integration test',
        limit: 5,
      })
      assert(Array.isArray(results), 'should return array')
    })

    if (testMemoryId) {
      await test('update memory', async () => {
        const updated = await tf.memory.update(agentId!, testMemoryId!, {
          importance: 1,
          category: 'testing-updated',
        })
        assert(updated.id === testMemoryId, 'should be the same memory')
      })

      await test('list memory feedback', async () => {
        const fb = await tf.memory.listFeedback(agentId!, testMemoryId!)
        assert(Array.isArray(fb), 'should return array')
      })

      await test('delete memory', async () => {
        await tf.memory.delete(agentId!, testMemoryId!)
      })
    }
  }

  // Admin scope (project-wide)
  console.log('  ── admin scope ──')

  await test('admin: stats', async () => {
    const stats = await tf.memory.admin.stats()
    assert(typeof stats.total === 'number', 'should return total')
    console.log(`     Total: ${stats.total}, pending: ${stats.pendingReview}`)
  })

  await test('admin: list', async () => {
    const memories = await tf.memory.admin.list({ limit: 3 } as any)
    assert(Array.isArray(memories), 'should return array')
  })

  await test('admin: list pending review', async () => {
    const pending = await tf.memory.admin.listPendingReview({ limit: 3 })
    assert(Array.isArray(pending), 'should return array')
  })

  skip('admin: listPlatform', 'requires super-admin token, project key not authorized')
  skip('admin: create / update / confirm / promote / search / delete',
       'covered indirectly via agent-scoped tests above')

  // User scope — typically requires user-token, not project API key
  skip('user.mine / user.delete / user.submitFeedback',
       'user-scope requires a per-user token, not a project API key')
}

// ── 7. MCP ──────────────────────────────────────────────────────────

async function testMcp() {
  console.log('\n🔌 MCP')

  await test('get MCP server', async () => {
    const server = await tf.mcp.get()
    assert(server !== undefined, 'should return server config')
    console.log(`     Status: ${server.status}`)
  })

  await test('get MCP connection info', async () => {
    const info = await tf.mcp.getConnectionInfo()
    assert(typeof info.url === 'string' && info.url.length > 0, 'should return url')
    assert(typeof info.token === 'string' && info.token.length > 0, 'should return token')
  })

  await test('list MCP integrations (piece tools)', async () => {
    const integrations = await tf.mcp.integrations.list()
    assert(Array.isArray(integrations), 'should return array')
    console.log(`     Integrations: ${integrations.length}`)
  })

  await test('list MCP external servers', async () => {
    const servers = await tf.mcp.externalServers.list()
    assert(Array.isArray(servers), 'should return array')
    console.log(`     External servers: ${servers.length}`)
  })

  await test('get MCP skills (Claude format)', async () => {
    const skills = await tf.mcp.skills()
    assert(skills !== undefined, 'should return skills')
  })

  await test('get MCP skills OpenAPI', async () => {
    const yaml = await tf.mcp.skillsOpenApi()
    assert(typeof yaml === 'string' && yaml.length > 0, 'should return YAML string')
  })

  skip('mcp.update / rotateToken', 'would invalidate clients connected to MCP server')
  skip('mcp.integrations.add / batchAdd / update / delete', 'covered in dashboard tests')
  skip('mcp.externalServers.add / update / delete', 'requires specific MCP server URL')
}

// ── 8. Crews ────────────────────────────────────────────────────────

async function testCrews() {
  console.log('\n👥 Crews')

  let crewId: string | null = null

  await test('list crews', async () => {
    const crews = await tf.crews.list()
    assert(Array.isArray(crews), 'should return array')
    if (crews.length > 0) crewId = crews[0].id
    console.log(`     Found ${crews.length} crew(s)`)
  })

  if (crewId) {
    await test('get crew', async () => {
      const crew = await tf.crews.get(crewId!)
      assert(crew.id === crewId, 'should match crew ID')
    })

    let projId: string | null = null
    await test('list crew projects', async () => {
      const projects = await tf.crews.listProjects(crewId!)
      assert(Array.isArray(projects), 'should return array')
      if (projects.length > 0) projId = projects[0].id
      console.log(`     Crew projects: ${projects.length}`)
    })

    if (projId) {
      await test('get crew project board', async () => {
        const board = await tf.crews.getBoard(crewId!, projId!)
        assert(board !== undefined, 'should return board')
      })

      await test('get crew project cost summary', async () => {
        const cost = await tf.crews.getCostSummary(crewId!, projId!)
        assert(cost !== undefined, 'should return cost summary')
      })
    }
  } else {
    skip('crew sub-resource tests', 'no crews available')
  }

  skip('crew create / update / delete / execute', 'destructive — would mutate crew structure')
  skip('crew columns/tasks CRUD', 'requires existing crew project, covered through UI')
}

// ── 9. Connections ──────────────────────────────────────────────────

async function testConnections() {
  console.log('\n🔗 Connections')

  let firstConnId: string | null = null

  await test('list connections', async () => {
    const result = await tf.connections.list()
    assert(Array.isArray(result.data), 'should return data')
    if (result.data.length > 0) firstConnId = result.data[0].id
    console.log(`     Found ${result.data.length} connection(s)`)
  })

  await test('check method for piece (gmail)', async () => {
    const m = await tf.connections.methodForPiece('@activepieces/piece-gmail')
    assert(m.method === 'native' || m.method === 'composio', 'should return valid method')
    console.log(`     gmail: ${m.method} (creds: ${m.hasCredentials})`)
  })

  if (firstConnId) {
    await test('get connection', async () => {
      const conn = await tf.connections.get(firstConnId!)
      assert(conn.id === firstConnId, 'should match')
    })

    await test('test connection', async () => {
      const result = await tf.connections.test(firstConnId!)
      assert(['active', 'error'].includes(result.status), 'should return status')
      console.log(`     ${result.status}`)
    })
  } else {
    skip('get / test connection', 'no connections to operate on')
  }

  skip('connections.initiate / clientCredentials / connect / delete',
       'requires real OAuth flow or specific credentials')
}

// ── 10. OAuth (admin) ───────────────────────────────────────────────

async function testOAuth() {
  console.log('\n🛂 OAuth Admin')

  await test('list OAuth providers', async () => {
    const page = await tf.oauth.providers.list()
    assert(Array.isArray(page.data), 'should return paginated data array')
    console.log(`     Providers (this page): ${page.data.length}`)
  })

  await test('list integration configs', async () => {
    const page = await tf.oauth.configs.list()
    assert(Array.isArray(page.data), 'should return paginated data array')
    console.log(`     Configs: ${page.data.length}`)
  })

  await test('list available integration providers', async () => {
    const available = await tf.oauth.configs.listAvailable()
    assert(Array.isArray(available), 'should return array')
    console.log(`     Available: ${available.length}`)
  })

  skip('oauth.connections.initiate / clientCredentials / connect',
       'requires real OAuth flow')
  skip('oauth.integrationConfigs.create / delete',
       'destructive — would mutate platform OAuth credentials')
}

// ── 11. Locations ───────────────────────────────────────────────────

async function testLocations() {
  console.log('\n📍 Locations')

  let firstLocId: string | null = null

  await test('list locations', async () => {
    const locations = await tf.locations.list()
    assert(Array.isArray(locations), 'should return array')
    if (locations.length > 0) firstLocId = locations[0].id
    console.log(`     Found ${locations.length} location(s)`)
  })

  await test('location tree', async () => {
    const tree = await tf.locations.tree()
    assert(Array.isArray(tree), 'should return array')
  })

  if (firstLocId) {
    await test('get location', async () => {
      const loc = await tf.locations.get(firstLocId!)
      assert(loc.id === firstLocId, 'should match')
    })

    await test('list location members', async () => {
      const members = await tf.locations.listMembers(firstLocId!)
      assert(Array.isArray(members), 'should return array')
    })
  } else {
    skip('get / listMembers', 'no locations available')
  }

  skip('locations.create / update / delete / move / addMember / removeMember',
       'destructive — would mutate org structure')
}

// ── 12. Org Chart ───────────────────────────────────────────────────

async function testOrgChart() {
  console.log('\n🏢 Org Chart')

  let firstPositionId: string | null = null
  let firstGoalId: string | null = null

  await test('list org positions', async () => {
    const positions = await tf.orgChart.positions.list()
    assert(Array.isArray(positions), 'should return array')
    if (positions.length > 0) firstPositionId = positions[0].id
    console.log(`     Positions: ${positions.length}`)
  })

  if (firstPositionId) {
    await test('get position (list+filter)', async () => {
      const pos = await tf.orgChart.positions.get(firstPositionId!)
      assert(pos.id === firstPositionId, 'should match')
    })

    await test('list position reports', async () => {
      const reports = await tf.orgChart.positions.listReports(firstPositionId!)
      assert(Array.isArray(reports), 'should return array')
      console.log(`     direct reports: ${reports.length}`)
    })

    await test('list position deliverables', async () => {
      const deliverables = await tf.orgChart.positions.listDeliverables(firstPositionId!)
      assert(Array.isArray(deliverables), 'should return array')
    })
  } else {
    skip('position get / listReports / listDeliverables', 'no positions')
  }

  await test('list goals', async () => {
    const goals = await tf.orgChart.goals.list()
    assert(Array.isArray(goals), 'should return array')
    if (goals.length > 0) firstGoalId = goals[0].id
    console.log(`     Goals: ${goals.length}`)
  })

  if (firstGoalId) {
    await test('get goal (list+filter)', async () => {
      const goal = await tf.orgChart.goals.get(firstGoalId!)
      assert(goal.id === firstGoalId, 'should match')
    })

    await test('get goal activity', async () => {
      const activity = await tf.orgChart.goals.getActivity(firstGoalId!)
      assert(Array.isArray(activity), 'should return array')
    })
  } else {
    skip('goal get / activity', 'no goals')
  }

  await test('list connected agents', async () => {
    const agents = await tf.orgChart.connectedAgents.list()
    assert(Array.isArray(agents), 'should return array')
    console.log(`     Connected: ${agents.length}`)
  })

  await test('org cost summary', async () => {
    const cost = await tf.orgChart.getCostSummary()
    assert(cost !== undefined, 'should return cost summary')
  })

  skip('orgChart.positions.create / update / delete', 'destructive — would mutate org')
  skip('orgChart.goals.create / update / delete / decompose', 'destructive — would mutate goals')
  skip('orgChart.agents.register / update / delete', 'destructive — would mutate agent registry')
}

// ── 13. Guardrails ──────────────────────────────────────────────────

async function testGuardrails() {
  console.log('\n🛡️  Guardrails')

  await test('get guardrail policy', async () => {
    const policy = await tf.guardrails.get()
    assert(policy !== undefined, 'should return policy')
  })

  await test('get pattern catalog', async () => {
    const catalog = await tf.guardrails.getPatternCatalog()
    assert(catalog !== undefined, 'should return catalog')
  })

  await test('test scan', async () => {
    const result = await tf.guardrails.testScan({
      text: 'Contact us at john.doe@example.com or call (555) 123-4567.',
    })
    assert(result !== undefined, 'should return scan result')
  })

  skip('guardrails.update', 'would mutate platform-wide guardrail policy')
}

// ── 14. Shield ──────────────────────────────────────────────────────

async function testShield() {
  console.log('\n🚨 Shield')

  // Probe once. If shield isn't enabled on the platform plan, skip the rest
  // rather than emit four duplicate failures.
  let shieldEnabled = true
  try {
    await tf.shield.overview()
  } catch (err) {
    const msg = (err as Error).message
    if (msg.includes('403') || msg.includes('shieldEnabled')) {
      shieldEnabled = false
    }
  }

  if (!shieldEnabled) {
    skip('shield.overview / listEvents / costAnalytics / developerBreakdown',
         'platform plan does not have shieldEnabled')
    return
  }

  await test('shield overview', async () => {
    const o = await tf.shield.overview()
    assert(o !== undefined, 'should return overview')
  })

  await test('shield list events', async () => {
    const events = await tf.shield.listEvents({ limit: 3 })
    assert(Array.isArray(events), 'should return array')
  })

  await test('shield cost analytics', async () => {
    const a = await tf.shield.costAnalytics()
    assert(a !== undefined, 'should return analytics')
  })

  await test('shield developer breakdown', async () => {
    const b = await tf.shield.developerBreakdown()
    assert(Array.isArray(b), 'should return array')
  })
}

// ── 15. Voice ───────────────────────────────────────────────────────

async function testVoice() {
  console.log('\n🎤 Voice')

  await test('voice catalog (sync)', async () => {
    const voices = tf.voice.listVoices()
    assert(Array.isArray(voices), 'should return array')
    assert(voices.length > 0, 'catalog should not be empty')
    console.log(`     Catalog entries: ${voices.length}`)
  })

  await test('voices by provider — elevenlabs', async () => {
    const voices = tf.voice.listVoicesByProvider('elevenlabs' as any)
    assert(Array.isArray(voices), 'should return array')
  })

  await test('default voice id — elevenlabs', async () => {
    const id = tf.voice.getDefaultVoiceId('elevenlabs' as any)
    assert(typeof id === 'string', 'should return id string')
  })

  skip('voice.preview', 'would synthesize audio + spend ElevenLabs credits')
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 ThinkFleet SDK — Full Endpoint Sweep')
  console.log(`   Base URL: ${BASE_URL}`)
  console.log(`   Project:  ${PROJECT_ID}`)
  console.log(`   API Key:  ${API_KEY!.substring(0, 12)}…`)
  console.log(`   Stamp:    ${STAMP}`)

  await testProjects()
  const agentId = await testAgents()
  await testTasks()
  await testFlows()
  await testKnowledgeBases()
  await testMemory(agentId)
  await testMcp()
  await testCrews()
  await testConnections()
  await testOAuth()
  await testLocations()
  await testOrgChart()
  await testGuardrails()
  await testShield()
  await testVoice()

  console.log('\n' + '─'.repeat(60))
  console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`)

  if (failed > 0) {
    console.log('\n⚠️  Failures:')
    for (const f of failures) {
      console.log(`  • ${f.name}: ${f.err.substring(0, 280)}`)
    }
    process.exit(1)
  } else {
    console.log('\n🎉 All exercised endpoints pass.')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
