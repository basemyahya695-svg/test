const StorageService = {
  getJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch (error) {
      return fallback;
    }
  },

  setJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getUser() {
    return this.getJson(STORAGE_KEYS.user, null);
  },

  setUser(user) {
    this.setJson(STORAGE_KEYS.user, user);
  },

  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.user);
  },

  getProfile() {
    return this.getJson(STORAGE_KEYS.profile, {});
  },

  setProfile(profile) {
    this.setJson(STORAGE_KEYS.profile, profile);
  },

  getSettings() {
    return this.getJson(STORAGE_KEYS.settings, {});
  },

  getNotificationSettings() {
    const settings = this.getSettings();
    const days = Number(settings.days);

    return {
      email: settings.email ?? true,
      reminders: settings.reminders ?? true,
      days: Number.isFinite(days)
        ? Math.min(REMINDER_DAYS_MAX, Math.max(REMINDER_DAYS_MIN, Math.round(days)))
        : REMINDER_DAYS_DEFAULT,
    };
  },

  setSettings(settings) {
    this.setJson(STORAGE_KEYS.settings, settings);
  },

  getBoolean(key) {
    return localStorage.getItem(key) === "true";
  },

  setBoolean(key, value) {
    localStorage.setItem(key, String(Boolean(value)));
  },

  getValue(key, fallback = "") {
    return localStorage.getItem(key) || fallback;
  },

  setValue(key, value) {
    localStorage.setItem(key, value);
  },

  getPaidOccurrences() {
    return this.getJson(STORAGE_KEYS.paidOccurrences, {});
  },

  setPaidOccurrences(value) {
    this.setJson(STORAGE_KEYS.paidOccurrences, value);
  },
};
