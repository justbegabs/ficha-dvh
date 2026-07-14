(function () {
  function ensureAuthStyles() {
    if (document.getElementById("auth-widget-styles")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "auth-widget-styles";
    style.textContent = [
      ".auth-widget{pointer-events:auto;display:flex;align-items:center;gap:.5rem;background:rgba(10,24,40,.78);border:1px solid rgba(255,255,255,.18);padding:.35rem .5rem;border-radius:10px;color:#e9f3ff;font:600 12px/1.2 Arial,sans-serif;}",
      ".auth-widget__email{max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".auth-widget__btn{border:0;border-radius:8px;padding:.38rem .6rem;font:700 12px/1 Arial,sans-serif;cursor:pointer;}",
      ".auth-widget__btn--login{background:#4a9eff;color:#061528;}",
      ".auth-widget__btn--logout{background:#ffb259;color:#2f1300;}",
      "@media (max-width:640px){.auth-widget{position:fixed;right:.55rem;top:.55rem;z-index:30;}.auth-widget__email{display:none;}}"
    ].join("");
    document.head.appendChild(style);
  }

  function buildWidget() {
    const topBar = document.querySelector(".top-bar");
    if (!topBar || document.getElementById("authWidget")) {
      return null;
    }

    const widget = document.createElement("div");
    widget.id = "authWidget";
    widget.className = "auth-widget";

    const email = document.createElement("span");
    email.className = "auth-widget__email";
    email.textContent = "Login não iniciado";

    const loginButton = document.createElement("button");
    loginButton.type = "button";
    loginButton.className = "auth-widget__btn auth-widget__btn--login";
    loginButton.textContent = "Entrar com Google";

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "auth-widget__btn auth-widget__btn--logout";
    logoutButton.textContent = "Sair";
    logoutButton.hidden = true;

    widget.append(email, loginButton, logoutButton);
    topBar.appendChild(widget);

    return { widget, email, loginButton, logoutButton };
  }

  async function initializeAuthWidget() {
    ensureAuthStyles();

    const refs = buildWidget();
    if (!refs) {
      return;
    }

    if (!window.DVHAuth) {
      refs.email.textContent = "Login indisponível";
      refs.loginButton.hidden = true;
      refs.logoutButton.hidden = true;
      return;
    }

    await window.DVHAuth.waitForAuthReady();

    if (!window.DVHAuth.isConfigured()) {
      refs.email.textContent = "Configure Firebase para login";
      refs.loginButton.hidden = true;
      refs.logoutButton.hidden = true;
      return;
    }

    const update = (user) => {
      const loggedIn = Boolean(user);
      refs.email.textContent = loggedIn ? (user.email || "Conta Google conectada") : "Desconectado";
      refs.loginButton.hidden = loggedIn;
      refs.logoutButton.hidden = !loggedIn;
    };

    window.DVHAuth.onAuthStateChanged(update);

    refs.loginButton.addEventListener("click", async () => {
      try {
        await window.DVHAuth.signInWithGoogle();
      } catch {
        refs.email.textContent = "Não foi possível entrar agora";
      }
    });

    refs.logoutButton.addEventListener("click", async () => {
      try {
        await window.DVHAuth.signOut();
      } catch {
        refs.email.textContent = "Não foi possível sair agora";
      }
    });
  }

  void initializeAuthWidget();
})();
