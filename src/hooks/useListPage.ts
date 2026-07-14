/**
 * Owns the state every list route repeated by hand: page, sort, debounced
 * search, the `?new=1` sheet-open + strip effect, the search→URL sync effect,
 * and the `useEntityList` query. Pages keep their own columns, row renderers,
 * and entity-specific filter params (passed via `extraParams`).
 *
 * TanStack's typed `useSearch`/`useNavigate` want a literal route id; this hook
 * takes it as a string and casts internally, so callers pass e.g. "/contracts/".
 */

import { useCallback, useEffect, useState } from "react"

import { useNavigate, useSearch } from "@tanstack/react-router"

import { nextSort, type SortState } from "@/components/common/SortHeader"
import { useDebouncedValue } from "@/hooks/useDebouncedValue"
import { useEntityList } from "@/lib/queries"
import type { ListParams, PaginatedResponse } from "@/types/api"

interface ListSearch {
  new?: boolean
  search?: string
}

export interface UseListPageOptions<T> {
  /** Route id, e.g. "/contracts/". */
  from: string
  resource: string
  listFn: (params: ListParams) => Promise<PaginatedResponse<T>>
  /** Entity-specific server filter params (e.g. `{ status }`). */
  extraParams?: Record<string, unknown>
  limit?: number
  defaultSort?: SortState
}

export function useListPage<T>({
  from,
  resource,
  listFn,
  extraParams,
  limit = 20,
  defaultSort,
}: UseListPageOptions<T>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchParams = useSearch({ from: from as any }) as ListSearch
  // TanStack's typed navigate over a dynamic route id — cast to a loose signature.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigate = useNavigate({ from: from as any }) as (opts: any) => void

  const [searchInput, setSearchInput] = useState(searchParams.search ?? "")
  const [addOpen, setAddOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>(defaultSort ?? { field: undefined, desc: false })

  const toggleSort = useCallback((field: string) => {
    setSort((prev) => nextSort(prev, field))
    setPage(1)
  }, [])

  const debouncedSearch = useDebouncedValue(searchInput.trim(), 300)
  const activeSearch = debouncedSearch || undefined

  // Open the create sheet from ?new=1, then strip the param.
  useEffect(() => {
    if (searchParams.new) {
      setAddOpen(true)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ search: (prev: any) => ({ ...prev, new: undefined }), replace: true })
    }
  }, [searchParams.new, navigate])

  // Sync the debounced search box into the URL.
  useEffect(() => {
    if (activeSearch !== searchParams.search) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ search: (prev: any) => ({ ...prev, search: activeSearch }), replace: true })
      setPage(1)
    }
  }, [activeSearch, navigate, searchParams.search])

  const query = useEntityList<T>({
    resource,
    params: {
      page,
      limit,
      search: activeSearch,
      sort_by: sort.field,
      sort_desc: sort.field ? sort.desc : undefined,
      ...extraParams,
    },
    listFn,
  })

  return {
    searchParams,
    navigate,
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
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    loading: query.isPending,
  }
}
