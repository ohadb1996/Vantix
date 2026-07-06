/** שעות פעילות יומיות – תואם למבנה speedxprime (business-opening) */
export interface DayHours {
  isOpen: boolean;
  open: string;
  close: string;
}

export type DayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface BusinessHours {
  /** העסק פתוח 24 שעות ביממה, 7 ימים בשבוע */
  is24_7?: boolean;
  sunday: DayHours;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
}

export const DAY_KEYS: DayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export const DAY_LABELS: Record<DayKey, string> = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
  friday: "שישי",
  saturday: "שבת",
};

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  sunday: { isOpen: true, open: "09:00", close: "22:00" },
  monday: { isOpen: true, open: "09:00", close: "22:00" },
  tuesday: { isOpen: true, open: "09:00", close: "22:00" },
  wednesday: { isOpen: true, open: "09:00", close: "22:00" },
  thursday: { isOpen: true, open: "09:00", close: "22:00" },
  friday: { isOpen: true, open: "09:00", close: "22:00" },
  saturday: { isOpen: false, open: "09:00", close: "22:00" },
};
