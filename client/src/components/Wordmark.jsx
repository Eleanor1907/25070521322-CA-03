// components/Wordmark.jsx
// The Pine logo: a small seat and the name. tone="dark" is for the dark bar.

import { Link } from "react-router-dom";

export function SeatMark({ size = 22 }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 22 20" fill="none" aria-hidden="true" className="wordmark__mark">
      <path d="M4.5 9V5.5a4 4 0 0 1 4-4h5a4 4 0 0 1 4 4V9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="1.5" y="8.5" width="19" height="6.5" rx="2.6" fill="currentColor" />
      <path d="M5.5 15.5v3M16.5 15.5v3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Wordmark({ to = "/", tone = "light", onClick }) {
  return (
    <Link to={to} className={`wordmark ${tone === "dark" ? "wordmark--dark" : ""}`} aria-label="Pine home" onClick={onClick}>
      <SeatMark />
      <span className="wordmark__text">PINE</span>
    </Link>
  );
}
