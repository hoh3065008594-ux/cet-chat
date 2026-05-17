import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Trash2, Calendar, Plus } from 'lucide-react'
import { useDictionary } from '../hooks/useDictionary'
import { getSettings } from '../services/settings'
import type { DiaryEntry } from '../services/db'
import { getDiaryEntry, saveDiaryEntry, deleteDiaryEntry, getDiaryDates, getAllDiaryEntries, getPersona, getAllPersonas } from '../services/db'
import { DEFAULT_PERSONA, buildPersonaPrompt } from '../types/persona'
import type { Persona } from '../types/persona'
import WordTooltip from '../components/WordTooltip'
import Avatar from '../components/Avatar'

// ── Morandi-inspired palette ──
const colors = {
  bg: '#f5f0eb',
  card: '#ffffff',
  accent: '#b8956a',
  accentLight: '#f0ebe3',
  text: '#4a3f35',
  textSecondary: '#9b8e82',
  border: '#e8e0d5',
  shadow: '0 2px 12px rgba(74,63,53,0.06)',
}

// ── Mood options ──
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

export default function DiaryPage() {
  const today = todayStr()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [entryDates, setEntryDates] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState(today)
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [commentPartnerId, setCommentPartnerId] = useState('')
  const [commentPartnerName, setCommentPartnerName] = useState('')
  const [reply, setReply] = useState('')
  const [showPartnerPicker, setShowPartnerPicker] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()
  const { selectedWord, position, lookUp, clearWord } = useDictionary()

  // Calendar state
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

  const selectEntry = useCallback(async (date: string) => {
    setSelectedDate(date)
    setEditing(false)
    const entry = await getDiaryEntry(date)
    setContent(entry?.content || '')
    setMood(entry?.mood || '')
    setComment(entry?.comment || '')
    setCommentPartnerId(entry?.commentPartnerId || '')
    setCommentPartnerName(entry?.commentPartnerName || '')
    setReply(entry?.reply || '')
  }, [])

  // Auto-select today on mount
  useEffect(() => { selectEntry(today) }, [selectEntry, today])

  const autoSave = useCallback((text: string, m: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true)
      const now2 = Date.now()
      const existing = await getDiaryEntry(selectedDate)
      await saveDiaryEntry({ date: selectedDate, content: text, mood: m || undefined, createdAt: existing?.createdAt || now2, updatedAt: now2 })
      setEntryDates((prev) => new Set(prev).add(selectedDate))
      await loadAll()
      setSaving(false)
    }, 600)
  }, [selectedDate, loadAll])

  const handleChange = (t: string) => { setContent(t); autoSave(t, mood) }
  const handleMood = (key: string) => { const m = mood === key ? '' : key; setMood(m); autoSave(content, m) }
  const handleDelete = async () => {
    if (!confirm('删除这篇日记？')) return
    await deleteDiaryEntry(selectedDate); setContent(''); setMood('')
    setEntryDates((prev) => { const n = new Set(prev); n.delete(selectedDate); return n })
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
      autoSave(data.choices[0].message.content, mood)
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
      setComment(text)
      setCommentPartnerId(p.id)
      setCommentPartnerName(p.name)
      const now2 = Date.now()
      const existing = await getDiaryEntry(selectedDate)
      await saveDiaryEntry({ date: selectedDate, content, mood, comment: text, commentPartnerId: p.id, commentPartnerName: p.name, createdAt: existing?.createdAt || now2, updatedAt: now2 })
      await loadAll()
    } catch (e) { alert(e instanceof Error ? e.message : 'AI 请求失败') }
    finally { setCommentLoading(false) }
  }

  const handleReply = async () => {
    if (!replyText.trim() || !commentPartnerId) return
    const { apiKey, apiEndpoint, model } = getSettings()
    if (!apiKey) { alert('请先设置 API Key'); return }
    setReplyLoading(true)
    try {
      let personaPrompt = ''
      if (commentPartnerId !== '__default_alex__') {
        const p = await getPersona(commentPartnerId)
        personaPrompt = p ? buildPersonaPrompt(p) : buildPersonaPrompt(DEFAULT_PERSONA)
      }
      const system = `${personaPrompt}\n\n用户回复了你对ta日记的评论。用你的语气自然地回应。保持简短，像朋友聊天。`
      const res = await fetch(`${apiEndpoint}/chat/completions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: `My diary was about: ${content.slice(0, 500)}\n\nYou commented: ${comment}\n\nMy reply to you: ${replyText}\n\nRespond naturally.` }], temperature: 0.8, max_tokens: 300 }),
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const response = data.choices[0].message.content
      setReply(response)
      setReplyText('')
      const now2 = Date.now()
      const existing = await getDiaryEntry(selectedDate)
      await saveDiaryEntry({ date: selectedDate, content, mood, comment, commentPartnerId, commentPartnerName, reply: response, createdAt: existing?.createdAt || now2, updatedAt: now2 })
      await loadAll()
    } catch (e) { alert(e instanceof Error ? e.message : 'AI 请求失败') }
    finally { setReplyLoading(false) }
  }

  // Calendar cells
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const currentEntry = entries.find((e) => e.date === selectedDate)
  const hasContent = content.trim().length > 0
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const currentMood = MOODS.find((m) => m.key === mood)

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: colors.bg }}>
      {/* ── Header ── */}
      <div className="px-5 py-3 flex items-center justify-between shrink-0" style={{ backgroundColor: colors.card, borderBottom: `1px solid ${colors.border}` }}>
        <h2 className="text-[17px] font-bold tracking-wide" style={{ color: colors.text }}>英语日记</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCalendar(!showCalendar)} className="p-2 rounded-xl transition-colors" style={{ color: colors.accent, backgroundColor: showCalendar ? colors.accentLight : 'transparent' }}>
            <Calendar size={18} />
          </button>
          <button
            onClick={() => { setSelectedDate(today); setEditing(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors"
            style={{ backgroundColor: colors.accent, color: '#fff' }}
          >
            <Plus size={15} />写日记
          </button>
        </div>
      </div>

      {/* ── Calendar popup ── */}
      {showCalendar && (
        <div className="shrink-0 px-4 py-3" style={{ backgroundColor: colors.card, borderBottom: `1px solid ${colors.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => viewMonth===0?(setViewYear(viewYear-1),setViewMonth(11)):setViewMonth(viewMonth-1)} className="p-1 rounded-lg hover:bg-[#f0ebe3]"><ChevronLeft size={16} style={{color:colors.textSecondary}} /></button>
            <button onClick={()=>{setViewYear(now.getFullYear());setViewMonth(now.getMonth())}} className="text-[14px] font-semibold" style={{color:colors.text}}>
              {viewYear}年 {MONTHS[viewMonth]}
            </button>
            <button onClick={() => viewMonth===11?(setViewYear(viewYear+1),setViewMonth(0)):setViewMonth(viewMonth+1)} className="p-1 rounded-lg hover:bg-[#f0ebe3]"><ChevronRight size={16} style={{color:colors.textSecondary}} /></button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map(d=><div key={d} className="text-center text-[10px] py-0.5" style={{color:colors.textSecondary}}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day,i)=>{
              if (day===null) return <div key={`ec${i}`} />
              const ds=`${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const isSel=ds===selectedDate, isTD=ds===today, has=entryDates.has(ds)
              return <button key={ds} onClick={()=>{setSelectedDate(ds);setEditing(false);selectEntry(ds);setShowCalendar(false)}}
                className="text-[11px] py-1.5 rounded-lg font-medium transition-colors relative"
                style={{backgroundColor:isSel?colors.accent:isTD?colors.accentLight:'transparent',color:isSel?'#fff':isTD?colors.accent:colors.text}}>
                {day}{has&&<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{backgroundColor:isSel?'#fff':colors.accent}}/>}
              </button>
            })}
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* ── Timeline sidebar ── */}
        <div className="lg:w-80 shrink-0 overflow-y-auto" style={{ borderRight: `1px solid ${colors.border}`, backgroundColor: colors.card }}>
          <div className="p-3">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider mb-2 px-2" style={{ color: colors.textSecondary }}>时间线</h3>
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[40px] mb-2">📝</p>
                <p className="text-[13px]" style={{ color: colors.textSecondary }}>还没有日记</p>
                <p className="text-[12px] mt-1" style={{ color: colors.textSecondary }}>点击右上角开始写吧</p>
              </div>
            ) : (
              <Timeline entries={entries} selectedDate={selectedDate} onSelect={selectEntry} />
            )}
          </div>
        </div>

        {/* ── Detail / Editor ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Date + mood bar */}
          <div className="px-5 py-3 flex items-center justify-between shrink-0" style={{ backgroundColor: colors.card, borderBottom: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-semibold" style={{ color: colors.text }}>
                {selectedDate===today?'今天':fmtDate(selectedDate)}
              </span>
              {currentMood && <span className="text-lg">{currentMood.emoji}</span>}
              {saving && <span className="text-[11px] animate-pulse" style={{color:colors.textSecondary}}>保存中...</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{color:colors.textSecondary}}>{wordCount} 词</span>
              {!editing && hasContent && (
                <button onClick={() => setEditing(true)} className="text-[12px] font-medium px-3 py-1 rounded-full transition-colors" style={{backgroundColor:colors.accentLight,color:colors.accent}}>编辑</button>
              )}
              <div className="relative">
                <button onClick={() => setShowPartnerPicker(!showPartnerPicker)} disabled={commentLoading||!hasContent} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium disabled:opacity-40 transition-colors"
                  style={{backgroundColor:colors.accentLight,color:colors.accent}}><Sparkles size={12}/>{commentLoading?'评论中':'伙伴评论'}</button>
                {showPartnerPicker && <PartnerPicker onSelect={handleComment} onClose={() => setShowPartnerPicker(false)} />}
              </div>
              <button onClick={handleAiAssist} disabled={aiLoading||!hasContent} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium disabled:opacity-40 transition-colors"
                style={{backgroundColor:'#fef9e7',color:'#b7950b'}}><Sparkles size={12}/>{aiLoading?'润色中':'AI 纠错'}</button>
              {hasContent && <button onClick={handleDelete} className="p-1 rounded-lg" style={{color:colors.textSecondary}}><Trash2 size={15}/></button>}
            </div>
          </div>

          {/* Mood selector */}
          <div className="px-4 py-2 flex gap-1.5 overflow-x-auto shrink-0" style={{ backgroundColor: colors.card, borderBottom: `1px solid ${colors.border}` }}>
            {MOODS.map((m) => (
              <button key={m.key} onClick={() => handleMood(m.key)}
                className="shrink-0 text-lg px-1.5 py-0.5 rounded-xl transition-all"
                style={{ backgroundColor: mood === m.key ? colors.accentLight : 'transparent', filter: mood && mood !== m.key ? 'grayscale(0.5) opacity(0.5)' : 'none' }}
                title={m.label}>{m.emoji}</button>
            ))}
          </div>

          {/* Content area */}
          {editing || !hasContent ? (
            <textarea
              value={content} onChange={(e) => handleChange(e.target.value)}
              placeholder={`${fmtDate(selectedDate)} 用英语记录今天...`}
              className="flex-1 p-5 resize-none focus:outline-none text-[15px] leading-relaxed"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            />
          ) : (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="max-w-2xl">
                {content.split('\n').map((line, li) => (
                  <p key={li} className="text-[15px] leading-relaxed" style={{ color: colors.text, marginTop: li > 0 ? 8 : 0 }}>
                    {line.split(/([a-zA-Z]+)/).map((part, i) =>
                      /^[a-zA-Z]{3,}$/.test(part) ? (
                        <span key={i} className="cursor-pointer underline decoration-dotted underline-offset-2"
                          style={{ color: colors.accent, textDecorationColor: colors.accent }}
                          onClick={(e) => lookUp(part, e)}>{part}</span>
                      ) : (<span key={i}>{part}</span>)
                    )}
                  </p>
                ))}
                {content.trim() && (
                  <div className="mt-6 pt-4 flex items-center gap-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                    <span className="text-[11px]" style={{ color: colors.textSecondary }}>{fmtDate(selectedDate)}</span>
                    {currentMood && <span className="text-sm">{currentMood.emoji} {currentMood.label}</span>}
                    <span className="text-[11px]" style={{ color: colors.textSecondary }}>{wordCount} 词</span>
                  </div>
                )}
                {comment && (
                  <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: colors.accentLight }}>
                    <p className="text-[11px] font-semibold mb-1" style={{ color: colors.accent }}>
                      {commentPartnerName || getSettings().partnerName} 说
                    </p>
                    <p className="text-[14px] leading-relaxed" style={{ color: colors.text }}>
                      {comment.split('\n').map((line, li) => (
                        <span key={li}>{li > 0 && <br />}{line}</span>
                      ))}
                    </p>
                    {reply ? (
                      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                        <div className="p-3 rounded-xl" style={{ backgroundColor: 'oklch(98% 0.002 310)' }}>
                          <p className="text-[11px] font-semibold mb-1" style={{ color: colors.accent }}>{commentPartnerName || '伙伴'} 回应</p>
                          <p className="text-[13px] leading-relaxed" style={{ color: colors.text }}>{reply}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                        <div className="flex items-center gap-2">
                          <input
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`回复${commentPartnerName || '伙伴'}...`}
                            className="flex-1 text-[12px] px-3 py-1.5 rounded-xl focus:outline-none"
                            style={{ backgroundColor: 'oklch(98% 0.002 310)', color: colors.text }}
                            onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                          />
                          <button
                            onClick={handleReply}
                            disabled={!replyText.trim() || replyLoading}
                            className="text-[11px] font-medium px-3 py-1.5 rounded-xl disabled:opacity-40 transition-colors"
                            style={{ backgroundColor: colors.accent, color: '#fff' }}
                          >
                            {replyLoading ? '...' : '发送'}
                          </button>
                        </div>
                      </div>
                    )}
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

function Timeline({ entries, selectedDate, onSelect }: {
  entries: DiaryEntry[]
  selectedDate: string
  onSelect: (date: string) => void
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
          <p className="text-[11px] font-semibold uppercase tracking-widest px-3 mb-1.5" style={{ color: colors.textSecondary }}>
            {year}
          </p>
          <div className="space-y-1">
            {byYear.get(year)!.map((entry) => {
              const entryMood = MOODS.find((m) => m.key === entry.mood)
              const preview = entry.content.replace(/\n/g, ' ').slice(0, 60)
              const isActive = entry.date === selectedDate
              return (
                <button
                  key={entry.date}
                  onClick={() => onSelect(entry.date)}
                  className="w-full text-left px-3 py-2.5 rounded-2xl transition-all"
                  style={{
                    backgroundColor: isActive ? colors.accentLight : 'transparent',
                    boxShadow: isActive ? colors.shadow : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold" style={{ color: colors.text }}>{fmtShort(entry.date)}</span>
                    {entryMood && <span className="text-sm">{entryMood.emoji}</span>}
                  </div>
                  <p className="text-[12px] mt-0.5 truncate" style={{ color: colors.textSecondary }}>{preview || '(空内容)'}</p>
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
      <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-2xl shadow-lg border py-1 min-w-[160px]" style={{ borderColor: colors.border }}>
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="w-full text-left px-4 py-2.5 text-[13px] text-black hover:bg-[#f0ebe3] flex items-center gap-2.5"
          >
            <Avatar src={p.avatar} name={p.name} size={24} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </>
  )
}
