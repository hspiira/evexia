/**
 * Services API Endpoints
 *
 * Shapes mirror BE OpenAPI (see `@/api/generated`).
 * `is_group_service` and `max_participants` are flat on the BE — there is no
 * `group_settings` wrapper or `min_group_size`. Group settings are configured
 * via a dedicated PATCH `/services/{id}/group-settings` route.
 */

import type { ServiceCreate, ServiceUpdate, ServiceUpdateGroupSettings } from '@/api/generated'

import apiClient from '../client'
import type { Service } from '../types'
import { makeCrudEndpoints } from './_factory'

export type { ServiceCreate, ServiceUpdate, ServiceUpdateGroupSettings }
/** @deprecated use `ServiceUpdateGroupSettings` from `@/api/generated`. */
export type GroupSettingsUpdate = ServiceUpdateGroupSettings

export const servicesApi = {
  ...makeCrudEndpoints<Service, ServiceCreate, ServiceUpdate>('services'),

  /**
   * Activate service
   */
  async activate(serviceId: string): Promise<Service> {
    return apiClient.post<Service>(`/services/${serviceId}/activate`, {})
  },

  /**
   * Deactivate service
   */
  async deactivate(serviceId: string): Promise<Service> {
    return apiClient.post<Service>(`/services/${serviceId}/deactivate`, {})
  },

  /**
   * Archive service
   */
  async archive(serviceId: string): Promise<Service> {
    return apiClient.post<Service>(`/services/${serviceId}/archive`, {})
  },

  /**
   * Restore service from archive
   */
  async restore(serviceId: string): Promise<Service> {
    return apiClient.post<Service>(`/services/${serviceId}/restore`, {})
  },

  /**
   * Update group settings
   */
  async updateGroupSettings(serviceId: string, settings: GroupSettingsUpdate): Promise<Service> {
    return apiClient.patch<Service>(`/services/${serviceId}/group-settings`, settings)
  },
}
