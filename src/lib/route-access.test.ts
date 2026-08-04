import { describe, expect, it } from "vitest"

import {
  type AccessContext,
  accessLevelFor,
  canAccessPath,
  DEFAULT_ACCESS_LEVEL,
  satisfies,
} from "@/lib/route-access"

const ANON: AccessContext = {
  isAuthenticated: false,
  hasClinicalScope: false,
  isPlatformAdmin: false,
}
const PLAIN_USER: AccessContext = {
  isAuthenticated: true,
  hasClinicalScope: false,
  isPlatformAdmin: false,
}
const COUNSELLOR: AccessContext = {
  isAuthenticated: true,
  hasClinicalScope: true,
  isPlatformAdmin: false,
}
const PLATFORM_ADMIN: AccessContext = {
  isAuthenticated: true,
  hasClinicalScope: false,
  isPlatformAdmin: true,
}

describe("accessLevelFor", () => {
  it("defaults unlisted paths to authed — new routes fail closed", () => {
    expect(DEFAULT_ACCESS_LEVEL).toBe("authed")
    for (const p of ["/clients", "/audit", "/documents", "/kpis", "/some/route/added/tomorrow"]) {
      expect(accessLevelFor(p)).toBe("authed")
    }
  })

  it("treats the auth section as public so sign-in stays reachable", () => {
    for (const p of ["/auth", "/auth/login", "/auth/set-password", "/auth/azure/callback"]) {
      expect(accessLevelFor(p)).toBe("public")
    }
  })

  it("keeps the root public (landing page renders for signed-out visitors)", () => {
    expect(accessLevelFor("/")).toBe("public")
  })

  it("does NOT let the root rule leak onto every path", () => {
    expect(accessLevelFor("/clients")).not.toBe("public")
  })

  it("gates clinical routes and their children", () => {
    expect(accessLevelFor("/cases")).toBe("clinical")
    expect(accessLevelFor("/cases/abc123")).toBe("clinical")
  })

  it("gates platform routes and their children", () => {
    expect(accessLevelFor("/tenants")).toBe("platform")
    expect(accessLevelFor("/tenants/abc123")).toBe("platform")
    expect(accessLevelFor("/tenants/new")).toBe("platform")
  })

  it("matches whole segments, not string prefixes", () => {
    expect(accessLevelFor("/cases-archive")).toBe("authed")
    expect(accessLevelFor("/tenants-report")).toBe("authed")
  })
})

describe("satisfies", () => {
  it("lets anyone reach public routes", () => {
    expect(satisfies("public", ANON)).toBe(true)
  })

  it("requires a session for authed routes", () => {
    expect(satisfies("authed", ANON)).toBe(false)
    expect(satisfies("authed", PLAIN_USER)).toBe(true)
  })

  it("requires the clinical scope for clinical routes", () => {
    expect(satisfies("clinical", PLAIN_USER)).toBe(false)
    expect(satisfies("clinical", COUNSELLOR)).toBe(true)
  })

  it("does not let platform admin imply clinical access", () => {
    expect(satisfies("clinical", PLATFORM_ADMIN)).toBe(false)
  })

  it("requires platform admin for platform routes", () => {
    expect(satisfies("platform", PLAIN_USER)).toBe(false)
    expect(satisfies("platform", PLATFORM_ADMIN)).toBe(true)
  })

  it("never grants a scoped route to an unauthenticated session", () => {
    const forgedAnon: AccessContext = {
      isAuthenticated: false,
      hasClinicalScope: true,
      isPlatformAdmin: true,
    }
    expect(satisfies("clinical", forgedAnon)).toBe(false)
    expect(satisfies("platform", forgedAnon)).toBe(false)
  })
})

describe("canAccessPath", () => {
  it("keeps a signed-out visitor out of the app but on the landing page", () => {
    expect(canAccessPath("/", ANON)).toBe(true)
    expect(canAccessPath("/auth/login", ANON)).toBe(true)
    expect(canAccessPath("/clients", ANON)).toBe(false)
  })

  it("hides PHI from an employer-side user", () => {
    expect(canAccessPath("/clients", PLAIN_USER)).toBe(true)
    expect(canAccessPath("/cases", PLAIN_USER)).toBe(false)
    expect(canAccessPath("/cases/abc123", PLAIN_USER)).toBe(false)
  })

  it("admits a counsellor to clinical but not to tenant admin", () => {
    expect(canAccessPath("/cases", COUNSELLOR)).toBe(true)
    expect(canAccessPath("/tenants", COUNSELLOR)).toBe(false)
  })

  it("admits a platform admin to tenants but not to PHI", () => {
    expect(canAccessPath("/tenants", PLATFORM_ADMIN)).toBe(true)
    expect(canAccessPath("/cases", PLATFORM_ADMIN)).toBe(false)
  })
})
