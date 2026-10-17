# Territory lifecycle and field-sales intelligence

## Intent

Reign Territory should reduce the field rep's daily planning burden by combining manually defined territory geometry with pipeline-aware route planning. The initial user is one field salesperson, but the model should allow multiple active territories.

## Goals

- Let the rep draw a territory boundary and manually adjust its quadrants.
- Number quadrants and preserve the clockwise/rightward, then right-to-left snake canvassing sequence.
- Treat exact reloop appointments as protected commitments and time windows as flexible commitments.
- Fill the time around protected reloops with nearby new doors.
- Capture visit outcomes from voice notes and map them to the existing pipeline dispositions.
- Lock an exhausted territory for at least three months so a new territory cannot overlap it.
- Keep locked territories view-only while preserving account history.

## Non-goals

- Team collaboration, permissions, or manager workflows in this iteration.
- Follow-ups scheduled three months or more into the future.
- Replacing the existing pipeline record model with multiple opportunities per business.
- Fully autonomous route execution without a reviewable plan.

## Product behavior

### Territory creation

The user starts a new territory by drawing a boundary on the map. The app prevents overlap with territories that are still active or inside their three-month lock period. The user can create multiple active territories and select one as the current working territory.

Within the boundary, the app creates editable quadrants. The user can resize or reshape the quadrants and reorder or renumber them. The default order is clockwise/rightward within a quadrant, then a right-to-left snake across quadrants, but the user remains the source of truth for manual adjustments.

### Territory completion and lock

A territory becomes eligible to lock only when every quadrant is canvassed and there are no outstanding reloops or follow-ups for businesses in that territory. Locking preserves the boundary, quadrant geometry, numbering, and account history. A locked territory can be viewed and its accounts can receive notes or history updates, but its boundary and quadrants cannot be edited. Its geometry remains excluded from new territory drawing for at least three months.

### Reloops and route planning

An exact appointment time is a protected reloop commitment. A day/time window is a flexible reloop commitment that can be placed efficiently within the day. The planner prioritizes reloops over new doors, protects exact appointments, and uses nearby new doors to fill the gaps around them. When a cancellation, closure, or new high-priority opportunity changes conditions, the AI may replan the remainder of the day for approval/use in the existing field workflow.

The initial daily planning target is 6–8 hours. Success is measured primarily by closes and quality reloops, with new doors treated as the source of future conversations and reloops.

### Voice and pipeline

The rep can record a flexible voice note after a visit. AI extracts the contact name, exact time or time window, day, optional notes, disposition, and next action. The initial disposition semantics are:

- `not interested`: lost
- `follow up later`: waiting on a decision
- owner/DM unavailable: reloop, with name and timing when available
- discovery/proposal completed: advance the existing single pipeline record toward close or follow-up

## Design calls

- Multiple active territories are supported from the start, for one user.
- Territory lock is geometry protection, not account-history deletion.
- Exact appointment times outrank route efficiency; flexible windows are optimized within the territory sequence.
- The current app's existing route, follow-up, disposition, and voice/AI flows should be extended rather than replaced.

## Builder-owned details

- Exact drawing and quadrant-editing interaction within the existing Mapbox surface.
- Persistence shape and migration strategy based on the existing local/Supabase architecture.
- The concrete overlap algorithm and date arithmetic, provided they enforce the observable lock rules.
- The precise AI extraction adapter, provided it preserves the required disposition semantics and has a deterministic fallback for unavailable AI.

## Definition of done

- A user can create, edit, number, select, and view multiple territories.
- Overlap is rejected against active and locked territory geometry.
- A territory can only lock after all quadrants and associated follow-ups/reloops are exhausted.
- Locked territory geometry is view-only and remains protected for three months.
- Exact reloops remain protected while flexible windows and new doors are planned around them.
- Voice disposition creates the correct pipeline state and timing fields.
- Relevant domain/UI tests and the existing typecheck/build pass.
