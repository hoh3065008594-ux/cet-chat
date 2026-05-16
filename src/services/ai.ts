import { getAvailableWords, lookupWord } from './dictionary'
import { getApiConfig, getSettings } from './settings'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function buildSystemPrompt(
  partnerName: string,
  level: 'cet4' | 'cet6',
  vocabWords: string[]
): string {
  const levelName = level === 'cet4' ? '四级' : '六级'
  const wordSample = vocabWords.slice(0, 800).join(', ')
  return `你是一个友好的英语聊天伙伴，名字是${partnerName}。

你的对话规则：
1. 用日常、自然的英语与用户聊天
2. 尽可能只使用以下${levelName}词库中的词汇，避免超纲词
3. 如果遇到必须用超纲词表达的概念，用词库中的简单词汇解释
4. 每次新对话开始时，随机选一个日常话题主动打招呼
5. 保持轻松、友好的语气，像朋友聊天一样
6. 回复末尾另起一行，用"📖 Used CET words:"列出你回复中用到的考纲词汇（仅列出词库中存在的词）

${levelName}词库参考（共${vocabWords.length}词，以下是部分词汇）：
${wordSample}

用户选择了${levelName}词库，共${vocabWords.length}个词汇。请严格遵守以上规则。`
}

export async function generateGreeting(
  partnerName: string,
  level: 'cet4' | 'cet6'
): Promise<string> {
  const vocabWords = await getAvailableWords(level)
  const { apiKey, apiEndpoint, model } = getApiConfig()

  if (!apiKey) throw new Error('API Key 未设置')

  const systemPrompt = buildSystemPrompt(partnerName, level, vocabWords)

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

  if (!apiKey) throw new Error('API Key 未设置')

  const systemPrompt = buildSystemPrompt(partnerName, level, vocabWords)
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
