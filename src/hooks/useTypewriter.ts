import { useState, useEffect, useRef } from 'react'

export function useTypewriter(text: string, speed = 20) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const idxRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    // Speed 0 = instant, no animation
    if (speed <= 0) {
      setDisplayed(text)
      setDone(true)
      return
    }

    setDisplayed('')
    setDone(false)
    idxRef.current = 0

    timerRef.current = setInterval(() => {
      const chunk = Math.min(2 + Math.floor(Math.random() * 3), text.length - idxRef.current)
      idxRef.current += chunk
      setDisplayed(text.slice(0, idxRef.current))
      if (idxRef.current >= text.length) {
        clearInterval(timerRef.current)
        setDone(true)
      }
    }, speed)

    return () => clearInterval(timerRef.current)
  }, [text, speed])

  return { displayed, done }
}
