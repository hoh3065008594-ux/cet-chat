import { useState, useCallback } from 'react'
import { lookupWord } from '../services/dictionary'
import type { VocabWord } from '../services/dictionary'

export function useDictionary() {
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  const lookUp = useCallback(async (word: string, e?: React.MouseEvent) => {
    setLoading(true)
    if (e) {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    const result = await lookupWord(word)
    setSelectedWord(result)
    setLoading(false)
  }, [])

  const clearWord = useCallback(() => {
    setSelectedWord(null)
  }, [])

  return { selectedWord, loading, position, lookUp, clearWord }
}
