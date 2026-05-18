import { useState, useEffect } from 'react'
import { getVocabList } from '../services/dictionary'
import type { VocabWord } from '../services/dictionary'
import { getSettings, saveSettings } from '../services/settings'
import WordTooltip from '../components/WordTooltip'
import { Search } from 'lucide-react'

const c = {
  accent: 'oklch(45% 0.21 310)',
  accentLight: 'oklch(92% 0.03 310)',
  accentWash: 'oklch(97% 0.015 310)',
  bg: 'oklch(98.5% 0.002 310)',
  white: 'oklch(100% 0 0)',
  text: 'oklch(12% 0.002 310)',
  textSecondary: 'oklch(55% 0.003 310)',
  border: 'oklch(88% 0.003 310)',
  borderDashed: 'oklch(80% 0.003 310)',
  surfaceHover: 'oklch(96.5% 0.002 310)',
}

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
    <div className="h-full flex flex-col" style={{ backgroundColor: c.bg }}>
      <div className="px-6 py-4 space-y-3" style={{ backgroundColor: c.white, borderBottom: `1px solid ${c.border}` }}>
        <h2 className="text-[17px] font-bold" style={{ color: c.text }}>词库预览</h2>
        <div className="flex items-center gap-3">
          <div className="flex rounded-[14px] overflow-hidden text-sm" style={{ border: `1px solid ${c.borderDashed}` }}>
            {(['cet4', 'cet6'] as const).map((lv) => (
              <button
                key={lv}
                onClick={() => handleLevelChange(lv)}
                style={{
                  backgroundColor: level === lv ? c.accent : c.white,
                  color: level === lv ? c.white : c.text,
                }}
                className="px-4 py-1.5 text-[13px] font-medium transition-colors"
              >
                {{ cet4: 'CET-4', cet6: 'CET-6' }[lv]}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: c.textSecondary }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索单词..."
              className="w-full rounded-[14px] pl-9 pr-3 py-1.5 text-[13px] focus:outline-none"
              style={{ backgroundColor: c.surfaceHover, color: c.text }}
            />
          </div>
          <span className="text-[12px]" style={{ color: c.textSecondary }}>{filtered.length} 词</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
          {filtered.map((w) => (
            <button
              key={`${w.level}-${w.word}`}
              onClick={(e) => handleWordClick(w, e)}
              className="word-card text-left p-2.5 rounded-[14px] transition-all cursor-pointer"
              style={{ border: `1px solid ${c.border}`, backgroundColor: c.white }}
            >
              <span className="font-semibold text-[13px]" style={{ color: c.text }}>{w.word}</span>
              <span className="text-[11px] block mt-0.5 truncate" style={{ color: c.textSecondary }}>{w.meaning}</span>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-center mt-10 text-[13px]" style={{ color: c.textSecondary }}>没有找到匹配的单词</p>
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
