const loginBox = document.getElementById("loginBox");
const openLoginButton = document.getElementById("openLogin");
const closeLoginButton = document.getElementById("loginClose");
const loginSubmitButton = document.getElementById("loginSubmit");
const loginStatus = document.getElementById("loginStatus");
const userInput = document.getElementById("user");
const passInput = document.getElementById("pass");

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

  loginSubmitButton.disabled = true;
  loginSubmitButton.textContent = "Entrando...";
  clearLoginStatus();

  try {
    const res = await fetch("http://mini-server-m32:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user, pass })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.ok) {
      setLoginStatus("Login realizado com sucesso.");
      setTimeout(() => {
        fecharLogin();
      }, 800);
      return;
    }

    setLoginStatus("Usuário ou senha inválidos.", true);
  } catch (error) {
    setLoginStatus("Não foi possível conectar ao servidor de login.", true);
    console.error("Falha no login:", error);
  } finally {
    loginSubmitButton.disabled = false;
    loginSubmitButton.textContent = "Entrar";
  }
}

openLoginButton.addEventListener("click", abrirLogin);
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
