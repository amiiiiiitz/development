import { useEffect, useState } from 'react'
import { StickerLayer } from './stickers.jsx'

const INK = '#14110F'
const NOTE = 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'
const fmt = (s = 0) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/* Page wrapper: gives the page its own background + stickers.
   page: 'home' | 'library' | 'playing' | 'add'   playing: boolean from the <audio> element */
export function PageShell({ page, playing = false, children }) {
  return (
    <main className="page" data-page={page} data-playing={String(playing)}>
      <StickerLayer page={page} />
      <div className="page__inner">{children}</div>
    </main>
  )
}

/* Keep animations in sync with real playback. Pass your <audio> ref. */
export function useAudioPlaying(audioRef) {
  const [playing, setPlaying] = useState(false)
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const on = () => setPlaying(true), off = () => setPlaying(false)
    a.addEventListener('play', on); a.addEventListener('pause', off); a.addEventListener('ended', off)
    return () => { a.removeEventListener('play', on); a.removeEventListener('pause', off); a.removeEventListener('ended', off) }
  }, [audioRef])
  return playing
}

/* Bottom nav with instrument icons. active: 'home'|'library'|'add'|'playing'. onNavigate(id) -> your router. */
export const ICONS = {
  home: <><circle cx="8.5" cy="15.5" r="5.5" /><circle cx="8.5" cy="15.5" r="1.5" /><path d="M13 11l6-6M17.5 3.5l3 3" /></>,                         // guitar
  library: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7.5 19v-6M12 19v-6M16.5 19v-6" /></>,                                     // piano
  add: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21M9 21h6" /></>,                              // microphone
  playing: <><ellipse cx="12" cy="11" rx="8" ry="3" /><path d="M4 11v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5M8 4l5 6M16 4l-5 6" /></>,                      // drum
}
export const TABS = [['home', 'home'], ['library', 'library'], ['add', 'add song'], ['playing', 'playing']]
export function Dock({ active, onNavigate }) {
  return (
    <nav className="dock" aria-label="Main">
      {TABS.map(([id, label]) => (
        <button key={id} className={`dock__item${active === id ? ' is-active' : ''}`} aria-current={active === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
          <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">{ICONS[id]}</svg>
          {label}
        </button>
      ))}
    </nav>
  )
}

/* "This deck belongs to ___": top right of Home. signature = image data URL (PNG) or undefined. */
export function SignatureTag({ signature, onEdit }) {
  return (
    <button type="button" className="sig-tag wg" onClick={onEdit} aria-label="Edit your signature">
      <span className="sig-tag__strip">this deck belongs to</span>
      {signature ? <span className="sig-tag__empty t-hand">{signature}</span> : <span className="sig-tag__empty t-hand">tap to sign</span>}
    </button>
  )
}

export const Equalizer = () => <div className="eq" aria-hidden="true"><i /><i /><i /><i /></div>

/* Cassette: reels spin while playing (paused by [data-playing="false"]). Use size 150 on Home, 250 on Now Playing. */
export function Cassette({ title = '', size = 150, stripe = '#F28C38', stripe2 = '#6B4EFF' }) {
  return (
    <svg width={size} height={Math.round((size * 108) / 170)} viewBox="0 0 170 108" role="img" aria-label={title ? `Cassette: ${title}` : 'Cassette'}>
      <rect x="3" y="3" width="164" height="102" rx="9" fill="#222" stroke={INK} strokeWidth="4" />
      <rect x="14" y="12" width="142" height="52" rx="4" fill="#FBF3DF" />
      <rect x="14" y="40" width="142" height="9" fill={stripe} /><rect x="14" y="49" width="142" height="5" fill={stripe2} />
      <text x="22" y="34" fontFamily="Caveat,cursive" fontWeight="700" fontSize="24" fill={INK}>{title.slice(0, 16)}</text>
      <rect x="44" y="68" width="82" height="30" rx="6" fill={INK} />
      {[64, 106].map((x) => (
        <g key={x} className="sp s"><circle cx={x} cy="83" r="10" fill="#444" stroke="#ddd" strokeWidth="2" /><path d={`M${x} 74V92M${x - 9} 83H${x + 9}`} stroke="#ddd" strokeWidth="2" /></g>
      ))}
    </svg>
  )
}

export function MiniCassette({ color = '#F28C38' }) {
  return (
    <svg width="46" height="30" viewBox="0 0 46 30" aria-hidden="true" style={{ flex: 'none' }}>
      <rect x="1.5" y="1.5" width="43" height="27" rx="4" fill="#222" stroke={INK} strokeWidth="2.5" />
      <rect x="5" y="5" width="36" height="12" fill="#FBF3DF" /><rect x="5" y="11" width="36" height="4" fill={color} />
      <circle cx="15" cy="22" r="3" fill="#888" /><circle cx="31" cy="22" r="3" fill="#888" />
    </svg>
  )
}

/* Rising music notes. Place inside a position:relative parent, e.g. next to the play button. */
export function NoteBurst({ style }) {
  const cols = ['#6B4EFF', '#F28C38', '#3EE0A0']
  return (
    <div className="note-burst" aria-hidden="true" style={style}>
      {cols.map((c, i) => (
        <svg key={i} width="20" height="20" viewBox="0 0 24 24" style={{ left: i * 38, animationDelay: `${i * 1.2}s` }}>
          <path d={NOTE} fill={c} stroke={INK} strokeWidth="1.5" />
        </svg>
      ))}
    </div>
  )
}

export function Ticker({ text = 'NO SKIPS ✦ NO ADS ✦ NO WIFI NEEDED ✦ ' }) {
  const run = text.repeat(4)
  return <div className="ticker" aria-hidden="true"><span className="ticker__track">{run}{run}</span></div>
}

export function MoodChips({ moods, onPick }) {
  const tones = ['chip--brass', 'chip--amber', 'chip--violet', 'chip--teal']
  const tilt = [-2, 2, -1, 3]
  return (
    <div className="mood">
      {moods.map((m, i) => (
        <button key={m} className={`chip ${tones[i % 4]}`} style={{ transform: `rotate(${tilt[i % 4]}deg)` }} onClick={() => onPick(m)}>{m}</button>
      ))}
    </div>
  )
}

const TONES = ['#F28C38', '#6B4EFF', '#FFD93D', '#3EE0A0']
/* One library row. song: {title, channel, duration(seconds)}. saved = MP3 is in the offline cache.
   Mobile shows "channel · time" under the title; desktop (>=1024px) shows them as table columns (see responsive.css). */
export function SongRow({ song, index = 0, active, saved, onPlay, onMore }) {
  return (
    <div className={`card song${active ? ' is-active' : ''}`}>
      <button className="song__main" onClick={() => onPlay(song)} aria-label={`Play ${song.title}`}>
        <MiniCassette color={TONES[index % 4]} />
        <span className="song__text"><b>{song.title}</b><small className="song__sub">{song.channel} · {fmt(song.duration)}</small></span>
      </button>
      <span className="song__channel">{song.channel}</span>
      <span className="song__dur">{fmt(song.duration)}</span>
      <span className="song__status">{active ? <Equalizer /> : saved && <span className="tag">saved</span>}</span>
      <button className="icon-btn icon-btn--ghost" onClick={() => onMore(song)} aria-label={`More options for ${song.title}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill={active ? '#fff' : INK} d="M12 6a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4z" /></svg>
      </button>
    </div>
  )
}

/* Seek bar: value 0-100. Stripes animate inside the filled part. */
export function SeekBar({ value, onSeek, label = 'Seek' }) {
  return <input className="seek" type="range" min="0" max="100" step="0.1" value={value} aria-label={label} style={{ '--p': `${value}%` }} onChange={(e) => onSeek(Number(e.target.value))} />
}
