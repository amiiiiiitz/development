import { Settings } from 'lucide-react'
import { Dock, ICONS, TABS, SignatureTag, Cassette, Equalizer } from './ui.jsx'

/* Wrap the whole app once. It renders BOTH navigations; CSS shows the right one:
   <1024px  -> bottom <Dock/>       >=1024px -> <Sidebar/> + <PlayerBar/>
   active: 'home'|'library'|'add'|'playing'    onNavigate(id): your router
   player: { song, playing, percent, current, duration, onToggle, onPrev, onNext, onSeek } */
export function AppShell({
  active,
  onNavigate,
  signature,
  onEditSignature,
  onSettings,
  settingsActive = false,
  player,
  children,
}) {
  return (
    <div className="app" data-active={active}>
      <Sidebar
        active={active}
        onNavigate={onNavigate}
        signature={signature}
        onEditSignature={onEditSignature}
        onSettings={onSettings}
        settingsActive={settingsActive}
      />
      <div className="app__main">
        {children}
        {active !== 'playing' && player?.song && <PlayerBar {...player} />}
      </div>
      <Dock active={active} onNavigate={onNavigate} />
    </div>
  )
}

export function Sidebar({ active, onNavigate, signature, onEditSignature, onSettings, settingsActive }) {
  return (
    <aside className="sidebar">
      <h1 className="sidebar__logo">nofi</h1>
      <p className="sidebar__tag">your offline listening room</p>
      <nav className="sidebar__nav" aria-label="Main">
        {TABS.map(([id, label]) => (
          <button key={id} className={`nav-item${active === id ? ' is-active' : ''}`} aria-current={active === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">{ICONS[id]}</svg>
            {label}
          </button>
        ))}
      </nav>
      <button
        type="button"
        className={`nav-item${settingsActive ? ' is-active' : ''}`}
        aria-current={settingsActive ? 'page' : undefined}
        onClick={onSettings}
      >
        <Settings size={24} aria-hidden="true" />
        settings
      </button>
      <SignatureTag signature={signature} onEdit={onEditSignature} />
    </aside>
  )
}

const mmss = (s = 0) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
export function PlayerBar({
  song,
  playing,
  percent = 0,
  current = 0,
  duration = 0,
  onToggle,
  onPrev,
  onNext,
  onSeek,
  progressRef,
  currentTimeRef,
  durationRef,
}) {
  return (
    <footer className="player-bar" data-playing={String(playing)}>
      <Cassette size={64} title={song.title} />
      <div className="player-bar__info"><p title={song.title}>{song.title}</p><p className="small" title={song.channel}>{song.channel}</p></div>
      <div className="player-bar__mid">
        <div className="row" style={{ gap: 14 }}>
          <button className="icon-btn" style={{ width: 44, height: 44 }} onClick={onPrev} aria-label="Previous"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" fill="currentColor" /></svg></button>
          <button className={`icon-btn pl`} style={{ width: 52, height: 52, background: 'var(--brass)' }} onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" /></svg> : <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4l13 8-13 8z" fill="currentColor" /></svg>}</button>
          <button className="icon-btn" style={{ width: 44, height: 44 }} onClick={onNext} aria-label="Next"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" fill="currentColor" /></svg></button>
        </div>
        <div className="row" style={{ width: '100%', maxWidth: 520 }}>
          <span ref={currentTimeRef} className="t-hand" style={{ fontSize: 18 }}>{mmss(current)}</span>
          <input ref={progressRef} className="seek" type="range" min="0" max="100" step="0.1" defaultValue={percent} aria-label="Seek" style={{ '--p': `${percent}%` }} onChange={(e) => onSeek(Number(e.target.value))} />
          <span ref={durationRef} className="t-hand" style={{ fontSize: 18 }}>{mmss(duration)}</span>
        </div>
      </div>
      <Equalizer />
    </footer>
  )
}
