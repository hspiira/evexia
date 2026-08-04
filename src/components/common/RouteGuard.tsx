import { type ReactNode, useEffect } from "react"

import { useNavigate, useRouterState } from "@tanstack/react-router"
import { Loader2, ShieldAlert } from "lucide-react"

import { useHasClinicalScope } from "@/hooks/useCanWrite"
import {
  type AccessLevel,
  accessLevelFor,
  isPlatformAdminTenant,
  satisfies,
} from "@/lib/route-access"
import { useAuthStore } from "@/store/slices/authSlice"
import { useTenantStore } from "@/store/slices/tenantSlice"

/**
 * Enforces ROUTE_ACCESS for the active path. Mounted once in AppLayout, so
 * every screen in the shell is protected by construction — forgetting to guard
 * a new route is now safe rather than dangerous.
 *
 * Unauthenticated redirects to login; authenticated-but-unentitled renders in
 * place, since bouncing them would imply a broken session and invite a
 * pointless re-login.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const level = accessLevelFor(pathname)

  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const currentTenantId = useTenantStore((s) => s.currentTenantId)
  const { hasScope, isLoading: isScopeLoading } = useHasClinicalScope()

  // Only clinical routes await the scope query — otherwise every page spins.
  const isLoading = isAuthLoading || (level === "clinical" && isAuthenticated && isScopeLoading)

  const ctx = {
    isAuthenticated,
    hasClinicalScope: hasScope,
    isPlatformAdmin: isPlatformAdminTenant(currentTenantId),
  }
  const allowed = satisfies(level, ctx)
  const needsLogin = !isLoading && !isAuthenticated && level !== "public"

  useEffect(() => {
    if (!needsLogin) return
    navigate({
      to: "/auth/login",
      search: {
        tenant_code: undefined,
        email: undefined,
        redirect: typeof window !== "undefined" ? window.location.pathname : undefined,
      },
      replace: true,
    })
  }, [needsLogin, navigate])

  if (isLoading) return <SessionLoading />
  // Render nothing while the redirect above is in flight.
  if (needsLogin) return null
  if (!allowed) return <Forbidden level={level} />

  return <>{children}</>
}

function SessionLoading() {
  return (
    <div
      className="grid min-h-svh w-full place-items-center bg-bg text-fg"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-fg-muted" aria-hidden="true" />
      <span className="sr-only">Loading your session…</span>
    </div>
  )
}

const FORBIDDEN_COPY: Record<string, { title: string; body: string }> = {
  clinical: {
    title: "Clinical access required",
    body: "This area holds clinical records and is restricted to counsellors granted clinical access. Contact a platform admin if you believe you should have access.",
  },
  platform: {
    title: "Platform admin only",
    body: "This area is restricted to Minet platform administrators. If you believe you should have access, contact your administrator.",
  },
}

const FORBIDDEN_FALLBACK = {
  title: "No access",
  body: "You do not have permission to view this page. Contact your administrator if you believe this is a mistake.",
}

function Forbidden({ level }: { level: AccessLevel }) {
  const copy = FORBIDDEN_COPY[level] ?? FORBIDDEN_FALLBACK
  return (
    <div className="grid min-h-svh w-full place-items-center bg-bg p-6 text-fg">
      <div className="max-w-md space-y-3 text-center">
        <ShieldAlert className="mx-auto size-10 text-fg-muted" aria-hidden="true" />
        <h1 className="text-xl font-semibold">{copy.title}</h1>
        <p className="text-sm text-fg-muted">{copy.body}</p>
      </div>
    </div>
  )
}
