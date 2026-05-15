/**
 * Media library — underpins RCS/MMS rich messaging and any other
 * agent-sent media attachments.
 */

export type MediaAssetType = 'image' | 'video' | 'audio' | 'document'

export interface ClawdbotMediaAsset {
  id: string
  created: string
  updated: string
  projectId: string
  type: MediaAssetType
  mimeType: string
  filename: string
  storageKey: string
  /** Cached pre-signed URL. May be null if not yet generated. */
  url: string | null
  width: number | null
  height: number | null
  durationMs: number | null
  sizeBytes: number
  altText: string | null
  tags: string[]
  uploadedByUserId: string | null
}

export interface ListMediaAssetsParams {
  type?: MediaAssetType
  limit?: number
  cursor?: string
}

export interface ListMediaAssetsResponse {
  data: ClawdbotMediaAsset[]
  next: string | null
}

export interface UpdateMediaAssetRequest {
  altText?: string
  tags?: string[]
}

export interface UploadMediaAssetRequest {
  /** File contents. Node: Buffer (Uint8Array). Browser: Blob/File. */
  file: Uint8Array | Blob
  mimeType: string
  filename: string
}
