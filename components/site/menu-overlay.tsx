"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { PERSON } from "@/lib/projects"

const LINKS = [
  { href: "#indice", label: "Índice" },
  { href: "#sobre-mi", label: "Sobre mí" },
  { href: "#contacto", label: "Contacto" },
]

export function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="fixed inset-0 z-50 flex flex-col bg-black px-4 py-4 text-white md:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="label flex items-start justify-between">
            <span>
              {PERSON.name}
              <br />
              <span className="text-white/55">{PERSON.role}</span>
            </span>
            <button ref={closeRef} type="button" onClick={onClose} className="hover:text-white/60">
              Cerrar ✕
            </button>
          </div>

          <nav className="mt-auto mb-auto">
            <ul>
              {LINKS.map((l, i) => (
                <li key={l.href} className="overflow-hidden">
                  <motion.a
                    href={l.href}
                    onClick={onClose}
                    className="group flex items-baseline gap-4 py-1 text-[clamp(2.75rem,11vw,9rem)] font-medium uppercase leading-[0.9] tracking-[-0.04em] transition-colors hover:text-white/50"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.55, delay: 0.05 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="label w-8 shrink-0 self-start pt-[0.8em] text-white/55">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {l.label}
                  </motion.a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="label flex flex-wrap items-end justify-between gap-4">
            <a href={`mailto:${PERSON.email}`} className="hover:text-white/60">
              {PERSON.email}
            </a>
            <div className="flex gap-6">
              {PERSON.social.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="hover:text-white/60">
                  {s.label} ↗
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
