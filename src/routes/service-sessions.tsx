import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/service-sessions")({
  component: ServiceSessionsLayout,
})

function ServiceSessionsLayout() {
  return <AppLayout><Outlet /></AppLayout>
}
