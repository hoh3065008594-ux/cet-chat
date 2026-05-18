import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, BarChart3, Settings, Plus, X, PenLine, Sparkles } from 'lucide-react'
import { getAllPersonas, getAllChats, createChat, addMessage } from '../services/db'
import { generateGreeting } from '../services/ai'
import { getSettings, saveSettings } from '../services/settings'
import { DEFAULT_PERSONA } from '../types/persona'
import type { Persona } from '../types/persona'
import type { Chat, Message } from '../services/db'
import Avatar from './Avatar'

interface Props {
  open: boolean
  onClose: () => void
}

const accent = 'oklch(45% 0.21 310)'

function uid(): string {
  try { return crypto.randomUUID() }
  catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 3)
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
}

export default function Sidebar({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState<Persona[]>([])
  const activeId = getSettings().activePersonaId

  useEffect(() => {
    getAllPersonas().then((list) => setPersonas([DEFAULT_PERSONA, ...list]))
  }, [])

  const handleSelectPersona = async (p: Persona) => {
    saveSettings({ activePersonaId: p.id, partnerName: p.name, aiAvatar: p.avatar })
    onClose()

    const settings = getSettings()
    if (!settings.apiKey) { navigate('/settings'); return }

    // Check for existing chat
    const allChats = await getAllChats()
    const existing = allChats
      .filter((c) => c.personaId === p.id || (!c.personaId && p.id === '__default_alex__'))
      .sort((a, b) => b.updatedAt - a.updatedAt)

    if (existing.length > 0) {
      navigate(`/chat/${existing[0].id}`)
      return
    }

    // No existing chat — create one
    try {
      const { partnerName, vocabLevel, activePersonaId } = getSettings()
      const greeting = await generateGreeting(partnerName, vocabLevel)
      const chatId = uid()
      await createChat({ id: chatId, title: greeting.slice(0, 40) + '...', level: vocabLevel, partnerName, personaId: activePersonaId, createdAt: Date.now(), updatedAt: Date.now() })
      await addMessage({ id: uid(), chatId, role: 'assistant', content: greeting, usedVocab: [], timestamp: Date.now() })
      navigate(`/chat/${chatId}`)
    } catch {
      navigate('/settings')
    }
  }

  const handleNewChat = () => {
    navigate('/')
    onClose()
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col shrink-0 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: 'oklch(100% 0 0)', borderRight: '1px solid oklch(92% 0.003 310)' }}
      >
        {/* Brand */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid oklch(92% 0.003 310)' }}>
          <div>
            <h1 className="text-[17px] font-bold text-black">CET Chat</h1>
            <p className="text-[11px] mt-0.5" style={{ color: 'oklch(55% 0.003 310)' }}>英语对话学习伙伴</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg" style={{ color: 'oklch(55% 0.003 310)' }}>
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-white rounded-[14px] text-sm font-semibold transition-colors"
            style={{ backgroundColor: accent }}
          >
            <Plus size={16} />
            新建对话
          </button>
        </div>

        {/* Persona list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPersona(p)}
              className="persona-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] text-sm transition-colors text-left cursor-pointer"
              style={{
                backgroundColor: p.id === activeId ? 'oklch(92% 0.03 310)' : 'transparent',
                color: 'oklch(12% 0.002 310)',
              }}
            >
              <Avatar src={p.avatar} name={p.name} size={30} />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[13px] font-medium truncate">{p.name}</p>
                <p className="text-[11px] truncate" style={{ color: 'oklch(55% 0.003 310)' }}>
                  {p.profile.role || '朋友'}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Nav links */}
        <nav className="p-2 space-y-1" style={{ borderTop: '1px solid oklch(92% 0.003 310)' }}>
          {[
            { to: '/personas/new', icon: Sparkles, label: '人格工坊' },
            { to: '/diary', icon: PenLine, label: '英语日记' },
            { to: '/vocabulary', icon: BookOpen, label: '词库预览' },
            { to: '/stats', icon: BarChart3, label: '学习统计' },
            { to: '/settings', icon: Settings, label: '设置' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[14px] transition-colors ${
                  isActive ? 'font-semibold' : ''
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'oklch(92% 0.03 310)' : 'transparent',
                color: isActive ? accent : 'oklch(12% 0.002 310)',
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
