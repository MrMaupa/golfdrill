// js/firebase-init.js
// Firebase app / auth / db initialization ONLY. No reads or writes here —
// those live in js/firestore-service.js. Loaded via CDN ES modules (no bundler).

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// ---------------------------------------------------------------------------
// REPLACE with your real Firebase web config from the Firebase console
// (Project settings -> Your apps -> SDK setup and configuration).
// Project: golfdrill-c8b05
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: 'AIzaSyCWS3eyZw2RWRTDFr8fhgAsYYx3nhBcDtI',
  authDomain: 'golfdrill-c8b05.firebaseapp.com',
  projectId: 'golfdrill-c8b05',
  storageBucket: 'golfdrill-c8b05.appspot.com',
  messagingSenderId: '614003012824',
  appId: '1:614003012824:web:17e6abcf068418132293ad',
};

const app = initializeApp(firebaseConfig);

// Auth: stay signed in between launches on this device.
export const auth = getAuth(app);
// Fire-and-forget: persistence failures shouldn't crash init; app.js surfaces
// auth problems via the login UI.
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Firestore with IndexedDB-backed offline cache. Reads serve from cache when
// offline; writes queue locally and sync on reconnect — no manual mirror code.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(),
  }),
});

export { app };
