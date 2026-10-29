export default function MicrophoneIcon({ size = 17, muted = false }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="7.5" y="2.5" width="9" height="12" rx="4.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 6.5h5M9.5 9h5M9.5 11.5h5M4.5 10.5v1.5a7.5 7.5 0 0 0 15 0v-1.5M12 19.5v2M8.5 21.5h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {muted && <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
    </svg>
  );
}
