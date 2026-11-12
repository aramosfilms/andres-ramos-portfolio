"use client"

import * as React from "react"

export function CopyEmail({ email }: { email: string }) {
  const [done, setDone] = React.useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email)
          setDone(true)
          window.setTimeout(() => setDone(false), 1800)
        } catch {
          window.location.href = `mailto:${email}`
        }
      }}
      className="hover:text-white/60"
    >
      {done ? "Copiado ✓" : "Copiar email"}
    </button>
  )
}
