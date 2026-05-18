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

function cookieGet(key: string): string | null {
  const cookies = document.cookie.split(';')
  for (const c of cookies) {
    const [k, ...v] = c.trim().split('=')
    if (k === key) return decodeURIComponent(v.join('='))
  }
  return null
}

function cookieSet(key: string, value: string): void {
  document.cookie = key + '=' + encodeURIComponent(value) + ';path=/;max-age=31536000;SameSite=Lax'
}

export function getSettings(): AppSettings {
  try {
    let raw = localStorage.getItem('cet-chat-settings')
    // Fallback to cookie (for iOS PWA separate storage)
    if (!raw) {
      const cookieRaw = cookieGet('cet-chat-settings')
      if (cookieRaw) raw = cookieRaw
    }
    if (!raw) return { ...defaults }
    const parsed = { ...defaults, ...JSON.parse(raw) }
    // Restore to localStorage if only in cookie
    if (!localStorage.getItem('cet-chat-settings')) {
      localStorage.setItem('cet-chat-settings', JSON.stringify(parsed))
    }
    return parsed
  } catch {
    return { ...defaults }
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const current = getSettings()
  const merged = { ...current, ...settings }
  const json = JSON.stringify(merged)
  localStorage.setItem('cet-chat-settings', json)
  cookieSet('cet-chat-settings', json)
}

export function getApiKey(): string {
  return getSettings().apiKey
}

export function getApiConfig(): { apiKey: string; apiEndpoint: string; model: string } {
  const { apiKey, apiEndpoint, model } = getSettings()
  return { apiKey, apiEndpoint, model }
}
