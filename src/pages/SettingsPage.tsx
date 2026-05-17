import { useState, useRef } from 'react'
import { Save } from 'lucide-react'
import { getSettings, saveSettings } from '../services/settings'
import type { AppSettings } from '../services/settings'
import Avatar from '../components/Avatar'

const accent = '#8128af'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getSettings)
  const [saved, setSaved] = useState(false)
  const userFileRef = useRef<HTMLInputElement>(null)
  const aiFileRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    saveSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAvatarUpload = (type: 'user' | 'ai', e: React.ChangeEvent<HTMLInputElement>) => {
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

  const inputClass = "w-full rounded-[14px] px-4 py-2.5 text-[14px] focus:outline-none bg-[#f0f0f0] placeholder-[#8e8e8e]"

  return (
    <div className="h-full overflow-y-auto bg-[#fafafa]">
      <div className="max-w-xl mx-auto p-4 sm:p-8">
        <h2 className="text-[17px] font-bold text-black mb-6">设置</h2>

        <div className="space-y-5">
          {/* Avatars */}
          <div>
            <label className="block text-[14px] font-semibold text-black mb-3">头像设置</label>
            <div className="flex gap-6">
              {(['user', 'ai'] as const).map((type) => {
                const avatar = type === 'user' ? settings.userAvatar : settings.aiAvatar
                const label = type === 'user' ? '我的头像' : `${settings.partnerName} 头像`
                const ref = type === 'user' ? userFileRef : aiFileRef
                return (
                  <div key={type} className="flex flex-col items-center gap-2">
                    <Avatar src={avatar} name={type === 'user' ? 'Me' : settings.partnerName} size={56} />
                    <span className="text-[12px]" style={{ color: '#8e8e8e' }}>{label}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => ref.current?.click()} className="text-[12px] font-semibold" style={{ color: accent }}>上传</button>
                      {avatar && <button onClick={() => handleRemoveAvatar(type)} className="text-[12px] text-[#dd2a7b]">移除</button>}
                    </div>
                    <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(type, e)} />
                  </div>
                )
              })}
            </div>
          </div>

          {[
            { label: 'API Key', key: 'apiKey' as const, placeholder: 'sk-...', type: 'password' },
            { label: 'API 地址', key: 'apiEndpoint' as const, placeholder: 'https://api.deepseek.com/v1', type: 'text' },
            { label: '模型', key: 'model' as const, placeholder: 'deepseek-chat', type: 'text' },
            { label: '伙伴名称', key: 'partnerName' as const, placeholder: 'Alex', type: 'text' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-[14px] font-semibold text-black mb-1.5">{label}</label>
              <input
                type={type}
                value={settings[key]}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}

          <div>
            <label className="block text-[14px] font-semibold text-black mb-1.5">词库级别</label>
            <select
              value={settings.vocabLevel}
              onChange={(e) => setSettings({ ...settings, vocabLevel: e.target.value as 'basic' | 'cet4' | 'cet6' })}
              className={inputClass}
            >
              <option value="basic">基础日常 (Basic)</option>
              <option value="cet4">四级 (CET-4)</option>
              <option value="cet6">六级 (CET-6)</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-[14px] text-[14px] font-semibold transition-colors"
            style={{ backgroundColor: accent }}
          >
            <Save size={16} />
            {saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  )
}
