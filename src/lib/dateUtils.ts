import { format } from "date-fns";

/**
 * Formats a date string or Date object to DD/MM/YYYY format
 */
export const formatLocalDate = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
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
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
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
