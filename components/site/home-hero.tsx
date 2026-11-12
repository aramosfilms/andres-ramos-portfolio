"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HeroCarousel, type HeroCarouselItem } from "@/components/ui/hero-carousel"
import { MenuOverlay } from "@/components/site/menu-overlay"
import { Rights } from "@/components/site/rights"
import type { ProjectSummary } from "@/lib/projects"

export function HomeHero({ projects }: { projects: ProjectSummary[] }) {
  const router = useRouter()
  const [menu, setMenu] = React.useState(false)

  const items = React.useMemo<HeroCarouselItem[]>(
    () =>
      projects.map((p) => ({
        id: p.slug,
        title: p.heroTitle,
        image: p.cover.src,
        thumb: p.cover.thumb,
        credit: `${p.category}.`,
        meta: [p.place, p.year ?? p.length, p.year ? p.length : null].filter(Boolean) as string[],
        accent: p.accent,
      })),
    [projects]
  )

  const open = React.useCallback(
    (i: number) => router.push(`/trabajo/${projects[i]!.slug}`),
    [router, projects]
  )

  // Prefetch the project pages the hero points at, so a click lands instantly.
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      for (const p of projects) router.prefetch(`/trabajo/${p.slug}`)
    }, 1500)
    return () => window.clearTimeout(id)
  }, [projects, router])

  return (
    <>
      <section className="relative h-[100svh] min-h-[34rem]" aria-label="Trabajos destacados">
        <Rights className="pointer-events-none absolute right-4 bottom-14 z-10 md:bottom-4 text-white/75 md:right-6" />
        <HeroCarousel
          items={items}
          defaultIndex={0}
          brand="Andrés Ramos"
          onMenu={() => setMenu(true)}
          onActivate={open}
          tint="subtle"
          wheelAxis="x"
          label="Trabajos de Andrés Ramos"
          caption={(_, i) => (
            <>
              <span>{projects[i]!.no}</span>
              <span>{projects[i]!.kind === "film" ? "▸ Play" : "▸ Ver"}</span>
            </>
          )}
        />
      </section>
      <MenuOverlay open={menu} onClose={() => setMenu(false)} />
    </>
  )
}
