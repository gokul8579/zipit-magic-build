import { format } from "date-fns";

/**
 * Formats a date string or Date object to DD/MM/YYYY format
 */
export const formatLocalDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy");
  } catch {
    return "-";
  }
};

/**
 * Formats a date string or Date object to DD/MM/YYYY HH:mm format
 */
export const formatLocalDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy HH:mm");
  } catch {
    return "-";
  }
};

/**
 * Formats a date for input fields (YYYY-MM-DD)
 */
export const formatInputDate = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "yyyy-MM-dd");
  } catch {
    return "";
  }
};
