import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Loader2 } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { useDictionary } from '../hooks/useDictionary'
import { useTypewriter } from '../hooks/useTypewriter'
import { getSettings } from '../services/settings'
import { getPersona, getChat } from '../services/db'
import { DEFAULT_PERSONA } from '../types/persona'
import type { Persona } from '../types/persona'
import WordTooltip from './WordTooltip'
import Avatar from './Avatar'

const accent = 'oklch(45% 0.21 310)'
export default function ChatView() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { chats, messages, loading, error, sendMessage } = useChat(chatId)
  const { selectedWord, position, lookUp, clearWord } = useDictionary()
  const [input, setInput] = useState('')
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA)

  const { userAvatar } = getSettings()

  // Load persona: prefer chat's persona, fallback to active persona
  useEffect(() => {
    if (!chatId) return
    getChat(chatId).then((chat) => {
      const personaId = chat?.personaId || getSettings().activePersonaId
      if (personaId && personaId !== '__default_alex__') {
        getPersona(personaId).then((p) => { if (p) setPersona(p) })
      } else {
        setPersona(DEFAULT_PERSONA)
      }
    })
  }, [chatId])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const handleWordClick = (word: string, e: React.MouseEvent) => {
    lookUp(word, e)
  }

  // Track loading transitions — only animate messages that just arrived from API
  const prevLoading = useRef(loading)
  const freshMessage = useRef(false)
  if (prevLoading.current && !loading) {
    freshMessage.current = true
  }
  prevLoading.current = loading
  // Reset after render, so historical messages on next load don't animate
  useEffect(() => { freshMessage.current = false })

  if (!chatId) {
    return (
      <div className="flex flex-col h-full bg-[oklch(98.5%_0.002_310)]">
        <div className="flex-1 flex flex-col items-center justify-center space-y-5 px-6">
          <div className="w-20 h-20 rounded-full bg-[oklch(92%_0.03_310)] flex items-center justify-center">
            <Send size={32} style={{ color: accent }} />
          </div>
          <p className="text-[15px] font-medium text-black">选择一位伙伴开始英语对话</p>
          <button
            onClick={() => navigate('/')}
            className="text-white px-6 py-2.5 rounded-[18px] text-sm font-semibold transition-colors"
            style={{ backgroundColor: accent }}
          >
            选择伙伴
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative bg-[oklch(98.5%_0.002_310)]">
      {/* Header */}
      <div className="px-4 py-3 bg-white flex items-center shrink-0" style={{ borderBottom: '1px solid oklch(92% 0.003 310)' }}>
        <Avatar src={persona.avatar} name={persona.name} size={28} />
        <div className="ml-2.5 min-w-0">
          <h2 className="text-[14px] font-semibold text-black truncate">
            {chats.find((c) => c.id === chatId)?.title || '新对话'}
          </h2>
          <p className="text-[11px]" style={{ color: 'oklch(55% 0.003 310)' }}>
            {persona.name} · {persona.profile.role || '朋友'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && !loading && (
          <div className="text-center mt-10">
            <p className="text-[13px] text-[oklch(55%_0.003_310)]">等待 AI 伙伴回复...</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isLatestAi = msg.role === 'assistant' && idx === messages.length - 1
          const shouldAnimate = isLatestAi && freshMessage.current
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-1.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <Avatar
                src={msg.role === 'user' ? userAvatar : persona.avatar}
                name={msg.role === 'user' ? 'Me' : persona.name}
                size={22}
              />
              <div
                className={`max-w-[75%] px-3 py-2 text-[14px] leading-relaxed break-words ${
                  msg.role === 'user'
                    ? 'chat-bubble-self'
                    : 'chat-bubble-other'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <AssistantContent
                    content={msg.content}
                    onWordClick={handleWordClick}
                    animate={shouldAnimate}
                    isSelf={false}
                  />
                ) : (
                  msg.content
                )}
                {msg.usedVocab.length > 0 && (
                  <div className="mt-2 pt-2 flex flex-wrap gap-1 text-[11px] opacity-70" style={{ borderTop: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'}` }}>
                    📖 {msg.usedVocab.map((w) => (
                      <span
                        key={w}
                        className="cursor-pointer underline decoration-dotted"
                        onClick={(e) => handleWordClick(w, e)}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex items-end gap-1.5">
            <Avatar src={persona.avatar} name={persona.name} size={22} />
            <div className="px-4 py-2.5 text-[13px] text-[oklch(55%_0.003_310)] flex items-center gap-2" style={{ backgroundColor: 'oklch(96% 0.002 310)', borderRadius: '18px 18px 18px 4px' }}>
              <Loader2 size={14} className="animate-spin" />
              输入中...
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-[13px] text-[oklch(52%_0.22_10)] bg-[oklch(97%_0.02_10)] rounded-xl py-2 px-4 mx-4">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 bg-white" style={{ borderTop: '1px solid oklch(92% 0.003 310)' }}>
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <div className="flex-1 flex items-center gap-2 rounded-[24px] px-4 py-2" style={{ backgroundColor: 'oklch(96% 0.002 310)' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message..."
              disabled={loading}
              className="flex-1 bg-transparent text-[14px] placeholder-[oklch(55%_0.003_310)] focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30 shrink-0"
            style={{ backgroundColor: accent }}
          >
            <Send size={16} color="#fff" />
          </button>
        </div>
      </div>

      {selectedWord && (
        <WordTooltip word={selectedWord} position={position} onClose={clearWord} />
      )}
    </div>
  )
}

function AssistantContent({
  content,
  onWordClick,
  animate = false,
  isSelf = false,
}: {
  content: string
  onWordClick: (word: string, e: React.MouseEvent) => void
  animate?: boolean
  isSelf?: boolean
}) {
  const clean = content.replace(/\n?📖 Used CET words:.*$/is, '')
  const { displayed, done } = useTypewriter(clean, animate ? 25 : 0)
  const text = animate ? displayed : clean
  const blinking = animate && !done
  const wordColor = isSelf ? 'rgba(255,255,255,0.9)' : accent

  const lines = text.split('\n')

  return (
    <>
      {lines.map((line, li) => (
        <p key={li} className={li > 0 ? 'mt-1' : ''}>
          {line.split(/([a-zA-Z]+)/).map((part, i) =>
            /^[a-zA-Z]{3,}$/.test(part) ? (
              <span
                key={i}
                className="cursor-pointer underline decoration-dotted underline-offset-2"
                style={{ textDecorationColor: wordColor }}
                onClick={(e) => onWordClick(part, e)}
              >
                {part}
              </span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </p>
      ))}
      {blinking && (
        <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse align-middle rounded-sm" style={{ backgroundColor: accent }} />
      )}
    </>
  )
}
