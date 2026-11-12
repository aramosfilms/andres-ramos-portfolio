import { cn } from "@/lib/utils"

/** Copyright line shown under every section and on every opened photo/video. */
export function Rights({ className }: { className?: string }) {
  return <span className={cn("label whitespace-nowrap", className)}>© 2026 Andrés Ramos. All rights reserved.</span>
}
