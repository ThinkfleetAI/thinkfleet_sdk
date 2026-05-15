/**
 * Event destinations — register an external webhook URL that ThinkFleet
 * POSTs to when in-platform events fire (flow run finished, flow
 * created/deleted, project member added, etc.).
 *
 * Useful for:
 *   - Getting notified when a flow run completes (success / failure /
 *     paused etc.) without polling
 *   - Building external dashboards that mirror in-platform activity
 *   - Triggering downstream workflows when a flow you orchestrated
 *     finishes
 *
 * Each destination row binds one URL to one or more event types. The
 * platform queues delivery via BullMQ; failures retry per its policy.
 *
 * Mounted at the API under `/api/v1/event-destinations`.
 */

/** All event names the platform can emit. Subscribe to a subset per destination. */
export enum ApplicationEventName {
  FLOW_CREATED = 'flow.created',
  FLOW_DELETED = 'flow.deleted',
  FLOW_UPDATED = 'flow.updated',
  FLOW_RUN_STARTED = 'flow.run.started',
  FLOW_RUN_FINISHED = 'flow.run.finished',
  FLOW_RUN_RESUMED = 'flow.run.resumed',
  CONNECTION_UPSERTED = 'connection.upserted',
  CONNECTION_DELETED = 'connection.deleted',
  FOLDER_CREATED = 'folder.created',
  FOLDER_UPDATED = 'folder.updated',
  FOLDER_DELETED = 'folder.deleted',
  USER_SIGNED_UP = 'user.signed.up',
  USER_SIGNED_IN = 'user.signed.in',
  USER_PASSWORD_RESET = 'user.password.reset',
  USER_EMAIL_VERIFIED = 'user.email.verified',
  PROJECT_RELEASE_CREATED = 'project.release.created',
  PROJECT_ROLE_CREATED = 'project.role.created',
  PROJECT_ROLE_UPDATED = 'project.role.updated',
  PROJECT_ROLE_DELETED = 'project.role.deleted',
  SIGNING_KEY_CREATED = 'signing.key.created',
}

export interface EventDestination {
  id: string
  created: string
  updated: string
  platformId: string
  url: string
  events: ApplicationEventName[]
  scope: 'platform' | 'project'
  projectId?: string | null
}

export interface CreateEventDestinationRequest {
  url: string
  events: ApplicationEventName[]
}

export interface UpdateEventDestinationRequest {
  url: string
  events: ApplicationEventName[]
}

export interface ListEventDestinationsParams {
  cursor?: string
  limit?: number
}

export interface TestEventDestinationRequest {
  url: string
}
