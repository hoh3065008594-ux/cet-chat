import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, BarChart3, Settings, Plus, Trash2, X, PenLine } from 'lucide-react'
import { useChat } from '../hooks/useChat'

interface Props {
  open: boolean
  onClose: () => void
}

const accent = '#8128af'

export default function Sidebar({ open, onClose }: Props) {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { chats, loading, error, startNewChat, removeChat } = useChat(chatId)

  const handleNewChat = async () => {
    const settings = JSON.parse(localStorage.getItem('cet-chat-settings') || '{}')
    if (!settings.apiKey) {
      navigate('/settings')
      onClose()
      return
    }
    const id = await startNewChat()
    if (id) {
      navigate(`/chat/${id}`)
      onClose()
    }
  }

  const handleSelect = () => {
    onClose()
  }

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col shrink-0 transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#fff', borderRight: '1px solid #e8e8e8' }}
      >
        {/* Brand */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #e8e8e8' }}>
          <div>
            <h1 className="text-[17px] font-bold text-black">CET Chat</h1>
            <p className="text-[11px] mt-0.5" style={{ color: '#8e8e8e' }}>英语对话学习伙伴</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg" style={{ color: '#8e8e8e' }}>
            <X size={20} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={handleNewChat}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-white rounded-[14px] text-sm font-semibold disabled:opacity-50 transition-colors"
            style={{ backgroundColor: accent }}
          >
            <Plus size={16} />
            新建对话
          </button>
        </div>

        {error && (
          <div className="px-3 py-1.5 text-xs mx-3 rounded-lg" style={{ color: '#dd2a7b', backgroundColor: '#fef0f5' }}>
            {error}
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {chats.map((chat) => (
            <div key={chat.id} className="group relative">
              <NavLink
                to={`/chat/${chat.id}`}
                onClick={handleSelect}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] text-sm transition-colors truncate pr-8 ${
                    isActive
                      ? 'font-semibold text-black'
                      : 'text-black hover:bg-[#f0f0f0]'
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { backgroundColor: '#f0e6f6' } : {}
                }
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                  style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, white)`, color: accent }}>
                  {chat.title.charAt(0)}
                </div>
                <span className="truncate text-[14px]">{chat.title}</span>
              </NavLink>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (confirm('删除此对话？')) {
                    removeChat(chat.id)
                    if (chat.id === chatId) navigate('/')
                  }
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                style={{ color: '#8e8e8e' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {chats.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: '#8e8e8e' }}>暂无对话</p>
          )}
        </div>

        {/* Nav links */}
        <nav className="p-2 space-y-1" style={{ borderTop: '1px solid #e8e8e8' }}>
          {[
            { to: '/diary', icon: PenLine, label: '英语日记' },
            { to: '/vocabulary', icon: BookOpen, label: '词库预览' },
            { to: '/stats', icon: BarChart3, label: '学习统计' },
            { to: '/settings', icon: Settings, label: '设置' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={handleSelect}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[14px] text-[14px] transition-colors ${
                  isActive ? 'font-semibold' : ''
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#f0e6f6' : 'transparent',
                color: isActive ? accent : '#000',
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
