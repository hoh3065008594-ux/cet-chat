import { useState, useEffect } from 'react'
import { getAllChats, getMessages } from '../services/db'
import { getWordCount, lookupWord } from '../services/dictionary'
import type { VocabWord } from '../services/dictionary'
import { getSettings } from '../services/settings'
import { MessageSquare, Hash, BookOpen, Loader2 } from 'lucide-react'
import WordTooltip from '../components/WordTooltip'

const accent = '#8128af'

export default function StatsPage() {
  const [totalChats, setTotalChats] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)
  const [vocabSize, setVocabSize] = useState(0)
  const [usedWords, setUsedWords] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const load = async () => {
      try {
        const chats = await getAllChats()
        setTotalChats(chats.length)

        let msgCount = 0
        const allWords = new Set<string>()
        for (const c of chats) {
          const msgs = await getMessages(c.id)
          msgCount += msgs.length
          for (const m of msgs) {
            for (const w of m.usedVocab) allWords.add(w)
          }
        }
        setTotalMessages(msgCount)
        setUsedWords([...allWords].sort())

        const level = getSettings().vocabLevel
        setVocabSize(await getWordCount(level))
      } catch (e) {
        console.error('Stats load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const coverage = vocabSize > 0 ? ((usedWords.length / vocabSize) * 100).toFixed(1) : '0'

  const handleWordClick = async (word: string, e: React.MouseEvent) => {
    const result = await lookupWord(word)
    setSelectedWord(result || { word, phonetic: '', meaning: '该词不在考纲词库中', level: 'cet4' })
    setTooltipPos({ x: e.clientX, y: e.clientY })
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#fafafa]">
        <Loader2 size={22} className="animate-spin" style={{ color: accent }} />
      </div>
    )
  }

  const statItems = [
    { icon: MessageSquare, value: totalChats, label: '对话总数', color: accent },
    { icon: Hash, value: totalMessages, label: '消息总数', color: '#dd2a7b' },
    { icon: BookOpen, value: usedWords.length, label: '已用考纲词', color: '#22c55e' },
  ]

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#fafafa]">
      <h2 className="text-[17px] font-bold text-black mb-5">学习统计</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {statItems.map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="bg-white rounded-[18px] p-5" style={{ border: '1px solid #e8e8e8' }}>
            <Icon size={22} style={{ color, marginBottom: 8 }} />
            <p className="text-[24px] font-bold text-black">{value}</p>
            <p className="text-[13px]" style={{ color: '#8e8e8e' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[18px] p-5 mb-6" style={{ border: '1px solid #e8e8e8' }}>
        <h3 className="text-[14px] font-semibold text-black mb-3">词库覆盖率</h3>
        <div className="w-full h-2.5 rounded-full bg-[#f0f0f0] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(Number(coverage), 100)}%`, backgroundColor: accent }} />
        </div>
        <p className="text-[12px] mt-2" style={{ color: '#8e8e8e' }}>
          {usedWords.length} / {vocabSize} 词 ({coverage}%)
        </p>
      </div>

      <div className="bg-white rounded-[18px] p-5" style={{ border: '1px solid #e8e8e8' }}>
        <h3 className="text-[14px] font-semibold text-black mb-3">已用考纲词列表</h3>
        {usedWords.length === 0 ? (
          <p className="text-[13px]" style={{ color: '#8e8e8e' }}>暂无数据，开始对话后这里会显示用过的词汇</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {usedWords.map((w) => (
              <button
                key={w}
                onClick={(e) => handleWordClick(w, e)}
                className="px-2.5 py-1 rounded-[10px] text-[12px] font-medium transition-colors"
                style={{ backgroundColor: '#f0e6f6', color: accent }}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedWord && (
        <WordTooltip word={selectedWord} position={tooltipPos} onClose={() => setSelectedWord(null)} />
      )}
    </div>
  )
}
