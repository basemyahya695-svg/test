const authView = {
  mode: "login",
};

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function getStoredUser() {
  return JSON.parse(localStorage.getItem("myhome:user") || "null");
}

function storeUser(user) {
  localStorage.setItem("myhome:user", JSON.stringify(user));
}

function clearStoredUser() {
  localStorage.removeItem("myhome:user");
}

function markDueReminderForNextHomeLoad(user) {
  sessionStorage.setItem("myhome:show-due-reminders-after-auth", String(user.id || user.email || "current"));
}

function setAuthMode(mode) {
  authView.mode = mode;
  renderLoginPage();
}

async function requireAuth() {
  const response = await api.currentUser();
  storeUser(response.user);
  return response.user;
}

async function handleAuthSubmit(form) {
  const message = form.querySelector("[data-message]");
  const submitButton = form.querySelector("[type='submit']");
  const isSignup = authView.mode === "signup";

  message.textContent = "";
  submitButton.disabled = true;

  try {
    if (!emailPattern.test(form.email.value.trim())) {
      throw new Error("Enter a valid email address");
    }
    const response = isSignup
      ? await api.signup(form.username.value.trim(), form.email.value.trim(), form.password.value)
      : await api.login(form.email.value.trim(), form.password.value);

    storeUser(response.user);
    markDueReminderForNextHomeLoad(response.user);
    window.location.href = "Home.html?v=20260511j";
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}
