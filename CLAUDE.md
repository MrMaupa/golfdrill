You are working on Golfdrill, a personal golf-practice web app for one
user (the repo owner). Follow these constraints on every change:

STACK
- Plain HTML/CSS/JS. No frameworks, no bundler, no build step, no npm
  install for the app itself. Files are served as-is by GitHub Pages.
- Firebase is loaded via ES module CDN imports
  (https://www.gstatic.com/firebasejs/<version>/firebase-*.js), imported
  directly in js/firebase-init.js. Do not introduce a bundler to change this.
- Firestore is the database. Auth is Firebase Email/Password with exactly
  one user account. No other sign-in methods, no public sign-up flow.

FILE STRUCTURE
  index.html          - app shell, loads css/style.css and js/app.js as a module
  css/style.css        - all styles
  js/data.js            - SEED_DRILLS, SEED_PLANS, filter constants (pure data)
  js/render.js          - pure helper functions (esc, filters, summary text) - no DOM, no Firebase
  js/firebase-init.js   - Firebase app/auth/db initialization only
  js/firestore-service.js - all Firestore reads/writes, nothing else imports Firestore directly
  js/app.js             - UI state, rendering, event binding, the login gate
  manifest.json, sw.js  - PWA files
  icons/                - app icons
  README.md

DATA RULES
- js/data.js is SEED data only. Once Firestore's `drills` and `readyPlans`
  collections are non-empty, the app must read from Firestore, not from
  js/data.js. js/data.js is only ever written back to Firestore once, by
  the seed routine, when those collections are empty.
- Never hardcode drill or plan content directly into app.js or index.html.
  If it's practice content, it belongs in Firestore (seeded from data.js).
- A finished practice session always writes exactly one document to
  users/{uid}/sessions/{sessionId}. Never write partial/in-progress session
  state to Firestore — the in-progress "today's plan" checklist stays in
  localStorage until "Save practice" is pressed.

STYLE
- Mobile-first, large tap targets, no dropdowns for anything the user picks
  often (use chip buttons instead).
- No console.log left in committed code. Fail quietly with a toast/UI
  message, never a silent no-op or an uncaught error.
- Keep functions small and named after what they do; this is a solo
  personal project, prefer clarity over cleverness.

WHAT NOT TO DO
- Don't add other people/multi-user support, public sign-up, or social
  features — this is single-user by design.
- Don't add a backend server or Cloud Functions unless a task explicitly
  calls for one — client -> Firestore directly, guarded by security rules,
  is sufficient for this app's scale.
- Don't change the Firebase SDK loading strategy (CDN ES modules) to npm
  without discussing it first — it's a deliberate choice to keep the repo
  buildless.
