# Changelog

## 0.7.0 — 2026-05-18

### Changed

- **Canonical piece-name prefix is now `@thinkfleet/piece-*`.** The SDK no
  longer surfaces the upstream `@activepieces/...` brand anywhere on its
  public API — request bodies, response bodies, types, JSDoc, and README
  examples all use the ThinkFleet form. Short names like `'gmail'` continue
  to work and are still the recommended way to refer to a piece.
  - `normalizePieceName('gmail')` now returns `'@thinkfleet/piece-gmail'`
    (was `'@activepieces/piece-gmail'`).
  - The HTTP client auto-rewrites any `@activepieces/piece-*` strings still
    emitted by the platform in response payloads to `@thinkfleet/piece-*`
    before handing the data to your code. Existing callers reading
    `connection.pieceName` will see `'@thinkfleet/piece-gmail'` going forward.
  - Legacy callers passing `'@activepieces/piece-X'` continue to work — the
    SDK upgrades it to the canonical form before sending.
- **Wire format change.** Request bodies now carry `pieceName: '@thinkfleet/piece-X'`.
  Requires the platform to run the matching translation shim (shipped in
  the platform release dated 2026-05-18). Older platform builds will
  reject the new prefix.

### Added

- `denormalizeLegacyPiecePrefix(value)` — single-string rewriter.
- `rewriteLegacyPiecePrefixDeep(value)` — recursive walker used by the
  HTTP client; exposed for callers who fetch responses outside the SDK
  but want the same normalization.

## 0.6.0 — 2026-05-18

### Added

- **`tf.connections.global` — platform-scoped (global) connections.** Create
  a single credential and share it across one or many projects without
  re-issuing it per project.
  - `tf.connections.global.upsert({ ..., allProjects: true, projectIds: [] })`
    — set-and-forget: connection automatically applies to every project on
    the platform, including projects created *after* the call. This is the
    answer to the recurring "do I have to add my new project to every global
    connection?" question.
  - `tf.connections.global.upsert({ ..., projectIds: ['proj_a', 'proj_b'] })`
    — selective allowlist when you don't want everything.
  - `tf.connections.global.addProjects(id, { projectIds })` /
    `removeProjects(id, { projectIds })` — idempotent project allowlist
    edits without rewriting the full array. Useful from a project-creation
    hook.
  - `tf.connections.global.list({ ... })`, `update(id, body)`, `delete(id)`.
  - All routes require platform-admin credentials.

## 0.5.0 — 2026-05-14

### Added

- **`tf.lattice` — Lattice behavioral pattern intelligence.** Mines
  contact event history for recurring patterns (weekly purchase, daily
  login, Friday-evening orders, entity preferences, bundles) and emits
  `pattern_break` contact events when an expected pattern fails to
  fire. Server-side is a Rust gRPC engine; the SDK speaks REST to the
  ThinkFleet API which translates to gRPC.
  - `lattice.extractPatterns({ contactId?, windowDays?, force? })` —
    force re-extraction (single contact or bulk across the project,
    capped at 5000 contacts per call server-side).
  - `lattice.runMonitorTick()` — manually run the monitor (cron
    handles this every 15 min in normal operation).
  - `lattice.listContacts({ limit?, offset?, activeOnly? })` — list
    contacts with at least one behavior pattern.
  - `lattice.listPatterns(contactId, { limit?, offset?, includeInactive? })`
    — list a contact's patterns.
  - `lattice.getContext(contactId, { eventLimit?, memoryLimit? })` —
    full retrieval bundle (profile + active patterns + recent events +
    recent memories) for AI message rendering.
  - `lattice.search({ q, types?, limit? })` — cross-entity free-text
    search across contacts, contact events, and behavior patterns.
  - `lattice.runDemoSeed({ contactsPerTemplate?, historyDays? })` —
    dev/QA only; gated server-side by `AP_ALLOW_DEMO_SEED=true`.
  - Full type surface: `BehaviorPatternKind`, `BehaviorPatternMetadata`,
    `Cadence`, `LatticeContactSummary`, `PatternSummary`,
    `ContactContextResponse`, `LatticeSearchResponse`, etc.

## 0.4.0 — 2026-04-29

### Fixed

- **`flows.enable()` / `flows.disable()` returned the synchronous
  pre-flip flow instead of waiting for the status change to finalize.**
  Server processes status changes in two phases: (1) sync — queue a
  background job, set `operationStatus: ENABLING`, return the flow
  with `status: DISABLED`; (2) async — register trigger sources, then
  flip `status` to the target and reset `operationStatus`. The SDK
  was returning the phase-1 response, so callers saw
  `status: DISABLED` immediately after calling `enable()`. The SDK
  now polls `GET /flows/:id` until both `status` matches the target
  and `operationStatus` is `NONE`. Default poll: 1s interval, 30s
  timeout. Pass `{ wait: false }` for the legacy fire-and-forget
  behavior. **Behavior change**: `enable()` / `disable()` now block
  for ~1–10s until the flow settles.

### Added

- **`flows.waitForStatus(flowId, target, options)`** — exposed
  helper for callers who change status via `update()` directly and
  need to wait on the final state.
- **`Flow.operationStatus`** — typed `'NONE' | 'ENABLING' | 'DISABLING' | 'DELETING' | null`.
  Surfaces the in-flight status flip the server already returns.

## 0.3.0 — 2026-04-25

### Fixed

- **Default `baseUrl` was wrong.** Pointed at `https://api.thinkfleet.ai`,
  which doesn't resolve. Changed to `https://app.thinkfleet.ai` —
  same ALB serves the React UI and the API at `/api/v1/...`. Existing
  callers that pass `baseUrl` explicitly are unaffected.
- **`flows.getTemplate`** — server returns the template object directly,
  not wrapped under `{ template: … }`. Return type corrected to
  `FlowTemplateExport`. **Breaking** for anyone destructuring `.template`.
- **`mcp.skillsOpenApi`** — server returns YAML; SDK was JSON-parsing it
  and throwing. Now returns the raw YAML string via a new `getText`
  helper on the HTTP client.
- **`oauth.providers.list`** — server returns a `SeekPage`, not an array.
  Return type corrected to `SeekPage<OAuthProvider>`. **Breaking**.
- **`oauth.configs.list`** — same fix; now returns `SeekPage<IntegrationConfig>`.
  **Breaking**.
- **`oauth.configs.listAvailable`** — server wraps in `{ data }`. SDK now
  unwraps so callers get a flat array as documented.
- **`connections.get(id)`** — the platform has no
  `GET /app-connections/{id}`. Method now fetches the project list and
  filters client-side. Throws `NotFoundError` if the ID isn't in scope.
- **`orgChart.positions.get(id)` / `orgChart.goals.get(id)`** — same
  fix; both backed by list+filter (server has no singular GET).
- Removed dead methods: `orgChart.positions.getStatus`,
  `orgChart.goals.getProgress` — backing endpoints don't exist.
  **Breaking** if anyone was calling them (they would have been
  throwing `Route not found` anyway).

### Added

- **`orgChart.positions.listReports(id)`**, **`getAgent(id)`**,
  **`listDeliverables(id)`** — wraps the corresponding server routes that
  do exist.
- **`orgChart.goals.getActivity(id)`** — goal activity log.
- **`orgChart.goals.replan(id)`** — re-run AI planning.
- **`http.getText`** on the HTTP client — for endpoints that emit YAML
  or plain text.

### Tests

- Integration test app rebuilt to exercise every public method on every
  resource against a live platform. Final result against prod:
  73 passed, 0 failed, 33 intentionally skipped (destructive admin
  ops or ones that need extra setup like ElevenLabs credits).

### Docs

- README rewritten — accurate `baseUrl`, full resource matrix, idiomatic
  patterns for every resource (Agents, Tasks, Flows, KBs, Memory,
  Connections, OAuth admin, MCP, Crews, Org Chart, Locations, Voice,
  Guardrails, Shield).

## 0.2.0 — 2026-04-21

### Added

- **`client.locations`** — hierarchical project scoping. List, tree, get,
  create, update, move, delete (soft/hard), and member management
  against `/v1/projects/:projectId/locations`. Supports the new
  location-scoped architecture rolled out across the platform.
- **`client.flowRuns`** — historical flow run inspection + polling.
  `list`, `get`, `retry`, and `wait(runId, { timeoutMs, pollIntervalMs,
  onProgress })` for async lifecycle tracking.
- **`client.flows.runAndWait`** — kick off a flow via webhook and poll
  until a terminal status. Convenience wrapper around `flows.run` +
  `flowRuns.wait`. Complements `runSync` for longer-running flows.
- **`client.flows.getTemplate`** — export a flow as portable template
  JSON.
- **`client.flows.createFromTemplate(templateId, params)`** — seed a
  new flow from a stored template (marketplace or private).
- **`client.flows.createFromJson(template, params)`** — import a
  previously exported flow template (two-step: create + `IMPORT_FLOW`).
- **`CreateFlowRequest`** now accepts `templateId`, `locationId`, and
  `externalId` so new flows land in the right scope from the first
  call.
- **`TERMINAL_FLOW_RUN_STATUSES`** and **`TerminalFlowRunStatus`** —
  exported so consumers can branch on terminal vs transient states.

### Docs

- README updated with examples for locations, flow templates, and
  flow-run polling.

### Compatibility

No breaking changes. Existing `flows.run` / `flows.runSync` continue to
work unchanged.
