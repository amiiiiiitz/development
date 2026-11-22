# NoFi "Remix" UI: instructions for the coding agent

## Goal
Restyle NoFi (React + Vite frontend) with the "Remix" look: vintage cassette/print style + Gen Z energy.
**Presentation layer only.** Do NOT change: `db.js` (IndexedDB), the Cache API logic, the Express/yt-dlp backend, API routes, or any playback/download/export/import logic. Keep every existing feature working; only change markup, CSS classes and add the files below.

## Design rules (do not break)
- Palette is fixed in `tokens.css`: ink, paper, brass, amber, teal, violet, velvet. **No pink. No emoji** (use the SVG stickers/icons). No soft blurred shadows: only hard offset shadows (`4px 4px 0 ink`).
- Cards = white, 3px ink border, hard shadow, radius 16. Chips are pills. Tap targets >= 44px.
- Fonts: Bowlby One (titles/logo), Space Grotesk (UI text), Caveat (handwritten notes). Titles are lowercase except where shown.
- Each page has its **own background** and its **own animated stickers** (see `pages.css`, `PLACEMENTS` in `stickers.jsx`).
- Motion must stop when audio is paused (`data-playing`) and when the OS has "reduce motion" on.

## Files to add (copy as-is)
```
src/styles/tokens.css   colors, fonts, shadow
src/styles/base.css     page shell, cards, chips, rows, dock, seek bar, buttons
src/styles/pages.css    one background per page
src/styles/motion.css   every keyframe + reduced-motion + audio-paused rules
src/components/stickers.jsx   sticker art + PLACEMENTS + <StickerLayer/>
src/components/ui.jsx   PageShell, Dock, SignatureTag, Cassette, MiniCassette, Equalizer,
                        NoteBurst, Ticker, MoodChips, SongRow, SeekBar, useAudioPlaying
```

## Setup (Phase A)
1. `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Space+Grotesk:wght@500;700&family=Caveat:wght@700&display=swap" rel="stylesheet">
```
(Alternative: `npm i @fontsource/bowlby-one @fontsource/space-grotesk @fontsource/caveat` and import them in `main.jsx`.)
2. `main.jsx`, in this order:
```js
import './styles/tokens.css'; import './styles/base.css'; import './styles/pages.css'; import './styles/motion.css'; import './styles/responsive.css'
```
3. Remove old global styles that set `body` background/font or conflict with `.card`, `.chip`, `.tile`, `.row`, `.tag`, `.page`. Rename old classes rather than deleting logic.
4. Wire the playback state: in the component that owns the `<audio>` element, `const playing = useAudioPlaying(audioRef)` and pass it to `<PageShell playing={playing}>` on every page.

## Page structure (Phase B). Wrap every page in `<PageShell page="...">` and end with `<Dock active="..." onNavigate={...}/>`
Tab ids: `home`, `library`, `add`, `playing`. `onNavigate` = your existing router call.

**Home** (`page="home"`, bg ivory + halftone; stickers guitar, vinyl, note, 2 sparkles)
1. Header row: `<h1 className="logo">nofi</h1>` left, `<SignatureTag signature={sig} onEdit={openSignaturePad}/>` right.
2. Greeting: `<p className="t-hand" style={{fontSize:30}}>hey you, what's the mood?</p>` + small violet hand-drawn arrow SVG.
3. `<MoodChips moods={['main character','rainy bus ride','3am thoughts','gym delulu']} onPick={...}/>` (picking a mood filters/queues songs; keep simple if no mood data exists yet).
4. Now-playing row (`.polaroid-row`): `.tape-strip` + `.polaroid` (`.polaroid__art` holds `<Cassette title={current.title} size={150}/>`, then title in Caveat 22px, channel small) and `.now-side` with label "now playing", `<Equalizer/>`, the play/pause `.icon-btn.icon-btn--big.pl`, and `time / duration` in Caveat. Put `<NoteBurst style={{left:..,top:..}}/>` over the play button.
5. `<Ticker/>`
6. `.bento` with two columns: big amber `.tile` "ur saved tapes / songs kept offline, always" (opens Library, filter saved); right column teal tile "+ add a link / paste. convert. done." (opens Add) and brass tile "playlists / make ur own era".
7. `<Dock active="home">`

**Library** (`page="library"`, bg brass stripes; stickers headphones, cassette, piano, note, sparkle)
1. `<h1 className="page-title">ur library</h1>` + Caveat line "everything lives offline here".
2. `.card.search` with magnifier icon and `<input aria-label="Search songs or channels">` (filter your IndexedDB list live).
3. Filter chips row: all / songs / playlists / saved (`.chip`, active one has `.is-active`).
4. `.section-label` "newest first" (sort by `addedAt` desc).
5. Map songs to `<SongRow song index active saved onPlay onMore/>`. `saved` = MP3 exists in the Cache API; `active` = current song id. Keep existing menu actions (download MP3, delete, export) behind `onMore`.
6. `<Dock active="library">`

**Now Playing** (`page="playing"`, bg teal grooves; stickers drum, vinyl, speaker, note, sparkle; no Dock needed, use a back button)
1. Header: back `.icon-btn`, "now playing" label, like `.icon-btn.hb` with a velvet-red heart (only place velvet red is used besides the drum).
2. `.card.player-art` containing `<Cassette size={250} title=... stripe="#FFD93D"/>` plus a small `.chip.chip--teal` "no skips" sticker absolutely positioned top-right (`wg` class).
3. Title in `.t-display` 26px centered, channel below.
4. `<SeekBar value={percent} onSeek={...}/>` and Caveat times underneath (current / total).
5. Controls row (`.controls`): previous, rewind-10s or shuffle, big play/pause (`.icon-btn--big.pl`), next, repeat. All `<button>` with `aria-label`.
6. Action chips: "save mp3" (`.chip--teal`, calls existing single-MP3 download) and "playlist".
7. `<NoteBurst/>` rising from the cassette; keep `<audio>` logic untouched.

**Add Song** (`page="add"`, bg peach with sheet-music staff lines; stickers mic, chain, sheet, note, sparkle)
1. `<h1 className="page-title">add a song</h1>` + Caveat "paste a youtube link, we do the rest".
2. `.card` with label "youtube link", `.field` (link icon + `<input inputMode="url">`), a "paste" `.chip--brass` (uses `navigator.clipboard.readText()`), then `<button className="btn-primary">convert to mp3</button>` calling the existing convert function.
3. `.steps`: 1 paste (brass), 2 convert (amber), 3 play offline (teal), using `.step-dot`.
4. `.section-label` "in progress": one `.card` per active job: `<MiniCassette/>`, title, status text, percent in Caveat, `.progress><i style={{width: pct+'%'}}/>`. Finished job: `.card` with teal background, "saved to your library" and a check icon. Failed job: show the reason and a "try again" `.chip`.
5. `<Dock active="add">`

## Signature feature (Phase C)
- Store the signature the way you store other metadata (IndexedDB via `db.js`) as a PNG data URL from a `<canvas>` drawing pad (modal with: draw area, "clear", "save signature", live preview inside `.sig-tag`).
- `<SignatureTag signature={dataUrl}>` shows it on Home; `.sig-tag__img` plays a left-to-right "reveal" animation so it looks like it is being written. Empty state shows "tap to sign".
- Optional second place: print the same image small on the cassette label of Now Playing.

## Motion checklist (Phase D). Verify each
- Reels spin, equalizer bounces, play button pulses, note burst rises: only while playing.
- Stickers float/spin/bob on every page (each page has a different set).
- Sections fade up once on page load (`.page__inner > *`).
- Buttons press down on tap (`:active`), heart beats, "convert" button has a light sweep, ticker scrolls, progress stripes move.
- `prefers-reduced-motion: reduce` turns all of it off. Do not delete that block.
- Performance: the sticker outline uses an SVG filter. If scrolling is janky on low-end phones, set `document.documentElement.dataset.lite = 'true'` (drops outlines + sticker animation).

## Adding a new page later (e.g. Storage/Settings)
1. Add `[data-page="storage"]{ background: ... }` in `pages.css` (one new pattern, from the music palette).
2. Add `storage: [...]` to `PLACEMENTS` (4-5 stickers, each with an animation class: `sp`, `fl`, `bob`, `wb`, `tw`).
3. Use `<PageShell page="storage">` and the same cards/chips/dock.

## Acceptance checklist (Phase E)
- [ ] All existing features still work (add, play, download MP3, export/import, storage panel).
- [ ] No pink, no emoji, no blurred shadows.
- [ ] Each page has a different background and its own animated stickers.
- [ ] Keyboard focus is visible; every icon-only button has an `aria-label`.
- [ ] Text stays readable over backgrounds (text sits on white cards or plain paper).
- [ ] Layout works from 320px to 480px wide; on desktop the content stays centered at max 480px.
- [ ] Animations pause when audio is paused and stop under reduce-motion.

---
# RESPONSIVE: phone, tablet and desktop (add this phase after the mobile pages work)

## Breakpoints (mobile-first; mobile CSS is the default)
| Width | Layout |
|---|---|
| < 640px | Phone: single column, bottom `<Dock/>`. |
| 640 to 1023px | Tablet: same bottom Dock, content centered at max 720px, song list in 2 columns, cassette cards in 3 columns. |
| >= 1024px | Desktop: left `<Sidebar/>` (232px) replaces the Dock, persistent `<PlayerBar/>` at the bottom (hidden on Now Playing), content max 1100px (1180px at >= 1440px), multi-column pages. |

Import `responsive.css` LAST. Do not use JS to switch layouts, only CSS media queries (the only JS media query is the sticker placement hook in `stickers.jsx`).

## Wrap the app once
Replace per-page `<Dock/>` usage with `AppShell` (file `src/components/AppShell.jsx`). It renders Sidebar, PlayerBar and Dock; CSS shows the right ones. Pages stay `<PageShell page="...">` and must NOT render their own Dock any more.
```jsx
<AppShell active={route} onNavigate={navigate} signature={sig} onEditSignature={openPad}
          player={{ song, playing, percent, current, duration, onToggle, onPrev, onNext, onSeek }}>
  {/* current page */}
</AppShell>
```

## Class hooks the pages must have (so responsive.css can rearrange them)
- **Home:** wrap the now-playing row and the bento in `<div className="home-grid">...</div>` (hero card first, `.bento` second). Wrap Fresh Tapes cards in `<div className="tape-grid">` (3 on tablet, 5 on desktop). The mood chips sit on one row beside the greeting on desktop.
- **Library:** header in `<div className="lib-head">` (title left, `.card.search` right). Above the list add `<div className="song-head"><span>title</span><span>channel</span><span>time</span><span>status</span><span/></div>` (visible only on desktop). Put `SongRow`s inside `<div className="song-list">`. `SongRow` already switches between "channel · time under title" (phone) and table columns (desktop).
- **Now Playing:** wrap in `<div className="np-split">`: left = art card, title, seek bar, controls, action chips; right = `<aside className="card queue">` with "up next" (5 rows: MiniCassette, title, channel, time). Queue is hidden below 1024px.
- **Add Song:** wrap in `<div className="add-split">`: left = form card + steps; right = "in progress" and "done" job cards (stack under the form on small screens).
- **Search field and buttons:** keep 44px minimum tap targets at every width.

## Rules
- Fixed widths from the phone design (e.g. `206px` polaroid) must become fluid: use the `.polaroid{width:auto}` override on desktop, and `min-width:0` on flex/grid children so text truncates instead of overflowing.
- Use `100dvh`, not `100vh`, for full-height layouts (mobile browser bars).
- Sticker layer: phone/tablet use the 390x844 placements; desktop uses `PLACEMENTS_WIDE` (1280x800). To add a sticker on desktop, edit `PLACEMENTS_WIDE`.
- Sidebar and PlayerBar have `z-index:5` so stickers (z-index -1) never show over them.
- Test at: 360, 390, 768, 1024, 1280, 1440 and 1920 px wide, portrait and landscape on phones. No horizontal scrollbar at any size.

## Responsive acceptance checklist
- [ ] 360px phone: no clipped text, Dock never covers the last list row (page has bottom padding).
- [ ] 768px tablet: Dock still at the bottom, 2-column song list, content centered.
- [ ] 1024px+: Sidebar visible, Dock hidden, PlayerBar visible (except on Now Playing).
- [ ] Signature tag lives top-right on Home on phone/tablet and bottom of the Sidebar on desktop.
- [ ] Resizing the window across 1024px switches layout without reload or console errors.
