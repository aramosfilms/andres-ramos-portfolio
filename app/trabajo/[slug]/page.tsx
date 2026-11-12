import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { FilmStage } from "@/components/site/film-stage"
import { PhotoStage } from "@/components/site/photo-stage"
import { Rights } from "@/components/site/rights"
import { PERSON, PROJECTS, projectBySlug } from "@/lib/projects"

export const dynamicParams = false

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<"/trabajo/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const p = projectBySlug(slug)
  if (!p) return {}
  return {
    title: p.title,
    description: p.description,
    openGraph: {
      title: `${p.title} · ${PERSON.name}`,
      description: p.description,
      images: [{ url: "/og.jpg", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title: `${p.title} · ${PERSON.name}`, images: ["/og.jpg"] },
  }
}

export default async function ProjectPage({ params }: PageProps<"/trabajo/[slug]">) {
  const { slug } = await params
  const i = PROJECTS.findIndex((p) => p.slug === slug)
  const p = PROJECTS[i]
  if (!p) notFound()
  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length]!
  const next = PROJECTS[(i + 1) % PROJECTS.length]!

  return (
    <main className="min-h-[100svh]">
      <header className="label sticky top-0 z-20 flex h-12 items-start justify-between bg-black px-4 pt-3 md:px-6">
        <Link href="/" className="hover:text-white/60">
          {PERSON.name}
          <span className="hidden text-white/55 md:inline"> · {PERSON.role}</span>
        </Link>
        <Link href="/#indice" className="text-[15px] font-medium hover:text-white/60">
          Volver
        </Link>
      </header>

      <div className="md:px-0">
        {p.kind === "film" ? (
          <FilmStage
            no={p.no}
            title={p.title}
            category={p.category}
            place={p.place}
            year={p.year}
            description={p.description}
            credits={p.credits}
            duration={p.duration}
            video={p.video}
            poster={p.cover.src}
            posterSrcSet={p.cover.srcSet}
            color={p.cover.color}
          />
        ) : (
          <PhotoStage
            no={p.no}
            title={p.title}
            category={p.category}
            place={p.place}
            year={p.year}
            description={p.description}
            credits={p.credits}
            photos={p.photos}
            coverId={p.coverId}
          />
        )}
      </div>

      <nav className="label mt-16 grid grid-cols-2 border-t border-white/20 px-4 pt-3 pb-4 md:mt-24 md:px-6" aria-label="Más trabajos">
        <Link href={`/trabajo/${prev.slug}`} className="group">
          <span className="text-[15px] font-medium">Prev</span>
          <span className="mt-1 block text-white/50 transition-colors group-hover:text-white">
            {prev.no} {prev.title}
          </span>
        </Link>
        <Link href={`/trabajo/${next.slug}`} className="group text-right">
          <span className="text-[15px] font-medium">Next</span>
          <span className="mt-1 block text-white/50 transition-colors group-hover:text-white">
            {next.no} {next.title}
          </span>
        </Link>
      </nav>
      <footer className="flex justify-end px-4 pb-4 text-white/70 md:px-6">
        <Rights />
      </footer>
    </main>
  )
}
