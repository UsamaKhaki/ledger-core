"use client";

/**
 * Lightweight, GPU-cheap globe for low-end devices / reduced-motion / when the
 * WebGL version can't hold framerate. Pure SVG + CSS — no per-frame JS.
 */
export function FallbackGlobe({ dark = true }: { dark?: boolean }) {
  // scattered network dots (deterministic positions)
  const dots = [
    [100, 18],
    [150, 45],
    [176, 100],
    [150, 158],
    [100, 184],
    [48, 158],
    [22, 100],
    [50, 44],
    [128, 78],
    [74, 120],
    [118, 132],
    [82, 70],
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="absolute h-[58%] w-[58%] max-h-[560px] max-w-[560px] rounded-full bg-[var(--brand)]/16 blur-[110px]" />
      <svg
        viewBox="0 0 200 200"
        className="floaty w-[82%] max-w-[560px]"
        role="img"
        aria-label="Global finance network"
        style={{ opacity: dark ? 1 : 0.85 }}
      >
        <defs>
          <linearGradient id="fbStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--success)" />
          </linearGradient>
          <radialGradient id="fbFill" cx="42%" cy="38%" r="70%">
            <stop offset="0%" stopColor="rgba(129,140,248,0.14)" />
            <stop offset="100%" stopColor="rgba(6,7,13,0)" />
          </radialGradient>
        </defs>

        {/* sphere body */}
        <circle cx="100" cy="100" r="90" fill="url(#fbFill)" />
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="url(#fbStroke)"
          strokeWidth="0.8"
          opacity="0.55"
        />

        {/* meridians (longitude) */}
        {[26, 54, 82].map((rx) => (
          <ellipse
            key={`m${rx}`}
            cx="100"
            cy="100"
            rx={rx}
            ry="90"
            fill="none"
            stroke="url(#fbStroke)"
            strokeWidth="0.7"
            opacity="0.28"
          />
        ))}
        {/* latitudes */}
        {[30, 58].map((ry) => (
          <ellipse
            key={`l${ry}`}
            cx="100"
            cy="100"
            rx="90"
            ry={ry}
            fill="none"
            stroke="url(#fbStroke)"
            strokeWidth="0.7"
            opacity="0.28"
          />
        ))}
        <line
          x1="10"
          y1="100"
          x2="190"
          y2="100"
          stroke="url(#fbStroke)"
          strokeWidth="0.7"
          opacity="0.3"
        />

        {/* a couple of connection arcs */}
        <path
          d="M50 44 Q120 20 150 45"
          fill="none"
          stroke="url(#fbStroke)"
          strokeWidth="0.8"
          opacity="0.4"
        />
        <path
          d="M22 100 Q90 130 128 78"
          fill="none"
          stroke="url(#fbStroke)"
          strokeWidth="0.8"
          opacity="0.4"
        />

        {/* network nodes */}
        {dots.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={i % 4 === 0 ? 2.4 : 1.4}
            fill={i % 3 === 0 ? "var(--success)" : "var(--brand)"}
            opacity="0.9"
          />
        ))}
      </svg>
    </div>
  );
}
