import { useState, useEffect } from 'react'
import { getAllChats, getMessages } from '../services/db'
import { getWordCount } from '../services/dictionary'
import { getSettings } from '../services/settings'
import { MessageSquare, Hash, BookOpen } from 'lucide-react'

export default function StatsPage() {
  const [totalChats, setTotalChats] = useState(0)
  const [totalMessages, setTotalMessages] = useState(0)
  const [vocabSize, setVocabSize] = useState(0)
  const [usedWords, setUsedWords] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const chats = await getAllChats()
      setTotalChats(chats.length)

      let msgCount = 0
      const allWords = new Set<string>()
      for (const c of chats) {
        const msgs = await getMessages(c.id)
        msgCount += msgs.length
        for (const m of msgs) {
          for (const w of m.usedVocab) {
            allWords.add(w)
          }
        }
      }
      setTotalMessages(msgCount)
      setUsedWords([...allWords].sort())

      const level = getSettings().vocabLevel
      setVocabSize(await getWordCount(level))
    }
    load()
  }, [])

  const coverage = vocabSize > 0 ? ((usedWords.length / vocabSize) * 100).toFixed(1) : '0'

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">学习统计</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <MessageSquare size={24} className="text-indigo-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalChats}</p>
          <p className="text-sm text-gray-500">对话总数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <Hash size={24} className="text-indigo-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalMessages}</p>
          <p className="text-sm text-gray-500">消息总数</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <BookOpen size={24} className="text-indigo-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{usedWords.length}</p>
          <p className="text-sm text-gray-500">已用考纲词</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">词库覆盖率</h3>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(Number(coverage), 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {usedWords.length} / {vocabSize} 词 ({coverage}%)
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-medium text-gray-700 mb-3">已用考纲词列表</h3>
        {usedWords.length === 0 ? (
          <p className="text-sm text-gray-400">暂无数据，开始对话后这里会显示用过的词汇</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {usedWords.map((w) => (
              <span
                key={w}
                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs"
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
