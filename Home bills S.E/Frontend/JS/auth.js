const authView = {
  mode: "login",
};

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function getStoredUser() {
  return StorageService.getUser();
}

function storeUser(user) {
  StorageService.setUser(user);
}

function clearStoredUser() {
  StorageService.clearUser();
}

function markDueReminderForNextHomeLoad(user) {
  sessionStorage.setItem(STORAGE_KEYS.showDueRemindersAfterAuth, String(user.id || user.email || "current"));
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
    window.location.href = `Home.html?v=${APP_VERSION}`;
  } catch (error) {
    message.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
}
