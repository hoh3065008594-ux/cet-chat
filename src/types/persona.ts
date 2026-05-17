export interface Persona {
  id: string
  name: string
  slug: string
  avatar: string
  profile: {
    role: string
    mbti: string
    zodiac: string
    traits: string[]
  }
  speech: {
    catchphrases: string[]
    tone: string
    messageStyle: string
    emojiUsage: string
    rawAnalysis: string
  }
  topics: {
    like: string[]
    avoid: string[]
  }
  sourceType: 'manual' | 'imported'
  createdAt: number
  updatedAt: number
}

export const DEFAULT_PERSONA_ID = '__default_alex__'

export const DEFAULT_PERSONA: Persona = {
  id: DEFAULT_PERSONA_ID,
  name: 'Alex',
  slug: 'alex',
  avatar: '',
  profile: {
    role: '朋友',
    mbti: 'ENFP',
    zodiac: '',
    traits: ['友好', '耐心', '幽默'],
  },
  speech: {
    catchphrases: ['absolutely!', 'let me think...'],
    tone: '轻松友好',
    messageStyle: '混合',
    emojiUsage: '偶尔',
    rawAnalysis: '',
  },
  topics: {
    like: ['日常生活', '旅行', '音乐', '电影', '美食'],
    avoid: [],
  },
  sourceType: 'manual',
  createdAt: 0,
  updatedAt: 0,
}

export function buildPersonaPrompt(p: Persona): string {
  const parts: string[] = []

  parts.push(`你现在扮演的角色是${p.name}。`)
  parts.push(`角色定位：${p.profile.role || '朋友'}。`)

  if (p.profile.traits.length > 0) {
    parts.push(`性格特征：${p.profile.traits.join('、')}。`)
  }

  if (p.speech.tone) {
    parts.push(`说话语气：${p.speech.tone}。`)
  }

  if (p.speech.catchphrases.length > 0) {
    parts.push(`口头禅：${p.speech.catchphrases.join('、')}。`)
  }

  if (p.speech.emojiUsage && p.speech.emojiUsage !== '不用') {
    parts.push(`emoji使用：${p.speech.emojiUsage === '频繁' ? '经常使用emoji' : '适度使用emoji'}。`)
  }

  if (p.topics.like.length > 0) {
    parts.push(`你擅长聊的话题：${p.topics.like.join('、')}。`)
  }

  if (p.topics.avoid.length > 0) {
    parts.push(`避免聊的话题：${p.topics.avoid.join('、')}。`)
  }

  if (p.speech.rawAnalysis) {
    parts.push(`\n以下是基于你真实聊天记录提取的说话风格，请严格遵循：\n${p.speech.rawAnalysis}`)
  }

  return parts.join('\n')
}
