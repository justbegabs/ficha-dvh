const CHARACTERS_STORAGE_KEY = "dvhCharacters";
const SELECTED_CHARACTER_STORAGE_KEY = "dvhSelectedCharacterId";

const charactersGrid = document.getElementById("charactersGrid");
const charactersStatus = document.getElementById("charactersStatus");
const menuButton = document.querySelector(".icon-btn[aria-label='Menu']");
const menuClose = document.getElementById("menuClose");
const menuOverlay = document.getElementById("menuOverlay");
const sideMenu = document.getElementById("sideMenu");

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

function readStoredCharacters() {
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

function writeStoredCharacters(characters) {
  localStorage.setItem(CHARACTERS_STORAGE_KEY, JSON.stringify(characters));
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

function renderStoredCharacters() {
  if (!charactersGrid || !charactersStatus) {
    return;
  }

  const characters = readStoredCharacters();
  charactersGrid.innerHTML = "";

  if (!characters.length) {
    charactersStatus.textContent = "Nenhum personagem salvo ainda.";
    return;
  }

  charactersStatus.textContent = `${characters.length} personagem(ns) salvo(s)`;

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
        localStorage.setItem(SELECTED_CHARACTER_STORAGE_KEY, character.id);
        window.location.href = "ficha.html";
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "character-action is-danger";
      deleteButton.textContent = "Remover";
      deleteButton.addEventListener("click", () => {
        const next = readStoredCharacters().filter((entry) => entry.id !== character.id);
        writeStoredCharacters(next);
        renderStoredCharacters();
      });

      actions.append(openButton, deleteButton);
      card.append(title, meta, actions);
      charactersGrid.appendChild(card);
    });
}

renderStoredCharacters();
