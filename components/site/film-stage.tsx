"use client"

// The film page's main frame, after the director reference: the picture fills
// the frame and the slate (number, title, timecode, synopsis, credits) is set
// straight on top of it. While the film plays the slate steps back and only
// returns when the pointer moves.
import * as React from "react"
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react"
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
  duration: number
  video: string
  poster: string
  posterSrcSet: string
  color: string
}

const tc = (s: number) => {
  const t = Math.max(0, Math.floor(s))
  return `${String(Math.floor(t / 60)).padStart(2, "0")}' ${String(t % 60).padStart(2, "0")}''`
}

export function FilmStage(p: Props) {
  const frame = React.useRef<HTMLDivElement>(null)
  const video = React.useRef<HTMLVideoElement>(null)
  const bar = React.useRef<HTMLDivElement>(null)
  const fill = React.useRef<HTMLDivElement>(null)
  const clock = React.useRef<HTMLSpanElement>(null)
  const idle = React.useRef<number | undefined>(undefined)

  const [started, setStarted] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  const [muted, setMuted] = React.useState(false)
  const [credits, setCredits] = React.useState(true)
  const [quiet, setQuiet] = React.useState(false)

  // Progress and clock are written straight to the DOM from one rAF loop, so
  // playback never re-renders React sixty times a second.
  React.useEffect(() => {
    if (!playing) return
    let raf = 0
    const tick = () => {
      const v = video.current
      if (v) {
        const d = v.duration || p.duration
        if (fill.current) fill.current.style.transform = `scaleX(${v.currentTime / d})`
        if (clock.current) clock.current.textContent = tc(v.currentTime)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, p.duration])

  const wake = React.useCallback(() => {
    setQuiet(false)
    window.clearTimeout(idle.current)
    idle.current = window.setTimeout(() => setQuiet(true), 2200)
  }, [])

  React.useEffect(() => () => window.clearTimeout(idle.current), [])

  const toggle = () => {
    const v = video.current
    if (!v) return
    if (v.paused) {
      setStarted(true)
      v.play().catch(() => {})
      wake()
    } else v.pause()
  }

  const seek = (clientX: number) => {
    const v = video.current
    const b = bar.current
    if (!v || !b) return
    const r = b.getBoundingClientRect()
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    v.currentTime = f * (v.duration || p.duration)
    if (fill.current) fill.current.style.transform = `scaleX(${f})`
    if (clock.current) clock.current.textContent = tc(v.currentTime)
  }

  const slateHidden = playing && quiet

  return (
    <div>
      <div
        ref={frame}
        className="group relative mx-auto aspect-video max-h-[calc(100svh-4.5rem)] w-full overflow-hidden bg-black"
        onPointerMove={wake}
      >
        <img
          src={p.poster}
          srcSet={p.posterSrcSet}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          decoding="async"
          className={cn(
            "absolute inset-0 h-full w-full object-contain transition-opacity duration-700",
            started ? "opacity-0" : "opacity-100"
          )}
        />
        <video
          ref={video}
          src={p.video}
          preload="metadata"
          playsInline
          muted={muted}
          onPlay={() => setPlaying(true)}
          onPause={() => {
            setPlaying(false)
            setQuiet(false)
          }}
          onEnded={() => {
            setPlaying(false)
            setStarted(false)
          }}
          onClick={toggle}
          className={cn(
            "absolute inset-0 h-full w-full cursor-pointer object-contain",
            // Until play, the chosen poster shows instead of the first frame.
            started ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Darken the top so the slate reads on any frame. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/65 via-black/25 to-transparent transition-opacity duration-500",
            slateHidden ? "opacity-0" : "opacity-100"
          )}
        />

        {/* ── Slate (desktop overlay) ── */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 hidden grid-cols-12 gap-x-6 px-6 pt-16 transition-opacity duration-500 md:grid",
            slateHidden ? "opacity-0" : "opacity-100"
          )}
        >
          <span className="label col-span-1">{p.no}</span>
          <span className="label col-span-3">
            {p.title}
            <br />
            {p.category}
          </span>
          <span className="label col-span-3 tabular-nums">
            <span ref={clock}>{tc(0)}</span> / {tc(p.duration)}
          </span>
          <p className="label col-span-4 normal-case! text-[13px] leading-snug">{p.description}</p>
          <span className="label col-span-1 text-right">{p.year ?? p.place}</span>

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

        <Rights
          className={cn(
            "pointer-events-none absolute right-4 z-10 text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,.6)] transition-[bottom] duration-300 md:right-6",
            started ? "bottom-10" : "bottom-3"
          )}
        />

        {/* ── Big play mark until the film starts ── */}
        {!started ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={`Reproducir ${p.title}`}
            className="absolute inset-0 flex items-end justify-start p-4 md:items-center md:justify-center md:p-0"
          >
            <span className="label flex items-center gap-2 bg-white px-3 py-2 text-black transition-transform duration-300 hover:scale-105">
              <Play className="size-3 fill-current" aria-hidden /> Play · {tc(p.duration)}
            </span>
          </button>
        ) : null}

        {/* ── Transport ── */}
        {started ? (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 px-4 pb-3 transition-opacity duration-500 md:px-6",
              slateHidden ? "opacity-0" : "opacity-100"
            )}
          >
            <div className="label flex items-center gap-5">
              <button type="button" onClick={toggle} aria-label={playing ? "Pausa" : "Reproducir"} className="hover:text-white/60">
                {playing ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
              </button>
              <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Activar sonido" : "Silenciar"} className="hover:text-white/60">
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <div
                ref={bar}
                role="slider"
                aria-label="Posición"
                aria-valuemin={0}
                aria-valuemax={Math.round(p.duration)}
                aria-valuenow={0}
                aria-valuetext="Usa las flechas para avanzar o retroceder 5 segundos"
                tabIndex={0}
                className="relative h-4 flex-1 cursor-pointer"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId)
                  seek(e.clientX)
                }}
                onPointerMove={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) seek(e.clientX)
                }}
                onKeyDown={(e) => {
                  const v = video.current
                  if (!v) return
                  if (e.key === "ArrowRight") v.currentTime += 5
                  if (e.key === "ArrowLeft") v.currentTime -= 5
                }}
              >
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/30" />
                <div ref={fill} className="absolute inset-x-0 top-1/2 h-px origin-left scale-x-0 bg-white" />
              </div>
              <span className="md:hidden">{tc(p.duration)}</span>
              <button
                type="button"
                aria-label="Pantalla completa"
                className="hover:text-white/60"
                onClick={() => {
                  const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
                  if (!v) return
                  if (frame.current?.requestFullscreen) frame.current.requestFullscreen().catch(() => {})
                  else v.webkitEnterFullscreen?.()
                }}
              >
                <Maximize className="size-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Slate (mobile, under the frame) ── */}
      <div className="grid grid-cols-[2.5rem_1fr] gap-y-6 px-4 pt-5 md:hidden">
        <span className="label">{p.no}</span>
        <span className="label">
          {p.title}
          <br />
          {p.category} · {p.place}
        </span>
        <span />
        <p className="text-[15px] leading-snug text-white/80">{p.description}</p>
        <span />
        <dl className="label grid grid-cols-2 gap-y-0.5">
          {p.credits.map(([k, v]) => (
            <React.Fragment key={k}>
              <dt className="text-white/60">{k}</dt>
              <dd>{v}</dd>
            </React.Fragment>
          ))}
        </dl>
      </div>
    </div>
  )
}
