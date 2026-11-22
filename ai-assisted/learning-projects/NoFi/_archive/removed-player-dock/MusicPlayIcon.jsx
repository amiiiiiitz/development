export default function MusicPlayIcon({ size = 18 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M10 16V5l7-2v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="7.5" cy="16.5" rx="2.5" ry="2" fill="currentColor" />
      <ellipse cx="14.5" cy="13.5" rx="2.5" ry="2" fill="currentColor" />
      <path d="m16 7 6 4-6 4V7Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}
