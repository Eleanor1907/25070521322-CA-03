# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Members of a coworking space**: freelancers and small teams who drop in for a few hours or a day. They book a hot desk, a meeting room or a private cabin by the half hour, usually on a laptop between other work, and later reschedule or cancel.
- **The space admin**: the person at the front desk who adds and edits spaces, closes a space for booking, and keeps an eye on every member's bookings and on how busy the building is today.
- Pine is also a college full-stack project (CA-03). It is demonstrated live on a Windows laptop and examined in a viva, so an evaluator watching the screen is a real secondary audience.

## Product Purpose

Let a member see which spaces are free on a given day, book a gap between 08:00 and 20:00 in half-hour steps without clashing with anyone, and manage those bookings afterwards. Success means a booking takes under a minute, a clash is visible before submitting, and every change is really saved in MongoDB.

## Positioning

Availability first: every space's whole day is visible at a glance as booked and free time, and the same clash rules (space overlap, one person in two places, capacity, opening hours, past times) are enforced in the interface before submit and again by the server.

## Operating Context

- Started with `START-FLEXI.bat` on the user's Windows laptop; React (Vite) client on port 5173, Express API on 5000 behind a Vite proxy, local MongoDB checked in MongoDB Compass during the demo.
- Prices in Indian rupees; dates and times in the computer's local time (India).
- Demo data comes from `server/seed.js`: eight spaces (The Aurora Desk, The Loggia Desk, The Meridian Desk, The Sable Room, The Sovereign Room, The Regent Boardroom, The Ivory Study, The Onyx Study; renamed from the earlier placeholder names, which `npm run seed` renames in place), an admin and a member account, and sample bookings.
- Often shown on a laptop screen or a classroom projector.

## Capabilities and Constraints

- Register and log in (JWT; bcrypt-hashed passwords). Roles: member and admin.
- Members: find spaces by day, search, type, people and sort, with pagination; book; reschedule; cancel; delete past or cancelled bookings; overview of next booking and monthly hours and spend.
- Admins: add, edit, close and delete spaces (deleting is refused while upcoming bookings exist); see and filter all bookings; building occupancy today; bookings by space type this month.
- Public landing page with a live "today" board from the API.
- Constraints: keep the REST API and response formats unchanged; React with plain CSS (no CSS framework); lucide-react icons; fonts bundled locally because lab machines may be offline; no fake or hard-coded data on screens.

## Brand Commitments

- The product name is **Pine**.
- The user chose to replace the previous visual identity entirely; no earlier colours, type or motifs are binding.
- Voice: plain, direct, friendly; sentence case; errors say what happened and how to fix it.
- Visual reference (October 2026): a dark editorial layout supplied by the owner as a video. Motion is limited to the home page's slide glitch and type marquee; both stop for reduced motion, and one pause button stops both.

## Evidence on Hand

- Real application data from the API and MongoDB (seeded demo content is synthetic and should be read as demo data).
- Screenshots in `docs/screenshots/`.
- There are no customers, testimonials, pricing plans, partner logos or usage statistics. Never invent them.

## Product Principles

1. Availability is the first thing anyone sees.
2. Show a clash before the user submits, never only after.
3. Every action gets visible feedback, and the reversible step (cancel) comes before the irreversible one (delete).
4. Calm and readable in a live demo: clarity beats spectacle.
5. Only real data on screen.

## Accessibility & Inclusion

- Readable on a projector: strong contrast, generous type sizes.
- Fully usable with a keyboard, visible focus, respects reduced motion.
