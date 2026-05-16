import { useState, useEffect } from 'react'
import { getVocabList } from '../services/dictionary'
import type { VocabWord } from '../services/dictionary'
import { getSettings, saveSettings } from '../services/settings'
import WordTooltip from '../components/WordTooltip'
import { Search } from 'lucide-react'

export default function VocabularyPage() {
  const [level, setLevel] = useState<'cet4' | 'cet6'>(getSettings().vocabLevel)
  const [words, setWords] = useState<VocabWord[]>([])
  const [search, setSearch] = useState('')
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    getVocabList(level).then(setWords)
  }, [level])

  const filtered = words.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.meaning.includes(search)
  )

  const handleLevelChange = (lv: 'cet4' | 'cet6') => {
    setLevel(lv)
    saveSettings({ vocabLevel: lv })
  }

  const handleWordClick = (word: VocabWord, e: React.MouseEvent) => {
    setSelectedWord(word)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 bg-white space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">词库预览</h2>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button
              onClick={() => handleLevelChange('cet4')}
              className={`px-4 py-1.5 ${level === 'cet4' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              CET-4
            </button>
            <button
              onClick={() => handleLevelChange('cet6')}
              className={`px-4 py-1.5 ${level === 'cet6' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              CET-6
            </button>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索单词..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <span className="text-xs text-gray-500">{filtered.length} 词</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map((w) => (
            <button
              key={`${w.level}-${w.word}`}
              onClick={(e) => handleWordClick(w, e)}
              className="text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
            >
              <span className="font-medium text-gray-900 text-sm">{w.word}</span>
              <span className="text-xs text-gray-400 block mt-0.5 truncate">{w.meaning}</span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center text-gray-400 mt-10">没有找到匹配的单词</p>
        )}
      </div>

      {selectedWord && (
        <WordTooltip
          word={selectedWord}
          position={tooltipPos}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  )
}
