import { differenceInDays, format, isValid, parseISO } from "date-fns";
import { EXPIRY_THRESHOLDS, RECORD_STATUS, RecordStatus, PRIORITY_LEVELS, PriorityLevel } from "@/constants";

/**
 * Interface representing a Firestore Timestamp object.
 */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

/**
 * Converts a Firestore Timestamp or Date ISO string into a standard JS Date.
 */
export function convertToDate(dateInput: Date | FirestoreTimestamp | string | null | undefined): Date | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null;
  }

  // Handle Firestore Timestamp
  if (typeof dateInput === "object" && "seconds" in dateInput) {
    const d = new Date(dateInput.seconds * 1000);
    return isValid(d) ? d : null;
  }

  // Handle ISO string
  if (typeof dateInput === "string") {
    const parsed = parseISO(dateInput);
    return isValid(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Formats a Date or Timestamp into a human-readable display string.
 */
export function formatDate(
  dateInput: Date | FirestoreTimestamp | string | null | undefined,
  formatStr: string = "MMM dd, yyyy"
): string {
  const date = convertToDate(dateInput);
  if (!date) return "N/A";
  return format(date, formatStr);
}

/**
 * Calculates the number of remaining days until expiry.
 * Returns negative value if the date is in the past (expired).
 */
export function getRemainingDays(expiryDateInput: Date | FirestoreTimestamp | string | null | undefined): number {
  const expiryDate = convertToDate(expiryDateInput);
  if (!expiryDate) return 0;

  const today = new Date();
  // Clear times to compare whole days
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  return differenceInDays(expiryDate, today);
}

/**
 * Calculates the status of a record based on the expiry date and standard thresholds.
 */
export function calculateRecordStatus(expiryDateInput: Date | FirestoreTimestamp | string | null | undefined): RecordStatus {
  const expiryDate = convertToDate(expiryDateInput);
  if (!expiryDate) return RECORD_STATUS.ACTIVE;

  const remainingDays = getRemainingDays(expiryDate);

  if (remainingDays < 0) {
    return RECORD_STATUS.EXPIRED;
  }
  if (remainingDays <= EXPIRY_THRESHOLDS.CRITICAL_DAYS) {
    return RECORD_STATUS.CRITICAL;
  }
  if (remainingDays <= EXPIRY_THRESHOLDS.WARNING_DAYS) {
    return RECORD_STATUS.WARNING;
  }

  return RECORD_STATUS.ACTIVE;
}

/**
 * Returns Tailwind CSS class mappings for Priority levels.
 */
export function getPriorityBadgeClass(priority: PriorityLevel): string {
  switch (priority) {
    case PRIORITY_LEVELS.CRITICAL:
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    case PRIORITY_LEVELS.HIGH:
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case PRIORITY_LEVELS.MEDIUM:
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case PRIORITY_LEVELS.LOW:
    default:
      return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
  }
}

/**
 * Performs a simple case-insensitive search filter across an array of objects.
 */
export function filterBySearchQuery<T>(items: T[], queryStr: string, searchKeys: (keyof T)[]): T[] {
  const trimmedQuery = queryStr.trim().toLowerCase();
  if (!trimmedQuery) return items;

  return items.filter((item) => {
    return searchKeys.some((key) => {
      const value = item[key];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(trimmedQuery);
    });
  });
}

/**
 * Validates whether a string is a correctly formatted email address.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Evaluates password strength. Returns a score from 0 (very weak) to 4 (very strong).
 */
export function getPasswordStrengthScore(password: string): number {
  let score = 0;
  if (!password || password.length < 6) return score;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

/**
 * Formats a numeric value as standard USD currency.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Formats standard file sizes in bytes to human-readable units (e.g. KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
