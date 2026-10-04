import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import type { Account } from "../data/accounts";
import { quadrantGeoJSON, boundaryGeoJSON, quadrantLabelGeoJSON } from "../data/territory_grid";
import { MapFallback } from "./MapFallback";

const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim();
if (mapboxAccessToken) mapboxgl.accessToken = mapboxAccessToken;

export interface MapViewProps {
  height: number;
  accounts: Account[];
  activeAccountId: string | null;
  onPinTap: (id: string) => void;
  doneAccountIds: string[];
  routeStopIds?: string[];
  showTerritoryMode?: boolean;
  activeQuadrantId?: string;
  onQuadrantTap?: (id: string) => void;
}

export const FORT_PIERCE_CENTER: [number, number] = [-80.337, 27.44];
export function getRouteCoordinates(items: Account[], routeStopIds?: string[]): [number, number][] {
  const rank = new Map(routeStopIds?.map((id, index) => [id, index]));
  return [...items]
    .filter((account) => !routeStopIds || rank.has(account.id))
    .sort((first, second) =>
      routeStopIds
        ? (rank.get(first.id) ?? Number.MAX_SAFE_INTEGER) -
          (rank.get(second.id) ?? Number.MAX_SAFE_INTEGER)
        : first.routeOrder - second.routeOrder,
    )
    .map((account) => [account.lng, account.lat]);
}

export function MapView({
  height,
  accounts,
  activeAccountId,
  onPinTap,
  doneAccountIds,
  routeStopIds,
  showTerritoryMode,
  activeQuadrantId,
  onQuadrantTap,
}: MapViewProps) {
  if (!mapboxAccessToken) {
    return (
      <MapFallback
        height={height}
        accounts={accounts}
        activeAccountId={activeAccountId}
        doneAccountIds={doneAccountIds}
        routeStopIds={routeStopIds}
        onPinTap={onPinTap}
        showTerritoryMode={showTerritoryMode}
      />
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initialized = useRef(false);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const updatePins = useCallback(
    (hidePins: boolean) => {
      for (const acc of accounts) {
        const marker = markersRef.current.get(acc.id);
        if (!marker) continue;
        const el = marker.getElement();
        const isScheduled = !routeStopIds || routeStopIds.includes(acc.id);
        el.style.display = hidePins || !isScheduled ? "none" : "";
        const pin = el.querySelector(".map-pin") as HTMLElement;
        if (!pin) continue;
        const isDone = doneAccountIds.includes(acc.id);
        const isActive = acc.id === activeAccountId;
        pin.className = `map-pin map-pin--${isDone ? "done" : isActive ? "active" : "pending"}`;
        pin.textContent = isDone
          ? "✓"
          : String((routeStopIds?.indexOf(acc.id) ?? -1) + 1 || acc.routeOrder);
      }
    },
    [accounts, activeAccountId, doneAccountIds, routeStopIds],
  );

  useEffect(() => {
    if (initialized.current || !containerRef.current || height === 0) return;
    initialized.current = true;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: FORT_PIERCE_CENTER,
      zoom: 13.8,
      pitch: 45,
      bearing: -10,
    });
    mapRef.current = map;

    map.on("style.load", () => {
      map.setConfigProperty("basemap", "lightPreset", "night");
      map.setConfigProperty("basemap", "theme", "monochrome");
      map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
      map.setConfigProperty("basemap", "show3dBuildings", true);

      // Route line
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: getRouteCoordinates(accounts, routeStopIds),
          },
        },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        slot: "top",
        paint: {
          "line-color": "#3b82f6",
          "line-width": 3,
          "line-opacity": 0.9,
          "line-dasharray": [2, 1.5],
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
          visibility: "visible",
        },
      });

      // ── Territory layers (always added, visibility toggled via prop) ──────
      map.addSource("territory-boundary", {
        type: "geojson",
        data: boundaryGeoJSON(),
      });
      map.addSource("territory-grid", {
        type: "geojson",
        data: quadrantGeoJSON(),
      });
      map.addSource("territory-labels", {
        type: "geojson",
        data: quadrantLabelGeoJSON(),
      });

      // Boundary fill (dim everything outside the ZIP)
      map.addLayer({
        id: "boundary-fill",
        type: "fill",
        source: "territory-boundary",
        slot: "top",
        paint: { "fill-color": "rgba(34,211,238,0.04)", "fill-opacity": 1 },
        layout: { visibility: "none" },
      });

      // Boundary outline
      map.addLayer({
        id: "boundary-line",
        type: "line",
        source: "territory-boundary",
        slot: "top",
        paint: {
          "line-color": "#22d3ee",
          "line-width": 2.5,
          "line-opacity": 0.9,
        },
        layout: { visibility: "none" },
      });

      // Quadrant fills (data-driven by status)
      map.addLayer({
        id: "quadrant-fill",
        type: "fill",
        source: "territory-grid",
        slot: "top",
        paint: {
          "fill-color": [
            "match",
            ["get", "status"],
            "active",
            "rgba(34,211,238,0.18)",
            "completed",
            "rgba(16,185,129,0.14)",
            "locked",
            "rgba(8,10,20,0.55)",
            "rgba(0,0,0,0)",
          ],
          "fill-opacity": 1,
        },
        layout: { visibility: "none" },
      });

      // Quadrant borders
      map.addLayer({
        id: "quadrant-lines",
        type: "line",
        source: "territory-grid",
        slot: "top",
        paint: {
          "line-color": [
            "match",
            ["get", "status"],
            "active",
            "#22d3ee",
            "completed",
            "#10b981",
            "#1a2236",
          ],
          "line-width": ["match", ["get", "status"], "active", 1.5, 0.5],
          "line-opacity": 0.7,
        },
        layout: { visibility: "none" },
      });

      // Quadrant labels
      map.addLayer({
        id: "quadrant-labels",
        type: "symbol",
        source: "territory-labels",
        slot: "top",
        paint: {
          "text-color": [
            "match",
            ["get", "status"],
            "active",
            "#22d3ee",
            "completed",
            "#10b981",
            "#374151",
          ],
          "text-halo-color": "rgba(6,8,16,0.9)",
          "text-halo-width": 1,
        },
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "text-size": 11,
          visibility: "none",
        },
      });

      // Quadrant tap handler
      map.on("click", "quadrant-fill", (e) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = (e.features?.[0] as any)?.properties?.id as string | undefined;
        if (id) onQuadrantTap?.(id);
      });
      map.on("mouseenter", "quadrant-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "quadrant-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      // Account pins
      for (const acc of accounts) {
        const isDone = doneAccountIds.includes(acc.id);
        const isActive = acc.id === activeAccountId;
        const wrapper = document.createElement("div");
        const pin = document.createElement("div");
        const isScheduled = !routeStopIds || routeStopIds.includes(acc.id);
        wrapper.style.display = isScheduled ? "" : "none";
        pin.className = `map-pin map-pin--${isDone ? "done" : isActive ? "active" : "pending"}`;
        pin.textContent = isDone
          ? "✓"
          : String((routeStopIds?.indexOf(acc.id) ?? -1) + 1 || acc.routeOrder);
        pin.setAttribute("role", "button");
        pin.setAttribute("tabindex", "0");
        pin.setAttribute("aria-label", `Open ${acc.name}`);
        wrapper.appendChild(pin);
        wrapper.addEventListener("click", () => onPinTap(acc.id));
        wrapper.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") onPinTap(acc.id);
        });
        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([acc.lng, acc.lat])
          .addTo(map);
        markersRef.current.set(acc.id, marker);
      }
    });

    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      initialized.current = false;
    };
  }, [height]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync pin visibility + styles
  useEffect(() => {
    updatePins(showTerritoryMode ?? false);
  }, [updatePins, showTerritoryMode]);

  // Toggle territory layer visibility and camera
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const vis = (showTerritoryMode ? "visible" : "none") as "visible" | "none";
    const routeVis = (!showTerritoryMode ? "visible" : "none") as "visible" | "none";
    for (const id of [
      "boundary-fill",
      "boundary-line",
      "quadrant-fill",
      "quadrant-lines",
      "quadrant-labels",
    ]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", vis);
    }
    if (map.getLayer("route-line")) map.setLayoutProperty("route-line", "visibility", routeVis);
    if (showTerritoryMode) {
      map.flyTo({
        center: FORT_PIERCE_CENTER,
        zoom: 12.2,
        pitch: 0,
        bearing: 0,
        duration: 700,
      });
    } else {
      map.flyTo({
        center: FORT_PIERCE_CENTER,
        zoom: 13.8,
        pitch: 45,
        bearing: -10,
        duration: 700,
      });
    }
  }, [showTerritoryMode]);

  useEffect(() => {
    mapRef.current?.resize();
  }, [height]);

  const doneCount = doneAccountIds.length;

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Territory overlay badge */}
      {showTerritoryMode ? (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: "rgba(6,8,16,0.82)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(34,211,238,0.3)",
              borderRadius: 14,
              padding: "7px 13px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22d3ee",
                boxShadow: "0 0 8px rgba(34,211,238,0.8)",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#6b7490",
                letterSpacing: 1,
              }}
            >
              TERRITORY
            </span>
            <span
              style={{
                fontSize: 13,
                fontFamily: "DM Mono,monospace",
                fontWeight: 500,
                color: "#22d3ee",
              }}
            >
              34950
            </span>
          </div>
          <div
            style={{
              background: "rgba(6,8,16,0.82)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "7px 13px",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#22d3ee",
              }}
            >
              A1 ACTIVE
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#374151",
              }}
            >
              {" "}
              · 24 available · A1 recommended
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            right: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <div
            style={{
              background: "rgba(6,8,16,0.78)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "7px 13px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22d3ee",
                boxShadow: "0 0 8px rgba(34,211,238,0.8)",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#6b7490",
                letterSpacing: 1,
              }}
            >
              A1 · ROUTE
            </span>
            <span
              style={{
                fontSize: 13,
                fontFamily: "DM Mono,monospace",
                fontWeight: 500,
                color: "#22d3ee",
              }}
            >
              34950
            </span>
            <div style={{ width: 1, height: 12, background: "#2d3340" }} />
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#9ba3b8",
              }}
            >
              {doneCount}/{accounts.length} done
            </span>
          </div>
          <div
            style={{
              background: "rgba(6,8,16,0.78)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "7px 13px",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontFamily: "DM Mono,monospace",
                color: "#6b7490",
              }}
            >
              14.4 mi · A1 loop
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
