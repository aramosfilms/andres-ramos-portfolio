// Standalone demo of <HeroCarousel>, kept next to the component for reference.
// The real site uses it in components/site/home-hero.tsx with Andrés's work.
"use client"

import { HeroCarousel, type HeroCarouselItem } from "@/components/ui/hero-carousel"

const LOOKS: HeroCarouselItem[] = [
  {
    title: "Noches de\nChampions",
    image: "/media/p/dsc03369-1600.webp",
    thumb: "/media/p/dsc03369-480.webp",
    credit: "Fotografía deportiva.",
    meta: ["Europa", "2026", "24 fotos"],
    accent: "#7a3b3f",
  },
  {
    title: "Liga\nPanameña",
    image: "/media/p/dsc01527-1600.webp",
    thumb: "/media/p/dsc01527-480.webp",
    credit: "Fotografía deportiva.",
    meta: ["Panamá", "2026", "34 fotos"],
    accent: "#2f6f8f",
  },
]

export default function DemoOne() {
  return (
    <div className="h-[100svh]">
      <HeroCarousel items={LOOKS} brand="Andrés Ramos" onMenu={() => {}} tint="subtle" />
    </div>
  )
}
