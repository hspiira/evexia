/**
 * Route access rules — single source of truth for who may reach what.
 * RouteGuard enforces it; AppSidebar filters nav by it.
 *
 * UX layer, not the security boundary — the API enforces the same rules
 * server-side. This just avoids offering links that lead to a 403.
 */

export type AccessLevel = "public" | "authed" | "clinical" | "platform"

export interface RouteAccessRule {
  prefix: string
  level: AccessLevel
}

/** Longest prefix wins. Unlisted paths fall through to `authed` — fail closed. */
export const ROUTE_ACCESS: ReadonlyArray<RouteAccessRule> = [
  // Must stay reachable without a session, or sign-in is impossible.
  { prefix: "/auth", level: "public" },
  // Renders marketing when signed out, dashboard when signed in.
  { prefix: "/", level: "public" },

  { prefix: "/cases", level: "clinical" },
  { prefix: "/tenants", level: "platform" },
]

export const DEFAULT_ACCESS_LEVEL: AccessLevel = "authed"

/**
 * `/` is special-cased to the exact root: as a prefix it would match every
 * path, resolving everything to `public` and silently disabling the scheme.
 */
export function accessLevelFor(pathname: string): AccessLevel {
  if (pathname === "/") return "public"

  let best: RouteAccessRule | null = null
  for (const rule of ROUTE_ACCESS) {
    if (rule.prefix === "/") continue
    const isMatch = pathname === rule.prefix || pathname.startsWith(rule.prefix + "/")
    if (!isMatch) continue
    if (!best || rule.prefix.length > best.prefix.length) best = rule
  }
  return best?.level ?? DEFAULT_ACCESS_LEVEL
}

export interface AccessContext {
  isAuthenticated: boolean
  hasClinicalScope: boolean
  isPlatformAdmin: boolean
}

export function satisfies(level: AccessLevel, ctx: AccessContext): boolean {
  switch (level) {
    case "public":
      return true
    case "authed":
      return ctx.isAuthenticated
    case "clinical":
      return ctx.isAuthenticated && ctx.hasClinicalScope
    case "platform":
      return ctx.isAuthenticated && ctx.isPlatformAdmin
  }
}

export function canAccessPath(pathname: string, ctx: AccessContext): boolean {
  return satisfies(accessLevelFor(pathname), ctx)
}

export function platformTenantId(): string {
  return (import.meta.env.VITE_PLATFORM_TENANT_ID ?? "").trim()
}

/**
 * Unset (single-tenant / dev) disables the gate rather than locking everyone
 * out — mirrors the backend's opt-in REQUIRE_PLATFORM_ADMIN_FOR_TENANT_CREATION.
 */
export function isPlatformAdminTenant(currentTenantId: string | null): boolean {
  const required = platformTenantId()
  if (!required) return true // not configured — gate disabled
  return currentTenantId === required
}
