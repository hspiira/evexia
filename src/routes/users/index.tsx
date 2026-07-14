import { useState } from "react"

import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router"
import {
  BadgeCheck,
  Download,
  ExternalLink,
  KeyRound,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  ShieldOff,
  UserCog,
} from "lucide-react"

import { usersApi } from "@/api/endpoints/users"
import { EmptyState } from "@/components/common/EmptyState"
import { EntityListView, type ListColumn } from "@/components/common/EntityListView"
import {
  FilterBar,
  FilterButton,
  FilterChip,
  FilterSearch,
  FilterTrigger,
} from "@/components/common/FilterBar"
import { IconButton } from "@/components/common/IconButton"
import { PageShell } from "@/components/common/PageShell"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ROW_BORDER } from "@/components/common/tableStyles"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { UserFormSheet } from "@/components/UserFormSheet"
import { useCanWrite } from "@/hooks/useCanWrite"
import { useListPage } from "@/hooks/useListPage"
import { normalizeErrorMessage } from "@/lib/errors"
import { formatDate } from "@/lib/format"
import { enumOptions, enumParam, listSearchSchema } from "@/lib/search-params"
import type { User } from "@/types/entities"
import { AuthProvider, UserStatus } from "@/types/enums"

export const Route = createFileRoute("/users/")({
  component: UsersListPage,
  validateSearch: listSearchSchema({ status: enumParam(UserStatus) }),
})

const STATUS_OPTIONS = enumOptions(UserStatus, "All statuses")

const SECURITY_OPTIONS = [
  { value: "all", label: "Any security" },
  { value: "verified", label: "Email verified" },
  { value: "unverified", label: "Unverified email" },
  { value: "2fa-on", label: "2FA enabled" },
  { value: "2fa-off", label: "2FA disabled" },
] as const

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"]
type SecurityFilter = (typeof SECURITY_OPTIONS)[number]["value"]

const COLUMNS: ListColumn[] = [
  { header: "Email", sortField: "email" },
  { header: "Status", sortField: "status" },
  { header: "Email verified", className: "text-fg/65" },
  { header: "2FA", className: "text-fg/65" },
  { header: "Sign-in", className: "text-fg/65" },
  { header: "Last login", sortField: "last_login_at" },
]

function UsersListPage() {
  const searchParams = useSearch({ from: "/users/" })
  const navigate = useNavigate({ from: "/users/" })
  const activeStatus = searchParams.status
  const [security, setSecurity] = useState<SecurityFilter>("all")
  const canWrite = useCanWrite()

  const {
    searchInput,
    setSearchInput,
    addOpen,
    setAddOpen,
    page,
    setPage,
    sort,
    toggleSort,
    limit,
    activeSearch,
    query,
    items: allItems,
    total,
    loading,
  } = useListPage<User>({
    from: "/users/",
    resource: "users",
    listFn: usersApi.list,
    extraParams: { status: activeStatus },
  })
  const items = filterBySecurity(allItems, security)
  const error = query.isError ? normalizeErrorMessage(query.error, "Failed to load data") : null
  const hasFilters = Boolean(activeSearch) || Boolean(activeStatus) || security !== "all"

  const handleStatusChange = (next: StatusFilter) => {
    const status = next === "all" ? undefined : next
    navigate({ search: (prev) => ({ ...prev, status }), replace: true })
    setPage(1)
  }

  return (
    <PageShell
      icon={UserCog}
      breadcrumb="People · Platform Users"
      actions={
        <>
          <IconButton label="Export" icon={Download} />
          <span className="mx-1 h-4 w-px bg-fg/15" aria-hidden />
          {canWrite && (
            <Button size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => setAddOpen(true)}>
              <Plus className="size-3.5" />
              Add user
            </Button>
          )}
        </>
      }
    >
      <FilterBar>
        <FilterButton
          options={[
            { id: "status", label: "Status" },
            { id: "security", label: "Security" },
          ]}
        />
        {activeStatus ? (
          <FilterChip
            label={`Status is ${activeStatus}`}
            onRemove={() => handleStatusChange("all")}
          />
        ) : null}
        <FilterTrigger
          label="All statuses"
          value={(activeStatus ?? "all") as StatusFilter}
          options={STATUS_OPTIONS}
          onChange={handleStatusChange}
        />
        <FilterTrigger
          icon={ShieldCheck}
          label="Security"
          value={security}
          options={SECURITY_OPTIONS}
          onChange={setSecurity}
        />
        <div className="ml-auto" />
        <FilterSearch
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search users…"
        />
      </FilterBar>

      <UserFormSheet open={addOpen} onOpenChange={setAddOpen} />

      <EntityListView<User>
        columns={COLUMNS}
        items={items}
        rowKey={(row) => row.id}
        renderRow={(row) => <UserRow row={row} />}
        loading={loading}
        error={error}
        onRetry={() => void query.refetch()}
        skeletonCols={5}
        empty={
          <EmptyState
            icon={UserCog}
            title={hasFilters ? "No users match your filters" : "No users yet"}
            description={
              hasFilters
                ? "Try a different search or clear filters."
                : "Add the first platform user to get started."
            }
            action={
              hasFilters || !canWrite ? null : (
                <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" />
                  Add user
                </Button>
              )
            }
          />
        }
        sort={sort}
        onToggleSort={toggleSort}
        page={page}
        total={total}
        limit={limit}
        onPageChange={setPage}
      />
    </PageShell>
  )
}

function UserRow({ row }: { row: User }) {
  return (
    <TableRow className={`group cursor-default ${ROW_BORDER}`}>
      <TableCell className="px-3">
        <Checkbox aria-label={`Select ${row.email}`} onClick={(e) => e.stopPropagation()} />
      </TableCell>
      <TableCell>
        <Link
          to="/users/$userId"
          params={{ userId: row.id }}
          className="flex items-center gap-2.5"
        >
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center bg-primary/10 text-primary"
          >
            <UserCog className="size-3" />
          </span>
          <span className="text-sm font-medium text-fg group-hover:text-primary">
            {row.email}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <StatusBadge status={row.status} />
      </TableCell>
      <TableCell>
        {row.is_email_verified ? (
          <span className="inline-flex items-center gap-1 text-xs text-fg">
            <BadgeCheck className="size-3 text-primary" /> Verified
          </span>
        ) : (
          <span className="text-xs text-fg/55">Unverified</span>
        )}
      </TableCell>
      <TableCell>
        {row.is_two_factor_enabled ? (
          <span className="inline-flex items-center gap-1 text-xs text-fg">
            <ShieldCheck className="size-3 text-primary" /> On
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-fg/55">
            <ShieldOff className="size-3" /> Off
          </span>
        )}
      </TableCell>
      <TableCell>
        {row.auth_provider === AuthProvider.AZURE_AD ? (
          <span className="inline-flex items-center gap-1 text-xs text-fg">
            <KeyRound className="size-3 text-primary" /> Microsoft
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-fg/55">
            <KeyRound className="size-3" /> Password
          </span>
        )}
      </TableCell>
      <TableCell className="text-sm text-fg/75">
        {row.last_login_at ? formatDate(row.last_login_at) : "—"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Link
            to="/users/$userId"
            params={{ userId: row.id }}
            aria-label={`Open ${row.email}`}
            className="grid size-7 place-items-center rounded-sm text-fg/65 hover:bg-surface-hover hover:text-fg"
          >
            <ExternalLink className="size-3.5" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-label={`More actions for ${row.email}`} className="size-7 p-0 text-fg/65"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/users/$userId" params={{ userId: row.id }}>
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Suspend
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

function filterBySecurity(items: User[], filter: SecurityFilter): User[] {
  switch (filter) {
    case "verified":
      return items.filter((u) => u.is_email_verified)
    case "unverified":
      return items.filter((u) => !u.is_email_verified)
    case "2fa-on":
      return items.filter((u) => u.is_two_factor_enabled)
    case "2fa-off":
      return items.filter((u) => !u.is_two_factor_enabled)
    default:
      return items
  }
}
