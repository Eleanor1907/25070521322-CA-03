// pages/Landing.jsx
// Public home page, laid out like the reference: a framed showcase with two
// slides (glitch transition), a large headline with pills, then a two-column
// collage. The board in the first slide is live data from MongoDB
// (GET /api/spaces/board), so it changes as people book.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Wordmark, { SeatMark } from "../components/Wordmark";
import TypeTag from "../components/TypeTag";
import { SeatLegend, SeatRow, SeatRuler } from "../components/Seats";
import { Skeleton } from "../components/Feedback";
import { getBoard } from "../services/spaceService";
import { parseApiError } from "../services/api";
import { describeSlots } from "../utils/seats";
import { TYPE_ICONS } from "../utils/typeIcons";
import { formatDate, todayString, typeLabel } from "../utils/format";
import { useAuth } from "../context/AuthContext";

const STEPS = [
  {
    title: "Find free seats",
    text: "Pick a day and every desk, room and cabin shows up as a row of half-hour seats from 08:00 to 20:00.",
  },
  {
    title: "Choose a run of seats",
    text: "Click a start seat, then an end seat, or drag across. Taken seats can't be picked, so bookings never clash.",
  },
  {
    title: "Keep your ticket",
    text: "Each booking becomes a ticket. Reschedule or cancel it any time before it starts.",
  },
];

const TYPES = [
  { type: "hot-desk", text: "One seat on the open floor. Good for a few focused hours." },
  { type: "meeting-room", text: "Rooms for 4 to 14 people, with screens and whiteboards." },
  { type: "private-cabin", text: "A closed cabin for calls, interviews or quiet work." },
];

const TICKER = ["Hot desks", "Meeting rooms", "Private cabins", "Open 08:00–20:00", "Book by the half hour"];

// Seats for the "how it works" picture (10:00 to 14:00). Labelled as an example.
const DEMO = [
  ["taken", "taken"],
  ["chosen", "chosen"],
  ["chosen", "free"],
  ["taken", "free"],
];

// Decorative seat rows behind the second slide (a picture, not booking data)
const POSTER_ROWS = [
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
];

const SLIDE_MS = 7000;

function useReducedMotion() {
  const [reduced] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  return reduced;
}

function Ticker() {
  return (
    <div className="lp-ticker" aria-hidden="true">
      {TICKER.map((t) => (
        <span key={t}>
          <i />
          {t}
        </span>
      ))}
    </div>
  );
}

function LiveBoard({ today }) {
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBoard(today)
      .then((res) => setBoard(res.data))
      .catch((err) => setError(parseApiError(err).message));
  }, [today]);

  return (
    <div className="house">
      <div className="house__head">
        <h2 id="board-title">Today at Pine</h2>
        <time dateTime={today}>{formatDate(today, { weekday: "long", day: "numeric", month: "long" })}</time>
      </div>

      {error && (
        <p className="house__note" role="alert">
          {error}
        </p>
      )}

      {!board && !error && (
        <div role="status" aria-label="Loading today's seats">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="house-row">
              <Skeleton w="70%" h={12} />
              <Skeleton h={14} />
            </div>
          ))}
        </div>
      )}

      {board && board.length === 0 && <p className="house__note">No spaces are open yet. An admin can add them.</p>}

      {board && board.length > 0 && (
        <>
          <ul className="house-rows">
            {board.map((s) => (
              <li key={s._id} className="house-row">
                <div className="house-row__name">
                  <strong>{s.name}</strong>
                  <TypeTag type={s.type} />
                </div>
                <SeatRow slots={s.bookedSlots} date={today} label={`${s.name}: ${describeSlots(s.bookedSlots)}`} />
              </li>
            ))}
          </ul>
          <div className="house-ruler">
            <span />
            <SeatRuler />
          </div>
        </>
      )}

      <SeatLegend items={["free", "taken", "past", "now"]} />
    </div>
  );
}

// The framed showcase: two slides that change with a short glitch
// paused/setPaused live in <Landing>: the same button also stops the type marquee
function Showcase({ today, user, paused, setPaused }) {
  const [slide, setSlide] = useState(0);
  const [changed, setChanged] = useState(false); // no glitch on the first paint
  const [hovering, setHovering] = useState(false);
  const running = !paused && !hovering;

  const show = (i) => {
    setSlide(i);
    setChanged(true);
  };

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => show((slide + 1) % 2), SLIDE_MS);
    return () => clearTimeout(t);
  }, [running, slide]);

  const slideProps = (i) => ({
    className: `lp-slide lp-slide--${i + 1} ${slide === i ? "is-on" : ""} ${slide === i && changed ? "is-glitching" : ""}`,
    "aria-hidden": slide !== i,
    inert: slide !== i ? true : undefined,
  });

  return (
    <section
      className="lp-frame"
      aria-roledescription="carousel"
      aria-label="Pine today"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setHovering(true)}
      onBlur={() => setHovering(false)}
    >
      <div className="lp-screen">
        <div {...slideProps(0)} role="group" aria-roledescription="slide" aria-label="1 of 2">
          <Ticker />
          <div className="lp-slide__body">
            <div className="lp-intro">
              <p className="lp-intro__name">Pine</p>
              <p className="lp-intro__live">
                <ChevronLeft size={14} aria-hidden /> Live today <ChevronRight size={14} aria-hidden />
              </p>
              <p className="lp-intro__text">
                Every open space, seat by seat. Each seat is half an hour; the green ones are still free.
              </p>
            </div>
            <LiveBoard today={today} />
          </div>
        </div>

        <div {...slideProps(1)} role="group" aria-roledescription="slide" aria-label="2 of 2">
          <div className="lp-poster" aria-hidden="true">
            {POSTER_ROWS.map((row, r) => (
              <div key={r}>
                {row.map((on, k) => (
                  <i key={k} className={on ? "on" : undefined} />
                ))}
              </div>
            ))}
          </div>
          <span className="lp-orb" aria-hidden="true">
            <SeatMark size={40} />
          </span>
          <div className="lp-slide__poster">
            <p className="lp-poster__title">
              Pick a desk
              <br />
              the way you
              <br />
              pick a seat
            </p>
            <p className="lp-poster__text">Desks, meeting rooms and private cabins, booked by the half hour.</p>
          </div>
          <Link className="btn btn--primary btn--sm lp-poster__cta" to={user ? "/app/spaces" : "/register"}>
            {user ? "Find a space" : "Get started"}
          </Link>
        </div>
      </div>

      <div className="lp-controls">
        <div className="lp-dots" role="group" aria-label="Choose a slide">
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              className={slide === i ? "is-on" : ""}
              aria-pressed={slide === i}
              aria-label={`Show slide ${i + 1}`}
              onClick={() => show(i)}
            >
              0{i + 1}
            </button>
          ))}
        </div>
        <span className="lp-progress" aria-hidden="true">
          <i key={slide} className={running ? "is-running" : ""} style={{ animationDuration: `${SLIDE_MS}ms` }} />
        </span>
        <button
          type="button"
          className="icon-btn lp-pause"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play slides and moving text" : "Pause slides and moving text"}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
      </div>
    </section>
  );
}

export default function Landing() {
  const { user } = useAuth();
  const today = todayString();
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(reduced);

  return (
    <div className={`lp ${paused ? "is-paused" : ""}`}>
      <header className="lp-bar">
        <Wordmark tone="dark" />
        <nav className="lp-bar__nav" aria-label="Account">
          {user ? (
            <Link className="btn btn--primary btn--sm" to="/app">
              Open Pine
            </Link>
          ) : (
            <>
              <Link className="btn btn--secondary btn--sm" to="/login">
                Log in
              </Link>
              <Link className="btn btn--primary btn--sm" to="/register">
                Create an account
              </Link>
            </>
          )}
        </nav>
      </header>

      <main id="main">
        <Showcase today={today} user={user} paused={paused} setPaused={setPaused} />

        <section className="lp-head" aria-labelledby="hero-title">
          <h1 id="hero-title" className="lp-head__title">
            Pick your
            <br />
            seat&nbsp;—
          </h1>
          <div className="lp-head__side">
            <nav className="lp-pills" aria-label="Kinds of space">
              <Link to="/app/spaces?type=hot-desk">Hot desks</Link>
              <Link to="/app/spaces?type=meeting-room">Meeting rooms</Link>
              <Link to="/app/spaces?type=private-cabin">Cabins</Link>
              <Link to={user ? "/app/bookings" : "/login"} className="is-on">
                {user ? "My bookings" : "Log in"}
              </Link>
            </nav>
            <p className="lp-head__kicker">
              A place
              <br />
              for you
            </p>
            <p className="lp-note">Open 08:00 to 20:00 · every half hour is a seat</p>
          </div>
        </section>

        <div className="lp-grid">
          <div className="lp-col">
            <div className="lp-profile">
              <span className="lp-avatar" aria-hidden="true">
                <SeatMark size={42} />
              </span>
              <div>
                <p className="lp-profile__name">Pine · a place for you</p>
                <p className="lp-profile__tags">
                  Hot desks · meeting rooms
                  <br />
                  private cabins | by the half hour
                </p>
                <p className="lp-profile__text">
                  Members book any run of free seats.
                  <br />
                  Admins manage every space and booking.
                </p>
              </div>
            </div>
            <SeatLegend className="lp-strip" items={["free", "chosen", "taken", "mine", "past"]} />

            <h2 className="lp-caption" id="how-title">
              How booking works
            </h2>
            <ol className="lp-steps" aria-labelledby="how-title">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="lp-steps__num" aria-hidden="true">
                    0{i + 1}
                  </span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.text}</p>
                  </div>
                  <ArrowUpRight size={20} aria-hidden className="lp-steps__arrow" />
                </li>
              ))}
            </ol>
          </div>

          <div className="lp-col">
            <figure className="lp-figure">
              <div className="seat-row" aria-hidden="true">
                {DEMO.map((pair, h) => (
                  <span key={h} className="seat-row__hour">
                    {pair.map((state, k) => (
                      <i key={k} className={`seat seat--${state}`} />
                    ))}
                  </span>
                ))}
              </div>
              <div className="seat-ruler" aria-hidden="true">
                <span>10:00</span>
                <span>11:00</span>
                <span>12:00</span>
                <span>13:00</span>
              </div>
              <div className="ticket-wrap" aria-hidden="true">
                <div className="ticket ticket--demo is-upcoming">
                  <div className="ticket__stub">
                    <span>Your</span>
                    <strong>3</strong>
                    <span>seats</span>
                  </div>
                  <div className="ticket__body">
                    <p className="ticket__time">
                      <span>11:00–12:30</span>
                      <small>1 h 30 min</small>
                    </p>
                    <p className="ticket__purpose">Your ticket. Reschedule or cancel it before it starts.</p>
                  </div>
                </div>
              </div>
              <figcaption>Example: three free seats chosen, 11:00 to 12:30.</figcaption>
            </figure>

            <p className="lp-statement">
              <span>Every space has twenty-four</span>
              <span>half-hour seats a day.</span>
              <span>Pick a run of free ones,</span>
              <span>see the price, and</span>
              <span>the time is yours.</span>
            </p>

            <div className="lp-motion-head">
              <h2 id="kinds-title">Three kinds of space</h2>
              <p>Open 08:00 to 20:00. Booked by the half hour.</p>
            </div>
            <div className="lp-marquee" aria-hidden="true">
              {[0, 1, 2, 3].map((r) => (
                <div key={r} className={`lp-marquee__row ${r % 2 ? "is-reverse" : ""}`}>
                  <span>
                    {[0, 1].map((k) => (
                      <b key={k}>Hot desk · Meeting room · Private cabin · </b>
                    ))}
                  </span>
                </div>
              ))}
            </div>
            <dl className="lp-kinds" aria-labelledby="kinds-title">
              {TYPES.map(({ type, text }) => {
                const Icon = TYPE_ICONS[type];
                return (
                  <div key={type}>
                    <dt>
                      <Icon size={18} aria-hidden />
                      {typeLabel(type)}
                    </dt>
                    <dd>{text}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      </main>

      <footer className="lp-foot">
        <Wordmark tone="dark" />
        <p>Pine, a place for you. Workspace booking built with React, Node.js, Express and MongoDB.</p>
      </footer>
    </div>
  );
}
