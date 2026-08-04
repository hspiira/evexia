import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppLayout } from "@/components/AppLayout"

export const Route = createFileRoute("/contracts")({
  component: ContractsLayout,
})

function ContractsLayout() {
  return <AppLayout><Outlet /></AppLayout>
}
