"use client"

// A full-bleed editorial hero driven by a filmstrip.
//
// Every card shares one top edge. The focused card unfurls to full height while
// its neighbours stay clipped to half, so the strip reads as a row of cropped
// heads with one complete portrait standing in the middle of it. Changing the
// focus re-grades the whole background to that image.
//
// Geometry is measured, never hard-coded: one ResizeObserver reads the stage and
// every size below is a ratio of it, so the same component is pixel-identical in
// a 600px preview box and on a 4K display.
import * as React from "react"
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion"

import { cn } from "@/lib/utils"

export interface HeroCarouselItem {
  /** Stable key; falls back to the index. @default undefined */
  id?: string | number
  /** Headline for the active slide. Newlines become separate reveal lines. */
  title: string
  /** Image URL, used as the graded background (and the card when `thumb` is unset). */
  image: string
  /** Smaller image for the strip card. Falls back to `image`. @default undefined */
  thumb?: string
  /** Byline printed beside the headline, e.g. "BY AURELIA STUDIO." @default undefined */
  credit?: string
  /** Right-aligned facts, e.g. ["SAT NOV 15", "5-10 PM", "MIAMI"]. @default undefined */
  meta?: string[]
  /**
   * CSS colour the background is graded to. The photo keeps its luminance and
   * takes this hue, which is what makes the backdrop swing on every change.
   * @default "#8a8a8a"
   */
  accent?: string
}

export interface HeroCarouselProps {
  /** Slides, in strip order. */
  items: HeroCarouselItem[]
  /** Focused slide when controlled. Leave unset for internal state. @default undefined */
  index?: number
  /** Focused slide on mount when uncontrolled. @default 0 */
  defaultIndex?: number
  /** Fires on every focus change, from any input. @default undefined */
  onIndexChange?: (index: number) => void
  /** Fires when the already-focused card is clicked, or Enter is pressed. @default undefined */
  onActivate?: (index: number) => void
  /** Small caption under the focused card, e.g. number and "PLAY". @default undefined */
  caption?: (item: HeroCarouselItem, index: number) => React.ReactNode
  /** Wordmark in the middle of the top bar. @default undefined */
  brand?: React.ReactNode
  /** Renders the "Back" control when provided. @default undefined */
  onBack?: () => void
  /** Renders the "Menu" control when provided. @default undefined */
  onMenu?: () => void
  /** Advance on a timer. Pauses on hover, drag and focus. @default false */
  autoplay?: boolean
  /** Milliseconds between autoplay steps. @default 4000 */
  autoplayDelay?: number
  /**
   * How hard the background is re-hued to each slide's accent.
   * "strong" is the original full grade, "subtle" keeps the photo's own
   * colours with a light cast, "none" only darkens. @default "strong"
   */
  tint?: "strong" | "subtle" | "none"
  /**
   * Which wheel axis steps the strip. "x" leaves vertical scrolling to the
   * page, which is what a hero above more content wants. @default "both"
   */
  wheelAxis?: "both" | "x"
  /** Accessible name of the carousel. @default "Featured looks" */
  label?: string
  /** Extra classes for the stage. @default undefined */
  className?: string
}

/* Ratios lifted from the reference layout, all relative to the stage box. */
const CARD_H = 0.264 // active card height ÷ stage height
const CARD_AR = 0.75 // active card is 3:4
const GAP = 0.038 // gap ÷ card width
const STRIP_TOP = 0.5 // strip's shared top edge, down the stage
const TITLE = 0.067 // headline cap size ÷ stage height
const LABEL = 0.0103 // small label ÷ stage height
const PAD = 0.017 // page gutter ÷ stage width
const RAIL = 0.2 // progress rail width ÷ stage width

/** Wheel distance that commits to a step, and the lockout after one. */
const WHEEL_THRESHOLD = 60
const WHEEL_COOLDOWN = 420

/* Film grain, as a self-contained SVG so the component carries no assets. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const TINTS = {
  strong: { color: 1, multiply: 0.55, shade: 0 },
  subtle: { color: 0.32, multiply: 0.22, shade: 0.28 },
  none: { color: 0, multiply: 0, shade: 0.35 },
} as const

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))

export function HeroCarousel({
  items,
  index: controlled,
  defaultIndex = 0,
  onIndexChange,
  onActivate,
  caption,
  brand,
  onBack,
  onMenu,
  autoplay = false,
  autoplayDelay = 4000,
  tint = "strong",
  wheelAxis = "both",
  label: ariaLabel = "Featured looks",
  className,
}: HeroCarouselProps) {
  const stageRef = React.useRef<HTMLDivElement>(null)
  const [box, setBox] = React.useState({ w: 0, h: 0 })
  const [uncontrolled, setUncontrolled] = React.useState(defaultIndex)
  const [dragging, setDragging] = React.useState(false)
  const [paused, setPaused] = React.useState(false)
  // A drag that ends on a card also fires its click; this swallows that one.
  const justDragged = React.useRef(false)
  const reduced = useReducedMotion()

  const last = items.length - 1
  const index = clamp(controlled ?? uncontrolled, 0, Math.max(0, last))

  const go = React.useCallback(
    (next: number) => {
      const clamped = clamp(next, 0, Math.max(0, last))
      if (controlled === undefined) setUncontrolled(clamped)
      if (clamped !== index) onIndexChange?.(clamped)
    },
    [controlled, index, last, onIndexChange]
  )

  // One observer feeds every measurement below.
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let frame = 0
    const read = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() =>
        setBox({ w: stage.clientWidth, h: stage.clientHeight })
      )
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(stage)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [])

  // Warm the neighbours' full-size backgrounds so a change never flashes.
  React.useEffect(() => {
    for (const i of [index - 1, index + 1, index + 2]) {
      const item = items[i]
      if (!item) continue
      const img = new Image()
      img.decoding = "async"
      img.src = item.image
    }
  }, [index, items])

  const fullH = clamp(box.h * CARD_H, 96, 360)
  const halfH = fullH / 2
  const cardW = fullH * CARD_AR
  const gap = Math.max(4, Math.round(cardW * GAP))
  const step = cardW + gap
  const pad = Math.max(16, Math.round(box.w * PAD))
  const label = Math.max(10, Math.round(box.h * LABEL))

  // Centre the focused card: the track slides, the card never moves itself.
  const xFor = React.useCallback(
    (i: number) => box.w / 2 - (i * step + cardW / 2),
    [box.w, step, cardW]
  )
  const x = useMotionValue(0)
  const target = xFor(index)

  const swing = reduced
    ? { duration: 0 }
    : { duration: 0.7, ease: "easeOut" as const }
  const spring = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 34, mass: 0.9 }

  // The track is driven by a motion value rather than an `animate` prop so a
  // drag that starts mid-spring reads the real position, not where the spring
  // was headed - otherwise the release snaps a card off.
  const placed = React.useRef(false)
  React.useEffect(() => {
    if (dragging || box.w === 0) return
    // First real measurement: jump, don't fly in from the left edge.
    if (!placed.current) {
      placed.current = true
      x.set(target)
      return
    }
    const run = animate(x, target, spring)
    return () => run.stop()
    // `spring` is a literal, so `reduced` (all it derives from) stands in for it.
  }, [target, dragging, reduced, x, box.w]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wheel and trackpad.
  React.useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let acc = 0
    let until = 0

    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY)
      // With wheelAxis "x" a vertical gesture always belongs to the page.
      if (wheelAxis === "x" && !horizontal) return
      // Trackpads report the dominant axis; take whichever is stronger.
      const delta = horizontal ? e.deltaX : e.deltaY
      // Scroll chaining: once the strip is against an end, hand the gesture
      // back to the page. Without this a full-height carousel is a scroll trap
      // with no way past it.
      const stuck = (delta > 0 && index === last) || (delta < 0 && index === 0)
      if (stuck) {
        acc = 0
        return
      }
      e.preventDefault()
      const now = e.timeStamp
      if (now < until) return
      acc += delta
      if (Math.abs(acc) < WHEEL_THRESHOLD) return
      go(index + Math.sign(acc))
      acc = 0
      until = now + WHEEL_COOLDOWN
    }

    stage.addEventListener("wheel", onWheel, { passive: false })
    return () => stage.removeEventListener("wheel", onWheel)
  }, [go, index, last, wheelAxis])

  React.useEffect(() => {
    if (!autoplay || paused || dragging || items.length < 2) return
    const id = window.setTimeout(
      () => go(index === last ? 0 : index + 1),
      autoplayDelay
    )
    return () => window.clearTimeout(id)
  }, [autoplay, autoplayDelay, dragging, go, index, items.length, last, paused])

  const active = items[index]
  if (!active) return null

  const lines = active.title.split("\n")
  const accent = active.accent ?? "#8a8a8a"
  const grade = TINTS[tint]

  return (
    <div
      ref={stageRef}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget && onActivate) {
          e.preventDefault()
          onActivate(index)
          return
        }
        const keys: Record<string, number> = {
          ArrowLeft: index - 1,
          ArrowRight: index + 1,
          Home: 0,
          End: last,
        }
        if (!(e.key in keys)) return
        e.preventDefault()
        go(keys[e.key]!)
      }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        "relative h-full min-h-[24rem] w-full overflow-hidden bg-black text-white select-none",
        "outline-none focus-visible:ring-1 focus-visible:ring-white/40 focus-visible:ring-inset",
        className
      )}
    >
      {/* ── Background: the focused photo, blown up and re-hued to its accent ── */}
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={swing}
        >
          <motion.img
            src={active.image}
            alt=""
            aria-hidden
            draggable={false}
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            initial={{ scale: reduced ? 1.12 : 1.22 }}
            animate={{ scale: 1.12 }}
            transition={reduced ? { duration: 0 } : { duration: 6, ease: "linear" }}
          />
          {/* Keep the photo's luminance, take the accent's hue. */}
          {grade.color > 0 ? (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: accent, mixBlendMode: "color", opacity: grade.color }}
            />
          ) : null}
          {grade.multiply > 0 ? (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: accent, mixBlendMode: "multiply", opacity: grade.multiply }}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Legibility wash + grain, above the swap so they never flicker. */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${grade.shade})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/55" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: "180px 180px" }}
      />

      {/* ── Top bar: a centred cluster, not edge-to-edge ── */}
      <div
        className="absolute inset-x-0 z-10 flex items-center justify-center"
        style={{ top: Math.max(16, box.h * 0.029), gap: `${Math.max(20, box.w * 0.06)}px` }}
      >
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="uppercase opacity-90 transition-opacity hover:opacity-100"
            style={{ fontSize: label * 1.15 }}
          >
            <span aria-hidden>↖</span> Back
          </button>
        ) : null}
        {brand ? (
          <div
            className="font-medium uppercase tracking-[0.02em]"
            style={{ fontSize: label * 1.35 }}
          >
            {brand}
          </div>
        ) : null}
        {onMenu ? (
          <button
            type="button"
            onClick={onMenu}
            className="uppercase opacity-90 transition-opacity hover:opacity-100"
            style={{ fontSize: label * 1.15 }}
          >
            Menú <span aria-hidden>☰</span>
          </button>
        ) : null}
      </div>

      {/* ── Headline block, sitting just above the strip's top edge ── */}
      <div
        className="absolute inset-x-0 top-0 flex flex-col justify-end"
        style={{
          height: `${STRIP_TOP * 100}%`,
          paddingLeft: pad,
          paddingRight: pad,
          paddingBottom: Math.round(box.h * 0.028),
        }}
      >
        <div className="flex w-full flex-wrap items-end gap-x-[6vw] gap-y-2">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.h2
              key={index}
              className="font-medium uppercase leading-[0.86] tracking-[-0.035em]"
              style={{ fontSize: Math.max(34, Math.round(box.h * TITLE)) }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.18 } }}
            >
              {lines.map((line, i) => (
                // Each line wipes up from behind its own edge.
                // Extra room on top so accents (Á, Ñ) aren't clipped by the mask.
                <span key={i} className="-mt-[0.16em] block overflow-hidden pt-[0.16em] pb-[0.04em]">
                  <motion.span
                    className="block"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { duration: 0.62, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }
                    }
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </motion.h2>
          </AnimatePresence>

          {active.credit ? (
            <motion.p
              key={`credit-${index}`}
              className="uppercase tracking-[0.04em]"
              style={{ fontSize: label }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {active.credit}
            </motion.p>
          ) : null}

          {active.meta?.length ? (
            <div
              className="ml-auto flex items-end"
              style={{ gap: `${Math.max(16, box.w * 0.055)}px` }}
            >
              {active.meta.map((fact, i) => (
                <motion.span
                  key={`${index}-${fact}`}
                  className="whitespace-nowrap uppercase tabular-nums tracking-[0.04em]"
                  style={{ fontSize: label }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={
                    reduced ? { duration: 0 } : { duration: 0.45, delay: 0.12 + i * 0.06 }
                  }
                >
                  {fact}
                </motion.span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* ── The strip: one shared top edge, the focused card twice as tall ── */}
      <div
        className="absolute inset-x-0"
        style={{ top: `${STRIP_TOP * 100}%`, height: fullH }}
      >
        <motion.div
          className="flex items-start will-change-transform"
          style={{ gap, x, cursor: dragging ? "grabbing" : "grab", touchAction: "pan-y" }}
          drag="x"
          dragMomentum={false}
          dragElastic={0.08}
          dragConstraints={{ left: xFor(last), right: xFor(0) }}
          onDragStart={() => {
            setDragging(true)
            justDragged.current = true
          }}
          onDragEnd={(_, info) => {
            setDragging(false)
            // Land on whatever card the release sits nearest, nudged by throw
            // velocity so a flick clears more than one card.
            const thrown = x.get() + info.velocity.x * 0.12
            go(Math.round((box.w / 2 - thrown - cardW / 2) / step))
            window.setTimeout(() => (justDragged.current = false), 0)
          }}
        >
          {items.map((item, i) => (
            <motion.button
              key={item.id ?? i}
              type="button"
              aria-label={item.title.replace(/\n/g, " ")}
              aria-current={i === index}
              onClick={() => {
                if (justDragged.current) return
                if (i === index) onActivate?.(i)
                else go(i)
              }}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-none bg-white/5",
                i === index && onActivate ? "cursor-pointer" : undefined
              )}
              style={{ width: cardW }}
              initial={false}
              animate={{ height: i === index ? fullH : halfH }}
              transition={spring}
            >
              {/* The focused card is exactly 3:4, so object-position does
                  nothing to it - it only picks which band of the portrait the
                  half-height neighbours keep. Anchored just above centre so a
                  clipped card still shows a face, not a forehead. */}
              <img
                src={item.thumb ?? item.image}
                alt=""
                draggable={false}
                decoding="async"
                loading={Math.abs(i - index) > 5 ? "lazy" : "eager"}
                className="h-full w-full object-cover"
                style={{ objectPosition: "50% 26%" }}
              />
              {/* Unfocused cards sit back a touch without going grey. */}
              <motion.span
                aria-hidden
                className="absolute inset-0 bg-black"
                initial={false}
                animate={{ opacity: i === index ? 0 : 0.18 }}
                transition={spring}
              />
            </motion.button>
          ))}
        </motion.div>

        {caption ? (
          <div
            className="pointer-events-none absolute flex items-center justify-between uppercase tabular-nums"
            style={{
              top: fullH + 8,
              left: box.w / 2 - cardW / 2,
              width: cardW,
              fontSize: label,
            }}
          >
            {caption(active, index)}
          </div>
        ) : null}
      </div>

      {/* ── Position rail ── */}
      <div
        className="absolute"
        style={{ left: pad, bottom: Math.max(14, box.h * 0.022), width: Math.max(120, box.w * RAIL) }}
      >
        <div
          className="flex justify-between tabular-nums opacity-80"
          style={{ fontSize: label }}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{String(items.length).padStart(2, "0")}</span>
        </div>
        <div className="relative mt-2 h-px w-full overflow-hidden bg-white/25">
          <motion.div
            className="absolute inset-y-0 left-0 bg-white"
            style={{ width: `${100 / items.length}%` }}
            initial={false}
            animate={{ x: `${index * 100}%` }}
            transition={spring}
          />
        </div>
      </div>
    </div>
  )
}
