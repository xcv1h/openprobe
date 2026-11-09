// SPDX-FileCopyrightText: 2026 Tymofii Zhurida (xcv1h) zhuridatimofii@gmail.com
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// The scan walk: setup, then one screen per switch, then a summary.
// A clickable stub: placeholder data, and a "next state" button stands in for the probe.

const MINUTE = 60 * 1000;      // milliseconds, the unit Date.now() uses
const HOUR = 60 * MINUTE;
const now = Date.now();

// Placeholder data, the same as in buildings.js.
// Later: pb.collection('buildings') and pb.collection('probes').
const buildings = [
  { id: 'b1', name: 'Building B' },
  { id: 'b2', name: 'Warehouse 3' },
  { id: 'b3', name: 'Main office' },
  { id: 'b4', name: 'Library' },
  { id: 'b5', name: 'Annex' },
  { id: 'b6', name: 'Gym' },
];
const probes = [
  { id: 'p1', name: 'probe-01', last_seen: new Date(now - 12 * 1000) },
  { id: 'p2', name: 'probe-02', last_seen: new Date(now - 3 * HOUR) },
];

// What the probe would find, one switch per stop, in the order the technician walks.
// Neighbor names are as CDP reports them: hostname.domain.
// Later: the probe sends this as it reads each switch.
const switches = [
  { name: 'SW-CORE-01', domain: 'lab.local', neighbors: [
    { name: 'SW-ACCESS-02.lab.local', port: 'Gi1/0/2' },
    { name: 'SW-ACCESS-01.lab.local', port: 'Gi1/0/1' },
  ] },
  { name: 'SW-ACCESS-01', domain: 'lab.local', neighbors: [
    { name: 'SW-CORE-01.lab.local', port: 'Gi1/0/24' },
  ] },
  { name: 'SW-ACCESS-02', domain: 'lab.local', neighbors: [
    { name: 'SW-CORE-01.lab.local', port: 'Gi1/0/24' },
  ] },
];

// The steps listed under the ask, the same for every stop.
const STEPS = ['console found', 'logged in', 'identified', 'neighbors read', 'done'];

// The states of one stop, in order.
//   step:    the line of STEPS it is on
//   working: the probe is busy on that step (● pulsing); otherwise the step has just finished (✓)
//   ask:     what the screen says; "identified" says the switch's name instead
const STATES = [
  { id: 'waiting',    step: 0, working: true,  ask: "plug the rollover cable into the switch's console port." },
  { id: 'password',   step: 1, working: true,  ask: 'type the console password for this switch.' },
  { id: 'login',      step: 1, working: true,  ask: 'logging in…' },
  { id: 'identified', step: 2, working: false, ask: '' },
  { id: 'reading',    step: 3, working: true,  ask: 'reading neighbors…' },
  { id: 'done',       step: 4, working: false, ask: 'unplug and go to the next switch.' },
];

// A device name that never breaks at its hyphens.
function dev(name) {
  const span = document.createElement('span');
  span.className = 'dev';
  span.textContent = name;
  return span;
}

// Failures and findings replace the ask and keep the step list (docs/design.md, "The scan walk").
//   state:   where the stop is when it happens
//   mark:    how that step is shown: failed ✕, finding ◆, stale ▲
//   ask:     text, and device names from dev()
//   actions: the buttons it offers, by id, with their labels
const CASES = {
  'no answer on console': {
    state: 'waiting', mark: 'failed',
    ask: ["nothing on the console. check it's the rollover cable, in the console port, not an Ethernet port."],
    actions: { retry: 'try again', skip: 'skip this switch' },
  },
  'login failed': {
    state: 'login', mark: 'failed',
    ask: ["that password didn't work. type it again, or skip this switch."],
    actions: { skip: 'skip this switch' },
  },
  'session left open': {
    state: 'login', mark: 'finding', note: 'session left open',
    ask: ["someone left a privileged session open on this console. scanning anyway; it's recorded as a finding."],
  },
  'already scanned': {
    state: 'identified', mark: 'stale', note: 'scanned at stop 2',
    ask: ['this is ', dev('SW-ACCESS-01'), ', scanned at stop 2. scan it again, or skip?'],
    actions: { retry: 'scan again', skip: 'skip' },
  },
  'CDP off': {
    state: 'reading', mark: 'finding', note: 'CDP off',
    ask: ["CDP is off on this switch. it's on the map with no links."],
  },
  'unreadable output': {
    state: 'reading', mark: 'failed',
    ask: ["couldn't read the neighbor list. try again, or keep the raw output."],
    actions: { retry: 'try again', keep: 'keep the raw output' },
  },
};

// How each step is drawn, and the word a screen reader says instead of the glyph.
const MARKS = {
  done:    { glyph: '✓', word: 'done' },
  now:     { glyph: '●', word: 'in progress' },
  todo:    { glyph: '○', word: 'to do' },
  failed:  { glyph: '✕', word: 'failed' },
  finding: { glyph: '◆', word: 'finding' },
  stale:   { glyph: '▲', word: 'already scanned' },
};

// Everything the walk has done so far.
const walk = {
  building: '',     // its name
  isNew: false,     // added during this walk, not in the database yet
  where: '',        // only for a new building
  probe: '',
  mode: 'one',      // console password: 'none', 'one' (one for all) or 'ask' (ask per switch)
  index: 0,         // which switch in `switches` we are at; the stop number is index + 1
  state: 'waiting',
  case: '',         // a key of CASES while a failure or finding is shown, else ''
  visited: [],      // switches whose stop is done, in walk order
  findings: [],     // "CDP off on SW-ACCESS-01"
};

// plural(1, 'scan', 'scans') -> "1 scan", plural(3, 'scan', 'scans') -> "3 scans"
function plural(n, one, many) {
  return n + ' ' + (n === 1 ? one : many);
}

// "3h ago", the short form from buildings.js.
function ago(date) {
  const seconds = (Date.now() - date.getTime()) / 1000;
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return n + unit[0] + ' ago';
  }
  return 'just now';
}

// Probes check in with the server regularly. Silent for 2 minutes = offline.
function isOnline(probe) {
  return Date.now() - probe.last_seen.getTime() < 2 * MINUTE;
}

// A symbol that screen readers skip, because the word next to it says the same thing.
function icon(symbol) {
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.textContent = symbol;
  return span;
}

// Adds one "label  value" line to a <dl>.
function addRow(dl, label, value) {
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = label;
  dd.textContent = value;
  dl.append(dt, dd);
}

// The current switch's stop is done. Once only: a stub case can rewind a finished stop.
function markVisited() {
  const sw = switches[walk.index];
  if (!walk.visited.includes(sw)) walk.visited.push(sw);
}

function fullName(sw) {
  return sw.name + '.' + sw.domain;
}

// Neighbors heard at a stop that no stop has visited yet, each once, with where it was first heard.
function unvisited() {
  const known = new Set(walk.visited.map(fullName));
  const list = [];
  for (const sw of walk.visited) {
    for (const n of sw.neighbors) {
      if (known.has(n.name)) continue;
      known.add(n.name);
      list.push({ name: n.name, from: sw, port: n.port });
    }
  }
  return list;
}

// ---- Screens ----

const screens = [
  document.getElementById('setup'),
  document.getElementById('stop'),
  document.getElementById('summary'),
];

// Shows one screen and moves focus to its top, so keyboard and screen reader users start there.
function show(id) {
  for (const screen of screens) screen.hidden = screen.id !== id;
  document.querySelector('#' + id + ' [tabindex="-1"]').focus();
}

// ---- 1. Setup ----

const setupForm = document.getElementById('setup-form');
const onePasswordField = document.getElementById('one-password-field');
const onePassword = document.getElementById('one-password');

const picker = document.getElementById('picker');
const picked = document.getElementById('picked');
const buildingFilter = document.getElementById('building-filter');
const buildingList = document.getElementById('building-list');
const buildingNone = document.getElementById('building-none');
const addButton = document.getElementById('add-building');
const whereField = document.getElementById('where-field');

// One radio per building, A to Z. A new building's value is 'new'.
function buildingChoice(id, name, isNew) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  label.className = 'choice';
  label.dataset.name = name;   // what the filter matches against, and the name shown when picked
  input.type = 'radio';
  input.name = 'building';
  input.value = id;
  label.append(input, ' ' + name);
  if (isNew) {
    const tag = document.createElement('span');
    tag.className = 'new';
    tag.textContent = ' · new';
    label.append(tag);
  }
  return label;
}

buildings.sort((a, b) => a.name.localeCompare(b.name));
for (const b of buildings) buildingList.append(buildingChoice(b.id, b.name, false));

function chosenBuilding() {
  return buildingList.querySelector('input:checked');   // null until one is picked
}

// The closed accordion's line shows the pick. A new building also gets the "where" field.
function updatePicked() {
  const chosen = chosenBuilding();
  picked.textContent = chosen ? chosen.parentElement.textContent.trim() : 'choose a building';
  picked.classList.toggle('placeholder', !chosen);
  whereField.hidden = !chosen || chosen.value !== 'new';
}

// Hides buildings whose name doesn't contain the typed text. Nothing left: offer to add it.
function filterBuildings() {
  const query = buildingFilter.value.trim();
  let shown = 0;
  for (const label of buildingList.children) {
    label.hidden = !label.dataset.name.toLowerCase().includes(query.toLowerCase());
    if (!label.hidden) shown++;
  }
  const offer = query !== '' && shown === 0;
  buildingNone.hidden = !offer;
  addButton.hidden = !offer;
  buildingNone.textContent = offer ? `no building matches "${query}".` : '';
  addButton.textContent = `add "${query}"`;
}

// A building no one has scanned yet. It is saved together with the scan, not now,
// so it works offline too.
function addBuilding(name) {
  const old = buildingList.querySelector('input[value="new"]');
  if (old) old.parentElement.remove();   // one new building per scan
  const label = buildingChoice('new', name, true);
  buildingList.prepend(label);
  label.querySelector('input').checked = true;
  buildingFilter.value = '';
  filterBuildings();
  updatePicked();
  picker.open = false;
  document.getElementById('where').focus();   // the next thing to fill in
}

buildingFilter.addEventListener('input', filterBuildings);
// Enter in the filter would send the whole form; here it means "add what I typed".
buildingFilter.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  if (!addButton.hidden) addBuilding(buildingFilter.value.trim());
});
addButton.addEventListener('click', () => addBuilding(buildingFilter.value.trim()));
buildingList.addEventListener('change', updatePicked);

// A tap on a building closes the accordion. Arrow keys pick too, but their clicks
// have detail 0, so the list stays open while the keyboard moves through it.
buildingList.addEventListener('click', event => {
  if (event.detail > 0 && event.target.closest('label')) {
    picker.open = false;
    picker.querySelector('summary').focus();
  }
});

// From the buildings page: ?building=b1 picks it, ?add=Warehouse%204 adds it,
// ?add on its own goes straight to the filter to type a name.
const params = new URLSearchParams(location.search);
const fromLink = buildingList.querySelector(`input[value="${CSS.escape(params.get('building') || '')}"]`);
if (fromLink) {
  fromLink.checked = true;
  updatePicked();
  picker.open = false;
} else if (params.get('add')) {
  addBuilding(params.get('add').trim());
} else if (params.has('add')) {
  buildingFilter.focus();
}

// One radio per probe. An offline probe can't be picked, and the line under it says why.
let firstOnline = true;
for (const p of probes) {
  const online = isOnline(p);
  const label = document.createElement('label');
  const input = document.createElement('input');
  const mark = document.createElement('span');
  input.type = 'radio';
  input.name = 'probe';
  input.value = p.id;
  input.required = true;
  input.disabled = !online;
  if (online && firstOnline) {
    input.checked = true;
    firstOnline = false;
  }
  label.className = online ? 'choice' : 'choice disabled';
  mark.className = online ? 'status ok' : 'status offline';
  mark.append(icon(online ? '●' : '○'), online ? ' online' : ' offline');
  label.append(input, ' ' + p.name + ' ', mark);
  document.getElementById('probes').append(label);

  if (!online) {
    const why = document.createElement('p');
    why.className = 'help';
    why.id = 'why-' + p.id;
    why.textContent = `last seen ${ago(p.last_seen)}, so it can't scan. switch it on and reload this page.`;
    input.setAttribute('aria-describedby', why.id);
    document.getElementById('probes').append(why);
  }
}

// "one for all" asks for the password here; the other modes don't.
document.getElementById('mode').addEventListener('change', () => {
  walk.mode = setupForm.elements.mode.value;
  onePasswordField.hidden = walk.mode !== 'one';
  onePassword.required = walk.mode === 'one';
});

setupForm.addEventListener('submit', event => {
  event.preventDefault();   // stub: stay on this page instead of sending the form
  const chosen = chosenBuilding();
  if (!chosen) {
    picker.open = true;
    buildingNone.hidden = false;
    buildingNone.textContent = 'choose a building, or type a name to add one.';
    buildingFilter.focus();
    return;
  }
  walk.building = chosen.parentElement.dataset.name;
  walk.isNew = chosen.value === 'new';
  walk.where = walk.isNew ? document.getElementById('where').value.trim() : '';
  walk.probe = setupForm.elements.probe.value;
  // Later: create the scan in PocketBase, and the building first if it is new
  // (any technician may: the buildings createRule is just "@request.auth.id != ''").
  // Offline, both wait on this phone and go up together. Then bind the probe, and send the probe
  // the password mode (and the one password). The password goes to the probe only, never to the database.
  show('stop');
  renderStop();
});

// ---- 2. Stop ----

const count = document.getElementById('count');
const ask = document.getElementById('ask');
const steps = document.getElementById('steps');
const passwordForm = document.getElementById('password-form');
const finishButton = document.getElementById('finish');
const caseButtons = [
  document.getElementById('retry'),
  document.getElementById('keep'),
  document.getElementById('skip'),
];

// The result shown under a finished step.
function noteFor(step, sw) {
  if (step === 0) return '9600 8N1';
  if (step === 2) return fullName(sw);
  if (step === 3) return plural(sw.neighbors.length, 'neighbor', 'neighbors');
  return '';
}

// One <li> in the step list: glyph, hidden state word, step name, and a result under it.
function stepLine(label, kind, note) {
  const li = document.createElement('li');
  const glyph = icon(MARKS[kind].glyph);
  const text = document.createElement('span');
  const word = document.createElement('span');
  word.className = 'visually-hidden';
  word.textContent = MARKS[kind].word + ': ';
  text.append(word, label);
  if (note) {
    const span = document.createElement('span');
    span.className = 'note';
    span.textContent = note;
    text.append(span);
  }
  if (kind === 'now') {
    li.className = 'is-now';
    glyph.className = 'pulse';
  } else if (kind === 'failed' || kind === 'finding' || kind === 'stale') {
    li.className = 'is-' + kind;
  }
  li.append(glyph, text);
  return li;
}

// One row of NextStops: the name as CDP reported it, then which port to follow.
function nextLine(name, via) {
  const li = document.createElement('li');
  const span = document.createElement('span');
  span.className = 'via';
  span.textContent = via;
  li.append(dev(name), span);
  return li;
}

// NextStops: this stop's unvisited neighbors by port, then older ones still waiting.
// Returns true when nothing is left to visit.
function renderNext(sw) {
  const left = unvisited();
  const here = sw.neighbors
    .filter(n => left.some(u => u.name === n.name))
    .sort((a, b) => a.port.localeCompare(b.port, 'en', { numeric: true }));   // Gi1/0/2 before Gi1/0/10
  const earlier = left.filter(u => !sw.neighbors.some(n => n.name === u.name));

  document.getElementById('next-here-list').replaceChildren(...here.map(n => nextLine(n.name, 'from ' + n.port)));
  document.getElementById('next-earlier-list').replaceChildren(...earlier.map(u => nextLine(u.name, `from ${u.from.name} ${u.port}`)));
  document.getElementById('next-here').hidden = here.length === 0;
  document.getElementById('next-earlier').hidden = earlier.length === 0;
  document.getElementById('next-empty').hidden = left.length > 0;
  return left.length === 0;
}

function renderStop() {
  const sw = switches[walk.index];
  const state = STATES.find(s => s.id === walk.state);
  const c = CASES[walk.case];   // undefined while nothing went wrong

  count.textContent = `stop ${walk.index + 1} · ${walk.building}`;

  ask.className = 'ask';
  if (c) {
    ask.replaceChildren(...c.ask);
    if (c.mark === 'failed') ask.classList.add('is-failed');
    if (c.mark === 'finding') ask.classList.add('is-finding');
  } else if (state.id === 'identified') {
    // <wbr>: on a narrow phone the domain may go to the next line, the hostname never splits
    ask.replaceChildren(dev(sw.name), document.createElement('wbr'), '.' + sw.domain);
  } else {
    ask.textContent = state.ask;
  }

  steps.replaceChildren();
  STEPS.forEach((label, i) => {
    let kind = 'todo';
    if (i < state.step || (i === state.step && !state.working)) kind = 'done';
    else if (i === state.step) kind = 'now';
    let note = kind === 'done' ? noteFor(i, sw) : '';
    if (c && i === state.step) {
      kind = c.mark;
      note = c.note || '';
    }
    steps.append(stepLine(label, kind, note));
  });

  passwordForm.hidden = !((state.id === 'password' && !c) || walk.case === 'login failed');

  const actions = c && c.actions ? c.actions : {};
  for (const button of caseButtons) {
    button.hidden = !actions[button.id];
    button.textContent = actions[button.id] || '';
  }

  const showNext = state.id === 'done' && !c;
  document.getElementById('next').hidden = !showNext;
  const allVisited = showNext && renderNext(sw);
  // "finish scan" is always there, but only the primary action once every neighbor is visited
  finishButton.classList.toggle('primary', allVisited);
}

// The next state of this stop, or the next switch once it's done.
// Later: the probe sends these over the WebSocket; this button stands in for it.
function nextState() {
  walk.case = '';
  if (walk.state === 'done') {
    nextSwitch();
    return;
  }
  let i = STATES.findIndex(s => s.id === walk.state) + 1;
  if (STATES[i].id === 'password' && walk.mode !== 'ask') i++;   // the password step is only for "ask per switch"
  walk.state = STATES[i].id;
  if (walk.state === 'done') markVisited();
  renderStop();
}

// Later: the probe notices the next console cable on its own.
function nextSwitch() {
  walk.index++;
  walk.case = '';
  walk.state = 'waiting';
  if (walk.index < switches.length) renderStop();
  else showSummary();   // the stub has run out of switches
}

// Stub: jumps to a failure or finding at the step where it happens.
function showCase(key) {
  const c = CASES[key];
  walk.case = key;
  walk.state = c.state;
  if (c.mark === 'finding') walk.findings.push(c.note + ' on ' + switches[walk.index].name);
  renderStop();
}

passwordForm.addEventListener('submit', event => {
  event.preventDefault();
  // Later: send the password to the probe. It is never stored.
  passwordForm.reset();
  walk.case = '';
  walk.state = 'login';
  renderStop();
});

// "try again" and "scan again": clear the problem and carry on from the same step.
document.getElementById('retry').addEventListener('click', () => {
  walk.case = '';
  renderStop();
});
// "keep the raw output": the neighbor list stays unparsed, the stop is done.
document.getElementById('keep').addEventListener('click', () => {
  walk.case = '';
  walk.state = 'done';
  markVisited();
  renderStop();
});
document.getElementById('skip').addEventListener('click', nextSwitch);
finishButton.addEventListener('click', showSummary);
document.getElementById('next-state').addEventListener('click', nextState);

for (const key of Object.keys(CASES)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = key;
  button.addEventListener('click', () => showCase(key));
  document.getElementById('cases').append(button);
}

// ---- 3. Summary ----

// Only the lines there is data for.
function showSummary() {
  const left = unvisited();
  const dl = document.getElementById('summary-list');
  dl.replaceChildren();
  if (walk.building) addRow(dl, 'building', walk.building + (walk.isNew ? ' · new' : ''));
  if (walk.where) addRow(dl, 'where', walk.where);
  addRow(dl, 'stops', String(walk.visited.length));
  addRow(dl, 'devices', String(walk.visited.length + left.length));
  if (walk.findings.length > 0) addRow(dl, 'findings', walk.findings.join(' · '));
  if (left.length > 0) addRow(dl, 'unvisited', left.map(u => u.name).join(' · '));
  // Later: save the scan to PocketBase. Offline, keep it on this phone (IndexedDB)
  // and send it when back online; the buildings page counts it as unsent.
  if (!navigator.onLine) addRow(dl, 'unsent', 'kept on this phone until it is back online');
  show('summary');
}
