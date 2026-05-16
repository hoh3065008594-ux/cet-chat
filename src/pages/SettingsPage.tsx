import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

const STORAGE_KEY = 'cet-chat-settings'

interface Settings {
  apiKey: string
  apiEndpoint: string
  model: string
  partnerName: string
  vocabLevel: 'cet4' | 'cet6'
}

const defaults: Settings = {
  apiKey: '',
  apiEndpoint: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  partnerName: 'Alex',
  vocabLevel: 'cet4',
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
  } catch {
    return defaults
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">设置</h2>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API 地址</label>
          <input
            type="text"
            value={settings.apiEndpoint}
            onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">模型</label>
          <input
            type="text"
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">伙伴名称</label>
          <input
            type="text"
            value={settings.partnerName}
            onChange={(e) => setSettings({ ...settings, partnerName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">词库级别</label>
          <select
            value={settings.vocabLevel}
            onChange={(e) => setSettings({ ...settings, vocabLevel: e.target.value as 'cet4' | 'cet6' })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="cet4">四级 (CET-4)</option>
            <option value="cet6">六级 (CET-6)</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
        >
          <Save size={16} />
          {saved ? '已保存' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
