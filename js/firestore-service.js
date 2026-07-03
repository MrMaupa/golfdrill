// js/firestore-service.js
// The ONLY module that imports Firestore read/write functions directly.
// Everything else goes through the functions exported here.

import { db, auth } from './firebase-init.js';
import { SEED_DRILLS, SEED_PLANS, SEED_VERSION } from './data.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// ---- Library reads --------------------------------------------------------

export async function fetchDrills() {
  const snap = await getDocs(collection(db, 'drills'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchPlans() {
  const snap = await getDocs(collection(db, 'readyPlans'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---- Seed / migrate -------------------------------------------------------
// Seeds SEED_DRILLS / SEED_PLANS into Firestore, and re-seeds when the local
// SEED_VERSION is newer than what was last written. The version marker lives at
// users/{uid}/meta/seed (the only place the signed-in user can write besides
// their sessions), so bumping SEED_VERSION in data.js migrates the library on
// this account's next sign-in — including new devices. Requires an auth user.
// Uses upsert-by-id: it never deletes, so drill/plan ids must stay stable.
// Returns true if it wrote anything.

export async function ensureSeeded() {
  const uid = requireUid();
  const markerRef = doc(db, 'users', uid, 'meta', 'seed');

  let storedVersion = 0;
  try {
    const marker = await getDoc(markerRef);
    if (marker.exists()) storedVersion = marker.data().version || 0;
  } catch {
    storedVersion = 0;
  }

  if (storedVersion >= SEED_VERSION) return false;

  const batch = writeBatch(db);
  for (const drill of SEED_DRILLS) {
    batch.set(doc(db, 'drills', drill.id), drill);
  }
  for (const plan of SEED_PLANS) {
    batch.set(doc(db, 'readyPlans', plan.id), plan);
  }
  await batch.commit();

  await setDoc(markerRef, { version: SEED_VERSION, updatedAt: Date.now() });
  return true;
}

// ---- Optional library CRUD (Phase 4 / console-editing convenience) --------
// The library is normally edited from the Firebase console, but these keep all
// Firestore access in one place if the app ever needs to write it.

export async function upsertDrill(drill) {
  await setDoc(doc(db, 'drills', drill.id), drill);
}

export async function upsertPlan(plan) {
  await setDoc(doc(db, 'readyPlans', plan.id), plan);
}

// ---- Sessions -------------------------------------------------------------

function requireUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in.');
  return uid;
}

// Save one finished session. Writes exactly one document; the id is duplicated
// into the field for convenience. Never called with in-progress state.
export async function saveSession(session) {
  const uid = requireUid();
  const col = collection(db, 'users', uid, 'sessions');
  const ref = await addDoc(col, { ...session });
  await setDoc(ref, { id: ref.id }, { merge: true });
  return ref.id;
}

export async function fetchSessions() {
  const uid = requireUid();
  const snap = await getDocs(collection(db, 'users', uid, 'sessions'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function deleteSession(sessionId) {
  const uid = requireUid();
  await deleteDoc(doc(db, 'users', uid, 'sessions', sessionId));
}
