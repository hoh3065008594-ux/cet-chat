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

  const levelLabel = { cet4: '四级', cet6: '六级' }[word.level] || word.level

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 px-4 py-3 min-w-[200px] max-w-[280px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 300),
          top: position.y + 12,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: 'rgba(20, 22, 26, 0.3) 0px 1px 4px 0px',
          border: '1px solid #dee3e9',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-[-0.18px] text-[#0a1317]">{word.word}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-[100px] font-bold tracking-[-0.14px]"
              style={{ backgroundColor: '#f1f4f7', color: '#444950' }}>
              {levelLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8595a4] text-sm leading-none shrink-0 hover:text-[#0a1317]"
          >
            ✕
          </button>
        </div>
        {word.phonetic && (
          <p className="text-sm mt-0.5 text-[#8595a4]">{word.phonetic}</p>
        )}
        <p className="text-sm text-[#1c1e21] mt-2 leading-relaxed tracking-[-0.14px]">{word.meaning}</p>
      </div>
    </>
  )
}
