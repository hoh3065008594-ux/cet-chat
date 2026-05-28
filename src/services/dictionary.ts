export interface VocabWord {
  word: string
  phonetic: string
  meaning: string
  level: 'cet4' | 'cet6'
}

const vocabCache = new Map<string, VocabWord[]>()

async function loadVocab(level: 'cet4' | 'cet6'): Promise<VocabWord[]> {
  if (vocabCache.has(level)) return vocabCache.get(level)!
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}vocab-data/${level}.json`)
    const data: VocabWord[] = await res.json()
    vocabCache.set(level, data)
    return data
  } catch {
    console.error(`Failed to load ${level} vocabulary`)
    return []
  }
}

function buildIndex(words: VocabWord[]): Map<string, VocabWord> {
  const index = new Map<string, VocabWord>()
  for (const w of words) {
    index.set(w.word.toLowerCase(), w)
  }
  return index
}

const indexCache = new Map<string, Map<string, VocabWord>>()

async function getIndex(level: 'cet4' | 'cet6'): Promise<Map<string, VocabWord>> {
  if (indexCache.has(level)) return indexCache.get(level)!
  const words = await loadVocab(level)
  const idx = buildIndex(words)
  indexCache.set(level, idx)
  return idx
}

export async function lookupWord(word: string, level?: 'cet4' | 'cet6'): Promise<VocabWord | null> {
  const key = word.toLowerCase().replace(/[^a-z-]/g, '')
  if (!key) return null

  const levels: ('cet4' | 'cet6')[] = level ? [level] : ['cet4', 'cet6']
  for (const lv of levels) {
    const idx = await getIndex(lv)
    const found = idx.get(key)
    if (found) return found
  }
  return null
}

export async function getVocabList(level: 'cet4' | 'cet6'): Promise<VocabWord[]> {
  return loadVocab(level)
}

export async function getWordCount(level: 'cet4' | 'cet6'): Promise<number> {
  const words = await loadVocab(level)
  return words.length
}

export async function getAvailableWords(level: 'cet4' | 'cet6'): Promise<string[]> {
  const idx = await getIndex(level)
  return Array.from(idx.keys())
}
