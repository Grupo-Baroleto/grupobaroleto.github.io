function abrirLogin() {
  document.getElementById("loginBox").classList.remove("hidden");
}

function fecharLogin() {
  document.getElementById("loginBox").classList.add("hidden");
}

async function fazerLogin() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  const res = await fetch("http://mini-server-m32:5000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ user, pass })
  });

  const data = await res.json();

  if (data.ok) {
    alert("Login OK");
    fecharLogin();
  } else {
    alert("Erro no login");
  }
}