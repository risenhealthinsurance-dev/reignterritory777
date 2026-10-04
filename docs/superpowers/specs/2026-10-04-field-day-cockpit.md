# Field-Day Cockpit Design Specification

## Objective

Evolve Reign Territory from a disconnected Figma prototype into a coherent, mobile-first field-day workflow for representatives while preserving its dark, high-contrast visual language. The implemented prototype must support the complete journey:

`Territory → choose today's work → Route → arrive → start visit → log outcome → recommended next stop → closeout → sync/send`

The experience remains a deterministic client-side prototype. It may simulate recommendations, AI research, synchronization, and manager delivery, but must label local-only state honestly and must never perform an external CRM, messaging, mapping-data, or AI write.

## Global Product Rules

- Fort Pierce, Florida 34950 is the only authoritative sample geography. Account names, addresses, coordinates, distances, ZIP labels, and route copy must agree with it.
- Four persistent tabs remain: Territory, Route, Field AI, and Summary.
- The current stop is shared context across Route and Field AI.
- Hard commitments are protected unless the rep explicitly accepts a change.
- All route changes show commitments, travel-time, expected-value, and projected-finish impact before application.
- Field work remains usable offline. Local mutations enter a visible sync queue and retain timestamps.
- Untouched or unfinished stops are `unresolved`; only locally changed records awaiting a server are `unsynced`.
- External or persistent AI-proposed actions require an exact preview and explicit approval.
- The target viewport is 390 CSS pixels, with no horizontal overflow at 320px and centered containment on desktop.
- Every interactive target is at least 44×44 CSS pixels and each screen exposes semantic headings, a `main` landmark, and persistent navigation through a `nav` landmark.

## Territory

Territory's primary job is choosing today's work. The rep can browse every quadrant, while the app recommends one. No quadrant may look interactive while silently doing nothing; unavailable states must be genuinely disabled and explained.

The flow has three levels:

1. Territory coverage and quadrant comparison.
2. Quadrant opportunity mix and candidate accounts.
3. An editable suggested route with an impact preview.

The recommended stop set prioritizes hard commitments, expected value, and travel efficiency in that order. The rep may add, remove, or reorder stops before starting and may schedule a candidate for later.

## Route

Route is a next-best-action cockpit, not a fixed checklist or map-only navigator. It contains a collapsible full-screen map and one primary current-stop card.

The state sequence is:

1. GPS suggests arrival.
2. The rep confirms `Arrived`.
3. The app offers `Start Visit`, `Call Contact`, `Review Brief`, and `Can't Access Location`.
4. `Start Visit` records a separate visit-start timestamp.
5. The rep records outcome, short note, and next action. Requirements adapt to the outcome.
6. The app recommends the next stop.

Route edits and disruption recovery are recommendation-first: the app previews the revised order and impacts, then waits for confirmation. End Day is always available through a review checkpoint rather than as an immediate destructive transition.

## Field AI

Field AI is a single contextual sales copilot. It automatically inherits the current route stop, shows the locked account context, and lets the rep change accounts or enter territory-wide mode.

The copilot presents quick actions for a 30-second brief, talking points, objection handling, prior interaction summary, visit-note capture, follow-up drafting, and deeper research. Specialized research, digital-presence, supply-opportunity, CRM, follow-up, and route capabilities appear as supporting tools, not separate user-facing agents.

Voice is rep-controlled push-to-talk only; the interface never implies background listening. Answers contain concise top-line guidance plus expandable evidence cards with source, date, confidence, and a `fact` or `AI inference` label. Offline mode uses cached briefs, allows note/draft creation, and visibly queues network-dependent requests.

Every profile edit, follow-up, message, task, or route change is a draft until the rep approves the exact before-and-after preview and destination.

## Summary

Summary is the end-of-day closeout and handoff workspace. It separates completed, unresolved, follow-up, reloop, and unsynced records.

Each unfinished stop requires a deliberate resolution: move to tomorrow, return to territory pool, choose a reloop date, or close with a reason. Bulk actions are supported, but hard commitments warn before movement.

The rep may close locally while offline. The UI distinguishes `Day closed on device` from `Day fully synced`, preserves the original closeout timestamp, and keeps pending work queued. Field AI drafts the manager summary, but the rep reviews, edits, and explicitly sends it. Ending the day and sending the summary remain separate actions.

Post-close corrections use an audited flow that preserves the original value, corrected value, reason, author, and timestamp. Material corrections are labeled for manager review.

## State Model

The UI derives from a single `RepDay` state containing the selected quadrant, candidate route, committed route, current stop, visit timestamps, route-change proposal, sync queue, closeout state, manager-summary draft, and correction history.

Required invariants:

- `arrivedAt` and `visitStartedAt` are separate.
- A pending stop with no local mutation is never counted as unsynced.
- Closing offline never discards local changes.
- The manager summary cannot be marked sent before preview approval.
- Field AI action context defaults to the current route stop and is always visible.
- Applied route changes exactly match the last approved impact preview.

## Verification

Vitest and Testing Library cover state transitions and invariants. Playwright covers the full field-day path, 320/390/1280 containment, landmarks, headings, accessible names, 44px touch targets, reduced motion, and browser-console errors. Production verification repeats the critical path against the deployed Vercel URL.

