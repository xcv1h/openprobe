// Buildings page: one collapsible row per building, trouble sorted to the top.

const MINUTE = 60 * 1000;      // milliseconds, the unit Date.now() uses
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const now = Date.now();

// Placeholder data until PocketBase is connected. Field names follow the
// proposed schema, so later only the source of this array changes.
//   scans:  newest first; an empty list means never scanned
//   unsent: scans still stored on this phone, not uploaded yet
const buildings = [
  {
    id: 'b1', name: 'Building B', location: 'server room, 2nd floor',
    scans: [
      { id: 's13', started: new Date(now - 2 * HOUR), device_count: 14, devices_down: 2, devices_stale: 1, technician: 'j.doe' },
      { id: 's09', started: new Date(now - 9 * DAY),  device_count: 14, devices_down: 0, devices_stale: 0, technician: 'j.doe' },
      { id: 's04', started: new Date(now - 30 * DAY), device_count: 13, devices_down: 0, devices_stale: 1, technician: 'm.ito' },
    ],
    unsent: 0,
  },
  {
    id: 'b2', name: 'Warehouse 3', location: 'basement B-012, key at reception',
    scans: [
      { id: 's12', started: new Date(now - 3 * DAY),  device_count: 9, devices_down: 0, devices_stale: 2, technician: 'a.kovacs' },
      { id: 's07', started: new Date(now - 20 * DAY), device_count: 9, devices_down: 0, devices_stale: 0, technician: 'a.kovacs' },
    ],
    unsent: 1,
  },
  {
    id: 'b3', name: 'Main office', location: '',
    scans: [
      { id: 's11', started: new Date(now - 5 * DAY), device_count: 22, devices_down: 0, devices_stale: 0, technician: 'j.doe' },
    ],
    unsent: 0,
  },
  {
    id: 'b4', name: 'Library', location: 'ground floor, cabinet behind the desk',
    scans: [
      { id: 's10', started: new Date(now - 12 * DAY), device_count: 6, devices_down: 0, devices_stale: 0, technician: 'm.ito' },
      { id: 's02', started: new Date(now - 60 * DAY), device_count: 6, devices_down: 1, devices_stale: 0, technician: 'm.ito' },
    ],
    unsent: 0,
  },
  { id: 'b5', name: 'Annex', location: 'east wing, rack 1', scans: [], unsent: 0 },
  { id: 'b6', name: 'Gym', location: '', scans: [], unsent: 0 },
];

// Placeholder probes (the proposed `probes` collection).
//   last_seen: the last time the probe talked to the server
//   building:  the building it is scanning right now ('' = idle)
//   since:     when that scan started
const probes = [
  { id: 'p1', name: 'probe-01', last_seen: new Date(now - 12 * 1000), building: 'b3', since: new Date(now - 40 * MINUTE) },
  { id: 'p2', name: 'probe-02', last_seen: new Date(now - 3 * HOUR),  building: '',   since: null },
];

// How each status is shown, and its place in the sort order (0 = top).
const STATUS = {
  down:  { icon: '✕', word: 'down',          rank: 0 },
  stale: { icon: '▲', word: 'stale',         rank: 1 },
  never: { icon: '○', word: 'never scanned', rank: 2 },
  ok:    { icon: '●', word: 'ok',            rank: 3 },
};

// A scan's status. One device down outweighs any number of stale ones.
function statusOf(scan) {
  if (!scan) return 'never';
  if (scan.devices_down > 0) return 'down';
  if (scan.devices_stale > 0) return 'stale';
  return 'ok';
}

// plural(1, 'scan', 'scans') -> "1 scan", plural(3, 'scan', 'scans') -> "3 scans"
function plural(n, one, many) {
  return n + ' ' + (n === 1 ? one : many);
}

// "3d ago" for the collapsed row, or "3 days ago" (long) inside it.
const longFormat = new Intl.RelativeTimeFormat('en');
function ago(date, long) {
  const seconds = (Date.now() - date.getTime()) / 1000;
  // Use the biggest unit that fits at least once: 90 minutes -> 1 hour.
  for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return long ? longFormat.format(-n, unit) : n + unit[0] + ' ago';
  }
  return 'just now';
}

// A <time> element. It keeps the exact date in its datetime attribute,
// which updateTimes() reads to rewrite the text.
function makeTime(date, long) {
  const time = document.createElement('time');
  time.setAttribute('datetime', date.toISOString());
  if (long) time.dataset.long = '';
  time.textContent = ago(date, long);
  return time;
}

// Rewrites every relative time on the page, so "2m ago" keeps counting.
function updateTimes() {
  for (const time of document.querySelectorAll('time[datetime]')) {
    const date = new Date(time.getAttribute('datetime'));
    time.textContent = ago(date, time.hasAttribute('data-long'));
  }
}

// A symbol that screen readers skip, because the word next to it says the same thing.
function icon(symbol) {
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.textContent = symbol;
  return span;
}

// Adds one "label  value" line to a <dl>. The value can be text, elements, or both.
function addRow(dl, label, ...value) {
  const dt = document.createElement('dt');
  const dd = document.createElement('dd');
  dt.textContent = label;
  dd.append(...value);
  dl.append(dt, dd);
}

// The last few scans as symbols, oldest on the left: "● ● ▲ ✕".
// role="img" makes screen readers read the label instead of the symbols.
function historyMarks(scans) {
  const recent = scans.slice(0, 4).reverse();   // scans are newest first
  const marks = document.createElement('span');
  marks.setAttribute('role', 'img');
  marks.setAttribute('aria-label', 'oldest to newest: ' + recent.map(s => STATUS[statusOf(s)].word).join(', '));
  for (const scan of recent) {
    const mark = document.createElement('span');
    mark.className = 'status ' + statusOf(scan);
    mark.textContent = STATUS[statusOf(scan)].icon;
    marks.append(mark, ' ');
  }
  return marks;
}

// Copies the <template> row and fills it in for one building.
function renderRow(b) {
  const li = document.getElementById('row').content.firstElementChild.cloneNode(true);
  const last = b.scans[0];   // undefined if never scanned

  li.dataset.name = b.name.toLowerCase();   // what the filter matches against
  li.querySelector('.name').textContent = b.name;
  li.querySelector('.status').classList.add(b.status);
  li.querySelector('.icon').textContent = STATUS[b.status].icon;
  li.querySelector('.word').textContent = STATUS[b.status].word;

  const when = li.querySelector('.when');
  if (b.live) {
    // Fixed text, so innerHTML is safe here. Everything from the database goes
    // through textContent instead, so a building name can never run as code.
    when.innerHTML = '<span class="pulse" aria-hidden="true">●</span> live';
  } else if (last) {
    when.append(makeTime(last.started, false));
  } else {
    when.hidden = true;   // never scanned: "never scanned" uses that space instead
  }

  // Expanded part: only the lines we have data for.
  const dl = li.querySelector('dl');
  if (b.location) addRow(dl, 'where', b.location);
  if (last) {
    let devices = String(last.device_count);
    if (last.devices_down > 0) devices += ` · ${last.devices_down} down`;
    if (last.devices_stale > 0) devices += ` · ${last.devices_stale} stale`;
    addRow(dl, 'devices', devices);
    addRow(dl, 'last scan', makeTime(last.started, true), last.technician ? ' by ' + last.technician : '');
  }
  if (b.scans.length > 1) addRow(dl, 'history', historyMarks(b.scans));
  if (b.unsent > 0) addRow(dl, 'unsent', plural(b.unsent, 'scan', 'scans') + ', still on this phone');

  // Never scanned: nothing to open, so only "start new scan" is left.
  const open = li.querySelector('.open');
  if (last) open.href = 'scan.html?id=' + encodeURIComponent(last.id);
  else open.hidden = true;
  li.querySelector('.start').href = 'probe.html?building=' + encodeURIComponent(b.id);

  return li;
}

// The sentence under the heading, e.g. "2 need attention · 1 unsent scan".
function renderOverview() {
  let attention = 0;
  let unsent = 0;
  for (const b of buildings) {
    if (b.status === 'down' || b.status === 'stale') attention++;
    unsent += b.unsent;
  }
  const parts = [attention > 0 ? plural(attention, 'needs attention', 'need attention') : 'nothing needs attention'];
  if (unsent > 0) parts.push(plural(unsent, 'unsent scan', 'unsent scans'));
  document.getElementById('overview').textContent = parts.join(' · ');
}

// Probes check in with the server regularly. Silent for 2 minutes = offline.
function isOnline(probe) {
  return Date.now() - probe.last_seen.getTime() < 2 * MINUTE;
}

function buildingById(id) {
  return buildings.find(b => b.id === id);
}

// One short line per probe under the overview, so it fits a phone:
//   "probe-01 ● scanning Main office", "probe-01 ● online" (idle), "probe-02 ○ offline · 3h ago"
function renderProbes() {
  const box = document.getElementById('probes');
  for (const p of probes) {
    const line = document.createElement('p');
    const link = document.createElement('a');
    link.href = 'probe.html?id=' + encodeURIComponent(p.id);
    link.textContent = p.name;
    if (isOnline(p)) {
      const target = buildingById(p.building);
      line.append(link, ' ', icon('●'), target ? ' scanning ' + target.name : ' online');
    } else {
      line.className = 'offline';
      line.append(link, ' ', icon('○'), ' offline · ', makeTime(p.last_seen, false));
    }
    box.append(line);
  }
}

// Clock time for today ("19:40"), weekday for this week ("mon"), date for older ("12 oct").
function logTime(date) {
  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  if (Date.now() - date.getTime() < 6 * DAY) {
    return date.toLocaleDateString('en-GB', { weekday: 'short' }).toLowerCase();
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toLowerCase();
}

// The activity log beside the list on wide screens: what happened, newest first.
// The list answers "what is broken?", this answers "what just happened?".
function renderLog() {
  const events = [];
  for (const b of buildings) {
    for (const scan of b.scans) {
      let note = 'ok';
      if (scan.devices_down > 0) note = scan.devices_down + ' down';
      else if (scan.devices_stale > 0) note = scan.devices_stale + ' stale';
      events.push({ date: scan.started, who: scan.technician, what: 'scanned ' + b.name, status: statusOf(scan), note });
    }
  }
  for (const p of probes) {
    const target = buildingById(p.building);
    if (isOnline(p) && target) {
      events.push({ date: p.since, who: p.name, what: 'scanning ' + target.name, status: 'live' });
    }
  }
  events.sort((a, b) => b.date - a.date);   // newest first

  const log = document.getElementById('log');
  for (const e of events.slice(0, 12)) {
    const li = document.createElement('li');
    const at = document.createElement('span');
    const who = document.createElement('span');
    const what = document.createElement('span');
    const result = document.createElement('span');
    at.className = 'at';
    who.className = 'who';
    what.className = 'what';
    at.textContent = logTime(e.date);
    who.textContent = e.who;
    what.textContent = e.what;
    if (e.status === 'live') {
      const dot = icon('●');
      dot.className = 'pulse';
      result.append(dot, ' live');
    } else {
      result.className = 'status ' + e.status;
      result.append(icon(STATUS[e.status].icon), ' ' + e.note);
    }
    li.append(at, who, what, result);
    log.append(li);
  }
  if (events.length === 0) log.textContent = 'nothing yet';
}

const list = document.getElementById('list');
const filter = document.getElementById('filter');
const noMatch = document.getElementById('no-match');

// Hides rows whose name doesn't contain the typed text (case-insensitive).
function applyFilter() {
  const query = filter.value.trim().toLowerCase();
  let shown = 0;
  for (const li of list.children) {
    li.hidden = !li.dataset.name.includes(query);
    if (!li.hidden) shown++;
  }
  noMatch.textContent = shown === 0 ? `no building matches "${filter.value.trim()}"` : '';
}

if (buildings.length === 0) {
  document.getElementById('empty').hidden = false;
  document.getElementById('filter-block').hidden = true;
} else {
  for (const b of buildings) {
    b.status = statusOf(b.scans[0]);
    b.live = probes.some(p => isOnline(p) && p.building === b.id);   // an online probe is scanning it
  }

  // Trouble first (down, stale, never scanned, ok), then A to Z.
  // Equal ranks subtract to 0, and 0 || x gives x, so ties fall through to the name.
  buildings.sort((a, b) => STATUS[a.status].rank - STATUS[b.status].rank || a.name.localeCompare(b.name));

  for (const b of buildings) list.append(renderRow(b));
  renderOverview();
  filter.addEventListener('input', applyFilter);
}
renderProbes();
renderLog();

setInterval(updateTimes, 60 * 1000);
// Phones pause timers while the screen is off; catch up as soon as the page is visible again.
document.addEventListener('visibilitychange', updateTimes);
