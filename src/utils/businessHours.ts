import type { BusinessHours, DayKey } from '../types/businessHours'

const DAY_NAME_TO_KEY: Record<string, DayKey> = {
  Sunday: "sunday",
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
  Saturday: "saturday",
};

const ISRAEL_TZ = "Asia/Jerusalem";

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function getIsraelNowParts(date = new Date()): { dayKey: DayKey; time: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: ISRAEL_TZ,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "Sunday";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const dayKey = DAY_NAME_TO_KEY[weekday] ?? "sunday";
  return { dayKey, time: `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}` };
}

/** אם לא הוגדרו שעות – העסק נחשב פתוח (תאימות לאחור). */
export function isBusinessOpenNow(hours: BusinessHours | null | undefined, now = new Date()): boolean {
  if (!hours) return true;
  const { dayKey, time } = getIsraelNowParts(now);
  const today = hours[dayKey];
  if (!today?.isOpen) return false;

  const current = parseTimeToMinutes(time);
  const open = parseTimeToMinutes(today.open);
  const close = parseTimeToMinutes(today.close);
  if (open === close) return false;

  if (close > open) {
    return current >= open && current < close;
  }

  return current >= open || current < close;
}

export function normalizeBusinessHours(raw: unknown): BusinessHours | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const keys: DayKey[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const out = {} as BusinessHours;
  for (const key of keys) {
    const day = obj[key];
    if (!day || typeof day !== "object") return null;
    const d = day as Record<string, unknown>;
    if (typeof d.isOpen !== "boolean" || typeof d.open !== "string" || typeof d.close !== "string") return null;
    out[key] = { isOpen: d.isOpen, open: d.open, close: d.close };
  }
  return out;
}
