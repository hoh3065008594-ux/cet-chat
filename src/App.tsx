import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import VocabularyPage from './pages/VocabularyPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import DiaryPage from './pages/DiaryPage'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="lg:hidden px-4 py-2 border-b border-gray-200 bg-white flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-800 p-1"
          >
            <Menu size={22} />
          </button>
          <span className="font-semibold text-gray-800 text-sm">CET Chat</span>
        </div>
        <Routes>
          <Route path="/" element={<ChatView />} />
          <Route path="/chat/:chatId" element={<ChatView />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
