#!/usr/bin/env npx tsx
/**
 * ThinkFleet SDK — Flow Management Example
 *
 * Demonstrates creating, listing, renaming, and deleting flows.
 *
 * Usage:
 *   export THINKFLEET_API_KEY="sk-..."
 *   export THINKFLEET_PROJECT_ID="..."
 *   npx tsx index.ts
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

const tf = new ThinkFleet({
  apiKey: API_KEY,
  projectId: PROJECT_ID,
  baseUrl: BASE_URL,
})

// ── Flow lifecycle ──────────────────────────────────────────────────

async function main() {
  console.log('ThinkFleet Flow Management')
  console.log('─'.repeat(40))

  // Count existing flows
  const count = await tf.flows.count()
  console.log(`\nExisting flows: ${count}`)

  // List first 5
  const existing = await tf.flows.list({ limit: 5 })
  existing.data.forEach(flow => {
    console.log(`  - ${flow.version.displayName} (${flow.status})`)
  })

  // Create a new flow
  console.log('\nCreating a test flow...')
  const flow = await tf.flows.create({
    displayName: `SDK Example Flow ${new Date().toISOString().slice(0, 16)}`,
  })
  console.log(`  Created: ${flow.version.displayName} (${flow.id})`)

  // Rename it
  console.log('\nRenaming...')
  const renamed = await tf.flows.rename(flow.id, 'SDK Example — Renamed')
  console.log(`  New name: ${renamed.version.displayName}`)

  // Get it by ID
  const fetched = await tf.flows.get(flow.id)
  console.log(`  Verified: ${fetched.version.displayName}`)

  // Clean up
  console.log('\nDeleting test flow...')
  await tf.flows.delete(flow.id)
  console.log('  Deleted.')

  console.log('\nDone!')
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
