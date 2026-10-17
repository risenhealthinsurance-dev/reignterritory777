export interface TerritoryPoint { lat: number; lng: number }

export interface TerritoryRecord {
  id: string;
  boundary: TerritoryPoint[];
  status: "active" | "locked";
  lockedAt?: string;
}

export interface TerritoryLockCheck {
  canLock: boolean;
  reasons: string[];
}

export interface QuadrantPosition { id: string; row: number; column: number; number?: number }

/** Returns the rightward first row, then alternating right-to-left snake order. */
export function orderQuadrantsSnake(quadrants: QuadrantPosition[]) {
  return [...quadrants]
    .sort((a, b) => a.row - b.row || (a.row % 2 === 1 ? a.column - b.column : b.column - a.column))
    .map((quadrant, index) => ({ ...quadrant, number: index + 1 }));
}

function bounds(points: TerritoryPoint[]) {
  return points.reduce(
    (box, point) => ({
      north: Math.max(box.north, point.lat), south: Math.min(box.south, point.lat),
      east: Math.max(box.east, point.lng), west: Math.min(box.west, point.lng),
    }),
    { north: -Infinity, south: Infinity, east: -Infinity, west: Infinity },
  );
}

/** Conservative bounding-box intersection for drawn territories; touching edges count as overlap. */
export function territoriesOverlap(first: TerritoryPoint[], second: TerritoryPoint[]) {
  if (first.length < 3 || second.length < 3) return false;
  const a = bounds(first); const b = bounds(second);
  return a.west <= b.east && a.east >= b.west && a.south <= b.north && a.north >= b.south;
}

export function canCreateTerritory(boundary: TerritoryPoint[], existing: TerritoryRecord[]) {
  return boundary.length >= 3 && !existing.some((territory) => territoriesOverlap(boundary, territory.boundary));
}

export function checkTerritoryLock(completedQuadrants: number, totalQuadrants: number, unresolvedFollowUps: number): TerritoryLockCheck {
  const reasons: string[] = [];
  if (completedQuadrants < totalQuadrants) reasons.push(`${totalQuadrants - completedQuadrants} quadrant(s) still need completion`);
  if (unresolvedFollowUps > 0) reasons.push(`${unresolvedFollowUps} reloop/follow-up item(s) remain unresolved`);
  return { canLock: reasons.length === 0, reasons };
}

export function territoryLockExpiresAt(lockedAt: string) {
  const date = new Date(lockedAt);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCMonth(date.getUTCMonth() + 3);
  return date.toISOString();
}

export function isTerritoryProtected(territory: TerritoryRecord, now = new Date()) {
  if (territory.status !== "locked" || !territory.lockedAt) return false;
  const expires = territoryLockExpiresAt(territory.lockedAt);
  return expires != null && new Date(expires).getTime() > now.getTime();
}
