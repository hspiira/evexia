import { useState } from "react"

import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router"
import {
  Calendar,
  Download,
  ExternalLink,
  FileSignature,
  MoreHorizontal,
  Plus,
} from "lucide-react"

import { contractsApi } from "@/api/endpoints/contracts"
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
import { ContractFormSheet } from "@/components/ContractFormSheet"
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
import { useCanWrite } from "@/hooks/useCanWrite"
import { useListPage } from "@/hooks/useListPage"
import { normalizeErrorMessage } from "@/lib/errors"
import { formatMoney } from "@/lib/format"
import { enumOptions, enumParam, listSearchSchema } from "@/lib/search-params"
import type { Contract } from "@/types/entities"
import { ContractStatus } from "@/types/enums"

export const Route = createFileRoute("/contracts/")({
  component: ContractsListPage,
  validateSearch: listSearchSchema({ status: enumParam(ContractStatus) }),
})

const STATUS_OPTIONS = enumOptions(ContractStatus, "All statuses")

const RENEWAL_OPTIONS = [
  { value: "all", label: "All renewal windows" },
  { value: "30d", label: "Renews in 30 days" },
  { value: "90d", label: "Renews in 90 days" },
  { value: "expired", label: "Already expired" },
] as const

type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"]
type RenewalFilter = (typeof RENEWAL_OPTIONS)[number]["value"]

const COLUMNS: ListColumn[] = [
  { header: "Number", sortField: "contract_number" },
  { header: "Client", sortField: "client_id" },
  { header: "Status", sortField: "status" },
  { header: "Start", sortField: "start_date" },
  { header: "End / Renewal", sortField: "end_date" },
  { header: "Billing", className: "text-fg/65" },
]

function ContractsListPage() {
  const searchParams = useSearch({ from: "/contracts/" })
  const navigate = useNavigate({ from: "/contracts/" })
  const activeStatus = searchParams.status
  const [renewal, setRenewal] = useState<RenewalFilter>("all")
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
  } = useListPage<Contract>({
    from: "/contracts/",
    resource: "contracts",
    listFn: contractsApi.list,
    extraParams: { status: activeStatus },
  })
  const items = filterByRenewal(allItems, renewal)
  const error = query.isError ? normalizeErrorMessage(query.error, "Failed to load data") : null
  const hasFilters = Boolean(activeSearch) || Boolean(activeStatus) || renewal !== "all"

  const handleStatusChange = (next: StatusFilter) => {
    const status = next === "all" ? undefined : next
    navigate({ search: (prev) => ({ ...prev, status }), replace: true })
    setPage(1)
  }

  return (
    <PageShell
      icon={FileSignature}
      breadcrumb="Commercial · Contracts"
      actions={
        <>
          <IconButton label="Export" icon={Download} />
          <span className="mx-1 h-4 w-px bg-fg/15" aria-hidden />
          {canWrite && (
            <Button size="sm" className="h-7 gap-1.5 px-2.5" onClick={() => setAddOpen(true)}>
              <Plus className="size-3.5" />
              Add contract
            </Button>
          )}
        </>
      }
    >
      <FilterBar>
        <FilterButton
          options={[
            { id: "status", label: "Status" },
            { id: "renewal", label: "Renewal window" },
            { id: "client", label: "Client" },
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
          icon={Calendar}
          label="Renewal window"
          value={renewal}
          options={RENEWAL_OPTIONS}
          onChange={setRenewal}
        />
        <div className="ml-auto" />
        <FilterSearch
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search contracts…"
        />
      </FilterBar>

      <ContractFormSheet open={addOpen} onOpenChange={setAddOpen} />

      <EntityListView<Contract>
        columns={COLUMNS}
        items={items}
        rowKey={(row) => row.id}
        renderRow={(row) => <ContractRow row={row} />}
        loading={loading}
        error={error}
        onRetry={() => void query.refetch()}
        skeletonCols={6}
        empty={
          <EmptyState
            icon={FileSignature}
            title={hasFilters ? "No contracts match your filters" : "No contracts yet"}
            description={
              hasFilters
                ? "Try a different search or clear filters."
                : "Add your first contract to start tracking lifecycle and billing."
            }
            action={
              hasFilters || !canWrite ? null : (
                <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" />
                  Add contract
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

function ContractRow({ row }: { row: Contract }) {
  const number = row.contract_number ?? row.id.slice(0, 8)
  const billing = formatBilling(row)
  const ending = row.renewal_date ?? row.end_date ?? null
  return (
    <TableRow className={`group cursor-default ${ROW_BORDER}`}>
      <TableCell className="px-3">
        <Checkbox aria-label={`Select ${number}`} onClick={(e) => e.stopPropagation()} />
      </TableCell>
      <TableCell>
        <Link
          to="/contracts/$contractId"
          params={{ contractId: row.id }}
          className="flex items-center gap-2.5"
        >
          <span
            aria-hidden
            className="grid size-6 shrink-0 place-items-center bg-primary/10 font-mono text-[10px] font-semibold text-primary"
          >
            <FileSignature className="size-3" />
          </span>
          <span className="font-mono text-sm font-medium text-fg group-hover:text-primary">
            {number}
          </span>
        </Link>
      </TableCell>
      <TableCell>
        <Link
          to="/clients/$clientId"
          params={{ clientId: row.client_id }}
          className="text-sm text-fg hover:text-primary"
        >
          {row.client_id.slice(0, 8)}
        </Link>
      </TableCell>
      <TableCell>
        <StatusBadge status={row.status} />
      </TableCell>
      <TableCell className="text-sm text-fg/75">{row.start_date}</TableCell>
      <TableCell>
        {ending ? (
          <span className="block min-w-0">
            <span className="block truncate text-sm text-fg">{ending}</span>
            <span className="block truncate text-xs text-fg/55">
              {row.renewal_date ? "Renewal" : "End"}
            </span>
          </span>
        ) : (
          <span className="text-fg/40">—</span>
        )}
      </TableCell>
      <TableCell>
        {billing ? (
          <span className="block min-w-0">
            <span className="block truncate font-mono text-sm text-fg">{billing.amount}</span>
            <span className="block truncate text-xs text-fg/55">{billing.frequency}</span>
          </span>
        ) : (
          <span className="text-fg/40">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Link
            to="/contracts/$contractId"
            params={{ contractId: row.id }}
            aria-label={`Open ${number}`}
            className="grid size-7 place-items-center rounded-sm text-fg/65 hover:bg-surface-hover hover:text-fg"
          >
            <ExternalLink className="size-3.5" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-label={`More actions for ${number}`} className="size-7 p-0 text-fg/65"><MoreHorizontal className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/contracts/$contractId" params={{ contractId: row.id }}>
                  View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/clients/$clientId" params={{ clientId: row.client_id }}>
                  View client
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Terminate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  )
}

function filterByRenewal(items: Contract[], window: RenewalFilter): Contract[] {
  if (window === "all") return items
  const now = new Date()
  if (window === "expired") {
    return items.filter((c) => {
      const end = c.end_date ? new Date(c.end_date) : null
      return end ? end < now : false
    })
  }
  const days = window === "30d" ? 30 : 90
  const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  return items.filter((c) => {
    const target = c.renewal_date ?? c.end_date
    if (!target) return false
    const d = new Date(target)
    return d >= now && d <= horizon
  })
}

function formatBilling(c: Contract): { amount: string; frequency: string } | null {
  if (c.billing_amount == null && !c.billing_frequency) return null
  const amount =
    c.billing_amount != null
      ? formatMoney(c.billing_amount, c.currency)
      : "—"
  const frequency = c.billing_frequency ?? "—"
  return { amount, frequency }
}
