import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/care-callbacks")({
  component: CareCallbacksLayout,
})

function CareCallbacksLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
