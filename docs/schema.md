# openprobe schema

The PocketBase collections behind `web/`, and how a scan gets from the phone into them. Written for PocketBase 0.23 or later (field types and rule syntax as in its dashboard).

The phone is the only writer of scan data. In a basement it has no signal, so it builds the whole scan locally and uploads it when it can: during the walk after each stop if it has signal, and at `finish scan`. The probe only reports its own heartbeat.

## Collections

Every collection also has PocketBase's own `id`, `created` and `updated`. `created` is when the server received a record, which for an offline scan can be hours after it happened: the walk's own times are separate fields (`started`, `finished`).

→ marks a relation (single, unless noted).

### users (built-in auth collection)

The technicians. PocketBase's default fields: `email`, `password`, `name` (shown as "by j.doe").

### probes (auth collection)

Each probe logs in as itself, so it can update its own heartbeat and nothing else.

| field | type | notes |
| --- | --- | --- |
| `name` | text, required | `probe-01` |
| `last_seen` | date | the probe sets it every time it checks in; silent for 2 minutes = offline |

A probe's current scan isn't stored here: it's the `scans` record with this probe and `status = "running"`. That keeps the probe from needing write access to scans.

### buildings

| field | type | notes |
| --- | --- | --- |
| `name` | text, required | unique, ignoring case (index below) |
| `location` | text | shown as "where": "basement B-012, key at reception" |

Any technician can add a building, from the walk's setup. A new building is uploaded together with its first scan.

### scans

One walk through one building.

| field | type | notes |
| --- | --- | --- |
| `building` | → buildings, required | |
| `probe` | → probes, required | |
| `technician` | → users, required | |
| `started` | date, required | when `start scan` was pressed, from the phone's clock |
| `finished` | date | empty while running |
| `status` | select: `running`, `finished`, `abandoned` | |
| `password_mode` | select: `none`, `one`, `ask` | the console password itself is never stored, anywhere |
| `device_count` | number | worked out by the phone at `finish scan`, so the buildings page needs one query per building |
| `devices_down` | number | as above |
| `devices_stale` | number | as above |

### stops

One switch the technician plugged into, numbered in walk order.

| field | type | notes |
| --- | --- | --- |
| `scan` | → scans, required | |
| `number` | number, required | 1, 2, 3… "stop 2" |
| `result` | select: `done`, `skipped`, `failed` | empty while the stop is in progress |
| `raw` | file (text/plain) | the console output as captured. A file because `show cdp neighbors detail` can outgrow a text field |

Which switch a stop was is in `devices.stop`, not here (see "Why the relations point this way").

### devices

Every device the scan knows about: the switches it stopped at, and the neighbors they reported.

| field | type | notes |
| --- | --- | --- |
| `scan` | → scans, required | |
| `device_id` | text, required | as CDP reports it: `SW-ACCESS-01.lab.local` |
| `platform` | text | `cisco WS-C2960X-24TS-L`, verbatim |
| `version` | text | `15.2(7)E8` |
| `mgmt_ip` | text | |
| `capabilities` | text | `S I` |
| `stop` | → stops | the stop that confirmed it. Empty = only heard from a neighbor: shown in `wire-brown`, "not yet" |

A heard device is uploaded as soon as it's heard. When a later stop confirms it, the same record gets updated: `stop` set, values replaced with what the switch said about itself.

### links

One cable, as seen from the switch the probe was plugged into.

| field | type | notes |
| --- | --- | --- |
| `scan` | → scans, required | |
| `device` | → devices, required | the switch that reported it |
| `local_port` | text, required | its port: `GigabitEthernet1/0/1` |
| `neighbor` | → devices, required | the device on the other end |
| `remote_port` | text | the neighbor's port, as CDP reports it |
| `native_vlan` | number | per link, not per device: CDP reports it for the port |

DeviceTable's `port` and `vlan` columns come from the link a device was heard on. NextStops is the links from this stop whose `neighbor` has no `stop` yet.

### findings

Something the probe noticed that isn't a failure.

| field | type | notes |
| --- | --- | --- |
| `scan` | → scans, required | |
| `stop` | → stops, required | |
| `kind` | select: `session_open`, `cdp_off` | add kinds here as the probe learns to notice them |
| `note` | text | |

## Why the relations point this way

- **Everything points at its scan.** A scan is a snapshot, so the same switch scanned next month is a new `devices` record. History is a comparison between scans.
- **A device points at its stop, not the other way round.** If both pointed at each other, neither could be created first. A stop's switch is found as the device whose `stop` is that stop (PocketBase expands this as `devices_via_stop`).

## Indexes

```sql
CREATE UNIQUE INDEX idx_buildings_name ON buildings (name COLLATE NOCASE);
CREATE INDEX idx_scans_building ON scans (building, started);
CREATE UNIQUE INDEX idx_stops_number ON stops (scan, number);
CREATE UNIQUE INDEX idx_devices_id ON devices (scan, device_id);
CREATE UNIQUE INDEX idx_links_port ON links (scan, device, local_port);
```

The unique ones are what keep a retried upload from creating doubles, beyond the `id` (see "Uploading").

## API rules

Empty (no rule) means superusers only: the PocketBase admin panel.

| collection | list / view | create | update | delete |
| --- | --- | --- | --- | --- |
| `buildings` | `@request.auth.collectionName = "users"` | `@request.auth.collectionName = "users"` | `@request.auth.collectionName = "users"` | |
| `probes` | `@request.auth.collectionName = "users" \|\| id = @request.auth.id` | | `id = @request.auth.id` | |
| `scans` | `@request.auth.collectionName = "users"` | `@request.body.technician = @request.auth.id` | `technician = @request.auth.id` | |
| `stops`, `devices`, `links`, `findings` | `@request.auth.collectionName = "users"` | `scan.technician = @request.auth.id` | `scan.technician = @request.auth.id` | |

Only the technician who walked a scan can write to it. Test each rule in the dashboard's API preview before relying on it.

## On the phone

During the walk the phone keeps the scan as one object and saves it to IndexedDB after every change. Every record gets its `id` on the phone, so it can be referred to before the server has seen it:

```js
const scan = {
  id: 'k3x9w2m8q1v7t4p',
  building: { id: 'b1' },   // a new one also has name, location and isNew: true
  probe: 'p1',
  technician: 'u1',
  started: '2026-11-09T14:02:00Z',
  finished: null,
  status: 'running',
  password_mode: 'one',
  stops: [ { id, number, result, raw } ],
  devices: [ { id, device_id, platform, version, mgmt_ip, capabilities, stop } ],
  links: [ { id, device, local_port, neighbor, remote_port, native_vlan } ],
  findings: [ { id, stop, kind, note } ],
  sent: {},                 // id -> the data last uploaded for it
};
```

The buildings page's "1 unsent scan" is the number of scans in IndexedDB with anything not in `sent` yet. A scan is removed from IndexedDB once it's finished and fully sent.

### Ids

15 random characters from `a-z0-9`, the same shape PocketBase makes its own:

```js
function newId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return Array.from(bytes, b => chars[b % 36]).join('');
}
```

There are 36¹⁵ ≈ 2 × 10²³ of them: at a million records, the odds of any two matching are about 1 in 400 billion. Don't check for a free id first. The phone is offline when it makes them, and `id` is the primary key, so the database refuses a duplicate anyway rather than overwriting anything.

### Uploading

Upload in this order, because each one refers to the ones before it: the building if new, the scan, stops, devices, links, findings. For each record:

- not in `sent`: **create** it with its own `id`.
- in `sent`, but changed since (a heard device just got confirmed, a stop got its result): **update** it.
- unchanged: skip.

After each success, store what was sent in `sent` and save to IndexedDB, so a dropped connection loses nothing and the next try carries on where this one stopped.

Two errors mean "already there", not "failed":

- **Our own `id` exists** (a 400 whose `data.id` is set): an earlier try got through, its reply didn't. Count it as sent.
- **A new building's name exists** (`data.name` set): another technician added the same building first. Look it up by name, point this scan at it, and drop the duplicate.

Any other error stops the upload, and it's tried again later.

## Open questions

- **What `devices_down` and `devices_stale` mean in a walk.** A guess: down = in the building's previous scan, but neither visited nor heard this time; stale = confirmed at a stop more than its CDP holdtime before `finish scan`. Settle this before the phone computes them.
- **When a running scan becomes `abandoned`.** There's no "abandon" in the walk yet. Possibly: still running after a day with nothing new.
