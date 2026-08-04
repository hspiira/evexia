import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/persons")({
  component: PersonsLayout,
})

function PersonsLayout() {
  return <AppLayout><Outlet /></AppLayout>
}
