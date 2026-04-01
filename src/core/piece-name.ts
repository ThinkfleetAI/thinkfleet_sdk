const PIECE_PREFIX = '@activepieces/piece-'

/**
 * Normalize a piece name to the internal format.
 * Accepts short names ("gmail"), prefixed names ("piece-gmail"),
 * or full names ("@activepieces/piece-gmail") and always returns
 * the full internal format.
 *
 * SDK users should only need to pass the short name (e.g. "gmail").
 */
export function normalizePieceName(name: string): string {
  if (name.startsWith(PIECE_PREFIX)) {
    return name
  }
  if (name.startsWith('piece-')) {
    return `@activepieces/${name}`
  }
  return `${PIECE_PREFIX}${name}`
}
