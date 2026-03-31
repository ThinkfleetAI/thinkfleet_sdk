#!/usr/bin/env npx tsx
/**
 * ThinkFleet SDK — Agent Chat Example
 *
 * Interactive CLI that lets you chat with any ThinkFleet agent.
 *
 * Usage:
 *   export THINKFLEET_API_KEY="sk-..."
 *   export THINKFLEET_PROJECT_ID="..."
 *   npx tsx index.ts
 */

import { ThinkFleet } from '../../src/index.js'
import * as readline from 'node:readline'

// ── Config ──────────────────────────────────────────────────────────

const API_KEY = process.env.THINKFLEET_API_KEY
const PROJECT_ID = process.env.THINKFLEET_PROJECT_ID
const BASE_URL = process.env.THINKFLEET_BASE_URL ?? 'https://app.thinkfleet.ai'

if (!API_KEY || !PROJECT_ID) {
  console.error('Missing environment variables:')
  console.error('  THINKFLEET_API_KEY=sk-...')
  console.error('  THINKFLEET_PROJECT_ID=...')
  process.exit(1)
}

const tf = new ThinkFleet({
  apiKey: API_KEY,
  projectId: PROJECT_ID,
  baseUrl: BASE_URL,
  timeout: 120_000,
})

// ── Agent selector ──────────────────────────────────────────────────

async function selectAgent(): Promise<string> {
  const agents = await tf.agents.list()
  if (agents.length === 0) {
    console.error('No agents found in this project.')
    process.exit(1)
  }

  console.log('\nAvailable agents:\n')
  agents.forEach((agent, i) => {
    console.log(`  ${i + 1}. ${agent.name}`)
  })

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const answer = await new Promise<string>(resolve => {
    rl.question(`\nSelect agent (1-${agents.length}): `, resolve)
  })
  rl.close()

  const index = parseInt(answer, 10) - 1
  if (isNaN(index) || index < 0 || index >= agents.length) {
    console.error('Invalid selection.')
    process.exit(1)
  }

  return agents[index].id
}

// ── Chat loop ───────────────────────────────────────────────────────

async function main() {
  console.log('ThinkFleet Agent Chat')
  console.log('─'.repeat(40))

  const agentId = await selectAgent()
  const agent = await tf.agents.get(agentId)
  const sessionId = `cli-${Date.now()}`

  console.log(`\nChatting with: ${agent.name}`)
  console.log('Type "quit" to exit.\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const askQuestion = () => {
    rl.question('You: ', async (message) => {
      if (!message || message.toLowerCase() === 'quit') {
        console.log('\nGoodbye!')
        rl.close()
        return
      }

      try {
        const response = await tf.agents.chat(agentId, {
          message,
          sessionId,
        })

        console.log(`\n${agent.name}: ${response.content}`)

        if (response.usage) {
          console.log(
            `  [tokens: ${response.usage.totalTokens} | cost: $${response.usage.estimatedCostUsd?.toFixed(4) ?? '?'}]`,
          )
        }
        console.log()
      }
      catch (err) {
        console.error(`\nError: ${err instanceof Error ? err.message : err}\n`)
      }

      askQuestion()
    })
  }

  askQuestion()
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
