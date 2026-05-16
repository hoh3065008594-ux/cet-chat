interface Props {
  src?: string
  name: string
  size?: number
}

const colors = [
  'bg-indigo-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-sky-500', 'bg-violet-500', 'bg-rose-500', 'bg-teal-500',
]

function hashColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function Avatar({ src, name, size = 36 }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  const letter = name.charAt(0).toUpperCase()

  return (
    <div
      className={`${hashColor(name)} rounded-full flex items-center justify-center text-white font-bold shrink-0`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {letter}
    </div>
  )
}
