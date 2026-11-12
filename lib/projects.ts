import media from "./media.generated.json"

export type Photo = {
  id: string
  alt: string
  w: number
  h: number
  widths: number[]
  color: string
}

type Base = {
  slug: string
  no: string
  title: string
  /** Headline as it breaks in the hero. */
  heroTitle: string
  category: string
  place: string
  year?: string
  description: string
  credits: [string, string][]
  accent: string
  cover: { src: string; srcSet: string; thumb: string; color: string }
}

export type PhotoProject = Base & { kind: "photo"; photos: Photo[]; coverId: string }
export type FilmProject = Base & {
  kind: "film"
  duration: number
  video: string
  teaser: string
  poster: string
}
export type Project = PhotoProject | FilmProject

export const PERSON = {
  name: "Andrés Ramos",
  role: "Fotografía deportiva · Vídeo",
  base: "Valencia, España",
  email: "aramosfilms@gmail.com",
  phone: "+34 671 939 968",
  handle: "@ramosivv",
  social: [
    { label: "Instagram", href: "https://www.instagram.com/ramosivv/" },
    { label: "TikTok", href: "https://www.tiktok.com/@ramosivv" },
    { label: "YouTube", href: "https://www.youtube.com/@ramosivv" },
  ],
}

/* ── Colour ─────────────────────────────────────────────────────────── */

/** Lift a muddy average colour into something the background can be graded to. */
function vivid(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const d = max - min
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return `hsl(${Math.round(h)} 55% 42%)`
}

/* ── Assets ─────────────────────────────────────────────────────────── */

export const photoSrc = (id: string, w: number) => `/media/p/${id}-${w}.webp`
export const photoSrcSet = (p: Photo) =>
  p.widths.map((w) => `${photoSrc(p.id, w)} ${Math.min(w, p.w)}w`).join(", ")

const posterSrc = (slug: string, w: number) => `/media/v/${slug}-poster-${w}.webp`

const photosOf = (set: string): Photo[] =>
  media.photos
    .filter((p) => p.set === set)
    .map(({ id, alt, w, h, widths, color }) => ({ id, alt, w, h, widths, color }))

const filmOf = (slug: string) => {
  const f = media.films.find((x) => x.slug === slug)
  if (!f) throw new Error(`no film ${slug}`)
  return f
}

export const fmtDuration = (s: number) => {
  const t = Math.round(s)
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`
}

/* ── Projects ───────────────────────────────────────────────────────── */

function photoProject(
  p: Omit<PhotoProject, "kind" | "photos" | "accent" | "cover" | "no"> & { set: string }
): Omit<PhotoProject, "no"> {
  const photos = photosOf(p.set)
  const cover = photos.find((x) => x.id === p.coverId) ?? photos[0]!
  const { set: _set, ...rest } = p
  return {
    ...rest,
    kind: "photo",
    photos,
    coverId: cover.id,
    accent: vivid(cover.color),
    cover: {
      src: photoSrc(cover.id, 1600),
      srcSet: photoSrcSet(cover),
      thumb: photoSrc(cover.id, 480),
      color: cover.color,
    },
  }
}

function filmProject(
  p: Omit<FilmProject, "kind" | "duration" | "video" | "teaser" | "poster" | "accent" | "cover" | "no">
): Omit<FilmProject, "no"> {
  const f = filmOf(p.slug)
  return {
    ...p,
    kind: "film",
    duration: f.duration,
    video: `/media/v/${p.slug}.mp4`,
    teaser: `/media/v/${p.slug}-teaser.mp4`,
    poster: posterSrc(p.slug, 1920),
    accent: vivid(f.color),
    cover: {
      src: posterSrc(p.slug, 1920),
      srcSet: [640, 1280, 1920].map((w) => `${posterSrc(p.slug, w)} ${w}w`).join(", "),
      thumb: posterSrc(p.slug, 640),
      color: f.color,
    },
  }
}

const TRAVEL_DESC =
  "Viaje editado al ritmo de la música, con tipografía animada. Pieza pensada para TikTok y redes sociales."
const TRAVEL_CREDITS: [string, string][] = [
  ["Grabación", "Andrés Ramos"],
  ["Edición", "Andrés Ramos"],
  ["Tipografía animada", "Andrés Ramos"],
]
const MUSIC_CREDITS: [string, string][] = [
  ["Realización", "Andrés Ramos"],
  ["Edición", "Andrés Ramos"],
  ["Efectos visuales", "Andrés Ramos"],
]
const PHOTO_CREDITS: [string, string][] = [
  ["Fotografía", "Andrés Ramos"],
  ["Edición", "Andrés Ramos"],
]

const list: Omit<Project, "no">[] = [
  photoProject({
    slug: "champions-league",
    set: "champions",
    coverId: "dsc03369",
    title: "Noches de Champions",
    heroTitle: "Noches de\nChampions",
    category: "Fotografía deportiva",
    place: "Europa",
    year: "2026",
    description:
      "UEFA Champions League. Del túnel al pitido final: previa, formaciones y juego desde la banda.",
    credits: PHOTO_CREDITS,
  }),
  photoProject({
    slug: "liga-panamena",
    set: "lpf",
    coverId: "dsc01527",
    title: "Liga Panameña",
    heroTitle: "Liga\nPanameña",
    category: "Fotografía deportiva",
    place: "Panamá",
    year: "2026",
    description:
      "Liga Panameña de Fútbol. Jornadas de liga en Panamá: calor, gradas cerca del campo y mucho duelo individual.",
    credits: PHOTO_CREDITS,
  }),
  filmProject({ slug: "london", title: "London", heroTitle: "London", category: "Vídeo de viaje", place: "Londres", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({ slug: "paris", title: "Paris", heroTitle: "Paris", category: "Vídeo de viaje", place: "París", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({ slug: "belgium", title: "Belgium", heroTitle: "Belgium", category: "Vídeo de viaje", place: "Bélgica", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({ slug: "vienna", title: "Vienna", heroTitle: "Vienna", category: "Vídeo de viaje", place: "Viena", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({ slug: "barcelona", title: "Barcelona", heroTitle: "Barcelona", category: "Vídeo de viaje", place: "Barcelona", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({ slug: "hollywood-studios", title: "Hollywood Studios", heroTitle: "Hollywood\nStudios", category: "Vídeo de viaje", place: "Orlando", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({ slug: "panama", title: "Panamá", heroTitle: "Panamá", category: "Vídeo de viaje", place: "Panamá", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({ slug: "panama-2", title: "Panamá II", heroTitle: "Panamá II", category: "Vídeo de viaje", place: "Panamá", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({ slug: "lisboa", title: "Lisboa", heroTitle: "Lisboa", category: "Vídeo de viaje", place: "Lisboa", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({ slug: "valencia", title: "Valencia", heroTitle: "Valencia", category: "Vídeo de viaje", place: "Valencia", description: TRAVEL_DESC, credits: TRAVEL_CREDITS }),
  filmProject({
    slug: "sandia-bv",
    title: "Sandía BV",
    heroTitle: "Sandía\nBV",
    category: "Videoclip",
    place: "Música",
    description: "Videoclip con realización, edición y efectos visuales para el artista.",
    credits: MUSIC_CREDITS,
  }),
  filmProject({
    slug: "obsessed-with-you",
    title: "Obsessed With You",
    heroTitle: "Obsessed\nWith You",
    category: "Videoclip",
    place: "Música",
    description: "Videoclip con realización, edición y efectos visuales para el artista.",
    credits: MUSIC_CREDITS,
  }),
]

export const PROJECTS: Project[] = list.map(
  (p, i) => ({ ...p, no: String(i + 1).padStart(2, "0") }) as Project
)

export const projectBySlug = (slug: string) => PROJECTS.find((p) => p.slug === slug)

/** Duration column: running time for films, frame count for photo sets. */
export const lengthLabel = (p: Project) =>
  p.kind === "film" ? fmtDuration(p.duration) : `${p.photos.length} fotos`

/** Lightweight, client-safe shape for the hero and index. */
export const projectSummaries = () =>
  PROJECTS.map((p) => ({
    slug: p.slug,
    no: p.no,
    title: p.title,
    heroTitle: p.heroTitle,
    category: p.category,
    place: p.place,
    year: p.year,
    kind: p.kind,
    length: lengthLabel(p),
    accent: p.accent,
    cover: p.cover,
    teaser: p.kind === "film" ? p.teaser : undefined,
  }))

export type ProjectSummary = ReturnType<typeof projectSummaries>[number]
