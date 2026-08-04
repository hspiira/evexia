import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/surveys")({
  component: SurveysLayout,
})

function SurveysLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
