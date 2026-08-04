import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/users")({
  component: UsersLayout,
})

function UsersLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}
