import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import VocabularyPage from './pages/VocabularyPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/" element={<ChatView />} />
          <Route path="/chat/:chatId" element={<ChatView />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
