import { useEffect, useState } from 'react'
// Background stickers: die-cut SVG art, one set per page, each animated.
// Coordinates use a 390x844 design canvas; the layer scales to any screen.
const INK = '#14110F'
const NOTE = 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'

const Reel = ({ cx }) => (
  <g className="sp s">
    <circle cx={cx} cy="14" r="7" fill="#444" stroke="#ddd" strokeWidth="2" />
    <path d={`M${cx} 8v12M${cx - 6} 14h12`} stroke="#ddd" strokeWidth="1.5" />
  </g>
)

export const ART = {
  guitar: (<>
    <rect x="-4" y="-66" width="8" height="46" fill="#7A4524" stroke={INK} strokeWidth="3" />
    <rect x="-7" y="-80" width="14" height="16" rx="3" fill={INK} />
    <circle cy="24" r="24" fill="#F28C38" stroke={INK} strokeWidth="3" />
    <circle cy="-4" r="16" fill="#F28C38" stroke={INK} strokeWidth="3" />
    <circle cy="14" r="8" fill={INK} />
  </>),
  vinyl: (<>
    <circle r="36" fill={INK} />
    <circle r="26" fill="none" stroke="#555" strokeWidth="2" />
    <circle r="12" fill="#FFD93D" stroke={INK} strokeWidth="2" />
    <circle r="2.5" fill="#F6ECD8" />
    <path d="M-28 -14A31 31 0 0 1 -14 -28" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
  </>),
  note: <path d={NOTE} transform="scale(3.2) translate(-12 -12)" fill="#6B4EFF" stroke={INK} strokeWidth="1" />,
  spark: <path d="M0 -20C3 -6 6 -3 20 0C6 3 3 6 0 20C-3 6 -6 3 -20 0C-6 -3 -3 -6 0 -20Z" fill="#FFD93D" stroke={INK} strokeWidth="2.5" />,
  piano: (<>
    <rect x="-36" y="-24" width="72" height="48" rx="5" fill="#F6ECD8" stroke={INK} strokeWidth="3" />
    <path d="M-18 -24V24M0 -24V24M18 -24V24" stroke={INK} strokeWidth="2" />
    <rect className="kp" x="-25" y="-24" width="14" height="28" fill={INK} />
    <rect className="kp" style={{ animationDelay: '.4s' }} x="-7" y="-24" width="14" height="28" fill={INK} />
    <rect className="kp" style={{ animationDelay: '.8s' }} x="11" y="-24" width="14" height="28" fill={INK} />
  </>),
  tape: (<>
    <rect x="-40" y="-26" width="80" height="52" rx="6" fill="#2A2A2A" stroke={INK} strokeWidth="3" />
    <rect x="-32" y="-19" width="64" height="26" rx="3" fill="#F6ECD8" />
    <rect x="-32" y="-8" width="64" height="7" fill="#2EC4B6" />
    <Reel cx={-14} /><Reel cx={14} />
  </>),
  phones: (<>
    <path d="M-30 6a30 30 0 0160 0" fill="none" stroke={INK} strokeWidth="6" />
    <rect x="-38" y="2" width="16" height="28" rx="7" fill="#6B4EFF" stroke={INK} strokeWidth="3" />
    <rect x="22" y="2" width="16" height="28" rx="7" fill="#6B4EFF" stroke={INK} strokeWidth="3" />
  </>),
  speaker: (<>
    <rect x="-28" y="-38" width="56" height="76" rx="8" fill="#2A2A2A" stroke={INK} strokeWidth="3" />
    <circle className="pls s" cy="-18" r="7" fill="#777" />
    <circle className="pls s" cy="12" r="16" fill="#444" stroke="#ddd" strokeWidth="2" />
  </>),
  drum: (<>
    <path d="M-34 0v34a34 11 0 0068 0V0z" fill="#E0393E" stroke={INK} strokeWidth="3" />
    <ellipse rx="34" ry="11" fill="#F6ECD8" stroke={INK} strokeWidth="3" />
    <path d="M-20 12l10 30M0 14v32M20 12l-10 30" stroke="#F6ECD8" strokeWidth="2" />
    <path className="hit" d="M-30 -40l22 28" stroke="#C8742B" strokeWidth="5" strokeLinecap="round" />
    <path className="hit" style={{ animationDelay: '.35s' }} d="M30 -40l-22 28" stroke="#C8742B" strokeWidth="5" strokeLinecap="round" />
  </>),
  mic: (<>
    <g transform="translate(0 -17)">
      <circle className="rg s" r="24" fill="none" stroke="#6B4EFF" strokeWidth="3" />
      <circle className="rg s" style={{ animationDelay: '.9s' }} r="24" fill="none" stroke="#6B4EFF" strokeWidth="3" />
    </g>
    <rect x="-12" y="-36" width="24" height="38" rx="12" fill="#C9C4B8" stroke={INK} strokeWidth="3" />
    <path d="M-6 -24h12M-6 -14h12" stroke={INK} strokeWidth="2" />
    <path d="M-22 -6a22 22 0 0044 0M0 16v22M-14 40h28" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
  </>),
  chain: (
    <g fill="none">
      <rect x="-34" y="-12" width="40" height="24" rx="12" stroke={INK} strokeWidth="12" />
      <rect x="-34" y="-12" width="40" height="24" rx="12" stroke="#6B4EFF" strokeWidth="5" />
      <rect x="-6" y="-12" width="40" height="24" rx="12" stroke={INK} strokeWidth="12" />
      <rect x="-6" y="-12" width="40" height="24" rx="12" stroke="#FFD93D" strokeWidth="5" />
    </g>
  ),
  sheet: (<>
    <rect x="-36" y="-26" width="72" height="52" rx="5" fill="#F6ECD8" stroke={INK} strokeWidth="3" />
    <path d="M-28 -12h56M-28 -4h56M-28 4h56M-28 12h56" stroke={INK} strokeWidth="1.5" />
    <g className="bob s"><circle cx="-12" cy="8" r="4" fill={INK} /><path d="M-8 8V-14" stroke={INK} strokeWidth="2" /></g>
    <g className="bob s" style={{ animationDelay: '-.7s' }}><circle cx="10" cy="0" r="4" fill={INK} /><path d="M14 0V-20" stroke={INK} strokeWidth="2" /></g>
  </>),
}

// art, x, y, scale, rotation, animation class (sp|fl|bob|wb|tw), duration in seconds
export const PLACEMENTS = {
  home: [
    { art: 'guitar', x: 352, y: 262, s: 0.75, r: 18, anim: 'fl', dur: 7 },
    { art: 'vinyl', x: 30, y: 505, s: 0.8, r: 0, anim: 'sp', dur: 6 },
    { art: 'note', x: 356, y: 742, s: 0.9, r: 10, anim: 'bob', dur: 3 },
    { art: 'spark', x: 210, y: 252, s: 0.6, r: 0, anim: 'tw', dur: 2.4 },
    { art: 'spark', x: 34, y: 742, s: 0.7, r: 0, anim: 'tw', dur: 3 },
  ],
  library: [
    { art: 'phones', x: 326, y: 48, s: 0.95, r: 10, anim: 'bob', dur: 3.2 },
    { art: 'tape', x: 344, y: 212, s: 0.7, r: 12, anim: 'wb', dur: 3.5 },
    { art: 'piano', x: 330, y: 730, s: 0.8, r: -8, anim: 'fl', dur: 7 },
    { art: 'note', x: 36, y: 735, s: 0.9, r: -10, anim: 'bob', dur: 2.8 },
    { art: 'spark', x: 200, y: 744, s: 0.7, r: 0, anim: 'tw', dur: 2.6 },
  ],
  playing: [
    { art: 'drum', x: 92, y: 772, s: 1, r: -8, anim: 'fl', dur: 6 },
    { art: 'vinyl', x: 196, y: 742, s: 0.9, r: 0, anim: 'sp', dur: 5 },
    { art: 'speaker', x: 300, y: 770, s: 0.95, r: 6, anim: 'fl', dur: 7 },
    { art: 'note', x: 350, y: 44, s: 0.8, r: 12, anim: 'bob', dur: 3 },
    { art: 'spark', x: 40, y: 60, s: 0.7, r: 0, anim: 'tw', dur: 2.5 },
  ],
  add: [
    { art: 'mic', x: 312, y: 655, s: 1, r: 10, anim: 'fl', dur: 7 },
    { art: 'chain', x: 84, y: 668, s: 1, r: -14, anim: 'wb', dur: 4 },
    { art: 'sheet', x: 200, y: 735, s: 0.95, r: 0, anim: 'fl', dur: 6 },
    { art: 'spark', x: 36, y: 590, s: 0.7, r: 0, anim: 'tw', dur: 2.8 },
    { art: 'note', x: 352, y: 585, s: 0.8, r: 12, anim: 'bob', dur: 3 },
  ],
  settings: [
    { art: 'tape', x: 344, y: 212, s: 0.7, r: 12, anim: 'wb', dur: 3.5 },
    { art: 'phones', x: 326, y: 48, s: 0.95, r: 10, anim: 'bob', dur: 3.2 },
    { art: 'spark', x: 200, y: 744, s: 0.7, r: 0, anim: 'tw', dur: 2.6 },
    { art: 'note', x: 36, y: 735, s: 0.9, r: -10, anim: 'bob', dur: 2.8 },
  ],
}


// Desktop (>=1024px) placements on a 1280x800 canvas (matches the desktop design boards).
export const PLACEMENTS_WIDE = {
  home: [
    { art: 'guitar', x: 1215, y: 120, s: 1.1, r: 18, anim: 'fl', dur: 7 },
    { art: 'spark', x: 690, y: 60, s: 0.8, r: 0, anim: 'tw', dur: 2.4 },
  ],
  library: [
    { art: 'phones', x: 1215, y: 64, s: 1.2, r: 10, anim: 'bob', dur: 3.2 },
    { art: 'tape', x: 1230, y: 300, s: 1.2, r: 12, anim: 'wb', dur: 3.5 },
    { art: 'piano', x: 1200, y: 650, s: 1.3, r: -8, anim: 'fl', dur: 7 },
    { art: 'note', x: 280, y: 690, s: 1.3, r: -10, anim: 'bob', dur: 2.8 },
    { art: 'spark', x: 700, y: 40, s: 0.8, r: 0, anim: 'tw', dur: 2.6 },
  ],
  playing: [
    { art: 'drum', x: 1200, y: 720, s: 1.5, r: 10, anim: 'fl', dur: 6 },
    { art: 'vinyl', x: 320, y: 740, s: 1.2, r: 0, anim: 'sp', dur: 5 },
    { art: 'speaker', x: 1130, y: 40, s: 1.1, r: 6, anim: 'fl', dur: 7 },
    { art: 'note', x: 700, y: 760, s: 1.3, r: 12, anim: 'bob', dur: 3 },
    { art: 'spark', x: 270, y: 40, s: 0.8, r: 0, anim: 'tw', dur: 2.5 },
  ],
  add: [
    { art: 'chain', x: 330, y: 700, s: 1.3, r: -14, anim: 'wb', dur: 4 },
    { art: 'sheet', x: 760, y: 690, s: 1.3, r: 0, anim: 'fl', dur: 6 },
    { art: 'spark', x: 560, y: 40, s: 0.8, r: 0, anim: 'tw', dur: 2.8 },
    { art: 'note', x: 1230, y: 350, s: 1.2, r: 12, anim: 'bob', dur: 3 },
  ],
  settings: [
    { art: 'tape', x: 1230, y: 300, s: 1.2, r: 12, anim: 'wb', dur: 3.5 },
    { art: 'phones', x: 1215, y: 64, s: 1.2, r: 10, anim: 'bob', dur: 3.2 },
    { art: 'spark', x: 700, y: 40, s: 0.8, r: 0, anim: 'tw', dur: 2.6 },
    { art: 'note', x: 280, y: 690, s: 1.3, r: -10, anim: 'bob', dur: 2.8 },
  ],
}

function useWide() {
  const q = '(min-width:1024px)'
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q), f = () => setWide(m.matches)
    m.addEventListener('change', f); return () => m.removeEventListener('change', f)
  }, [])
  return wide
}

export function StickerLayer({ page }) {
  const wide = useWide()
  const items = (wide ? PLACEMENTS_WIDE : PLACEMENTS)[page] ?? []
  return (
    <svg className="sticker-layer" viewBox={wide ? '0 0 1280 800' : '0 0 390 844'} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        {/* white die-cut outline around every sticker */}
        <filter id="sticker-outline" x="-25%" y="-25%" width="150%" height="150%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="d" />
          <feFlood floodColor="#fff" />
          <feComposite in2="d" operator="in" result="w" />
          <feMerge><feMergeNode in="w" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g opacity=".8">
        {items.map((it, i) => (
          <g key={i} filter="url(#sticker-outline)" transform={`translate(${it.x} ${it.y}) rotate(${it.r}) scale(${it.s})`}>
            <g className={`s ${it.anim}`} style={{ animationDuration: `${it.dur}s`, animationDelay: `-${(i * 1.3).toFixed(1)}s` }}>
              {ART[it.art]}
            </g>
          </g>
        ))}
      </g>
    </svg>
  )
}
