import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface IconButtonProps {
  label: string
  icon: React.ElementType
  onClick?: () => void
  className?: string
}

/** Ghost icon-only button with an accessible label/title. */
export function IconButton({ label, icon: Icon, onClick, className }: IconButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("size-7 p-0 text-fg/70", className)}
    >
      <Icon className="size-3.5" />
    </Button>
  )
}
