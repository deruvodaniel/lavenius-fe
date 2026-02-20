/**
 * Setting Types
 * Types for the settings API matching the backend definitions
 */

// ==================== Enums ====================

export enum SettingType {
  DUE_PAYMENT_REMINDER = 'due_payment_reminder',
  NEXT_SESSION_REMINDER = 'next_session_reminder',
  DAY_OFF = 'day_off',
}

export enum PaymentReminderFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
}

// ==================== Config Interfaces ====================

export interface DayOffConfig {
  fromDate: string; // ISO date string (YYYY-MM-DD)
  toDate: string;   // ISO date string (YYYY-MM-DD)
}

export interface DuePaymentReminderConfig {
  frequency: PaymentReminderFrequency;
  remindDuePaymentLimit: number; // Limit number of unpaid payments
  message: string;
}

export interface NextSessionReminderConfig {
  hoursBeforeSession: number; // Hours before the session
  message: string;
}

// ==================== Therapist Info ====================

export interface TherapistInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// ==================== Setting Response Types ====================

interface BaseSettingResponse {
  id: string;
  active: boolean;
  description?: string;
  therapist?: TherapistInfo;
}

export type DayOffSetting = BaseSettingResponse & {
  type: SettingType.DAY_OFF;
  config: DayOffConfig;
};

export type DuePaymentReminderSetting = BaseSettingResponse & {
  type: SettingType.DUE_PAYMENT_REMINDER;
  config: DuePaymentReminderConfig;
};

export type NextSessionReminderSetting = BaseSettingResponse & {
  type: SettingType.NEXT_SESSION_REMINDER;
  config: NextSessionReminderConfig;
};

export type Setting = DayOffSetting | DuePaymentReminderSetting | NextSessionReminderSetting;

// ==================== Create/Update DTOs ====================

/**
 * Base interface for creating settings.
 * Note: therapistId is added automatically by the backend from the authenticated user context,
 * so it's not required in the frontend DTO.
 */
interface BaseCreateSettingDto {
  active: boolean;
  description?: string;
}

export type CreateDayOffSettingDto = BaseCreateSettingDto & {
  type: SettingType.DAY_OFF;
  config: DayOffConfig;
};

export type CreateDuePaymentReminderSettingDto = BaseCreateSettingDto & {
  type: SettingType.DUE_PAYMENT_REMINDER;
  config: DuePaymentReminderConfig;
};

export type CreateNextSessionReminderSettingDto = BaseCreateSettingDto & {
  type: SettingType.NEXT_SESSION_REMINDER;
  config: NextSessionReminderConfig;
};

export type CreateSettingDto = 
  | CreateDayOffSettingDto 
  | CreateDuePaymentReminderSettingDto 
  | CreateNextSessionReminderSettingDto;

interface BaseUpdateSettingDto {
  active?: boolean;
  description?: string;
}

/**
 * Update DTOs - config is optional but when provided must be the complete config object.
 * The BE does not support partial config updates.
 */
export type UpdateDayOffSettingDto = BaseUpdateSettingDto & {
  type?: SettingType.DAY_OFF;
  config?: DayOffConfig;
};

export type UpdateDuePaymentReminderSettingDto = BaseUpdateSettingDto & {
  type?: SettingType.DUE_PAYMENT_REMINDER;
  config?: DuePaymentReminderConfig;
};

export type UpdateNextSessionReminderSettingDto = BaseUpdateSettingDto & {
  type?: SettingType.NEXT_SESSION_REMINDER;
  config?: NextSessionReminderConfig;
};

export type UpdateSettingDto = 
  | UpdateDayOffSettingDto 
  | UpdateDuePaymentReminderSettingDto 
  | UpdateNextSessionReminderSettingDto;

// Batch update request
export interface BatchUpdateSettingDto {
  id: string;
  data: UpdateSettingDto;
}

// ==================== Type Guards ====================

/**
 * Type guard to check if a setting is a Day Off setting
 */
export function isDayOffSetting(setting: Setting): setting is DayOffSetting {
  return setting.type === SettingType.DAY_OFF;
}

/**
 * Type guard to check if a setting is a Due Payment Reminder setting
 */
export function isDuePaymentReminderSetting(setting: Setting): setting is DuePaymentReminderSetting {
  return setting.type === SettingType.DUE_PAYMENT_REMINDER;
}

/**
 * Type guard to check if a setting is a Next Session Reminder setting
 */
export function isNextSessionReminderSetting(setting: Setting): setting is NextSessionReminderSetting {
  return setting.type === SettingType.NEXT_SESSION_REMINDER;
}

// ==================== Filter Helpers ====================

export function getDayOffSettings(settings: Setting[]): DayOffSetting[] {
  return settings.filter(isDayOffSetting);
}

export function getDuePaymentReminderSetting(settings: Setting[]): DuePaymentReminderSetting | undefined {
  return settings.find(isDuePaymentReminderSetting);
}

export function getNextSessionReminderSetting(settings: Setting[]): NextSessionReminderSetting | undefined {
  return settings.find(isNextSessionReminderSetting);
}
