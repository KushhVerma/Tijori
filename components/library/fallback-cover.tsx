/**
 * Auto-generated cover for items with no real preview image — a colourful
 * grain-textured gradient with the page's name centered in Satoshi, instead
 * of a bare icon on a flat muted box. Purely CSS/SVG (no image assets), so
 * it scales to any card size and needs nothing stored or uploaded.
 */

const GRADIENTS = [
  // Deep indigo → violet → pale lilac
  "linear-gradient(135deg, #05030f 0%, #1a1370 38%, #6d3ce0 68%, #efe3ff 100%)",
  // Near-black teal → soft mist
  "linear-gradient(135deg, #04070a 0%, #0d2b33 38%, #4f8f96 70%, #eef4f2 100%)",
  // Magenta edge → dark rose core → warm coral
  "radial-gradient(circle at 60% 55%, #1a0508 0%, #7a0f1d 35%, #e0223f 65%, #ff8fa8 85%, #ffe1ea 100%)",
] as const

function hashToIndex(id: string, count: number) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash % count
}

export function FallbackCover({
  id,
  label,
  className,
}: {
  id: string
  label: string | null
  /** Sizing is the caller's responsibility (e.g. `aspect-[4/5] w-full` for a
   * grid card, `h-[55vh] w-full` for the detail view) — this component only
   * fills whatever box it's given. */
  className?: string
}) {
  const gradient = GRADIENTS[hashToIndex(id, GRADIENTS.length)]
  const filterId = `tijori-grain-${id}`

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{ backgroundImage: gradient }}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.3] mix-blend-overlay" aria-hidden>
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${filterId})`} />
      </svg>

      {label && (
        <span
          className="relative line-clamp-4 max-w-[85%] px-4 text-center text-base font-medium text-white/95"
          style={{
            fontFamily: "'Satoshi', var(--font-sans)",
            textShadow: "0 2px 16px rgba(0,0,0,0.45)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
