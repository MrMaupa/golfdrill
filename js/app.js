// js/app.js
// UI state, rendering, event binding, and the login gate. This is the only
// module that touches the DOM. Firestore access goes through firestore-service.

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';

import { auth } from './firebase-init.js';
import {
  ensureSeeded,
  fetchDrills,
  fetchPlans,
  fetchSessions,
  saveSession,
  deleteSession,
} from './firestore-service.js';

import {
  CLUBS,
  SKILL_AREAS,
  FIXES,
  EQUIPMENT,
  MISS_OPTIONS,
  PRACTICE_TYPES,
  ALL_CLUBS,
} from './data.js';

import {
  esc,
  filterDrills,
  drillsByIds,
  countDone,
  sessionSummary,
  historyExport,
  prettyDate,
  averages,
  trend,
  clubUsageCounts,
  missCounts,
  recentTopMiss,
  recommendPlan,
} from './render.js';

// ---- localStorage-backed state --------------------------------------------
// Ephemeral / in-progress state lives here only; never in Firestore.

const LS = {
  session: 'gd.session',
  todayPlan: 'gd.todayPlan',
  resultDraft: 'gd.resultDraft',
  filters: 'gd.filters',
  expanded: 'gd.expanded',
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / disabled — non-fatal, in-memory state still works */
  }
}

function todayYmd() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const state = {
  drills: [],
  plans: [],
  sessions: [],
  activeTab: 'today',
  session: load(LS.session, { date: todayYmd(), practiceType: PRACTICE_TYPES[0] }),
  todayPlan: load(LS.todayPlan, { order: [], done: {}, clubUsed: {} }),
  resultDraft: load(LS.resultDraft, {
    contact: 5, confidence: 5, miss: '', good: '', next: '',
  }),
  filters: load(LS.filters, { club: '', skill: '', fix: '', equipment: '' }),
  expanded: load(LS.expanded, {}),
  todayInfo: {}, // which Today drills have their details expanded (in-memory)
};

// Back-fill fields added in later versions so older localStorage still works.
if (!state.todayPlan.clubUsed) state.todayPlan.clubUsed = {};

// ---- Small DOM helpers ----------------------------------------------------

const $ = (sel) => document.querySelector(sel);

let toastTimer = null;
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ---- Login gate -----------------------------------------------------------

function showLogin() {
  $('#login-view').hidden = false;
  $('#app-view').hidden = true;
}

function showApp() {
  $('#login-view').hidden = true;
  $('#app-view').hidden = false;
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $('#login-email').value.trim();
  const password = $('#login-password').value;
  const btn = $('#login-submit');
  btn.disabled = true;
  $('#login-error').textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, password);
    $('#login-password').value = '';
  } catch (err) {
    $('#login-error').textContent = authErrorMessage(err);
  } finally {
    btn.disabled = false;
  }
}

// Turn a Firebase auth error into a message that says what actually went wrong.
function authErrorMessage(err) {
  const code = err && err.code ? err.code : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Wrong email or password.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is off. Enable it in Firebase → Authentication → Sign-in method.';
    case 'auth/network-request-failed':
      return 'Network error. Are you online? (Open the site over http, not a file:// path.)';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a minute and try again.';
    default:
      return `Sign-in failed${code ? ` (${code})` : ''}.`;
  }
}

async function loadLibraryAndSessions() {
  try {
    await ensureSeeded();
    const [drills, plans, sessions] = await Promise.all([
      fetchDrills(),
      fetchPlans(),
      fetchSessions(),
    ]);
    state.drills = drills;
    state.plans = plans;
    state.sessions = sessions;
    renderAll();
  } catch {
    toast('Could not load your library. Check your connection.');
  }
}

// ---- Chip rendering -------------------------------------------------------

function chip(label, active, dataAttrs) {
  const attrs = Object.entries(dataAttrs)
    .map(([k, v]) => `data-${k}="${esc(v)}"`)
    .join(' ');
  return `<button type="button" class="chip${active ? ' chip--on' : ''}" ${attrs}>${esc(label)}</button>`;
}

// ---- Tab: Ready plans -----------------------------------------------------

// A "based on your recent misses, try this plan" card, or '' if nothing to say.
function recommendCard() {
  const top = recentTopMiss(state.sessions);
  if (!top) return '';
  const rec = recommendPlan(state.plans, state.drills, top.miss);
  if (!rec) return '';
  return `
    <article class="card card--rec">
      <p class="rec-kicker">Suggested for you</p>
      <p>You logged <strong>${esc(top.miss)}</strong> in ${top.count} of your recent sessions.</p>
      <div class="card-head">
        <h3>${esc(rec.plan.name)}</h3>
        ${rec.plan.estimate ? `<span class="card-tag">${esc(rec.plan.estimate)}</span>` : ''}
      </div>
      <p>${esc(rec.plan.purpose || '')}</p>
      <button type="button" class="btn btn--primary btn--block" data-load-plan="${esc(rec.plan.id)}">
        Load into Today
      </button>
    </article>`;
}

function renderPlans() {
  const el = $('#tab-plans');
  const head = viewHead('Plans.', 'Structured deep-work sessions');
  if (!state.plans.length) {
    el.innerHTML = head + `<p class="empty">No ready plans yet.</p>`;
    return;
  }
  el.innerHTML = head + recommendCard() + state.plans
    .map((p) => {
      const drills = drillsByIds(state.drills, p.drills);
      const names = drills.map((d) => `<li>${esc(d.name)}</li>`).join('');
      return `
        <article class="card">
          <div class="card-head">
            <h3>${esc(p.name)}</h3>
            ${p.estimate ? `<span class="card-tag">${esc(p.estimate)}</span>` : ''}
          </div>
          <p>${esc(p.purpose || '')}</p>
          <ol class="plan-drills">${names}</ol>
          <button type="button" class="btn btn--primary btn--block" data-load-plan="${esc(p.id)}">
            Load into Today
          </button>
        </article>`;
    })
    .join('');
}

// ---- Tab: Library (filters + drill cards) ---------------------------------

function renderFilters() {
  const f = state.filters;
  const group = (name, values, current) =>
    `<div class="chip-row filter-scroll">
       ${chip('All', !current, { filter: name, value: '' })}
       ${values.map((v) => chip(v, current === v, { filter: name, value: v })).join('')}
     </div>`;

  $('#library-filters').innerHTML = `
    <label class="filter-label">Club</label>
    ${group('club', CLUBS, f.club)}
    <label class="filter-label">Skill area</label>
    ${group('skill', SKILL_AREAS, f.skill)}
    <label class="filter-label">Fix</label>
    ${group('fix', FIXES, f.fix)}
    <label class="filter-label">Equipment</label>
    ${group('equipment', EQUIPMENT, f.equipment)}
  `;
}

function drillCard(d) {
  const open = !!state.expanded[d.id];
  const inPlan = state.todayPlan.order.includes(d.id);
  const tags = [...(d.clubs || []), ...(d.skillAreas || [])]
    .map((t) => `<span class="tag">${esc(t)}</span>`)
    .join('');
  return `
    <article class="card drill${open ? ' is-open' : ''}">
      <button type="button" class="drill-head" data-toggle="${esc(d.id)}">
        <span class="drill-title">${esc(d.name)}</span>
        <span class="chevron">${open ? '▾' : '▸'}</span>
      </button>
      <p class="muted">${esc(d.short || '')}</p>
      <div class="tags">${tags}</div>
      ${open ? `
        <div class="drill-body">
          <p><strong>How:</strong> ${esc(d.how || '')}</p>
          <p><strong>Focus:</strong> ${esc(d.focus || '')}</p>
          ${d.success ? `<p class="ok"><strong>Success check:</strong> ${esc(d.success)}</p>` : ''}
          ${d.mistake ? `<p class="warn"><strong>Common mistake:</strong> ${esc(d.mistake)}</p>` : ''}
          <p><strong>Why:</strong> ${esc(d.why || '')}</p>
          <p class="muted">${esc(d.balls || '')} · ${esc((d.equipment || []).join(', '))}</p>
        </div>` : ''}
      <button type="button" class="btn ${inPlan ? 'btn--muted' : 'btn--primary'} btn--block"
              data-plan-toggle="${esc(d.id)}">
        ${inPlan ? 'Remove from Today' : '+ Add to Today'}
      </button>
    </article>`;
}

function renderLibrary() {
  renderFilters();
  const matched = filterDrills(state.drills, state.filters);
  const el = $('#library-list');
  el.innerHTML = matched.length
    ? matched.map(drillCard).join('')
    : `<p class="empty">No drills match these filters.</p>`;
}

// ---- Tab: Today -----------------------------------------------------------

function renderToday() {
  const el = $('#tab-today');
  const s = state.session;
  const plan = state.todayPlan;
  const drills = drillsByIds(state.drills, plan.order);

  const typeChips = PRACTICE_TYPES.map((t) =>
    chip(t, s.practiceType === t, { ptype: t })).join('');

  const drillRows = drills.length
    ? drills.map((d, i) => {
        const clubOptions = (d.clubs || []).includes(ALL_CLUBS)
          ? CLUBS
          : (d.clubs || []);
        const clubChips = clubOptions
          .map((c) => chip(c, plan.clubUsed[d.id] === c, { 'club-drill': d.id, club: c }))
          .join('');
        const info = state.todayInfo[d.id];
        return `
        <li class="today-drill${plan.done[d.id] ? ' is-done' : ''}">
          <div class="today-drill-top">
            <label class="check">
              <input type="checkbox" data-done="${esc(d.id)}" ${plan.done[d.id] ? 'checked' : ''}>
              <span>${esc(d.name)}</span>
            </label>
            <span class="reorder">
              <button type="button" class="info-btn${info ? ' is-on' : ''}" data-today-info="${esc(d.id)}" aria-label="How to do this drill">i</button>
              <button type="button" data-move-up="${esc(d.id)}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">↑</button>
              <button type="button" data-move-down="${esc(d.id)}" ${i === drills.length - 1 ? 'disabled' : ''} aria-label="Move down">↓</button>
              <button type="button" data-remove="${esc(d.id)}" aria-label="Remove">✕</button>
            </span>
          </div>
          ${info ? `
            <div class="today-info">
              <p>${esc(d.short || '')}</p>
              <p><strong>How:</strong> ${esc(d.how || '')}</p>
              <p><strong>Focus:</strong> ${esc(d.focus || '')}</p>
              ${d.success ? `<p class="ok"><strong>Success check:</strong> ${esc(d.success)}</p>` : ''}
              ${d.mistake ? `<p class="warn"><strong>Common mistake:</strong> ${esc(d.mistake)}</p>` : ''}
              ${d.why ? `<p><strong>Why:</strong> ${esc(d.why)}</p>` : ''}
              <p class="muted">${esc(d.balls || '')}${(d.equipment || []).length ? ` · ${esc((d.equipment || []).join(', '))}` : ''}</p>
            </div>` : ''}
          ${clubOptions.length ? `<div class="club-row">${clubChips}</div>` : ''}
        </li>`;
      }).join('')
    : `<p class="empty">No drills yet — add some from Library or load a plan.</p>`;

  const r = state.resultDraft;
  const total = plan.order.length;
  const done = countDone(plan.order, plan.done);
  const pct = total ? Math.round((done / total) * 100) : 0;

  el.innerHTML = viewHead('Today.', 'Load a plan or drills, then log your session') + `
    <article class="card">
      <div class="card-head">
        <h3>${esc(plan.planName || 'Today’s plan')}</h3>
        <span class="card-tag" id="today-counter">${done} / ${total}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" id="today-progress" style="width:${pct}%"></div></div>

      <label class="filter-label">Date</label>
      <input type="date" id="today-date" value="${esc(s.date)}">
      <label class="filter-label">Practice type</label>
      <div class="chip-row filter-scroll">${typeChips}</div>

      <ul class="today-list">${drillRows}</ul>
    </article>

    <article class="card">
      <h3>Result</h3>
      <label class="filter-label">Contact: <output id="contact-out">${esc(r.contact)}</output>/10</label>
      <input type="range" id="contact" min="1" max="10" value="${esc(r.contact)}">
      <label class="filter-label">Confidence: <output id="confidence-out">${esc(r.confidence)}</output>/10</label>
      <input type="range" id="confidence" min="1" max="10" value="${esc(r.confidence)}">

      <label class="filter-label">Main miss</label>
      <div class="chip-row filter-scroll">
        ${MISS_OPTIONS.map((m) => chip(m, r.miss === m, { miss: m })).join('')}
      </div>

      <label class="filter-label" for="good">What went well</label>
      <textarea id="good" rows="2">${esc(r.good)}</textarea>
      <label class="filter-label" for="next">Next time</label>
      <textarea id="next" rows="2">${esc(r.next)}</textarea>

      <div class="today-actions">
        <button type="button" class="btn btn--primary" id="save-session"
                ${total ? '' : 'disabled'}>Save practice</button>
        <button type="button" class="btn" id="copy-summary"
                ${total ? '' : 'disabled'}>Copy summary</button>
        <button type="button" class="btn btn--muted" id="clear-today">Clear</button>
      </div>
    </article>`;
}

// ---- Tab: History ---------------------------------------------------------

function renderHistory() {
  const el = $('#tab-history');
  const head = viewHead('History.', 'Track your progress and insights');
  if (!state.sessions.length) {
    el.innerHTML = head + `<p class="empty">No saved sessions yet.</p>`;
    return;
  }
  const cards = state.sessions
    .map((sess) => {
      const done = countDone(sess.plan || [], sess.done || {});
      const clubs = [...new Set(Object.values(sess.clubUsed || {}))];
      return `
        <article class="card">
          <div class="card-head">
            <h3>${esc(sess.practiceType || 'Session')}</h3>
            <span class="card-tag">${esc(prettyDate(sess.date))}</span>
          </div>
          <p class="muted">${done}/${(sess.plan || []).length} drills · Contact ${esc(sess.contact ?? '–')}/10 · Confidence ${esc(sess.confidence ?? '–')}/10${
            sess.miss ? ` · ${esc(sess.miss)}` : ''
          }</p>
          ${clubs.length ? `<p class="muted">Clubs: ${esc(clubs.join(', '))}</p>` : ''}
          ${sess.good ? `<p><strong>Well:</strong> ${esc(sess.good)}</p>` : ''}
          ${sess.next ? `<p><strong>Next:</strong> ${esc(sess.next)}</p>` : ''}
          <div class="card-actions">
            <button type="button" class="btn" data-copy-session="${esc(sess.id)}">Copy summary</button>
            <button type="button" class="btn btn--muted" data-delete-session="${esc(sess.id)}">Delete</button>
          </div>
        </article>`;
    })
    .join('');
  el.innerHTML = head + `
    <button type="button" class="btn btn--primary btn--block" id="copy-all">Copy all history</button>
    <div style="height:1rem"></div>
    ${cards}`;
}

// ---- Tab: Stats -----------------------------------------------------------

function statBar(label, value, max) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return `
    <div class="stat-bar">
      <span class="stat-bar-label">${esc(label)}</span>
      <span class="stat-bar-track"><span class="stat-bar-fill" style="width:${pct}%"></span></span>
      <span class="stat-bar-val">${esc(value)}</span>
    </div>`;
}

function renderStats() {
  const el = $('#tab-stats');
  if (!el) return;
  const head = viewHead('Stats.', 'Patterns from your logged sessions');
  const sessions = state.sessions;
  if (!sessions.length) {
    el.innerHTML = head + `<p class="empty">No stats yet — save a few practices first.</p>`;
    return;
  }

  const avg = averages(sessions);
  const clubs = clubUsageCounts(sessions);
  const misses = missCounts(sessions);
  const recent = trend(sessions)
    .filter((x) => x.contact != null || x.confidence != null)
    .slice(-8);

  const fmt = (n) => (n == null ? '–' : n.toFixed(1));
  const clubMax = clubs.length ? clubs[0][1] : 0;
  const missMax = misses.length ? misses[0][1] : 0;

  const trendRows = recent
    .map((x) => `
      <div class="trend-row">
        <span class="muted">${esc(prettyDate(x.date))}</span>
        <span>Contact ${esc(x.contact ?? '–')} · Confidence ${esc(x.confidence ?? '–')}</span>
      </div>`)
    .join('');

  el.innerHTML = head + `
    <article class="card">
      <h3>Overview</h3>
      <p>${avg.count} session${avg.count === 1 ? '' : 's'} logged.</p>
      <p>Avg contact <strong>${fmt(avg.contact)}</strong>/10 · Avg confidence <strong>${fmt(avg.confidence)}</strong>/10</p>
    </article>
    <article class="card">
      <h3>Most-used clubs</h3>
      ${clubs.length ? clubs.map(([c, n]) => statBar(c, n, clubMax)).join('') : '<p class="muted">No clubs logged yet.</p>'}
    </article>
    <article class="card">
      <h3>Miss pattern</h3>
      ${misses.length ? misses.map(([m, n]) => statBar(m, n, missMax)).join('') : '<p class="muted">No misses logged yet.</p>'}
    </article>
    <article class="card">
      <h3>Recent sessions</h3>
      ${trendRows || '<p class="muted">—</p>'}
    </article>`;
}

// ---- Tab switching --------------------------------------------------------

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.bottom-nav .nav-item').forEach((b) => {
    b.classList.toggle('nav-item--on', b.dataset.tab === tab);
  });
  document.querySelectorAll('.tabpane').forEach((p) => {
    p.hidden = p.id !== `tab-${tab}`;
  });
  window.scrollTo(0, 0);
}

// A large greeting + subtitle at the top of a view (matches the design).
function viewHead(title, subtitle) {
  return `<h1 class="greeting">${esc(title)}</h1><p class="subtitle">${esc(subtitle)}</p>`;
}

function renderAll() {
  renderPlans();
  renderLibrary();
  renderToday();
  renderHistory();
  renderStats();
  setTab(state.activeTab);
}

// ---- Actions --------------------------------------------------------------

function loadPlan(planId) {
  const plan = state.plans.find((p) => p.id === planId);
  if (!plan) return;
  state.todayPlan = {
    order: [...(plan.drills || [])],
    done: {},
    clubUsed: {},
    planName: plan.name,
  };
  save(LS.todayPlan, state.todayPlan);
  setTab('today');
  renderToday();
  toast(`Loaded "${plan.name}"`);
}

function togglePlanDrill(drillId) {
  const order = state.todayPlan.order;
  const idx = order.indexOf(drillId);
  if (idx === -1) order.push(drillId);
  else {
    order.splice(idx, 1);
    delete state.todayPlan.done[drillId];
    delete state.todayPlan.clubUsed[drillId];
  }
  save(LS.todayPlan, state.todayPlan);
  renderLibrary();
  renderToday();
}

function setClubUsed(drillId, club) {
  const cu = state.todayPlan.clubUsed;
  cu[drillId] = cu[drillId] === club ? undefined : club;
  if (cu[drillId] === undefined) delete cu[drillId];
  save(LS.todayPlan, state.todayPlan);
  renderToday();
}

function moveDrill(drillId, delta) {
  const order = state.todayPlan.order;
  const i = order.indexOf(drillId);
  const j = i + delta;
  if (i === -1 || j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  save(LS.todayPlan, state.todayPlan);
  renderToday();
}

function setFilter(name, value) {
  state.filters[name] = value;
  save(LS.filters, state.filters);
  renderLibrary();
}

function toggleExpanded(drillId) {
  state.expanded[drillId] = !state.expanded[drillId];
  save(LS.expanded, state.expanded);
  renderLibrary();
}

// Only keep clubUsed entries for drills still in the plan.
function clubUsedForPlan(plan) {
  const out = {};
  for (const id of plan.order) {
    if (plan.clubUsed[id]) out[id] = plan.clubUsed[id];
  }
  return out;
}

async function doSaveSession() {
  const plan = state.todayPlan;
  const r = state.resultDraft;
  const s = state.session;
  const session = {
    createdAt: Date.now(),
    date: s.date,
    practiceType: s.practiceType,
    plan: [...plan.order],
    done: { ...plan.done },
    clubUsed: clubUsedForPlan(plan),
    contact: Number(r.contact),
    confidence: Number(r.confidence),
    miss: r.miss || '',
    good: r.good || '',
    next: r.next || '',
  };
  try {
    await saveSession(session);
    state.sessions = await fetchSessions();
    // Clear in-progress state for the next session.
    clearToday(false);
    renderHistory();
    setTab('history');
    toast('Practice saved.');
  } catch {
    toast('Save failed — it will sync when you are back online, or try again.');
  }
}

function clearToday(showToast = true) {
  state.todayPlan = { order: [], done: {}, clubUsed: {} };
  state.resultDraft = { contact: 5, confidence: 5, miss: '', good: '', next: '' };
  state.session = { date: todayYmd(), practiceType: PRACTICE_TYPES[0] };
  save(LS.todayPlan, state.todayPlan);
  save(LS.resultDraft, state.resultDraft);
  save(LS.session, state.session);
  renderToday();
  if (showToast) toast('Today cleared.');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard.');
  } catch {
    toast('Copy failed — select and copy manually.');
  }
}

async function removeSession(sessionId) {
  try {
    await deleteSession(sessionId);
    state.sessions = state.sessions.filter((s) => s.id !== sessionId);
    renderHistory();
    toast('Session deleted.');
  } catch {
    toast('Delete failed. Try again.');
  }
}

// ---- Event binding (delegation) -------------------------------------------

function bindEvents() {
  $('#login-form').addEventListener('submit', handleLogin);
  $('#sign-out').addEventListener('click', () => signOut(auth).catch(() => {}));

  document.querySelectorAll('.bottom-nav .nav-item').forEach((b) => {
    b.addEventListener('click', () => setTab(b.dataset.tab));
  });

  // Click delegation for everything rendered dynamically.
  $('#app-view').addEventListener('click', (e) => {
    const t = e.target.closest('[data-load-plan],[data-plan-toggle],[data-toggle],' +
      '[data-today-info],[data-move-up],[data-move-down],[data-remove],.chip,#save-session,' +
      '#copy-summary,#clear-today,#copy-all,[data-copy-session],[data-delete-session]');
    if (!t) return;

    if (t.dataset.loadPlan) return loadPlan(t.dataset.loadPlan);
    if (t.dataset.planToggle) return togglePlanDrill(t.dataset.planToggle);
    if (t.dataset.toggle) return toggleExpanded(t.dataset.toggle);
    if (t.dataset.todayInfo) {
      state.todayInfo[t.dataset.todayInfo] = !state.todayInfo[t.dataset.todayInfo];
      return renderToday();
    }
    if (t.dataset.moveUp) return moveDrill(t.dataset.moveUp, -1);
    if (t.dataset.moveDown) return moveDrill(t.dataset.moveDown, 1);
    if (t.dataset.remove) return togglePlanDrill(t.dataset.remove);
    if (t.dataset.copySession) {
      const sess = state.sessions.find((s) => s.id === t.dataset.copySession);
      return copyText(sessionSummary(sess, state.drills));
    }
    if (t.dataset.deleteSession) return removeSession(t.dataset.deleteSession);

    if (t.classList.contains('chip')) {
      if (t.dataset.clubDrill != null) return setClubUsed(t.dataset.clubDrill, t.dataset.club);
      if (t.dataset.filter != null) return setFilter(t.dataset.filter, t.dataset.value);
      if (t.dataset.ptype != null) {
        state.session.practiceType = t.dataset.ptype;
        save(LS.session, state.session);
        return renderToday();
      }
      if (t.dataset.miss != null) {
        state.resultDraft.miss = state.resultDraft.miss === t.dataset.miss ? '' : t.dataset.miss;
        save(LS.resultDraft, state.resultDraft);
        return renderToday();
      }
    }

    if (t.id === 'save-session') return doSaveSession();
    if (t.id === 'copy-summary') {
      return copyText(sessionSummary({
        ...state.session,
        plan: state.todayPlan.order,
        done: state.todayPlan.done,
        clubUsed: state.todayPlan.clubUsed,
        ...state.resultDraft,
      }, state.drills));
    }
    if (t.id === 'clear-today') return clearToday();
    if (t.id === 'copy-all') return copyText(historyExport(state.sessions, state.drills));
  });

  // Input delegation (checkboxes, ranges, textareas, date).
  $('#app-view').addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-done]')) {
      state.todayPlan.done[t.dataset.done] = t.checked;
      save(LS.todayPlan, state.todayPlan);
      const total = state.todayPlan.order.length;
      const done = countDone(state.todayPlan.order, state.todayPlan.done);
      const counter = $('#today-counter');
      if (counter) counter.textContent = `${done} / ${total}`;
      const fill = $('#today-progress');
      if (fill) fill.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
      t.closest('.today-drill')?.classList.toggle('is-done', t.checked);
      return;
    }
    if (t.id === 'contact' || t.id === 'confidence') {
      state.resultDraft[t.id] = Number(t.value);
      save(LS.resultDraft, state.resultDraft);
      const out = $(`#${t.id}-out`);
      if (out) out.textContent = t.value;
      return;
    }
    if (t.id === 'good' || t.id === 'next') {
      state.resultDraft[t.id] = t.value;
      save(LS.resultDraft, state.resultDraft);
      return;
    }
    if (t.id === 'today-date') {
      state.session.date = t.value;
      save(LS.session, state.session);
    }
  });
}

// ---- Boot -----------------------------------------------------------------

bindEvents();
setTab(state.activeTab);

onAuthStateChanged(auth, (user) => {
  if (user) {
    showApp();
    loadLibraryAndSessions();
  } else {
    showLogin();
  }
});
