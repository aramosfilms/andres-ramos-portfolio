"use client"

// Photo-set page: the cover fills the frame with the slate set on it, then the
// set runs below in an editorial rhythm (one wide, two side by side). Any
// frame opens a lightbox that preloads its neighbours.
import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { photoSrc, photoSrcSet, type Photo } from "@/lib/projects"
import { cn } from "@/lib/utils"
import { Rights } from "@/components/site/rights"

type Props = {
  no: string
  title: string
  category: string
  place: string
  year?: string
  description: string
  credits: [string, string][]
  photos: Photo[]
  coverId: string
}

export function PhotoStage(p: Props) {
  const [credits, setCredits] = React.useState(true)
  const [open, setOpen] = React.useState<number | null>(null)
  const cover = p.photos.find((x) => x.id === p.coverId) ?? p.photos[0]!
  const rest = p.photos.filter((x) => x.id !== cover.id)

  return (
    <div>
      <div
        className="relative h-[62svh] w-full overflow-hidden md:h-[calc(100svh-4.5rem)]"
        style={{ backgroundColor: cover.color }}
      >
        <button type="button" onClick={() => setOpen(p.photos.indexOf(cover))} className="absolute inset-0 cursor-zoom-in" aria-label={`Ampliar: ${cover.alt}`}>
          <img
            src={photoSrc(cover.id, 1600)}
            srcSet={photoSrcSet(cover)}
            sizes="100vw"
            alt={cover.alt}
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </button>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/65 via-black/25 to-transparent" />
        <Rights className="pointer-events-none absolute right-4 bottom-3 text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,.6)] md:right-6" />

        <div className="pointer-events-none absolute inset-x-0 top-0 hidden grid-cols-12 gap-x-6 px-6 pt-16 md:grid">
          <span className="label col-span-1">{p.no}</span>
          <span className="label col-span-3">
            {p.title}
            <br />
            {p.category}
          </span>
          <span className="label col-span-3">
            {p.photos.length} fotografías
            <br />
            {p.place}
          </span>
          <p className="label col-span-4 normal-case! text-[13px] leading-snug">{p.description}</p>
          <span className="label col-span-1 text-right">{p.year}</span>

          <button
            type="button"
            onClick={() => setCredits((c) => !c)}
            className="label pointer-events-auto col-span-4 col-start-1 mt-12 text-left hover:text-white/60"
          >
            Créditos
            <br />
            {credits ? "On" : "Off"}
          </button>
          <dl
            className={cn(
              "label col-span-6 col-start-8 mt-12 grid grid-cols-2 gap-x-6 gap-y-0.5 transition-opacity duration-300",
              credits ? "opacity-100" : "opacity-0"
            )}
          >
            {p.credits.map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-white/70">{k}</dt>
                <dd>{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      </div>

      {/* Mobile slate */}
      <div className="grid grid-cols-[2.5rem_1fr] gap-y-6 px-4 pt-5 md:hidden">
        <span className="label">{p.no}</span>
        <span className="label">
          {p.title}
          <br />
          {p.category} · {p.place} · {p.photos.length} fotos
        </span>
        <span />
        <p className="text-[15px] leading-snug text-white/80">{p.description}</p>
      </div>

      {/* ── The set ── */}
      <div className="mt-10 grid grid-cols-2 gap-2 px-2 md:mt-2 md:grid-cols-12 md:gap-2 md:px-0">
        {rest.map((ph, i) => {
          // Rhythm: wide, pair, pair, wide, pair, pair…
          const wide = i % 5 === 0
          const idx = p.photos.indexOf(ph)
          return (
            <figure
              key={ph.id}
              className={cn("relative", wide ? "col-span-2 md:col-span-12" : "col-span-1 md:col-span-6")}
            >
              <button
                type="button"
                onClick={() => setOpen(idx)}
                className="block w-full cursor-zoom-in overflow-hidden"
                style={{ backgroundColor: ph.color, aspectRatio: `${ph.w} / ${ph.h}` }}
                aria-label={`Ampliar: ${ph.alt}`}
              >
                <img
                  src={photoSrc(ph.id, wide ? 1600 : 960)}
                  srcSet={photoSrcSet(ph)}
                  sizes={wide ? "100vw" : "(min-width: 768px) 50vw, 50vw"}
                  alt={ph.alt}
                  width={ph.w}
                  height={ph.h}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] hover:scale-[1.015]"
                />
              </button>
              <figcaption className="label mt-1.5 mb-4 px-2 text-white/55 md:px-6">
                {String(idx + 1).padStart(2, "0")}
              </figcaption>
            </figure>
          )
        })}
      </div>

      <Lightbox photos={p.photos} index={open} onIndex={setOpen} />
    </div>
  )
}

function Lightbox({
  photos,
  index,
  onIndex,
}: {
  photos: Photo[]
  index: number | null
  onIndex: (i: number | null) => void
}) {
  const n = photos.length
  const go = React.useCallback(
    (d: number) => index !== null && onIndex((index + d + n) % n),
    [index, n, onIndex]
  )

  React.useEffect(() => {
    if (index === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null)
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    // Neighbours at full size, so arrowing through never waits.
    for (const d of [1, -1]) {
      const ph = photos[(index + d + n) % n]!
      const img = new Image()
      img.src = photoSrc(ph.id, ph.widths.at(-1)!)
    }
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [index, go, onIndex, photos, n])

  const ph = index !== null ? photos[index] : null
  const touch = React.useRef<number | null>(null)

  return (
    <AnimatePresence>
      {ph && index !== null ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={ph.alt}
          className="fixed inset-0 z-50 flex flex-col bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onTouchStart={(e) => (touch.current = e.touches[0]!.clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null) return
            const dx = e.changedTouches[0]!.clientX - touch.current
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
            touch.current = null
          }}
        >
          <div className="label flex items-center justify-between px-4 py-4 md:px-6">
            <span className="tabular-nums">
              {String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
            </span>
            <button type="button" onClick={() => onIndex(null)} className="flex items-center gap-1 hover:text-white/60" autoFocus>
              Cerrar <X className="size-3.5" />
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <img
              key={ph.id}
              src={photoSrc(ph.id, ph.widths.at(-1)!)}
              srcSet={photoSrcSet(ph)}
              sizes="100vw"
              alt={ph.alt}
              decoding="async"
              className="absolute inset-0 h-full w-full object-contain px-2 md:px-16"
            />
            <button type="button" onClick={() => go(-1)} aria-label="Anterior" className="absolute inset-y-0 left-0 hidden w-1/3 cursor-w-resize items-center justify-start pl-4 md:flex">
              <ChevronLeft className="size-6 opacity-70" />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Siguiente" className="absolute inset-y-0 right-0 hidden w-1/3 cursor-e-resize items-center justify-end pr-4 md:flex">
              <ChevronRight className="size-6 opacity-70" />
            </button>
          </div>
          <div className="label flex items-center justify-between gap-4 px-4 py-4 md:px-6">
            <div className="flex gap-6">
              <button type="button" onClick={() => go(-1)} className="hover:text-white/60">Prev</button>
              <button type="button" onClick={() => go(1)} className="hover:text-white/60">Next</button>
            </div>
            <Rights className="text-white/70" />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
