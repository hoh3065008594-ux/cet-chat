import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, BarChart3, Settings, Plus, Trash2 } from 'lucide-react'
import { useChat } from '../hooks/useChat'

export default function Sidebar() {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const { chats, loading, startNewChat, removeChat } = useChat(chatId)

  const handleNewChat = async () => {
    const id = await startNewChat()
    if (id) navigate(`/chat/${id}`)
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 h-screen">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-800">CET Chat</h1>
        <p className="text-xs text-gray-500 mt-0.5">英语对话学习伙伴</p>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={handleNewChat}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={16} />
          新建对话
        </button>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {chats.map((chat) => (
          <div key={chat.id} className="group relative">
            <NavLink
              to={`/chat/${chat.id}`}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors truncate pr-8 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              {chat.title}
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
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {chats.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">暂无对话</p>
        )}
      </div>

      <nav className="p-3 space-y-1 border-t border-gray-200">
        <NavLink
          to="/vocabulary"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <BookOpen size={18} />
          词库预览
        </NavLink>
        <NavLink
          to="/stats"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <BarChart3 size={18} />
          统计
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
            }`
          }
        >
          <Settings size={18} />
          设置
        </NavLink>
      </nav>
    </aside>
  )
}
