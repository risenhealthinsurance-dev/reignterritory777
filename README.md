# Reign Territory

Reign Territory is a mobile-first field-sales canvassing prototype built from the approved Figma Make experience. It includes territory planning, route stops, dispositions, follow-ups, recovery planning, a local approval-gated Field AI workspace, and an end-of-day summary.

All records and AI results are deterministic browser-local prototype data. The application does not authenticate users, write to a CRM, send outreach, create calendar events, or call an external AI service.

## Requirements

- Node.js 22 or newer
- pnpm 11 or newer
- Optional Mapbox public token for the interactive map

## Setup

```bash
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

Set `VITE_MAPBOX_ACCESS_TOKEN` in `.env.local` to enable Mapbox. Without it, the application displays a fully navigable styled fallback map.

## Quality checks

```bash
pnpm test
pnpm run typecheck
pnpm run format:check
pnpm run build
```

## Screen map

- Kickoff
- Territory overview → active quadrant → quadrant route
- Route → stop → disposition, follow-up, or recovery
- Field AI → business picker → audit → proposed-edit review
- Summary → completed, reloop, follow-up, and unsynced views

The visual baseline is a 390px-wide mobile viewport. On desktop, the application remains centered as a mobile surface.
