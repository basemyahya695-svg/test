const APP_VERSION = "20260512m";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOAST_DURATION_MS = 2800;
const REMINDER_DAYS_MIN = 1;
const REMINDER_DAYS_MAX = 30;
const REMINDER_DAYS_DEFAULT = 3;

const STORAGE_KEYS = {
  user: "myhome:user",
  profile: "myhome:profile",
  settings: "myhome:settings",
  darkMode: "myhome:dark",
  language: "myhome:language",
  currency: "myhome:currency",
  paidOccurrences: "myhome:paid-occurrences",
  billSync: "myhome:bill-sync",
  showDueRemindersAfterAuth: "myhome:show-due-reminders-after-auth",
};

const BILL_FREQUENCIES = {
  once: "once",
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly",
};
