import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Loader2 } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { useDictionary } from '../hooks/useDictionary'
import { useTypewriter } from '../hooks/useTypewriter'
import { getSettings } from '../services/settings'
import WordTooltip from './WordTooltip'
import Avatar from './Avatar'

const accent = '#8128af'
const accentHover = '#9b30d4'

export default function ChatView() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { chats, messages, loading, error, startNewChat, sendMessage } = useChat(chatId)
  const { selectedWord, position, lookUp, clearWord } = useDictionary()
  const [input, setInput] = useState('')
  const { userAvatar, aiAvatar, partnerName } = getSettings()

  const handleNewChat = async () => {
    const id = await startNewChat()
    if (id) navigate(`/chat/${id}`)
  }

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
      <div className="flex flex-col h-full bg-[#fafafa]">
        <div className="flex-1 flex flex-col items-center justify-center space-y-5 px-6">
          <div className="w-20 h-20 rounded-full bg-[#f0e6f6] flex items-center justify-center">
            <Send size={32} style={{ color: accent }} />
          </div>
          <p className="text-[15px] font-medium text-black">选择对话或新建一个开始聊天</p>
          <button
            onClick={() => {
              const settings = JSON.parse(localStorage.getItem('cet-chat-settings') || '{}')
              if (!settings.apiKey) { navigate('/settings'); return }
              handleNewChat()
            }}
            disabled={loading}
            className="text-white px-6 py-2.5 rounded-[18px] text-sm font-semibold disabled:opacity-40 transition-colors"
            style={{ backgroundColor: accent }}
          >
            {loading ? <Loader2 size={18} className="animate-spin inline" /> : '新建对话'}
          </button>
          {error && <p className="text-[#dd2a7b] text-sm">{error}</p>}
          {(() => {
            const settings = JSON.parse(localStorage.getItem('cet-chat-settings') || '{}')
            if (!settings.apiKey) return <p className="text-[#8e8e8e] text-xs">请先设置 API Key</p>
            return null
          })()}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative bg-[#fafafa]">
      {/* Header */}
      <div className="px-4 py-3 bg-white flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #e8e8e8' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar src={aiAvatar} name={partnerName} size={28} />
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-black truncate">
              {chats.find((c) => c.id === chatId)?.title || '新对话'}
            </h2>
            <p className="text-[11px] text-[#8e8e8e]">Active now</p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-[14px] transition-colors disabled:opacity-40"
          style={{ color: accent, backgroundColor: '#f0e6f6' }}
        >
          + 新对话
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && !loading && (
          <div className="text-center mt-10">
            <p className="text-[13px] text-[#8e8e8e]">等待 AI 伙伴回复...</p>
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
                src={msg.role === 'user' ? userAvatar : aiAvatar}
                name={msg.role === 'user' ? 'Me' : partnerName}
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
            <Avatar src={aiAvatar} name={partnerName} size={22} />
            <div className="px-4 py-2.5 text-[13px] text-[#8e8e8e] flex items-center gap-2" style={{ backgroundColor: '#f0f0f0', borderRadius: '18px 18px 18px 4px' }}>
              <Loader2 size={14} className="animate-spin" />
              输入中...
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-[13px] text-[#dd2a7b] bg-[#fef0f5] rounded-xl py-2 px-4 mx-4">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 bg-white" style={{ borderTop: '1px solid #e8e8e8' }}>
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <div className="flex-1 flex items-center gap-2 rounded-[24px] px-4 py-2" style={{ backgroundColor: '#f0f0f0' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Message..."
              disabled={loading}
              className="flex-1 bg-transparent text-[14px] placeholder-[#8e8e8e] focus:outline-none disabled:opacity-50"
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
