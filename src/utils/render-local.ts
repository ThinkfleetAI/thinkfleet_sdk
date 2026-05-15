/**
 * Client-side template renderer.
 *
 * Mirrors the resolution order of the backend renderer so consumers can
 * render templates without a round trip to /message-templates/:id/render.
 * Useful for live previews, offline editing, batch mail-merge, unit tests.
 *
 * Placeholder syntax: single-brace `{key.path[index]}`
 *
 * Resolution order for any placeholder:
 *   1. extras.<placeholder>                 — caller-supplied overrides
 *   2. profile.contact.<field>              — base contact fields
 *   3. profile.preferences.<bucket>         — first preference in bucket (or [N])
 *   4. profile.facts[N].content             — high-importance facts
 *   5. profile.patterns.<field>             — computed behavioral patterns
 *   6. profile.recentEvents[N].<field>      — last N events
 *   7. mediaUrls[N]                         — `{media.N}`
 *
 * Special aliases:
 *   {memory.topFact}        → profile.facts[0].content
 *   {memory.topPreference}  → first preference value across any bucket
 *   {pattern.topItem}       → profile.patterns.topItems[0]
 *
 * Unknown placeholders render as empty string and are returned in
 * `unresolvedPlaceholders` so the caller can flag them.
 */

import type { ContactProfile } from '../types/contacts.js'

export interface RenderLocalContext {
  profile?: ContactProfile | null
  extras?: Record<string, unknown>
  mediaUrls?: string[]
}

export interface RenderLocalInput {
  subject?: string | null
  body: string
  context?: RenderLocalContext
}

export interface RenderLocalResult {
  subject: string | null
  body: string
  unresolvedPlaceholders: string[]
}

const PLACEHOLDER_REGEX = /\{([^}]+)\}/g

/**
 * Render a subject + body against a context. Pure — no side effects.
 *
 * @example
 * ```ts
 * import { renderLocal } from '@thinkfleet/sdk'
 *
 * const out = renderLocal({
 *   subject: 'Hey {contact.name}!',
 *   body: "It's been {pattern.daysSinceLastOrder} days — use {promotion.code} for {promotion.discountValue}% off",
 *   context: {
 *     profile,                 // from client.contacts.profile(contactId)
 *     extras: { promotion: { code: 'PIZZA20', discountValue: 20 } },
 *   },
 * })
 * console.log(out.body) // "It's been 30 days — use PIZZA20 for 20% off"
 * console.log(out.unresolvedPlaceholders) // []
 * ```
 */
export function renderLocal(input: RenderLocalInput): RenderLocalResult {
  const context = input.context ?? {}
  const unresolved = new Set<string>()

  const resolve = (text: string): string =>
    text.replace(PLACEHOLDER_REGEX, (_match, key: string) => {
      const trimmed = key.trim()
      const value = resolvePlaceholder(trimmed, context)
      if (value === null || value === undefined) {
        unresolved.add(trimmed)
        return ''
      }
      return String(value)
    })

  return {
    subject: input.subject != null ? resolve(input.subject) : null,
    body: resolve(input.body),
    unresolvedPlaceholders: Array.from(unresolved),
  }
}

function resolvePlaceholder(key: string, ctx: RenderLocalContext): unknown {
  // 1. Special aliases
  if (key === 'memory.topFact') {
    return ctx.profile?.facts?.[0]?.content ?? null
  }
  if (key === 'memory.topPreference') {
    const buckets = ctx.profile?.preferences ?? {}
    for (const bucket of Object.values(buckets)) {
      if (Array.isArray(bucket) && bucket.length > 0) {
        return bucket[0]?.value ?? null
      }
    }
    return null
  }
  if (key === 'pattern.topItem') {
    return ctx.profile?.patterns?.topItems?.[0] ?? null
  }

  // 2. Media placeholders: {media.0}, {media.1}
  if (key.startsWith('media.')) {
    const rest = key.slice('media.'.length)
    const idx = Number.parseInt(rest, 10)
    if (Number.isFinite(idx) && ctx.mediaUrls) {
      return ctx.mediaUrls[idx] ?? null
    }
  }

  // 3. extras override (flat OR dotted path)
  const fromExtras = lookupPath(ctx.extras, key)
  if (fromExtras !== undefined) return fromExtras

  // 4. Profile-based resolution
  const profile = ctx.profile
  if (!profile) return null

  // 4a. contact.<field>
  if (key.startsWith('contact.')) {
    return lookupPath(profile.contact as unknown as Record<string, unknown>, key.slice('contact.'.length)) ?? null
  }

  // 4b. preferences.<bucket>[.index]
  if (key.startsWith('preferences.') || key.startsWith('preference.')) {
    const rest = key.split('.').slice(1).join('.')
    return resolvePreference(profile.preferences, rest)
  }
  if (key.startsWith('memory.preference.')) {
    const rest = key.slice('memory.preference.'.length)
    return resolvePreference(profile.preferences, rest)
  }

  // 4c. facts[N].content or memory.fact.N
  if (key.startsWith('facts[') || key.startsWith('memory.fact.')) {
    const idxStr = key.startsWith('facts[')
      ? key.slice('facts['.length, -1)
      : key.slice('memory.fact.'.length)
    const idx = Number.parseInt(idxStr, 10)
    return profile.facts?.[idx]?.content ?? null
  }

  // 4d. patterns.<field>
  if (key.startsWith('pattern.') || key.startsWith('patterns.')) {
    const rest = key.startsWith('patterns.')
      ? key.slice('patterns.'.length)
      : key.slice('pattern.'.length)
    const value = lookupPath(profile.patterns as unknown as Record<string, unknown>, rest)
    if (Array.isArray(value)) return value.join(', ')
    return value ?? null
  }

  // 4e. recentEvents[N].<field>
  const eventMatch = /^recentEvents?\[(\d+)\](?:\.(.+))?$/.exec(key)
  if (eventMatch) {
    const idx = Number.parseInt(eventMatch[1]!, 10)
    const field = eventMatch[2]
    const event = profile.recentEvents?.[idx]
    if (!event) return null
    return field
      ? lookupPath(event as unknown as Record<string, unknown>, field) ?? null
      : event.title ?? null
  }

  return null
}

function resolvePreference(
  preferences: ContactProfile['preferences'],
  key: string,
): unknown {
  // Accept "food", "food[0]", "food.value"
  const bracketMatch = /^(.+?)\[(\d+)\]$/.exec(key)
  if (bracketMatch) {
    const bucket = preferences[bracketMatch[1]!]
    const idx = Number.parseInt(bracketMatch[2]!, 10)
    return bucket?.[idx]?.value ?? null
  }
  const bucket = preferences[key]
  if (Array.isArray(bucket)) {
    return bucket[0]?.value ?? null
  }
  return null
}

function lookupPath(
  source: Record<string, unknown> | null | undefined,
  path: string,
): unknown {
  if (!source) return undefined
  const parts = path.split('.')
  let cursor: unknown = source
  for (const part of parts) {
    if (cursor === null || cursor === undefined) return undefined
    if (typeof cursor !== 'object') return undefined
    cursor = (cursor as Record<string, unknown>)[part]
  }
  return cursor
}
