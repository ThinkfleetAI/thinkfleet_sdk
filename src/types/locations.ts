/**
 * Locations — hierarchical organization units within a project.
 *
 * A project can have many locations, arranged in a tree (parent/child).
 * Common usage: multi-tenant SMBs model each store/clinic/office as a
 * location; enterprise rollouts use locations for business units, regions,
 * or teams. Resources that are "location-scoped" (flows, tasks,
 * connections, memory, customers, interactions, etc.) carry a `locationId`
 * and are filtered by the active location.
 */

export type LocationStatus = 'active' | 'inactive' | 'archived'

export type LocationRole = 'admin' | 'manager' | 'member' | 'viewer'

export interface LocationAddress {
  street1?: string
  street2?: string
  city?: string
  region?: string
  postalCode?: string
  country?: string
}

export interface Location {
  id: string
  created: string
  updated: string
  projectId: string
  parentLocationId: string | null
  name: string
  type: string
  externalId: string | null
  metadata: Record<string, unknown> | null
  timezone: string | null
  address: LocationAddress | null
  status: LocationStatus
}

export interface LocationNode extends Location {
  children: LocationNode[]
}

export interface LocationMember {
  id: string
  created: string
  updated: string
  locationId: string
  userId: string
  role: LocationRole
}

export interface CreateLocationRequest {
  /** If omitted, the location becomes a root node under the project. */
  parentLocationId?: string | null
  name: string
  /** Freeform type string (e.g. "store", "clinic", "region", "business-unit"). */
  type: string
  externalId?: string | null
  metadata?: Record<string, unknown>
  timezone?: string | null
  address?: LocationAddress | null
}

export interface UpdateLocationRequest {
  parentLocationId?: string | null
  name?: string
  type?: string
  externalId?: string | null
  metadata?: Record<string, unknown>
  timezone?: string | null
  address?: LocationAddress | null
  status?: LocationStatus
}

export interface MoveLocationRequest {
  newParentLocationId: string | null
}

export interface AddLocationMemberRequest {
  userId: string
  role: LocationRole
}
