import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import VocabularyPage from './pages/VocabularyPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import DiaryPage from './pages/DiaryPage'
import PersonaSelectPage from './pages/PersonaSelectPage'
import PersonaWorkshop from './pages/PersonaWorkshop'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-dvh bg-[#f1f4f7]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="lg:hidden px-4 py-2 border-b border-[#dee3e9] bg-white flex items-center gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#5d6c7b] hover:text-[#0a1317] p-2"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-sm tracking-[-0.14px] text-[#0a1317]">CET Chat</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<PersonaSelectPage />} />
            <Route path="/personas/new" element={<PersonaWorkshop />} />
            <Route path="/chat/:chatId" element={<ChatView />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
