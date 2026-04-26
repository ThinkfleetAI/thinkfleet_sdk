# Changelog

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
