const PIECE_PREFIX = '@thinkfleet/piece-'
const LEGACY_PIECE_PREFIX = '@activepieces/piece-'

/**
 * Normalize a piece name to the canonical SDK wire format.
 *
 * Accepts any of:
 *   - short name:           `"gmail"`
 *   - bare prefixed:        `"piece-gmail"`
 *   - canonical:            `"@thinkfleet/piece-gmail"`
 *   - legacy (pre-0.7.0):   `"@activepieces/piece-gmail"`
 *
 * Always returns the canonical form `"@thinkfleet/piece-gmail"`. The
 * platform translates this to its internal form server-side, so callers
 * should always pass short names — the long forms exist only to keep
 * older user code working without a forced rewrite.
 */
export function normalizePieceName(name: string): string {
  if (name.startsWith(PIECE_PREFIX)) {
    return name
  }
  if (name.startsWith(LEGACY_PIECE_PREFIX)) {
    return `${PIECE_PREFIX}${name.slice(LEGACY_PIECE_PREFIX.length)}`
  }
  if (name.startsWith('piece-')) {
    return `@thinkfleet/${name}`
  }
  return `${PIECE_PREFIX}${name}`
}

/**
 * Rewrite legacy `@activepieces/piece-*` strings (still emitted by the
 * platform in some response payloads) to the canonical `@thinkfleet/piece-*`
 * form. Used by the HTTP client's built-in response walker so SDK consumers
 * never see the legacy prefix in returned data.
 */
export function denormalizeLegacyPiecePrefix(value: string): string {
  if (!value.includes(LEGACY_PIECE_PREFIX)) return value
  return value.split(LEGACY_PIECE_PREFIX).join(PIECE_PREFIX)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * Walk a JSON-shaped value and rewrite every legacy `@activepieces/piece-*`
 * string to the canonical `@thinkfleet/piece-*` form. Leaves non-plain
 * structures (Buffer, Date, etc.) untouched. Returns a new value when a
 * rewrite was needed, otherwise the same reference.
 */
export function rewriteLegacyPiecePrefixDeep(value: unknown): unknown {
  if (typeof value === 'string') return denormalizeLegacyPiecePrefix(value)
  if (Array.isArray(value)) {
    let changed = false
    const out = value.map(v => {
      const next = rewriteLegacyPiecePrefixDeep(v)
      if (next !== v) changed = true
      return next
    })
    return changed ? out : value
  }
  if (isPlainObject(value)) {
    let changed = false
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      const next = rewriteLegacyPiecePrefixDeep(v)
      if (next !== v) changed = true
      out[k] = next
    }
    return changed ? out : value
  }
  return value
}
