import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/service-assignments")({
  component: ServiceAssignmentsLayout,
})

function ServiceAssignmentsLayout() {
  return <AppLayout><Outlet /></AppLayout>
}
