// js/render.js
// Pure helper functions only. No DOM access, no Firebase. Everything here is
// a plain input -> output function so it can be unit-tested under Node.

import { ALL_CLUBS } from './data.js';

// Escape a string for safe insertion into HTML.
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Does a drill match a single active filter? Empty/falsy filter = no constraint.
function matchesClub(drill, club) {
  if (!club) return true;
  if (Array.isArray(drill.clubs) && drill.clubs.includes(ALL_CLUBS)) return true;
  return Array.isArray(drill.clubs) && drill.clubs.includes(club);
}

function matchesSkill(drill, skill) {
  if (!skill) return true;
  return Array.isArray(drill.skillAreas) && drill.skillAreas.includes(skill);
}

function matchesFix(drill, fix) {
  if (!fix) return true;
  return Array.isArray(drill.fixes) && drill.fixes.includes(fix);
}

function matchesEquipment(drill, equipment) {
  if (!equipment) return true;
  return Array.isArray(drill.equipment) && drill.equipment.includes(equipment);
}

// Filter a list of drills by the combined active filters.
// filters = { club, skill, fix, equipment } — any field may be empty.
export function filterDrills(drills, filters = {}) {
  const { club, skill, fix, equipment } = filters;
  return (drills || []).filter(
    (d) =>
      matchesClub(d, club) &&
      matchesSkill(d, skill) &&
      matchesFix(d, fix) &&
      matchesEquipment(d, equipment)
  );
}

// Look up drills by an ordered list of ids, preserving order, skipping missing.
export function drillsByIds(drills, ids) {
  const byId = new Map((drills || []).map((d) => [d.id, d]));
  return (ids || []).map((id) => byId.get(id)).filter(Boolean);
}

// Count of completed drills in a session's `done` map, given its plan.
export function countDone(plan = [], done = {}) {
  return (plan || []).reduce((n, id) => (done[id] ? n + 1 : n), 0);
}

// A one-line human date, e.g. "2 Jul 2026". Falls back to the raw string.
function prettyDate(ymd) {
  if (!ymd) return '';
  const parts = String(ymd).split('-');
  if (parts.length !== 3) return String(ymd);
  const [y, m, d] = parts.map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!m || m < 1 || m > 12) return String(ymd);
  return `${d} ${months[m - 1]} ${y}`;
}

// Build the plain-text summary of a single session (for "Copy summary").
// `drills` is the full drill list, used to turn ids into readable names.
export function sessionSummary(session, drills = []) {
  if (!session) return '';
  const byId = new Map((drills || []).map((d) => [d.id, d]));
  const lines = [];
  lines.push(`Golfdrill — ${prettyDate(session.date)}`);
  if (session.practiceType) lines.push(session.practiceType);
  lines.push('');

  const plan = session.plan || [];
  const done = session.done || {};
  const clubUsed = session.clubUsed || {};
  lines.push(`Drills (${countDone(plan, done)}/${plan.length} done):`);
  for (const id of plan) {
    const name = byId.get(id)?.name || id;
    const club = clubUsed[id] ? ` — ${clubUsed[id]}` : '';
    lines.push(`  ${done[id] ? '[x]' : '[ ]'} ${name}${club}`);
  }
  lines.push('');

  if (session.contact != null) lines.push(`Contact: ${session.contact}/10`);
  if (session.confidence != null) lines.push(`Confidence: ${session.confidence}/10`);
  if (session.miss) lines.push(`Main miss: ${session.miss}`);
  if (session.good) lines.push(`What went well: ${session.good}`);
  if (session.next) lines.push(`Next time: ${session.next}`);

  return lines.join('\n').trim();
}

// Build the plain-text export of the whole history ("Copy all history").
// Sessions are sorted newest-first by createdAt.
export function historyExport(sessions = [], drills = []) {
  const sorted = [...(sessions || [])].sort(
    (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
  );
  return sorted
    .map((s) => sessionSummary(s, drills))
    .join('\n\n----------------------------------------\n\n')
    .trim();
}

// ---- Stats helpers (pure) -------------------------------------------------
// All take the sessions array (any order) and return plain data for the UI.

// Average contact & confidence across sessions that recorded them.
export function averages(sessions = []) {
  let cSum = 0, cN = 0, fSum = 0, fN = 0;
  for (const s of sessions) {
    if (typeof s.contact === 'number') { cSum += s.contact; cN++; }
    if (typeof s.confidence === 'number') { fSum += s.confidence; fN++; }
  }
  return {
    contact: cN ? cSum / cN : null,
    confidence: fN ? fSum / fN : null,
    count: sessions.length,
  };
}

// Chronological series (oldest first) of { date, contact, confidence } for
// trend rendering.
export function trend(sessions = []) {
  return [...sessions]
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .map((s) => ({
      date: s.date,
      contact: typeof s.contact === 'number' ? s.contact : null,
      confidence: typeof s.confidence === 'number' ? s.confidence : null,
    }));
}

// Sorted [ [value, count], ... ] descending by count. Generic tallier.
function tally(items) {
  const counts = new Map();
  for (const it of items) {
    if (!it) continue;
    counts.set(it, (counts.get(it) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

// How often each club was used across all sessions' clubUsed maps.
export function clubUsageCounts(sessions = []) {
  const clubs = [];
  for (const s of sessions) {
    for (const club of Object.values(s.clubUsed || {})) clubs.push(club);
  }
  return tally(clubs);
}

// How often each "main miss" was logged (excludes empty; keeps "Good / playable").
export function missCounts(sessions = []) {
  return tally(sessions.map((s) => s.miss).filter(Boolean));
}

// The most frequent real miss in the most recent `lookback` sessions.
// Ignores "" and "Good / playable" (those aren't problems to fix). Returns
// { miss, count } or null.
export function recentTopMiss(sessions = [], lookback = 5) {
  const recent = [...sessions]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, lookback);
  const misses = recent
    .map((s) => s.miss)
    .filter((m) => m && m !== 'Good / playable');
  const ranked = tally(misses);
  return ranked.length ? { miss: ranked[0][0], count: ranked[0][1] } : null;
}

// Pick the ready plan that best addresses a given miss: the plan whose drills
// most often list that miss in their `fixes`. Returns { plan, score } or null.
export function recommendPlan(plans = [], drills = [], miss) {
  if (!miss) return null;
  const byId = new Map((drills || []).map((d) => [d.id, d]));
  let best = null;
  for (const plan of plans) {
    let score = 0;
    for (const id of plan.drills || []) {
      const d = byId.get(id);
      if (d && Array.isArray(d.fixes) && d.fixes.includes(miss)) score++;
    }
    if (score > 0 && (!best || score > best.score)) best = { plan, score };
  }
  return best;
}

export { prettyDate };
