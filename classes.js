const classFiles = [
  "mago.json",
  "atirador.json",
  "armadilheiro.json",
  "combatente.json",
  "investigador.json",
  "curandeiro.json",
  "suporte.json",
  "tecnologico.json",
  "clerigo.json",
  "demonologista.json",
  "domador.json",
  "espiao.json",
  "carteado.json",
  "arsenalhumano.json"
];

const classGrid = document.getElementById("classGrid");
const classSearch = document.getElementById("classSearch");
const classStats = document.getElementById("classStats");
const menuButton = document.querySelector(".icon-btn[aria-label='Menu']");
const menuClose = document.getElementById("menuClose");
const menuOverlay = document.getElementById("menuOverlay");
const sideMenu = document.getElementById("sideMenu");

let allClasses = [];

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

async function loadClasses() {
  if (!classGrid) {
    return;
  }

  classGrid.innerHTML = "";
  classStats.textContent = "Carregando classes...";

  const classes = await Promise.all(
    classFiles.map(async (fileName) => {
      try {
        const response = await fetch(`classes/${fileName}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(fileName);
        }
        const data = await response.json();
        return {
          id: fileName.replace(/\.json$/i, ""),
          ...data
        };
      } catch {
        return null;
      }
    })
  );

  allClasses = classes.filter(Boolean);
  renderClasses(allClasses);

  if (classSearch) {
    classSearch.addEventListener("input", () => {
      const query = classSearch.value.trim().toLowerCase();
      const filtered = allClasses.filter((entry) => {
        const name = (entry.displayName || entry.id || "").toLowerCase();
        return name.includes(query);
      });
      renderClasses(filtered);
    });
  }
}

function renderClasses(entries) {
  if (!classGrid || !classStats) {
    return;
  }

  classGrid.innerHTML = "";
  classStats.textContent = `${entries.length} classe(s) exibida(s)`;

  entries.forEach((entry) => {
    const theme = entry.theme || {};
    const card = document.createElement("button");
    card.type = "button";
    card.className = "race-card";
    card.style.setProperty("--card-start", theme["--page-bg-start"] || "#11294a");
    card.style.setProperty("--card-mid", theme["--page-bg-mid"] || "#1b3b68");
    card.style.setProperty("--card-end", theme["--page-bg-end"] || "#08101d");
    card.style.setProperty("--card-glow", theme["--page-glow"] || "rgba(0, 213, 255, 0.18)");
    card.style.setProperty("--card-accent", theme["--accent-soft"] || "#ffc14f");

    card.innerHTML = `
      <span class="race-card__tag">Classe</span>
      <strong>${entry.displayName || entry.id}</strong>
      <span class="race-card__meta">JSON: ${entry.id}.json</span>
      <span class="race-card__action">Ver detalhes</span>
    `;

    card.addEventListener("click", () => {
      window.location.href = `detail.html?type=class&id=${encodeURIComponent(entry.id)}`;
    });

    classGrid.appendChild(card);
  });
}

loadClasses();
