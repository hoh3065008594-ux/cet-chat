interface Props {
  src?: string
  name: string
  size?: number
}

export default function Avatar({ src, name, size = 36 }: Props) {
  if (src) {
    return (
      <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
    )
  }

  const letter = name.charAt(0).toUpperCase()

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 font-bold"
      style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: '#f1f4f7', color: '#444950' }}
    >
      {letter}
    </div>
  )
}
