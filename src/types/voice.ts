import type { VoiceProvider } from './agents.js'

export interface VoiceCatalogEntry {
  id: string
  name: string
  gender: 'female' | 'male'
  language: string
  accent: string
  provider: VoiceProvider
}

export const DEEPGRAM_VOICES: VoiceCatalogEntry[] = [
  { id: 'aura-asteria-en', name: 'Asteria', gender: 'female', language: 'en', accent: 'American', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-luna-en', name: 'Luna', gender: 'female', language: 'en', accent: 'American', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-stella-en', name: 'Stella', gender: 'female', language: 'en', accent: 'American', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-athena-en', name: 'Athena', gender: 'female', language: 'en', accent: 'British', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-hera-en', name: 'Hera', gender: 'female', language: 'en', accent: 'American', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-orion-en', name: 'Orion', gender: 'male', language: 'en', accent: 'American', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-arcas-en', name: 'Arcas', gender: 'male', language: 'en', accent: 'American', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-perseus-en', name: 'Perseus', gender: 'male', language: 'en', accent: 'American', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-angus-en', name: 'Angus', gender: 'male', language: 'en', accent: 'Irish', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-orpheus-en', name: 'Orpheus', gender: 'male', language: 'en', accent: 'American', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-helios-en', name: 'Helios', gender: 'male', language: 'en', accent: 'British', provider: 'deepgram' as VoiceProvider },
  { id: 'aura-zeus-en', name: 'Zeus', gender: 'male', language: 'en', accent: 'American', provider: 'deepgram' as VoiceProvider },
]

export const ELEVENLABS_VOICES: VoiceCatalogEntry[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', gender: 'female', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', gender: 'female', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', gender: 'female', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Gigi', gender: 'female', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: 'jsCqWAovK2LkecY7zXl4', name: 'Freya', gender: 'female', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: '29vD33N1CtxCmqQRPOHJ', name: 'Drew', gender: 'male', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde', gender: 'male', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold', gender: 'male', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam', gender: 'male', language: 'en', accent: 'American', provider: 'elevenlabs' as VoiceProvider },
]

export const OPENAI_VOICES: VoiceCatalogEntry[] = [
  { id: 'alloy', name: 'Alloy', gender: 'female', language: 'en', accent: 'Neutral', provider: 'openai' as VoiceProvider },
  { id: 'echo', name: 'Echo', gender: 'male', language: 'en', accent: 'Neutral', provider: 'openai' as VoiceProvider },
  { id: 'fable', name: 'Fable', gender: 'male', language: 'en', accent: 'British', provider: 'openai' as VoiceProvider },
  { id: 'onyx', name: 'Onyx', gender: 'male', language: 'en', accent: 'Neutral', provider: 'openai' as VoiceProvider },
  { id: 'nova', name: 'Nova', gender: 'female', language: 'en', accent: 'Neutral', provider: 'openai' as VoiceProvider },
  { id: 'shimmer', name: 'Shimmer', gender: 'female', language: 'en', accent: 'Neutral', provider: 'openai' as VoiceProvider },
]

export const ALL_VOICES: VoiceCatalogEntry[] = [
  ...DEEPGRAM_VOICES,
  ...ELEVENLABS_VOICES,
  ...OPENAI_VOICES,
]

export function getVoicesByProvider(provider: VoiceProvider): VoiceCatalogEntry[] {
  switch (provider) {
    case 'deepgram' as VoiceProvider: return DEEPGRAM_VOICES
    case 'elevenlabs' as VoiceProvider: return ELEVENLABS_VOICES
    case 'openai' as VoiceProvider: return OPENAI_VOICES
    default: return DEEPGRAM_VOICES
  }
}

export function getDefaultVoiceId(provider: VoiceProvider): string {
  switch (provider) {
    case 'deepgram' as VoiceProvider: return 'aura-asteria-en'
    case 'elevenlabs' as VoiceProvider: return '21m00Tcm4TlvDq8ikWAM'
    case 'openai' as VoiceProvider: return 'alloy'
    default: return 'aura-asteria-en'
  }
}

export interface SynthesizeVoiceRequest {
  provider: VoiceProvider
  voiceId: string
  text: string
}
