/**
 * Enumeration values used in schema.org types
 */

/** Event attendance modes */
export const EVENT_ATTENDANCE_MODE = {
  OFFLINE: 'https://schema.org/OfflineEventAttendanceMode',
  ONLINE: 'https://schema.org/OnlineEventAttendanceMode',
  MIXED: 'https://schema.org/MixedEventAttendanceMode',
} as const;

/** Event status values */
export const EVENT_STATUS = {
  SCHEDULED: 'https://schema.org/EventScheduled',
  CANCELLED: 'https://schema.org/EventCancelled',
  POSTPONED: 'https://schema.org/EventPostponed',
  RESCHEDULED: 'https://schema.org/EventRescheduled',
  MOVED_ONLINE: 'https://schema.org/EventMovedOnline',
} as const;

/** Item availability */
export const ITEM_AVAILABILITY = {
  IN_STOCK: 'https://schema.org/InStock',
  OUT_OF_STOCK: 'https://schema.org/OutOfStock',
  PRE_ORDER: 'https://schema.org/PreOrder',
  DISCONTINUED: 'https://schema.org/Discontinued',
  SOLD_OUT: 'https://schema.org/SoldOut',
} as const;

/** Employment types for JobPosting */
export const EMPLOYMENT_TYPE = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACTOR: 'CONTRACTOR',
  TEMPORARY: 'TEMPORARY',
  INTERN: 'INTERN',
  VOLUNTEER: 'VOLUNTEER',
  PER_DIEM: 'PER_DIEM',
  OTHER: 'OTHER',
} as const;

/** Course modes */
export const COURSE_MODE = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  BLENDED: 'Blended',
  ONSITE: 'Onsite',
  ASYNC: 'Async',
  SYNC: 'Sync',
} as const;

/** Day of week */
export const DAY_OF_WEEK = {
  MONDAY: 'https://schema.org/Monday',
  TUESDAY: 'https://schema.org/Tuesday',
  WEDNESDAY: 'https://schema.org/Wednesday',
  THURSDAY: 'https://schema.org/Thursday',
  FRIDAY: 'https://schema.org/Friday',
  SATURDAY: 'https://schema.org/Saturday',
  SUNDAY: 'https://schema.org/Sunday',
} as const;

/** Language codes (ISO 639-1) */
export const LANGUAGE_CODES = {
  EN: 'en',
  HI: 'hi',
  BN: 'bn',
  TA: 'ta',
  TE: 'te',
  MR: 'mr',
  GU: 'gu',
  KN: 'kn',
  ML: 'ml',
  PA: 'pa',
} as const;
