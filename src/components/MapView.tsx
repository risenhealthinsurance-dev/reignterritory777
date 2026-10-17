import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Account } from "../data/accounts";
import type { DayStop } from "../domain/repDay";
import { quadrantGeoJSON, boundaryGeoJSON, quadrantLabelGeoJSON } from "../data/territory_grid";
import { MapFallback } from "./MapFallback";
import { NextBusinessCard } from "./NextBusinessCard";
import { FieldActionSheet } from "./FieldActionSheet";
import type { GeoJsonFeatureCollection } from "../lib/gis";
import { dispositionColor } from "../lib/dispositionColor";
import type { LocationContext } from "../lib/fieldContext";

const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN?.trim();
if (mapboxAccessToken) mapboxgl.accessToken = mapboxAccessToken;

export interface MapViewProps {
  height: number;
  accounts: Account[];
  activeAccountId: string | null;
  onPinTap: (id: string) => void;
  onMapClick?: (point: { lat: number; lng: number; suggestedName?: string; note?: string }) => void;
  onEntitySelect?: (entity: MapEntitySelection) => void;
  onLocationChange?: (location: { lat: number; lng: number; accuracyMeters?: number }) => void;
  onLocationStateChange?: (context: LocationContext) => void;
  doneAccountIds: string[];
  routeStopIds?: string[];
  showTerritoryMode?: boolean;
  minimalChrome?: boolean;
  activeQuadrantId?: string;
  onQuadrantTap?: (id: string) => void;
  zoningOverlay?: GeoJsonFeatureCollection;
  cockpitAccount?: Account;
  cockpitStop?: DayStop;
  showCockpit?: boolean;
  onNavigate?: () => void;
  onCall?: () => void;
  onSchedule?: () => void;
  onDisposition?: () => void;
  dispositionByAccount?: Record<string, string | undefined>;
}

export interface MapEntitySelection {
  entityId: string;
  parentBuildingId?: string;
  unitIdentifier?: string;
  name?: string;
  address?: string;
  lat: number;
  lng: number;
  source: "mapbox-building" | "mapbox-unit" | "mapbox-address";
  geometry?: { type: string; coordinates?: unknown };
  properties: Record<string, unknown>;
}

export const FORT_PIERCE_CENTER: [number, number] = [-80.337, 27.44];
export type MovementMode = "walking" | "driving";
export const WALKING_SPEED_LIMIT_KMH = 8;
export const DRIVING_SPEED_LIMIT_KMH = 12;
export function getMovementMode(speedKmh: number | null | undefined, previous: MovementMode): MovementMode {
  if (speedKmh == null || !Number.isFinite(speedKmh)) return previous;
  if (speedKmh >= DRIVING_SPEED_LIMIT_KMH) return "driving";
  if (speedKmh <= WALKING_SPEED_LIMIT_KMH) return "walking";
  return previous;
}
export function normalizeHeading(heading: number | null | undefined): number {
  if (heading == null || !Number.isFinite(heading)) return 0;
  return ((heading % 360) + 360) % 360;
}
export function getCameraPreset(mode: MovementMode): { zoom: number; pitch: number } {
  return mode === "driving" ? { zoom: 13.2, pitch: 48 } : { zoom: 15.2, pitch: 58 };
}
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
  onMapClick,
  onEntitySelect,
  onLocationChange,
  onLocationStateChange,
  doneAccountIds,
  routeStopIds,
  showTerritoryMode,
  minimalChrome = false,
  activeQuadrantId,
  onQuadrantTap,
  zoningOverlay,
  cockpitAccount,
  cockpitStop,
  showCockpit = false,
  onNavigate,
  onCall,
  onSchedule,
  onDisposition,
  dispositionByAccount = {},
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
        onMapClick={onMapClick}
        onEntitySelect={onEntitySelect}
        onLocationStateChange={onLocationStateChange}
        showTerritoryMode={showTerritoryMode}
        minimalChrome={minimalChrome}
        cockpitAccount={cockpitAccount}
        cockpitStop={cockpitStop}
        showCockpit={showCockpit}
        onNavigate={onNavigate}
        onCall={onCall}
        onSchedule={onSchedule}
        onDisposition={onDisposition}
        dispositionByAccount={dispositionByAccount}
      />
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initialized = useRef(false);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const locationMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [movementMode, setMovementMode] = useState<MovementMode>("walking");
  const [locationState, setLocationState] = useState<"pending" | "available" | "unavailable">("pending");
  const [isFollowing, setIsFollowing] = useState(true);
  const latestLocationRef = useRef<{ lat: number; lng: number; heading: number; speedKmh: number | null } | null>(null);
  const movementModeRef = useRef<MovementMode>("walking");
  const programmaticCameraRef = useRef(false);
  const applyCamera = useCallback((location: { lat: number; lng: number; heading: number }, mode: MovementMode) => {
    const map = mapRef.current as (mapboxgl.Map & { easeTo?: (options: Record<string, unknown>) => void }) | null;
    if (!map?.easeTo) return;
    programmaticCameraRef.current = true;
    map.easeTo({ center: [location.lng, location.lat], bearing: location.heading, ...getCameraPreset(mode), duration: 650, essential: true });
    window.setTimeout(() => { programmaticCameraRef.current = false; }, 800);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState("unavailable");
      onLocationStateChange?.({ state: "unavailable" });
      return;
    }
    const compassHeadingRef = { current: null as number | null };
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha != null) compassHeadingRef.current = normalizeHeading(360 - event.alpha);
    };
    window.addEventListener("deviceorientationabsolute", onOrientation as EventListener);
    window.addEventListener("deviceorientation", onOrientation as EventListener);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const speedKmh = position.coords.speed == null ? null : Math.max(0, position.coords.speed * 3.6);
        const nextMode = getMovementMode(speedKmh, movementModeRef.current);
        movementModeRef.current = nextMode;
        const gpsHeading = normalizeHeading(position.coords.heading);
        const heading = speedKmh != null && speedKmh <= WALKING_SPEED_LIMIT_KMH && compassHeadingRef.current != null
          ? compassHeadingRef.current
          : gpsHeading;
        latestLocationRef.current = { lat: position.coords.latitude, lng: position.coords.longitude, heading, speedKmh };
        const location = { lat: position.coords.latitude, lng: position.coords.longitude, accuracyMeters: position.coords.accuracy };
        onLocationChange?.(location);
        onLocationStateChange?.({ state: "available", ...location, updatedAt: Date.now() });
        setMovementMode(nextMode);
        setLocationState("available");
        if (isFollowing) applyCamera(latestLocationRef.current, nextMode);
        const liveMarker = locationMarkerRef.current;
        liveMarker?.setLngLat([position.coords.longitude, position.coords.latitude]);
        const liveElement = liveMarker?.getElement();
        if (liveElement) liveElement.style.setProperty("--map-heading", `${heading}deg`);
      },
      () => {
        setLocationState("unavailable");
        onLocationStateChange?.({ state: "unavailable" });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener("deviceorientationabsolute", onOrientation as EventListener);
      window.removeEventListener("deviceorientation", onOrientation as EventListener);
    };
  }, [applyCamera, isFollowing, onLocationChange, onLocationStateChange]);

  const updatePins = useCallback(
    (hidePins: boolean) => {
      for (const acc of accounts) {
        const marker = markersRef.current.get(acc.id);
        if (!marker) continue;
        const el = marker.getElement();
        const isScheduled = acc.source === "mapbox" || acc.source === "user" || !routeStopIds || routeStopIds.includes(acc.id);
        el.style.display = hidePins || !isScheduled ? "none" : "";
        const pin = el.querySelector(".map-pin") as HTMLElement;
        if (!pin) continue;
        const isDone = doneAccountIds.includes(acc.id);
        const isActive = acc.id === activeAccountId;
        const color = dispositionColor(dispositionByAccount[acc.id]);
        pin.className = `map-pin map-pin--${color} ${isDone ? "map-pin--done" : isActive ? "map-pin--active" : ""}`;
        pin.textContent = isDone
          ? "✓"
          : String((routeStopIds?.indexOf(acc.id) ?? -1) + 1 || acc.routeOrder);
      }
    },
    [accounts, activeAccountId, doneAccountIds, routeStopIds, dispositionByAccount],
  );

  useEffect(() => {
    if (initialized.current || !containerRef.current || height === 0) return;
    initialized.current = true;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: FORT_PIERCE_CENTER,
      zoom: getCameraPreset("walking").zoom,
      pitch: getCameraPreset("walking").pitch,
      bearing: -10,
    });
    mapRef.current = map;
    map.on("dragstart", () => { if (!programmaticCameraRef.current) setIsFollowing(false); });
    map.on("rotatestart", () => { if (!programmaticCameraRef.current) setIsFollowing(false); });
    map.on("zoomstart", () => { if (!programmaticCameraRef.current) setIsFollowing(false); });
    const locationElement = document.createElement("div");
    locationElement.className = "map-location-marker";
    locationElement.setAttribute("aria-label", "Rep live location");
    locationMarkerRef.current = new mapboxgl.Marker({ element: locationElement })
      .setLngLat(FORT_PIERCE_CENTER)
      .addTo(map);

    map.on("style.load", () => {
      map.setConfigProperty("basemap", "lightPreset", "night");
      map.setConfigProperty("basemap", "theme", "default");
      map.setConfigProperty("basemap", "showPointOfInterestLabels", true);
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
      map.addSource("zoning-overlay", {
        type: "geojson",
        data: zoningOverlay ?? { type: "FeatureCollection", features: [] },
      });
      map.addSource("selected-map-entity", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "selected-map-entity-point",
        type: "circle",
        source: "selected-map-entity",
        slot: "top",
        paint: { "circle-color": "#22d3ee", "circle-radius": 8, "circle-stroke-color": "#e0f2fe", "circle-stroke-width": 3 },
      });
      map.addLayer({
        id: "selected-map-entity-fill",
        type: "fill",
        source: "selected-map-entity",
        slot: "top",
        paint: { "fill-color": "#22d3ee", "fill-opacity": 0.2 },
      });
      map.addLayer({
        id: "selected-map-entity-line",
        type: "line",
        source: "selected-map-entity",
        slot: "top",
        paint: { "line-color": "#67e8f9", "line-width": 4, "line-opacity": 1 },
      });
      map.addLayer({
        id: "zoning-fill",
        type: "fill",
        source: "zoning-overlay",
        slot: "top",
        paint: {
          "fill-color": [
            "match",
            ["get", "classification"],
            "business_priority", "#10b981",
            "business_permitted_mixed", "#22d3ee",
            "conditional_verify", "#f59e0b",
            "residential_non_target", "#64748b",
            "#64748b",
          ],
          "fill-opacity": 0.16,
        },
        layout: { visibility: "visible" },
      });
      map.addLayer({
        id: "zoning-line",
        type: "line",
        source: "zoning-overlay",
        slot: "top",
        paint: { "line-color": "#94a3b8", "line-width": 1, "line-opacity": 0.72 },
        layout: { visibility: "visible" },
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
        const color = dispositionColor(dispositionByAccount[acc.id]);
        const wrapper = document.createElement("div");
        const pin = document.createElement("div");
        const isScheduled = acc.source === "mapbox" || acc.source === "user" || !routeStopIds || routeStopIds.includes(acc.id);
        wrapper.style.display = isScheduled ? "" : "none";
        pin.className = `map-pin map-pin--${color} ${isDone ? "map-pin--done" : isActive ? "map-pin--active" : ""}`;
        pin.textContent = isDone
          ? "✓"
          : String((routeStopIds?.indexOf(acc.id) ?? -1) + 1 || acc.routeOrder);
        pin.setAttribute("role", "button");
        pin.setAttribute("tabindex", "0");
        pin.setAttribute("aria-label", `Open ${acc.name}`);
        wrapper.appendChild(pin);
        wrapper.addEventListener("click", (event) => { event.stopPropagation(); onPinTap(acc.id); });
        wrapper.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") onPinTap(acc.id);
        });
        const marker = new mapboxgl.Marker({ element: wrapper })
          .setLngLat([acc.lng, acc.lat])
          .addTo(map);
        markersRef.current.set(acc.id, marker);
      }
      const handleMapClick = (clientX: number, clientY: number) => {
        const rect = map.getCanvas().getBoundingClientRect();
        const point = { x: clientX - rect.left, y: clientY - rect.top };
        const lngLat = map.unproject([point.x, point.y]);
        // Drawing mode owns map clicks. Do this before entity hit-testing so a boundary
        // point cannot be swallowed by Mapbox building/address selection.
        if (onMapClick) {
          onMapClick({ lat: lngLat.lat, lng: lngLat.lng });
          return;
        }
        const building = map.queryRenderedFeatures([point.x, point.y]).find((feature) => {
          const layer = feature.layer as { id?: string; type?: string } | undefined;
          const sourceLayer = String((feature as { sourceLayer?: string }).sourceLayer ?? "").toLowerCase();
          const layerId = String(layer?.id ?? "").toLowerCase();
          return layer?.type === "fill-extrusion" || sourceLayer.includes("building") || layerId.includes("building");
        });
        if (building && onEntitySelect) {
          const properties = (building as { properties?: Record<string, unknown> }).properties ?? {};
          const sourceLayer = String((building as { sourceLayer?: string }).sourceLayer ?? "").toLowerCase();
          const unitIdentifier = ["unit", "suite", "unit_name", "addr:unit", "level"]
            .map((key) => properties[key]).find((value) => typeof value === "string" && value.trim()) as string | undefined;
          const featureId = (building as { id?: string | number }).id;
          const entityId = `mapbox-${unitIdentifier ? "unit" : "building"}-${String(featureId ?? `${lngLat.lng.toFixed(6)}-${lngLat.lat.toFixed(6)}`)}`;
          const geometry = (building as { geometry?: { type: string; coordinates?: unknown } }).geometry;
          const source = map.getSource("selected-map-entity") as mapboxgl.GeoJSONSource | undefined;
          if (source && geometry) source.setData({ type: "FeatureCollection", features: [{ type: "Feature", id: entityId, properties: {}, geometry }] } as never);
          onEntitySelect({
            entityId,
            parentBuildingId: unitIdentifier ? String(properties.building_id ?? properties.parent_id ?? "") || undefined : undefined,
            unitIdentifier,
            name: [properties.name, properties.name_en, properties.business_name].find((value) => typeof value === "string" && value.trim()) as string | undefined,
            address: [properties.address, properties.full_address, properties.house_num].find((value) => typeof value === "string" && value.trim()) as string | undefined,
            lat: lngLat.lat,
            lng: lngLat.lng,
            source: unitIdentifier || sourceLayer.includes("unit") ? "mapbox-unit" : "mapbox-building",
            geometry,
            properties,
          });
          return;
        }
        if (onEntitySelect) {
          const entityId = `mapbox-address-${lngLat.lng.toFixed(6)}-${lngLat.lat.toFixed(6)}`;
          const source = map.getSource("selected-map-entity") as mapboxgl.GeoJSONSource | undefined;
          if (source) source.setData({ type: "FeatureCollection", features: [{ type: "Feature", id: entityId, properties: {}, geometry: { type: "Point", coordinates: [lngLat.lng, lngLat.lat] } }] } as never);
          onEntitySelect({ entityId, lat: lngLat.lat, lng: lngLat.lng, source: "mapbox-address", properties: {} });
        }
      };
      const canvasContainer = map.getCanvasContainer();
      canvasContainer.addEventListener("click", (event) => handleMapClick(event.clientX, event.clientY));
    });

    const ro = new ResizeObserver(() => mapRef.current?.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;
      initialized.current = false;
    };
  }, [height]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof (map as mapboxgl.Map & { getSource?: unknown }).getSource !== "function") return;
    const source = map.getSource("zoning-overlay") as mapboxgl.GeoJSONSource | undefined;
    if (source) source.setData(zoningOverlay ?? { type: "FeatureCollection", features: [] });
  }, [zoningOverlay]);

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

  const recenter = () => {
    setIsFollowing(true);
    if (latestLocationRef.current) applyCamera(latestLocationRef.current, movementModeRef.current);
    else applyCamera({ lat: FORT_PIERCE_CENTER[1], lng: FORT_PIERCE_CENTER[0], heading: 0 }, movementModeRef.current);
  };

  const doneCount = doneAccountIds.length;

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {locationState === "unavailable" && (
        <div className="map-location-status" role="status">Live location unavailable</div>
      )}
      {!isFollowing && (
        <button className="map-recenter-button" type="button" onClick={recenter} aria-label="Recenter on live location">
          ◎ Recenter
        </button>
      )}
      <div className="map-mode-badge" aria-label={`Camera mode: ${movementMode}`}>
        {movementMode === "driving" ? "▰ Driving view" : "✦ Walking view"}
      </div>

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
      {showCockpit && cockpitAccount && onNavigate && onCall && onSchedule && onDisposition && (
        <>
          <NextBusinessCard account={cockpitAccount} stop={cockpitStop} onNavigate={onNavigate} />
          <FieldActionSheet account={cockpitAccount} onCall={onCall} onSchedule={onSchedule} onDisposition={onDisposition} />
        </>
      )}
    </div>
  );
}
