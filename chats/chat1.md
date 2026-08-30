# Pulse fitness tracking app design

_Started 2026-08-30 10:14 UTC_

---

## User

# Pulse — Claude Design Prompt (5 core screens)

Paste the whole thing into Claude Design.

---

Design the five core screens for **Pulse**, a fitness activity tracking app with social features — the same territory as Strava, built fresh. Mobile-first, portrait, phone-sized frames. Dark mode is the default; show me dark for all five.

## BRAND

Pulse is energetic, clean and a bit severe. Precision instrument, not lifestyle app. No pastels, no illustrations, no rounded-cartoon friendliness.

Palette:
- Electric blue `#0066FF` — primary. Actions, active states, data lines, the logo mark
- Bright blue `#3D8BFF` — hover, highlights, secondary data series
- Black `#0A0A0A` — page background
- Grey 900 `#141414` — card and panel surfaces
- Grey 500 `#6B6B6B` — secondary text, axis labels, timestamps
- Grey 200 `#E4E4E4` — borders and dividers (used at low opacity on dark)
- White `#FFFFFF` — primary text

Rules:
- Blue is used sparingly and means *action* or *data*. If a screen reads as mostly blue, it's wrong.
- One geometric/grotesque sans throughout — Inter or similar. Stat numbers are large, tight-tracked, and are the biggest thing on any card.
- Corner radius 2–4px maximum. No drop shadows — separate surfaces with borders and background contrast.
- Dense data, calm layout. Generous vertical spacing between blocks, tight spacing within them.
- Design a small wordmark and a simple mark for the app. The mark should suggest a heartbeat or waveform without being literal about it.

## THE FIVE SCREENS

**1. Feed**
The home screen. Vertical list of activity cards from people you follow. Each card: athlete avatar and name, sport type and time posted, activity title, a route map thumbnail, and three key stats in a row (distance, time, pace or speed). Kudos and comment actions on each card. Bottom tab bar across the app: Feed, Explore, Record, Groups, You — with Record as the prominent centre action.

**2. Record (live)**
Full-screen map with the live route trace drawn in electric blue behind a stats panel. Big primary metric (elapsed time), with distance, current pace, and elevation gain secondary. Start / pause / finish controls. Sport type selector. This screen is read at a glance while moving — the hierarchy has to be brutal.

**3. Activity detail**
Header with title, athlete, date and sport. Route map. A stats grid: distance, moving time, elapsed time, average pace, elevation gain, calories. Below that an elevation profile chart, a splits table by kilometre, and a list of segments matched on this activity with times and PR comparison. Kudos and comments at the bottom.

**4. Training dashboard**
Weekly and monthly totals with change vs the previous period. A training log calendar — a grid of days, each shaded by effort. A fitness and form chart over 12 weeks with two lines. A personal records block. A goal progress bar. This is the most data-dense screen — show me how the layout holds up.

**5. Segment leaderboard**
Segment name, a map of the segment, and its stats (distance, average grade, elevation gain). A ranked leaderboard: position, athlete, time, date. The top position is crowned. Filter controls for all-time / this year / people you follow. The current user's own row pinned and highlighted, showing their rank and best time.

## WHAT I WANT BACK

Five screens as connected frames, consistent with each other. Build a small shared component set as you go — card, stat block, button, tab bar, chart styling — and reuse it rather than redrawing per screen. Use realistic content: real-sounding names, plausible distances and paces, actual-looking route shapes. No lorem ipsum, no `[Placeholder]`.

If a layout decision is genuinely a toss-up, pick the denser option and note it.

## Assistant

_[tool: list_files]_

_[tool: read_skill_prompt]_

Design system project is empty, so I'll follow the brief's palette directly.

_[tool: dc_write]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_set_props]_

_[tool: ready_for_verification]_

Five frames on one canvas, connected: feed cards and matched segments link forward, back-headers and tab bars link back, Record reachable from every tab bar. Shared vocabulary throughout — 1px hairline dividers as the only separator, 2px radii, 1px-gap stat grids, blue only on data traces, active states and PRs.

Toss-ups I took the dense option on, as asked: 14 splits rather than a truncated 5 + "show all"; 13 weeks in the effort calendar; the leaderboard's secondary filter chips (gender/age/weight) kept visible under the primary segmented control. Activity detail, dashboard and leaderboard frames are shown at full content height rather than 844 with hidden scroll, so you can read the whole layout — feed and record are true 390×844. Detail and leaderboard use back-headers instead of the tab bar (push navigation), which is why the bar appears only on Feed and You.

Interactive: kudos toggles on every card and on detail, sport selector on Record, leaderboard filters. Tweaks expose the accent colour and leaderboard row count.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Frame 03 raised to 2020px (caption updated) and the fixed-content blocks in both tall frames now carry `flex:none`, so all 14 splits show and nothing can silently compress.

## User

Found issues — fixing…

## User

Found issues — fixing…

## User

copy all of those cards and Korean option with a white background also make the corners a little bit around a tiny bit around

## Assistant

_[tool: read_file]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: ready_for_verification]_

Added **1b — Light**: all five screens duplicated on white surfaces (#FFFFFF frames, #F5F5F6 cards, #141414 text, borders as low-opacity black hairlines), sitting on a light grey panel so the frames read. Dark stays as **1a**. Both options share the same components, data and interactions, and the light copy links internally to its own frames.

Corners nudged up slightly everywhere — 2→4px on cards/chips/buttons, 4→6px on the phone frames.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Fixed — each option now sets its own inherited ink (`#141414` on 1b, `#FFFFFF` on 1a) instead of relying on the body default, so all inherited text in the light screens is dark.

## User

make the cartwhite and the background the darker Gray or the off-white color I think that'll look better

## Assistant

_[tool: run_script]_

_[tool: ready_for_verification]_

Light option flipped: cards and panels are now pure white, with the phone page, tab bars and pinned footer on off-white grey (#EFEFF0) so surfaces separate by tone as well as hairline.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

1a badge restored to "DARK — DEFAULT"; the page-header chip still reads "DARK + LIGHT".

