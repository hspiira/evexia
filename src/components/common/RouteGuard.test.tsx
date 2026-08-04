import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/utils"

const navigate = vi.fn()
let pathname = "/clients"
let auth = { isAuthenticated: true, isLoading: false }
let clinical = { hasScope: false, isLoading: false }
let tenantId: string | null = "tenant-1"

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useRouterState: ({ select }: { select: (s: unknown) => unknown }) =>
    select({ location: { pathname } }),
}))

vi.mock("@/hooks/useCanWrite", () => ({
  useHasClinicalScope: () => clinical,
}))

vi.mock("@/store/slices/authSlice", () => ({
  useAuthStore: (sel: (s: typeof auth) => unknown) => sel(auth),
}))

vi.mock("@/store/slices/tenantSlice", () => ({
  useTenantStore: (sel: (s: { currentTenantId: string | null }) => unknown) =>
    sel({ currentTenantId: tenantId }),
}))

const { RouteGuard } = await import("@/components/common/RouteGuard")

function renderAt(path: string) {
  pathname = path
  return renderWithProviders(
    <RouteGuard>
      <div>protected content</div>
    </RouteGuard>,
  )
}

beforeEach(() => {
  navigate.mockClear()
  pathname = "/clients"
  auth = { isAuthenticated: true, isLoading: false }
  clinical = { hasScope: false, isLoading: false }
  tenantId = "tenant-1"
})

describe("RouteGuard — session still resolving", () => {
  it("shows a spinner rather than flashing content or bouncing to login", () => {
    auth = { isAuthenticated: false, isLoading: true }
    renderAt("/clients")

    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.queryByText("protected content")).not.toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe("RouteGuard — unauthenticated", () => {
  it("redirects to login and preserves the intended destination", () => {
    auth = { isAuthenticated: false, isLoading: false }
    renderAt("/clients")

    expect(navigate).toHaveBeenCalledTimes(1)
    const arg = navigate.mock.calls[0][0]
    expect(arg.to).toBe("/auth/login")
    expect(arg.replace).toBe(true)
    expect(screen.queryByText("protected content")).not.toBeInTheDocument()
  })

  it("renders public routes without a session", () => {
    auth = { isAuthenticated: false, isLoading: false }
    renderAt("/auth/login")

    expect(screen.getByText("protected content")).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })
})

describe("RouteGuard — authenticated but unentitled", () => {
  it("blocks a non-clinical user from PHI without bouncing to login", () => {
    renderAt("/cases")

    expect(screen.getByText("Clinical access required")).toBeInTheDocument()
    expect(screen.queryByText("protected content")).not.toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it("admits a counsellor to PHI", () => {
    clinical = { hasScope: true, isLoading: false }
    renderAt("/cases")

    expect(screen.getByText("protected content")).toBeInTheDocument()
  })

  it("waits for the scope query before deciding on a clinical route", () => {
    clinical = { hasScope: false, isLoading: true }
    renderAt("/cases")

    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.queryByText("Clinical access required")).not.toBeInTheDocument()
  })

  it("does not wait on the scope query for non-clinical routes", () => {
    clinical = { hasScope: false, isLoading: true }
    renderAt("/clients")

    expect(screen.getByText("protected content")).toBeInTheDocument()
  })
})

describe("RouteGuard — platform admin", () => {
  it("blocks a non-platform tenant from /tenants", () => {
    vi.stubEnv("VITE_PLATFORM_TENANT_ID", "platform-tenant")
    tenantId = "some-other-tenant"
    renderAt("/tenants")

    expect(screen.getByText("Platform admin only")).toBeInTheDocument()
    vi.unstubAllEnvs()
  })

  it("admits the platform tenant", () => {
    vi.stubEnv("VITE_PLATFORM_TENANT_ID", "platform-tenant")
    tenantId = "platform-tenant"
    renderAt("/tenants")

    expect(screen.getByText("protected content")).toBeInTheDocument()
    vi.unstubAllEnvs()
  })

  it("skips the gate when no platform tenant is configured", () => {
    vi.stubEnv("VITE_PLATFORM_TENANT_ID", "")
    tenantId = "any-tenant"
    renderAt("/tenants")

    expect(screen.getByText("protected content")).toBeInTheDocument()
    vi.unstubAllEnvs()
  })
})
