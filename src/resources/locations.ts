import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  AddLocationMemberRequest,
  CreateLocationRequest,
  Location,
  LocationMember,
  LocationNode,
  MoveLocationRequest,
  UpdateLocationRequest,
} from '../types/locations.js'

/**
 * Locations — hierarchical scoping within a project.
 *
 * Use locations to model multi-store / multi-office / multi-team structures.
 * Any location-scoped resource (flows, tasks, customers, interactions, memory,
 * connections, knowledge-base, documents, voice calls, scheduled tasks...)
 * is automatically filtered by the active location when its id is passed
 * via `options.locationId` or written into the request body.
 *
 * @example
 * ```ts
 * const downtown = await tf.locations.create({
 *   name: 'Downtown Clinic',
 *   type: 'clinic',
 *   timezone: 'America/Denver',
 * })
 * const flows = await tf.flows.list(undefined, { locationId: downtown.id })
 * ```
 */
export class LocationsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List locations for the active project (flat list).
   */
  async list(options?: RequestOptions): Promise<Location[]> {
    return this.http.get<Location[]>('/locations', undefined, options)
  }

  /**
   * Fetch the full location tree for the active project. Each node includes
   * a `children` array so clients can render hierarchies directly.
   */
  async tree(options?: RequestOptions): Promise<LocationNode[]> {
    return this.http.get<LocationNode[]>('/locations/tree', undefined, options)
  }

  /**
   * Get a single location.
   */
  async get(locationId: string, options?: RequestOptions): Promise<Location> {
    return this.http.get<Location>(`/locations/${locationId}`, undefined, options)
  }

  /**
   * Create a new location. Passing `parentLocationId` nests it under that
   * parent; omit it (or pass `null`) to create a root-level location.
   *
   * @example
   * ```ts
   * const region = await tf.locations.create({ name: 'West', type: 'region' })
   * const denver = await tf.locations.create({
   *   parentLocationId: region.id,
   *   name: 'Denver Clinic',
   *   type: 'clinic',
   *   timezone: 'America/Denver',
   * })
   * ```
   */
  async create(body: CreateLocationRequest, options?: RequestOptions): Promise<Location> {
    return this.http.post<Location>('/locations', body, options)
  }

  /**
   * Update location metadata. Partial — only fields you pass are changed.
   */
  async update(locationId: string, body: UpdateLocationRequest, options?: RequestOptions): Promise<Location> {
    return this.http.patch<Location>(`/locations/${locationId}`, body, options)
  }

  /**
   * Archive (soft-delete) a location. Pass `hard: true` to delete permanently
   * (only allowed when the location has no location-scoped rows referencing
   * it).
   */
  async delete(locationId: string, options?: RequestOptions & { hard?: boolean }): Promise<void> {
    const path = options?.hard ? `/locations/${locationId}?hard=true` : `/locations/${locationId}`
    await this.http.delete<void>(path, options)
  }

  /**
   * Move a location to a different parent (or to root with `null`). Returns
   * the moved node.
   */
  async move(locationId: string, body: MoveLocationRequest, options?: RequestOptions): Promise<Location> {
    return this.http.post<Location>(`/locations/${locationId}/move`, body, options)
  }

  /**
   * List members of a location (users who can access it and their role).
   */
  async listMembers(locationId: string, options?: RequestOptions): Promise<LocationMember[]> {
    return this.http.get<LocationMember[]>(`/locations/${locationId}/members`, undefined, options)
  }

  /**
   * Add a user as a member of a location with a given role.
   */
  async addMember(locationId: string, body: AddLocationMemberRequest, options?: RequestOptions): Promise<LocationMember> {
    return this.http.post<LocationMember>(`/locations/${locationId}/members`, body, options)
  }

  /**
   * Remove a user from a location.
   */
  async removeMember(locationId: string, userId: string, options?: RequestOptions): Promise<void> {
    await this.http.delete<void>(`/locations/${locationId}/members/${userId}`, options)
  }
}
