// pages/Landing.jsx
// Public home page. The board on the right is live data from MongoDB
// (GET /api/spaces/board), so it changes as people book.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Armchair, DoorClosed, Users } from "lucide-react";
import Wordmark from "../components/Wordmark";
import DayStrip from "../components/DayStrip";
import ZoneTag from "../components/ZoneTag";
import { getBoard } from "../services/spaceService";
import { parseApiError } from "../services/api";
import { formatDate, todayString, typeLabel } from "../utils/format";
import { useAuth } from "../context/AuthContext";

const STEPS = [
  { title: "Find a space", text: "Filter by type, number of people and day. Every space shows its day at a glance." },
  { title: "Pick a time", text: "Choose any half-hour slot between 08:00 and 20:00. Clashes are blocked before you book." },
  { title: "Change your mind", text: "Reschedule or cancel from My bookings. A cancelled slot opens up for others straight away." },
];

const TYPES = [
  { type: "hot-desk", icon: Armchair, text: "One seat on the open floor. Good for a few focused hours." },
  { type: "meeting-room", icon: Users, text: "Rooms for 4 to 14 people, with screens and whiteboards." },
  { type: "private-cabin", icon: DoorClosed, text: "A closed cabin for calls, interviews or quiet work." },
];

export default function Landing() {
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const today = todayString();

  useEffect(() => {
    getBoard(today)
      .then((res) => setBoard(res.data))
      .catch((err) => setError(parseApiError(err).message));
  }, [today]);

  return (
    <div className="landing">
      <header className="landing__bar">
        <Wordmark />
        <nav className="landing__nav">
          {user ? (
            <Link className="btn btn--primary btn--sm" to="/app">
              Open FLEXI
            </Link>
          ) : (
            <>
              <Link className="btn btn--ghost btn--sm" to="/login">
                Log in
              </Link>
              <Link className="btn btn--primary btn--sm" to="/register">
                Create an account
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <h1>Book a desk, a room or a cabin by the half hour.</h1>
          <p>
            See what's free today, pick a time, and it's yours. Change or cancel any time before it starts.
          </p>
          <div className="hero__actions">
            <Link className="btn btn--primary btn--lg" to={user ? "/app/spaces" : "/register"}>
              {user ? "Find a space" : "Create an account"}
            </Link>
            {!user && (
              <Link className="btn btn--ghost btn--lg" to="/login">
                Log in
              </Link>
            )}
          </div>
        </div>

        <div className="board" aria-labelledby="board-title">
          <div className="board__head">
            <h2 id="board-title">Today at FLEXI</h2>
            <span>{formatDate(today, { weekday: "long", day: "numeric", month: "long" })}</span>
          </div>

          {error && <p className="board__note">{error}</p>}
          {!board && !error && <p className="board__note">Loading today's schedule…</p>}
          {board && board.length === 0 && <p className="board__note">No spaces yet. An admin can add them.</p>}

          {board && board.length > 0 && (
            <ul className="board__rows">
              {board.map((s) => (
                <li key={s._id} className="board__row">
                  <div className="board__name">
                    <strong>{s.name}</strong>
                    <ZoneTag type={s.type} />
                  </div>
                  <DayStrip slots={s.bookedSlots} date={today} zone={s.type} />
                </li>
              ))}
            </ul>
          )}

          <div className="legend" aria-hidden="true">
            <span><i className="legend__booked" /> Booked</span>
            <span><i className="legend__now" /> Now</span>
          </div>
        </div>
      </section>

      <section className="steps" aria-labelledby="steps-title">
        <h2 id="steps-title">How booking works</h2>
        <ol>
          {STEPS.map((s) => (
            <li key={s.title}>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="types" aria-labelledby="types-title">
        <h2 id="types-title">Three kinds of space</h2>
        <div className="types__grid">
          {TYPES.map(({ type, icon: Icon, text }) => (
            <div key={type} className={`type-panel zone-${type}`}>
              <Icon size={28} aria-hidden />
              <h3>{typeLabel(type)}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing__foot">
        <Wordmark />
        <p>Workspace booking built with React, Node.js, Express and MongoDB.</p>
      </footer>
    </div>
  );
}
