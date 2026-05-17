export interface AppSettings {
  apiKey: string
  apiEndpoint: string
  model: string
  partnerName: string
  vocabLevel: 'cet4' | 'cet6'
  activePersonaId: string
  userAvatar: string
  aiAvatar: string
}

const defaults: AppSettings = {
  apiKey: '',
  apiEndpoint: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  partnerName: 'Alex',
  vocabLevel: 'cet4',
  activePersonaId: '__default_alex__',
  userAvatar: '',
  aiAvatar: '',
}

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('cet-chat-settings')
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings()
  const merged = { ...current, ...settings }
  localStorage.setItem('cet-chat-settings', JSON.stringify(merged))
}

export function getApiKey(): string {
  return getSettings().apiKey
}

export function getApiConfig(): { apiKey: string; apiEndpoint: string; model: string } {
  const { apiKey, apiEndpoint, model } = getSettings()
  return { apiKey, apiEndpoint, model }
}
