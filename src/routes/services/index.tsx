import { useState } from "react"

import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router"
import {
  Download,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Wrench,
} from "lucide-react"

import { servicesApi } from "@/api/endpoints/services"
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
import { humanizeServiceType, ServiceFormSheet } from "@/components/ServiceFormSheet"
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
import { useListPage } from "@/hooks/useListPage"
import { normalizeErrorMessage } from "@/lib/errors"
import { enumParam, listSearchSchema } from "@/lib/search-params"
import type { Service } from "@/types/entities"
import { BaseStatus } from "@/types/enums"

export const Route = createFileRoute("/services/")({
  component: ServicesListPage,
  validateSearch: listSearchSchema({ status: enumParam(BaseStatus) }),
})

// Curated subset — BaseStatus also has Pending/Deleted which aren't user filters here.
const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: BaseStatus.ACTIVE, label: "Active" },
  { value: BaseStatus.INACTIVE, label: "Inactive" },
  { value: BaseStatus.ARCHIVED, label: "Archived" },
] as const

const GROUP_OPTIONS = [
  { value: "all", label: "Any size" },
  { value: "individual", label: "Individual only" },
  { value: "group", label: "Group enabled" },
] as const

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"]
type GroupFilter = (typeof GROUP_OPTIONS)[number]["value"]

const COLUMNS: ListColumn[] = [
  { header: "Service", sortField: "name" },
  { header: "Type", sortField: "service_type" },
  { header: "Status", sortField: "status" },
  { header: "Duration", sortField: "duration_minutes" },
  { header: "Group", className: "text-fg/65" },
]

function ServicesListPage() {
  const searchParams = useSearch({ from: "/services/" })
  const navigate = useNavigate({ from: "/services/" })
  const activeStatus = searchParams.status
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all")

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
  } = useListPage<Service>({
    from: "/services/",
    resource: "services",
    listFn: servicesApi.list,
    extraParams: { status: activeStatus },
  })
  const items = filterByGroup(allItems, groupFilter)
  const error = query.isError ? normalizeErrorMessage(query.error, "Failed to load data") : null
  const hasFilters = Boolean(activeSearch) || Boolean(activeStatus) || groupFilter !== "all"

  const handleStatusChange = (next: StatusFilter) => {
    const status = next === "all" ? undefined : next
    navigate({ search: (prev) => ({ ...prev, status }), replace: true })
    setPage(1)
  }

  return (
    <PageShell
      icon={Wrench}
      breadcrumb="Catalog · Services"
      actions={
        <>
          <IconButton label="Export" icon={Download} />
          <span className="mx-1 h-4 w-px bg-fg/15" aria-hidden />
          <Button size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" />
            Add service
          </Button>
        </>
      }
    >
      <FilterBar>
        <FilterButton
          options={[
            { id: "status", label: "Status" },
            { id: "type", label: "Type" },
            { id: "group", label: "Group size" },
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
          label="Any size"
          value={groupFilter}
          options={GROUP_OPTIONS}
          onChange={setGroupFilter}
        />
        <div className="ml-auto" />
        <FilterSearch
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search services…"
        />
      </FilterBar>

      <ServiceFormSheet open={addOpen} onOpenChange={setAddOpen} />

      <EntityListView<Service>
        columns={COLUMNS}
        items={items}
        rowKey={(row) => row.id}
        renderRow={(row) => <ServiceRow row={row} />}
        loading={loading}
        error={error}
        onRetry={() => void query.refetch()}
        skeletonCols={5}
        empty={
          <EmptyState
            icon={Wrench}
            title={hasFilters ? "No services match your filters" : "No services yet"}
            description={
              hasFilters
                ? "Try a different search or clear filters."
                : "Add an intervention to the catalog so contracts can cover it."
            }
            action={
              hasFilters ? null : (
                <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" />
                  Add service
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

function ServiceRow({ row }: { row: Service }) {
  const allowGroup = Boolean(row.group_settings?.allow_group_sessions)
  return (
    <TableRow className={`group cursor-default ${ROW_BORDER}`}>
      <TableCell className="px-3">
        <Checkbox aria-label={`Select ${row.name}`} onClick={(e) => e.stopPropagation()} />
      </TableCell>
      <TableCell>
        <Link
          to="/services/$serviceId"
          params={{ serviceId: row.id }}
          className="flex items-center gap-2.5"
        >
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center bg-primary/10 text-primary"
          >
            <Wrench className="size-3" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-fg group-hover:text-primary">
              {row.name}
            </span>
            {row.description ? (
              <span className="block truncate text-xs text-fg/55">{row.description}</span>
            ) : null}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        {row.service_type ? (
          <span className="inline-flex items-center rounded-sm border border-fg/15 bg-bg px-1.5 py-0.5 text-[11px] font-medium text-fg/75">
            {humanizeServiceType(row.service_type)}
          </span>
        ) : (
          <span className="text-fg/40">—</span>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge status={row.status} />
      </TableCell>
      <TableCell className="font-mono text-sm text-fg/75">
        {row.duration_minutes != null ? `${row.duration_minutes}m` : "—"}
      </TableCell>
      <TableCell>
        {allowGroup ? (
          <span className="text-xs text-fg">
            {row.group_settings?.min_group_size ?? "?"}–
            {row.group_settings?.max_group_size ?? "?"}
          </span>
        ) : (
          <span className="text-xs text-fg/55">Individual</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Link
            to="/services/$serviceId"
            params={{ serviceId: row.id }}
            aria-label={`Open ${row.name}`}
            className="grid size-7 place-items-center rounded-sm text-fg/65 hover:bg-surface-hover hover:text-fg"
          >
            <ExternalLink className="size-3.5" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-label={`More actions for ${row.name}`} className="size-7 p-0 text-fg/65"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/services/$serviceId" params={{ serviceId: row.id }}>
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

function filterByGroup(items: Service[], filter: GroupFilter): Service[] {
  if (filter === "all") return items
  if (filter === "group") return items.filter((s) => s.group_settings?.allow_group_sessions)
  return items.filter((s) => !s.group_settings?.allow_group_sessions)
}
