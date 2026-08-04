import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/services")({
  component: ServicesLayout,
})

function ServicesLayout() {
  return <AppLayout><Outlet /></AppLayout>
}
