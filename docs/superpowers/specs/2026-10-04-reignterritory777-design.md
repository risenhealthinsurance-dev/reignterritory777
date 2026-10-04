# ReignTerritory777 Design Specification

## Objective

Create a faithful, repository-ready implementation of the Reign Territory mobile field-sales experience from the supplied Figma Make project. The first release is an interactive frontend prototype, not a production-connected application.

The implementation must preserve the design's route management, territory navigation, visit disposition, follow-up scheduling, recovery flow, end-of-day summary, and approval-gated Field AI experience. It must not invent server behavior, authentication, CRM writes, outbound communication, or autonomous AI actions.

## Source of Truth

The exported Figma Make code and its visible preview are the primary sources of truth. The implementation handoff included in the export supplements them by documenting screen relationships and interaction states.

When sources differ, priority is:

1. Visible behavior in the current Figma Make preview.
2. Current exported implementation.
3. The exported engineering handoff.

The target viewport for visual comparison is 390 CSS pixels wide. The application must remain usable at smaller mobile widths and appear as a centered mobile surface on larger screens.

## Technical Approach

Use the exported application as the implementation baseline instead of recreating it from screenshots. Preserve its React 19, TypeScript, Vite, Tailwind CSS 4, and Mapbox GL architecture.

The codebase will remain a client-side prototype with deterministic sample data. React state owns screen navigation, route-stop state, drafts, approval decisions, and sync labels. No external database or API is introduced in this release.

The repository target is `risenhealthinsurance/reignterritory777`.

## Application Structure

The application has four persistent navigation groups after kickoff:

- Territory: territory overview, active quadrant, and quadrant route.
- Route: route list, stop detail, disposition, follow-up, and recovery.
- Field AI: business selection, locked account context, audit progress, audit results, and proposed-edit review.
- Summary: end-of-day totals, completed stops, reloops, follow-ups, and unsynced records.

Kickoff is the default entry screen and hides the persistent bottom navigation. All other navigation occurs through explicit callbacks and a typed `AppScreen` state. Browser routing is not required for this prototype.

## Core Interaction Flows

### Daily route

The user starts or resumes the route from kickoff, reviews ordered stops, opens a stop, and records an outcome. Confirming a disposition updates only local application state and returns the user to the route.

### Territory exploration

The user enters the Territory tab, selects the active A1 quadrant, reviews the loop, and starts the route. Locked quadrants remain visibly unavailable.

### Follow-up and recovery

Follow-up scheduling uses draft, confirmation, and saved states. Failed stops open the recovery flow with the known failure reason and recovery plan preselected when available. State mutations occur only after explicit confirmation.

### Field AI

Field AI requires the user to choose a business before actions become available. The audit flow progresses through deterministic loading, results, and proposed-edit review states. Approving an edit queues it locally for review; it does not write to a CRM or send outreach. Rejecting it returns to results without applying it.

### Summary and synchronization

The Summary screen groups completed work, reloops, follow-ups, and unsynced records. Sync controls are demonstrative local state transitions only. They must not claim a remote write occurred.

## Data and State Boundaries

Keep the exported sample territory, accounts, stop records, audit findings, supply opportunities, and proposed profile edits. Domain types remain explicit in TypeScript.

Required invariants:

- Route-card appearance derives from each stop's status.
- No user data leaves the browser.
- No CRM change, enrollment, discount, message, or appointment is performed externally.
- Destructive or consequential state changes require an explicit review or confirmation step.
- Offline and unsynced labels describe local prototype state accurately.
- Claims about missing business information use qualified language such as “not found in sources checked.”

## Visual System

Preserve the dark, map-first mobile design:

- Primary background near `#0a0c10`, with slightly raised panel and card surfaces.
- Inter for interface text and DM Mono for data labels and compact metadata.
- Cyan for territory context, blue for route and primary actions, green for success, amber for warnings and local-only state, red for failures, and purple for enterprise-tier accents.
- Cards use subtle borders, 12–14px radii, and restrained elevation.
- Interactive controls meet a 44px minimum touch target.
- The bottom navigation respects the device safe area.
- Scrollable panels hide decorative scrollbars without disabling scrolling.

Map overlays, route markers, status indicators, and all visible static imagery from the export must remain in their designed slots and proportions.

## Map Configuration

Preserve the two Mapbox modes:

- Route mode: angled night map with the active route and stop markers.
- Territory mode: flatter ZIP-level view with quadrant context.

Remove any literal Mapbox access token from tracked source. Read `VITE_MAPBOX_ACCESS_TOKEN` from the environment and document it in `.env.example`. If no token is present, show a styled non-interactive map fallback that retains layout, markers, labels, and navigation usability without exposing credentials.

## Accessibility and Responsive Behavior

Use semantic buttons and form controls, visible focus styles, accessible labels for icon-only controls, and sufficient status information beyond color alone. Honor `prefers-reduced-motion` for pulsing and loading effects.

The 390px design is the visual baseline. At narrower widths, content must not overflow horizontally. At wider widths, the mobile application remains centered with a constrained maximum width while the surrounding page uses a neutral dark backdrop.

## Error and Empty States

The first release must include:

- A no-token map fallback.
- Empty Field AI state before selecting a business.
- Disabled submission controls until required disposition or follow-up fields are chosen.
- Retryable visual state for simulated sync failure.
- Safe handling when an account or stop identifier cannot be resolved, returning the user to the nearest valid screen instead of crashing.

Network-backed error handling is excluded because this release has no backend.

## Testing Strategy

Use Vitest and React Testing Library for behavior tests. Tests are written before production changes and cover:

- Kickoff to route navigation.
- Territory to quadrant to route navigation.
- Stop selection and disposition confirmation.
- Follow-up confirmation and saved state.
- Failed-stop recovery choices.
- Field AI business selection and approval/rejection gates.
- Summary grouping and local sync state.
- Missing Mapbox token fallback.
- Invalid selected identifiers.

Run TypeScript checking, the complete test suite, formatting checks, and a production build. Perform browser verification at a 390px viewport against the Figma preview, then check one narrow and one desktop viewport for overflow and containment.

## Repository Deliverables

- Application source and local sample data.
- Automated behavior tests.
- `.env.example` without secrets.
- README with installation, development, testing, build, and Mapbox configuration instructions.
- Git ignore rules that exclude dependencies, build output, local environment files, and editor artifacts.
- GitHub repository at `risenhealthinsurance/reignterritory777`.

Deployment, CI/CD, production authentication, analytics, and backend services are outside this release.

## Acceptance Criteria

1. The application builds and runs from a clean checkout using documented commands.
2. All twelve designed screens and their intended navigation paths are available.
3. Route, disposition, follow-up, recovery, Field AI, and summary interactions preserve the Figma behavior.
4. Approval-gated actions never imply an automatic remote write.
5. The 390px rendering closely matches the Figma preview, including typography, spacing, color, hierarchy, and visible assets.
6. The interface remains usable without a Mapbox token and does not contain a tracked secret.
7. Automated tests, TypeScript checks, formatting checks, and the production build complete successfully.
8. The GitHub repository is created under the requested organization with the implementation pushed to its default branch.

## Explicit Non-Goals

- Production authentication or authorization.
- Real CRM, calendar, messaging, mapping-data, or AI-service writes.
- Persisting data beyond the browser session.
- Desktop-specific workflows beyond presenting the mobile surface cleanly.
- Redesigning, expanding, or simplifying product behavior not represented in Figma.
