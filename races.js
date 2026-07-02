const raceFiles = [
  "alien.json",
  "anao.json",
  "anjo.json",
  "anjocaido.json",
  "banshee.json",
  "bruxa.json",
  "ciborgue.json",
  "demonio.json",
  "elfo.json",
  "esqueleto.json",
  "fae.json",
  "humano.json",
  "kanima.json",
  "kitsune.json",
  "lobisomem.json",
  "metamorfo.json",
  "neko.json",
  "ninfa.json",
  "nogitsune.json",
  "satiro.json",
  "semideus.json",
  "sereia.json",
  "subuco.json",
  "vampiro.json",
  "veliria.json"
];

const raceGrid = document.getElementById("raceGrid");
const raceSearch = document.getElementById("raceSearch");
const raceStats = document.getElementById("raceStats");
const menuButton = document.querySelector(".icon-btn[aria-label='Menu']");
const menuClose = document.getElementById("menuClose");
const menuOverlay = document.getElementById("menuOverlay");
const sideMenu = document.getElementById("sideMenu");

let allRaces = [];

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

async function loadRaces() {
  if (!raceGrid) {
    return;
  }

  raceGrid.innerHTML = "";
  raceStats.textContent = "Carregando raças...";

  const races = await Promise.all(
    raceFiles.map(async (fileName) => {
      try {
        const response = await fetch(`races/${fileName}`, { cache: "no-store" });
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

  allRaces = races.filter(Boolean);
  renderRaces(allRaces);

  if (raceSearch) {
    raceSearch.addEventListener("input", () => {
      const query = raceSearch.value.trim().toLowerCase();
      const filtered = allRaces.filter((race) => {
        const name = (race.displayName || race.id || "").toLowerCase();
        return name.includes(query);
      });
      renderRaces(filtered);
    });
  }
}

function renderRaces(races) {
  if (!raceGrid || !raceStats) {
    return;
  }

  raceGrid.innerHTML = "";
  raceStats.textContent = `${races.length} raça(s) exibida(s)`;

  races.forEach((race) => {
    const theme = race.theme || {};
    const card = document.createElement("button");
    card.type = "button";
    card.className = "race-card";
    card.style.setProperty("--card-start", theme["--page-bg-start"] || "#11294a");
    card.style.setProperty("--card-mid", theme["--page-bg-mid"] || "#1b3b68");
    card.style.setProperty("--card-end", theme["--page-bg-end"] || "#08101d");
    card.style.setProperty("--card-glow", theme["--page-glow"] || "rgba(0, 213, 255, 0.18)");
    card.style.setProperty("--card-accent", theme["--accent-soft"] || "#ffc14f");

    const detailLines = [
      `Fator de idade: ${race.ageFactor ?? "-"}`,
      `Paleta: ${theme["--page-bg-start"] || "padrão"}`,
      `Tema: ${race.displayName || race.id}`
    ];

    card.innerHTML = `
      <span class="race-card__tag">Raça</span>
      <strong>${race.displayName || race.id}</strong>
      <span class="race-card__meta">JSON: ${race.id}.json</span>
      <span class="race-card__detail">${detailLines.join("<br>")}</span>
      <span class="race-card__action">Ver detalhes</span>
    `;

    card.addEventListener("click", () => {
      window.location.href = `detail.html?type=race&id=${encodeURIComponent(race.id)}`;
    });

    raceGrid.appendChild(card);
  });
}

loadRaces();
