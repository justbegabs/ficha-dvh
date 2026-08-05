const infoEntries = [
  {
    id: "introducao-do-mundo",
    displayName: "Introdução do Mundo",
    category: "Lore",
    summary: "Panorama geral do mundo, ambientação e tom da campanha.",
    href: "info-introducao-do-mundo.html",
    theme: {
      "--page-bg-start": "#10253f",
      "--page-bg-mid": "#234e77",
      "--page-bg-end": "#091a2d",
      "--page-glow": "rgba(0, 213, 255, 0.2)",
      "--accent-soft": "#ffc14f"
    }
  },
  {
    id: "introducao-de-npcs",
    displayName: "Indrodução de NPC's",
    category: "Personagens",
    summary: "Visão geral dos NPC's, papéis narrativos e relações importantes.",
    href: "info-indroducao-de-npcs.html",
    theme: {
      "--page-bg-start": "#1a2742",
      "--page-bg-mid": "#385a87",
      "--page-bg-end": "#0a1a30",
      "--page-glow": "rgba(120, 208, 255, 0.2)",
      "--accent-soft": "#ffce70"
    }
  },
  {
    id: "documentos-nao-oficiais",
    displayName: "Documentos Não Oficiais",
    category: "Material Extra",
    summary: "Compilado de textos paralelos, notas e referências suplementares.",
    href: "info-documentos-nao-oficiais.html",
    theme: {
      "--page-bg-start": "#142339",
      "--page-bg-mid": "#2d4969",
      "--page-bg-end": "#0a1627",
      "--page-glow": "rgba(148, 219, 255, 0.2)",
      "--accent-soft": "#ffd790"
    }
  },
  {
    id: "mecanicas",
    displayName: "Mecânicas",
    category: "Sistema",
    summary: "Resumo das mecânicas centrais e fluxo de jogo na ficha.",
    href: "info-mecanicas.html",
    theme: {
      "--page-bg-start": "#0f2943",
      "--page-bg-mid": "#2b567d",
      "--page-bg-end": "#0a1b30",
      "--page-glow": "rgba(96, 202, 255, 0.22)",
      "--accent-soft": "#ffc867"
    }
  }
];

const infoGrid = document.getElementById("infoGrid");
const infoSearch = document.getElementById("infoSearch");
const infoStats = document.getElementById("infoStats");
const menuButton = document.querySelector(".icon-btn[aria-label='Menu']");
const menuClose = document.getElementById("menuClose");
const menuOverlay = document.getElementById("menuOverlay");
const sideMenu = document.getElementById("sideMenu");

let allInfos = [];

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

async function loadInfos() {
  if (!infoGrid || !infoStats) {
    return;
  }

  infoGrid.innerHTML = "";
  infoStats.textContent = "Carregando informações...";

  let cmsInfos = [];
  if (window.DVHCmsContent?.getEntries) {
    cmsInfos = await window.DVHCmsContent.getEntries("informacoes");
  }

  const baseInfos = infoEntries.map((entry) => ({ ...entry, source: "base" }));
  const cmsInfosTagged = cmsInfos.map((entry) => ({ ...entry, source: "cms" }));

  const mergedById = new Map();
  baseInfos.forEach((entry) => {
    mergedById.set(entry.id, entry);
  });
  cmsInfosTagged.forEach((entry) => {
    mergedById.set(entry.id, entry);
  });

  allInfos = [...mergedById.values()];
  renderInfos(allInfos);

  if (infoSearch) {
    infoSearch.addEventListener("input", () => {
      const query = infoSearch.value.trim().toLowerCase();
      const filtered = allInfos.filter((entry) => {
        const displayName = (entry.displayName || entry.id || "").toLowerCase();
        const summary = (entry.summary || entry.description || "").toLowerCase();
        const category = String(entry.category || "").toLowerCase();
        return displayName.includes(query) || summary.includes(query) || category.includes(query);
      });
      renderInfos(filtered);
    });
  }
}

function renderInfos(entries) {
  if (!infoGrid || !infoStats) {
    return;
  }

  infoGrid.innerHTML = "";
  infoStats.textContent = `${entries.length} informação(ões) exibida(s)`;

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

    const category = entry.category ? `Categoria: ${entry.category}` : "Categoria: geral";

    const sourceLabel = entry.source === "cms" ? "Admin" : "Página";
    const sourceValue = entry.source === "cms" ? entry.id : entry.href;

    const coverMarkup = entry.coverImageUrl
      ? `<span class="race-card__meta">Capa: disponível</span>`
      : "";

    card.innerHTML = `
      <span class="race-card__tag">Info</span>
      <strong>${entry.displayName || entry.id}</strong>
      <span class="race-card__meta">${sourceLabel}: ${sourceValue}</span>
      ${coverMarkup}
      <span class="race-card__detail">${category}<br>${entry.summary || entry.description || "Informação carregada do JSON."}</span>
      <span class="race-card__action">Ver detalhes</span>
    `;

    card.addEventListener("click", () => {
      if (entry.source === "cms") {
        window.location.href = `detail.html?type=info&id=${encodeURIComponent(entry.id)}&source=cms`;
        return;
      }

      window.location.href = entry.href;
    });

    infoGrid.appendChild(card);
  });
}

loadInfos();
