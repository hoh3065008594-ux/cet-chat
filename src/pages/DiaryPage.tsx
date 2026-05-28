import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Trash2, Calendar, Plus } from 'lucide-react'
import { useDictionary } from '../hooks/useDictionary'
import { getSettings } from '../services/settings'
import type { DiaryEntry, DiaryComment } from '../services/db'
import { getDiaryEntry, getEntriesByDate, saveDiaryEntry, deleteDiaryEntry, getAllDiaryEntries, getPersona, getAllPersonas } from '../services/db'
import { DEFAULT_PERSONA, buildPersonaPrompt } from '../types/persona'
import type { Persona } from '../types/persona'
import WordTooltip from '../components/WordTooltip'
import Avatar from '../components/Avatar'

const MOODS = [
  { emoji: '😊', key: 'happy', label: '开心' },
  { emoji: '😌', key: 'calm', label: '平静' },
  { emoji: '🥰', key: 'love', label: '幸福' },
  { emoji: '😢', key: 'sad', label: '难过' },
  { emoji: '😤', key: 'angry', label: '生气' },
  { emoji: '😴', key: 'tired', label: '疲惫' },
  { emoji: '🎉', key: 'excited', label: '兴奋' },
  { emoji: '📚', key: 'study', label: '学习' },
  { emoji: '💪', key: 'motivated', label: '加油' },
  { emoji: '🙏', key: 'grateful', label: '感恩' },
  { emoji: '🌧️', key: 'rainy', label: '阴雨' },
  { emoji: '☀️', key: 'sunny', label: '晴天' },
  { emoji: '❤️', key: 'loved', label: '被爱' },
  { emoji: '✨', key: 'inspired', label: '灵感' },
  { emoji: '💭', key: 'thoughtful', label: '思考' },
  { emoji: '🎵', key: 'music', label: '音乐' },
]

const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function todayStr() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
function fmtDate(s: string) { const [y,m,d]=s.split('-'); return `${y}年${Number(m)}月${Number(d)}日` }
function fmtShort(s: string) { const [,m,d]=s.split('-'); return `${Number(m)}/${Number(d)}` }
function uid(): string { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}` }

export default function DiaryPage() {
  const today = todayStr()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState(today)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [comments, setComments] = useState<DiaryComment[]>([])
  const [showPartnerPicker, setShowPartnerPicker] = useState(false)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({})
  const [showCalendar, setShowCalendar] = useState(false)
  const { selectedWord, position, lookUp, clearWord } = useDictionary()

  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const loadAll = useCallback(async () => {
    const all = await getAllDiaryEntries()
    all.sort((a, b) => b.date.localeCompare(a.date))
    setEntries(all)
    setEntryDates(new Set(all.map((e) => e.date)))
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const selectEntry = useCallback(async (id: string) => {
    setSelectedId(id)
    setEditing(false)
    setDirty(false)
    const entry = await getDiaryEntry(id)
    if (entry) {
      setSelectedDate(entry.date)
      setContent(entry.content)
      setMood(entry.mood || '')
      setComments(entry.comments || [])
    }
    setReplyText({})
    setReplyLoading({})
  }, [])

  const openDate = useCallback(async (date: string) => {
    setSelectedDate(date)
    const all = await getEntriesByDate(date)
    if (all.length > 0) {
      const latest = all.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b)
      await selectEntry(latest.id)
    } else {
      setSelectedId(null)
      setContent('')
      setMood('')
      setComments([])
      setEditing(false)
      setDirty(false)
    }
  }, [selectEntry])

  useEffect(() => { openDate(today) }, [today])

  const handlePublish = async () => {
    if (!content.trim()) return
    setSaving(true)
    const now2 = Date.now()
    const id = selectedId || uid()
    let publishComments = comments
    if (selectedId) {
      const existing = await getDiaryEntry(selectedId)
      if (existing) {
        publishComments = existing.comments || []
      }
    }
    await saveDiaryEntry({
      id,
      date: selectedDate,
      content,
      mood: mood || undefined,
      comments: publishComments,
      createdAt: now2,
      updatedAt: now2,
    })
    setEntryDates((prev) => new Set(prev).add(selectedDate))
    await loadAll()
    setSelectedId(id)
    setDirty(false)
    setEditing(false)
    setSaving(false)
  }

  const handleChange = (t: string) => { setEditing(true); setContent(t); setDirty(true) }
  const handleMood = (key: string) => { const m = mood === key ? '' : key; setMood(m); setDirty(true) }
  const handleDelete = async () => {
    if (!selectedId) return
    if (!confirm('删除这篇日记？')) return
    await deleteDiaryEntry(selectedId); setContent(''); setMood('')
    await loadAll()
  }

  const handleAiAssist = async () => {
    const { apiKey, apiEndpoint, model } = getSettings()
    if (!apiKey) { alert('请先设置 API Key'); return }
    if (!content.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch(`${apiEndpoint}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: '英语写作助手。修正语法，让表达更自然。保持原意和长度。仅返回修正后文本。' }, { role: 'user', content: `Correct this diary:\n\n${content}` }], temperature: 0.3, max_tokens: 800 }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      setContent(data.choices[0].message.content)
      setDirty(true)
    } catch (e) { alert(e instanceof Error ? e.message : 'AI 请求失败') }
    finally { setAiLoading(false) }
  }

  const handleComment = async (p: Persona) => {
    setShowPartnerPicker(false)
    const { apiKey, apiEndpoint, model } = getSettings()
    if (!apiKey) { alert('请先设置 API Key'); return }
    if (!content.trim()) return
    setCommentLoading(true)
    try {
      const personaPrompt = buildPersonaPrompt(p)
      const system = `${personaPrompt}\n\n你正在阅读用户的一篇英语日记。用英语给出一两句温暖的、鼓励性的评论，像朋友聊天一样。保持轻松自然。`
      const res = await fetch(`${apiEndpoint}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: `Here's my diary entry:\n\n${content}\n\nLeave a short, warm comment.` }], temperature: 0.8, max_tokens: 300 }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const text = data.choices[0].message.content
      const newComment: DiaryComment = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${p.id}`,
        partnerId: p.id,
        partnerName: p.name,
        avatar: p.avatar,
        content: text,
        createdAt: Date.now(),
      }
      const updated = [...comments, newComment]
      setComments(updated)
      const now2 = Date.now()
      const existing = selectedId ? await getDiaryEntry(selectedId) : undefined
      await saveDiaryEntry({ id: selectedId || uid(), date: selectedDate, content, mood, comments: updated, createdAt: existing?.createdAt || now2, updatedAt: now2 })
      await loadAll()
    } catch (e) { alert(e instanceof Error ? e.message : 'AI 请求失败') }
    finally { setCommentLoading(false) }
  }

  const handleReply = async (commentId: string) => {
    const text = replyText[commentId]?.trim()
    if (!text) return
    const target = comments.find((c) => c.id === commentId)
    if (!target) return
    const { apiKey, apiEndpoint, model } = getSettings()
    if (!apiKey) { alert('请先设置 API Key'); return }
    setReplyLoading((prev) => ({ ...prev, [commentId]: true }))
    try {
      let personaPrompt = ''
      if (target.partnerId !== '__default_alex__') {
        const p = await getPersona(target.partnerId)
        personaPrompt = p ? buildPersonaPrompt(p) : buildPersonaPrompt(DEFAULT_PERSONA)
      }
      const system = `${personaPrompt}\n\n用户回复了你对ta日记的评论。用你的语气自然地回应。保持简短，像朋友聊天。`
      const res = await fetch(`${apiEndpoint}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: `My diary was about: ${content.slice(0, 500)}\n\nYou commented: ${target.content}\n\nMy reply to you: ${text}\n\nRespond naturally.` }], temperature: 0.8, max_tokens: 300 }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const response = data.choices[0].message.content
      const updated = comments.map((c) => c.id === commentId ? { ...c, reply: response } : c)
      setComments(updated)
      setReplyText((prev) => { const n = { ...prev }; delete n[commentId]; return n })
      const now2 = Date.now()
      const existing = selectedId ? await getDiaryEntry(selectedId) : undefined
      await saveDiaryEntry({ id: selectedId || uid(), date: selectedDate, content, mood, comments: updated, createdAt: existing?.createdAt || now2, updatedAt: now2 })
      await loadAll()
    } catch (e) { alert(e instanceof Error ? e.message : 'AI 请求失败') }
    finally { setReplyLoading((prev) => ({ ...prev, [commentId]: false })) }
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const hasContent = content.trim().length > 0
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const currentMood = MOODS.find((m) => m.key === mood)

  return (
    <div className="h-full flex flex-col bg-[#f1f4f7]">
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between shrink-0 bg-white" style={{ borderBottom: '1px solid #dee3e9' }}>
        <h2 className="text-lg font-bold tracking-[-0.18px] text-[#0a1317]">英语日记</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCalendar(!showCalendar)} className="p-2 rounded-[16px] transition-colors text-[#0064e0]" style={{ backgroundColor: showCalendar ? '#f1f4f7' : 'transparent' }}>
            <Calendar size={18} />
          </button>
          <button
            onClick={() => { setSelectedDate(today); setSelectedId(null); setContent(''); setMood(''); setComments([]); setDirty(false); setEditing(true) }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-[100px] text-sm font-bold tracking-[-0.14px] transition-colors text-white"
            style={{ backgroundColor: '#000000' }}
          >
            <Plus size={15} />写日记
          </button>
        </div>
      </div>

      {/* Calendar popup */}
      {showCalendar && (
        <div className="shrink-0 px-4 py-3 bg-white" style={{ borderBottom: '1px solid #dee3e9' }}>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => viewMonth===0?(setViewYear(viewYear-1),setViewMonth(11)):setViewMonth(viewMonth-1)} className="p-1 rounded-lg"><ChevronLeft size={16} className="text-[#8595a4]" /></button>
            <button onClick={()=>{setViewYear(now.getFullYear());setViewMonth(now.getMonth())}} className="text-sm font-bold tracking-[-0.14px] text-[#0a1317]">
              {viewYear}年 {MONTHS[viewMonth]}
            </button>
            <button onClick={() => viewMonth===11?(setViewYear(viewYear+1),setViewMonth(0)):setViewMonth(viewMonth+1)} className="p-1 rounded-lg"><ChevronRight size={16} className="text-[#8595a4]" /></button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d=><div key={d} className="text-center text-xs py-0.5 text-[#8595a4]">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day,i)=>{
              if (day===null) return <div key={`ec${i}`} />
              const ds=`${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const isSel=ds===selectedDate, isTD=ds===today, has=entryDates.has(ds)
              return <button key={ds} onClick={()=>{openDate(ds);setShowCalendar(false)}}
                className="text-xs py-1.5 rounded-lg font-bold transition-colors relative"
                style={{backgroundColor:isSel?'#0a1317':isTD?'#f1f4f7':'transparent',color:isSel?'#fff':isTD?'#0064e0':'#1c1e21'}}>
                {day}{has&&<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{backgroundColor:isSel?'#fff':'#0064e0'}}/>}
              </button>
            })}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Timeline sidebar */}
        <div className="lg:w-80 shrink-0 overflow-y-auto bg-white" style={{ borderRight: '1px solid #dee3e9' }}>
          <div className="p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-2 text-[#5d6c7b]">时间线</h3>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[40px] mb-2">📝</p>
                <p className="text-sm text-[#8595a4]">还没有日记</p>
                <p className="text-xs mt-1 text-[#8595a4]">点击右上角开始写吧</p>
              </div>
            ) : (
              <Timeline entries={entries} selectedId={selectedId} onSelect={selectEntry} />
            )}
          </div>
        </div>

        {/* Detail / Editor */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Date + mood bar */}
          <div className="px-5 py-3 flex items-center justify-between shrink-0 bg-white" style={{ borderBottom: '1px solid #dee3e9' }}>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold tracking-[-0.14px] text-[#0a1317]">
                {selectedDate===today?'今天':fmtDate(selectedDate)}
              </span>
              {currentMood && <span className="text-lg">{currentMood.emoji}</span>}
              {dirty && <span className="text-xs text-[#0064e0]">未发布</span>}
              {saving && <span className="text-xs animate-pulse text-[#8595a4]">发布中...</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8595a4]">{wordCount} 词</span>
              {(editing || dirty) && hasContent && (
                <button onClick={handlePublish} disabled={saving} className="text-xs font-bold px-3 py-1 rounded-[100px] transition-colors disabled:opacity-50 text-white" style={{backgroundColor:'#000000'}}>{saving ? '发布中...' : '发布'}</button>
              )}
              {!editing && !dirty && hasContent && (
                <button onClick={() => setEditing(true)} className="text-xs font-bold px-3 py-1 rounded-[100px] transition-colors" style={{backgroundColor:'#f1f4f7',color:'#0064e0'}}>编辑</button>
              )}
              <div className="relative">
                <button onClick={() => setShowPartnerPicker(!showPartnerPicker)} disabled={commentLoading||!hasContent} className="flex items-center gap-1 px-2.5 py-1 rounded-[100px] text-xs font-bold disabled:opacity-40 transition-colors"
                  style={{backgroundColor:'#f1f4f7',color:'#0064e0'}}><Sparkles size={12}/>{commentLoading?'评论中':'伙伴评论'}</button>
                {showPartnerPicker && <PartnerPicker onSelect={handleComment} onClose={() => setShowPartnerPicker(false)} />}
              </div>
              <button onClick={handleAiAssist} disabled={aiLoading||!hasContent} className="flex items-center gap-1 px-2.5 py-1 rounded-[100px] text-xs font-bold disabled:opacity-40 transition-colors"
                style={{backgroundColor:'#fef9e7',color:'#b7950b'}}><Sparkles size={12}/>{aiLoading?'润色中':'AI 纠错'}</button>
              {hasContent && <button onClick={handleDelete} className="p-1 rounded-lg text-[#8595a4]"><Trash2 size={15}/></button>}
            </div>
          </div>

          {/* Mood selector */}
          <div className="px-4 py-2 flex gap-1.5 overflow-x-auto shrink-0 bg-white" style={{ borderBottom: '1px solid #dee3e9' }}>
            {MOODS.map((m) => (
              <button key={m.key} onClick={() => handleMood(m.key)}
                className="shrink-0 text-lg px-1.5 py-0.5 rounded-xl transition-all"
                style={{ backgroundColor: mood === m.key ? '#f1f4f7' : 'transparent', filter: mood && mood !== m.key ? 'grayscale(0.5) opacity(0.5)' : 'none' }}
                title={m.label}>{m.emoji}</button>
            ))}
          </div>

          {/* Content area */}
          {editing || !hasContent ? (
            <textarea
              value={content} onChange={(e) => handleChange(e.target.value)}
              placeholder={`${fmtDate(selectedDate)} 用英语记录今天...`}
              className="flex-1 p-5 resize-none focus:outline-none text-base leading-relaxed bg-[#f1f4f7] text-[#0a1317]"
              style={{ fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif" }}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="max-w-2xl">
                {content.split('\n').map((line, li) => (
                  <p key={li} className="text-base leading-relaxed text-[#1c1e21]" style={{ marginTop: li > 0 ? 8 : 0 }}>
                    {line.split(/([a-zA-Z]+)/).map((part, i) =>
                      /^[a-zA-Z]{3,}$/.test(part) ? (
                        <span key={i} className="cursor-pointer underline decoration-dotted underline-offset-2"
                          style={{ color: '#0064e0', textDecorationColor: '#0064e0' }}
                          onClick={(e) => lookUp(part, e)}>{part}</span>
                      ) : (<span key={i}>{part}</span>)
                    )}
                  </p>
                ))}
                {content.trim() && (
                  <div className="mt-6 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid #dee3e9' }}>
                    <span className="text-xs text-[#8595a4]">{fmtDate(selectedDate)}</span>
                    {currentMood && <span className="text-sm">{currentMood.emoji} {currentMood.label}</span>}
                    <span className="text-xs text-[#8595a4]">{wordCount} 词</span>
                  </div>
                )}
                {comments.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="p-4 rounded-[16px]" style={{ backgroundColor: '#f1f4f7' }}>
                        <p className="text-xs font-bold mb-1 text-[#0064e0]">
                          {c.partnerName || '伙伴'} 说
                        </p>
                        <p className="text-sm leading-relaxed text-[#1c1e21]">
                          {c.content.split('\n').map((line, li) => (
                            <span key={li}>{li > 0 && <br />}{line}</span>
                          ))}
                        </p>
                        {c.reply ? (
                          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #dee3e9' }}>
                            <div className="p-3 rounded-xl bg-[#ffffff]">
                              <p className="text-xs font-bold mb-1 text-[#0064e0]">{c.partnerName || '伙伴'} 回应</p>
                              <p className="text-sm leading-relaxed text-[#1c1e21]">{c.reply}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3" style={{ borderTop: '1px solid #dee3e9' }}>
                            <div className="flex items-center gap-2">
                              <input
                                value={replyText[c.id] || ''}
                                onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                placeholder={`回复${c.partnerName || '伙伴'}...`}
                                className="flex-1 text-xs px-3 py-1.5 rounded-xl focus:outline-none bg-white text-[#1c1e21]"
                                onKeyDown={(e) => e.key === 'Enter' && handleReply(c.id)}
                              />
                              <button
                                onClick={() => handleReply(c.id)}
                                disabled={!replyText[c.id]?.trim() || replyLoading[c.id]}
                                className="text-xs font-bold px-3 py-1.5 rounded-[100px] disabled:opacity-40 transition-colors text-white"
                                style={{ backgroundColor: '#000000' }}
                              >
                                {replyLoading[c.id] ? '...' : '发送'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedWord && <WordTooltip word={selectedWord} position={position} onClose={clearWord} />}
    </div>
  )
}

function Timeline({ entries, selectedId, onSelect }: {
  entries: DiaryEntry[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const byYear = new Map<string, DiaryEntry[]>()
  for (const e of entries) {
    const y = e.date.split('-')[0]
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y)!.push(e)
  }
  const years = [...byYear.keys()].sort((a, b) => Number(b) - Number(a))

  return (
    <div className="space-y-4">
      {years.map((year) => (
        <div key={year}>
          <p className="text-xs font-bold uppercase tracking-widest px-3 mb-1.5 text-[#5d6c7b]">
            {year}
          </p>
          <div className="space-y-1">
            {byYear.get(year)!.map((entry) => {
              const entryMood = MOODS.find((m) => m.key === entry.mood)
              const preview = entry.content.replace(/\n/g, ' ').slice(0, 60)
              const isActive = entry.id === selectedId
              const time = new Date(entry.createdAt)
              const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`
              return (
                <button
                  key={entry.id}
                  onClick={() => onSelect(entry.id)}
                  className="w-full text-left px-3 py-2.5 rounded-[16px] transition-all"
                  style={{
                    backgroundColor: isActive ? '#f1f4f7' : 'transparent',
                    border: isActive ? '2px solid #0a1317' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-[-0.14px] text-[#0a1317]">{fmtShort(entry.date)} {timeStr}</span>
                    {entryMood && <span className="text-sm">{entryMood.emoji}</span>}
                  </div>
                  <p className="text-xs mt-0.5 truncate text-[#8595a4]">{preview || '(空内容)'}</p>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function PartnerPicker({ onSelect, onClose }: { onSelect: (p: Persona) => void; onClose: () => void }) {
  const [list, setList] = useState<Persona[]>([])
  useEffect(() => { getAllPersonas().then((l) => setList([DEFAULT_PERSONA, ...l])) }, [])
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-[16px] shadow-lg border py-1 min-w-[160px]" style={{ borderColor: '#dee3e9', boxShadow: 'rgba(20, 22, 26, 0.3) 0px 1px 4px 0px' }}>
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="w-full text-left px-4 py-2.5 text-sm tracking-[-0.14px] flex items-center gap-2.5 hover:bg-[#f1f4f7] text-[#0a1317]"
          >
            <Avatar src={p.avatar} name={p.name} size={24} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </>
  )
}
