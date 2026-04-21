const POCKETBASE_URL = "http://mini-server-m32:8090";
const POCKETBASE_AUTH_COLLECTION = "users";

const loginBox = document.getElementById("loginBox");
const openLoginButton = document.getElementById("openLogin");
const closeLoginButton = document.getElementById("loginClose");
const loginSubmitButton = document.getElementById("loginSubmit");
const loginStatus = document.getElementById("loginStatus");
const userInput = document.getElementById("user");
const passInput = document.getElementById("pass");

const pb = typeof PocketBase !== "undefined" ? new PocketBase(POCKETBASE_URL) : null;

function setLoginStatus(message, isError = false) {
  loginStatus.textContent = message;
  loginStatus.classList.remove("hidden", "text-red-600", "text-green-700");
  loginStatus.classList.add(isError ? "text-red-600" : "text-green-700");
}

function clearLoginStatus() {
  loginStatus.textContent = "";
  loginStatus.classList.add("hidden");
  loginStatus.classList.remove("text-red-600", "text-green-700");
}

function syncAuthUi() {
  if (!pb || !pb.authStore.isValid) {
    openLoginButton.textContent = "Login";
    return;
  }

  openLoginButton.textContent = "Sair";
}

function abrirLogin() {
  loginBox.classList.remove("hidden");
  loginBox.classList.add("flex");
  loginBox.setAttribute("aria-hidden", "false");
  clearLoginStatus();
  userInput.focus();
}

function fecharLogin() {
  loginBox.classList.add("hidden");
  loginBox.classList.remove("flex");
  loginBox.setAttribute("aria-hidden", "true");
  passInput.value = "";
  clearLoginStatus();
}

async function fazerLogin() {
  const user = userInput.value.trim();
  const pass = passInput.value;

  if (!user || !pass) {
    setLoginStatus("Preencha usuário e senha.", true);
    return;
  }

  if (!pb) {
    setLoginStatus("PocketBase não foi carregado.", true);
    return;
  }

  loginSubmitButton.disabled = true;
  loginSubmitButton.textContent = "Entrando...";
  clearLoginStatus();

  try {
    await pb.collection(POCKETBASE_AUTH_COLLECTION).authWithPassword(user, pass);
    setLoginStatus("Login realizado com sucesso.");
    syncAuthUi();
    setTimeout(() => {
      fecharLogin();
    }, 800);
  } catch (error) {
    const message = error?.response?.message || "Não foi possível autenticar no PocketBase.";
    setLoginStatus(message, true);
    console.error("Falha no login PocketBase:", error);
  } finally {
    loginSubmitButton.disabled = false;
    loginSubmitButton.textContent = "Entrar";
  }
}

function handleLoginButtonClick() {
  if (pb && pb.authStore.isValid) {
    pb.authStore.clear();
    syncAuthUi();
    return;
  }

  abrirLogin();
}

openLoginButton.addEventListener("click", handleLoginButtonClick);
closeLoginButton.addEventListener("click", fecharLogin);
loginSubmitButton.addEventListener("click", fazerLogin);

loginBox.addEventListener("click", (event) => {
  if (event.target === loginBox) {
    fecharLogin();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !loginBox.classList.contains("hidden")) {
    fecharLogin();
  }
});

passInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    fazerLogin();
  }
});

syncAuthUi();
