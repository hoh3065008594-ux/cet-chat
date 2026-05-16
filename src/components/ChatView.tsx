import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Loader2 } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import { useDictionary } from '../hooks/useDictionary'
import WordTooltip from './WordTooltip'

export default function ChatView() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { chats, messages, loading, error, startNewChat, sendMessage } = useChat(chatId)
  const { selectedWord, position, lookUp, clearWord } = useDictionary()
  const [input, setInput] = useState('')

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

  if (!chatId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
          <p className="text-lg">选择对话或新建一个开始聊天</p>
          <button
            onClick={handleNewChat}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors text-sm font-medium"
          >
            {loading ? <Loader2 size={18} className="animate-spin inline" /> : '新建对话'}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-700 truncate flex-1">
          {chats.find((c) => c.id === chatId)?.title || '新对话'}
        </h2>
        <button
          onClick={handleNewChat}
          disabled={loading}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium shrink-0 ml-3"
        >
          + 新对话
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-gray-400 mt-10">
            <p>等待 AI 伙伴回复...</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.role === 'assistant' ? (
                <AssistantContent content={msg.content} onWordClick={handleWordClick} />
              ) : (
                msg.content
              )}
              {msg.usedVocab.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300/50 text-xs text-gray-500 flex flex-wrap gap-1">
                  📖 {msg.usedVocab.map((w) => (
                    <span
                      key={w}
                      className="cursor-pointer underline decoration-dotted hover:text-indigo-600"
                      onClick={(e) => handleWordClick(w, e)}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              输入中...
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 text-sm bg-red-50 rounded-lg py-2 px-4">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="输入你的消息..."
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Word Tooltip */}
      {selectedWord && (
        <WordTooltip word={selectedWord} position={position} onClose={clearWord} />
      )}
    </div>
  )
}

function AssistantContent({
  content,
  onWordClick,
}: {
  content: string
  onWordClick: (word: string, e: React.MouseEvent) => void
}) {
  // Remove the "📖 Used CET words:" line from display
  const clean = content.replace(/\n?📖 Used CET words:.*$/is, '')
  const lines = clean.split('\n')

  return (
    <>
      {lines.map((line, li) => (
        <p key={li} className={li > 0 ? 'mt-1' : ''}>
          {line.split(/([a-zA-Z]+)/).map((part, i) =>
            /^[a-zA-Z]{3,}$/.test(part) ? (
              <span
                key={i}
                className="cursor-pointer border-b border-dotted border-gray-400 hover:text-indigo-600 hover:border-indigo-400"
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
    </>
  )
}
