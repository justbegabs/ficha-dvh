const originFiles = [
  "amnesico.json",
  "artista.json",
  "conspiracionista.json",
  "criancaperdida.json",
  "eremita.json",
  "escolhido.json",
  "exilado.json",
  "experimento.json",
  "forasteiro.json",
  "ginasta.json",
  "guerreiro.json",
  "herdeiro.json",
  "inventor.json",
  "jornalista.json",
  "militar.json",
  "motorista.json",
  "nomade.json",
  "profeta.json",
  "programador.json",
  "psicologo.json",
  "religioso.json",
  "servente.json",
  "universitario.json",
  "vingativo.json"
];

const originGrid = document.getElementById("originGrid");
const originSearch = document.getElementById("originSearch");
const originStats = document.getElementById("originStats");
const menuButton = document.querySelector(".icon-btn[aria-label='Menu']");
const menuClose = document.getElementById("menuClose");
const menuOverlay = document.getElementById("menuOverlay");
const sideMenu = document.getElementById("sideMenu");

let allOrigins = [];

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

async function loadOrigins() {
  if (!originGrid) {
    return;
  }

  originGrid.innerHTML = "";
  originStats.textContent = "Carregando origens...";

  const origins = await Promise.all(
    originFiles.map(async (fileName) => {
      try {
        const response = await fetch(`origens/${fileName}`, { cache: "no-store" });
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

  allOrigins = origins.filter(Boolean);
  renderOrigins(allOrigins);

  if (originSearch) {
    originSearch.addEventListener("input", () => {
      const query = originSearch.value.trim().toLowerCase();
      const filtered = allOrigins.filter((origin) => {
        const name = (origin.displayName || origin.id || "").toLowerCase();
        return name.includes(query);
      });
      renderOrigins(filtered);
    });
  }
}

function renderOrigins(origins) {
  if (!originGrid || !originStats) {
    return;
  }

  originGrid.innerHTML = "";
  originStats.textContent = `${origins.length} origem(ns) exibida(s)`;

  origins.forEach((origin) => {
    const theme = origin.theme || {};
    const card = document.createElement("button");
    card.type = "button";
    card.className = "race-card";
    card.style.setProperty("--card-start", theme["--page-bg-start"] || "#11294a");
    card.style.setProperty("--card-mid", theme["--page-bg-mid"] || "#1b3b68");
    card.style.setProperty("--card-end", theme["--page-bg-end"] || "#08101d");
    card.style.setProperty("--card-glow", theme["--page-glow"] || "rgba(0, 213, 255, 0.18)");
    card.style.setProperty("--card-accent", theme["--accent-soft"] || "#ffc14f");

    card.innerHTML = `
      <span class="race-card__tag">Origem</span>
      <strong>${origin.displayName || origin.id}</strong>
      <span class="race-card__meta">JSON: ${origin.id}.json</span>
      <span class="race-card__detail">${origin.summary || "Origem carregada do JSON."}</span>
      <span class="race-card__action">Ver detalhes</span>
    `;

    card.addEventListener("click", () => {
      window.location.href = `detail.html?type=origin&id=${encodeURIComponent(origin.id)}`;
    });

    originGrid.appendChild(card);
  });
}

loadOrigins();
