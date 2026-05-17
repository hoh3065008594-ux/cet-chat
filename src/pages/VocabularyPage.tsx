import { useState, useEffect } from 'react'
import { getVocabList } from '../services/dictionary'
import type { VocabWord } from '../services/dictionary'
import { getSettings, saveSettings } from '../services/settings'
import WordTooltip from '../components/WordTooltip'
import { Search } from 'lucide-react'

const accent = '#8128af'

export default function VocabularyPage() {
  const [level, setLevel] = useState<'basic' | 'cet4' | 'cet6'>(getSettings().vocabLevel)
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

  const handleLevelChange = (lv: 'basic' | 'cet4' | 'cet6') => {
    setLevel(lv)
    saveSettings({ vocabLevel: lv })
  }

  const handleWordClick = (word: VocabWord, e: React.MouseEvent) => {
    setSelectedWord(word)
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  const tabClass = (active: boolean) =>
    `px-4 py-1.5 text-[13px] font-medium transition-colors ${
      active ? 'text-white' : 'text-black hover:bg-[#f0f0f0]'
    }`

  return (
    <div className="h-full flex flex-col bg-[#fafafa]">
      <div className="px-6 py-4 bg-white space-y-3" style={{ borderBottom: '1px solid #e8e8e8' }}>
        <h2 className="text-[17px] font-bold text-black">词库预览</h2>
        <div className="flex items-center gap-3">
          <div className="flex rounded-[14px] overflow-hidden text-sm" style={{ border: '1px solid #dbdbdb' }}>
            {(['basic', 'cet4', 'cet6'] as const).map((lv) => (
              <button
                key={lv}
                onClick={() => handleLevelChange(lv)}
                style={level === lv ? { backgroundColor: accent } : { backgroundColor: '#fff' }}
                className={tabClass(level === lv)}
              >
                {{ basic: '日常', cet4: 'CET-4', cet6: 'CET-6' }[lv]}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8e8e8e' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索单词..."
              className="w-full rounded-[14px] pl-9 pr-3 py-1.5 text-[13px] focus:outline-none bg-[#f0f0f0] placeholder-[#8e8e8e]"
            />
          </div>
          <span className="text-[12px]" style={{ color: '#8e8e8e' }}>{filtered.length} 词</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
          {filtered.map((w) => (
            <button
              key={`${w.level}-${w.word}`}
              onClick={(e) => handleWordClick(w, e)}
              className="text-left p-2.5 rounded-[14px] bg-white transition-colors"
              style={{ border: '1px solid #e8e8e8' }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = accent; (e.target as HTMLElement).style.backgroundColor = '#faf5fd' }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = '#e8e8e8'; (e.target as HTMLElement).style.backgroundColor = '#fff' }}
            >
              <span className="font-semibold text-black text-[13px]">{w.word}</span>
              <span className="text-[11px] block mt-0.5 truncate" style={{ color: '#8e8e8e' }}>{w.meaning}</span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center mt-10 text-[13px]" style={{ color: '#8e8e8e' }}>没有找到匹配的单词</p>
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
