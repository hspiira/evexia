import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/incidents")({
  component: IncidentsLayout,
})

function IncidentsLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
