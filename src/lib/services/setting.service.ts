import { apiClient } from '../api/client';
import type {
  Setting,
  CreateSettingDto,
  UpdateSettingDto,
  BatchUpdateSettingDto,
} from '../types/setting.types';

/**
 * Setting Service
 * Handles all CRUD operations for user settings
 */
export class SettingService {
  private readonly basePath = '/settings';

  /**
   * Get all settings for the authenticated user
   */
  async getAll(): Promise<Setting[]> {
    return apiClient.get<Setting[]>(this.basePath);
  }

  /**
   * Create a new setting
   */
  async create(data: CreateSettingDto): Promise<Setting> {
    return apiClient.post<Setting, CreateSettingDto>(this.basePath, data);
  }

  /**
   * Create multiple settings at once
   */
  async createBatch(settings: CreateSettingDto[]): Promise<Setting[]> {
    return apiClient.post<Setting[], { settings: CreateSettingDto[] }>(
      `${this.basePath}/batch`,
      { settings }
    );
  }

  /**
   * Update an existing setting
   */
  async update(id: string, data: UpdateSettingDto): Promise<Setting> {
    return apiClient.patch<Setting, UpdateSettingDto>(
      `${this.basePath}/${id}`,
      data
    );
  }

  /**
   * Update multiple settings at once
   */
  async updateBatch(updates: BatchUpdateSettingDto[]): Promise<Setting[]> {
    return apiClient.patch<Setting[], { updates: BatchUpdateSettingDto[] }>(
      `${this.basePath}/batch/update`,
      { updates }
    );
  }

  /**
   * Delete a setting
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${this.basePath}/${id}`);
  }
}

// Export singleton instance
export const settingService = new SettingService();

// Export default
export default settingService;
