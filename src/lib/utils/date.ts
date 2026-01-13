import { format, startOfDay, differenceInDays } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"

/**
 * Get the start of day in user's timezone, converted to UTC
 */
export function getStartOfDayInTimezone(date: Date, timezone: string): Date {
  const zonedDate = toZonedTime(date, timezone)
  const startOfDayZoned = startOfDay(zonedDate)
  return fromZonedTime(startOfDayZoned, timezone)
}

/**
 * Format date in user's timezone
 */
export function formatInTimezone(
  date: Date,
  timezone: string,
  formatStr: string = "PPP"
): string {
  const zonedDate = toZonedTime(date, timezone)
  return format(zonedDate, formatStr)
}

/**
 * Check if two dates are consecutive days in user's timezone
 */
export function isNextDay(
  date1: Date,
  date2: Date,
  timezone: string
): boolean {
  const zonedDate1 = toZonedTime(date1, timezone)
  const zonedDate2 = toZonedTime(date2, timezone)
  const startOfDay1 = startOfDay(zonedDate1)
  const startOfDay2 = startOfDay(zonedDate2)
  return differenceInDays(startOfDay2, startOfDay1) === 1
}

/**
 * Calculate days pending for a task
 */
export function getDaysPending(taskDate: Date, timezone: string): number {
  const now = new Date()
  const zonedNow = toZonedTime(now, timezone)
  const zonedTaskDate = toZonedTime(taskDate, timezone)
  const diff = differenceInDays(startOfDay(zonedNow), startOfDay(zonedTaskDate))
  return diff > 0 ? diff : 0
}

/**
 * Detect browser timezone (client-side only)
 */
export function detectBrowserTimezone(): string {
  if (typeof window === "undefined") {
    return "UTC"
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
