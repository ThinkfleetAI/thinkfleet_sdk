import type { BaseModel } from './common.js'

export interface Project extends BaseModel {
  displayName: string
  platformId: string
  externalId?: string
  notifyStatus?: string
  releasesEnabled?: boolean
  plan?: ProjectPlan | null
}

export interface ProjectPlan {
  tasks?: number
  minimumPollingInterval?: number
  connections?: number
  teamMembers?: number
}

export interface UpdateProjectRequest {
  displayName?: string
  externalId?: string
  notifyStatus?: string
  releasesEnabled?: boolean
  plan?: Partial<ProjectPlan>
}

export interface CreateProjectRequest {
  displayName: string
  externalId?: string
}
