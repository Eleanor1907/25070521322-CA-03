// components/AuthLayout.jsx
// Shared frame for the log-in and register pages: an aubergine side panel
// with a short line about Pine, and the form on the right.

import Wordmark from "./Wordmark";

// Decorative rows of seats on the side panel (a picture, not booking data)
const ROWS = [
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 0],
  [0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 0, 0, 0],
];

export default function AuthLayout({ headline, lead, children }) {
  return (
    <div className="auth">
      <aside className="auth__side">
        <Wordmark tone="dark" />
        <div>
          <p className="auth__headline">{headline}</p>
          <p className="auth__lead">{lead}</p>
        </div>
        <div className="auth__rows" aria-hidden="true">
          {ROWS.map((row, r) => (
            <div key={r}>
              {row.map((on, k) => (
                <i key={k} className={on ? "on" : undefined} />
              ))}
            </div>
          ))}
        </div>
      </aside>

      <main className="auth__main" id="main">
        <div className="auth__card">
          <div className="auth__mobile-brand">
            <Wordmark />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
