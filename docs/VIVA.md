# FLEXI: architecture and viva guide

## The project in one minute

FLEXI is a **workspace booking system**. A coworking building has hot desks, meeting rooms and private cabins. Members register, log in, find a free time on a chosen day and book it. They can later reschedule, cancel or delete bookings. Admins manage the spaces and see all bookings.

It is built with the **MERN stack**:

| Layer | Technology | Job |
|---|---|---|
| **M**ongoDB | Database | Stores users, spaces and bookings as documents |
| **E**xpress | Web framework on Node.js | Defines the REST API routes and middleware |
| **R**eact | Frontend library | The pages and components the user sees |
| **N**ode.js | JavaScript runtime | Runs the Express server |

Mongoose sits between Express and MongoDB. It gives us schemas, validation and easy queries.

## The three tiers

```
┌────────────────────────┐   HTTP + JSON    ┌───────────────────────────┐   Mongoose    ┌──────────────┐
│  React app  :5173      │ ───────────────▶ │  Express API  :5000       │ ────────────▶ │  MongoDB     │
│  pages, components,    │  GET POST PUT    │  routes → middleware →    │  find, create │  :27017      │
│  Axios services        │  PATCH DELETE    │  controllers → models     │  update, del. │  db "flexi"  │
│                        │ ◀─────────────── │                           │ ◀──────────── │              │
└────────────────────────┘   status + JSON  └───────────────────────────┘   documents   └──────────────┘
```

- The **browser never talks to MongoDB directly**. Only the server has the connection string, which keeps the database safe.
- The frontend and backend are separate apps on separate ports, so the server must allow the frontend's address with **CORS**.

## Inside the backend (request pipeline)

```
request
  → cors()            only http://localhost:5173 may call the API
  → express.json()    turns the JSON body into req.body
  → morgan('dev')     logs "POST /api/bookings 201 12 ms"
  → requireDB         503 if MongoDB is down (instead of hanging)
  → protect           reads "Authorization: Bearer <JWT>", verifies it, loads req.user
  → adminOnly         (admin routes only) 403 if role isn't admin
  → controller        business logic + Mongoose queries
  → errorHandler      every error becomes { success:false, message, errors }
```

Folders follow **MVC** without the V (React is the view):
- `models/`: what the data looks like (schemas)
- `controllers/`: what happens for each request
- `routes/`: which URL + method calls which controller

## Inside the frontend

- `pages/`: one component per screen. `components/`: reusable parts (DayStrip, Modal, Field…).
- `services/`: every API call lives here, so pages never build URLs themselves.
- `context/AuthContext.jsx`: shares the logged-in user with every page through **React Context**.
- `components/RouteGuards.jsx`: `ProtectedRoute`, `AdminRoute` and `GuestRoute` decide who may open which page.
- Hooks used: `useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`, `useRef`, React Router's `useParams`, `useSearchParams`, `useNavigate`, `useLocation`, and the custom hooks `useToast` and `useDebounce`.

---

## Likely viva questions

### Basics

**1. What is FLEXI and who uses it?**
A booking system for a coworking space. Members book desks, rooms and cabins by the half hour. Admins manage spaces and see all bookings.

**2. Why MERN?**
One language (JavaScript) end to end. JSON flows naturally from MongoDB documents to Express responses to React state. All the tools are free and widely used.

**3. What is the difference between the client and the server folder?**
`client` is the React app that runs in the browser (port 5173). `server` is the Node/Express API that runs on your machine (port 5000) and is the only part that talks to MongoDB.

**4. What is a REST API? Name the methods you used.**
REST is an architectural style where URLs name resources (`/api/bookings`) and HTTP methods say what to do: **GET** read, **POST** create, **PUT** replace or update, **PATCH** partially update (we use it for cancel), **DELETE** remove. Responses are JSON with proper status codes.

**5. Which status codes does FLEXI return and when?**
200 OK, 201 Created (new user, space or booking), 400 validation error, 401 not logged in or wrong password, 403 not an admin, 404 not found, 409 conflict (duplicate email or name, time clash), 500 unexpected error, 503 database down.

### React

**6. What is JSX?**
HTML-like syntax inside JavaScript that React compiles into `React.createElement` calls.

**7. Explain `useState` and `useEffect` with an example from your project.**
`useState` stores values that change the screen, e.g. `const [result, setResult] = useState(null)` in `Spaces.jsx`. `useEffect` runs side effects after render. We use it to call `getSpaces()` whenever the date or filters change.

**8. What is React Context and why did you use it?**
Context passes data to deep components without passing props through every level. `AuthContext` gives every page the current user and the `login`/`logout` functions.

**9. How does routing work?**
React Router maps URLs to components in `App.jsx`. Protected pages are wrapped in `<ProtectedRoute>`, which redirects to `/login` if there's no user and remembers where you wanted to go.

**10. What is the debounce hook for?**
The search box waits 350 ms after you stop typing before calling the API, so we don't send a request on every key press.

**11. What does the Axios interceptor do?**
A *request* interceptor adds `Authorization: Bearer <token>` to every request. A *response* interceptor watches for `401` and logs the user out automatically when the token is no longer valid.

### Backend and security

**12. What is middleware in Express?**
A function `(req, res, next)` that runs before the route handler. It can read or modify the request, stop it with a response, or call `next()`. Examples: `cors`, `express.json`, `protect`, `adminOnly`, `errorHandler`.

**13. How does authentication work?**
On register or login, the server checks the data, then creates a **JWT** signed with `JWT_SECRET` that contains the user id and role. The client stores the token and sends it in the `Authorization` header. `protect` verifies the signature and loads the user from MongoDB. A tampered or expired token gives `401`.

**14. How are passwords stored?**
Never as plain text. A Mongoose `pre('save')` hook hashes them with **bcrypt** (10 salt rounds). At login, `bcrypt.compare` checks the typed password against the hash. The schema has `select: false` so the hash is never sent back.

**15. Why the same message for "wrong email" and "wrong password"?**
So an attacker can't find out which emails are registered.

**16. Can a user make themselves admin by sending `role: "admin"` when registering?**
No. The register controller always sets `role: "member"`. Admins are created by the seed script. (There's a test for this.)

**17. What is CORS?**
Browsers block a page from calling a different origin (here `:5173` → `:5000`) unless the server allows it. `cors({ origin: CLIENT_URL })` allows only our React app.

**17b. What does the Vite proxy do, and why do you need it?**
In development the React app runs on `localhost:5173` and the API on `localhost:5000`. Instead of the browser calling port 5000 directly, the app calls `/api` on its own address, and Vite's dev server forwards it to `http://127.0.0.1:5000` (`server.proxy` in `vite.config.js`). The browser only ever talks to one address, so there are no CORS problems, and browsers or ad-blockers that block pages from calling other `localhost` ports (we hit exactly this on Windows, `ERR_BLOCKED_BY_CLIENT`) have nothing to block.

**18. Why keep secrets in `.env`?**
So passwords and keys aren't in the code or on GitHub. `dotenv` loads them into `process.env`. Only `.env.example` with placeholder values is committed.

**19. What happens if MongoDB stops while the server is running?**
The `requireDB` middleware answers `503` with a clear message instead of letting requests hang, `/api/health` shows `disconnected`, and Mongoose reconnects automatically when MongoDB is back.

### MongoDB and Mongoose

**20. What is the difference between MongoDB and SQL databases?**
MongoDB stores flexible JSON-like **documents** in **collections** instead of rows in tables, and doesn't need a fixed schema. Mongoose adds a schema in our code for validation and structure.

**21. What is a schema and a model?**
A **schema** describes a document's fields, types and validation rules. A **model** (`mongoose.model('Booking', schema)`) is the class we use to query that collection: `Booking.find()`, `Booking.create()`, etc.

**22. How are users, spaces and bookings related?**
A booking stores `user` and `space` as `ObjectId` references. One user has many bookings and one space has many bookings. `populate()` replaces the ids with the actual user and space documents when we read bookings.

**23. How do you stop double bookings?**
Before saving, the server loads that space's confirmed bookings for the same date and checks for overlap: two ranges overlap when `newStart < existingEnd && existingStart < newEnd`. A match returns `409`. Back-to-back bookings (10:00–11:00 then 11:00–12:00) are allowed because `11:00 < 11:00` is false. The same check also stops one person from holding two spaces at once.

**24. Why store dates as `"YYYY-MM-DD"` and times as `"HH:MM"` strings?**
They sort correctly as text (`"09:30" < "10:00"`), they're easy to compare and display, and they avoid time-zone shifts that happen with `Date` objects. The trade-off is that the server must validate the format, which the schema regex does.

**25. What indexes did you add and why?**
Unique indexes on `users.email` and `spaces.name` stop duplicates at the database level. A compound index on `bookings {space, date, status}` makes the clash check fast.

**26. Where did you use an aggregation pipeline?**
The admin overview's "This month by space type": `$match` this month's confirmed bookings → `$lookup` the space → `$unwind` → `$group` by space type, counting bookings and summing revenue → `$sort`.

**27. How does pagination work?**
The client sends `page` and `limit`. The server uses `.skip((page-1)*limit).limit(limit)` and `countDocuments()` for the total, then returns `{ page, limit, total, pages }`.

### Design decisions and limits

**28. Isn't storing the token in localStorage against "no localStorage"?**
The rule is about *data*. All users, spaces and bookings are stored in MongoDB and fetched from the API. The token only remembers *who* is logged in, so a refresh doesn't log you out. An httpOnly cookie would be safer against XSS, and it's a possible improvement.

**29. What if two people click "Book" for the same slot at the exact same millisecond?**
Both checks could pass before either save finishes (a race condition). The UI already handles the more common case, where someone books while you're filling the form: the server returns `409` and the strip refreshes. For full protection under heavy load you would use a MongoDB transaction, or store each half-hour slot as a document with a unique index.

**30. What would you add next?**
Email confirmations, recurring bookings, a weekly calendar view, check-in by QR code, payments, and deployment (e.g. frontend on Vercel or Netlify, API on Render, database on MongoDB Atlas).

**31. How did you test it?**
26 automated API tests (`npm run test:api`) run against the real server and database and cover every rule. A browser end-to-end test registered a user, booked, refreshed, rescheduled, triggered a clash, cancelled, deleted, and ran the admin add/edit/delete flow, checking MongoDB after each step. I also checked the app's behaviour when MongoDB or the API is down.
