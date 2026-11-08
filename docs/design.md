# openprobe design system

Exported from the openprobe design system artifact. This file is the reference for every page under `web/`; when the code and this file disagree, fix one of them on purpose.

## Tokens

Copy into `web/css/style.css` as the `:root` block. Use these names; don't add colours outside them.

```css
:root {
  /* colour (dark theme; light is not shipped yet) */
  --ground: #0A0A0A;
  --surface-raised: #151515;
  --well: #000000;
  --well-ink: #EBEBEB;
  --well-muted: #8C8C8C;
  --line: #2B2B2B;
  --line-strong: #666666;
  --ink: #EBEBEB;
  --ink-muted: #9C9C9C;
  --action: var(--ink);
  --on-action: var(--ground);
  --signal: #FF2A2A;
  --on-signal: #0A0A0A;
  --signal-ink: #FF4D4D;
  --signal-soft: #2A0D0D;
  --wire-orange: #FF8A1F;
  --wire-brown: #C08A55;
  --wire-green: #3FD47A;
  --wire-blue: #6B93FF;
  --wire-white: #EBEBEB;
  --console: #6EC6F0;
  --on-console: #0A0A0A;
  --console-soft: #0B2230;
  --focus: var(--ink);
  --link: var(--ink);

  /* type */
  --font-display: "Martian Mono", ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace;
  --font-mono: "Martian Mono", ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace;

  /* spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --tap-min: 44px;
  --row-min: 48px;

  /* radius */
  --radius-none: 0;
  --radius-pill: 999px;

  /* border */
  --border-hair: 1px;
  --border-wire: 4px;
  --border-focus: 2px;
}
```

## Colour usage notes

- `--ground`: Page background. The WAYSOD black (white in light).
- `--surface-raised`: The rare floating thing: a menu, a popover, ghost-button hover. Never a box around content.
- `--well`: ConsolePane ground. Stays dark in both themes: a terminal is a terminal.
- `--well-ink`: Console output on well.
- `--well-muted`: Prompts and timestamps on well.
- `--line`: Hairline under each row and under the header. Decorative: never the only edge of a control.
- `--line-strong`: Control edges: ghost-button border, input and filter underline. 3:1 on ground in both themes.
- `--ink`: Primary text on ground and surface-raised. Also the louder status rung: stale, live, the step in progress.
- `--ink-muted`: Labels, metadata, relative times, and the quiet status rung: ok, never scanned, offline, done. On ground and surface-raised.
- `--action`: Primary action fill (start new scan, start scan, finish scan). One per view. Alias of ink: the primary action is inverted text, not red.
- `--on-action`: Text on an action fill. Alias of ground.
- `--signal`: The WAYSOD red. Means broken, nothing else. As a fill only on the cover slab; in the app use signal-ink.
- `--on-signal`: Text on a signal fill. Black on red, never white.
- `--signal-ink`: Red as text: down, a failed step, a failed login. On ground, surface-raised and signal-soft.
- `--signal-soft`: Ground behind one alarm line, when a page must lead with it. Rare.
- `--wire-orange`: A finding: something the probe noticed that is not a failure (a privileged console session left open, CDP off). Glyph ◆. Also the orange conductor in WireRule and the cover. Text on ground.
- `--wire-brown`: Second-hand values: what a neighbor reported about a device no stop has confirmed yet. Turns ink once a stop confirms it. Text on ground.
- `--wire-green`: The green conductor in WireRule and the cover. Never status: ok is quiet, not green.
- `--wire-blue`: The blue conductor in WireRule and the cover. Never status, never links.
- `--wire-white`: The white stripe of a striped conductor (WireRule, cover). Never text.
- `--console`: Rollover-cable blue. The RS232 session and nothing else: attach console, the session bar. Text or fill on ground.
- `--on-console`: Text on a console fill.
- `--console-soft`: Ground of the console session bar; console text reads on it.
- `--focus`: Keyboard focus outline: 2px solid, 2px offset. Alias of ink, so focus never reads as a status or the console.
- `--link`: Inline links: ink, underlined, 3px offset. Not red: red means broken.

## Brand book

openprobe keeps the WAYSOD core — `ground`, `ink`, `signal` — and stays quiet until something is wrong. The probe is a console tool: a technician walks a building switch by switch, plugs the rollover cable into each console port, and the probe logs in, reads who the switch is and who it is cabled to, and the map grows by one. Every screen belongs to one of three layers, and should look like it:

- **buildings** — what is broken, and how old is what we know. (BuildingRow, Summary, ActivityLog)
- **the walk** — what do I do right now, and where do I go next. (StopSteps, NextStops)
- **the device** — what the switch said, verbatim. (DeviceTable, ConsolePane)

### Content fundamentals

- The name is **openprobe**, always lowercase. No logo exists: set the name in `wordmark`, never draw a mark.
- The pitch, and the first thing a technician should understand: **the console password is all it needs.** Say it on the login page and nowhere else: it's a pitch for someone deciding to use openprobe, not something a technician needs to read again at every scan. Don't mention Ethernet unless the technician turns it on.
- Voice: terse, literal, operator to operator. Say what happened: "3 neighbors", "SW-ACCESS-01.lab.local" — not "we found some devices!".
- An instruction is one sentence, second person, verb first: "plug the rollover cable into the switch's console port." No "please", no "we".
- Everything is lowercase except what a device prints, which stays exactly as printed: `SW-ACCESS-01`, `GigabitEthernet1/0/24`, `WS-C2960X-24TS-L`.
- Labels are plain words, never schema field names: `device`, `port`, `address`, `vlan` — not `device_id`, `local_port`, `mgmt_ip`, `native_vlan`.
- Actions say what happens, as lowercase verb phrases: `start new scan`, `open last scan`, `start scan`, `finish scan`, `attach console`, `skip this switch`.
- Times are relative: short in a collapsed row (`3d ago`), long when opened (`3 days ago by j.doe`).
- An empty or error state says what to do next, not only what went wrong: "no buildings yet. add one in the PocketBase admin panel, then reload this page."
- No emoji, no exclamation marks. The probe is diagnostic: never attack vocabulary (sniff, crawl, exploit, own).

### Visual foundations

#### Quiet when fine

- Status is a brightness ladder first, colour second. Quiet (`ink-muted`): ok, never scanned, offline, done. Loud (`ink`): stale, live, the step in progress. Broken (`signal-ink`): down, a failed step.
- `signal` red means broken and nothing else. Never use it for an action, a link, the active nav item or decoration. As a fill it appears only on the cover.
- The primary action is an `action` fill with `on-action` text — inverted ink, not red. One per view.
- `wire-orange` is a **finding**: something the probe noticed that is not a failure — a privileged console session left open, CDP turned off. Glyph ◆.
- `wire-brown` is **second-hand**: a value a neighbor reported about a device no stop has confirmed yet. When a stop confirms it, it turns `ink`. Use it only where second-hand values sit next to first-hand ones (DeviceTable, an opened BuildingRow).
- `console` blue is the RS232 session and nothing else: the `attach console` button and the session bar on `console-soft`.
- `wire-green`, `wire-blue` and `wire-white` exist for the WireRule and the cover. Never status. There is no green "ok": ok is quiet.
- Every state is a glyph plus a word (StatusMark). Colour never carries meaning alone.
- Dark is the app's theme. `light` exists for screens in direct sun; keep every pair passing there even before it ships.

#### Type — one mono, on a character grid

- Set everything in `mono` (Martian Mono). `display` is the same face, heavy, for the `wordmark` and `title`.
- `body` is 1rem / 1.5. The root is 16px, 18px from 88rem — size in rem so everything follows.
- Lay out in characters: gaps of `1ch`, fixed columns in ch — row marker `1ch`, status `7ch`, time `7ch`, field labels `10ch`. Rows line up because every glyph is the same width; that grid is the look.
- Page title in `title`. Section headings in `heading`, `ink-muted`, the same size as body: sections are separated by space, not size.

#### Shape — lines, not boxes

- No cards, no bordered panels. Separate with space and a `line` hairline under each row.
- Square everything (`radius-none`). The only round things are a WireRule's conductor ends (`radius-pill`).
- No shadows, no gradients (a striped conductor is the one exception). `surface-raised` only for a floating menu or a ghost-button hover.

#### Layout

- Header: wordmark link left, nav right (`ink-muted`; the current page `ink`), a `line` hairline under it, edge to edge. Links in it pad to `tap-min`.
- Gutter `space-4` on phones, `space-8` from 48rem.
- Content is one centred column. List pages are 50ch plus gutters. The device table may go to 80rem and scrolls sideways inside `.op-scroll`; the page never scrolls sideways.
- From 72rem the buildings page adds a second column: the ActivityLog, 56ch, `6ch` from the list.
- Controls are at least `tap-min` (44px) tall; list rows at least `row-min` (48px).

#### States and motion

- Focus: a `border-focus` solid `focus` outline, 2px offset, on everything you can tab to. Inputs show focus by turning their underline `ink`.
- Motion means "happening now" and nothing else: the live ● pulses on a 2s cycle, and a row's ▸ turns as it opens. Under `prefers-reduced-motion` both stop and the word stays.

### The scan walk

`start new scan` opens the walk. This is where openprobe holds the technician's hand, so each screen answers one question: what do I do now?

1. **setup** — building (already filled in), probe (with its StatusMark; an offline probe can't be picked, and the screen says why), console password: `none` / `one for all` / `ask per switch`. No pitch here: the technician already knows. Primary action: `start scan`.
2. **stop** — one screen per switch: StopSteps. The ask on top in `title`, the steps under it. The ask changes with the step:

   | step | mark | ask |
   | --- | --- | --- |
   | waiting for console | ● live | plug the rollover cable into the switch's console port. |
   | password | ● live | type the console password for this switch. (only in `ask per switch`) |
   | logging in | ● live | — |
   | identified | ✓ done | shows `hostname.domain`: the same name its neighbors use for it |
   | reading neighbors | ● live | — |
   | done | ✓ done | unplug and go to the next switch. |

3. **next** — under the done ask, NextStops: neighbors heard but not yet visited, each with the port to follow from this switch. The probe's buzzer and OLED say the same thing at the same moment.
4. **finish** — `finish scan` leads to a KeyValue summary: stops, devices, findings, still unvisited. If the phone is offline the scan is kept as unsent, and the buildings page says so.

Failures and findings replace the ask and keep the step list:

| case | mark | ask |
| --- | --- | --- |
| no answer on console | ✕ failed | nothing on the console. check it's the rollover cable, in the console port, not an Ethernet port. |
| login failed | ✕ failed | that password didn't work. type it again, or skip this switch. |
| session left open | ◆ finding | someone left a privileged session open on this console. scanning anyway; it's recorded as a finding. |
| already scanned | ▲ stale | this is SW-ACCESS-01, scanned at stop 2. scan it again, or skip? |
| CDP off | ◆ finding | CDP is off on this switch. it's on the map with no links. |
| unreadable output | ✕ failed | couldn't read the neighbor list. try again, or keep the raw output. |

### Iconography

- No icon set. Unicode glyphs, always beside a word: ✕ down / failed · ▲ stale · ○ never scanned / offline / to do · ● ok / live · ◆ finding · ✓ done · ▸ row marker. Glyphs are `aria-hidden`; the word is what a screen reader reads.
- No emoji. If an icon set is added later: single-weight line icons, 1.5px stroke, in the colour of the word beside them.

## Components

### StatusMark

StatusMark is a glyph and a word: the state of a building, a probe or a scan step, quiet when fine and loud when not.

| modifier | glyph | word | colour |
| --- | --- | --- | --- |
| `op-mark--down` | ✕ | down | `signal-ink` |
| `op-mark--failed` | ✕ | (what failed) | `signal-ink` |
| `op-mark--stale` | ▲ | stale | `ink` |
| `op-mark--live` | ● (pulsing) | live | `ink` |
| `op-mark--finding` | ◆ | (what was found) | `wire-orange` |
| `op-mark--ok` | ● | ok | `ink-muted` |
| `op-mark--never` | ○ | never scanned | `ink-muted` |
| `op-mark--offline` | ○ | offline | `ink-muted` |
| `op-mark--done` | ✓ | (the step) | `ink-muted` |
| `op-mark--todo` | ○ | (the step) | `ink-muted` |

Markup: `<span class="op-mark op-mark--down"><span aria-hidden="true">✕</span> down</span>`. For live, give the glyph span `op-pulse`; it stops under `prefers-reduced-motion`.

The consumer provides the modifier and the word. The word is required — glyph plus word is what makes state readable without colour. A building's status is its last scan's worst: any device down is `down`, else any stale is `stale`.

Don't: show a glyph without its word, make ok green, invent a colour for a new state (map it onto these), or put the mark in a pill or box.

### Button

Button is how an operator acts: a lowercase verb phrase saying what happens ("start new scan", "attach console").

- `op-btn op-btn--primary`: `action` fill, `on-action` text — inverted ink. One per view: the thing the screen is for.
- `op-btn op-btn--console`: `console` fill, `on-console` text. Only for actions that attach to the RS232 session.
- `op-btn`: transparent, `line-strong` edge, `ink` text, `surface-raised` on hover. Everything else.
- `disabled` (or `aria-disabled="true"` on a link): `ink-muted` text, `line` edge. Say why in the label or right under it ("probe offline").
- Group buttons in `op-actions` (wraps, `space-3` gaps).

The consumer provides a `<button>` or `<a>` and the label. Height is at least `tap-min`; corners square.

Don't: make an action red (red means broken), put two primary buttons in one view, or add icons.

### Field

Field is a text input as an underline, plus the filter variant that reads like a prompt.

- `div.op-field` > `label` (`ink-muted`) + `input.op-input`: no box, a `line-strong` underline that turns `ink` on focus. 44px tall, font inherited (16px, so iOS doesn't zoom in).
- `div.op-filter` > `label` + `input[type=search]`: label and input on one line, one underline under both, like `filter █`. Use it above any list longer than about ten rows.
- A choice of a few options (console password mode) is a group of radio buttons with plain-word labels, not a select.
- Help or error text goes on the line under the input, in `ink-muted` or `signal-ink`.

The consumer provides the label (always visible, never only a placeholder) and the input.

Don't: draw a box around inputs, or rely on the placeholder as the label.

### KeyValue

KeyValue is a list of labelled facts: `dl.op-kv`, labels in a fixed `10ch` column in `ink-muted`, values beside them.

- Used inside an opened BuildingRow, on the probe page, and for the scan summary at the end of the walk.
- Values that wrap (an address) wrap; nothing scrolls sideways.
- A second-hand value (reported by a neighbor, not yet confirmed by a stop) takes `dd.heard` (`wire-brown`).
- Show only the lines you have data for, rather than an em dash.

The consumer provides `<dt>`/`<dd>` pairs, labels as plain lowercase words.

### Summary

Summary is the top of the buildings page: one sentence instead of a dashboard, then one line per probe.

- `p.op-summary__overview` (`ink-muted`): "2 need attention · 1 unsent scan", or "nothing needs attention".
- One `<p>` per probe: the probe name as a link, then a StatusMark-style glyph and what it's doing — "probe-01 ● scanning Main office", "probe-01 ● online", or, with class `offline`, "probe-02 ○ offline · 3h ago".
- A probe that hasn't checked in for 2 minutes is offline.

The consumer provides the counts and the probes. Keep each line short enough for a phone.

Don't: turn it into stat tiles or big numbers.

### BuildingRow

BuildingRow is one building in the buildings list: a native `<details>` accordion whose collapsed line answers "is it broken, and how old is that?".

- List: `<ul class="op-rows" role="list">`, one `<li>` per building, a `line` hairline under each. (`role="list"` because Safari stops announcing an unstyled `<ul>` as a list.)
- Collapsed line (`<summary>` → `span.op-row__line`, a grid of `1ch | name | 7ch | 7ch`): `▸` marker, name (truncates with …), StatusMark, relative time. Live scans show `● live` in the time column; never-scanned rows let `○ never scanned` take both columns. The grid is on an inner span because older Safari ignores grid on `<summary>`.
- Opened (`div.op-row__more`, indented 2ch to sit under the name): a KeyValue — `where`, `devices` ("14 · 2 down · 1 stale"), `last scan` ("2 hours ago by j.doe"), `history` (the last four marks, oldest left), `unsent` — then `op-actions` with `open last scan` and `start new scan` (primary). Show only the lines there is data for; a never-scanned building gets only `start new scan`.
- Sort trouble first: down, stale, never scanned, ok; then A to Z.

The consumer provides the building, its last scan's counts and the two links. Opening and closing needs no script.

Don't: make the whole row a link that jumps straight into a scan, box the opened part, or colour whole rows.

### ActivityLog

ActivityLog answers "what just happened?" next to the list that answers "what is broken?": newest first, one line per event.

- `ol.op-log`, each `<li>` a grid of `7ch | 9ch | rest | 10ch`: time (`19:40` today, `mon` this week, `12 oct` older), who (technician or probe), what ("scanned Building B"), result as a StatusMark ("✕ 2 down", "● live").
- Shown only from 72rem, beside the buildings list. Phones don't get it: the list is enough there.
- Show the last 12 events; "nothing yet" when empty.

The consumer provides the events.

Don't: show it on phones, or wrap lines (they truncate with …).

### StopSteps

StopSteps is the screen for one switch during a scan: the one thing to do now, in big type, and the steps of this stop under it.

- `p.op-stop__count` (`ink-muted`): "stop 3 · Building B".
- `p.op-stop__ask` in `title`: one sentence (wrap device names in `span.op-dev` so they never break at a hyphen), verb first, saying what to do now — "plug the rollover cable into the switch's console port." While the probe works on its own (logging in, reading neighbors) the ask says what it's doing. Add `is-failed` (`signal-ink`) or `is-finding` (`wire-orange`) when the ask is about a problem. Put `aria-live="polite"` on the ask so screen readers hear each change.
- `ol.op-steps`: one line per step, a glyph column then the step. Steps: console found · logged in · identified · neighbors read · done. Done steps `✓` in `ink-muted`; the current step `●` pulsing (`op-pulse`) with `is-now` (`ink`); later steps `○`. A step that failed is `✕` with `is-failed`; a finding is `◆` with `is-finding`. A result goes under its step in `span.op-steps__note` (`ink`): "9600 8N1", "SW-ACCESS-01.lab.local", "3 neighbors".
- Below the steps, `op-actions` with only what makes sense now: `try again` / `skip this switch` after a failure, `scan again` / `skip` for an already-scanned switch, `finish scan` always last and never primary until the walk is done.
- When the stop is done, the ask becomes "unplug and go to the next switch." and NextStops appears under the steps. The probe's buzzer and OLED say the same thing at the same moment.

The asks for every step, failure and finding are in the brand book under "The scan walk".

The consumer provides the stop number, the current step, its results, and the ask text.

Don't: use a progress bar or percentage (the number of stops isn't known), show more than one ask at once, or hide the steps while asking.

### NextStops

NextStops tells the technician where to walk next: the neighbors this stop heard that no stop has visited yet, each with the port to follow.

- Under a `heading` "not scanned yet" and one `ink-muted` line: "follow the cable from these ports."
- `ul.op-next`, one row per neighbor (at least `row-min`, `line` hairline under each): the device name as CDP reported it, then `span.op-next__via` in `ink-muted` — "from Gi1/0/1".
- Order by local port, so the technician can work along the switch.
- Neighbors heard on earlier stops and still unvisited follow under a second heading, "still not scanned", with the switch they were heard from: "from SW-CORE-01 Gi1/0/3".
- Empty: "every neighbor has been scanned. finish the scan, or keep going." and `finish scan` becomes the primary action.

The consumer provides the unvisited neighbors with the local port they were heard on.

Don't: colour these second-hand (everything here is second-hand; the heading says so), or link a row to anything but its details.

### DeviceTable

DeviceTable is a scan's devices: one row per device, the switch's own words in mono, hairlines only.

- Wrap in `div.op-scroll` so a wide table scrolls sideways on a phone and the page doesn't.
- `table.op-table`: headers in plain words and `ink-muted` — `device`, `port`, `platform`, `version`, `address`, `vlan`, `stop`. Not the schema names.
- Values exactly as IOS printed them.
- `stop` says where the row was confirmed: "stop 2". A device only heard from a neighbor has no stop yet: its row takes `tr.heard` (`wire-brown`) and its stop cell says "not yet" in `ink-muted`.
- Sort by stop, then by device name; unvisited devices last.

The consumer provides the rows.

Don't: wrap the table in a card, stripe or colour rows by status, or abbreviate interface names the device didn't abbreviate.

### ConsolePane

ConsolePane is the live RS232 session or a captured output: `well` ground, `well-ink` text, in both themes.

- `div.op-console__bar` above it, on `console-soft` in `console`: "● console · 9600 8N1 · SW-ACCESS-01" on the left, the transport ("via tunnel") on the right.
- `pre.op-console`: the output, verbatim, in `body` size. Prompts and timestamps in `span.p` (`well-muted`). Scrolls sideways rather than wrapping; at least 16 lines tall.
- In the live app this is where xterm.js mounts; keep the bar and the well around it.

The consumer provides the text, never reformatted, and the session details.

Don't: syntax-colour IOS output, round its corners, or add fake window chrome.

### WireRule

WireRule is openprobe's one decorative mark: four conductors in T568B order — white-orange, orange, white-green, blue — laid flat.

Markup: `<div class="op-wire"><i class="wo"></i><i class="o"></i><i class="wg"></i><i class="b"></i></div>`. Each stripe is `border-wire` thick with `radius-pill` ends, 2px apart.

Use it in exactly two places: under the `wordmark` on the login page (about 24ch wide), and on the cover. Working pages — buildings, the walk, devices, console — don't carry it: there the wire colours would read as status.

The consumer provides the width; it fills its container.

Don't: reorder the conductors (the order is the standard), use it as a progress bar or divider between rows, or stack two.

## Reference CSS

The design system's own stylesheet, for comparison. Class names here are the design system's (`op-…`); the site keeps its own class names and takes the rules.

```css
@import url("https://fonts.googleapis.com/css2?family=Martian+Mono:wdth,wght@75..112.5,100..800&display=swap");

/* Base: one mono face on a character grid */
html { background: var(--ground); color: var(--ink); font: 400 1rem/1.5 var(--font-mono); }
body { margin: 0; }
[hidden] { display: none !important; }
a { color: var(--link); text-underline-offset: 3px; }
:focus-visible { outline: var(--border-focus) solid var(--focus); outline-offset: 2px; }
.op-title { font: 700 1.4rem/1.5 var(--font-display); margin: var(--space-8) 0 var(--space-2); }
.op-heading { font: 400 1rem/1.5 var(--font-mono); color: var(--ink-muted); margin: var(--space-8) 0 var(--space-2); }

/* StatusMark: glyph + word, brightness first */
.op-mark { white-space: nowrap; }
.op-mark--ok, .op-mark--never, .op-mark--offline, .op-mark--done, .op-mark--todo { color: var(--ink-muted); }
.op-mark--stale, .op-mark--live { color: var(--ink); }
.op-mark--down, .op-mark--failed { color: var(--signal-ink); }
.op-mark--finding { color: var(--wire-orange); }
.op-pulse { animation: op-pulse 2s ease-in-out infinite; }
@keyframes op-pulse { 50% { opacity: .3; } }

/* Button: links and buttons look the same */
.op-btn { display: inline-flex; align-items: center; min-height: var(--tap-min); padding: 0 var(--space-4); border: var(--border-hair) solid var(--line-strong); border-radius: var(--radius-none); background: transparent; color: var(--ink); font: inherit; text-decoration: none; cursor: pointer; }
.op-btn:hover { background: var(--surface-raised); }
.op-btn--primary, .op-btn--primary:hover { background: var(--action); color: var(--on-action); border-color: var(--action); }
.op-btn--console, .op-btn--console:hover { background: var(--console); color: var(--on-console); border-color: var(--console); }
.op-btn:disabled, .op-btn[aria-disabled="true"] { background: transparent; color: var(--ink-muted); border-color: var(--line); cursor: not-allowed; }
.op-actions { display: flex; flex-wrap: wrap; gap: var(--space-3); margin: var(--space-4) 0 0; }

/* Field: underlined input, and the filter "prompt" */
.op-field { display: grid; gap: var(--space-2); }
.op-field label { color: var(--ink-muted); }
.op-input { font: inherit; color: inherit; background: none; border: 0; border-bottom: var(--border-hair) solid var(--line-strong); border-radius: 0; padding: 10px 0; }  /* 24px line + 20px = 44px */
.op-input:focus { outline: none; border-bottom-color: var(--ink); }
.op-filter { display: flex; align-items: center; gap: 1ch; border-bottom: var(--border-hair) solid var(--line-strong); }
.op-filter:focus-within { border-bottom-color: var(--ink); }
.op-filter label { color: var(--ink-muted); }
.op-filter input { flex: 1; min-width: 0; font: inherit; color: inherit; background: none; border: 0; padding: 10px 0; }
.op-filter input:focus { outline: none; }
.op-filter input::placeholder { color: var(--ink-muted); }

/* KeyValue: label column fixed at 10ch */
.op-kv { display: grid; grid-template-columns: 10ch 1fr; gap: var(--space-1) 1ch; margin: 0; }
.op-kv dt { color: var(--ink-muted); }
.op-kv dd { margin: 0; overflow-wrap: anywhere; }
.op-kv .heard { color: var(--wire-brown); }

/* Summary: one sentence, then one line per probe */
.op-summary { margin: 0 0 var(--space-6); }
.op-summary p { margin: 0; }
.op-summary__overview, .op-summary .offline { color: var(--ink-muted); }

/* BuildingRow: <details> accordion, rows on a character grid */
.op-rows { list-style: none; margin: 0; padding: 0; }
.op-rows > li { border-bottom: var(--border-hair) solid var(--line); }
.op-row summary { list-style: none; cursor: pointer; }
.op-row summary::-webkit-details-marker { display: none; }
.op-row__line { display: grid; grid-template-columns: 1ch minmax(0, 1fr) 7ch 7ch; gap: 1ch; align-items: center; min-height: var(--row-min); }
.op-row__marker { color: var(--ink-muted); transition: transform .15s; }
.op-row[open] .op-row__marker { transform: rotate(90deg); }
.op-row__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.op-row__line .op-mark--never { grid-column: span 2; }
.op-row__when { text-align: right; white-space: nowrap; }
.op-row__when time { color: var(--ink-muted); }
.op-row__more { padding: 0 0 var(--space-4) 2ch; }

/* ActivityLog: time | who | what | result */
.op-log { list-style: none; margin: 0; padding: 0; }
.op-log li { display: grid; grid-template-columns: 7ch 9ch minmax(0, 1fr) 10ch; gap: 2ch; padding: var(--space-1) 0; white-space: nowrap; }
.op-log .at, .op-log .who { color: var(--ink-muted); }
.op-log .what { overflow: hidden; text-overflow: ellipsis; }

/* StopSteps: the ask on top, the steps under it */
.op-stop__count { color: var(--ink-muted); margin: 0; }
.op-stop__ask { font: 700 1.4rem/1.5 var(--font-display); margin: var(--space-2) 0 var(--space-6); }
.op-stop__ask.is-failed { color: var(--signal-ink); }
.op-stop__ask.is-finding { color: var(--wire-orange); }
.op-steps { list-style: none; margin: 0; padding: 0; }
.op-steps li { display: grid; grid-template-columns: 1ch minmax(0, 1fr); gap: 1ch; padding: var(--space-1) 0; color: var(--ink-muted); }
.op-steps .is-now { color: var(--ink); }
.op-steps .is-failed { color: var(--signal-ink); }
.op-steps .is-finding { color: var(--wire-orange); }
.op-steps__note { display: block; color: var(--ink); }

/* NextStops: where to walk next */
.op-next { list-style: none; margin: 0; padding: 0; }
.op-next li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1ch; align-items: center; min-height: var(--row-min); border-bottom: var(--border-hair) solid var(--line); }
.op-next__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.op-next__via { color: var(--ink-muted); white-space: nowrap; }

/* DeviceTable: hairlines only, scrolls inside .op-scroll */
.op-scroll { overflow-x: auto; }
.op-table { border-collapse: collapse; margin-top: var(--space-4); }
.op-table th, .op-table td { text-align: left; white-space: nowrap; padding: var(--space-2) var(--space-6) var(--space-2) 0; border-bottom: var(--border-hair) solid var(--line); }
.op-table th { font-weight: 400; color: var(--ink-muted); }
.op-table .heard td { color: var(--wire-brown); }
.op-table .heard td.stop { color: var(--ink-muted); }

/* ConsolePane */
.op-console__bar { display: flex; justify-content: space-between; gap: 1ch; padding: var(--space-2) var(--space-4); background: var(--console-soft); color: var(--console); }
.op-console { background: var(--well); color: var(--well-ink); font: 400 1rem/1.5 var(--font-mono); padding: var(--space-4); margin: 0; white-space: pre; overflow-x: auto; min-height: 16em; }
.op-console .p { color: var(--well-muted); }

/* WireRule: four conductors, T568B order */
.op-wire { display: grid; gap: 2px; width: 100%; }
.op-wire > i { display: block; height: var(--border-wire); border-radius: var(--radius-pill); }
.op-wire > .wo { background: repeating-linear-gradient(90deg, var(--wire-orange) 0 12px, var(--wire-white) 12px 20px); }
.op-wire > .o { background: var(--wire-orange); }
.op-wire > .wg { background: repeating-linear-gradient(90deg, var(--wire-green) 0 12px, var(--wire-white) 12px 20px); }
.op-wire > .b { background: var(--wire-blue); }

@media (prefers-reduced-motion: reduce) {
  .op-pulse { animation: none; }
  .op-row__marker { transition: none; }
}

/* A device name never breaks at its hyphens */
.op-dev { white-space: nowrap; }
```
