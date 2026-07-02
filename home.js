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
const raceCount = document.getElementById("raceCount");
const raceStatus = document.getElementById("raceStatus");

async function loadRaces() {
  if (!raceGrid) {
    return;
  }

  raceGrid.innerHTML = "";
  raceStatus.textContent = "Carregando raças...";

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

  const validRaces = races.filter(Boolean);
  if (raceCount) {
    raceCount.textContent = `${validRaces.length} raças carregadas`;
  }
  raceStatus.textContent = validRaces.length ? "Selecione uma raça para entrar na ficha." : "Não foi possível carregar as raças.";

  validRaces.forEach((race) => {
    const theme = race.theme || {};
    const card = document.createElement("button");
    card.type = "button";
    card.className = "race-card";
    card.style.setProperty("--card-start", theme["--page-bg-start"] || "#11294a");
    card.style.setProperty("--card-mid", theme["--page-bg-mid"] || "#1b3b68");
    card.style.setProperty("--card-end", theme["--page-bg-end"] || "#08101d");
    card.style.setProperty("--card-glow", theme["--page-glow"] || "rgba(0, 213, 255, 0.18)");
    card.style.setProperty("--card-accent", theme["--accent-soft"] || "#ffc14f");

    card.innerHTML = `
      <span class="race-card__tag">Raça</span>
      <strong>${race.displayName || race.id}</strong>
      <span class="race-card__meta">Fator de idade: ${race.ageFactor ?? "-"}</span>
      <span class="race-card__meta">Tema visual carregado do JSON</span>
      <span class="race-card__action">Abrir na ficha</span>
    `;

    card.addEventListener("click", () => {
      localStorage.setItem("selectedRace", race.id);
      window.location.href = "ficha.html";
    });

    raceGrid.appendChild(card);
  });
}

loadRaces();
