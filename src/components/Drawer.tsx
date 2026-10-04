import { useRef, useCallback, useEffect, type ReactNode } from "react";
import type { DrawerSnap } from "../types";

interface DrawerProps {
  snap: DrawerSnap;
  setSnap: (s: DrawerSnap) => void;
  drawerH: number;
  setDrawerH: (h: number) => void;
  children: ReactNode;
}

const SNAP_HEIGHTS: Record<DrawerSnap, number | string> = {
  peek: 88,
  half: 0.52,
  full: 0.92,
};

export function getSnapPx(s: DrawerSnap): number {
  const v = SNAP_HEIGHTS[s];
  return typeof v === "number" && v < 1 ? Math.round(window.innerHeight * v) : (v as number);
}

const snapUp = (s: DrawerSnap): DrawerSnap => (s === "peek" ? "half" : "full");
const snapDown = (s: DrawerSnap): DrawerSnap => (s === "full" ? "half" : "peek");

export function Drawer({ snap, setSnap, drawerH, setDrawerH, children }: DrawerProps) {
  const dragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const currentH = useRef(drawerH);
  const velocityBuf = useRef<{ y: number; t: number }[]>([]);

  useEffect(() => {
    const target = getSnapPx(snap);
    setDrawerH(target);
    currentH.current = target;
  }, [snap]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = currentH.current;
    velocityBuf.current = [{ y: e.clientY, t: performance.now() }];
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const now = performance.now();
      velocityBuf.current.push({ y: e.clientY, t: now });
      velocityBuf.current = velocityBuf.current.filter((p) => now - p.t < 80).slice(-5);

      const delta = dragStartY.current - e.clientY;
      const newH = Math.max(
        getSnapPx("peek"),
        Math.min(getSnapPx("full"), dragStartH.current + delta),
      );
      currentH.current = newH;
      setDrawerH(newH);
    },
    [setDrawerH],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);

      const buf = velocityBuf.current;
      if (buf.length >= 2) {
        const oldest = buf[0];
        const newest = buf[buf.length - 1];
        const dt = newest.t - oldest.t;
        if (dt > 0) {
          const velocity = (oldest.y - newest.y) / dt;
          if (Math.abs(velocity) > 0.5) {
            setSnap(velocity > 0 ? snapUp(snap) : snapDown(snap));
            return;
          }
        }
      }

      // Midpoint fallback
      const h = currentH.current;
      const peekH = getSnapPx("peek");
      const halfH = getSnapPx("half");
      const fullH = getSnapPx("full");
      if (h < (peekH + halfH) / 2) setSnap("peek");
      else if (h < (halfH + fullH) / 2) setSnap("half");
      else setSnap("full");
    },
    [snap, setSnap],
  );

  return (
    <div
      className="absolute left-0 right-0 bottom-0 flex flex-col"
      style={{
        height: drawerH,
        background: "#0f1218",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "22px 22px 0 0",
        transition: dragging.current ? "none" : "height 0.38s cubic-bezier(0.32,0.72,0,1)",
        willChange: "height",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Drag handle */}
      <div
        className="drawer-handle shrink-0 flex flex-col items-center pt-3"
        onPointerDown={onPointerDown}
      >
        <div className="w-10 h-1 rounded-full" style={{ background: "#2d3340" }} />
      </div>

      {children}
    </div>
  );
}
