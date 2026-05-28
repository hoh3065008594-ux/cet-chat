import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, MessageCircle, GraduationCap, Hand, PenTool, Users, Briefcase, Compass, ClipboardCheck, Target, Plane, TreePine, Flame, School, Building2, User } from 'lucide-react'
import { getAllPersonas, getAllChats, createChat, addMessage } from '../services/db'
import { saveSettings, getSettings } from '../services/settings'
import { generateGreeting } from '../services/ai'
import { DEFAULT_PERSONA } from '../types/persona'
import type { Persona } from '../types/persona'
import type { Chat, Message } from '../services/db'
import Avatar from '../components/Avatar'

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

    const allChats = await getAllChats()
    const existing = allChats
      .filter((c) => c.personaId === p.id || (!c.personaId && p.id === '__default_alex__'))
      .sort((a, b) => b.updatedAt - a.updatedAt)
    if (existing.length > 0) {
      navigate(`/chat/${existing[0].id}`)
      return
    }

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
    } catch (err) {
      alert('创建对话失败: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setCreating(false)
    }
  }

  function roleIcon(role: string) {
    const map: Record<string, React.ComponentType<{ size?: number }>> = {
      '老师': GraduationCap, '朋友': Hand, '笔友': PenTool, '同学': Users,
      '同事': Briefcase, '导师': Compass, '面试官': ClipboardCheck, '教练': Target,
      '旅伴': Plane, '树洞': TreePine, '损友': Flame, '学姐': School,
      '学长': School, '邻居': Building2, '陌生人': User,
    }
    const Icon = map[role] || MessageCircle
    return <Icon size={14} />
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f1f4f7]">
        <Loader2 size={22} className="animate-spin text-[#0064e0]" />
      </div>
    )
  }

  const isCreating = creating

  return (
    <div className="h-full overflow-y-auto bg-[#f1f4f7]">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-[#0a1317] tracking-[-0.24px] mb-1">CET Chat</h1>
          <p className="text-sm text-[#5d6c7b] tracking-[-0.14px]">选择一位伙伴开始英语对话</p>
          {isCreating && (
            <p className="text-xs flex items-center justify-center gap-1.5 mt-2 text-[#0064e0]">
              <Loader2 size={12} className="animate-spin" />
              正在创建对话...
            </p>
          )}
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${isCreating ? 'pointer-events-none opacity-60' : ''}`}>
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p)}
              className="flex flex-col items-center gap-2 p-6 rounded-[32px] bg-white transition-all text-left hover:border-[#ced0d4]"
              style={{ border: '1px solid #dee3e9' }}
            >
              <Avatar src={p.avatar} name={p.name} size={48} />
              <div className="text-center">
                <p className="text-sm font-bold tracking-[-0.14px] text-[#0a1317]">{p.name}</p>
                <p className="text-xs mt-0.5 text-[#8595a4]">
                  {roleIcon(p.profile.role)} {p.profile.role || '朋友'}
                </p>
                {p.profile.traits.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                    {p.profile.traits.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="text-xs px-2.5 py-0.5 rounded-[100px] font-bold"
                        style={{ backgroundColor: '#f1f4f7', color: '#444950' }}
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
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-[32px] border border-dashed transition-all min-h-[120px] hover:border-[#0064e0] hover:bg-[#f1f4f7]"
            style={{ borderColor: '#ced0d4' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#f1f4f7' }}
            >
              <Plus size={22} style={{ color: '#0064e0' }} />
            </div>
            <span className="text-sm font-bold tracking-[-0.14px] text-[#0064e0]">创建新的人格</span>
          </button>
        </div>

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
      <p className="text-xs font-bold text-[#5d6c7b] mb-2">最近对话</p>
      <div className="space-y-0.5">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[16px] text-left text-sm tracking-[-0.14px] text-[#0a1317] hover:bg-[#f1f4f7] transition-colors"
          >
            <MessageCircle size={14} className="text-[#8595a4]" />
            <span className="truncate flex-1">{chat.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
