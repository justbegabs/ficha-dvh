const params = new URLSearchParams(window.location.search);
const detailType = params.get("type") || "race";
const detailId = params.get("id") || "";
const folder = detailType === "origin" ? "origens" : detailType === "class" ? "classes" : "races";
const listPage = detailType === "origin" ? "origens.html" : detailType === "class" ? "classes.html" : "races.html";

const title = document.getElementById("detailTitle");
const subtitle = document.getElementById("detailSubtitle");
const detailTag = document.getElementById("detailTag");
const detailName = document.getElementById("detailName");
const detailMeta = document.getElementById("detailMeta");
const detailSummary = document.getElementById("detailSummary");
const detailInfo = document.getElementById("detailInfo");
const detailHero = document.getElementById("detailHero");
const selectButton = document.getElementById("selectButton");
const relatedLink = document.getElementById("relatedLink");

async function loadDetail() {
  if (!detailId) {
    renderError("Nenhum detalhe foi selecionado.");
    return;
  }

  try {
    const response = await fetch(`${folder}/${detailId}.json`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(detailId);
    }

    const data = await response.json();
    renderDetail(data);
  } catch {
    renderError("Não foi possível carregar os dados desta entrada.");
  }
}

function renderDetail(data) {
  const theme = data.theme || {};
  const displayName = data.displayName || detailId;
  const summary = data.summary || data.description || (detailType === "class" ? "" : "Sem descrição disponível no JSON.");
  const infoLines = buildInfoLines(data);

  document.documentElement.style.setProperty("--page-bg-start", theme["--page-bg-start"] || "#07192f");
  document.documentElement.style.setProperty("--page-bg-mid", theme["--page-bg-mid"] || "#153a62");
  document.documentElement.style.setProperty("--page-bg-end", theme["--page-bg-end"] || "#0b2440");
  document.documentElement.style.setProperty("--page-glow", theme["--page-glow"] || "rgba(0, 213, 255, 0.2)");
  document.documentElement.style.setProperty("--panel", theme["--panel-bg"] || "rgba(11, 31, 56, 0.82)");
  document.documentElement.style.setProperty("--line", theme["--panel-border"] || "rgba(0, 213, 255, 0.7)");
  document.documentElement.style.setProperty("--accent-soft", theme["--accent-soft"] || "#ffc14f");

  const typeLabel = detailType === "origin" ? "Origem" : detailType === "class" ? "Classe" : "Raça";

  title.textContent = `${typeLabel}: ${displayName}`;
  subtitle.textContent = detailType === "origin"
    ? "Detalhes da origem carregados do JSON."
    : detailType === "class"
      ? "Detalhes da classe carregados do JSON."
      : "Detalhes da raça carregados do JSON.";
  detailTag.textContent = typeLabel;
  detailName.textContent = displayName;
  detailMeta.innerHTML = [
    `<span>Arquivo: ${detailId}.json</span>`,
    `<span>Tipo: ${typeLabel}</span>`
  ].join("");
  detailSummary.textContent = summary;
  detailInfo.innerHTML = infoLines.map((line) => `<div>${line}</div>`).join("");

  if (selectButton) {
    selectButton.textContent = detailType === "origin" ? "Usar origem na ficha" : detailType === "class" ? "Usar classe na ficha" : "Usar raça na ficha";
    selectButton.addEventListener("click", () => {
      localStorage.setItem(detailType === "origin" ? "selectedOrigin" : detailType === "class" ? "selectedClass" : "selectedRace", detailId);
      window.location.href = "ficha.html";
    });
  }

  if (relatedLink) {
    relatedLink.textContent = detailType === "origin" ? "Abrir lista de origens" : detailType === "class" ? "Abrir lista de classes" : "Abrir lista de raças";
    relatedLink.href = listPage;
  }
}

function buildInfoLines(data) {
  const lines = [];

  if (typeof data.ageFactor === "number") {
    lines.push(`Fator de idade: ${data.ageFactor}`);
  }

  if (data.theme) {
    const colorStart = data.theme["--page-bg-start"] || "-";
    const colorMid = data.theme["--page-bg-mid"] || "-";
    const colorEnd = data.theme["--page-bg-end"] || "-";
    lines.push(`Cores: ${colorStart}, ${colorMid}, ${colorEnd}`);
  }

  Object.entries(data)
    .filter(([key]) => key !== "theme" && key !== "summary" && key !== "description" && key !== "displayName" && key !== "ageFactor")
    .forEach(([key, value]) => {
      if (typeof value === "string" || typeof value === "number") {
        lines.push(`${key}: ${value}`);
      }
    });

  if (lines.length === 0) {
    lines.push("Nenhuma informação adicional disponível.");
  }

  return lines;
}

function renderError(message) {
  if (title) title.textContent = "Erro";
  if (subtitle) subtitle.textContent = message;
  if (detailName) detailName.textContent = "-";
  if (detailSummary) detailSummary.textContent = message;
  if (detailInfo) detailInfo.textContent = message;
  if (selectButton) {
    selectButton.disabled = true;
  }
}

loadDetail();
