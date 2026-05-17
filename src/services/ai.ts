import { getAvailableWords, lookupWord } from './dictionary'
import { getApiConfig, getSettings } from './settings'
import { getPersona } from './db'
import { type Persona, DEFAULT_PERSONA, buildPersonaPrompt } from '../types/persona'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function buildSystemPrompt(
  partnerName: string,
  level: 'cet4' | 'cet6',
  vocabWords: string[],
  persona?: Persona
): string {
  const levelLabel = { cet4: '四级', cet6: '六级' }[level]
  const wordSample = vocabWords.slice(0, 800).join(', ')
  const p = persona || DEFAULT_PERSONA
  const personaPart = buildPersonaPrompt(p)

  return `${personaPart}

你的英语对话规则：
1. 用日常、自然的英语与用户聊天，但始终保持上述人格特征
2. 尽可能只使用以下${levelLabel}词库中的词汇，避免超纲词
3. 如果遇到必须用超纲词表达的概念，用词库中的简单词汇解释
4. 每次新对话开始时，随机选一个日常话题主动打招呼
5. 回复末尾另起一行，用"📖 Used CET words:"列出你回复中用到的考纲词汇（仅列出词库中存在的词）

${levelLabel}词库参考（共${vocabWords.length}词，以下是部分词汇）：
${wordSample}

用户选择了${levelLabel}词库，共${vocabWords.length}个词汇。请严格遵守以上规则。`
}

async function getActivePersona(): Promise<Persona> {
  const { activePersonaId } = getSettings()
  if (activePersonaId && activePersonaId !== '__default_alex__') {
    const persona = await getPersona(activePersonaId)
    if (persona) return persona
  }
  return DEFAULT_PERSONA
}

export async function generateGreeting(
  partnerName: string,
  level: 'cet4' | 'cet6'
): Promise<string> {
  const vocabWords = await getAvailableWords(level)
  const { apiKey, apiEndpoint, model } = getApiConfig()
  const persona = await getActivePersona()

  if (!apiKey) throw new Error('API Key 未设置')

  const systemPrompt = buildSystemPrompt(partnerName, level, vocabWords, persona)

  const res = await fetch(`${apiEndpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请开始一个新对话。随机选一个日常话题主动和我打招呼。' },
      ],
      temperature: 0.8,
      max_tokens: 300,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API 请求失败 (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

export async function sendChatMessage(
  messages: ChatMessage[],
  level: 'cet4' | 'cet6'
): Promise<{ content: string; usedVocab: string[] }> {
  const vocabWords = await getAvailableWords(level)
  const { apiKey, apiEndpoint, model } = getApiConfig()
  const { partnerName } = getSettings()
  const persona = await getActivePersona()

  if (!apiKey) throw new Error('API Key 未设置')

  const systemPrompt = buildSystemPrompt(partnerName, level, vocabWords, persona)
  const allMessages = [{ role: 'system' as const, content: systemPrompt }, ...messages]

  const res = await fetch(`${apiEndpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: allMessages,
      temperature: 0.8,
      max_tokens: 500,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API 请求失败 (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content: string = data.choices[0].message.content

  // Extract vocabulary from the response's "📖 Used CET words:" section
  const usedVocab = await extractUsedVocab(content, level)

  return { content, usedVocab }
}

async function extractUsedVocab(
  content: string,
  level: 'cet4' | 'cet6'
): Promise<string[]> {
  // Remove the vocab summary line and extract actual words
  const cleanContent = content.replace(/\n?📖 Used CET words:.*$/is, '')
  const words = cleanContent.match(/[a-zA-Z]+/g) || []
  const uniqueWords = [...new Set(words.map((w) => w.toLowerCase()))]

  const result: string[] = []
  for (const w of uniqueWords) {
    if (w.length < 3) continue
    const found = await lookupWord(w, level)
    if (found) result.push(found.word)
  }
  return result
}

export interface PersonaAnalysis {
  traits: string[]
  tone: string
  catchphrases: string[]
  messageStyle: string
  emojiUsage: string
  topicsLike: string[]
  topicsAvoid: string[]
  role: string
  rawAnalysis: string
}

export async function analyzeChatForPersona(
  chatText: string,
  apiKey: string,
  apiEndpoint: string,
  model: string
): Promise<PersonaAnalysis> {
  const prompt = `分析以下聊天记录，提取说话人的人格特征和说话风格。

聊天记录：
"""
${chatText.slice(0, 8000)}
"""

请以JSON格式返回分析结果（只返回JSON，不要其他内容）：
{
  "traits": ["性格标签1", "性格标签2", ...],
  "tone": "语气描述（一句话）",
  "catchphrases": ["口头禅1", "口头禅2", ...],
  "messageStyle": "短句/长句/混合",
  "emojiUsage": "频繁/偶尔/不用",
  "topicsLike": ["喜欢的话题1", ...],
  "topicsAvoid": ["回避的话题1", ...],
  "role": "最适合的角色定位（如：朋友/老师/笔友/面试官）",
  "rawAnalysis": "一段200字以内的说话风格总结，用第二人称'你'来写，像这样：你说起话来总是……你的语气……你喜欢用……"
}`

  const res = await fetch(`${apiEndpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是一个专业的人格分析师。只返回JSON，不要任何解释。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`分析请求失败 (${res.status}): ${err}`)
  }

  const data = await res.json()
  const content = data.choices[0].message.content
  // Strip markdown code fences if present
  const json = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(json) as PersonaAnalysis
}
