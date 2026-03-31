import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type { SynthesizeVoiceRequest, VoiceCatalogEntry } from '../types/voice.js'
import { ALL_VOICES, getVoicesByProvider, getDefaultVoiceId } from '../types/voice.js'
import type { VoiceProvider } from '../types/agents.js'

export class VoiceResource {
  constructor(private readonly http: HttpClient) {}

  /** List all available voices across all providers */
  listVoices(): VoiceCatalogEntry[] {
    return ALL_VOICES
  }

  /** List voices for a specific provider */
  listVoicesByProvider(provider: VoiceProvider): VoiceCatalogEntry[] {
    return getVoicesByProvider(provider)
  }

  /** Get the default voice ID for a provider */
  getDefaultVoiceId(provider: VoiceProvider): string {
    return getDefaultVoiceId(provider)
  }

  /**
   * Synthesize a voice preview (TTS).
   * Returns raw audio data (mulaw 8kHz) as an ArrayBuffer.
   */
  async preview(body: SynthesizeVoiceRequest, options?: RequestOptions): Promise<ArrayBuffer> {
    return this.http.postRaw('/phone-numbers/voice-preview', body, options)
  }
}
