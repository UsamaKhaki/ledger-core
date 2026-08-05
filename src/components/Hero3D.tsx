"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const R = 2; // globe radius

// deterministic pseudo-random (lint-safe, no Math.random in render)
function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
function pointOnSphere(seedA: number, seedB: number, radius = R) {
  const theta = rand(seedA) * Math.PI * 2;
  const phi = Math.acos(2 * rand(seedB) - 1);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}
function smoothstep(e0: number, e1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

// A cross-globe route between two points, bulging outward like a flight path.
function makeRoute(seed: number) {
  const a = pointOnSphere(seed * 1.13 + 1, seed * 1.71 + 2);
  const an = a.clone().normalize();
  const ref = new THREE.Vector3(
    rand(seed * 2.3 + 5) * 2 - 1,
    rand(seed * 2.9 + 6) * 2 - 1,
    rand(seed * 3.7 + 7) * 2 - 1,
  ).normalize();
  const axis = new THREE.Vector3().crossVectors(an, ref).normalize();
  const ang = 0.7 + rand(seed * 4.1 + 2) * 1.7; // ~40°–137°
  const b = a.clone().applyAxisAngle(axis, ang);
  const lift = 1 + 0.13 * ang;
  const mid = an
    .clone()
    .add(b.clone().normalize())
    .normalize()
    .multiplyScalar(R * lift);
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

const PALETTE = {
  dark: {
    a: "#818cf8",
    b: "#34d399",
    c: "#c7d2fe",
    pulse: "#eafff6",
    blending: THREE.AdditiveBlending,
    sphereOpacity: 0.85,
    sphereSize: 0.05,
    bg: [0, 0, 0] as const, // fade toward black (invisible under additive)
  },
  light: {
    a: "#4f46e5",
    b: "#0d9488",
    c: "#6366f1",
    pulse: "#4338ca",
    blending: THREE.NormalBlending,
    sphereOpacity: 0.95,
    sphereSize: 0.045,
    bg: [0.98, 0.98, 0.985] as const, // fade toward the light background
  },
};

const CONN = 9; // simultaneous live routes
const SEG = 48; // points per route
const TAIL = 12; // comet tail length (in segments)

// soft round sprite so points are dots, not squares
let _dot: THREE.CanvasTexture | undefined;
function dotTexture(): THREE.CanvasTexture {
  if (_dot) return _dot;
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.65)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  _dot = new THREE.CanvasTexture(c);
  return _dot;
}

function GlobeNetwork({ dark }: { dark: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pulses = useRef<THREE.Points>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const dot = useMemo(() => dotTexture(), []);

  // canvas ignores pointer events (so the UI above it stays clickable) — track
  // the cursor ourselves for the subtle parallax tilt.
  const pointerY = useRef(0);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerY.current = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const P = dark ? PALETTE.dark : PALETTE.light;
  const INDIGO = useMemo(() => new THREE.Color(P.a), [P.a]);
  const MINT = useMemo(() => new THREE.Color(P.b), [P.b]);
  const LILAC = useMemo(() => new THREE.Color(P.c), [P.c]);
  const PULSE = useMemo(() => new THREE.Color(P.pulse), [P.pulse]);

  // background "stars"
  const sphere = useMemo(() => {
    const N = 1700;
    const positions = new Float32Array(N * 3);
    const colors = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * 2.399963229;
      const j = 0.985 + Math.sin(i * 12.9898) * 0.012;
      positions[i * 3] = Math.cos(theta) * r * R * j;
      positions[i * 3 + 1] = y * R * j;
      positions[i * 3 + 2] = Math.sin(theta) * r * R * j;
      const t = (y + 1) / 2;
      const c =
        t < 0.5
          ? INDIGO.clone().lerp(LILAC, t * 2)
          : LILAC.clone().lerp(MINT, (t - 0.5) * 2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [INDIGO, MINT, LILAC]);

  // stable geometry buffers for the live routes + pulses
  const conns = useMemo(
    () =>
      Array.from({ length: CONN }, () => ({
        pos: new Float32Array((SEG + 1) * 3),
        col: new Float32Array((SEG + 1) * 3),
      })),
    [],
  );
  const pulseInit = useMemo(() => new Float32Array(CONN * 3), []);
  const pulseColInit = useMemo(() => new Float32Array(CONN * 3), []);
  const geomRefs = useRef<(THREE.BufferGeometry | null)[]>([]);

  // per-route animation state (mutable ref — updated in the frame loop)
  const routes = useRef(
    Array.from({ length: CONN }, (_, i) => ({
      seed: i * 97 + 7,
      curve: makeRoute(i * 97 + 7),
      birth: -999,
      duration: 2,
      r: 0,
      g: 0,
      b: 0,
    })),
  );

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const g = group.current;
    if (g) {
      g.rotation.y = t * 0.05;
      g.rotation.x += (pointerY.current * 0.18 - g.rotation.x) * 0.03;
    }

    const pts = pulses.current;
    const pPos = pts?.geometry.attributes.position?.array as
      | Float32Array
      | undefined;
    const pCol = pts?.geometry.attributes.color?.array as
      | Float32Array
      | undefined;

    // write a colour that fades to invisibility for the active blend mode
    const writeColor = (
      arr: Float32Array,
      off: number,
      r: number,
      g2: number,
      b: number,
      inten: number,
    ) => {
      if (dark) {
        arr[off] = r * inten;
        arr[off + 1] = g2 * inten;
        arr[off + 2] = b * inten;
      } else {
        const [wr, wg, wb] = P.bg;
        arr[off] = wr * (1 - inten) + r * inten;
        arr[off + 1] = wg * (1 - inten) + g2 * inten;
        arr[off + 2] = wb * (1 - inten) + b * inten;
      }
    };

    for (let i = 0; i < CONN; i++) {
      const st = routes.current[i];
      const geom = geomRefs.current[i];
      if (!geom || !geom.attributes.position) continue;

      // respawn a finished route somewhere new (with a short dark gap)
      if (t - st.birth > st.duration + 0.5) {
        st.seed += 131;
        st.curve = makeRoute(st.seed);
        st.birth = t;
        st.duration = 1.7 + rand(st.seed * 5.3) * 1.9;
        const bc = i % 3 === 0 ? MINT : i % 3 === 1 ? INDIGO : LILAC;
        st.r = bc.r;
        st.g = bc.g;
        st.b = bc.b;
        const posArr = geom.attributes.position.array as Float32Array;
        for (let k = 0; k <= SEG; k++) {
          st.curve.getPoint(k / SEG, tmp);
          posArr[k * 3] = tmp.x;
          posArr[k * 3 + 1] = tmp.y;
          posArr[k * 3 + 2] = tmp.z;
        }
        geom.attributes.position.needsUpdate = true;
      }

      const p = Math.min(1, Math.max(0, (t - st.birth) / st.duration));
      const headF = p * SEG;
      const life = smoothstep(0, 0.12, p) * (1 - smoothstep(0.72, 1, p));

      const colArr = geom.attributes.color.array as Float32Array;
      for (let k = 0; k <= SEG; k++) {
        const d = headF - k;
        const inten = (d >= 0 && d <= TAIL ? 1 - d / TAIL : 0) * life;
        writeColor(colArr, k * 3, st.r, st.g, st.b, inten);
      }
      geom.attributes.color.needsUpdate = true;

      // the bright "payment" travelling at the head
      if (pPos && pCol) {
        st.curve.getPoint(p, tmp);
        pPos[i * 3] = tmp.x;
        pPos[i * 3 + 1] = tmp.y;
        pPos[i * 3 + 2] = tmp.z;
        writeColor(pCol, i * 3, PULSE.r, PULSE.g, PULSE.b, p < 1 ? life : 0);
      }
    }

    if (pts) {
      pts.geometry.attributes.position.needsUpdate = true;
      pts.geometry.attributes.color.needsUpdate = true;
    }
  });

  return (
    <group ref={group}>
      {/* background particle sphere */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sphere.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[sphere.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={P.sphereSize}
          map={dot}
          alphaMap={dot}
          vertexColors
          transparent
          opacity={P.sphereOpacity}
          sizeAttenuation
          depthWrite={false}
          blending={P.blending}
        />
      </points>

      {/* live routes (comet-drawn, fading) */}
      {conns.map((c, i) => (
        <line key={i}>
          <bufferGeometry
            ref={(el) => {
              geomRefs.current[i] = el as unknown as THREE.BufferGeometry | null;
            }}
          >
            <bufferAttribute attach="attributes-position" args={[c.pos, 3]} />
            <bufferAttribute attach="attributes-color" args={[c.col, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={1}
            blending={P.blending}
            depthWrite={false}
          />
        </line>
      ))}

      {/* travelling payment pulses */}
      <points ref={pulses}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulseInit, 3]} />
          <bufferAttribute attach="attributes-color" args={[pulseColInit, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.14}
          map={dot}
          alphaMap={dot}
          vertexColors
          transparent
          opacity={1}
          sizeAttenuation
          depthWrite={false}
          blending={P.blending}
        />
      </points>
    </group>
  );
}

export default function Hero3D({ dark = true }: { dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="h-full w-full">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={1}
        camera={{ position: [0, 0, 5.6], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent", pointerEvents: "none" }}
      >
        <GlobeNetwork dark={dark} />
      </Canvas>
    </div>
  );
}
