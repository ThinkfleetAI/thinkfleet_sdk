import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  ClawdbotMediaAsset,
  ListMediaAssetsParams,
  ListMediaAssetsResponse,
  UpdateMediaAssetRequest,
  UploadMediaAssetRequest,
} from '../types/media.js'

/**
 * Media library — upload and manage images, video, audio, and documents
 * for use in RCS/MMS messaging and other rich-content agent replies.
 *
 * @example
 * ```ts
 * const asset = await tf.media.upload({
 *   file: fs.readFileSync('banner.png'),
 *   mimeType: 'image/png',
 *   filename: 'banner.png',
 * })
 * console.log(asset.url)
 * ```
 */
export class MediaResource {
  constructor(private readonly http: HttpClient) {}

  async upload(
    body: UploadMediaAssetRequest,
    options?: RequestOptions,
  ): Promise<ClawdbotMediaAsset> {
    const form = new FormData()
    // Node's Buffer isn't directly assignable to FormData's Blob typing;
    // wrap in Blob so both Node 18+ (undici) and browsers handle it.
    const blob: Blob = body.file instanceof Blob
      ? body.file
      : new Blob([body.file as BlobPart], { type: body.mimeType })
    form.append('file', blob, body.filename)
    return this.http.postFormData<ClawdbotMediaAsset>(`/media`, form, options)
  }

  async list(
    params?: ListMediaAssetsParams,
    options?: RequestOptions,
  ): Promise<ListMediaAssetsResponse> {
    return this.http.get<ListMediaAssetsResponse>(
      `/media`,
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  async get(assetId: string, options?: RequestOptions): Promise<ClawdbotMediaAsset> {
    return this.http.get<ClawdbotMediaAsset>(`/media/${assetId}`, undefined, options)
  }

  async update(
    assetId: string,
    body: UpdateMediaAssetRequest,
    options?: RequestOptions,
  ): Promise<ClawdbotMediaAsset> {
    return this.http.patch<ClawdbotMediaAsset>(`/media/${assetId}`, body, options)
  }

  async delete(assetId: string, options?: RequestOptions): Promise<void> {
    await this.http.delete<void>(`/media/${assetId}`, options)
  }
}
