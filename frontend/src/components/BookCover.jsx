const GRADIENTS = [
  'from-indigo-500 via-indigo-600 to-violet-700',
  'from-emerald-500 via-teal-600 to-cyan-700',
  'from-rose-500 via-pink-600 to-fuchsia-700',
  'from-amber-500 via-orange-500 to-red-600',
  'from-sky-500 via-blue-600 to-indigo-700',
  'from-violet-500 via-purple-600 to-indigo-700',
  'from-slate-600 via-slate-700 to-slate-900',
  'from-teal-500 via-emerald-600 to-green-700',
]

function hashTitle(title) {
  let h = 0
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

export default function BookCover({ title = '', author = '', className = '' }) {
  const gradient = GRADIENTS[hashTitle(title) % GRADIENTS.length]
  const initial = title.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div className={`bg-gradient-to-br ${gradient} relative overflow-hidden flex flex-col justify-between ${className}`}>
      {/* Spine line */}
      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-black/20" />

      {/* Decorative large letter */}
      <span className="absolute -right-3 -bottom-4 text-[7rem] font-black text-white/10 leading-none select-none">
        {initial}
      </span>

      {/* Decorative top border */}
      <div className="absolute top-3 left-5 right-3 h-px bg-white/20" />

      {/* Content */}
      <div className="relative px-5 pt-6 pb-4 flex flex-col h-full justify-between">
        <p className="text-white font-bold text-sm leading-snug line-clamp-4 drop-shadow-sm">
          {title}
        </p>
        <div className="absolute bottom-3 left-5 right-3">
          <div className="h-px bg-white/20 mb-2" />
          <p className="text-white/70 text-xs truncate">{author}</p>
        </div>
      </div>
    </div>
  )
}
