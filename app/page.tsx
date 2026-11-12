import { HomeHero } from "@/components/site/home-hero"
import { WorkIndex } from "@/components/site/work-index"
import { CopyEmail } from "@/components/site/copy-email"
import { Rights } from "@/components/site/rights"
import { PERSON, PROJECTS, projectSummaries } from "@/lib/projects"

export default function Home() {
  const projects = projectSummaries()
  const photoCount = PROJECTS.reduce((n, p) => n + (p.kind === "photo" ? p.photos.length : 0), 0)
  const filmCount = PROJECTS.filter((p) => p.kind === "film").length

  return (
    <main>
      <HomeHero projects={projects} />
      <WorkIndex projects={projects} />

      {/* ── Sobre mí, laid out like the credits block of a film page ── */}
      <section id="sobre-mi" className="border-t border-white/20 px-4 pt-6 pb-24 md:px-6 md:pb-40">
        <div className="label grid grid-cols-2 gap-x-6 md:grid-cols-12">
          <span className="md:col-span-2">Sobre mí</span>
          <span className="hidden md:col-span-4 md:block">Fotógrafo y videógrafo</span>
          <span className="hidden md:col-span-5 md:block">Panamá → Valencia</span>
          <span className="text-right md:col-span-1">2026</span>
        </div>

        <p className="mt-16 max-w-[22ch] text-[clamp(2rem,5.4vw,5.5rem)] font-medium uppercase leading-[0.92] tracking-[-0.035em] md:mt-28">
          Fotógrafo y videógrafo panameño, con base en Valencia.
        </p>

        <div className="mt-16 grid gap-y-10 md:mt-24 md:grid-cols-12 md:gap-x-6">
          <div className="space-y-4 text-[15px] leading-snug text-white/80 md:col-span-4 md:col-start-7">
            <p>
              Soy de Panamá y vivo en Valencia. Me dedico a la fotografía deportiva y he
              fotografiado fútbol profesional tanto en Europa como en Panamá.
            </p>
            <p>
              En vídeo grabo y edito piezas de viaje para redes sociales y realizo videoclips con
              efectos visuales.
            </p>
          </div>
          <dl className="label grid grid-cols-[9rem_1fr] gap-y-1.5 md:col-span-6 md:col-start-1 md:row-start-1">
            <dt className="text-white/55">Trabajos</dt>
            <dd>Fotografía deportiva</dd>
            <dt />
            <dd>Vídeos de viaje</dd>
            <dt />
            <dd>Videoclips</dd>
            <dt className="mt-4 text-white/55">Competiciones</dt>
            <dd className="mt-4">UEFA Champions League</dd>
            <dt />
            <dd>Liga Panameña de Fútbol</dd>
            <dt className="mt-4 text-white/55">Archivo</dt>
            <dd className="mt-4">
              {photoCount} fotografías · {filmCount} vídeos
            </dd>
          </dl>
        </div>

        <div className="mt-24 flex justify-end text-white/70 md:mt-32">
          <Rights />
        </div>
      </section>

      {/* ── Contacto ── */}
      <section id="contacto" className="flex min-h-[100svh] flex-col border-t border-white/20 px-4 pt-6 pb-4 md:px-6">
        <div className="label flex justify-between">
          <span>Contacto</span>
          <span>{PERSON.base}</span>
        </div>

        <div className="my-auto py-20">
          <a
            href={`mailto:${PERSON.email}`}
            className="block break-all text-[clamp(1.9rem,7.6vw,8.5rem)] font-medium uppercase leading-[0.9] tracking-[-0.045em] transition-colors hover:text-white/55 md:break-normal"
          >
            {PERSON.email}
          </a>
          <div className="label mt-8 flex flex-wrap gap-x-10 gap-y-3">
            <CopyEmail email={PERSON.email} />
            <a href={`tel:${PERSON.phone.replace(/\s/g, "")}`} className="hover:text-white/60">
              {PERSON.phone}
            </a>
            {PERSON.social.map((s) => (
              <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="hover:text-white/60">
                {s.label} ↗
              </a>
            ))}
          </div>
        </div>

        <footer className="label flex flex-wrap justify-between gap-x-6 gap-y-1">
          <span>{PERSON.handle}</span>
          <Rights />
        </footer>
      </section>
    </main>
  )
}
