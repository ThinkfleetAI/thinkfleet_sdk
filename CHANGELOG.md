# Changelog

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
