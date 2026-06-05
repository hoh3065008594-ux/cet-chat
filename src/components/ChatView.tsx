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

export default function ChatView() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { chats, messages, loading, error, sendMessage } = useChat(chatId)
  const { selectedWord, position, lookUp, clearWord } = useDictionary()
  const [input, setInput] = useState('')
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA)

  const { userAvatar } = getSettings()

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

  const [freshMessage, setFreshMessage] = useState(false)
  const prevLoadingRef = useRef(loading)
  useEffect(() => {
    if (prevLoadingRef.current && !loading) {
      setFreshMessage(true)
      requestAnimationFrame(() => setFreshMessage(false))
    }
    prevLoadingRef.current = loading
  }, [loading])

  if (!chatId) {
    return (
      <div className="flex flex-col h-full bg-[#f1f4f7]">
        <div className="flex-1 flex flex-col items-center justify-center space-y-5 px-6">
          <div className="w-20 h-20 rounded-full bg-[#f1f4f7] flex items-center justify-center">
            <Send size={32} className="text-[#5d6c7b]" />
          </div>
          <p className="text-base font-medium text-[#0a1317]">选择一位伙伴开始英语对话</p>
          <button
            onClick={() => navigate('/')}
            className="text-white px-6 py-3 rounded-[100px] text-sm font-bold tracking-[-0.14px] transition-colors"
            style={{ backgroundColor: '#000000' }}
          >
            选择伙伴
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative bg-[#f1f4f7]">
      {/* Header */}
      <div className="px-4 py-3 bg-white flex items-center shrink-0" style={{ borderBottom: '1px solid #dee3e9' }}>
        <Avatar src={persona.avatar} name={persona.name} size={28} />
        <div className="ml-2.5 min-w-0">
          <h2 className="text-sm font-bold tracking-[-0.14px] text-[#0a1317] truncate">
            {chats.find((c) => c.id === chatId)?.title || '新对话'}
          </h2>
          <p className="text-xs text-[#8595a4]">
            {persona.name} · {persona.profile.role || '朋友'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {messages.length === 0 && !loading && (
          <div className="text-center mt-10">
            <p className="text-sm text-[#8595a4]">等待 AI 伙伴回复...</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isLatestAi = msg.role === 'assistant' && idx === messages.length - 1
          const shouldAnimate = isLatestAi && freshMessage
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
                className={`max-w-[78%] px-3.5 py-2.5 text-sm leading-relaxed break-words ${
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
                  <div className="mt-2 pt-2 flex flex-wrap gap-1 text-xs opacity-70" style={{ borderTop: `1px solid ${msg.role === 'user' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'}` }}>
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
            <div className="px-4 py-2.5 text-sm text-[#5d6c7b] flex items-center gap-2" style={{ backgroundColor: '#f1f4f7', borderRadius: '24px 24px 24px 8px' }}>
              <Loader2 size={14} className="animate-spin" />
              输入中...
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-[#e41e3f] bg-[#fef2f2] rounded-[16px] py-2 px-4 mx-4">
            {error}
          </div>
        )}
      </div>

      {/* Input — Meta pill input + cobalt send button */}
      <div className="px-3 py-3 bg-white safe-bottom" style={{ borderTop: '1px solid #dee3e9' }}>
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <div className="flex-1 flex items-center gap-2 rounded-[100px] px-5 h-[44px]" style={{ backgroundColor: '#f1f4f7' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入对话..."
              disabled={loading}
              className="flex-1 bg-transparent text-[14px] tracking-[-0.14px] text-[#1c1e21] placeholder-[#8595a4] focus:outline-none disabled:opacity-50"
              style={{ fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="h-[44px] px-5 rounded-[100px] flex items-center justify-center gap-2 transition-colors disabled:opacity-40 shrink-0"
            style={{ backgroundColor: '#0064e0' }}
          >
            <Send size={16} color="#fff" />
            <span className="text-sm font-bold tracking-[-0.14px] text-white hidden sm:inline">发送</span>
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
  const wordColor = isSelf ? 'rgba(255,255,255,0.9)' : '#0064e0'

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
        <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse align-middle rounded-sm" style={{ backgroundColor: '#0064e0' }} />
      )}
    </>
  )
}
