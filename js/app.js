// ═══════════════════════════════════════════════════════════════
//  GRUPO BAROLETO — app.js
//  Autenticação via PocketBase (email/senha + Google OAuth2)
//  PocketBase exposto via Tailscale Funnel (HTTPS público)
// ═══════════════════════════════════════════════════════════════

const PB_URL = 'https://mini-server-m32.javanese-ghoul.ts.net';

// Instancia o SDK do PocketBase (já importado no index.html via unpkg)
const pb = new PocketBase(PB_URL);

// ───────────────────────────────────────────────────────────────
//  ELEMENTOS DO DOM
// ───────────────────────────────────────────────────────────────
const loginBox     = document.getElementById('loginBox');
const loginStatus  = document.getElementById('loginStatus');
const userInput    = document.getElementById('user');
const passInput    = document.getElementById('pass');
const loginSubmit  = document.getElementById('loginSubmit');
const loginClose   = document.getElementById('loginClose');
const openLoginBtn = document.getElementById('openLogin');

// ───────────────────────────────────────────────────────────────
//  MODAL — ABRIR / FECHAR
// ───────────────────────────────────────────────────────────────
function abrirModal() {
  loginBox.classList.remove('hidden');
  loginBox.classList.add('flex');
  loginBox.setAttribute('aria-hidden', 'false');
  limparFeedback();
  setTimeout(() => userInput.focus(), 200);
}

function fecharModal() {
  loginBox.classList.add('hidden');
  loginBox.classList.remove('flex');
  loginBox.setAttribute('aria-hidden', 'true');
  limparFeedback();
  userInput.value = '';
  passInput.value = '';
}

// Fechar clicando fora do card
loginBox.addEventListener('click', (e) => {
  if (e.target === loginBox) fecharModal();
});

// Fechar com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModal();
});

// Enter no campo de senha dispara o login
passInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fazerLoginEmail();
});
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') passInput.focus();
});

openLoginBtn.addEventListener('click', abrirModal);
loginClose.addEventListener('click', fecharModal);

// ───────────────────────────────────────────────────────────────
//  FEEDBACK VISUAL NO MODAL
// ───────────────────────────────────────────────────────────────
function mostrarFeedback(msg, tipo = 'erro') {
  loginStatus.textContent = msg;
  loginStatus.className = 'text-sm mb-3 block rounded px-3 py-2';

  if (tipo === 'erro') {
    loginStatus.classList.add('bg-red-50', 'text-red-700', 'border', 'border-red-200');
  } else if (tipo === 'ok') {
    loginStatus.classList.add('bg-green-50', 'text-green-700', 'border', 'border-green-200');
  } else if (tipo === 'aviso') {
    loginStatus.classList.add('bg-yellow-50', 'text-yellow-700', 'border', 'border-yellow-200');
  } else if (tipo === 'info') {
    loginStatus.classList.add('bg-blue-50', 'text-blue-700', 'border', 'border-blue-200');
  }

  loginStatus.removeAttribute('hidden');
}

function limparFeedback() {
  loginStatus.textContent = '';
  loginStatus.className = 'hidden text-sm mb-3';
}

function setCarregando(ativo, botao, textoOriginal) {
  botao.disabled = ativo;
  botao.textContent = ativo ? 'Aguarde...' : textoOriginal;
  botao.classList.toggle('opacity-60', ativo);
  botao.classList.toggle('cursor-not-allowed', ativo);
}

// ───────────────────────────────────────────────────────────────
//  UI — ATUALIZA A NAVBAR CONFORME ESTADO DE SESSÃO
// ───────────────────────────────────────────────────────────────
function atualizarNavbar(usuario) {
  const areaRestrita = document.getElementById('area-restrita');

  if (usuario) {
    // Logado: troca botão Login por nome + Sair
    openLoginBtn.textContent = '';
    openLoginBtn.innerHTML = `
      <span class="text-baro-sand font-normal normal-case tracking-normal text-xs mr-2">
        ${usuario.name || usuario.email}
      </span>
      <span id="btn-sair" class="border border-baro-olive px-3 py-1 hover:bg-red-700 hover:border-red-700 transition text-xs">
        Sair
      </span>
    `;
    openLoginBtn.onclick = null;
    document.getElementById('btn-sair').addEventListener('click', (e) => {
      e.stopPropagation();
      fazerLogout();
    });

    // Mostra área restrita
    if (areaRestrita) {
      areaRestrita.classList.remove('hidden');
      setTimeout(() => areaRestrita.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
    }

  } else {
    // Deslogado: restaura botão Login
    openLoginBtn.innerHTML = 'Login';
    openLoginBtn.onclick = abrirModal;

    // Oculta área restrita
    if (areaRestrita) areaRestrita.classList.add('hidden');
  }
}

// ───────────────────────────────────────────────────────────────
//  LOGIN — EMAIL + SENHA
// ───────────────────────────────────────────────────────────────
loginSubmit.addEventListener('click', fazerLoginEmail);

async function fazerLoginEmail() {
  const email = userInput.value.trim();
  const senha = passInput.value;

  if (!email || !senha) {
    mostrarFeedback('Preencha e-mail e senha para continuar.', 'aviso');
    return;
  }

  setCarregando(true, loginSubmit, 'Entrar');
  limparFeedback();

  try {
    const authData = await pb.collection('users').authWithPassword(email, senha);

    mostrarFeedback(`Bem-vindo, ${authData.record.name || authData.record.email}!`, 'ok');

    setTimeout(() => {
      fecharModal();
      atualizarNavbar(authData.record);
    }, 800);

  } catch (err) {
    console.error('[PocketBase] Erro de autenticação:', err);

    if (!navigator.onLine || err?.isAbort || err?.status === 0) {
      mostrarFeedback(
        '⚠️ Servidor inacessível. Verifique se o Tailscale está conectado e o PocketBase está rodando no M32.',
        'erro'
      );
    } else if (err?.status === 400) {
      mostrarFeedback('E-mail ou senha incorretos. Tente novamente.', 'erro');
    } else {
      mostrarFeedback(`Erro: ${err?.message || 'Falha ao autenticar.'}`, 'erro');
    }

  } finally {
    setCarregando(false, loginSubmit, 'Entrar');
  }
}

// ───────────────────────────────────────────────────────────────
//  LOGIN — GOOGLE OAUTH2
// ───────────────────────────────────────────────────────────────
//
//  COMO FUNCIONA:
//  1. Usuário clica em "Entrar com Google"
//  2. PocketBase redireciona para o Google
//  3. Google autentica e redireciona de volta para esta página
//     com ?code=...&state=... na URL
//  4. O SDK do PocketBase finaliza a autenticação automaticamente
//
// ───────────────────────────────────────────────────────────────

const btnGoogle = document.getElementById('btn-google');

if (btnGoogle) {
  btnGoogle.addEventListener('click', async () => {
    setCarregando(true, btnGoogle, '');
    mostrarFeedback('Redirecionando para o Google...', 'info');

    try {
      // authWithOAuth2 abre popup OU redireciona dependendo da configuração
      // Aqui usamos o fluxo de redirecionamento (mais confiável em mobile/Tailscale)
      const authData = await pb.collection('users').authWithOAuth2({
        provider: 'google',
        // Após autenticação, volta para esta mesma página
        redirectUrl: window.location.origin + window.location.pathname,
        // Cria automaticamente o usuário no PocketBase se ainda não existir
        createData: {
          // Campos extras que serão preenchidos no primeiro login
          emailVisibility: false,
        },
      });

      mostrarFeedback(`Bem-vindo, ${authData.record.name || authData.record.email}!`, 'ok');
      setTimeout(() => {
        fecharModal();
        atualizarNavbar(authData.record);
      }, 800);

    } catch (err) {
      console.error('[PocketBase] Erro OAuth Google:', err);

      if (err?.message?.includes('popup')) {
        mostrarFeedback('Popup bloqueado pelo navegador. Permita popups para este site.', 'aviso');
      } else if (!navigator.onLine || err?.status === 0) {
        mostrarFeedback('⚠️ Servidor inacessível. Verifique Tailscale e PocketBase.', 'erro');
      } else {
        mostrarFeedback('Erro ao autenticar com Google. Tente email e senha.', 'erro');
      }

      setCarregando(false, btnGoogle, '');
    }
  });
}

// ───────────────────────────────────────────────────────────────
//  LOGOUT
// ───────────────────────────────────────────────────────────────
function fazerLogout() {
  pb.authStore.clear();
  atualizarNavbar(null);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ───────────────────────────────────────────────────────────────
//  INICIALIZAÇÃO — verifica sessão existente ao carregar a página
//  O SDK do PocketBase salva o token em localStorage automaticamente
// ───────────────────────────────────────────────────────────────
(async function init() {
  // Verifica se há uma sessão ativa (token salvo pelo SDK)
  if (pb.authStore.isValid) {
    try {
      // Revalida o token com o servidor para garantir que ainda é válido
      await pb.collection('users').authRefresh();
      atualizarNavbar(pb.authStore.model);
    } catch {
      // Token expirado ou inválido — limpa a sessão
      pb.authStore.clear();
    }
  }
})();
