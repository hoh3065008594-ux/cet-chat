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
    <div className="h-full flex flex-col bg-[#f1f4f7]">
      <div className="px-4 py-3 space-y-2.5 bg-white" style={{ borderBottom: '1px solid #dee3e9' }}>
        <h2 className="text-lg font-bold tracking-[-0.18px] text-[#0a1317]">词库预览</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-[100px] overflow-hidden text-sm shrink-0" style={{ border: '1px solid #dee3e9' }}>
            {(['cet4', 'cet6'] as const).map((lv) => (
              <button
                key={lv}
                onClick={() => handleLevelChange(lv)}
                style={{
                  backgroundColor: level === lv ? '#0a1317' : '#ffffff',
                  color: level === lv ? '#ffffff' : '#1c1e21',
                }}
                className="px-4 py-1.5 text-sm font-bold tracking-[-0.14px] transition-colors"
              >
                {{ cet4: 'CET-4', cet6: 'CET-6' }[lv]}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8595a4]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索单词..."
              className="w-full rounded-[100px] pl-9 pr-4 h-[40px] text-sm tracking-[-0.14px] focus:outline-none bg-[#f1f4f7] text-[#1c1e21] placeholder-[#8595a4]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {filtered.map((w) => (
            <button
              key={`${w.level}-${w.word}`}
              onClick={(e) => handleWordClick(w, e)}
              className="word-card text-left p-2.5 rounded-[16px] transition-all cursor-pointer bg-white"
              style={{ border: '1px solid #dee3e9' }}
            >
              <span className="font-bold text-sm tracking-[-0.14px] text-[#0a1317]">{w.word}</span>
              <span className="text-xs block mt-0.5 truncate text-[#8595a4]">{w.meaning}</span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center mt-10 text-sm text-[#8595a4]">没有找到匹配的单词</p>
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
