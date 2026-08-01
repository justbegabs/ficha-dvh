const CHARACTERS_STORAGE_KEY = "dvhCharacters";
const DELETED_CHARACTERS_STORAGE_KEY = "dvhDeletedCharacters";
const SELECTED_CHARACTER_STORAGE_KEY = "dvhSelectedCharacterId";
const SELECTED_CHARACTER_DATA_STORAGE_KEY = "dvhSelectedCharacterData";
const SELECTED_CHARACTER_MAP_STORAGE_KEY = "dvhCharacterSelectionMap";
const MAX_CHARACTERS_PER_ACCOUNT = 20;

const charactersGrid = document.getElementById("charactersGrid");
const charactersStatus = document.getElementById("charactersStatus");
const menuButton = document.querySelector(".icon-btn[aria-label='Menu']");
const menuClose = document.getElementById("menuClose");
const menuOverlay = document.getElementById("menuOverlay");
const sideMenu = document.getElementById("sideMenu");

function hasUserSessionForCloud() {
  return Boolean(window.DVHAuth?.getCurrentUser?.()?.uid);
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((result) => {
        window.clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

async function canUseCloudNow() {
  if (!window.DVHAuth?.isConfigured?.()) {
    return false;
  }

  if (window.DVHAuth?.hasCloudSession?.()) {
    return true;
  }

  if (typeof window.DVHAuth?.ensureCloudSession === "function") {
    try {
      const recovered = await withTimeout(
        window.DVHAuth.ensureCloudSession(),
        6000,
        "Reconexão da sessão demorou demais"
      );
      if (recovered && window.DVHAuth?.hasCloudSession?.()) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return Boolean(window.DVHAuth?.hasCloudSession?.());
}

async function ensureCloudSessionOnUserAction() {
  if (await canUseCloudNow()) {
    return true;
  }

  if (!hasUserSessionForCloud()) {
    return false;
  }

  charactersStatus.textContent = "Reconectando sessão Google no navegador...";

  try {
    if (typeof window.DVHAuth?.reauthenticateCloudSession === "function") {
      const recovered = await withTimeout(
        window.DVHAuth.reauthenticateCloudSession(),
        45000,
        "Tempo de reconexão excedido"
      );
      if (recovered && window.DVHAuth?.hasCloudSession?.()) {
        return true;
      }
      return canUseCloudNow();
    }

    if (typeof window.DVHAuth?.signInWithGoogle !== "function") {
      return false;
    }

    await withTimeout(
      window.DVHAuth.signInWithGoogle(),
      45000,
      "Tempo de reconexão excedido"
    );
  } catch {
    return false;
  }

  return canUseCloudNow();
}

function openMenu() {
  if (!menuOverlay || !sideMenu || !menuButton) {
    return;
  }

  menuOverlay.hidden = false;
  menuOverlay.classList.add("is-open");
  sideMenu.classList.add("is-open");
  sideMenu.setAttribute("aria-hidden", "false");
  menuButton.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  if (!menuOverlay || !sideMenu || !menuButton) {
    return;
  }

  menuOverlay.classList.remove("is-open");
  sideMenu.classList.remove("is-open");
  sideMenu.setAttribute("aria-hidden", "true");
  menuButton.setAttribute("aria-expanded", "false");
  window.setTimeout(() => {
    menuOverlay.hidden = true;
  }, 160);
}

if (menuButton) {
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.addEventListener("click", () => {
    const isOpen = sideMenu?.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  });
}

if (menuClose) {
  menuClose.addEventListener("click", closeMenu);
}

if (menuOverlay) {
  menuOverlay.hidden = true;
  menuOverlay.addEventListener("click", closeMenu);
}

if (sideMenu) {
  sideMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

function readLocalCharacters() {
  try {
    const raw = localStorage.getItem(CHARACTERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCharacters(characters) {
  localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(characters));
}

function readSelectionMap() {
  try {
    const raw = localStorage.getItem(SELECTED_CHARACTER_MAP_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSelectionMap(map) {
  localStorage.setItem(SELECTED_CHARACTER_MAP_STORAGE_KEY, JSON.stringify(map));
}

function createSelectionToken(character) {
  return `${character?.id || "char"}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readDeletedCharacterIds() {
  try {
    const raw = localStorage.getItem(DELETED_CHARACTERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

function writeDeletedCharacterIds(ids) {
  localStorage.setItem(DELETED_CHARACTERS_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}

function markDeletedCharacterId(id) {
  if (!id) {
    return;
  }

  writeDeletedCharacterIds([...readDeletedCharacterIds(), id]);
}

function clearDeletedCharacterIds() {
  localStorage.removeItem(DELETED_CHARACTERS_STORAGE_KEY);
}

function getCharacterTimestamp(character) {
  const timestamp = new Date(character?.savedAt || "").getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mergeStoredCharacters(localCharacters, cloudCharacters) {
  const merged = new Map();

  [...localCharacters, ...cloudCharacters].forEach((character) => {
    if (!character || !character.id) {
      return;
    }

    const previous = merged.get(character.id);
    if (!previous || getCharacterTimestamp(character) >= getCharacterTimestamp(previous)) {
      merged.set(character.id, character);
    }
  });

  return [...merged.values()];
}

async function readStoredCharacters() {
  const localCharacters = readLocalCharacters();

  if (window.DVHAuth?.waitForAuthReady) {
    await window.DVHAuth.waitForAuthReady();
  }

  if (window.DVHAuth?.isConfigured?.() && (await canUseCloudNow())) {
    try {
      const cloudCharacters = await window.DVHAuth.listCharacters();
      writeLocalCharacters(cloudCharacters);
      clearDeletedCharacterIds();
      return cloudCharacters;
    } catch {
      return localCharacters;
    }
  }

  return localCharacters;
}

async function persistStoredCharacters(characters) {
  writeLocalCharacters(characters);

  if (window.DVHAuth?.waitForAuthReady) {
    await window.DVHAuth.waitForAuthReady();
  }

  if (window.DVHAuth?.isConfigured?.() && window.DVHAuth?.isLoggedIn?.()) {
    try {
      await window.DVHAuth.replaceAllCharacters(characters);
      clearDeletedCharacterIds();
      return { savedLocally: true, syncedToCloud: true };
    } catch {
      return { savedLocally: true, syncedToCloud: false };
    }
  }

  return { savedLocally: true, syncedToCloud: false };
}

function formatSavedAt(value) {
  if (!value) {
    return "Data não informada";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

async function renderStoredCharacters() {
  if (!charactersGrid || !charactersStatus) {
    return;
  }

  try {
    if (window.DVHAuth?.waitForAuthReady) {
      await window.DVHAuth.waitForAuthReady();
    }

    const authEnabled = Boolean(window.DVHAuth?.isConfigured?.());
    const hasUiSession = hasUserSessionForCloud();
    const loggedIn = await canUseCloudNow();

    const characters = await readStoredCharacters();
    charactersGrid.innerHTML = "";

    if (!characters.length) {
      if (authEnabled && hasUiSession && !loggedIn) {
        charactersStatus.textContent = "Sessão parcial detectada no Opera. Clique em Entrar com Google para reconectar a nuvem.";
      } else if (authEnabled && !loggedIn) {
        charactersStatus.textContent = "Nenhum personagem salvo localmente. Faça login com Google para acessar a nuvem.";
      } else {
        charactersStatus.textContent = authEnabled
          ? `Nenhum personagem salvo ainda. Limite por conta: ${MAX_CHARACTERS_PER_ACCOUNT}.`
          : "Nenhum personagem salvo ainda.";
      }
      return;
    }

    if (authEnabled && !loggedIn) {
      charactersStatus.textContent = `${characters.length} personagem(ns) salvo(s) localmente. Faça login para sincronizar com a conta Google.`;
    } else {
      charactersStatus.textContent = `${characters.length}/${MAX_CHARACTERS_PER_ACCOUNT} personagem(ns) salvo(s)`;
    }

    [...characters]
      .sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime())
      .forEach((character) => {
        const card = document.createElement("article");
        card.className = "character-card";

      const title = document.createElement("strong");
      title.textContent = character.name || "Personagem sem nome";

      const meta = document.createElement("p");
      meta.className = "character-meta";
      meta.innerHTML = [
        `Classe: ${character.className || "-"}`,
        `Raça: ${character.raceName || "-"}`,
        `Origem: ${character.originName || "-"}`,
        `Salvo em: ${formatSavedAt(character.savedAt)}`
      ].join("<br>");

      const actions = document.createElement("div");
      actions.className = "character-actions";

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "character-action";
      openButton.textContent = "Abrir na ficha";
      openButton.addEventListener("click", () => {
        const token = createSelectionToken(character);
        const map = readSelectionMap();
        map[token] = {
          id: character.id || "",
          data: character.data || {},
          createdAt: Date.now()
        };
        writeSelectionMap(map);

        // Keep legacy keys for backward compatibility while new token flow is adopted.
        localStorage.setItem(SELECTED_CHARACTER_STORAGE_KEY, character.id);
        localStorage.setItem(SELECTED_CHARACTER_DATA_STORAGE_KEY, JSON.stringify(character.data || {}));

        window.location.href = `ficha.html?selection=${encodeURIComponent(token)}`;
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "character-action is-danger";
      deleteButton.textContent = "Remover";
      deleteButton.addEventListener("click", async () => {
        const authEnabled = Boolean(window.DVHAuth?.isConfigured?.());
        let loggedIn = await canUseCloudNow();

        if (authEnabled && !loggedIn && hasUserSessionForCloud()) {
          loggedIn = await ensureCloudSessionOnUserAction();
        }

        if (authEnabled && loggedIn && typeof window.DVHAuth?.deleteCharacter === "function") {
          try {
            await window.DVHAuth.deleteCharacter(character.id);
            const fresh = await window.DVHAuth.listCharacters();
            writeLocalCharacters(fresh);
            clearDeletedCharacterIds();
          } catch {
            charactersStatus.textContent = "Não foi possível remover da conta Google agora. Tente novamente.";
            return;
          }
        } else {
          markDeletedCharacterId(character.id);
          const next = (await readStoredCharacters()).filter((entry) => entry.id !== character.id);
          await persistStoredCharacters(next);
        }

        await renderStoredCharacters();
      });

        actions.append(openButton, deleteButton);
        card.append(title, meta, actions);
        charactersGrid.appendChild(card);
      });
  } catch {
    charactersGrid.innerHTML = "";
    charactersStatus.textContent = "Não foi possível carregar seus personagens agora.";
  }
}

void renderStoredCharacters();

if (window.DVHAuth?.onAuthStateChanged) {
  window.DVHAuth.onAuthStateChanged(() => {
    void renderStoredCharacters();
  });
}
