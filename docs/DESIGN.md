# Design System — "Gravity → Weightless"

Debt has gravity; Ledger makes you weightless. The site is a single dark,
cinematic theme. Everything is driven by CSS variables + utility classes in
`src/app/globals.css`, so re-theming means editing tokens, not components.

## Tokens (`:root` in `globals.css`)

| Token | Role |
| --- | --- |
| `--background` `#06070d` | deep-space base |
| `--surface` | translucent glass panel fill |
| `--surface-solid` `#0e0f18` | opaque panels (modals, sticky bars, chart tooltip) |
| `--foreground` / `--muted` | text / secondary text |
| `--border` / `--border-strong` | hairlines |
| `--brand` `#6366f1` | indigo — interactive |
| `--success` `#34d399` | mint — freedom/progress |
| `--danger` `#fb7185` | rose |
| `--accent` `#fbbf24` | amber — interest |

Atmosphere lives on a **fixed** `body::before` layer (indigo/mint radial glows) —
never `background-attachment: fixed` (that repaints every scroll frame).

## Type

- **Display:** Geist via `--font-display` (`.font-display`, tight tracking) — headlines, big figures.
- **Body:** Geist.
- **Mono:** Geist Mono (`.font-mono-num`, tabular) — all currency amounts.
- Gradient headline accent: `.text-gradient` (white → lilac → mint).

## Utilities

`.glass` (frosted panel) · `.chip` (frosted pill) · `.btn-white` (primary CTA) ·
`.kicker` (mono eyebrow) · `.card-hover` (lift) · `.glow-brand` (featured glow) ·
`.grid-overlay` (faint grid texture).

## Motion

- **Load:** `.hero-in` — staggered rise + de-blur (hero).
- **Scroll:** `.rise` (CSS scroll-timeline) and `Reveal.tsx` (IntersectionObserver)
  cascade section content in with the same rise + de-blur.
- **Ambient:** `.floaty`, `.pulse-dot`, `.marquee` (testimonials).
- All motion respects `prefers-reduced-motion`.

## Radius scale (keep consistent)

`rounded-full` pills/chips/toggles · `rounded-xl` inputs/buttons/inner tiles ·
`rounded-2xl` cards/modals · `rounded-3xl` the single hero CTA panel.

## Rules of thumb

- New colors → add a token, don't hardcode hex (decorative WebGL/gradient stops excepted).
- New money figure → `useMoney().format(...)` in `.font-mono-num`.
- New section heading → `.font-display`, size `text-4xl sm:text-5xl`, optional
  `.text-gradient` accent word.
- Keep the boldness in one place per view; everything else stays quiet.
