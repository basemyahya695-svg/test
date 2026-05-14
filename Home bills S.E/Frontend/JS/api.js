const LOCAL_API_BASE_URL = "http://127.0.0.1:5000/api";
const API_BASE_URL = window.location.hostname.endsWith("onrender.com")
  ? `${window.location.origin}/api`
  : LOCAL_API_BASE_URL;

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch (error) {
    throw new Error(`Cannot reach the backend at ${API_BASE_URL}.`);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Request failed");
  }

  return payload;
}

const api = {
  login: (email, password) => apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  }),
  signup: (username, email, password) => apiRequest("/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  }),
  currentUser: () => apiRequest("/me"),
  logout: () => apiRequest("/logout", { method: "POST" }),
  currencies: () => apiRequest("/config/currencies"),
  bills: () => apiRequest("/bills"),
  addBill: (bill) => apiRequest("/bills", {
    method: "POST",
    body: JSON.stringify(bill),
  }),
  updateBill: (id, bill) => apiRequest(`/bills/${id}`, {
    method: "PUT",
    body: JSON.stringify(bill),
  }),
  deleteBill: (id) => apiRequest(`/bills/${id}`, { method: "DELETE" }),
  payBill: (id) => apiRequest(`/bills/${id}/pay`, { method: "PATCH" }),
  schedule: () => apiRequest("/schedule"),
  reminders: () => apiRequest("/reminders"),
  sendReminders: ({ paidOccurrences = {}, unpaidOccurrenceKeys = [] } = {}) => apiRequest("/reminders/send", {
    method: "POST",
    body: JSON.stringify({
      paid_occurrences: paidOccurrences,
      unpaid_occurrences: unpaidOccurrenceKeys,
    }),
  }),
};
