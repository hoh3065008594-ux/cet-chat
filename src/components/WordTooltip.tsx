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

  const levelLabel = { basic: '基础', cet4: '四级', cet6: '六级' }[word.level] || word.level

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 px-4 py-3 min-w-[200px] max-w-[280px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 300),
          top: position.y + 12,
          backgroundColor: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          border: '1px solid #e8e8e8',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-black">{word.word}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: '#f0e6f6', color: '#8128af' }}>
              {levelLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8e8e8e] text-sm leading-none shrink-0 hover:text-black"
          >
            ✕
          </button>
        </div>
        {word.phonetic && (
          <p className="text-[13px] mt-0.5" style={{ color: '#8e8e8e' }}>{word.phonetic}</p>
        )}
        <p className="text-[14px] text-black mt-2 leading-relaxed">{word.meaning}</p>
      </div>
    </>
  )
}
