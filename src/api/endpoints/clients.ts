/**
 * Clients API Endpoints
 *
 * `ClientCreate` does NOT include `tier` — BE intentionally separates tier
 * assignment as a dedicated `PATCH /clients/{id}/tier` call (with audit).
 * Use `setTier()` after `create()` to set initial tier.
 */

import type { ClientCreate, ClientUpdate, Schemas } from '@/api/generated'
import type { ClientTier } from '@/types/enums'

import apiClient from '../client'
import type {
  Client,
  ClientBillingAddress,
  ClientContactInfo,
  ClientStats,
  ClientTag,
  ListParams,
  PaginatedResponse,
} from '../types'
import { makeCrudEndpoints, makeLifecycleEndpoints } from './_factory'

export type { ClientCreate, ClientUpdate }
export type ClientUpdateTier = Schemas['ClientUpdateTier']

export interface ClientListParams extends ListParams {
  tier?: ClientTier
}

export const clientsApi = {
  ...makeCrudEndpoints<Client, ClientCreate, ClientUpdate, ClientListParams>('clients'),
  ...makeLifecycleEndpoints<Client>('clients'),

  /**
   * Set engagement tier. BE auditing keys off this dedicated endpoint.
   * Pass `tier: null` to clear.
   */
  async setTier(clientId: string, tier: ClientTier | null): Promise<Client> {
    return apiClient.patch<Client>(`/clients/${clientId}/tier`, { tier })
  },

  /**
   * Update contact info only
   */
  async updateContactInfo(clientId: string, data: ClientContactInfo): Promise<Client> {
    return apiClient.patch<Client>(`/clients/${clientId}/contact-info`, data)
  },

  /**
   * Update billing address only
   */
  async updateBillingAddress(clientId: string, data: ClientBillingAddress): Promise<Client> {
    return apiClient.patch<Client>(`/clients/${clientId}/billing-address`, data)
  },

  /**
   * Mark client as verified (backend requires verified_by query param = current user ID)
   */
  async verify(clientId: string, verifiedBy: string): Promise<Client> {
    return apiClient.post<Client>(
      `/clients/${clientId}/verify?verified_by=${encodeURIComponent(verifiedBy)}`
    )
  },

  /**
   * Get client stats (child count, contracts, verification)
   */
  async getStats(clientId: string): Promise<ClientStats> {
    return apiClient.get<ClientStats>(`/clients/${clientId}/stats`)
  },

  /**
   * Get paginated child clients
   */
  async getChildren(
    clientId: string,
    params?: ListParams
  ): Promise<PaginatedResponse<Client>> {
    return apiClient.get<PaginatedResponse<Client>>(`/clients/${clientId}/children`, params as Record<string, unknown>)
  },

  /**
   * Check client name availability
   */
  async checkNameAvailability(name: string): Promise<{ available: boolean }> {
    return apiClient.get<{ available: boolean }>(`/clients/check-name/${encodeURIComponent(name)}`)
  },

  /**
   * Get tags assigned to a client
   */
  async getTags(clientId: string): Promise<ClientTag[]> {
    const res = await apiClient.get<{ items: ClientTag[] } | ClientTag[]>(`/clients/${clientId}/tags`)
    return Array.isArray(res) ? res : (res.items ?? [])
  },
}
