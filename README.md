# Andrés Ramos: portafolio

https://andresramosportfolio.site

Sitio estático con Next.js 16, Tailwind 4, shadcn/ui y framer-motion.

## Cómo se publica

El proyecto de Vercel está conectado a este repositorio: **cada push a `main` publica el sitio
automáticamente** (Vercel ejecuta `npm run build` y sirve la carpeta `out/`). No hace falta nada más.

## Editar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Para comprobar el build final: `npm run build`.

## Dónde está cada cosa

| Ruta | Qué es |
| --- | --- |
| `lib/projects.ts` | **Textos, títulos, lugares, créditos y orden de los proyectos.** Casi todos los cambios de contenido se hacen aquí |
| `components/ui/hero-carousel.tsx` | Carrusel de la portada |
| `components/site/` | Índice, fichas de vídeo/foto, menú, aviso de derechos |
| `app/` | Páginas, metadatos, favicon e imagen para compartir (`public/og.jpg`) |
| `public/media/` | Fotos (WebP) y vídeos (1080p) ya optimizados |
| `lib/media.generated.json` | Medidas y colores de fotos/vídeos (generado, no editar a mano) |
| `tools/` | Script que convierte los originales en `public/media/` (no forma parte del sitio) |

## Añadir fotos o vídeos

Los originales no están en el repositorio (pesan varios GB). Con los originales en la carpeta de
arriba de este proyecto (vídeos sueltos y fotos dentro de `PORTFOLIO/`):

1. Añade el archivo a la lista correspondiente en `tools/process-media.mjs` (para vídeos, el segundo
   que quieres como portada; elige uno sin texto encima).
2. `cd tools && npm install`
3. `npm run fast` (fotos, portadas, previsualizaciones) y `npm run full` (vídeos completos).
4. Añade el proyecto en `lib/projects.ts`, haz commit y push.
