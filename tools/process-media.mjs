// Turns Andrés's raw exports into web-weight assets.
//
//   cd tools && npm install
//   node process-media.mjs fast   -> photos, posters, hover teasers, manifest
//   node process-media.mjs full   -> 1080p H.264 encodes of every film
//
// Originals live outside the repo: films in the folder above `web/`, photos
// anywhere under `../PORTFOLIO` (override with MEDIA_ROOT). Outputs are skipped
// when they already exist, so the script is safe to re-run. The site itself
// never runs this; it only uses what lands in public/media.
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import ffmpegPath from "ffmpeg-static"
import ffprobe from "ffprobe-static"

const here = path.dirname(fileURLToPath(import.meta.url))
const WEB = path.resolve(here, "..")
const ROOT = process.env.MEDIA_ROOT ? path.resolve(process.env.MEDIA_ROOT) : path.resolve(WEB, "..")
const PHOTOS = path.join(ROOT, "PORTFOLIO")
const OUT_P = path.join(WEB, "public", "media", "p")
const OUT_V = path.join(WEB, "public", "media", "v")
const MANIFEST = path.join(WEB, "lib", "media.generated.json")

const PHOTO_WIDTHS = [480, 960, 1600, 2400]
const POSTER_WIDTHS = [640, 1280, 1920]

const phase = process.argv[2] ?? "fast"
fs.mkdirSync(OUT_P, { recursive: true })
fs.mkdirSync(OUT_V, { recursive: true })

/* ── Sources ─────────────────────────────────────────────────────────── */

const CHAMPIONS = [
  ["dsc03369", "Celebración bajo los focos de la Champions League"],
  ["dsc03814", "Duelo en la banda, jugador de blanco remata ante un defensa de rojo"],
  ["dsc02945", "Saludo entre los dos equipos antes del partido"],
  ["dsc02889", "Jugadores con los niños de la salida al campo"],
  ["dsc02980", "Foto de equipo antes del saque inicial"],
  ["dsc02908", "Banquillo en fila con los niños durante el himno"],
  ["dsc02859", "Jugador junto al círculo central con el logo de la Champions League"],
  ["dsc02853", "Jugador saluda a la grada antes del partido"],
  ["dsc03056", "Jugador con el 70 conduce el balón ante la grada"],
  ["dsc03256", "Jugador con el 70 da indicaciones"],
  ["dsc03313", "Jugador de rojo golpea el balón en carrera"],
  ["dsc03557", "Uno contra uno en el centro del campo"],
  ["dsc03558", "Uno contra uno, segundo instante"],
  ["dsc03559", "Regate ante la marca del defensa"],
  ["dsc03567", "Conducción con el defensa encima"],
  ["dsc03581", "Carrera con el balón cosido al pie"],
  ["dsc03749", "Jugador de blanco controla frente a la valla publicitaria"],
  ["dsc03750", "Control orientado, segundo instante"],
  ["dsc03766", "Entrada del defensa de rojo"],
  ["dsc03769", "Disputa del balón bajo la grada"],
  ["dsc03803", "Jugador de blanco espera el balón en la banda"],
  ["dsc03847", "Jugada en el área con varios jugadores"],
  ["dsc03868", "Jugadores esperando un saque de esquina"],
  ["dsc03920", "Contraataque por el centro"],
]

const LPF = [
  ["dsc01527", "Jugador de celeste con el 11, de espaldas"],
  ["dsc01349", "Banderín de córner de la Liga Panameña de Fútbol"],
  ["dsc01370", "Ataque del equipo celeste ante la grada"],
  ["dsc01571", "Jugador de celeste conduce en carrera"],
  ["dsc01636", "Jugador de celeste con el 8, de espaldas"],
  ["dsc01495", "Transición del equipo celeste"],
  ["dsc01019", "Choque entre un jugador de celeste y uno de blanco"],
  ["dsc01107", "Jugador de blanco con el 70, de espaldas"],
  ["dsc01259", "Balón en la esquina antes de un córner"],
  ["dsc01661", "Formación ante el marcador antes del saque inicial"],
  ["dsc01714", "Jugador de verde conduce con la ciudad al fondo"],
  ["dsc01749", "Jugador de verde en carrera junto a la valla"],
  ["dsc01756", "Duelo en la frontal del área"],
  ["dsc01772", "Entrenador da indicaciones desde la banda"],
  ["dsc01789", "Salto a por un balón aéreo"],
  ["dsc01846", "Jugador de rojinegro estira la pierna hacia el balón"],
  ["dsc01852", "Forcejeo espalda contra espalda"],
  ["dsc01876", "Jugador de verde pide explicaciones"],
  ["dsc01904", "Disputa en el lateral"],
  ["dsc01924", "Entrada en el suelo"],
  ["dsc01947", "Carrera por la banda bajo la grada"],
  ["dsc01954", "Jugador de verde en la esquina del estadio"],
  ["dsc01975", "Uno contra uno en el centro del campo"],
  ["dsc02005", "Duelo ante la grada de la afición"],
  ["dsc02058", "Acción en el área pequeña"],
  ["dsc02118", "Jugador de verde con el 11 espera el balón"],
  ["dsc02161", "Presión en el medio campo"],
  ["dsc02192", "Jugadores tras una falta"],
  ["dsc02276", "Entrenador grita desde la banda"],
  ["dsc02294", "Juego bajo los focos"],
  ["dsc02301", "Jugador tendido en el césped"],
  ["dsc02316", "Entrada a ras de suelo"],
  ["dsc02323", "Llegada de varios jugadores al balón"],
  ["dsc02360", "Jugador de verde con el 18, de espaldas"],
]

// [slug, source file, poster time in seconds, optional crop]
// Poster times are hand-picked from contact sheets so no cover carries
// on-screen text (it fights the headline set over the hero). Where every frame
// has a caption burnt in, a crop trims it off the poster and the teaser.
const FILMS = [
  ["london", "LONDON READY.mov", 5.3],
  ["paris", "PARIS.mov", 21.3],
  ["belgium", "BELGIUM.mov", 18.7],
  ["vienna", "VIENNA.mov", 1.9],
  ["barcelona", "BARCELONA.mov", 26.3],
  ["hollywood-studios", "HOLLYWOOD STUDIOS.mp4", 48.3],
  ["panama", "SPIDERMAN BRAND NEW DAY.mov", 27.5, "crop=iw:trunc(ih*0.70/2)*2:0:0"],
  ["panama-2", "PIANO MAN.mov", 13.4],
  ["lisboa", "Lisbon.mov", 26.8],
  ["valencia", "VALENCIA SKEPT.mov", 12.5],
  ["sandia-bv", "VFX_FINAL_Renato.mov", 71.0],
  ["obsessed-with-you", "E3_VIDEPCLIP.mp4", 64.3],
]

/* ── Helpers ─────────────────────────────────────────────────────────── */

function findFile(dir, name) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      const hit = findFile(p, name)
      if (hit) return hit
    } else if (e.name.toLowerCase() === name.toLowerCase()) return p
  }
  return null
}

const hex = ({ r, g, b }) =>
  "#" + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("")

async function colourOf(input) {
  // Average of a tiny thumbnail reads as the frame's overall cast, which is
  // what the background grade wants (dominant() picks out flat patches).
  const { data } = await sharp(input).resize(1, 1, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true })
  return hex({ r: data[0], g: data[1], b: data[2] })
}

async function renditions(input, base, widths, quality = 78) {
  const src = sharp(input, { limitInputPixels: false }).rotate()
  const meta = await src.metadata()
  const portrait = (meta.orientation ?? 1) >= 5
  const w = portrait ? meta.height : meta.width
  const h = portrait ? meta.width : meta.height
  const made = []
  for (const tw of widths) {
    if (tw > w && made.length) break
    const target = Math.min(tw, w)
    const out = `${base}-${tw}.webp`
    if (!fs.existsSync(out)) {
      await sharp(input, { limitInputPixels: false })
        .rotate()
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality, effort: 5, smartSubsample: true })
        .toFile(out)
    }
    made.push(tw)
  }
  return { w, h, widths: made }
}

function probe(file) {
  const out = execFileSync(ffprobe.path, [
    "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file,
  ]).toString()
  return parseFloat(out)
}

function ff(args) {
  const r = spawnSync(ffmpegPath, ["-hide_banner", "-loglevel", "error", "-y", ...args], {
    stdio: ["ignore", "inherit", "inherit"],
  })
  if (r.status !== 0) throw new Error("ffmpeg failed: " + args.join(" "))
}

/* ── Phases ──────────────────────────────────────────────────────────── */

async function fast() {
  const photos = []
  for (const [set, list, find] of [
    ["champions", CHAMPIONS, (id) => findFile(PHOTOS, `${id}.jpg`)],
    ["lpf", LPF, (id) => findFile(PHOTOS, `${id}.jpg`)],
  ]) {
    for (const [id, alt] of list) {
      const src = find(id)
      if (!src || !fs.existsSync(src)) throw new Error(`missing ${id}`)
      const r = await renditions(src, path.join(OUT_P, id), PHOTO_WIDTHS)
      photos.push({ id, set, alt, w: r.w, h: r.h, widths: r.widths, color: await colourOf(path.join(OUT_P, `${id}-480.webp`)) })
      process.stdout.write(".")
    }
  }
  console.log(` ${photos.length} photos`)

  const films = []
  for (const [slug, file, at, crop] of FILMS) {
    const src = path.join(ROOT, file)
    const duration = probe(src)
    const frame = path.join(OUT_V, `${slug}-frame.png`)
    if (!fs.existsSync(frame)) {
      ff(["-ss", String(at), "-i", src, "-vf", `${crop ? crop + "," : ""}scale=1920:-2:flags=lanczos`, "-frames:v", "1", frame])
    }
    const r = await renditions(frame, path.join(OUT_V, `${slug}-poster`), POSTER_WIDTHS, 80)
    const teaser = path.join(OUT_V, `${slug}-teaser.mp4`)
    if (!fs.existsSync(teaser)) {
      ff([
        // Open the teaser just before the poster frame, so the still and
        // the moving image read as one shot.
        "-ss", Math.max(0, Math.min(at - 1, duration - 5)).toFixed(2), "-t", "5", "-i", src,
        "-vf", `${crop ? crop + "," : ""}scale=640:-2,fps=24`, "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", "30", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", teaser,
      ])
    }
    films.push({ slug, duration: Math.round(duration * 10) / 10, w: r.w, h: r.h, color: await colourOf(path.join(OUT_V, `${slug}-poster-640.webp`)) })
    fs.rmSync(frame, { force: true })
    console.log(`poster+teaser ${slug}`)
  }

  fs.writeFileSync(MANIFEST, JSON.stringify({ photos, films }, null, 2))
  console.log("manifest written")
}

function full() {
  for (const [slug, file] of FILMS) {
    const out = path.join(OUT_V, `${slug}.mp4`)
    if (fs.existsSync(out)) continue
    const tmp = out.replace(/\.mp4$/, ".part.mp4")
    const t0 = Date.now()
    ff([
      "-i", path.join(ROOT, file),
      "-vf", "scale=1920:-2:flags=lanczos", "-pix_fmt", "yuv420p",
      "-c:v", "libx264", "-preset", "medium", "-crf", "23",
      "-maxrate", "6M", "-bufsize", "12M", "-profile:v", "high",
      "-c:a", "aac", "-b:a", "160k", "-ac", "2",
      "-movflags", "+faststart", tmp,
    ])
    fs.renameSync(tmp, out)
    const mb = (fs.statSync(out).size / 1048576).toFixed(1)
    console.log(`encoded ${slug} ${mb}MB in ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  }
  console.log("all films encoded")
}

if (phase === "fast") await fast()
else if (phase === "full") full()
else throw new Error(`unknown phase ${phase}`)
