import { useState, useRef, useEffect } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { getSettings, saveSettings } from '../services/settings'
import type { AppSettings } from '../services/settings'
import { getAllPersonas, deletePersona } from '../services/db'
import { DEFAULT_PERSONA } from '../types/persona'
import type { Persona } from '../types/persona'
import Avatar from '../components/Avatar'

const accent = 'oklch(45% 0.21 310)'

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
              onChange={(e) => setSettings({ ...settings, vocabLevel: e.target.value as 'cet4' | 'cet6' })}
              className={inputClass}
            >
              <option value="cet4">四级 (CET-4)</option>
              <option value="cet6">六级 (CET-6)</option>
            </select>
          </div>

          <PersonaSelector />

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

function PersonaSelector() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [activeId, setActiveId] = useState(getSettings().activePersonaId)

  useEffect(() => {
    getAllPersonas().then(setPersonas)
  }, [])

  const handleSelect = (id: string) => {
    setActiveId(id)
    const p = id === DEFAULT_PERSONA.id ? DEFAULT_PERSONA : personas.find((x) => x.id === id)
    saveSettings({
      activePersonaId: id,
      partnerName: p?.name || 'Alex',
      aiAvatar: p?.avatar || '',
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个人格？')) return
    await deletePersona(id)
    if (activeId === id) handleSelect(DEFAULT_PERSONA.id)
    setPersonas((prev) => prev.filter((p) => p.id !== id))
  }

  const all = [DEFAULT_PERSONA, ...personas]

  return (
    <div>
      <label className="block text-[14px] font-semibold text-black mb-1.5">AI 伙伴人格</label>
      <div className="space-y-1">
        {all.map((p) => (
          <div
            key={p.id}
            onClick={() => handleSelect(p.id)}
            className="flex items-center gap-3 px-3 py-2 rounded-[12px] cursor-pointer transition-colors"
            style={{
              backgroundColor: activeId === p.id ? '#f0e6f6' : 'transparent',
            }}
          >
            <Avatar src={p.avatar} name={p.name} size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-black">{p.name}</p>
              <p className="text-[11px]" style={{ color: '#8e8e8e' }}>
                {p.profile.role || '朋友'}
                {p.profile.traits.length > 0 && ` · ${p.profile.traits.slice(0, 3).join('、')}`}
              </p>
            </div>
            {activeId === p.id && (
              <span className="text-[11px] font-medium" style={{ color: accent }}>当前</span>
            )}
            {p.id !== DEFAULT_PERSONA.id && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(p.id) }}
                className="p-1 rounded-full hover:bg-[#f0f0f0]"
                style={{ color: '#8e8e8e' }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
