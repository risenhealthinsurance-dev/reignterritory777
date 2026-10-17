# Task contract: territory lifecycle and field intelligence

## Scope

Implement the approved territory lifecycle and field-sales intelligence behavior described in `docs/superpowers/specs/2026-10-17-territory-lifecycle-design.md`, extending the existing territory, quadrant, route, follow-up, disposition, and voice/AI flows.

## Non-goals

- Team accounts or permissions.
- Follow-ups beyond the three-month territory lock horizon.
- Multiple opportunity records per account.
- Replacing the existing route and pipeline UX wholesale.

## File boundaries

Allowed to change:

- `src/types.ts`
- `src/domain/**`
- `src/lib/**`
- `src/components/**`
- `src/screens/**`
- `src/App.tsx`
- `src/data/**` only for fixtures required by tests or demo state
- Relevant tests adjacent to changed modules
- `docs/**` for implementation notes if needed

Do not change:

- `api/**`
- `supabase/**`
- deployment configuration
- unrelated authentication or enrichment flows

## Acceptance criteria

- Given no overlapping active or locked territory, when the user draws a boundary, then a new editable territory is created.
- Given multiple active territories, when the user selects one, then its boundary, quadrants, and route context are shown without altering the others.
- Given an editable territory, when the user adjusts or renumbers quadrants, then the saved canvassing order reflects the new geometry and numbering.
- Given a quadrant that has been worked, when the field rep selects it and presses Complete, then it is blocked out as complete and removed from the active canvass queue.
- Given an active territory with any incomplete quadrant or outstanding reloop/follow-up, when the user attempts to lock it, then locking is rejected with an actionable explanation.
- Given an exhausted territory, when the field rep explicitly locks it, then its geometry becomes view-only and overlap checks reject new territories intersecting it for three months. The three-month lock begins at that explicit action.
- Given an exact reloop appointment, when the route is planned or replanned, then the appointment remains protected.
- Given a flexible reloop window, when the route is planned, then the planner may position it efficiently while preserving its day and window.
- Given a protected reloop and open time around it, when the day is planned, then nearby new doors fill the surrounding route gaps.
- Given a voice disposition for an unavailable owner/DM, when extracted, then name, timing, notes, reloop state, and next action are saved.
- Given voice dispositions for “not interested” and “follow up later,” then they map to lost and waiting-on-decision semantics respectively.
- Relevant domain and UI tests pass, `pnpm typecheck` passes, `pnpm build` passes, and `git diff --check` passes.

## Ordered execution plan

1. Add domain models and pure functions for territory geometry, overlap, quadrant ordering/editing, exhaustion, and lock windows.
2. Extend route priority and follow-up models to distinguish protected exact appointments from flexible windows while retaining new-door fill behavior.
3. Add the territory creation/edit/lock UI to the existing map and territory screens.
4. Connect voice disposition extraction to the existing pipeline update path with deterministic fallback behavior.
5. Add unit and component tests for the acceptance criteria.
6. Run typecheck, build, tests, diff checks, and browser visual QA for territory drawing, quadrant editing, locking, and route replanning.

## QA commands

- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`
- `pnpm test:e2e`

Plan approved. Clarifications incorporated: quadrant completion is an explicit field-rep action; unresolved reloops/follow-ups block locking; and the three-month lock begins when the field rep explicitly locks the exhausted territory.
