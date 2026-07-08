# AutoDEX — Developer Handover

**Target codebase:** Kibana Security app  
**Target EUI version:** v114  
**Prototype source:** `src/public/pages/detection-rules/v1.0/`  
**Date:** July 2026

---

## 1. Summary

AutoDEX is an AI-powered detection-engineering agent embedded in Kibana Security. It continuously monitors the installed detection-rule estate, diagnoses silent execution failures caused by data-stream renames or query errors, reduces alert fatigue by identifying and scoping high-volume false-positive patterns, and keeps Elastic prebuilt rules current with Security Labs releases — all without requiring the analyst to leave the Security app. The feature is surfaced through three screens: a first-run onboarding flow that captures scope and schedule preferences before the agent is activated; a live dashboard showing pending approval actions, an AI-generated summary, and a completed activity log; and a configuration modal that lets users adjust those preferences after activation. The motivation is to remove the routine, repetitive maintenance burden from detection engineers so they can focus on investigation and coverage strategy rather than rule plumbing.

---

## 2. Scope

### In scope (this handoff)

| Area | Detail |
|---|---|
| First-run onboarding | `/autodex/get-started` — scope selection, per-action automation level, schedule, Enable button |
| AutoDEX dashboard | `/autodex` — empty state (not yet enabled), hero + status badge, stats strip, AI summary card, Actions panel (approvals), Activity log accordion |
| Configure modal | Full-page modal: Automation scope, Model settings, Schedule tabs |
| Actions panel | Pending-approval items with inline reasoning, diff view, Approve/Discard/Edit actions, pagination |
| Activity log | Searchable, filterable, grouped-by-type completed log with full-reasoning expansion |
| Add Elastic Rules | `/detection-rules/add` — semantic search, grouped rule library, threat feed, filter popover |

### Explicitly out of scope (not in prototype)

- Real API integration (all data is mock; `MOCK_AUTODEX_LOGS` in `autoDexMockData.ts`)
- Persistence layer (onboarding state uses `localStorage`; replace with a Kibana saved-object or feature-flag API)
- Actual AI/LLM calls (reasoning text is hardcoded strings)
- Role-based access control / privilege gating
- Notification / alerting (no email or push notification surfaces)
- Mobile / responsive breakpoints (the prototype uses a `zoom` hack at `< 1400 px`)
- The "Edit" button on approval items (rendered but has no handler)
- "View all cases" link (rendered as `0` count, no navigation target)

---

## 3. State Inventory

### 3a. `/autodex` — AutoDEX Dashboard Page

| State | What the user sees | Trigger |
|---|---|---|
| **Not-yet-enabled (empty)** | Illustration, headline "AutoDEX hasn't been set up yet", feature pills, "Get started with AutoDEX" CTA button, sub-label "Takes about 2 minutes to configure" | `localStorage.getItem('autodex-enabled') !== 'true'` on mount |
| **Dashboard (enabled)** | Hero (illustration + Running Live badge + title), stats strip, AI summary card, Actions section, Activity log accordion | `localStorage.getItem('autodex-enabled') === 'true'` |
| **AI summary — expanded** | Bullet list of 3 summary items with hollow Action/Insight badges, generated-on timestamp, refresh icon, ⋮ menu | Default on mount |
| **AI summary — collapsed** | Header row only | User clicks the collapse arrow |
| **Actions — has pending items** | List of approval cards, paginated at 5/page | `pendingItems.length > 0` |
| **Actions — all resolved** | `EuiEmptyPrompt` with checkmark icon: "No approvals required" / "AutoDEX has no pending actions awaiting your review." | `pendingItems.length === 0` after all decisions made |
| **Approval card — collapsed** | Rule name, timestamp, action-type badge, Approval needed / Action required badge, ⋮ menu | Default |
| **Approval card — expanded** | Diagnosis section, Decision rationale section (or manual fix steps for suggestions), diff view (monospace + / − lines), Discard / Edit / Approve buttons | User clicks the card row |
| **Approval card — approved** | Card removed from list; `pendingCount` stat decrements | User clicks Approve |
| **Approval card — dismissed** | Card removed from list | User clicks Discard |
| **Activity log — collapsed** | Section header only with right-arrow icon | Default on page load (`activityExpanded = false`) |
| **Activity log — expanded** | `AutoDexActivityLog` component with search, type filter, grouped rows | User clicks the header row |
| **Configure modal — open** | Full-screen modal, three-tab left nav (Automation scope / Model settings / Schedule) | User clicks Configuration button |
| **Configure modal — closed** | Modal unmounts | User clicks Cancel or Save configuration |

### 3b. `/autodex/get-started` — Onboarding Flow

| State | What the user sees | Trigger |
|---|---|---|
| **Default** | Hero, Step 1 (4 scope cards all on, sliders at default levels), Step 2 (schedule defaults), Enable AutoDEX button | Page load |
| **Scope item — enabled** | Toggle blue, automation level slider visible below the card | Default OR user toggles on |
| **Scope item — disabled** | Toggle grey, automation level slider hidden | User toggles off |
| **Slider — Suggest (1)** | Thumb at leftmost tick | User drags or clicks tick |
| **Slider — Semi auto (2)** | Thumb at centre tick | Default for failures/tuning/update |
| **Slider — Full auto (3)** | Thumb at rightmost tick | Default for install; user can set others here |
| **Enable clicked** | `localStorage.setItem('autodex-enabled','true')`, navigate to `/autodex` | User clicks Enable AutoDEX |

### 3c. Activity Log (`AutoDexActivityLog`)

| State | What the user sees | Trigger |
|---|---|---|
| **Default** | Grouped log cards by action type, collapsed by default | Component mount |
| **Log card — collapsed** | Rule name, timestamp, action badge, Approved badge, ⋮ menu | Default |
| **Log card — expanded** | Diagnosis, Decision rationale, Changes made diff view | User clicks card |
| **Search active** | Filtered list matching query string | User types in search field |
| **Type filter active** | Filtered list by selected action types | User selects options in `EuiSelectable` popover |
| **No results** | [NEEDS DESIGNER INPUT — empty state not defined in prototype] | Search/filter yields zero matches |
| **Pending approval (in activity mode)** | Yellow left-border on `LogGroupCard`, `TopGroupAccordion` with "Take action" button | `pendingCount > 0` on a group |
| **All approved** | Standard border, no yellow accent | `pendingCount === 0` |

### 3d. Domain states on `AutoDexMockLog`

| Domain state | Field value | Visual treatment |
|---|---|---|
| Needs approval | `needsApproval: true`, `isSuggestion: false` | Red "Approval needed" badge |
| Needs input (suggestion) | `isSuggestion: true` | Amber "Action required" badge |
| Approved | `approvalDecisions[id] === 'approved'` | Removed from pending list |
| Dismissed | `approvalDecisions[id] === 'dismissed'` | Removed from pending list |
| Completed (activity log) | `status: 'success'` + decision recorded | Green "Approved" badge in activity log |
| Superseded / other | Not modelled in prototype | [NEEDS DESIGNER INPUT] |

---

## 4. Interaction Contract

### Hover / Focus / Disabled

| Element | Hover | Focus | Disabled |
|---|---|---|---|
| Toggle switch | `cursor: pointer` | [NEEDS DESIGNER INPUT — no focus ring in prototype] | `background: #CAD3E2`, thumb left |
| Approval card row | Implicit (pointer cursor) | [NEEDS DESIGNER INPUT] | n/a |
| Approve button | [NEEDS DESIGNER INPUT] | [NEEDS DESIGNER INPUT] | n/a |
| Discard button | [NEEDS DESIGNER INPUT] | [NEEDS DESIGNER INPUT] | n/a |
| Edit button | Rendered; **no handler** — out of scope | n/a | n/a |
| Enable AutoDEX | Gradient background; no explicit hover state in prototype | [NEEDS DESIGNER INPUT] | n/a |
| EuiRange slider | EUI default | EUI default (blue thumb `#1750BA`) | Track greyed when scope item toggled off |

### Click

| Element | Action |
|---|---|
| Approval card | Toggle expanded state (inline, not navigation) |
| Approve | Calls `onDecide(id, 'approved')`, card leaves pending list |
| Discard | Calls `onDecide(id, 'dismissed')`, card leaves pending list |
| ⋮ on approval card | Opens `EuiPopover` with "Add to chat" and "Create a case" |
| Add to chat (popover) | Calls `onOpenAIAssistant(prompt)` — stub in prototype, wire to AI panel |
| Activity log card | Toggle expanded, reveals full reasoning + diff |
| AI summary collapse arrow | Toggles `summaryOpen` state |
| AI summary refresh icon | No handler in prototype — [NEEDS FINAL IMPLEMENTATION] |
| Configuration button | Opens `AutoDexConfigureModal` |
| Get started CTA (empty state) | `navigate('/autodex/get-started')` |
| Enable AutoDEX | Sets localStorage flag, `navigate('/autodex')` |
| Scope item toggle | Toggles on/off, shows/hides automation level slider |
| "Take action" in activity log | [NEEDS DESIGNER INPUT — button renders but has no handler] |

### Keyboard navigation

Not explicitly specified in prototype. [NEEDS DESIGNER INPUT] for full keyboard nav spec. EUI components (EuiRange, EuiSelect, EuiPopover, EuiTablePagination) supply their own keyboard behaviour.

### Timing

| Behaviour | Value | Location |
|---|---|---|
| Toggle animation | `transition: 'background 0.2s'`, thumb `transition: 'left 0.2s'` | Custom `Toggle` component |
| Approval card border/shadow transition | None specified | — |
| Page reset when `pendingItems` changes | `useEffect` resets `pageIndex` to `0` | `AutoDexApprovalsPanel` |
| Activity log debounce / polling | Not implemented — [NEEDS FINAL IMPLEMENTATION] | — |
| AI summary refresh interval | Not implemented — [NEEDS FINAL IMPLEMENTATION] | — |

---

## 5. Component Mapping

### Getting Started page (`/autodex/get-started`)

| UI element | EUI component |
|---|---|
| Page outer shell | `EuiPanel` (hasShadow, paddingSize="none") |
| Section step numbers | Custom `<span>` (28px circle, `#1750BA`) — consider `EuiStep` or `EuiSteps` |
| Section headings | `EuiTitle size="m"` |
| Scope item card | Custom `<div>` — consider `EuiPanel hasBorder` |
| Toggle switch | **Custom component** — replace with `EuiSwitch` |
| Automation level slider | `EuiRange` (showTicks, tickInterval=1) |
| Run frequency | `EuiSelect compressed` |
| Active time window | `EuiSelect compressed` |
| Run on save / Pause on weekends toggle | **Custom component** — replace with `EuiSwitch` |
| Enable AutoDEX button | `EuiButton fill` (custom gradient overrides EUI styles — [NEEDS DESIGNER INPUT] on whether to use standard EUI button colour) |

### AutoDEX Dashboard (`/autodex`)

| UI element | EUI component |
|---|---|
| Running live badge | Custom `<div>` — consider `EuiBadge` or `EuiHealth` |
| Stats strip | Custom `<div>` — consider `EuiStat` × 4 inside `EuiFlexGroup` |
| AI summary card | Custom `<div>` with `EuiButtonIcon` (arrowDown/arrowRight, refresh, boxesVertical) |
| AI summary badges (Action, Insight) | `EuiBadge color="hollow"` |
| Actions heading + search | `EuiTitle size="s"`, `EuiFieldSearch fullWidth` |
| Type filter | `EuiFilterGroup` + `EuiFilterButton` |
| Approval card | Custom `<div>` — consider `EuiPanel hasBorder` |
| Action-type badge | Custom `<span>` — consider `EuiBadge` |
| "Approval needed" / "Action required" badge | Custom `<span>` — consider `EuiBadge` |
| Approve button | Custom `<button>` (green) — replace with `EuiButton fill color="success" size="s"` |
| Discard button | Custom `<button>` — replace with `EuiButtonEmpty size="s"` |
| Edit button | Custom `<button>` — replace with `EuiButtonEmpty size="s"` |
| Diff view (monospace +/−) | Custom `<div>` — [NEEDS DESIGNER INPUT] on whether to use `EuiCodeBlock` |
| Pagination | `EuiTablePagination` |
| Activity log accordion header | Custom `<div>` + `EuiButtonIcon` |
| Activity log empty state | Not defined — [NEEDS DESIGNER INPUT] |
| Configuration popover (⋮) | `EuiPopover` + `EuiListGroup` + `EuiListGroupItem` |

### Configure Modal

| UI element | EUI component |
|---|---|
| Modal shell | `EuiModal` (width 1080, position relative) |
| Left nav | Custom `<div>` list — consider `EuiListGroup` |
| Toggle switches | **Custom component** — replace with `EuiSwitch` |
| Automation level slider | `EuiRange` (showTicks) |
| Confidence threshold slider | `EuiRange` (showTicks) |
| Token budget slider | `EuiRange` (showTicks) |
| Run frequency | `EuiSelect compressed` |
| Active time window | `EuiSelect compressed` |
| Footer buttons | `EuiButtonEmpty` + `EuiButton fill color="primary"` |

---

## 6. Microcopy

### Empty state (`/autodex` — not yet enabled)

| String ID | Text | Notes |
|---|---|---|
| `autodex.empty.title` | "AutoDEX hasn't been set up yet" | |
| `autodex.empty.description` | "AutoDEX is your AI powered detection engineer. It monitors your ruleset, fixes silent failures, reduces false positive noise, and keeps your rules up to date automatically." | |
| `autodex.empty.pill.1` | "Fixes execution failures" | |
| `autodex.empty.pill.2` | "Tunes high false positive rules" | |
| `autodex.empty.pill.3` | "Installs new Elastic rules" | |
| `autodex.empty.pill.4` | "Keeps rules up to date" | |
| `autodex.empty.cta` | "Get started with AutoDEX" | |
| `autodex.empty.cta.sub` | "Takes about 2 minutes to configure" | |

### Dashboard — header & stats

| String ID | Text | Notes |
|---|---|---|
| `autodex.badge.runningLive` | "Running live" | Displayed uppercase |
| `autodex.hero.subtitle` | "Agentic detection rules" | |
| `autodex.stats.actionsRequired.label` | "Actions required" | |
| `autodex.stats.actionsRequired.sub` | "pending review" | |
| `autodex.stats.minutesSaved.label` | "Minutes saved" | |
| `autodex.stats.minutesSaved.value` | "47 min" | **[NEEDS FINAL COPY — hardcoded mock]** |
| `autodex.stats.minutesSaved.sub` | "2% from last week" | **[NEEDS FINAL COPY — hardcoded mock]** |
| `autodex.stats.approvalRate.label` | "Approval rate" | |
| `autodex.stats.approvalRate.value` | "91%" | **[NEEDS FINAL COPY — hardcoded mock]** |
| `autodex.stats.approvalRate.sub` | "compared to previous" | |
| `autodex.stats.tokens.label` | "Total tokens used" | |
| `autodex.stats.tokens.value` | "1.24M" | **[NEEDS FINAL COPY — hardcoded mock]** |
| `autodex.stats.tokens.sub` | "this month" | |

### Dashboard — AI summary card

| String ID | Text | Notes |
|---|---|---|
| `autodex.summary.title` | "AI summary" | |
| `autodex.summary.generatedOn` | "Generated on Jun 29, 2026 at 20:58" | **[NEEDS FINAL COPY — dynamic timestamp]** |
| `autodex.summary.item1.badge` | "Action" | |
| `autodex.summary.item1.text` | "Windows Registry Modification is failing — index pattern mismatch from Agent 8.14. Fix queued." | **[NEEDS FINAL COPY — dynamic]** |
| `autodex.summary.item2.badge` | "Insight" | |
| `autodex.summary.item2.text` | "78% of Unusual Execution alerts are false positives. Add a process parent exception for mmc.exe." | **[NEEDS FINAL COPY — dynamic]** |
| `autodex.summary.item3.badge` | "Insight" | |
| `autodex.summary.item3.text` | "Suspicious PowerShell ImageLoad failed silently 6 hrs due to a renamed Fleet index." | **[NEEDS FINAL COPY — dynamic]** |

### Dashboard — Actions panel

| String ID | Text | Notes |
|---|---|---|
| `autodex.actions.title` | "Actions" | |
| `autodex.actions.search.placeholder` | "Search actions" | |
| `autodex.actions.filter.type` | "Type" | |
| `autodex.actions.badge.approvalNeeded` | "Approval needed" | |
| `autodex.actions.badge.actionRequired` | "Action required" | |
| `autodex.actions.expand.diagnosis` | "Diagnosis" | Uppercase label in expanded card |
| `autodex.actions.expand.rationale` | "Decision rationale" | Uppercase label |
| `autodex.actions.expand.actionsRequired` | "Actions required" | Uppercase label (suggestion items only) |
| `autodex.actions.btn.discard` | "Discard" | |
| `autodex.actions.btn.edit` | "Edit" | No handler — out of scope |
| `autodex.actions.btn.approve` | "Approve" | |
| `autodex.actions.empty.title` | "No approvals required" | |
| `autodex.actions.empty.body` | "AutoDEX has no pending actions awaiting your review." | |
| `autodex.actions.moreMenu.addToChat` | "Add to chat" | |
| `autodex.actions.moreMenu.createCase` | "Create a case" | |

### Dashboard — Activity log

| String ID | Text | Notes |
|---|---|---|
| `autodex.activity.title` | "Activity log" | |
| `autodex.activity.search.placeholder` | "Search activity" | **[NEEDS FINAL COPY — verify with activity log search placeholder in component]** |
| `autodex.activity.group.executionFailure` | "Execution failure" | Group header |
| `autodex.activity.group.tunedFP` | "Tuned false positives" | Group header |
| `autodex.activity.group.installedRule` | "Installed rule" | Group header |
| `autodex.activity.group.updatedRule` | "Updated rule" | Group header |
| `autodex.activity.card.approved` | "Approved" | Badge on completed items |
| `autodex.activity.takeAction` | "Take action" | Button on pending group — no handler |

### Getting Started page

| String ID | Text | Notes |
|---|---|---|
| `autodex.gs.title` | "Getting started with AutoDEX" | |
| `autodex.gs.description` | "AutoDEX is your AI powered detection engineer. It monitors your ruleset around the clock, diagnoses failures, reduces false positive noise, and keeps your Elastic rules up to date so your team can focus on real threats." | |
| `autodex.gs.step1.title` | "Define the scope" | |
| `autodex.gs.step1.sub` | "Choose which actions AutoDEX can take and set the automation level for each one individually." | |
| `autodex.gs.scope.failures.title` | "Fix execution failures" | |
| `autodex.gs.scope.tuning.title` | "Tune high false positive rules" | |
| `autodex.gs.scope.install.title` | "Install new Elastic prebuilt rules" | |
| `autodex.gs.scope.update.title` | "Update existing Elastic rules" | |
| `autodex.gs.scope.automationLevel` | "Automation level" | Uppercase label above slider |
| `autodex.gs.scope.level.1` | "Suggest" | Slider tick |
| `autodex.gs.scope.level.2` | "Semi auto" | Slider tick |
| `autodex.gs.scope.level.3` | "Full auto" | Slider tick |
| `autodex.gs.step2.title` | "Schedule" | |
| `autodex.gs.step2.sub` | "Control when and how often AutoDEX runs." | |
| `autodex.gs.schedule.frequency.label` | "Run frequency" | |
| `autodex.gs.schedule.frequency.sub` | "How often AutoDEX scans and acts on your ruleset." | |
| `autodex.gs.schedule.frequency.hourly` | "Every hour" | |
| `autodex.gs.schedule.frequency.every6h` | "Every 6 hours" | |
| `autodex.gs.schedule.frequency.daily` | "Once a day" | |
| `autodex.gs.schedule.frequency.weekly` | "Once a week" | |
| `autodex.gs.schedule.window.label` | "Active time window" | |
| `autodex.gs.schedule.window.sub` | "Restrict AutoDEX to run only during certain hours." | |
| `autodex.gs.schedule.window.always` | "Always (24/7)" | |
| `autodex.gs.schedule.window.business` | "Business hours (09:00 to 18:00)" | |
| `autodex.gs.schedule.window.night` | "Off hours only (18:00 to 09:00)" | |
| `autodex.gs.schedule.runOnSave.label` | "Run immediately on rule save" | |
| `autodex.gs.schedule.runOnSave.sub` | "Trigger a scan whenever a detection rule is modified or created." | |
| `autodex.gs.schedule.pauseWeekends.label` | "Pause on weekends" | |
| `autodex.gs.schedule.pauseWeekends.sub` | "Skip scheduled runs on Saturdays and Sundays." | |
| `autodex.gs.enable.sub` | "AutoDEX will start on your next scheduled run. You can pause or reconfigure it at any time from the AutoDEX dashboard." | |
| `autodex.gs.enable.btn` | "Enable AutoDEX" | |

---

## 7. Acceptance Criteria

### Onboarding flow

- When a user navigates to `/autodex` and the enabled flag is not set, the empty-state screen is shown and the full dashboard is not rendered.
- When a user clicks "Get started with AutoDEX", they are navigated to `/autodex/get-started`.
- When the page loads, all four scope items are toggled on with their default automation levels (failures=2, tuning=2, install=3, update=2).
- When a scope toggle is turned off, the automation level slider for that item disappears immediately.
- When a scope toggle is turned on, the automation level slider reappears with the previously set value (not reset to default).
- When a user clicks "Enable AutoDEX", the enabled flag is persisted and the user is navigated to `/autodex`.
- When the user subsequently navigates to `/autodex`, the full dashboard is rendered instead of the empty state.

### Actions panel

- When `pendingItems.length === 0`, the empty-state prompt ("No approvals required") is shown and the pagination controls are not rendered.
- When a user clicks an approval card, the reasoning section expands inline without navigating away.
- When a user clicks Approve on an expanded card, the card is removed from the pending list immediately and the `pendingCount` stat in the header decrements by 1.
- When a user clicks Discard on an expanded card, the card is removed from the pending list immediately.
- When the pending list is reduced to zero items via approvals/discards, the empty-state prompt appears.
- When a page contains 5 items and the user approves all 5, the page resets to page 1 automatically.
- When a user clicks "Add to chat" in the card's ⋮ menu, the AI assistant panel is opened pre-populated with a prompt referencing the rule name and reasoning.

### Activity log

- When the activity log section header is clicked, it toggles between expanded and collapsed.
- When the section first renders, it is collapsed by default.
- When a log card is clicked, the full reasoning panel (Diagnosis, Decision rationale, Changes made) expands inline.
- When a search query is entered, only items whose rule name matches are shown.
- When a type filter is selected, only items of that action type are shown.
- When both search and type filter are active, both constraints apply simultaneously.

### Configure modal

- When Configuration is clicked, the modal opens on the Automation scope tab.
- When a tab is selected in the left nav, the corresponding settings panel is shown.
- When "Save configuration" is clicked, the modal closes (persistence not in scope for prototype).
- When "Cancel" is clicked, the modal closes without saving.

---

## 8. Open Questions / Rationale Gaps

The following were inferred from the prototype or left unspecified. A human should confirm before implementation.

| # | Question | Where it matters |
|---|---|---|
| 1 | **Persistence mechanism**: the prototype uses `localStorage` to track enabled state. The real implementation must use a Kibana saved object, feature flag, or server-side preference. What is the target storage mechanism? | Onboarding flow, dashboard gating |
| 2 | **Onboarding settings persistence**: scope and schedule values set during onboarding are never submitted anywhere in the prototype — clicking "Enable AutoDEX" only sets the flag and navigates. What API endpoint receives these settings? | `autodex-getting-started.tsx` |
| 3 | **Configure modal save behaviour**: clicking "Save configuration" closes the modal but makes no API call. What is the save target? | `AutoDexConfigureModal` |
| 4 | **Stats strip data**: all four stats (actions required, minutes saved, approval rate, total tokens) are hardcoded mock values. What APIs supply these, and at what polling interval? | `autodex-page.tsx` stats panel |
| 5 | **AI summary generation**: the three summary bullets are hardcoded strings. What generates these — a dedicated endpoint, a client-side LLM call, or a background job? What is the refresh mechanism? | AI summary card |
| 6 | **"Take action" button** in the activity log group card renders but has no click handler. What should it do? | `AutoDexActivityLog` / `TopGroupAccordion` |
| 7 | **Edit button** on approval cards renders but has no handler. What workflow should editing a proposed change open? | `AutoDexApprovalsPanel` |
| 8 | **"Create a case" menu item** renders in the ⋮ popover but has no handler. Should this open the Kibana Cases flyout? | `AutoDexApprovalsPanel` |
| 9 | **"View all cases" link** in the dashboard header shows a count of 0 with no navigation target. Where should it navigate? | `autodex-page.tsx` |
| 10 | **Activity log empty state**: no empty state is defined for when search/filter returns zero results. [NEEDS DESIGNER INPUT] | `AutoDexActivityLog` |
| 11 | **Keyboard navigation and focus rings**: the custom `Toggle` component and approval card click targets have no keyboard-accessible focus states. Must these meet WCAG 2.1 AA? | All toggle and card components |
| 12 | **Responsive behaviour**: the prototype applies a CSS `zoom` reduction at breakpoints (`< 1400 px → 0.9`, `< 1200 px → 0.8`, `< 1024 px → 0.7`). This is not a production-ready approach. Is a responsive layout required for tablet/smaller desktop? | `autodex-page.tsx` |
| 13 | **Permission model**: no privilege check exists before showing the AutoDEX UI. Should non-admin users see a read-only view? Should the Enable button be disabled without a specific privilege? | All AutoDEX pages |
| 14 | **"Running live" badge logic**: the badge is shown unconditionally when `isEnabled = true`. Should it reflect an actual agent health status (e.g., running, paused, error) rather than just the enabled flag? | `autodex-page.tsx` hero |
| 15 | **`autodex-prototype.html` and `autodex-prd.md`** referenced in the handover request were not found in the repository. If a higher-fidelity prototype or formal PRD exists elsewhere, the above inferences should be reconciled against those documents. | All sections |
