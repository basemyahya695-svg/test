document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page;
  if (page === "login") {
    renderLoginPage();
    return;
  }

  await loadCurrencyOptions();
  if (page === "home") bootAuthedPage(renderHomePage);
  if (page === "bills") bootAuthedPage(renderBillsPage);
  if (page === "schedule") bootAuthedPage(renderSchedulePage);
  if (page === "profile") bootAuthedPage(renderProfilePage);
  if (page === "settings") bootAuthedPage(renderSettingsPage);
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKLY_INTERVAL_DAYS = 7;
const SCHEDULE_LOOKAHEAD_YEARS = 1;
const UPCOMING_BILLS_LIMIT = 3;

let scheduleCalendarDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const pageCopy = {
  en: {
    dashboard: "Dashboard",
    dashboardSubtitle: "Overview of your household bills",
    totalMonthly: "Total Monthly Bills",
    unpaidBills: "Unpaid Bills",
    paidBills: "Paid Bills",
    overdueBills: "Overdue Bills",
    upcomingBills: "Upcoming Bills",
    viewAll: "View All",
    noUpcoming: "No upcoming bills. All caught up!",
    manageBills: "Manage all your household bills",
    addBill: "Add Bill",
    searchBills: "Search bills...",
    allCategories: "All Categories",
    paymentSchedule: "Payment Schedule",
    scheduleSubtitle: "View all bills organized by due date",
    totalBills: "Total Bills",
    monthlyTotal: "Monthly Total",
    unpaidAmount: "Unpaid Amount",
    calendar: "Calendar",
    emailReminders: "Email reminders",
    profileSubtitle: "Manage your account information",
    editProfile: "Edit Profile",
    settingsSubtitle: "Manage your preferences and notifications",
    noBillsFound: "No bills found.",
    upcomingSchedule: "Upcoming Bills",
    noFutureBills: "No upcoming unpaid bills.",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    billType: "Bill Type",
    rent: "Rent",
    water: "Water",
    gas: "Gas",
    wifi: "Wifi",
    electricity: "Electricity",
    other: "Other",
    notifications: "Notifications",
    emailNotifications: "Email Notifications",
    emailNotificationsHelp: "Receive bill updates via email",
    pushNotifications: "Push Notifications",
    pushNotificationsHelp: "Receive browser notifications",
    billReminders: "Bill Reminders",
    billRemindersHelp: "Get reminded before bills are due",
    reminderDays: "Reminder Days Before Due",
    reminderDaysHelp: "How many days in advance to remind you",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    darkModeHelp: "Toggle dark mode theme",
    language: "Language",
    languageHelp: "Select your preferred language",
    currency: "Currency",
    currencyHelp: "Choose your display currency",
  },
  ar: {
    dashboard: "لوحة التحكم",
    dashboardSubtitle: "نظرة عامة على فواتير المنزل",
    totalMonthly: "إجمالي الفواتير الشهرية",
    unpaidBills: "فواتير غير مدفوعة",
    paidBills: "فواتير مدفوعة",
    overdueBills: "فواتير متأخرة",
    upcomingBills: "الفواتير القادمة",
    viewAll: "عرض الكل",
    noUpcoming: "لا توجد فواتير قادمة.",
    manageBills: "إدارة كل فواتير المنزل",
    addBill: "إضافة فاتورة",
    searchBills: "ابحث في الفواتير...",
    allCategories: "كل الفئات",
    paymentSchedule: "جدول الدفع",
    scheduleSubtitle: "عرض الفواتير حسب تاريخ الاستحقاق",
    totalBills: "إجمالي الفواتير",
    monthlyTotal: "الإجمالي الشهري",
    unpaidAmount: "المبلغ غير المدفوع",
    calendar: "التقويم",
    emailReminders: "إرسال تذكير بالبريد",
    profileSubtitle: "إدارة معلومات الحساب",
    editProfile: "تعديل الملف",
    settingsSubtitle: "إدارة التفضيلات والتنبيهات",
    noBillsFound: "لا توجد فواتير.",
    upcomingSchedule: "الفواتير القادمة",
    noFutureBills: "لا توجد فواتير غير مدفوعة قادمة.",
    previousMonth: "الشهر السابق",
    nextMonth: "الشهر التالي",
    billType: "نوع الفاتورة",
    rent: "الإيجار",
    water: "المياه",
    gas: "الغاز",
    wifi: "الإنترنت",
    electricity: "الكهرباء",
    other: "أخرى",
    notifications: "التنبيهات",
    emailNotifications: "تنبيهات البريد الإلكتروني",
    emailNotificationsHelp: "استلام تحديثات الفواتير عبر البريد",
    pushNotifications: "تنبيهات المتصفح",
    pushNotificationsHelp: "استلام تنبيهات من المتصفح",
    billReminders: "تذكيرات الفواتير",
    billRemindersHelp: "الحصول على تذكير قبل موعد الاستحقاق",
    reminderDays: "أيام التذكير قبل الاستحقاق",
    reminderDaysHelp: "عدد الأيام قبل موعد الاستحقاق",
    appearance: "المظهر",
    darkMode: "الوضع الداكن",
    darkModeHelp: "تبديل مظهر الوضع الداكن",
    language: "اللغة",
    languageHelp: "اختيار اللغة المفضلة",
    currency: "العملة",
    currencyHelp: "اختيار عملة العرض",
  },
};

function translatePageCopy(key) {
  return pageCopy[currentLanguage()]?.[key] || pageCopy.en[key] || key;
}

function renderLoginPage() {
  const isSignup = authView.mode === "signup";
  document.body.className = "login-page";
  document.body.innerHTML = `
    <section class="login-card">
      <div class="brand-lockup">${icon("home")}<span>MyHome</span></div>
      <div class="auth-tabs" role="tablist" aria-label="Authentication">
        <button class="${!isSignup ? "active" : ""}" type="button" data-auth-mode="login">Login</button>
        <button class="${isSignup ? "active" : ""}" type="button" data-auth-mode="signup">Sign Up</button>
      </div>
      <h1 class="login-title">${isSignup ? "Create Account" : "Welcome Back"}</h1>
      <p class="login-subtitle">${isSignup ? "Start tracking your household bills" : "Sign in to manage your household bills"}</p>
      <form data-auth-form>
        ${isSignup ? `<label class="field">Full Name<input type="text" name="username" placeholder="Enter your full name" required maxlength="80"></label>` : ""}
        <label class="field">Email<input type="text" inputmode="email" autocomplete="email" name="email" placeholder="Enter your email" required></label>
        <label class="field">Password<input type="password" name="password" placeholder="Enter your password" required minlength="8"></label>
        <button class="primary-button" type="submit">${isSignup ? "Create Account" : "Sign In"}</button>
        <p class="form-message" data-message></p>
      </form>
      <p class="demo-note">${isSignup ? "Already registered? Switch to Login." : "New here? Create an account first."}</p>
    </section>
  `;

  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  document.querySelector("[data-auth-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleAuthSubmit(event.currentTarget);
  });
}

async function bootAuthedPage(renderer) {
  try {
    await requireAuth();
    const bills = await api.bills();
    renderer(bills);
  } catch (error) {
    clearStoredUser();
    window.location.href = "Login.html";
  }
}

function getSummary(bills) {
  const total = bills.reduce((sum, bill) => sum + convertAmount(bill.amount, bill.currency, "USD"), 0);
  const paid = bills.filter((bill) => bill.status === "paid").length;
  const unpaid = bills.filter((bill) => bill.status === "unpaid").length;
  const overdue = bills.filter(isOverdue).length;
  const unpaidAmount = bills
    .filter((bill) => bill.status === "unpaid")
    .reduce((sum, bill) => sum + convertAmount(bill.amount, bill.currency, "USD"), 0);
  return { total, paid, unpaid, overdue, unpaidAmount };
}

function expandBillsForDateRange(bills, fromDate, toDate) {
  const result = [];
  
  bills.forEach(bill => {
    const dueDate = parseDate(bill.due_date);
    
    if (!bill.frequency || bill.frequency === "once") {
      if (dueDate >= fromDate && dueDate <= toDate) {
        result.push(bill);
      }
    } else if (bill.frequency === "weekly") {
      let current = new Date(dueDate);
      if (current < fromDate) {
        const diff = fromDate - current;
        const weeks = Math.ceil(diff / (WEEKLY_INTERVAL_DAYS * MS_PER_DAY));
        current.setDate(current.getDate() + weeks * WEEKLY_INTERVAL_DAYS);
      }
      while (current <= toDate) {
        if (current >= dueDate) {
          result.push({ ...bill, due_date: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}` });
        }
        current.setDate(current.getDate() + WEEKLY_INTERVAL_DAYS);
      }
    } else if (bill.frequency === "monthly") {
      let current = new Date(dueDate);
      if (current < fromDate) {
        let y = fromDate.getFullYear();
        let m = fromDate.getMonth();
        let d = Math.min(dueDate.getDate(), new Date(y, m + 1, 0).getDate());
        current = new Date(y, m, d);
        if (current < fromDate) {
          m++;
          if (m > 11) { m = 0; y++; }
          d = Math.min(dueDate.getDate(), new Date(y, m + 1, 0).getDate());
          current = new Date(y, m, d);
        }
      }
      while (current <= toDate) {
        if (current >= dueDate) {
          result.push({ ...bill, due_date: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}` });
        }
        let y = current.getFullYear();
        let m = current.getMonth() + 1;
        if (m > 11) { m = 0; y++; }
        let d = Math.min(dueDate.getDate(), new Date(y, m + 1, 0).getDate());
        current = new Date(y, m, d);
      }
    } else if (bill.frequency === "yearly") {
      let current = new Date(dueDate);
      if (current < fromDate) {
        current.setFullYear(fromDate.getFullYear());
        if (current < fromDate) {
          current.setFullYear(current.getFullYear() + 1);
        }
      }
      while (current <= toDate) {
        if (current >= dueDate) {
          result.push({ ...bill, due_date: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}` });
        }
        current.setFullYear(current.getFullYear() + 1);
      }
    }
  });
  
  return result;
}

function renderHomePage(bills) {
  const summary = getSummary(bills);
  const today = new Date(new Date().toDateString());
  const scheduleEndDate = new Date(today.getFullYear() + SCHEDULE_LOOKAHEAD_YEARS, today.getMonth(), today.getDate());
  const upcoming = expandBillsForDateRange(bills, today, scheduleEndDate)
    .filter((bill) => bill.status === "unpaid")
    .sort((a, b) => parseDate(a.due_date) - parseDate(b.due_date))
    .slice(0, UPCOMING_BILLS_LIMIT);

  renderShell("home", `
    ${renderTopbar(translatePageCopy("dashboard"), translatePageCopy("dashboardSubtitle"))}
    <section class="stats-grid">
      ${statCard("dollar", "#dceaff", "#155dff", formatCurrency(summary.total), translatePageCopy("totalMonthly"))}
      ${statCard("alert", "#ffe9ca", "#ff5b18", summary.unpaid, translatePageCopy("unpaidBills"))}
      ${statCard("check", "#d9fbe6", "#00a84f", summary.paid, translatePageCopy("paidBills"))}
      ${statCard("trend", "#ffe0e0", "#ff2424", summary.overdue, translatePageCopy("overdueBills"))}
    </section>
    <section class="content-card">
      <div class="section-heading">
        <h2 class="section-title">${icon("calendar")} ${translatePageCopy("upcomingBills")}</h2>
        <a class="ghost-button" href="Bills.html">${translatePageCopy("viewAll")}</a>
      </div>
      ${upcoming.length ? `<div class="bill-list">${upcoming.map(billCard).join("")}</div>` : `<div class="empty-state">${translatePageCopy("noUpcoming")}</div>`}
    </section>
  `);
}

function statCard(iconName, bg, color, value, label) {
  return `
    <article class="stat-card">
      <div class="stat-icon" style="background:${bg};color:${color}">${icon(iconName)}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </article>
  `;
}

function renderBillsPage(bills) {
  renderShell("bills", `
    ${renderTopbar(translateNavigation("bills"), translatePageCopy("manageBills"), `<button class="secondary-button compact-button" type="button" data-action="add-bill">${icon("plus")} ${translatePageCopy("addBill")}</button>`)}
    <section class="search-row">
      <input data-search type="search" placeholder="${translatePageCopy("searchBills")}">
      <select data-filter>
        <option value="all">${translatePageCopy("allCategories")}</option>
        ${Object.keys(billCategories).map((key) => `<option value="${key}">${translatePageCopy(key)}</option>`).join("")}
      </select>
    </section>
    <section class="bill-list" data-bill-list></section>
  `);

  const list = document.querySelector("[data-bill-list]");
  const search = document.querySelector("[data-search]");
  const filter = document.querySelector("[data-filter]");

  const draw = () => {
    const query = search.value.trim().toLowerCase();
    const category = filter.value;
    const visible = bills.filter((bill) => {
      const billCategory = categoryForBill(bill).key;
      return bill.name.toLowerCase().includes(query) && (category === "all" || billCategory === category);
    });
    list.innerHTML = visible.length ? visible.map(billCard).join("") : `<div class="empty-state">${translatePageCopy("noBillsFound")}</div>`;
    bindBillActions(bills);
  };

  document.querySelector("[data-action='add-bill']").addEventListener("click", () => openBillEditor(null));
  search.addEventListener("input", draw);
  filter.addEventListener("change", draw);
  draw();
}

function bindBillActions(bills) {
  document.querySelectorAll("[data-action='pay-bill']").forEach((button) => {
    button.addEventListener("click", async () => {
      await api.payBill(button.dataset.id);
      setToast("Bill marked as paid");
      bootAuthedPage(renderBillsPage);
    });
  });

  document.querySelectorAll("[data-action='edit-bill']").forEach((button) => {
    button.addEventListener("click", () => openBillEditor(bills.find((bill) => String(bill.id) === button.dataset.id)));
  });

  document.querySelectorAll("[data-action='delete-bill']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!window.confirm("Delete this bill?")) return;
      await api.deleteBill(button.dataset.id);
      setToast("Bill deleted");
      bootAuthedPage(renderBillsPage);
    });
  });
}

function openBillEditor(bill) {
  const modal = createBillModal(bill);
  modal.querySelector("[data-bill-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const amount = Number(form.amount.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      setToast("Enter a valid bill amount");
      return;
    }
    const payload = {
      name: form.name.value.trim(),
      category: form.category.value,
      amount,
      currency: form.currency.value,
      due_date: form.due_date.value,
      frequency: form.frequency.value,
    };
    if (bill) await api.updateBill(bill.id, payload);
    else await api.addBill(payload);
    modal.remove();
    setToast(bill ? "Bill updated" : "Bill added");
    bootAuthedPage(renderBillsPage);
  });
}

function renderSchedulePage(bills) {
  const summary = getSummary(bills);
  const today = new Date(new Date().toDateString());
  const scheduleEndDate = new Date(today.getFullYear() + SCHEDULE_LOOKAHEAD_YEARS, today.getMonth(), today.getDate());
  const upcoming = expandBillsForDateRange(bills, today, scheduleEndDate)
    .filter((bill) => bill.status === "unpaid")
    .sort((a, b) => parseDate(a.due_date) - parseDate(b.due_date));
  const baseDate = scheduleCalendarDate;
  renderShell("schedule", `
    ${renderTopbar(translatePageCopy("paymentSchedule"), translatePageCopy("scheduleSubtitle"))}
    <section class="stats-grid three">
      ${statCard("calendar", "#ffffff", "#155dff", bills.length, translatePageCopy("totalBills"))}
      ${statCard("dollar", "#ffffff", "#00a84f", formatCurrency(summary.total), translatePageCopy("monthlyTotal"))}
      ${statCard("alert", "#ffffff", "#ff5b18", formatCurrency(summary.unpaidAmount), translatePageCopy("unpaidAmount"))}
    </section>
    ${scheduleCalendar(bills, baseDate)}
    <h2 class="schedule-month">${translatePageCopy("upcomingSchedule")}</h2>
    <section class="schedule-list">
      ${upcoming.map(scheduleItem).join("") || `<div class="empty-state">${translatePageCopy("noFutureBills")}</div>`}
    </section>
  `);

  document.querySelector("[data-action='previous-month']")?.addEventListener("click", () => {
    scheduleCalendarDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
    renderSchedulePage(bills);
  });
  document.querySelector("[data-action='next-month']")?.addEventListener("click", () => {
    scheduleCalendarDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
    renderSchedulePage(bills);
  });
  document.querySelector("[data-action='send-reminders']")?.addEventListener("click", async () => {
    const result = await api.sendReminders();
    setToast(result.sent ? `Sent ${result.count} reminder email(s)` : result.message);
  });
}

function scheduleCalendar(bills, baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = firstDay.getDay();
  const lastDay = new Date(year, month, daysInMonth);
  const monthBills = expandBillsForDateRange(bills, firstDay, lastDay);

  const cells = [];
  for (let index = 0; index < leading; index += 1) {
    cells.push(`<div class="calendar-cell muted-cell"></div>`);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const billsForDay = monthBills.filter((bill) => parseDate(bill.due_date).getDate() === day);
    cells.push(`
      <div class="calendar-cell ${billsForDay.length ? "has-bill" : ""}">
        <span>${day}</span>
        <div class="calendar-icons">
          ${billsForDay.map((bill) => {
            const category = categoryForBill(bill);
            return `<span class="calendar-bill-icon" title="${bill.name}" style="background:${category.bg};color:${category.color}">${icon(category.icon)}</span>`;
          }).join("")}
        </div>
      </div>
    `);
  }

  return `
    <section class="content-card calendar-card">
      <div class="section-heading">
        <h2 class="section-title">${baseDate.toLocaleDateString(currentLanguage() === "ar" ? "ar" : "en-US", { month: "long", year: "numeric" })}</h2>
        <div class="calendar-actions">
          <button class="icon-button" type="button" aria-label="${translatePageCopy("previousMonth")}" title="${translatePageCopy("previousMonth")}" data-action="previous-month">‹</button>
          <button class="icon-button" type="button" aria-label="${translatePageCopy("nextMonth")}" title="${translatePageCopy("nextMonth")}" data-action="next-month">›</button>
          <button class="ghost-button compact-button" type="button" data-action="send-reminders">${icon("mail")} ${translatePageCopy("emailReminders")}</button>
        </div>
      </div>
      <div class="calendar-weekdays">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<strong>${day}</strong>`).join("")}
      </div>
      <div class="calendar-grid">${cells.join("")}</div>
    </section>
  `;
}

function scheduleItem(bill) {
  const category = categoryForBill(bill);
  const date = parseDate(bill.due_date);
  const overdue = isOverdue(bill);
  const statusText = scheduleStatusText(bill);
  return `
    <article class="schedule-item ${overdue ? "overdue" : ""}">
      <div class="date-tile">
        <small>${date.toLocaleDateString("en-US", { weekday: "short" })}</small>
        <strong>${date.getDate()}</strong>
      </div>
      <div class="category-icon" style="background:${category.bg};color:${category.color}">${icon(category.icon)}</div>
      <div class="schedule-main">
        <h3>${bill.name}<span class="badge category">${translatePageCopy(category.key)}</span><span class="badge frequency">${bill.frequency === "once" ? "One time" : "Recurring"}</span></h3>
        <strong class="${bill.status === "paid" ? "active-text" : ""}" style="color:${bill.status === "paid" ? "var(--success)" : overdue ? "red" : "var(--warning)"}">
          ${statusText}
        </strong>
        ${billDescription(bill) ? `<p class="schedule-note">${billDescription(bill)}</p>` : ""}
      </div>
      <div class="schedule-amount">
        ${formatCurrency(bill.amount, bill.currency)}
        <span class="badge ${bill.status}">${bill.status}</span>
      </div>
    </article>
  `;
}

function scheduleStatusText(bill) {
  if (bill.status === "paid") return "Paid";
  if (isOverdue(bill)) return `Overdue by ${daysOverdue(bill)} days`;
  const dueDate = parseDate(bill.due_date);
  const today = new Date(new Date().toDateString());
  const daysUntilDue = Math.ceil((dueDate - today) / MS_PER_DAY);
  return daysUntilDue === 0 ? "Due today" : `Due in ${daysUntilDue} days`;
}

function renderProfilePage() {
  const user = getStoredUser() || {};
  const profile = JSON.parse(localStorage.getItem("myhome:profile") || "{}");
  const name = profile.name || user.username || "John Doe";
  const email = profile.email || user.email || "john.doe@example.com";
  const phone = profile.phone || "(555) 123-4567";
  const address = profile.address || "123 Main Street, Anytown, USA";

  renderShell("profile", `
    ${renderTopbar(translateNavigation("profile"), translatePageCopy("profileSubtitle"))}
    <section class="profile-card">
      <div class="profile-header">
        <div class="profile-person">
          <div class="avatar">${icon("user")}</div>
          <div><h2>${name}</h2><p>${email}</p></div>
        </div>
        <button class="secondary-button compact-button" type="button" data-action="edit-profile">${icon("edit")} ${translatePageCopy("editProfile")}</button>
      </div>
      ${profileField("user", "Full Name", name)}
      ${profileField("mail", "Email Address", email)}
      ${profileField("phone", "Phone Number", phone)}
      ${profileField("mapPin", "Address", address)}
    </section>
    <section class="profile-grid">
      <article class="mini-card"><span>Account Status</span><strong class="active-text">Active</strong></article>
      <article class="mini-card"><span>Member Since</span><strong>April 2026</strong></article>
    </section>
  `);

  document.querySelector("[data-action='edit-profile']").addEventListener("click", () => openProfileEditor({ name, email, phone, address }));
}

function profileField(iconName, label, value) {
  return `<label class="field"><span>${icon(iconName)} ${label}</span><input value="${value}" disabled></label>`;
}

function openProfileEditor(profile) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop open";
  modal.innerHTML = `
    <form class="modal" data-profile-form>
      <div class="modal-header"><h2>Edit Profile</h2><button class="icon-button" type="button" data-action="close-modal">×</button></div>
      <label class="field">Full Name<input name="name" value="${profile.name}" required></label>
      <label class="field">Email Address<input name="email" type="email" value="${profile.email}" required></label>
      <label class="field">Phone Number<input name="phone" value="${profile.phone}"></label>
      <label class="field">Address<input name="address" value="${profile.address}"></label>
      <div class="modal-actions"><button class="ghost-button" type="button" data-action="close-modal">Cancel</button><button class="secondary-button" type="submit">Save Profile</button></div>
    </form>
  `;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-action='close-modal']").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("[data-profile-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    localStorage.setItem("myhome:profile", JSON.stringify({
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      address: form.address.value,
    }));
    modal.remove();
    renderProfilePage();
    setToast("Profile saved");
  });
}

function renderSettingsPage() {
  const settings = JSON.parse(localStorage.getItem("myhome:settings") || "{}");
  const dark = localStorage.getItem("myhome:dark") === "true";
  renderShell("settings", `
    <section class="settings-page">
      ${renderTopbar(`${icon("settings")} ${translateNavigation("settings")}`, translatePageCopy("settingsSubtitle"))}
      <section class="content-card settings-stack">
        <h2 class="section-title">${icon("bell")} ${translatePageCopy("notifications")}</h2>
        ${settingToggle(translatePageCopy("emailNotifications"), translatePageCopy("emailNotificationsHelp"), "email", settings.email ?? true)}
        ${settingToggle(translatePageCopy("pushNotifications"), translatePageCopy("pushNotificationsHelp"), "push", settings.push ?? true)}
        ${settingToggle(translatePageCopy("billReminders"), translatePageCopy("billRemindersHelp"), "reminders", settings.reminders ?? true)}
        <label class="setting-row">
          <span><strong>${translatePageCopy("reminderDays")}</strong><span class="setting-subtitle">${translatePageCopy("reminderDaysHelp")}</span></span>
          <input class="number-input" data-setting="days" type="number" min="1" max="30" value="${settings.days || 3}">
        </label>
      </section>
      <section class="content-card settings-stack" style="margin-top:24px">
        <h2 class="section-title">${icon("moon")} ${translatePageCopy("appearance")}</h2>
        ${settingToggle(translatePageCopy("darkMode"), translatePageCopy("darkModeHelp"), "dark", dark)}
        <label class="setting-row">
          <span><strong>${translatePageCopy("language")}</strong><span class="setting-subtitle">${translatePageCopy("languageHelp")}</span></span>
          <select class="select-input" data-setting="language">
            <option value="en" ${currentLanguage() === "en" ? "selected" : ""}>English</option>
            <option value="ar" ${currentLanguage() === "ar" ? "selected" : ""}>العربية</option>
          </select>
        </label>
        <label class="setting-row">
          <span><strong>${translatePageCopy("currency")}</strong><span class="setting-subtitle">${translatePageCopy("currencyHelp")}</span></span>
          <select class="select-input" data-setting="currency">
            ${Object.keys(currencies).map((code) => `<option value="${code}" ${preferredCurrency() === code ? "selected" : ""}>${code}</option>`).join("")}
          </select>
        </label>
      </section>
    </section>
  `);

  document.querySelectorAll("[data-setting]").forEach((input) => {
    input.addEventListener("change", () => {
      const next = JSON.parse(localStorage.getItem("myhome:settings") || "{}");
      const value = input.type === "checkbox" ? input.checked : input.value;
      next[input.dataset.setting] = value;
      localStorage.setItem("myhome:settings", JSON.stringify(next));
      if (input.dataset.setting === "dark") {
        localStorage.setItem("myhome:dark", String(value));
        document.body.classList.toggle("dark", Boolean(value));
      }
      if (input.dataset.setting === "language") {
        localStorage.setItem("myhome:language", value);
        renderSettingsPage();
      }
      if (input.dataset.setting === "currency") {
        localStorage.setItem("myhome:currency", value);
      }
      setToast("Setting updated");
    });
  });
}

function settingToggle(title, subtitle, key, checked) {
  return `
    <label class="setting-row">
      <span><strong>${title}</strong><span class="setting-subtitle">${subtitle}</span></span>
      <input class="toggle" data-setting="${key}" type="checkbox" ${checked ? "checked" : ""}>
    </label>
  `;
}
