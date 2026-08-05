"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "@/lib/theme";
import { FallbackGlobe } from "./FallbackGlobe";

// WebGL hero is client-only; while it loads, show the cheap fallback.
const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => <FallbackGlobe />,
});

type Tier = "pending" | "webgl" | "fallback";

/** Is this device a reasonable candidate for the WebGL globe? */
function capableForWebGL(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia;
  if (mm?.("(prefers-reduced-motion: reduce)").matches) return false;
  if (mm?.("(pointer: coarse)").matches) return false; // phones/tablets
  if (window.innerWidth < 900) return false; // small screens
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores <= 4) return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem <= 4) return false;
  return true;
}

export function HeroVisual() {
  const { mode } = useTheme();
  const [tier, setTier] = useState<Tier>("pending");

  // Decide the initial tier after mount (deferred so setState isn't sync-in-effect).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setTier(capableForWebGL() ? "webgl" : "fallback");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Runtime guard: if WebGL can't sustain framerate, drop to the fallback.
  useEffect(() => {
    if (tier !== "webgl") return;
    let raf = 0;
    let frames = 0;
    let startedAt = 0;
    const WINDOW = 2500;
    const MIN_FPS = 45;

    const loop = (t: number) => {
      if (startedAt === 0) startedAt = t;
      frames += 1;
      const elapsed = t - startedAt;
      if (elapsed < WINDOW) {
        raf = requestAnimationFrame(loop);
      } else {
        const fps = (frames / elapsed) * 1000;
        if (fps < MIN_FPS) setTier("fallback");
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tier]);

  const dark = mode === "dark";
  // remount on theme flip so the globe rebuilds with the right palette/blending
  if (tier === "webgl") return <Hero3D key={mode} dark={dark} />;
  return <FallbackGlobe dark={dark} />;
}
