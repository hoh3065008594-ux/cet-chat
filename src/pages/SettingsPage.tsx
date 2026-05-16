import { useState, useRef, useEffect } from 'react'
import { Save } from 'lucide-react'
import { getSettings, saveSettings } from '../services/settings'
import type { AppSettings } from '../services/settings'
import Avatar from '../components/Avatar'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings)
  const [saved, setSaved] = useState(false)
  const userFileRef = useRef<HTMLInputElement>(null)
  const aiFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  const handleSave = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAvatarUpload = (
    type: 'user' | 'ai',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setSettings({ ...settings, [type === 'user' ? 'userAvatar' : 'aiAvatar']: base64 })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = (type: 'user' | 'ai') => {
    setSettings({ ...settings, [type === 'user' ? 'userAvatar' : 'aiAvatar']: '' })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto p-4 sm:p-8">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-6">设置</h2>

        <div className="space-y-5">
          {/* Avatars */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">头像设置</label>
            <div className="flex gap-6">
              {/* User avatar */}
              <div className="flex flex-col items-center gap-2">
                <Avatar
                  src={settings.userAvatar}
                  name="Me"
                  size={56}
                />
                <span className="text-xs text-gray-500">我的头像</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => userFileRef.current?.click()}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    上传
                  </button>
                  {settings.userAvatar && (
                    <button
                      onClick={() => handleRemoveAvatar('user')}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      移除
                    </button>
                  )}
                </div>
                <input
                  ref={userFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarUpload('user', e)}
                />
              </div>

              {/* AI avatar */}
              <div className="flex flex-col items-center gap-2">
                <Avatar
                  src={settings.aiAvatar}
                  name={settings.partnerName}
                  size={56}
                />
                <span className="text-xs text-gray-500">{settings.partnerName} 头像</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => aiFileRef.current?.click()}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    上传
                  </button>
                  {settings.aiAvatar && (
                    <button
                      onClick={() => handleRemoveAvatar('ai')}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      移除
                    </button>
                  )}
                </div>
                <input
                  ref={aiFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarUpload('ai', e)}
                />
              </div>
            </div>
          </div>

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
    </div>
  )
}
