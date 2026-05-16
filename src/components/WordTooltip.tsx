import { useEffect } from 'react'
import type { VocabWord } from '../services/dictionary'

interface Props {
  word: VocabWord
  position: { x: number; y: number }
  onClose: () => void
}

export default function WordTooltip({ word, position, onClose }: Props) {
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[220px] max-w-[300px]"
        style={{ left: Math.min(position.x, window.innerWidth - 320), top: position.y + 12 }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-lg font-bold text-gray-900">{word.word}</span>
            <span className="text-xs text-gray-400 ml-2 uppercase">{word.level}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 text-sm leading-none shrink-0"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">{word.phonetic}</p>
        <p className="text-sm text-gray-700 mt-2">{word.meaning}</p>
      </div>
    </>
  )
}
