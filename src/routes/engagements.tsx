import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/engagements")({
  component: EngagementsLayout,
})

function EngagementsLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
