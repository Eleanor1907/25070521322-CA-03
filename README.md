# Pine: a place for you

CA-03 full-stack project, PRN 25070521322.

> The app was renamed from **FLEXI** to **Pine** (tagline: *a place for you*). Behind the scenes some names stay as they were so existing data keeps working: the database is still called `flexi`, the demo logins are still `@flexi.com`, and the launchers are still `START-FLEXI.bat` and `CHECK-FLEXI.bat`.

Pine lets people book a **hot desk, a meeting room or a private cabin by the half hour**.
Members see each space's day like a cinema seat map, where every half hour from 08:00 to 20:00 is a seat. They pick a run of free seats, and each booking becomes a ticket they can reschedule or cancel.
Admins add and edit spaces and see every booking in the building.

It is a full-stack **MERN** project: **React** (frontend) → **Express/Node.js** REST API (backend) → **MongoDB** (database, through Mongoose).
Every screen reads and writes real MongoDB data. Nothing is hard-coded or stored only in the browser.

![Pine home page with the live "Today at Pine" board](docs/screenshots/01-home.png)

## Quick start (Windows)

> Pine is a web app, not a file you open. Double-clicking `index.html` or the zip won't run it. It needs **Node.js** and **MongoDB** installed, and then two small servers running.

1. Install **Node.js LTS** (https://nodejs.org) and **MongoDB Community Server** (https://www.mongodb.com/try/download/community, Windows x64 `.msi`, choose *Complete*, keep **Install MongoD as a Service** and **Install MongoDB Compass** ticked).
2. Unzip Pine (right-click → **Extract All…**). Don't run it from inside the zip.
3. Double-click **`START-FLEXI.bat`**. The first time, it installs the packages, checks MongoDB, adds demo data, starts the API and the React app in two windows, and opens http://localhost:5173.
4. Log in with `riya@flexi.com` / `Member@123` (member) or `admin@flexi.com` / `Admin@123` (admin).

To stop Pine, close the two windows. To start it again, double-click `START-FLEXI.bat`. The manual way, with every command explained, is in [section 4](#4-setup-on-windows-step-by-step).

---

## Contents

1. [Features](#1-features)
2. [How this meets the CA-03 brief](#2-how-this-meets-the-ca-03-brief)
3. [Project structure](#3-project-structure)
4. [Setup on Windows (step by step)](#4-setup-on-windows-step-by-step)
5. [MongoDB Compass: see your data](#5-mongodb-compass-see-your-data)
6. [Using MongoDB Atlas instead (optional)](#6-using-mongodb-atlas-instead-optional)
7. [Environment variables](#7-environment-variables)
8. [API endpoints](#8-api-endpoints)
9. [Database design](#9-database-design)
10. [How the frontend, backend and database talk](#10-how-the-frontend-backend-and-database-talk)
11. [Testing](#11-testing)
12. [Push to GitHub (as shown in class)](#12-push-to-github-as-shown-in-class)
13. [Troubleshooting](#13-troubleshooting)
14. [Viva preparation](#14-viva-preparation)

---

## 1. Features

**Everyone**
- Home page with a live **"Today at Pine" board**: every space and when it's booked today, read from MongoDB.
- **Register** and **log in** (passwords hashed with bcrypt, sessions use a JWT).

**Members**
- **Find a space**: pick a day, search by name or floor, filter by type and number of people, sort by name, price or seats, and page through the results. Filters stay in the URL, so a refresh keeps them.
- **Book**: a seat map shows the day as three rows of half-hour seats (morning, afternoon, evening). Click a start seat and then an end seat, or drag across seats; arrow keys and the From/To boxes work too. Taken seats can't be picked. The form checks clashes, opening hours (08:00–20:00), past times, capacity and purpose before sending, and shows the cost.
- **My bookings**: every booking is a ticket. Upcoming / Past / Cancelled / All tabs, search, sort and pagination.
  - **Reschedule** (edit) an upcoming booking.
  - **Cancel** it, which frees the slot for others.
  - **Delete** past or cancelled bookings.
- **Overview**: your next booking and this month's hours and spending.

**Admins**
- **Manage spaces**: add, edit and delete spaces, or close one for booking. Validation applies, and a space with upcoming bookings can't be deleted.
- **All bookings**: every member's bookings with search (member, email, space, purpose), a day filter, tabs, and cancel or delete actions.
- **The building today**: occupancy, today's board, and this month's bookings by space type (a MongoDB aggregation).

**Quality details**
- One visual system, written down in [`DESIGN.md`](DESIGN.md): a dark editorial look (black page, grey frames, wide uppercase headings, neon-green accent and pill buttons) taken from a reference video, seat colours that always mean the same thing (free, taken, yours, your choice, passed), and booking tickets.
- Loading skeletons, empty and error states (with Try again) on every page, toast notifications, and confirm dialogs before every cancel or delete.
- Responsive layout from phone to desktop (on phones the booking total and Confirm button stay pinned to the bottom of the screen).
- Accessible: full keyboard use (including the seat map), visible focus, screen-reader labels, colour contrast checked to WCAG AA, and reduced motion respected.
- Clear messages when the API or MongoDB is down; the API keeps running and recovers when MongoDB comes back.

| Find a space | Book | My bookings |
|---|---|---|
| ![](docs/screenshots/02-find-a-space.png) | ![](docs/screenshots/03-book.png) | ![](docs/screenshots/04-my-bookings.png) |

| Admin overview | Manage spaces | Phone |
|---|---|---|
| ![](docs/screenshots/05-admin-overview.png) | ![](docs/screenshots/06-admin-spaces.png) | ![](docs/screenshots/07-phone.png) |

---

## 2. How this meets the CA-03 brief

The lab video (CA-03) asked for:

| Requirement from the video | Where it is in Pine |
|---|---|
| A folder named with your **PRN**, containing `client` and `server` | Rename `FLEXI/` to your PRN (see [section 12](#12-push-to-github-as-shown-in-class)). Inside are `client/` and `server/`. |
| `client` = React application | `client/`: React 19 + Vite + React Router + Axios |
| `server` = Node.js application | `server/`: Express 4 REST API |
| Client and server connected through an API: **POST, GET, UPDATE, DELETE** | Every feature uses the API. See the [endpoint list](#8-api-endpoints): `POST /bookings`, `GET /bookings`, `PUT /bookings/:id`, `PATCH /bookings/:id/cancel`, `DELETE /bookings/:id`, and the same for spaces |
| **Authentication**: user registers, then logs in with correct credentials | `/register` and `/login` pages, `POST /api/auth/register`, `POST /api/auth/login`, JWT-protected routes |
| Server connected to **MongoDB**, checked in **Compass** | Mongoose models `User`, `Space`, `Booking`; database `flexi` ([section 5](#5-mongodb-compass-see-your-data)) |
| Push to a **public GitHub repo named `<PRN>-CA-03`** and check the link | [Section 12](#12-push-to-github-as-shown-in-class) |

---

## 3. Project structure

```
FLEXI/                          <- rename to your PRN before submitting
├── client/                     React frontend (Vite)
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── components/         Reusable UI: AppShell, Seats (SeatRow, SeatMap), Ticket, DatePicker,
│   │   │                       Field, Modal, ConfirmDialog, SpaceForm, Pagination, RouteGuards, ...
│   │   ├── context/AuthContext.jsx   Who is logged in (shared with every page)
│   │   ├── hooks/              useToast (notifications), useDebounce (search box)
│   │   ├── pages/              Landing, Login, Register, Overview, Spaces, BookSpace,
│   │   │                       MyBookings, AdminSpaces, AdminBookings, NotFound
│   │   ├── services/           api.js (Axios setup) + authService, spaceService, bookingService
│   │   ├── styles/             tokens.css (colours, type, spacing), base.css, layout.css,
│   │   │                       components.css, seats.css (seats and tickets), pages.css
│   │   ├── utils/              format.js (date, time, money), seats.js (seat states), typeIcons.js
│   │   ├── App.jsx             All routes
│   │   └── main.jsx            Starts React
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                     Express + Mongoose backend
│   ├── config/db.js            MongoDB connection
│   ├── controllers/            authController, spaceController, bookingController
│   ├── middleware/             auth (JWT + admin check), requireDB, errorHandler
│   ├── models/                 User, Space, Booking (Mongoose schemas)
│   ├── routes/                 authRoutes, spaceRoutes, bookingRoutes
│   ├── tests/api.test.js       26 automated API tests
│   ├── utils/                  asyncHandler, httpError, query (search/pagination), time
│   ├── seed.js                 Demo data (spaces, admin, member, bookings)
│   ├── server.js               Entry point
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── VIVA.md                 Architecture explained + viva questions and answers
│   └── screenshots/
├── .gitignore                  Keeps node_modules and .env out of Git
├── package.json                Shortcuts: install:all, seed, server, client, test:api
├── START-FLEXI.bat             One-click start on Windows (install, check, seed, run, open)
└── README.md
```

---

## 4. Setup on Windows (step by step)

### 4.1 Install the tools (once)

| Tool | Where | Notes |
|---|---|---|
| **Node.js LTS** (v20 or v22) | https://nodejs.org | Includes `npm`. Check with `node -v` and `npm -v`. |
| **MongoDB Community Server** | https://www.mongodb.com/try/download/community | In the installer keep **"Install MongoD as a Service"** ticked so MongoDB starts with Windows. Tick **"Install MongoDB Compass"** too. |
| **MongoDB Compass** | Comes with the installer above, or https://www.mongodb.com/try/download/compass | GUI to look at the database. |
| **Git** | https://git-scm.com | For pushing to GitHub. |
| **Visual Studio Code** | https://code.visualstudio.com | Open the project folder in VS Code. |

> After installing Node.js, **close and reopen VS Code** so the terminal finds `npm`.

### 4.2 Open the project

1. Unzip the project, for example to `C:\Users\<you>\Desktop\FLEXI`.
2. In VS Code: **File → Open Folder…** and choose the `Pine` folder.
3. Open a terminal: **Terminal → New Terminal** (PowerShell).

### 4.3 Install dependencies

```powershell
cd server
npm install
cd ..\client
npm install
cd ..
```

(Or run the shortcut `npm run install:all` from the `Pine` folder.)

### 4.4 Create the `.env` files

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Open `server/.env` and change `JWT_SECRET` to any long random text, for example `flexi-ca03-9f3a2c7e1b5d4a8e`. The other defaults work for a local MongoDB.

### 4.5 Make sure MongoDB is running

If you installed MongoDB as a service, it's already running. To check: press `Win + R`, type `services.msc`, find **MongoDB Server**, and make sure its status is **Running** (right-click → Start if not).

### 4.6 Add the demo data (recommended)

```powershell
cd server
npm run seed
```

This creates 8 spaces, some bookings and two accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@flexi.com` | `Admin@123` |
| Member | `riya@flexi.com` | `Member@123` |

Running it again never duplicates anything. `npm run seed -- --reset` **deletes** all Pine users, spaces and bookings and starts fresh.

### 4.7 Start the app (two terminals)

**Terminal 1: backend**

```powershell
cd server
npm run dev
```

You should see:

```
MongoDB connected: 127.0.0.1/flexi
Pine API running at http://localhost:5000/api
```

**Terminal 2: frontend** (click **+** in the VS Code terminal panel to open another one)

```powershell
cd client
npm run dev
```

You should see `Local: http://localhost:5173/`.

### 4.8 Open it

| What | URL |
|---|---|
| The app | http://localhost:5173 |
| API health check | http://localhost:5000/api/health (shows `"database":"connected"`) |
| Public board (JSON) | http://localhost:5000/api/spaces/board |

Register a new account, or log in with a demo account. Keep both terminals open while you use the app.

---

## 5. MongoDB Compass: see your data

1. Open **MongoDB Compass** and click **New connection**.
2. URI: `mongodb://127.0.0.1:27017`, then click **Connect**.
3. Open the database **`flexi`**. It appears after the seed script or the first registration. It has three collections:
   - `users`: name, email, **hashed** password, role
   - `spaces`: name, type, capacity, floor, hourlyRate, amenities, isActive
   - `bookings`: user, space, date, startTime, endTime, attendees, purpose, status, totalCost

**Prove the full-stack flow during your demo:**

1. In the app, book a space (e.g. *The Sable Room*, tomorrow, 14:00–15:00).
2. In Compass, open `bookings` and click **Refresh**. The new document is there, with your user's `_id` and the space's `_id`.
3. In the app, reschedule it to 16:00, then refresh Compass: `startTime` changed.
4. Cancel it: `status` becomes `"cancelled"`. Delete it: the document is gone.
5. Refresh the browser page: everything you see is loaded again from MongoDB.

---

## 6. Using MongoDB Atlas instead (optional)

1. Create a free account at https://www.mongodb.com/atlas and create a free **M0** cluster.
2. **Database Access** → add a database user with a username and password.
3. **Network Access** → **Add IP Address** → *Allow access from anywhere* (`0.0.0.0/0`) for a class demo, or your current IP.
4. **Connect → Drivers** → copy the connection string.
5. In `server/.env` replace `MONGODB_URI`, and **add `/flexi` before the `?`**:

```
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abcde.mongodb.net/flexi?retryWrites=true&w=majority
```

6. Restart the backend and run `npm run seed` again. In Compass, connect with the same `mongodb+srv://...` string.

> If your password has special characters like `@`, `#` or `%`, URL-encode them (e.g. `@` → `%40`), or choose a password without them.

---

## 7. Environment variables

**`server/.env`** (secret, never commit it)

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `5000` | Port of the Express API |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/flexi` | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | long random text | Signs login tokens; anyone with it could fake logins |
| `JWT_EXPIRES_IN` | `7d` | How long a login lasts |
| `CLIENT_URL` | `http://localhost:5173` | The React address allowed by CORS (comma-separate several) |

**`client/.env`**

| Variable | Example | Purpose |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` | Only for a production build. In development the app calls `/api` on its own address and Vite forwards it to the backend (the `proxy` in `client/vite.config.js`), so there is nothing to configure. |

> Only variables starting with `VITE_` reach the browser, so the database string and JWT secret stay on the server. After editing a `.env` file, restart that terminal's `npm run dev`.

---

## 8. API endpoints

Base URL: `http://localhost:5000/api`. 🔒 = needs `Authorization: Bearer <token>`. 👑 = admin only.

### Auth

| Method | Endpoint | Body / query | Result |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` | `201` `{ token, user }` · `400` invalid · `409` email taken |
| POST | `/auth/login` | `{ email, password }` | `200` `{ token, user }` · `401` wrong email or password |
| GET 🔒 | `/auth/me` | — | `200` `{ user }` · `401` |

### Spaces

| Method | Endpoint | Body / query | Result |
|---|---|---|---|
| GET | `/spaces/board?date=` | — | Public: today's board (spaces + booked slots, no personal data) |
| GET | `/spaces/meta` | — | Lists of space types, amenities and opening hours |
| GET 🔒 | `/spaces` | `search, type, minCapacity, sort (name, price-asc, price-desc, capacity-desc, newest), page, limit, date, includeInactive` | `200` `{ data, pagination, date, hours }`, where each space has `bookedSlots` for `date` |
| GET 🔒 | `/spaces/:id?date=&excludeBooking=` | — | One space with its booked slots for that day |
| POST 🔒👑 | `/spaces` | `{ name, type, capacity, floor, hourlyRate, amenities[], description, isActive }` | `201` · `400` validation · `409` duplicate name |
| PUT 🔒👑 | `/spaces/:id` | any of the fields above | `200` · `409` if new capacity is below an upcoming booking |
| DELETE 🔒👑 | `/spaces/:id` | — | `200` · `409` if it has upcoming bookings |

### Bookings

| Method | Endpoint | Body / query | Result |
|---|---|---|---|
| GET 🔒 | `/bookings` | `scope (upcoming, past, cancelled, all), search, sort (date-asc, date-desc, newest, cost-desc), page, limit, space, date, all=true (admin: everyone's)` | `200` `{ data, pagination }` |
| GET 🔒 | `/bookings/summary` | — | Dashboard numbers (admins also get building stats) |
| GET 🔒 | `/bookings/:id` | — | One booking (own, or any for admins) · `404` |
| POST 🔒 | `/bookings` | `{ space, date: "YYYY-MM-DD", startTime: "HH:MM", endTime: "HH:MM", attendees, purpose }` | `201` · `400` rule broken · `409` time clash |
| PUT 🔒 | `/bookings/:id` | any of the booking fields | `200` (re-checks every rule) · `400` · `409` |
| PATCH 🔒 | `/bookings/:id/cancel` | — | `200` status → `cancelled` |
| DELETE 🔒 | `/bookings/:id` | — | `200` removed from MongoDB |

### Other

| Method | Endpoint | Result |
|---|---|---|
| GET | `/health` | `{ api: "running", database: "connected" \| "disconnected" }` |

**Error format (always the same):**

```json
{ "success": false, "message": "Please fix the highlighted fields.", "errors": { "endTime": "End time must be after the start time." } }
```

Status codes used: `200` OK, `201` Created, `400` Bad request/validation, `401` Not logged in, `403` Not allowed (not admin), `404` Not found, `409` Conflict (duplicate or time clash), `500` Server error, `503` Database not reachable.

**Booking rules enforced by the server:**
- Half-hour slots between 08:00 and 20:00, and the end must be after the start.
- No dates in the past, and no start times that have already passed today.
- Number of people ≤ the space's capacity, and the space must be open.
- No overlap with another confirmed booking of the same space (back-to-back is fine).
- The same person can't hold two spaces at the same time.

---

## 9. Database design

```
 ┌──────────────┐ 1        * ┌────────────────┐ *        1 ┌──────────────┐
 │    users     │───────────▶│    bookings    │◀───────────│    spaces    │
 ├──────────────┤            ├────────────────┤            ├──────────────┤
 │ _id          │            │ _id            │            │ _id          │
 │ name         │            │ user  → users  │            │ name (unique)│
 │ email (uniq) │            │ space → spaces │            │ type         │
 │ password*    │            │ date "YYYY-MM-DD"           │ capacity     │
 │ role         │            │ startTime "HH:MM"           │ floor        │
 │ createdAt    │            │ endTime   "HH:MM"           │ hourlyRate   │
 │ updatedAt    │            │ attendees      │            │ amenities[]  │
 └──────────────┘            │ purpose        │            │ description  │
   * bcrypt hash,            │ status         │            │ isActive     │
     never returned          │ totalCost      │            │ timestamps   │
                             │ timestamps     │            └──────────────┘
                             └────────────────┘
```

- **One user → many bookings**, **one space → many bookings**. A booking stores the `ObjectId` of its user and space (a *reference*), and `populate()` fills in their details when we read it.
- **Indexes**: `users.email` and `spaces.name` are unique. `bookings {space, date, status}` makes the clash check fast.
- **Validation** lives in the Mongoose schemas (required fields, min/max, enums, regex for date and time) plus extra business rules in `bookingController.checkBookingRules`.
- `timestamps: true` adds `createdAt` and `updatedAt` automatically.

---

## 10. How the frontend, backend and database talk

Example: **a member clicks "Confirm booking"**

```
 React (browser)                    Express API (Node.js)                  MongoDB
 ────────────────                   ─────────────────────                  ───────
 BookSpace.jsx handleSubmit()
  1. validates the form (times,
     people, purpose, clash)
  2. bookingService.createBooking()
     Axios POST /api/bookings ──────▶ (Vite dev proxy :5173 → :5000)
                                       3. cors(), express.json()
     + header Authorization:           4. requireDB  (503 if DB down)
       Bearer <JWT>                    5. protect    (verify JWT, load user) ──▶ users.findById
                                       6. createBooking controller
                                          checkBookingRules():
                                          - time rules, capacity, open space ──▶ spaces.findById
                                          - overlap with other bookings      ──▶ bookings.find
                                       7. Booking.create()  (schema validation) ─▶ insertOne
                                  ◀──── 8. 201 { success, message, data }
  9. toast "Booked The Sable Room on …"
 10. navigate to My bookings
     → GET /api/bookings ───────────▶ listBookings → bookings.find + populate ─▶
                                  ◀──── JSON list
 11. page shows the saved booking. Refreshing repeats step 10, so data always comes from MongoDB.
```

If something fails (e.g. a clash), the API answers `409` with a message. `parseApiError()` turns it into the red notice, and the seat map reloads to show the seats that were just taken.

**Login flow**: `/auth/login` checks the bcrypt hash and returns a **JWT**. The React app keeps the token in `localStorage` (only the token, never app data) and an Axios *interceptor* adds it to every request. If the server answers `401`, the interceptor logs you out and sends you to the login page.

---

## 11. Testing

### Automated API tests (26 tests)

With MongoDB and the backend running and the seed done, open a third terminal:

```powershell
cd server
npm run test:api
```

They cover: registration validation and duplicates, login, JWT protection, admin-only routes, space validation and CRUD, search, filter, sort and pagination, every booking rule (past date, end before start, outside opening hours, off-grid times, capacity, missing purpose, bad id), clashes, back-to-back bookings, double-booking a person, reschedule, cancel (freeing the slot), delete, privacy between members, the admin view, the dashboard summary, the public board, and 404 and broken-JSON handling. The tests create their own data and delete it afterwards.

### What was verified while building

| Check | Result |
|---|---|
| `npm run test:api` (26 API tests against real MongoDB 7.0) | ✅ 26/26 passed |
| Browser end-to-end test (Playwright, 25 steps): live home board → register → filter/search → book by clicking seats → refresh → reschedule → clash caught on submit → drag and keyboard seat picking → a drag stopping at a taken seat → cancel → delete → admin add/edit/delete space → admin search → phone menu with no sideways scrolling → logout and session expiry. Each step was checked directly in MongoDB | ✅ 25/25 passed |
| Accessibility scan (axe-core, WCAG 2.1 A and AA rules) on 10 screens at desktop and phone width | ✅ 0 violations |
| Data survives restarting both the API and MongoDB | ✅ |
| MongoDB stopped while the API runs: requests get a clear `503`; the API reconnects when MongoDB is back | ✅ |
| API started without MongoDB: exits with a clear message | ✅ |
| API stopped while the UI is open: the page shows "Can't reach the Pine server…" | ✅ |
| Production build (`npm run build` in client) and linter (`npm run lint`) | ✅ no errors (8 style warnings about loading data inside effects) |
| Layout at 1440 px desktop, 820 px tablet and 390 px phone, no console errors | ✅ |

**Not tested here** (my environment was Linux without a GUI or internet access to Atlas): running on Windows itself, the Compass GUI (I checked the same collections with the MongoDB driver instead), and a MongoDB Atlas connection. The steps in sections 4–6 are the standard ones. If anything differs on your laptop, check [Troubleshooting](#13-troubleshooting).

### Manual demo checklist

- [ ] Register a new user → document appears in `users` (password is a hash)
- [ ] Wrong password → "Email or password is incorrect."
- [ ] Book a space → document in `bookings`; refresh the page → still there
- [ ] Pick From/To times that overlap someone else's booking → the chosen seats turn red and booking is blocked
- [ ] Reschedule → `startTime`/`endTime` change in Compass
- [ ] Cancel → `status: "cancelled"`; Delete → document removed
- [ ] Log in as admin → add a space, edit its rate, delete it (check Compass each time)
- [ ] Stop the backend terminal → the UI shows the "can't reach the server" message

---

## 12. Push to GitHub (as shown in class)

1. **Rename the folder** to your PRN, e.g. `Pine` → `25070521XXX`. The code doesn't depend on the folder name.
2. On GitHub: **New repository** → name **`<PRN>-CA-03`** (e.g. `25070521XXX-CA-03`) → **Public** → no README, .gitignore or license → **Create repository**.
3. In VS Code's terminal, inside your PRN folder:

```powershell
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<PRN>-CA-03.git
git push -u origin main
```

4. Open the repo link in **a different browser** (or a private window) to make sure it's public and shows `client` and `server`. Then submit that link.

Notes:
- The `.gitignore` keeps **`node_modules`** and **`.env`** out of Git. This makes the push small and fast, and the class demo's `HTTP 408 … the remote end hung up unexpectedly` error happened while pushing ~1,800 files including `node_modules`. Anyone can recreate them with `npm install`. If your teacher specifically wants `node_modules` in the repo, remove that line from `.gitignore`.
- If the push still fails with `RPC failed; HTTP 408`, run `git push -u origin main` again. On a slow network, also try `git config http.postBuffer 524288000`.
- **Never push `server/.env`**. It holds your JWT secret and, with Atlas, your database password. `.env.example` is safe to push.

---

## 13. Troubleshooting

| Problem | Fix |
|---|---|
| "It's not opening" / blank page | Don't open `index.html` or files inside the zip. Unzip first, make sure MongoDB is installed, then run `START-FLEXI.bat` (or the two `npm run dev` commands) and open http://localhost:5173. |
| `START-FLEXI.bat` says MongoDB is not running | Install MongoDB Community Server (Quick start, step 1). If it's installed: `Win + R` → `services.msc` → **MongoDB Server** → Start. |
| `npm : The term 'npm' is not recognized` | Install Node.js LTS, then close and reopen VS Code. |
| `npm.ps1 cannot be loaded because running scripts is disabled` | In PowerShell run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` and answer `Y`, or switch the VS Code terminal to **Command Prompt**. |
| Backend says `Could not connect to MongoDB … ECONNREFUSED 127.0.0.1:27017` | MongoDB isn't running. Open `services.msc` → **MongoDB Server** → Start. Or in an admin terminal: `net start MongoDB`. |
| `connect ECONNREFUSED ::1:27017` | Use `127.0.0.1` instead of `localhost` in `MONGODB_URI` (Node prefers IPv6 for "localhost"). |
| `JWT_SECRET is missing` / `MONGODB_URI is missing` | You haven't created `server/.env`. Do step 4.4. |
| `Port 5000 is already in use` | Close the other server, or set `PORT=5001` in `server/.env`, then start the client with `set FLEXI_API_TARGET=http://127.0.0.1:5001` before `npm run dev` (Command Prompt), and restart both. |
| Page shows "Can't reach the Pine server" | The **Pine server (API)** window was closed or crashed. Run `START-FLEXI.bat` again (or `npm run dev` in `server`) and keep that window open. What it printed is saved in `server/flexi-server.log`, and `CHECK-FLEXI.bat` writes a full report to `diagnostics.txt`. |
| Browser console shows `ERR_BLOCKED_BY_CLIENT` or a **CORS** error | Make sure you have the latest `client/vite.config.js` and `client/src/services/api.js`. The app should call `/api` on port 5173 (same address), never `localhost:5000` directly. Browsers like Brave and ad-blockers block pages that call a different `localhost` port. |
| Demo login doesn't work | Run `npm run seed` in `server` (with the backend's MongoDB running). |
| "Please log in to continue" all the time | Your token expired or `JWT_SECRET` changed. Log in again. |
| Atlas: `bad auth` / `Authentication failed` | Wrong database user or password in the URI, or special characters not URL-encoded. |
| Atlas: timeout / `Could not connect to any servers` | Add your IP (or `0.0.0.0/0`) under **Network Access**. College Wi-Fi may block port 27017, so try a phone hotspot. |
| Changed a `.env` value but nothing happened | Restart that `npm run dev`. Vite reads `.env` only at start. |
| Compass doesn't show the `flexi` database | It appears after the first write. Run the seed or register a user, then click **Refresh** in Compass. |
| After updating Pine the page says `Failed to resolve import "@fontsource-variable/..."` | The new fonts aren't installed yet. Run `START-FLEXI.bat` again (it installs them), or run `npm install` inside the `client` folder. |
| Times or "today" look wrong | Check your laptop's date, time and time zone. Pine uses the computer's local time. |
| `git push` → `HTTP 408` / `RPC failed` | Run the push again (see section 12). |

---

## 14. Viva preparation

See **[docs/VIVA.md](docs/VIVA.md)** for a plain-language architecture walkthrough and likely viva questions with answers.

---

### Tech stack

React 19 · React Router 7 · Axios · Vite · lucide-react icons · Archivo font with its width axis (bundled, works offline) · Node.js · Express 4 · Mongoose 8 · MongoDB · JSON Web Tokens · bcryptjs · dotenv · cors · morgan · nodemon
