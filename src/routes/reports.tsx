import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/reports")({
  component: ReportsLayout,
})

function ReportsLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
