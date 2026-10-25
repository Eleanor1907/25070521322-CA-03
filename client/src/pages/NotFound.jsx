// pages/NotFound.jsx

import { Link } from "react-router-dom";
import Wordmark from "../components/Wordmark";

export default function NotFound() {
  return (
    <div className="auth">
      <div className="auth__panel">
        <Wordmark />
        <h1>This page doesn't exist</h1>
        <p className="auth__sub">The link may be old or mistyped.</p>
        <Link className="btn btn--primary" to="/">
          Go to the home page
        </Link>
      </div>
    </div>
  );
}
