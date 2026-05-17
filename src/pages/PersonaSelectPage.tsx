import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, MessageCircle } from 'lucide-react'
import { getAllPersonas, getAllChats, createChat, addMessage } from '../services/db'
import { saveSettings, getSettings } from '../services/settings'
import { generateGreeting } from '../services/ai'
import { DEFAULT_PERSONA } from '../types/persona'
import type { Persona } from '../types/persona'
import type { Chat, Message } from '../services/db'
import Avatar from '../components/Avatar'

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

export default function PersonaSelectPage() {
  const navigate = useNavigate()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    getAllPersonas().then((list) => {
      setPersonas([DEFAULT_PERSONA, ...list])
      setLoading(false)
    })
  }, [])

  const handleSelect = async (p: Persona) => {
    saveSettings({
      activePersonaId: p.id,
      partnerName: p.name,
      aiAvatar: p.avatar,
    })

    const settings = getSettings()
    if (!settings.apiKey) {
      navigate('/settings')
      return
    }

    // Check if there's an existing chat with this persona
    // Old chats without personaId are treated as default persona
    const allChats = await getAllChats()
    const existing = allChats
      .filter((c) => c.personaId === p.id || (!c.personaId && p.id === '__default_alex__'))
      .sort((a, b) => b.updatedAt - a.updatedAt)
    if (existing.length > 0) {
      navigate(`/chat/${existing[0].id}`)
      return
    }

    // No existing chat — create a new one
    setCreating(true)
    try {
      const { partnerName, vocabLevel, activePersonaId } = getSettings()
      const greeting = await generateGreeting(partnerName, vocabLevel)

      const chatId = uid()
      const chat: Chat = {
        id: chatId,
        title: greeting.slice(0, 40) + '...',
        level: vocabLevel,
        partnerName,
        personaId: activePersonaId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await createChat(chat)

      const aiMsg: Message = {
        id: uid(),
        chatId,
        role: 'assistant',
        content: greeting,
        usedVocab: [],
        timestamp: Date.now(),
      }
      await addMessage(aiMsg)

      navigate(`/chat/${chatId}`)
    } catch {
      navigate('/settings')
    } finally {
      setCreating(false)
    }
  }

  function roleIcon(role: string): string {
    const map: Record<string, string> = {
      '老师': '👩‍🏫', '朋友': '👋', '笔友': '✉️', '同学': '📚',
      '同事': '💼', '导师': '🧭', '面试官': '📋', '教练': '🎯',
      '旅伴': '✈️', '树洞': '🌳', '损友': '😈', '学姐': '🎓',
      '学长': '🎓', '邻居': '🏠', '陌生人': '👤',
    }
    return map[role] || '💬'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#fafafa]">
        <Loader2 size={22} className="animate-spin" style={{ color: accent }} />
      </div>
    )
  }

  const isCreating = creating

  return (
    <div className="h-full overflow-y-auto bg-[#fafafa]">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-[20px] font-bold text-black mb-1">CET Chat</h1>
          <p className="text-[14px]" style={{ color: '#8e8e8e' }}>选择一位伙伴开始英语对话</p>
          {isCreating && (
            <p className="text-[12px] flex items-center justify-center gap-1.5 mt-2" style={{ color: accent }}>
              <Loader2 size={12} className="animate-spin" />
              正在创建对话...
            </p>
          )}
        </div>

        <div className={`grid grid-cols-2 gap-3 ${isCreating ? 'pointer-events-none opacity-60' : ''}`}>
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="flex flex-col items-center gap-2.5 p-5 rounded-[18px] bg-white transition-all text-left"
              style={{ border: '1px solid #e8e8e8' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = accent
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(129,40,175,0.1)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#e8e8e8'
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              }}
            >
              <Avatar src={p.avatar} name={p.name} size={52} />
              <div className="text-center">
                <p className="text-[14px] font-semibold text-black">{p.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: '#8e8e8e' }}>
                  {roleIcon(p.profile.role)} {p.profile.role || '朋友'}
                </p>
                {p.profile.traits.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                    {p.profile.traits.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: '#f0e6f6', color: accent }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* Create new persona card */}
          <button
            onClick={() => navigate('/personas/new')}
            className="flex flex-col items-center justify-center gap-2 p-5 rounded-[18px] border border-dashed transition-all min-h-[140px]"
            style={{ borderColor: '#dbdbdb' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = accent
              ;(e.currentTarget as HTMLElement).style.backgroundColor = '#faf5fd'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#dbdbdb'
              ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#f0e6f6' }}
            >
              <Plus size={22} style={{ color: accent }} />
            </div>
            <span className="text-[13px] font-medium" style={{ color: accent }}>创建新的人格</span>
          </button>
        </div>

        {/* Quick resume: existing chats */}
        <ExistingChats onSelect={(chatId) => navigate(`/chat/${chatId}`)} />
      </div>
    </div>
  )
}

function ExistingChats({ onSelect }: { onSelect: (id: string) => void }) {
  const [chats, setChats] = useState<{ id: string; title: string; updatedAt: number }[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    getAllChats().then((all) => {
      all.sort((a, b) => b.updatedAt - a.updatedAt)
      setChats(all.slice(0, 5))
      if (all.length > 0) setShow(true)
    })
  }, [])

  if (!show) return null

  return (
    <div className="mt-6">
      <p className="text-[12px] font-medium mb-2" style={{ color: '#8e8e8e' }}>最近对话</p>
      <div className="space-y-0.5">
        {chats.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-left text-[13px] text-black transition-colors hover:bg-[#f0f0f0]"
          >
            <MessageCircle size={14} style={{ color: '#8e8e8e' }} />
            <span className="truncate flex-1">{c.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
