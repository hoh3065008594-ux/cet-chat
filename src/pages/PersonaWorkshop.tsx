import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Upload, Loader2, Sparkles, Check } from 'lucide-react'
import { createPersona } from '../services/db'
import { getSettings } from '../services/settings'
import { analyzeChatForPersona } from '../services/ai'
import type { PersonaAnalysis } from '../services/ai'
import type { Persona } from '../types/persona'

const accent = 'oklch(45% 0.21 310)'

function uid(): string {
  try { return crypto.randomUUID() }
  catch {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> (c === 'x' ? 0 : 3)
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
  }
}

interface FormData {
  name: string
  role: string
  mbti: string
  zodiac: string
  traitsInput: string
  // From analysis
  chatFile: File | null
  chatPreview: string
  analyzing: boolean
  analysis: PersonaAnalysis | null
  analysisError: string
}

const mbtiTypes = ['', 'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']
const zodiacs = ['', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座']

const inputClass = "w-full rounded-[14px] px-4 py-2.5 text-[14px] focus:outline-none bg-[#f0f0f0] placeholder-[#8e8e8e]"

export default function PersonaWorkshop() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<FormData>({
    name: '',
    role: '朋友',
    mbti: '',
    zodiac: '',
    traitsInput: '',
    chatFile: null,
    chatPreview: '',
    analyzing: false,
    analysis: null,
    analysisError: '',
  })

  const update = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }))

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    update({ chatFile: file, chatPreview: text.slice(0, 2000) })
  }

  const handleAnalyze = async () => {
    if (!form.chatPreview.trim()) return
    update({ analyzing: true, analysisError: '' })
    try {
      const { apiKey, apiEndpoint, model } = getSettings()
      if (!apiKey) throw new Error('请先在设置中配置 API Key')
      const result = await analyzeChatForPersona(form.chatPreview, apiKey, apiEndpoint, model)
      update({ analysis: result, analyzing: false })
    } catch (e) {
      update({ analysisError: e instanceof Error ? e.message : '分析失败', analyzing: false })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const traits = form.analysis
      ? form.analysis.traits
      : form.traitsInput.split(/[,，、\s]+/).filter(Boolean)

    const persona: Persona = {
      id: uid(),
      name: form.name.trim(),
      slug: form.name.trim().toLowerCase().replace(/\s+/g, '-'),
      avatar: '',
      profile: {
        role: form.analysis?.role || form.role,
        mbti: form.mbti,
        zodiac: form.zodiac,
        traits,
      },
      speech: {
        catchphrases: form.analysis?.catchphrases || [],
        tone: form.analysis?.tone || '',
        messageStyle: form.analysis?.messageStyle || '混合',
        emojiUsage: form.analysis?.emojiUsage || '偶尔',
        rawAnalysis: form.analysis?.rawAnalysis || '',
      },
      topics: {
        like: form.analysis?.topicsLike || [],
        avoid: form.analysis?.topicsAvoid || [],
      },
      sourceType: form.chatFile ? 'imported' : 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    await createPersona(persona)
    navigate('/')
  }

  const canNext = (() => {
    if (step === 0) return form.name.trim().length > 0
    return true // other steps optional
  })()

  return (
    <div className="h-full overflow-y-auto bg-[#fafafa]">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step === 0 ? navigate('/') : setStep(step - 1)} className="p-1">
            <ArrowLeft size={20} style={{ color: '#8e8e8e' }} />
          </button>
          <h2 className="text-[17px] font-bold text-black">创建新的人格</h2>
          <div className="flex-1" />
          <span className="text-[12px]" style={{ color: '#8e8e8e' }}>步骤 {step + 1}/3</span>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{ backgroundColor: i <= step ? accent : '#e8e8e8' }}
            />
          ))}
        </div>

        {/* Step 0: Nickname */}
        {step === 0 && (
          <div className="space-y-4">
            <label className="block text-[14px] font-semibold text-black">
              给这个 AI 伙伴取个昵称 <span style={{ color: accent }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="比如：小明、Luna、毒舌老师..."
              className={inputClass}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && canNext && setStep(1)}
            />
            <p className="text-[12px]" style={{ color: '#8e8e8e' }}>
              这就是你在对话中会看到的伙伴名字
            </p>
          </div>
        )}

        {/* Step 1: Personality tags */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-[14px] font-semibold text-black">性格画像（全部可选，跳过也行）</p>

            <div>
              <label className="block text-[13px] font-medium text-black mb-1">角色定位</label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => update({ role: e.target.value })}
                placeholder="比如：朋友、毒舌闺蜜、温柔学长、知心姐姐..."
                className={inputClass}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[13px] font-medium text-black mb-1">MBTI</label>
                <select
                  value={form.mbti}
                  onChange={(e) => update({ mbti: e.target.value })}
                  className={inputClass}
                >
                  {mbtiTypes.map((t) => (
                    <option key={t} value={t}>{t || '不选'}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[13px] font-medium text-black mb-1">星座</label>
                <select
                  value={form.zodiac}
                  onChange={(e) => update({ zodiac: e.target.value })}
                  className={inputClass}
                >
                  {zodiacs.map((z) => (
                    <option key={z} value={z}>{z || '不选'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-black mb-1">性格标签</label>
              <input
                type="text"
                value={form.traitsInput}
                onChange={(e) => update({ traitsInput: e.target.value })}
                placeholder="幽默, 毒舌, 话多, 温柔（逗号分隔）"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Step 2: Chat import + AI analysis */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-[14px] font-semibold text-black">导入聊天记录（可选）</p>
            <p className="text-[12px]" style={{ color: '#8e8e8e' }}>
              上传微信/QQ导出的 .txt 聊天记录，AI 将自动分析说话风格。跳过则仅凭你填的标签生成人格。
            </p>

            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv"
              className="hidden"
              onChange={handleFile}
            />

            {!form.chatFile ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-8 rounded-[18px] border border-dashed transition-colors"
                style={{ borderColor: '#dbdbdb' }}
              >
                <Upload size={24} style={{ color: '#8e8e8e' }} />
                <span className="text-[13px] font-medium" style={{ color: accent }}>点击上传聊天记录文件</span>
                <span className="text-[11px]" style={{ color: '#8e8e8e' }}>支持 .txt 格式，建议使用私聊记录</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[13px] font-medium text-black">
                  <Check size={16} style={{ color: '#22c55e' }} />
                  {form.chatFile.name} ({form.chatPreview.length.toLocaleString()} 字符)
                  <button
                    onClick={() => update({ chatFile: null, chatPreview: '', analysis: null })}
                    className="text-[12px] ml-auto" style={{ color: '#dd2a7b' }}
                  >
                    移除
                  </button>
                </div>

                {!form.analysis && (
                  <button
                    onClick={handleAnalyze}
                    disabled={form.analyzing}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[14px] text-white text-[14px] font-semibold disabled:opacity-50 transition-colors"
                    style={{ backgroundColor: accent }}
                  >
                    {form.analyzing ? (
                      <><Loader2 size={16} className="animate-spin" /> 分析中...</>
                    ) : (
                      <><Sparkles size={16} /> AI 分析聊天记录</>
                    )}
                  </button>
                )}

                {form.analysisError && (
                  <p className="text-[13px]" style={{ color: '#dd2a7b' }}>{form.analysisError}</p>
                )}

                {form.analysis && (
                  <div className="bg-white rounded-[18px] p-4 space-y-3" style={{ border: '1px solid #e8e8e8' }}>
                    <p className="text-[13px] font-semibold text-black flex items-center gap-1.5">
                      <Sparkles size={14} style={{ color: accent }} />
                      AI 分析结果
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                      <div>
                        <span style={{ color: '#8e8e8e' }}>角色定位：</span>
                        <input
                          value={form.analysis.role}
                          onChange={(e) => update({ analysis: { ...form.analysis!, role: e.target.value } })}
                          className="text-[12px] bg-transparent font-medium w-20"
                        />
                      </div>
                      <div>
                        <span style={{ color: '#8e8e8e' }}>语气：</span>
                        <input
                          value={form.analysis.tone}
                          onChange={(e) => update({ analysis: { ...form.analysis!, tone: e.target.value } })}
                          className="text-[12px] bg-transparent font-medium w-24"
                        />
                      </div>
                      <div>
                        <span style={{ color: '#8e8e8e' }}>消息风格：</span>
                        <select
                          value={form.analysis.messageStyle}
                          onChange={(e) => update({ analysis: { ...form.analysis!, messageStyle: e.target.value } })}
                          className="text-[12px] bg-transparent font-medium"
                        >
                          {['短句', '长句', '混合'].map((s) => (<option key={s} value={s}>{s}</option>))}
                        </select>
                      </div>
                      <div>
                        <span style={{ color: '#8e8e8e' }}>Emoji使用：</span>
                        <select
                          value={form.analysis.emojiUsage}
                          onChange={(e) => update({ analysis: { ...form.analysis!, emojiUsage: e.target.value } })}
                          className="text-[12px] bg-transparent font-medium"
                        >
                          {['频繁', '偶尔', '不用'].map((s) => (<option key={s} value={s}>{s}</option>))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] mb-1" style={{ color: '#8e8e8e' }}>性格标签：</p>
                      <div className="flex flex-wrap gap-1">
                        {form.analysis.traits.map((t, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#f0e6f6', color: accent }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] mb-1" style={{ color: '#8e8e8e' }}>口头禅：</p>
                      <div className="flex flex-wrap gap-1">
                        {form.analysis.catchphrases.map((c, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#f0f0f0', color: '#000' }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] mb-1" style={{ color: '#8e8e8e' }}>说话风格摘要：</p>
                      <p className="text-[12px] text-black leading-relaxed bg-[#fafafa] rounded-[10px] p-2.5">
                        {form.analysis.rawAnalysis}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!form.chatFile && (
              <button
                onClick={() => handleSave()}
                className="w-full py-2.5 rounded-[14px] text-[13px] text-center transition-colors"
                style={{ color: '#8e8e8e' }}
              >
                跳过，仅凭标签创建
              </button>
            )}
          </div>
        )}

        {/* Bottom navigation */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-[14px] text-[14px] font-medium transition-colors bg-[#f0f0f0]"
            >
              <ArrowLeft size={16} />
              上一步
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-[14px] text-[14px] font-semibold text-white transition-colors ml-auto disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              下一步
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-[14px] text-[14px] font-semibold text-white transition-colors ml-auto disabled:opacity-50"
              style={{ backgroundColor: accent }}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> 保存中...</>
              ) : (
                <>完成创建</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
