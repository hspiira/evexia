import * as React from "react"

import { cn } from "@/lib/utils"

/** Bordered card with a small heading, used in detail-page main columns. */
export function DetailCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-sm border border-fg/10 bg-surface p-4">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-fg/55">{title}</h3>
      {children}
    </section>
  )
}

/** Heading + content group, used in the detail-page right rail. */
export function RailSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <h3 className="text-xs font-semibold tracking-wide text-fg/55">{title}</h3>
      {children}
    </section>
  )
}

/** Labelled single stat with a monospace value. */
export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-fg/10 bg-surface px-3 py-2">
      <div className="text-[11px] font-medium tracking-wide text-fg/55">{label}</div>
      <div className="mt-0.5 font-mono text-base font-semibold text-fg">{value}</div>
    </div>
  )
}

/** Two-column definition-list grid for key/value detail rows. */
export function DetailGrid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">{children}</dl>
}

/** A key/value row inside a {@link DetailGrid}. */
export function DetailRow({
  label,
  value,
  fullWidth,
}: {
  label: string
  value: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={cn(fullWidth && "col-span-2")}>
      <dt className="text-[11px] font-medium tracking-wide text-fg/55">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-fg">
        {value || <span className="text-fg/40">—</span>}
      </dd>
    </div>
  )
}
