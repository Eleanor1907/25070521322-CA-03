// pages/NotFound.jsx

import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark";

export default function NotFound() {
  return (
    <main className="lost" id="main">
      <div className="lost__inner">
        <Wordmark />
        <div className="empty__seats" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <h1>This page doesn't exist</h1>
        <p>The link may be old or mistyped. Every seat is still where it was.</p>
        <Link className="btn btn--primary" to="/">
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
