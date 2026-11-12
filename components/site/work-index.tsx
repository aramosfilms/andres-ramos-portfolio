"use client"

// The index, after the filmmaker reference: a column of stills on the left
// that you scroll through, and a sticky table on the right whose highlighted
// row follows whichever still sits in the middle of the screen. Only the
// focused still mounts a <video>, so there is never more than one decoder.
import * as React from "react"
import Link from "next/link"
import type { ProjectSummary } from "@/lib/projects"
import { cn } from "@/lib/utils"
import { Rights } from "@/components/site/rights"

export function WorkIndex({ projects }: { projects: ProjectSummary[] }) {
  const [active, setActive] = React.useState(0)
  const stills = React.useRef<(HTMLAnchorElement | null)[]>([])
  const hover = React.useRef<number | undefined>(undefined)

  React.useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i))
        }
      },
      // A one-pixel band across the middle of the viewport.
      { rootMargin: "-50% 0px -50% 0px" }
    )
    for (const el of stills.current) if (el) io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section id="indice" aria-label="Índice de trabajos" className="relative scroll-mt-0 bg-black">
      {/* ── Desktop: stills column + sticky table ── */}
      <div className="hidden grid-cols-12 gap-x-6 px-6 md:grid">
        <div className="col-span-4 pt-[30vh] pb-[45vh] xl:col-span-3">
          {projects.map((p, i) => (
            <Link
              key={p.slug}
              href={`/trabajo/${p.slug}`}
              data-i={i}
              ref={(el) => {
                stills.current[i] = el
              }}
              aria-label={`${p.no} ${p.title}`}
              className="group mb-3 block"
            >
              <div
                className={cn(
                  "relative aspect-video origin-left overflow-hidden bg-neutral-900 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]",
                  i === active ? "scale-100" : "scale-[0.82]"
                )}
                style={{ backgroundColor: p.cover.color }}
              >
                <img
                  src={p.cover.thumb}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                {i === active && p.teaser ? <Teaser src={p.teaser} /> : null}
              </div>
              <div
                className={cn(
                  "label mt-1.5 flex justify-between transition-opacity duration-300",
                  i === active ? "opacity-100" : "opacity-0"
                )}
              >
                <span>{p.no}</span>
                <span>{p.kind === "film" ? "▸ Play" : "▸ Ver"}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="col-span-8 xl:col-span-9">
          <div className="sticky top-0 flex h-[100svh] flex-col py-6">
            <div className="label flex justify-between">
              <span>
                Índice
                <br />
                de trabajos
              </span>
              <span className="text-right">
                Fotografía deportiva
                <br />
                Vídeo · Edición
              </span>
            </div>

            <div className="my-auto">
              <div className="label grid grid-cols-[3rem_minmax(0,1fr)_5.5rem] lg:grid-cols-[3.5rem_minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_5.5rem] border-b border-white/30 pb-3 text-white/90">
                <span>No</span>
                <span>Título</span>
                <span className="hidden lg:block">Categoría</span>
                <span className="hidden lg:block">Lugar</span>
                <span className="text-right">Duración</span>
              </div>
              <ol className="mt-8 border-b border-white/30 pb-12">
                {projects.map((p, i) => (
                  <li key={p.slug}>
                    <Link
                      href={`/trabajo/${p.slug}`}
                      onMouseEnter={() => {
                        // Resting on a row brings its still to the middle;
                        // sweeping across rows does not.
                        window.clearTimeout(hover.current)
                        hover.current = window.setTimeout(() => {
                          const el = stills.current[i]
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
                        }, 180)
                      }}
                      onMouseLeave={() => window.clearTimeout(hover.current)}
                      className={cn(
                        "grid grid-cols-[3rem_minmax(0,1fr)_5.5rem] lg:grid-cols-[3.5rem_minmax(0,2.2fr)_minmax(0,1.5fr)_minmax(0,1fr)_5.5rem] py-[3px] text-[15px] uppercase tabular-nums leading-tight transition-colors duration-200 hover:text-white",
                        i === active ? "text-white" : "text-white/45"
                      )}
                    >
                      <span>{p.no}</span>
                      <span className="truncate pr-4">{p.title}</span>
                      <span className="hidden truncate pr-4 lg:block">{p.category}</span>
                      <span className="hidden truncate pr-4 lg:block">{p.place}</span>
                      <span className="text-right">{p.length}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            <div className="label flex justify-between">
              <span>Valencia · Panamá</span>
              <Rights />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile: a plain list of stills with their row underneath ── */}
      <div className="px-4 pt-16 pb-10 md:hidden">
        <div className="label mb-6 flex justify-between border-b border-white/30 pb-3">
          <span>Índice</span>
          <span>{projects.length} trabajos</span>
        </div>
        <ol className="space-y-8">
          {projects.map((p) => (
            <li key={p.slug}>
              <Link href={`/trabajo/${p.slug}`} className="block">
                <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: p.cover.color }}>
                  <img
                    src={p.cover.thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <div className="mt-2 grid grid-cols-[2.5rem_1fr_auto] text-[15px] uppercase leading-tight tabular-nums">
                  <span className="text-white/55">{p.no}</span>
                  <span>{p.title}</span>
                  <span className="text-white/55">{p.length}</span>
                </div>
                <div className="label ml-10 mt-1 text-white/55">
                  {p.category} · {p.place}
                </div>
              </Link>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex justify-end text-white/70">
          <Rights />
        </div>
      </div>
    </section>
  )
}

function Teaser({ src }: { src: string }) {
  const ref = React.useRef<HTMLVideoElement>(null)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const v = ref.current
    if (!v) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    v.play().catch(() => {})
  }, [])

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="auto"
      onPlaying={() => setReady(true)}
      className={cn(
        "absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
        ready ? "opacity-100" : "opacity-0"
      )}
    />
  )
}
