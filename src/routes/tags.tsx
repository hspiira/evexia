import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/tags")({
  component: TagsLayout,
})

function TagsLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
