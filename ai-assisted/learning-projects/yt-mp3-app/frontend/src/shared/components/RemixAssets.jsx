import React from "react";

export function VinylDisc({ className = "", size = 72, spinning = false, style }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 72 72" aria-hidden="true" style={style}>
      <g className={spinning ? "rx-sp" : undefined} style={{ animationDuration: spinning ? "3s" : undefined }}>
        <circle cx="36" cy="36" r="36" fill="#14110F" />
        <circle cx="36" cy="36" r="26" fill="none" stroke="#555" strokeWidth="2" />
        <circle cx="36" cy="36" r="12" fill="#FFD93D" stroke="#14110F" strokeWidth="2" />
        <circle cx="36" cy="36" r="2.5" fill="#F6ECD8" />
        <path d="M8 22A31 31 0 0 1 22 8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".85" />
      </g>
    </svg>
  );
}

export function CassetteTape({ className = "", width = 150, spinning = false, label = "mixtape", stripe = "#F28C38", stripe2 = "#6B4EFF", artwork }) {
  const h = Math.round(width * 0.635);
  return (
    <svg className={className} width={width} height={h} viewBox="0 0 170 108" aria-hidden="true">
      <rect x="3" y="3" width="164" height="102" rx="9" fill="#222" stroke="#14110F" strokeWidth="4" />
      <rect x="14" y="12" width="142" height="52" rx="4" fill="#FBF3DF" />
      {artwork ? (
        <>
          <rect x="14" y="48" width="142" height="7" fill={stripe} />
          <rect x="14" y="55" width="142" height="5" fill={stripe2} />
          <image href={artwork} x="118" y="16" width="32" height="32" preserveAspectRatio="xMidYMid slice" />
          <rect x="118" y="16" width="32" height="32" rx="2" fill="none" stroke="#14110F" strokeWidth="2" />
        </>
      ) : (
        <>
          <rect x="14" y="40" width="142" height="9" fill={stripe} />
          <rect x="14" y="49" width="142" height="5" fill={stripe2} />
          <g transform="translate(6 -4)">
  <path d="M132 20v17.5a5 5 0 1 1-3-4.6V25l13-3v11.5a5 5 0 1 1-3-4.6V18z" fill="#6B4EFF" stroke="#14110F" strokeWidth="1.5" />
</g> fill="#6B4EFF" stroke="#14110F" strokeWidth="1.5" />
        </>
      )}
      <text
  x="20"
  y="34"
  textLength={label.length > (artwork ? 9 : 8) ? (artwork ? 92 : 96) : undefined}
  lengthAdjust="spacingAndGlyphs"
  fontFamily="Caveat,cursive"
  fontWeight="700"
  fontSize={label.length > (artwork ? 14 : 14) ? 14 : label.length > (artwork ? 9 : 8) ? 18 : 24}
  fill="#14110F"
>{label}</text>
      <rect x="44" y="68" width="82" height="30" rx="6" fill="#14110F" />
      <g className={spinning ? "rx-sp rx-tape-reel" : "rx-tape-reel"}>
        <circle cx="64" cy="83" r="10" fill="#444" stroke="#ddd" strokeWidth="2" />
        <path d="M64 74V92M55 83H73" stroke="#ddd" strokeWidth="2" />
      </g>
      <g className={spinning ? "rx-sp rx-tape-reel rx-tape-reel--reverse" : "rx-tape-reel rx-tape-reel--reverse"}>
        <circle cx="106" cy="83" r="10" fill="#444" stroke="#ddd" strokeWidth="2" />
        <path d="M106 74V92M97 83H115" stroke="#ddd" strokeWidth="2" />
      </g>
    </svg>
  );
}

export function MiniCassette({ stripe = "#F28C38", className = "" }) {
  return (
    <svg className={className} width="46" height="30" viewBox="0 0 46 30" aria-hidden="true" style={{ flex: "none" }}>
      <rect x="1.5" y="1.5" width="43" height="27" rx="4" fill="#222" stroke="#14110F" strokeWidth="2.5" />
      <rect x="5" y="5" width="36" height="12" fill="#FBF3DF" />
      <rect x="5" y="11" width="36" height="4" fill={stripe} />
      <circle cx="15" cy="22" r="3" fill="#888" />
      <circle cx="31" cy="22" r="3" fill="#888" />
    </svg>
  );
}

export function FloatingNote({ color = "#6B4EFF", delay = 0, left = 0, size = 20 }) {
  return (
    <svg className="rx-note" style={{ left, animationDelay: `${delay}s` }} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v10.550c-.590-.340-1.270-.550-2-.550-2.210 0-4 1.790-4 4s1.790 4 4 4 4-1.790 4-4V7h4V3h-6z" fill={color} stroke="#14110F" strokeWidth="1.5" />
    </svg>
  );
}

export function EqBars({ className = "", light = false }) {
  return (
    <div className={`eq rx-eq ${className}`.trim()} aria-hidden="true">
      <i style={light ? { background: "#fff" } : undefined} />
      <i style={light ? { background: "#fff" } : undefined} />
      <i style={light ? { background: "#fff" } : undefined} />
      <i style={light ? { background: "#fff" } : undefined} />
    </div>
  );
}

export function SignatureScribble({ name, className = "" }) {
  const display = name || "tap to sign";
  return (
    <div className={`rx-signature ${className}`.trim()}>
      <span className="rx-signature-label">THIS DECK BELONGS TO</span>
      <svg className="rx-signature-svg" viewBox="0 0 220 48" role="img" aria-label={`Signature: ${display}`}>
        <path className="rx-sg" pathLength="420" d="M8 30C16 8 26 6 26 17S14 36 22 36 36 14 44 17 40 33 50 29 58 16 66 21 62 33 76 27 84 15 92 19 88 33 100 29 112 15 118 23 124 30 140 14 150 20 158 14 170 20 182 12 196 22 212 10" fill="none" stroke="#6B4EFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path className="rx-sg" pathLength="420" style={{ animationDelay: ".9s" }} d="M6 41C50 36 96 40 142 35 170 33 196 38 214 32" fill="none" stroke="#6B4EFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="rx-signature-name H" aria-hidden="true">{display}</span>
    </div>
  );
}

const OutlineFilter = () => (
  <defs>
    <filter id="rx-o" x="-25%" y="-25%" width="150%" height="150%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="4" result="d" />
      <feFlood floodColor="#fff" />
      <feComposite in2="d" operator="in" result="w" />
      <feMerge><feMergeNode in="w" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  </defs>
);

export function HomeBg() {
  return (
    <svg className="rx-bg-svg" viewBox="0 0 390 844" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <OutlineFilter />
      <g opacity=".75">
        <g filter="url(#rx-o)" transform="translate(352 262) rotate(18) scale(0.75)">
          <g className="rx-fl" style={{ animationDuration: "7s" }}>
            <rect x="-4" y="-66" width="8" height="46" fill="#7A4524" stroke="#14110F" strokeWidth="3" />
            <rect x="-7" y="-80" width="14" height="16" rx="3" fill="#14110F" />
            <circle cy="24" r="24" fill="#F28C38" stroke="#14110F" strokeWidth="3" />
            <circle cy="-4" r="16" fill="#F28C38" stroke="#14110F" strokeWidth="3" />
            <circle cy="14" r="8" fill="#14110F" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(30 505) rotate(0) scale(0.8)">
          <g className="rx-sp" style={{ animationDuration: "6s", animationDelay: "-1.3s" }}>
            <circle r="36" fill="#14110F" /><circle r="26" fill="none" stroke="#555" strokeWidth="2" />
            <circle r="12" fill="#FFD93D" stroke="#14110F" strokeWidth="2" /><circle r="2.5" fill="#F6ECD8" />
            <path d="M-28 -14A31 31 0 0 1 -14 -28" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(356 742) rotate(10) scale(0.9)">
          <g className="rx-bob" style={{ animationDuration: "3s", animationDelay: "-2.6s" }}>
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" transform="scale(3.2) translate(-12 -12)" fill="#6B4EFF" stroke="#14110F" strokeWidth="1" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(210 252) rotate(0) scale(0.6)">
          <g className="rx-tw" style={{ animationDuration: "2.4s", animationDelay: "-3.9s" }}>
            <path d="M0 -20C3 -6 6 -3 20 0C6 3 3 6 0 20C-3 6 -6 3 -20 0C-6 -3 -3 -6 0 -20Z" fill="#FFD93D" stroke="#14110F" strokeWidth="2.5" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(34 742) rotate(0) scale(0.7)">
          <g className="rx-tw" style={{ animationDuration: "3s", animationDelay: "-5.2s" }}>
            <path d="M0 -20C3 -6 6 -3 20 0C6 3 3 6 0 20C-3 6 -6 3 -20 0C-6 -3 -3 -6 0 -20Z" fill="#FFD93D" stroke="#14110F" strokeWidth="2.5" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function LibraryBg() {
  return (
    <svg className="rx-bg-svg" viewBox="0 0 390 844" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <OutlineFilter />
      <g opacity=".7">
        <g filter="url(#rx-o)" transform="translate(326 48) rotate(10) scale(0.95)">
          <g className="rx-bob" style={{ animationDuration: "3.2s" }}>
            <path d="M-30 6a30 30 0 0160 0" fill="none" stroke="#14110F" strokeWidth="6" />
            <rect x="-38" y="2" width="16" height="28" rx="7" fill="#6B4EFF" stroke="#14110F" strokeWidth="3" />
            <rect x="22" y="2" width="16" height="28" rx="7" fill="#6B4EFF" stroke="#14110F" strokeWidth="3" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(344 212) rotate(12) scale(0.7)">
          <g className="rx-wb" style={{ animationDuration: "3.5s", animationDelay: "-1.3s" }}>
            <rect x="-40" y="-26" width="80" height="52" rx="6" fill="#2A2A2A" stroke="#14110F" strokeWidth="3" />
            <rect x="-32" y="-19" width="64" height="26" rx="3" fill="#F6ECD8" />
            <rect x="-32" y="-8" width="64" height="7" fill="#2EC4B6" />
            <g className="rx-sp"><circle cx="-14" cy="14" r="7" fill="#444" stroke="#ddd" strokeWidth="2" /><path d="M-14 8v12M-20 14h12" stroke="#ddd" strokeWidth="1.5" /></g>
            <g className="rx-sp"><circle cx="14" cy="14" r="7" fill="#444" stroke="#ddd" strokeWidth="2" /><path d="M14 8v12M8 14h12" stroke="#ddd" strokeWidth="1.5" /></g>
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(330 730) rotate(-8) scale(0.8)">
          <g className="rx-fl" style={{ animationDuration: "7s", animationDelay: "-2.6s" }}>
            <rect x="-36" y="-24" width="72" height="48" rx="5" fill="#F6ECD8" stroke="#14110F" strokeWidth="3" />
            <path d="M-18 -24V24M0 -24V24M18 -24V24" stroke="#14110F" strokeWidth="2" />
            <rect className="rx-kp" x="-25" y="-24" width="14" height="28" fill="#14110F" />
            <rect className="rx-kp" style={{ animationDelay: ".4s" }} x="-7" y="-24" width="14" height="28" fill="#14110F" />
            <rect className="rx-kp" style={{ animationDelay: ".8s" }} x="11" y="-24" width="14" height="28" fill="#14110F" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(36 735) rotate(-10) scale(0.9)">
          <g className="rx-bob" style={{ animationDuration: "2.8s", animationDelay: "-3.9s" }}>
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" transform="scale(3.2) translate(-12 -12)" fill="#6B4EFF" stroke="#14110F" strokeWidth="1" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function AddSongBg() {
  return (
    <svg className="rx-bg-svg" viewBox="0 0 390 844" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <OutlineFilter />
      <g opacity=".75">
        <g filter="url(#rx-o)" transform="translate(312 655) rotate(10) scale(1)">
          <g className="rx-fl" style={{ animationDuration: "7s" }}>
            <g transform="translate(0 -17)">
              <circle className="rx-rg" r="24" fill="none" stroke="#6B4EFF" strokeWidth="3" />
              <circle className="rx-rg" style={{ animationDelay: ".9s" }} r="24" fill="none" stroke="#6B4EFF" strokeWidth="3" />
            </g>
            <rect x="-12" y="-36" width="24" height="38" rx="12" fill="#C9C4B8" stroke="#14110F" strokeWidth="3" />
            <path d="M-6 -24h12M-6 -14h12" stroke="#14110F" strokeWidth="2" />
            <path d="M-22 -6a22 22 0 0044 0M0 16v22M-14 40h28" fill="none" stroke="#14110F" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(84 668) rotate(-14) scale(1)">
          <g className="rx-wb" style={{ animationDuration: "4s", animationDelay: "-1.3s" }}>
            <rect x="-34" y="-12" width="40" height="24" rx="12" stroke="#14110F" strokeWidth="12" fill="none" />
            <rect x="-34" y="-12" width="40" height="24" rx="12" stroke="#6B4EFF" strokeWidth="5" fill="none" />
            <rect x="-6" y="-12" width="40" height="24" rx="12" stroke="#14110F" strokeWidth="12" fill="none" />
            <rect x="-6" y="-12" width="40" height="24" rx="12" stroke="#FFD93D" strokeWidth="5" fill="none" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(36 590) rotate(0) scale(0.7)">
          <g className="rx-tw" style={{ animationDuration: "2.8s", animationDelay: "-3.9s" }}>
            <path d="M0 -20C3 -6 6 -3 20 0C6 3 3 6 0 20C-3 6 -6 3 -20 0C-6 -3 -3 -6 0 -20Z" fill="#FFD93D" stroke="#14110F" strokeWidth="2.5" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function PlayingBg() {
  return (
    <svg className="rx-bg-svg" viewBox="0 0 390 844" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <OutlineFilter />
      <g opacity=".7">
        <g filter="url(#rx-o)" transform="translate(92 772) rotate(-8) scale(1)">
          <g className="rx-fl" style={{ animationDuration: "6s" }}>
            <path d="M-34 0v34a34 11 0 0068 0V0z" fill="#E0393E" stroke="#14110F" strokeWidth="3" />
            <ellipse rx="34" ry="11" fill="#F6ECD8" stroke="#14110F" strokeWidth="3" />
            <path d="M-20 12l10 30M0 14v32M20 12l-10 30" stroke="#F6ECD8" strokeWidth="2" />
            <path className="rx-hit" d="M-30 -40l22 28" stroke="#C8742B" strokeWidth="5" strokeLinecap="round" />
            <path className="rx-hit" style={{ animationDelay: ".35s" }} d="M30 -40l-22 28" stroke="#C8742B" strokeWidth="5" strokeLinecap="round" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(196 742) rotate(0) scale(0.9)">
          <g className={/* playing is controlled at view */ "rx-sp"} style={{ animationDuration: "5s", animationDelay: "-1.3s" }}>
            <circle r="36" fill="#14110F" /><circle r="26" fill="none" stroke="#555" strokeWidth="2" />
            <circle r="12" fill="#FFD93D" stroke="#14110F" strokeWidth="2" /><circle r="2.5" fill="#F6ECD8" />
          </g>
        </g>
        <g filter="url(#rx-o)" transform="translate(350 44) rotate(12) scale(0.8)">
          <g className="rx-bob" style={{ animationDuration: "3s", animationDelay: "-3.9s" }}>
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" transform="scale(3.2) translate(-12 -12)" fill="#6B4EFF" stroke="#14110F" strokeWidth="1" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function NofiLogo({ size = 46, className = "" }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#FFD93D" stroke="#14110F" strokeWidth="4" />
      <g fill="none" stroke="#14110F" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" transform="translate(8 8) scale(2)">
        <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
        <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
        <circle cx="12" cy="12" r="2" fill="#14110F" />
        <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
        <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
      </g>
    </svg>
  );
}
