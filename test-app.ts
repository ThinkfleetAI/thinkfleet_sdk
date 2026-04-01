#!/usr/bin/env npx tsx
/**
 * ThinkFleet SDK Integration Test App
 *
 * Validates all SDK resources against a live ThinkFleet instance.
 *
 * Usage:
 *   export THINKFLEET_API_KEY="sk-..."
 *   export THINKFLEET_PROJECT_ID="..."
 *   export THINKFLEET_BASE_URL="https://app.thinkfleet.ai"  # optional
 *   npx tsx test-app.ts
 */

import { ThinkFleet, FlowStatus, MemoryItemType, MemoryScope } from './src/index.js'

// ── Config ──────────────────────────────────────────────────────────

const API_KEY = process.env.THINKFLEET_API_KEY
const PROJECT_ID = process.env.THINKFLEET_PROJECT_ID
const BASE_URL = process.env.THINKFLEET_BASE_URL ?? 'https://app.thinkfleet.ai'

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

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    passed++
    console.log(`  ✅ ${name}`)
  }
  catch (err) {
    failed++
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`  ❌ ${name} — ${msg}`)
  }
}

function skip(name: string, reason: string) {
  skipped++
  console.log(`  ⏭️  ${name} — ${reason}`)
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`)
}

// ── Tests ───────────────────────────────────────────────────────────

async function testProjects() {
  console.log('\n📁 Projects')

  await test('list projects', async () => {
    const result = await tf.projects.list()
    assert(Array.isArray(result.data), 'should return data array')
    assert(result.data.length > 0, 'should have at least one project')
    console.log(`     Found ${result.data.length} project(s)`)
  })

  await test('get project', async () => {
    const project = await tf.projects.get(PROJECT_ID)
    assert(project.id === PROJECT_ID, 'should match project ID')
    console.log(`     Project: ${project.displayName}`)
  })
}

async function testAgents() {
  console.log('\n🤖 Agents')

  let agentId: string | null = null

  await test('list agents', async () => {
    const agents = await tf.agents.list()
    assert(Array.isArray(agents), 'should return array')
    console.log(`     Found ${agents.length} agent(s)`)
    if (agents.length > 0) {
      agentId = agents[0].id
    }
  })

  if (!agentId) {
    skip('get agent', 'no agents found')
    skip('chat with agent', 'no agents found')
    return agentId
  }

  await test('get agent', async () => {
    const agent = await tf.agents.get(agentId!)
    assert(agent.id === agentId, 'should match agent ID')
    console.log(`     Agent: ${agent.name}`)
  })

  await test('chat with agent', async () => {
    const response = await tf.agents.chat(agentId!, {
      message: 'Hello! Just a quick test. Reply with "SDK test passed" and nothing else.',
      sessionId: `sdk-test-${Date.now()}`,
    })
    assert(typeof response.content === 'string', 'should return content')
    assert(response.content.length > 0, 'content should not be empty')
    console.log(`     Response: ${response.content.substring(0, 80)}...`)
  })

  return agentId
}

async function testFlows() {
  console.log('\n⚡ Flows')

  let testFlowId: string | null = null

  await test('list flows', async () => {
    const result = await tf.flows.list({ limit: 5 })
    assert(result.data !== undefined, 'should return data')
    console.log(`     Found ${result.data.length} flow(s)`)
  })

  await test('create flow', async () => {
    const flow = await tf.flows.create({
      displayName: `SDK Test Flow ${Date.now()}`,
    })
    assert(flow.id !== undefined, 'should return ID')
    assert(flow.version !== undefined, 'should have version')
    testFlowId = flow.id
    console.log(`     Created: ${flow.version.displayName} (${flow.id})`)
  })

  if (testFlowId) {
    await test('get flow', async () => {
      const flow = await tf.flows.get(testFlowId!)
      assert(flow.id === testFlowId, 'should match flow ID')
    })

    await test('rename flow', async () => {
      const flow = await tf.flows.rename(testFlowId!, 'SDK Test Flow Renamed')
      assert(flow.version.displayName === 'SDK Test Flow Renamed', 'name should be updated')
    })

    await test('count flows', async () => {
      const count = await tf.flows.count()
      assert(typeof count === 'number', 'should return number')
      assert(count > 0, 'should have at least 1 flow')
      console.log(`     Total flows: ${count}`)
    })

    await test('delete flow', async () => {
      await tf.flows.delete(testFlowId!)
      console.log(`     Deleted: ${testFlowId}`)
    })
  }
}

async function testKnowledgeBases() {
  console.log('\n📚 Knowledge Bases')

  await test('list knowledge bases', async () => {
    const kbs = await tf.knowledgeBases.list()
    assert(Array.isArray(kbs), 'should return array')
    console.log(`     Found ${kbs.length} KB(s)`)

    if (kbs.length > 0) {
      const kb = kbs[0]
      console.log(`     First KB: ${kb.displayName} (${kb.id})`)
    }
  })

  await test('search knowledge base', async () => {
    // Get KBs first to get IDs for search
    const kbs = await tf.knowledgeBases.list()
    if (kbs.length === 0) {
      console.log(`     Skipped: no knowledge bases to search`)
      return
    }
    const results = await tf.knowledgeBases.search({
      query: 'test query',
      knowledgeBaseIds: [kbs[0].id],
    })
    assert(results !== undefined, 'should return results')
    console.log(`     Search returned ${results.results?.length ?? 0} result(s)`)
  })
}

async function testMemory(agentId: string | null) {
  console.log('\n🧠 Memory')

  if (!agentId) {
    skip('memory operations', 'no agents found')
    return
  }

  let testMemoryId: string | null = null

  await test('create memory', async () => {
    const memory = await tf.memory.create(agentId!, {
      content: 'SDK integration test memory — safe to delete',
      type: MemoryItemType.FACT,
      category: 'testing',
      importance: 3,
      scope: MemoryScope.PROJECT,
    })
    assert(memory.id !== undefined, 'should return ID')
    testMemoryId = memory.id
    console.log(`     Created memory: ${memory.id}`)
  })

  await test('create visual memory', async () => {
    const memory = await tf.memory.create(agentId!, {
      content: 'SDK test — visual memory item',
      type: MemoryItemType.FACT,
      category: 'visual',
      visualDescription: 'A red test icon with the letters SDK in white',
    })
    assert(memory.id !== undefined, 'should return ID')
    assert(memory.content.includes('Visual:'), 'should include visual description in content')
    console.log(`     Created visual memory: ${memory.id}`)
    // Clean up
    await tf.memory.delete(agentId!, memory.id)
  })

  await test('list memories', async () => {
    const memories = await tf.memory.list(agentId!, { limit: 5 })
    assert(Array.isArray(memories), 'should return array')
    console.log(`     Found ${memories.length} memor${memories.length === 1 ? 'y' : 'ies'}`)
  })

  await test('search memory', async () => {
    const results = await tf.memory.search(agentId!, {
      query: 'SDK integration test',
      limit: 5,
    })
    assert(Array.isArray(results), 'should return array')
    console.log(`     Search returned ${results.length} result(s)`)
  })

  if (testMemoryId) {
    await test('update memory', async () => {
      const updated = await tf.memory.update(agentId!, testMemoryId!, {
        importance: 1,
        category: 'testing-updated',
      })
      assert(updated.importance === 1 || updated.category === 'testing-updated', 'should be updated')
    })

    await test('delete memory', async () => {
      await tf.memory.delete(agentId!, testMemoryId!)
      console.log(`     Deleted: ${testMemoryId}`)
    })
  }

  // Admin memory
  await test('admin: get memory stats', async () => {
    const stats = await tf.memory.admin.stats()
    assert(typeof stats.totalCount === 'number', 'should return totalCount')
    console.log(`     Total memories: ${stats.totalCount}, pending: ${stats.pendingCount}`)
  })

  await test('admin: list pending review', async () => {
    const pending = await tf.memory.admin.listPendingReview({ limit: 3 })
    assert(Array.isArray(pending), 'should return array')
    console.log(`     Pending review: ${pending.length}`)
  })
}

async function testMcp() {
  console.log('\n🔌 MCP')

  await test('get MCP server', async () => {
    const server = await tf.mcp.get()
    assert(server !== undefined, 'should return server config')
    console.log(`     Status: ${server.status}`)
  })

  await test('list MCP integrations', async () => {
    const integrations = await tf.mcp.integrations.list()
    assert(Array.isArray(integrations), 'should return array')
    console.log(`     Found ${integrations.length} integration(s)`)
  })

  await test('list MCP external servers', async () => {
    const servers = await tf.mcp.externalServers.list()
    assert(Array.isArray(servers), 'should return array')
    console.log(`     Found ${servers.length} external server(s)`)
  })
}

async function testCrews() {
  console.log('\n👥 Crews')

  await test('list crews', async () => {
    const crews = await tf.crews.list()
    assert(Array.isArray(crews), 'should return array')
    console.log(`     Found ${crews.length} crew(s)`)
  })
}

async function testConnections() {
  console.log('\n🔗 Connections')

  await test('check Composio configured', async () => {
    const result = await tf.connections.isConfigured()
    assert(typeof result === 'boolean', 'should return boolean')
    console.log(`     Composio configured: ${result}`)
  })
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 ThinkFleet SDK Integration Tests')
  console.log(`   Base URL: ${BASE_URL}`)
  console.log(`   Project: ${PROJECT_ID}`)
  console.log(`   API Key: ${API_KEY.substring(0, 12)}...`)

  await testProjects()
  const agentId = await testAgents()
  await testFlows()
  await testKnowledgeBases()
  await testMemory(agentId ?? null)
  await testMcp()
  await testCrews()
  await testConnections()

  console.log('\n' + '─'.repeat(50))
  console.log(`Results: ${passed} passed, ${failed} failed, ${skipped} skipped`)

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
    process.exit(1)
  }
  else {
    console.log('\n🎉 All tests passed!')
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
