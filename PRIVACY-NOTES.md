# Privacy notes (for the lead)

Notes behind `site/privacy/index.html` (studio) and
`site/privacy/pizza-ambulance/index.html` (the game). Written 2026-10-17.

**This is not legal advice.** It is a plain-language policy matched to the
code. Before the public release (production track), consider a lawyer's
review, especially for GDPR/UK GDPR (controller identity and address,
international transfers) and US state laws.

## 1. Facts relied on

All paths are in `D:\github\pizza-ambulance` unless stated. Read only.

### Telemetry (`core/telemetry/run_telemetry.gd`, format version 7)

One JSON line per record, appended to `user://telemetry/runs.jsonl` (the
app's private `files/` folder). Kinds: run (no `kind`), `roam`, `home`,
`trip`, `debug`.

**Common to every line** (`_add_device`, lines ~1593-1603, and each
builder):

| Field | What |
|---|---|
| `v` | layout version (7) |
| `kind` | `roam` / `home` / `trip` / `debug`; absent on a run |
| `utc` | wall-clock time of writing, UTC |
| `session` | `"%x-%04x"` of unix time + low 16 bits of a microsecond tick counter (`_make_session_id`, line ~1667); new after 300 s with no frame. Time-derived, not random. |
| `app_version` | `application/config/version`; **not set in `project.godot` today, so not written** |
| `device` | `OS.get_model_name()` (e.g. "Pixel 9a") |
| `os` | `OS.get_name()` ("Android") |
| `screen` | `[width, height]` of the game window |
| `debug` | `true` on every line of a session where the debug menu was used |
| `money_start`, `balance` | in-game money at open/close (pretend currency) |

**Run lines** (`_build`, ~1484-1561, plus `finish`): `run` (index in
session), `context`, `outcome`, `stars`, `time`, `drops` (each `order_id`,
`outcome`, `slices_remaining`, `age`, `temperature`, `stars`, `load`),
`drops_delivered`, `slices_remaining`, `boxes`, `stack_size`, `drive_time`,
`start_delay`, `distance`, `avg_speed`, `top_speed`, `vehicle_top_speed`,
`fast_share`, `brisk_share`, `full_stops`, `air_time`, `jumps`,
`collisions`, `max_impact`, `crashes` (`t`, `impact`, `load`), `shakes`,
`bumps`, `max_bump`, `slices_lost`, `lost_to_slide`, `lost_to_collision`,
`lost_to_bump`, `losses` (`t`, `cause`, `box`, `load`, `remaining`,
`speed`, `x`, `z`, `surface`, `cut`), `max_offset`, `corners_slowed`,
`corners_unslowed`, `corner_entry_share`, `recoveries`, `recovered_from`
(`t`, `surface`, `boxes`, `cut`, `x`, `z`, `near`, `near_m`), `legs`
(`from`, `to`, `boxes`, `time`, `distance`, `off_road`, `slices_lost`,
`cuts`, `road_m`, `saved_m`, `road_s`, `saved_s`), `road_pace`,
`surfaces`, `off_road`, `cuts` (`cut`, `walls`, `boxes`, `t`, `duration`,
`distance`, `off_road`, `slices_lost`, `collisions`, `ended`, `leg_from`,
`leg_to`, `saved_m`, `saved_s`), `phone` (`opens`, `seconds`, `pages`,
`page_seconds`), `tricks` (`t`, `trick`), `spent` (`t`, `amount`, `reason`,
`balance`), `paid`, `multiplier`, `job` (`id`, `attempt`, `scored`,
`medals`, `best_medals`, `had_medals`, `new_best`, `opened`, `stars`,
`seconds`, `whole`), and frame time: `frames`, `frame_ms_avg`,
`frame_ms_worst`, `frame_ms_median`, `frames_over_33`, `frame_ms_hist`,
`gaps`, `gap_seconds`.

**`context`** (`delivery/run_extras.gd`, `get_context`, ~170-201):
`control_scheme_id`, `tuning_preset_id` (difficulty), `order_id`,
`district_id`, `began`, `rack`, `job_id`, `job_attempt`, `round_id`,
`drop_order`, `board_id`, `offered`, `taken`; ride-home contexts add
`after`, `from`, `boxes`.

**Roam lines**: `context`, `reason`, `duration`, `distance`, `recoveries`,
the ground/phone/tricks/spent parts above, frame time.
**Home lines**: `context`, `reason`, `reached`, `time`, `distance`,
`off_road`, `cuts`, `stops`, `settled_elsewhere`, `stopped_elsewhere`,
`recoveries`, `phone_opens`, `tap_from`.
**Trip lines**: `from`, `to`, `purchase`, `price`, `via`, `balance`.
**Debug lines**: `action` plus whatever the action passes (`amount`,
`preset`, `boxes`...), `balance`.

`x`/`z` are positions in the game world (metres in the made-up town), not
GPS. No free text typed by the player is recorded.

**Not in any line today:** an install id (none exists in code), locale,
language, timezone, IP, Android/hardware ids, advertising id, account.

**When it writes:** `enabled = default_enabled and DisplayServer.get_name()
!= "headless"` (line ~488), with `default_enabled := true`. So **release
builds write telemetry to the phone too**, not only debug builds. It only
stays on the phone: there is no networking code anywhere.

### On-device storage

- `core/save.gd` -> `user://save.json` (shape in
  `core/save/save_migrations.gd` `defaults()`): `version`, `money`,
  `owned`, `equipped`, `jobs` (best results/attempts per district),
  `districts_open`, `district`. Old saves are renamed aside, never deleted
  (`save.replaced-*.json`, `save.unreadable-*.json`).
- `core/settings.gd` -> `user://settings.cfg`: `control_scheme_id`,
  `tuning_preset_id`, `mirrored`, `sensitivity`, `haptics`,
  `music_volume`, `effects_volume`, `debug_unlocked`,
  `debug_frame_readout`. **No telemetry setting.**
- Dev switch file `user://start_from.txt` (debug builds).

### Everything else checked

- `export_presets.cfg`: only `permissions/vibrate=true`;
  `gradle_build/use_gradle_build=false`; package still
  `com.example.pizzaambulance`, `version/name="0.1"`, `version/code=1`.
  No INTERNET permission is declared. (Godot may add INTERNET to *debug*
  exports for remote debugging; a release build that sends telemetry will
  need `permissions/internet=true`.)
- Vibration: `core/haptics.gd` uses `Input.vibrate_handheld` and, via
  `JavaClassWrapper`, Android's `Vibrator`/`VibrationEffect`. That is the
  only `JavaClassWrapper` use. Player can turn it off (`Settings.haptics`).
- No `HTTPRequest`, `HTTPClient`, sockets, WebSocket, `OS.get_unique_id`,
  billing, ads, Firebase, Crashlytics, Sentry, Play Games, analytics SDKs,
  location, camera, microphone or contacts code in tracked `.gd`, `.cfg`,
  `.godot`, `.gdap` files. No Android plugins tracked under `addons/`
  (`addons/godot_mcp` is an editor-only, git-ignored addon).
- Purchases: only pretend in-game money (`progression/`). No real-money IAP.
- `ui/debug/debug_menu.gd`: the debug menu works only when
  `OS.is_debug_build()`; release builds cannot produce `debug` lines.
- `ui/phone/phone_help_page.gd` shows a build line
  (`DebugMenu.build_line()`) at the foot of the phone's help page: a natural
  place to show the install id.
- `tools/feedback/`: a playtest feedback Google Form, outside the app. If
  testers are sent it, Google Forms' own policy applies and the form
  collects what it asks; it is not covered by the game policy.
- `docs/roadmap.md`, "Testing on testers' phones": audience 13+ (no under-13
  groups); release builds to send lines over HTTPS to Netlify Functions on
  `bryostudio.com`, stored in MongoDB Atlas; random install id; batches when
  online; Atlas credentials only in Netlify env.
- Website (`D:\github\bryostudio`): static, `script-src 'none'` CSP in
  `netlify.toml`, no cookies, no analytics. Netlify keeps request logs.

## 2. Statements that depend on things not built yet

Keep the policy and the game in step. Each line: what the policy says ->
what the game does today -> what to do.

**Update 2026-10-17:** A, D, E and I are done: the game sends from version
0.3.0 (Pizza Ambulance task T-1) through `netlify/functions/telemetry.ts`,
shows the install id at the foot of its Settings page, and has a Share play
data switch; with it off, release builds record nothing and send nothing
(task T-2; debug builds keep a local file for USB pulls). The policy page was
updated the same day. N (the package name) is still to do.

| # | Policy says | Today | To do |
|---|---|---|---|
| A | Records are sent in batches over HTTPS to our server, stored in MongoDB Atlas | Nothing is sent; no network code; no INTERNET permission | Build the sender and the Netlify Function. The policy already says early test builds send nothing. |
| B | A random install id, made on first run, reinstall makes a new one | No install id exists; only a time-based `session` | Generate a random id (e.g. 128-bit from `Crypto.generate_random_bytes`), store it in `user://` (not in `save.json`, so new saves don't change it unless wanted), add to every line. Do **not** use `OS.get_unique_id()` (that is ANDROID_ID, a device id). |
| C | Game version is recorded | `application/config/version` unset, so `app_version` is never written | Set it (or write `version/name`) |
| D | The game will show the install id in its settings | Not shown anywhere | Show it (settings or the help page build line), selectable/copyable |
| E | A setting to turn off sending is planned; until then uninstalling stops it | No toggle | **Recommended: build an in-game toggle before public release.** Then update the policy ("turn off Share play data in Settings") and the Data safety answer to "optional". |
| F | Kept up to 24 months, then deleted or aggregated | No server, no retention job | **Proposal, confirm it.** Implement as an Atlas TTL index on the arrival date, or a scheduled delete. |
| G | IP address used to deliver the batch, not stored with records | No server | Make sure the Function does not write IP (or headers) into Atlas, and check Netlify's function log retention. |
| H | Deletion/copy on email request within 30 days | No tooling | A script/query to delete or export by install id. |
| I | Sending happens "once sending is switched on" (summary table) | Today telemetry is written on-device in release builds too, never sent | When sending ships, the "early test builds" sentence can be removed. Consider whether release builds should keep an ever-growing local file (it has no size cap; cleared on uninstall). |
| J | Contact email | Done 2026-10-17: hello@ and privacy@bryostudio.com (Google Workspace) | |
| K | Service providers: Netlify and MongoDB Atlas; "servers may be in another country" | Atlas region not chosen | Pick the Atlas region; if you serve EU/UK players, the providers' DPAs/SCCs cover transfers. Lawyer question. |
| L | Who "we" are | Only "Bryo Studio, a one-person studio" | GDPR expects the controller's legal name and contact address; Play shows the developer's address from the Play account. Consider adding a legal name / postal address. |
| M | Testers' builds may record more detail | Same telemetry today | Keep it truthful if tester builds diverge (still no personal data). |
| N | Package `com.bryostudio.pizzaambulance` | Still `com.example.pizzaambulance` | Already planned in the roadmap. |

## 3. Draft answers for Play Console's Data safety form

Fill it to match **the build on the track**. While no build sends anything,
the honest answer is "No data collected" (data that never leaves the phone
is not "collected" in Play's sense). Switch to the answers below in the
same release that adds sending (Play requires the form to be updated
before or with that release).

**Data collection and security**
- Does your app collect or share any of the required user data types? **Yes**
- Is all of the user data collected by your app encrypted in transit? **Yes** (HTTPS)
- Do you provide a way for users to request that their data is deleted? **Yes** (by email; no account, so no account-deletion URL is required)
- Account creation: **My app does not allow users to create an account**
- Independent security review: **No**

**Data types collected** (none are *shared*: Netlify and MongoDB Atlas are
service providers acting for us, which Play does not count as sharing)

| Play data type | Collected | Shared | Ephemeral | Required / optional | Purposes |
|---|---|---|---|---|---|
| App activity > **App interactions** (deliveries, routes in the game world, phone pages, tricks, in-game money) | Yes | No | No | Required today; **Optional** once the toggle (E) exists | **Analytics** |
| App info and performance > **Diagnostics** (frame times, gaps) | Yes | No | No | same | **Analytics** (add App functionality only if used to fix bugs is framed that way; Analytics alone is fine) |
| App info and performance > **Other app performance data** (device model, OS, screen size, version) | Yes | No | No | same | **Analytics** |
| Device or other IDs (**random install id**) | Yes | No | No | same | **Analytics** |

Everything else: **not collected** (location, personal info, financial
info, health, messages, photos/videos, audio, files, calendar, contacts,
web browsing, in-app search history, other user-generated content, crash
logs: not collected unless a crash reporter is added later).

Notes on judgment calls:
- *Device or other IDs*: Play's examples include app-scoped ids such as a
  Firebase installation id, so a random install id should be declared.
  It is not "linked to identity" in the colloquial sense, but Play has no
  such opt-out; declare it.
- *IP address*: received by the server only to deliver the batch and not
  stored with records (commitment G). Play does not list IP as its own
  type; if any IP is logged with the data, revisit.
- *Required vs optional*: "Required" while there is no toggle. With the
  toggle, mark all four as optional.
- *Game world positions* (`x`, `z`) are not Location: they are coordinates
  in the made-up town.

**Other App content forms (from the roadmap)**
- Target audience: **13-15, 16-17, 18 and over**; no under-13 groups.
  "Appeals to children": answer honestly; a cartoon bicycle game may be
  flagged, in which case Play asks for more. Keep under-13 unticked.
- Ads: **No, my app does not contain ads.**
- Privacy policy URL: `https://bryostudio.com/privacy/pizza-ambulance/`
