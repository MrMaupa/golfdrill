# Golfdrill

A personal, single-user golf-practice planner. Ready-made practice plans, a
filterable drill library, a "Today's plan" checklist, and a saved practice log
with contact/confidence tracking. Plain HTML/CSS/JS (no build step), backed by
Firebase Firestore, installable on an iPhone home screen, and usable offline.

## Stack

- Plain HTML / CSS / JS — served as-is, no bundler, no build.
- Firebase via CDN ES modules (Auth + Firestore), pinned to SDK `11.0.2`.
- Firestore for data; Firebase Email/Password auth with exactly one account.
- localStorage for ephemeral in-progress state (today's plan, filters, drafts).
- PWA: `manifest.json` + `sw.js` for install + offline.

## One-time setup

### 1. Firebase config

Open `js/firebase-init.js` and replace the `REPLACE_ME_*` placeholders in
`firebaseConfig` with the real values from the Firebase console:
**Project settings → Your apps → SDK setup and configuration.**
Project: `golfdrill-c8b05`.

### 2. Firebase console (Phase 0)

1. **Firestore Database** → Create database → *production mode* → region near
   you (e.g. `eur3`).
2. **Authentication → Sign-in method** → enable **Email/Password**.
3. **Authentication → Users → Add user** → create your single account
   (email + password). There is no in-app sign-up.
4. **Firestore → Rules** → paste the rules below → Publish.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /drills/{drillId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /readyPlans/{planId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Seed data

`js/data.js` holds the seed drills/plans. The app calls a **seed-once** routine
on first sign-in: if the `drills` / `readyPlans` collections are empty, it
writes `SEED_DRILLS` / `SEED_PLANS` to Firestore. After that the app always
reads from Firestore. To change the library later, edit it in the Firebase
console (or clear the collections to re-seed from `data.js`).

> The bundled seed set is a small placeholder. Replace it with the full
> library, keeping the exact field shapes and tag vocabularies in `data.js`.

## Deploy (GitHub Pages)

1. Commit and push everything to your GitHub repo.
2. Repo **Settings → Pages** → Source: *Deploy from a branch* → branch `main`,
   folder `/ (root)` → Save.
3. Wait for the Pages build, then open the published URL
   (`https://<you>.github.io/<repo>/`).

All app paths are relative, so it works under the `/<repo>/` subpath.

## Install on iPhone

1. Open the Pages URL in **Safari**.
2. Sign in with your account (once per device — it stays signed in).
3. **Share → Add to Home Screen.**
4. Launch from the home screen — it opens standalone (no Safari address bar).

## Offline

After at least one successful online load, the app opens and runs in airplane
mode: the service worker serves the app shell from cache, and Firestore serves
data from its local IndexedDB cache. A session saved while offline is queued
and syncs automatically when the device reconnects.

**After deploying changes,** bump `CACHE` in `sw.js` (e.g. `golfdrill-v2`) so
devices pick up the new files instead of serving stale cached ones.

## Project structure

```
golfdrill/
├── index.html              app shell + PWA meta + SW registration
├── manifest.json           PWA manifest
├── sw.js                   service worker (offline app shell)
├── CLAUDE.md               project constraints / contract
├── README.md
├── css/style.css           all styles (mobile-first)
├── js/
│   ├── data.js             seed drills/plans + fixed vocabularies
│   ├── render.js           pure helpers (esc, filters, summary text)
│   ├── firebase-init.js    Firebase app/auth/db init
│   ├── firestore-service.js  all Firestore reads/writes
│   └── app.js              UI state, rendering, event binding, login gate
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

## Data model

- `drills/{id}` — public-read practice content.
- `readyPlans/{id}` — public-read ordered lists of drill ids.
- `users/{uid}/sessions/{id}` — your private practice log; one document per
  saved session (written only on "Save practice").

Single-user by design: no multi-user support, no public sign-up, no backend
server — the client talks to Firestore directly, guarded by the security rules.
