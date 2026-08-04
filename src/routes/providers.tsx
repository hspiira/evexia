import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/providers")({
  component: ProvidersLayout,
})

function ProvidersLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
