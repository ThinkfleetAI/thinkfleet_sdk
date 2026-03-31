#!/usr/bin/env npx tsx
/**
 * ThinkFleet SDK — Knowledge Base Search Example
 *
 * Searches across your knowledge bases and displays ranked results.
 *
 * Usage:
 *   export THINKFLEET_API_KEY="sk-..."
 *   export THINKFLEET_PROJECT_ID="..."
 *   npx tsx index.ts "your search query"
 */

import { ThinkFleet } from '../../src/index.js'

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

const query = process.argv[2]
if (!query) {
  console.error('Usage: npx tsx index.ts "your search query"')
  process.exit(1)
}

const tf = new ThinkFleet({
  apiKey: API_KEY,
  projectId: PROJECT_ID,
  baseUrl: BASE_URL,
})

// ── Search ──────────────────────────────────────────────────────────

async function main() {
  console.log('ThinkFleet Knowledge Base Search')
  console.log('─'.repeat(40))

  // List all knowledge bases
  const kbs = await tf.knowledgeBases.list()
  if (kbs.length === 0) {
    console.error('No knowledge bases found in this project.')
    process.exit(1)
  }

  console.log(`\nSearching ${kbs.length} knowledge base(s) for: "${query}"\n`)

  // Search across all KBs
  const results = await tf.knowledgeBases.search({
    query,
    knowledgeBaseIds: kbs.map(kb => kb.id),
    topK: 5,
  })

  if (!results.results || results.results.length === 0) {
    console.log('No results found.')
    return
  }

  console.log(`Found ${results.results.length} result(s):\n`)

  results.results.forEach((result, i) => {
    const score = (result.score * 100).toFixed(1)
    const preview = result.content.substring(0, 200).replace(/\n/g, ' ')
    console.log(`  ${i + 1}. [${score}%] ${preview}...`)
    if (result.metadata?.source) {
      console.log(`     Source: ${result.metadata.source}`)
    }
    console.log()
  })
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
