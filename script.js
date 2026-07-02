const ATTRIBUTE_POOL = 15;
const SKILL_POOL = 20;
const CHARACTERISTIC_POOL = 13;
const ATTRIBUTE_MIN_VALUE = 1;
const ATTRIBUTE_MAX_VALUE = 3;
const SKILL_MIN_VALUE = 1;
const SKILL_MAX_VALUE = 3;
const CHARACTERISTIC_SLOTS = 5;
const CHARACTERISTIC_NAMES = ["Crenca", "Fortuna", "Legado", "Improviso", "Perseveranca"];
const RACE_FILE_NAMES = [
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
const ORIGIN_FILE_NAMES = [
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
const CLASS_FILE_NAMES = [
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
const RACE_AGE_FACTORS = {
  Humano: 1,
  Elfo: 5,
  Anao: 2,
  Orc: 0.85,
  Draconico: 1.6,
  Fada: 3.5,
  Goblin: 0.7
};

const raceCatalog = {};
const originCatalog = {};
const classCatalog = {};

const CLASS_THEMES = {
  Guerreiro: {
    "--accent": "#d85c37",
    "--accent-soft": "#f0b16c",
    "--button-start": "#d85c37",
    "--button-end": "#a33d24",
    "--hero-glow": "rgba(216, 92, 55, 0.42)"
  },
  Arqueiro: {
    "--accent": "#2f9b68",
    "--accent-soft": "#95d58d",
    "--button-start": "#2f9b68",
    "--button-end": "#206b49",
    "--hero-glow": "rgba(47, 155, 104, 0.42)"
  },
  Mago: {
    "--accent": "#655cf0",
    "--accent-soft": "#b3aaff",
    "--button-start": "#655cf0",
    "--button-end": "#4337b8",
    "--hero-glow": "rgba(101, 92, 240, 0.42)"
  },
  Clerigo: {
    "--accent": "#c79d2c",
    "--accent-soft": "#f0d27a",
    "--button-start": "#c79d2c",
    "--button-end": "#97731b",
    "--hero-glow": "rgba(199, 157, 44, 0.42)"
  },
  Ladino: {
    "--accent": "#8f59db",
    "--accent-soft": "#d0a9ff",
    "--button-start": "#8f59db",
    "--button-end": "#643aa8",
    "--hero-glow": "rgba(143, 89, 219, 0.42)"
  }
};

const RACE_THEMES = {
  Humano: {
    "--page-bg-start": "#f8dcb4",
    "--page-bg-mid": "#e0b18f",
    "--page-bg-end": "#dccdb6",
    "--page-glow": "rgba(180, 74, 47, 0.22)",
    "--panel-bg": "rgba(255, 251, 245, 0.86)",
    "--panel-border": "#d6c7b0",
    "--line": "#d6c7b0",
    "--ink": "#2f3440",
    "--ink-strong": "#1d2430",
    "--warn": "#874322",
    "--good": "#266c4f"
  },
  Elfo: {
    "--page-bg-start": "#dcfff7",
    "--page-bg-mid": "#b8eee5",
    "--page-bg-end": "#d7e7ff",
    "--page-glow": "rgba(57, 188, 168, 0.18)",
    "--panel-bg": "rgba(248, 255, 253, 0.9)",
    "--panel-border": "#b7d9d5",
    "--line": "#bedbd7",
    "--ink": "#27323a",
    "--ink-strong": "#17323a",
    "--warn": "#2e6e67",
    "--good": "#227151"
  },
  Anao: {
    "--page-bg-start": "#f4e3cc",
    "--page-bg-mid": "#dfc19b",
    "--page-bg-end": "#cfa982",
    "--page-glow": "rgba(148, 92, 42, 0.2)",
    "--panel-bg": "rgba(255, 247, 237, 0.92)",
    "--panel-border": "#d2b18d",
    "--line": "#cda57d",
    "--ink": "#32261d",
    "--ink-strong": "#20160f",
    "--warn": "#90552a",
    "--good": "#3e6a4a"
  },
  Orc: {
    "--page-bg-start": "#dbe7d6",
    "--page-bg-mid": "#b8d0b2",
    "--page-bg-end": "#7f9b73",
    "--page-glow": "rgba(76, 119, 61, 0.2)",
    "--panel-bg": "rgba(242, 250, 239, 0.9)",
    "--panel-border": "#a9c49d",
    "--line": "#a7bf96",
    "--ink": "#253026",
    "--ink-strong": "#162019",
    "--warn": "#6b7d3d",
    "--good": "#2d6a46"
  },
  Draconico: {
    "--page-bg-start": "#f9e1d2",
    "--page-bg-mid": "#efb89a",
    "--page-bg-end": "#c67c68",
    "--page-glow": "rgba(233, 112, 70, 0.24)",
    "--panel-bg": "rgba(255, 247, 242, 0.9)",
    "--panel-border": "#e0a589",
    "--line": "#d89075",
    "--ink": "#3a2420",
    "--ink-strong": "#261512",
    "--warn": "#ac4b31",
    "--good": "#6d5940"
  },
  Fada: {
    "--page-bg-start": "#fde7ff",
    "--page-bg-mid": "#efd1ff",
    "--page-bg-end": "#d8e7ff",
    "--page-glow": "rgba(194, 127, 241, 0.2)",
    "--panel-bg": "rgba(255, 250, 255, 0.92)",
    "--panel-border": "#e0c9ff",
    "--line": "#d8c0f1",
    "--ink": "#322a38",
    "--ink-strong": "#241a2d",
    "--warn": "#7d4aa1",
    "--good": "#4e6f9d"
  },
  Goblin: {
    "--page-bg-start": "#f1f5cf",
    "--page-bg-mid": "#d8e09b",
    "--page-bg-end": "#aebc6b",
    "--page-glow": "rgba(126, 142, 49, 0.2)",
    "--panel-bg": "rgba(250, 252, 235, 0.92)",
    "--panel-border": "#cdd392",
    "--line": "#bcc575",
    "--ink": "#2c3120",
    "--ink-strong": "#1c2014",
    "--warn": "#7c812d",
    "--good": "#47644a"
  }
};

const ORIGIN_THEMES = {
  Nobreza: {
    "--accent-soft": "#f2d36c",
    "--panel-border": "#d7bc7a",
    "--page-glow": "rgba(242, 211, 108, 0.2)",
    "--hero-glow": "rgba(242, 211, 108, 0.42)"
  },
  Povoado: {
    "--accent-soft": "#e7b36e",
    "--panel-border": "#d6aa6b",
    "--page-glow": "rgba(231, 179, 110, 0.18)",
    "--hero-glow": "rgba(231, 179, 110, 0.36)"
  },
  Exilio: {
    "--accent-soft": "#9ca4b0",
    "--panel-border": "#aab0bb",
    "--page-glow": "rgba(156, 164, 176, 0.18)",
    "--hero-glow": "rgba(156, 164, 176, 0.34)"
  },
  Santuario: {
    "--accent-soft": "#92e0d5",
    "--panel-border": "#8dcfca",
    "--page-glow": "rgba(146, 224, 213, 0.18)",
    "--hero-glow": "rgba(146, 224, 213, 0.36)"
  },
  Fronteira: {
    "--accent-soft": "#e08d5f",
    "--panel-border": "#cf8a63",
    "--page-glow": "rgba(224, 141, 95, 0.18)",
    "--hero-glow": "rgba(224, 141, 95, 0.36)"
  }
};

const attributeGroups = {
  "Atributos de Teste": ["Precisao", "Potencia", "Logica", "Perspicacia", "Estamina", "Essencia", "Encanto"]
};

const skillGroups = {
  Potencia: ["Briga", "Esgrima", "Manobras", "Protecao", "Arquearia"],
  Precisao: ["Mira", "Engenhocas", "Balistica", "Navegacao", "Prontidao", "Sombra"],
  Logica: ["Herbologia", "Academia", "Ilegalidade"],
  Perspicacia: ["Expressao", "Psique", "Conviccao", "Transmutacao", "Historia", "Vigilancia"],
  Essencia: ["Liturgia", "Evocacao", "Encantamento", "Simulacro", "Necromancia", "Runas"],
  Estamina: ["Sobrevivencia", "Condicionamento", "Robustez"],
  Encanto: ["Negociacao", "Dissimulacao", "Pressao", "Compreensao", "Fascinio", "Persuasao"]
};

const displayNames = {
  "Atributos de Teste": "Atributos de Teste",
  Precisao: "Precisão",
  Potencia: "Potência",
  Logica: "Lógica",
  Perspicacia: "Perspicácia",
  Estamina: "Estamina",
  Essencia: "Essência",
  Encanto: "Encanto",
  Crenca: "Crença",
  Fortuna: "Fortuna",
  Legado: "Legado",
  Improviso: "Improviso",
  Perseveranca: "Perseverança",
  Briga: "Briga",
  Esgrima: "Esgrima",
  Manobras: "Manobras",
  Protecao: "Proteção",
  Arquearia: "Arquearia",
  Mira: "Mira",
  Engenhocas: "Engenhocas",
  Balistica: "Balística",
  Navegacao: "Navegação",
  Prontidao: "Prontidão",
  Sombra: "Sombra",
  Herbologia: "Herbologia",
  Academia: "Academia",
  Ilegalidade: "Ilegalidade",
  Expressao: "Expressão",
  Psique: "Psique",
  Conviccao: "Convicção",
  Transmutacao: "Transmutação",
  Historia: "História",
  Vigilancia: "Vigilância",
  Liturgia: "Liturgia",
  Evocacao: "Evocação",
  Encantamento: "Encantamento",
  Simulacro: "Simulacro",
  Necromancia: "Necromancia",
  Runas: "Runas",
  Sobrevivencia: "Sobrevivência",
  Condicionamento: "Condicionamento",
  Robustez: "Robustez",
  Negociacao: "Negociação",
  Dissimulacao: "Dissimulação",
  Pressao: "Pressão",
  Compreensao: "Compreensão",
  Fascinio: "Fascínio",
  Persuasao: "Persuasão"
};

const state = {
  attributes: {},
  skills: {},
  skillCreationBase: {},
  skillProgress: {},
  characteristics: {},
  lastRollConfig: null,
  lastAgeField: "real"
};

const references = {
  rulesPanel: document.querySelector(".rules-panel"),
  rulesToggle: document.getElementById("rulesToggle"),
  rulesContent: document.getElementById("rulesContent"),
  attributesPool: document.getElementById("attributesPool"),
  characteristicsCount: document.getElementById("characteristicsCount"),
  skillsPool: document.getElementById("skillsPool"),
  attributesList: document.getElementById("attributesList"),
  characteristicsList: document.getElementById("characteristicsList"),
  characterClassInfo: document.getElementById("characterClassInfo"),
  characterRace: document.getElementById("characterRace"),
  characterRaceInfo: document.getElementById("characterRaceInfo"),
  characterOriginInfo: document.getElementById("characterOriginInfo"),
  realAge: document.getElementById("realAge"),
  humanAge: document.getElementById("humanAge"),
  ageHint: document.getElementById("ageHint"),
  skillsList: document.getElementById("skillsList"),
  testAttribute: document.getElementById("testAttribute"),
  testSkill: document.getElementById("testSkill"),
  rollButton: document.getElementById("rollButton"),
  rollResult: document.getElementById("rollResult"),
  resultPopup: document.getElementById("resultPopup"),
  rerollButton: document.getElementById("rerollButton"),
  closeResultPopup: document.getElementById("closeResultPopup"),
  xpSkill: document.getElementById("xpSkill"),
  xpAmount: document.getElementById("xpAmount"),
  xpButton: document.getElementById("xpButton"),
  xpResult: document.getElementById("xpResult"),
  damageResult: document.getElementById("damageResult")
};

void initialize();

async function initialize() {
  await loadRaceCatalog();
  await loadOriginCatalog();
  await loadClassCatalog();
  initializeValues();
  renderOriginSelectors();
  renderClassSelectors();
  syncOriginSelection();
  syncClassSelection();
  renderAttributeInputs();
  renderCharacteristicsInputs();
  renderSkillInputs();
  renderSelectors();
  updatePools();
  updateCharacteristicsCount();
  updateHumanAge();
  applyAppearanceTheme();
  bindEvents();
}

async function loadRaceCatalog() {
  const loadedRaces = await Promise.all(RACE_FILE_NAMES.map(async (fileName) => {
    const raceId = fileName.replace(/\.json$/i, "");

    try {
      const response = await fetch(`races/${fileName}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}`);
      }

      const data = await response.json();
      return {
        id: raceId,
        displayName: data.displayName || displayName(raceId),
        ageFactor: Number.isFinite(Number(data.ageFactor)) ? Number(data.ageFactor) : (RACE_AGE_FACTORS[displayName(raceId)] || 1),
        theme: data.theme || {}
      };
    } catch {
      return {
        id: raceId,
        displayName: displayName(raceId),
        ageFactor: RACE_AGE_FACTORS[displayName(raceId)] || 1,
        theme: {}
      };
    }
  }));

  loadedRaces.forEach((race) => {
    raceCatalog[race.id] = race;
  });
}

async function loadOriginCatalog() {
  const loadedOrigins = await Promise.all(ORIGIN_FILE_NAMES.map(async (fileName) => {
    const originId = fileName.replace(/\.json$/i, "");

    try {
      const response = await fetch(`origens/${fileName}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}`);
      }

      const data = await response.json();
      return {
        id: originId,
        displayName: data.displayName || displayName(originId),
        theme: data.theme || {},
        summary: data.summary || ""
      };
    } catch {
      return {
        id: originId,
        displayName: displayName(originId),
        theme: {},
        summary: ""
      };
    }
  }));

  loadedOrigins.forEach((origin) => {
    originCatalog[origin.id] = origin;
  });
}

async function loadClassCatalog() {
  const loadedClasses = await Promise.all(CLASS_FILE_NAMES.map(async (fileName) => {
    const classId = fileName.replace(/\.json$/i, "");

    try {
      const response = await fetch(`classes/${fileName}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load ${fileName}`);
      }

      const data = await response.json();
      return {
        id: classId,
        displayName: data.displayName || displayName(classId),
        theme: data.theme || {}
      };
    } catch {
      return {
        id: classId,
        displayName: displayName(classId),
        theme: {}
      };
    }
  }));

  loadedClasses.forEach((entry) => {
    classCatalog[entry.id] = entry;
  });
}

function initializeValues() {
  Object.values(attributeGroups).flat().forEach((name) => {
    state.attributes[name] = ATTRIBUTE_MIN_VALUE;
  });

  Object.values(skillGroups).flat().forEach((name) => {
    state.skills[name] = SKILL_MIN_VALUE;
    state.skillCreationBase[name] = SKILL_MIN_VALUE;
    state.skillProgress[name] = 0;
  });

  state.characteristics = Object.fromEntries(
    CHARACTERISTIC_NAMES.map((name) => [name, 0])
  );
}

function renderCharacteristicsInputs() {
  references.characteristicsList.innerHTML = "";

  CHARACTERISTIC_NAMES.forEach((name) => {
    const row = document.createElement("div");
    row.className = "characteristic-row";

    const label = document.createElement("label");
    label.textContent = displayName(name);
    label.classList.add("roll-trigger");
    label.title = "Clique para rolar esta característica";
    label.addEventListener("click", (event) => {
      event.preventDefault();
      rollCharacteristicTest(name);
    });

    const track = document.createElement("div");
    track.className = "characteristic-track";

    for (let slotIndex = 0; slotIndex < CHARACTERISTIC_SLOTS; slotIndex += 1) {
      const square = document.createElement("button");
      const currentValue = state.characteristics[name] || 0;
      square.type = "button";
      square.className = `characteristic-square ${slotIndex < currentValue ? "is-selected" : ""}`.trim();
      square.setAttribute("aria-label", `${displayName(name)} nível ${slotIndex + 1}`);
      square.addEventListener("click", () => {
        const previousValue = state.characteristics[name] || 0;
        const nextValue = slotIndex + 1;
        const valueToSet = previousValue === nextValue ? nextValue - 1 : nextValue;
        const totalBefore = Object.values(state.characteristics).reduce((sum, value) => sum + value, 0);
        const projectedTotal = totalBefore - previousValue + valueToSet;

        if (projectedTotal > CHARACTERISTIC_POOL) {
          showMessage(references.rollResult, "Limite de pontos de características excedido.", true);
          openResultPopup();
          return;
        }

        state.characteristics[name] = valueToSet;
        renderCharacteristicsInputs();
        updateCharacteristicsCount();
      });
      track.appendChild(square);
    }

    const value = document.createElement("span");
    value.className = "characteristic-value";
    const selectedSquares = state.characteristics[name] || 0;
    value.textContent = `${selectedSquares}/${CHARACTERISTIC_SLOTS} dados`;

    row.append(label, track, value);
    references.characteristicsList.appendChild(row);
  });
}

function renderAttributeInputs() {
  references.attributesList.innerHTML = "";

  Object.entries(attributeGroups).forEach(([, names]) => {
    names.forEach((name) => {
      references.attributesList.appendChild(createInputRow(name, "attribute"));
    });
  });
}

function renderSkillInputs() {
  references.skillsList.innerHTML = "";

  Object.entries(skillGroups).forEach(([groupName, names]) => {
    const title = document.createElement("h3");
    title.className = "group-title";
    title.textContent = displayName(groupName);
    references.skillsList.appendChild(title);

    names.forEach((name) => {
      references.skillsList.appendChild(createInputRow(name, "skill"));
    });
  });
}

function createInputRow(name, type) {
  if (type === "skill") {
    return createSkillInputRow(name);
  }

  const row = document.createElement("div");
  row.className = "row";

  const label = document.createElement("label");
  label.setAttribute("for", `${type}-${name}`);
  label.textContent = displayName(name);
  label.classList.add("roll-trigger");
  label.title = type === "skill" ? "Clique para rolar esta perícia" : "Clique para rolar este atributo";
  label.addEventListener("click", (event) => {
    event.preventDefault();
    if (type === "skill") {
      rollSkillTest(name);
      return;
    }

    rollAttributeTest(name);
  });

  const input = document.createElement("input");
  input.type = "number";
  const minValue = type === "attribute" ? ATTRIBUTE_MIN_VALUE : SKILL_MIN_VALUE;
  const maxValue = type === "attribute" ? ATTRIBUTE_MAX_VALUE : SKILL_MAX_VALUE;
  input.min = String(minValue);
  input.max = String(maxValue);
  input.value = String(type === "attribute" ? state.attributes[name] : state.skills[name]);
  input.id = `${type}-${name}`;
  input.dataset.name = name;
  input.dataset.type = type;
  input.addEventListener("change", onInputChange);

  row.append(label, input);
  return row;
}

function createSkillInputRow(skillName) {
  const wrapper = document.createElement("div");
  wrapper.className = "skill-item";

  const row = document.createElement("div");
  row.className = "row";

  const label = document.createElement("label");
  label.setAttribute("for", `skill-${skillName}`);
  label.textContent = displayName(skillName);
  label.classList.add("roll-trigger");
  label.title = "Clique para rolar esta perícia";
  label.addEventListener("click", (event) => {
    event.preventDefault();
    rollSkillTest(skillName);
  });

  const input = document.createElement("input");
  input.type = "number";
  input.min = String(SKILL_MIN_VALUE);
  input.max = String(SKILL_MAX_VALUE);
  input.value = String(state.skills[skillName]);
  input.id = `skill-${skillName}`;
  input.dataset.name = skillName;
  input.dataset.type = "skill";
  input.addEventListener("change", onInputChange);

  row.append(label, input);

  const progressBox = createSkillProgressBox(skillName);
  wrapper.append(row, progressBox);
  return wrapper;
}

function createSkillProgressBox(skillName) {
  const progress = state.skillProgress[skillName] || 0;
  const totalLevel = state.skills[skillName] || SKILL_MIN_VALUE;
  const requiredProgress = getSkillRequiredProgress(skillName);
  const box = document.createElement("div");
  box.className = "skill-progress";

  const caption = document.createElement("span");
  caption.className = "skill-progress-caption";
  caption.textContent = `Nível total: ${totalLevel} | Evolução: ${progress}/${requiredProgress}`;

  const track = document.createElement("div");
  track.className = "skill-progress-track";

  for (let index = 0; index < requiredProgress; index += 1) {
    const square = document.createElement("button");
    square.type = "button";
    square.className = `skill-progress-square ${index < progress ? "is-selected" : ""}`.trim();
    square.setAttribute("aria-label", `Progresso de evolução ${displayName(skillName)}: ${index + 1} de ${requiredProgress}`);
    square.addEventListener("click", () => {
      const previousValue = state.skillProgress[skillName] || 0;
      const nextValue = index + 1;
      state.skillProgress[skillName] = previousValue === nextValue ? nextValue - 1 : nextValue;
      renderSkillInputs();
    });
    track.appendChild(square);
  }

  box.append(caption, track);

  if (progress >= requiredProgress) {
    const evolveButton = document.createElement("button");
    evolveButton.type = "button";
    evolveButton.className = "skill-evolve-button";
    evolveButton.textContent = `Evoluir para nível ${totalLevel + 1}`;
    evolveButton.addEventListener("click", () => {
      state.skills[skillName] = (state.skills[skillName] || SKILL_MIN_VALUE) + 1;
      state.skillProgress[skillName] = 0;
      const skillField = document.getElementById(`skill-${skillName}`);
      if (skillField) {
        skillField.value = String(state.skills[skillName]);
      }
      renderSkillInputs();
      showMessage(references.xpResult, `${displayName(skillName)} evoluiu para ${state.skills[skillName]} sem consumir pontos de criação.`);
    });
    box.appendChild(evolveButton);
  }

  return box;
}

function renderSelectors() {
  if (!references.testAttribute || !references.testSkill || !references.xpSkill) {
    return;
  }

  references.testAttribute.innerHTML = "";
  Object.values(attributeGroups).flat().forEach((attribute) => {
    references.testAttribute.appendChild(createOption(attribute));
  });

  references.testSkill.innerHTML = "";
  references.testSkill.appendChild(createOption("", "Nenhuma (teste de atributo)"));
  Object.entries(skillGroups).forEach(([groupName, skills]) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = groupName;
    skills.forEach((skill) => {
      optgroup.appendChild(createOption(skill));
    });
    references.testSkill.appendChild(optgroup);
  });

  references.xpSkill.innerHTML = "";
  Object.entries(skillGroups).forEach(([groupName, skills]) => {
    const optgroup = document.createElement("optgroup");
    optgroup.label = groupName;
    skills.forEach((skill) => {
      optgroup.appendChild(createOption(skill));
    });
    references.xpSkill.appendChild(optgroup);
  });
}

function renderOriginSelectors() {
  if (!references.characterOriginInfo) {
    return;
  }

  const selectedOrigin = localStorage.getItem("selectedOrigin") || references.characterOriginInfo.value || "";
  references.characterOriginInfo.innerHTML = "";

  references.characterOriginInfo.appendChild(createOption("", "Selecione..."));
  Object.values(originCatalog).forEach((origin) => {
    references.characterOriginInfo.appendChild(createOption(origin.id, origin.displayName));
  });

  if (selectedOrigin && originCatalog[selectedOrigin]) {
    references.characterOriginInfo.value = selectedOrigin;
    localStorage.removeItem("selectedOrigin");
  }
}

function renderClassSelectors() {
  if (!references.characterClassInfo) {
    return;
  }

  const selectedClass = localStorage.getItem("selectedClass") || references.characterClassInfo.value || "";
  references.characterClassInfo.innerHTML = "";
  references.characterClassInfo.appendChild(createOption("", "Selecione..."));

  Object.values(classCatalog).forEach((entry) => {
    references.characterClassInfo.appendChild(createOption(entry.id, entry.displayName));
  });

  if (selectedClass && classCatalog[selectedClass]) {
    references.characterClassInfo.value = selectedClass;
    localStorage.removeItem("selectedClass");
  }
}

function renderRaceSelectors() {
  if (!references.characterRaceInfo) {
    return;
  }

  const storedRace = localStorage.getItem("selectedRace") || "";
  const currentRace = storedRace && raceCatalog[storedRace]
    ? storedRace
    : (references.characterRaceInfo.value && raceCatalog[references.characterRaceInfo.value] ? references.characterRaceInfo.value : "");

  references.characterRaceInfo.innerHTML = "";
  references.characterRaceInfo.appendChild(createOption("", "Selecione..."));

  Object.values(raceCatalog).forEach((race) => {
    references.characterRaceInfo.appendChild(createOption(race.id, race.displayName));
  });

  if (!references.characterRaceInfo.value) {
    references.characterRaceInfo.value = currentRace in raceCatalog ? currentRace : "";
  }

  if (storedRace) {
    localStorage.removeItem("selectedRace");
  }
}

function createOption(value, label = value) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label === value ? displayName(value) : label;
  return option;
}

function bindEvents() {
  if (references.rulesToggle && references.rulesContent && references.rulesPanel) {
    references.rulesToggle.addEventListener("click", toggleRulesPanel);
  }

  if (references.rollButton) {
    references.rollButton.addEventListener("click", onRoll);
  }
  if (references.xpButton) {
    references.xpButton.addEventListener("click", onApplyXp);
  }
  if (references.testSkill) {
    references.testSkill.addEventListener("change", autoAdjustAttributeForSkill);
  }
  if (references.rerollButton) {
    references.rerollButton.addEventListener("click", onReroll);
  }
  if (references.closeResultPopup) {
    references.closeResultPopup.addEventListener("click", closeResultPopup);
  }
  if (references.resultPopup) {
    references.resultPopup.addEventListener("click", (event) => {
      if (event.target === references.resultPopup) {
        closeResultPopup();
      }
    });
  }

  if (references.characterRace) {
    references.characterRace.addEventListener("change", handleRaceThemeChange);
  }
  if (references.realAge) {
    references.realAge.addEventListener("input", () => {
      state.lastAgeField = "real";
      updateAgeFields("real");
    });
  }
  if (references.humanAge) {
    references.humanAge.addEventListener("input", () => {
      state.lastAgeField = "human";
      updateAgeFields("human");
    });
  }
  if (references.characterClassInfo) {
    references.characterClassInfo.addEventListener("change", applyAppearanceTheme);
  }
  if (references.characterRaceInfo) {
    references.characterRaceInfo.addEventListener("change", handleRaceThemeChange);
  }
  if (references.characterOriginInfo) {
    references.characterOriginInfo.addEventListener("change", handleOriginThemeChange);
  }

  document.querySelectorAll(".damage").forEach((button) => {
    button.addEventListener("click", () => {
      const dieSize = Number(button.dataset.die);
      const result = rollExplodingDie(dieSize);
      const total = result.rolls.reduce((sum, value) => sum + value, 0);
      references.damageResult.innerHTML = `<strong>D${dieSize}</strong>: [${result.rolls.join(", ")}] = ${total}${result.rolls.length > 1 ? " <br>Explosão separada em novos dados." : ""}`;
    });
  });
}

function updateHumanAge() {
  const realHasValue = Boolean(references.realAge?.value?.trim());
  const humanHasValue = Boolean(references.humanAge?.value?.trim());

  if (humanHasValue && !realHasValue) {
    updateAgeFields("human");
    return;
  }

  if (realHasValue && !humanHasValue) {
    updateAgeFields("real");
    return;
  }

  updateAgeFields(state.lastAgeField || "real");
}

function updateAgeFields(sourceField = state.lastAgeField || "real") {
  if (!references.realAge || !references.humanAge || !references.characterRaceInfo) {
    return;
  }

  const race = references.characterRaceInfo.value || "";

  if (!race) {
    references.humanAge.value = "";
    if (references.ageHint) {
      references.ageHint.textContent = "Digite uma raça para converter idade real e idade humana entre si.";
    }
    return;
  }

  const raceData = getRaceDefinition(race);
  const factor = raceData.ageFactor || 1;
  const realAgeValue = Number.parseInt(references.realAge.value, 10);
  const humanAgeValue = Number.parseInt(references.humanAge.value, 10);

  if (sourceField === "human") {
    if (Number.isNaN(humanAgeValue) || humanAgeValue < 0) {
      references.realAge.value = "";
      if (references.ageHint) {
        references.ageHint.textContent = `Fator de ${raceData.displayName}: ${factor}. Idade humana = idade real ajustada pela raça.`;
      }
      return;
    }

    references.realAge.value = String(Math.max(0, Math.round(humanAgeValue * factor)));
  } else {
    if (Number.isNaN(realAgeValue) || realAgeValue < 0) {
      references.humanAge.value = "";
      if (references.ageHint) {
        references.ageHint.textContent = `Fator de ${raceData.displayName}: ${factor}. Idade humana = idade real ajustada pela raça.`;
      }
      return;
    }

    references.humanAge.value = String(Math.max(0, Math.round(realAgeValue / factor)));
  }

  if (references.ageHint) {
    references.ageHint.textContent = `Fator de ${raceData.displayName}: ${factor}. Edite a idade real ou humana para converter entre as duas.`;
  }
}

function handleRaceThemeChange() {
  updateAgeFields(state.lastAgeField);
  applyAppearanceTheme();
}

function syncBasicAndInfoRace() {
  if (!references.characterRaceInfo) {
    return;
  }
}

function applyAppearanceTheme() {
  const activeClass = references.characterClassInfo?.value || "";
  const activeRace = references.characterRaceInfo?.value || "";
  const activeOrigin = references.characterOriginInfo?.value || "";
  const raceData = getRaceDefinition(activeRace);
  const originData = getOriginDefinition(activeOrigin);
  const classData = getClassDefinition(activeClass);

  const theme = {
    ...RACE_THEMES.Humano,
    ...(raceData.theme || {}),
    ...(originData.theme || {}),
    ...(classData.theme || {}),
    ...(CLASS_THEMES[activeClass] || {})
  };

  Object.entries(theme).forEach(([name, value]) => {
    document.documentElement.style.setProperty(name, value);
  });

  document.body.dataset.classTheme = activeClass || "default";
  document.body.dataset.raceTheme = activeRace || "default";
  document.body.dataset.originTheme = activeOrigin || "default";
}

function handleOriginThemeChange() {
  applyAppearanceTheme();
}

function syncClassSelection() {
  if (!references.characterClassInfo) {
    return;
  }

  const storedClass = localStorage.getItem("selectedClass");
  if (storedClass && classCatalog[storedClass]) {
    references.characterClassInfo.value = storedClass;
  }
}

function syncOriginSelection() {
  if (!references.characterOriginInfo) {
    return;
  }

  const storedOrigin = localStorage.getItem("selectedOrigin");
  if (storedOrigin && originCatalog[storedOrigin]) {
    references.characterOriginInfo.value = storedOrigin;
  }
}

function getRaceDefinition(raceId) {
  return raceCatalog[raceId] || {
    id: raceId,
    displayName: displayName(raceId),
    ageFactor: RACE_AGE_FACTORS[displayName(raceId)] || 1,
    theme: RACE_THEMES.Humano
  };
}

function getOriginDefinition(originId) {
  return originCatalog[originId] || {
    id: originId,
    displayName: displayName(originId),
    theme: ORIGIN_THEMES[originId] || {}
  };
}

function getClassDefinition(classId) {
  return classCatalog[classId] || {
    id: classId,
    displayName: displayName(classId),
    theme: CLASS_THEMES[classId] || {}
  };
}

function toggleRulesPanel() {
  if (!references.rulesToggle || !references.rulesContent || !references.rulesPanel) {
    return;
  }

  const expanded = references.rulesToggle.getAttribute("aria-expanded") === "true";
  references.rulesToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
  references.rulesContent.hidden = expanded;
  references.rulesPanel.classList.toggle("is-collapsed", expanded);
}

function onInputChange(event) {
  const input = event.target;
  const name = input.dataset.name;
  const type = input.dataset.type;
  const oldValue = type === "attribute" ? state.attributes[name] : state.skills[name];
  const parsed = Number.parseInt(input.value, 10);
  const minValue = type === "attribute" ? ATTRIBUTE_MIN_VALUE : SKILL_MIN_VALUE;
  const maxValue = type === "attribute" ? ATTRIBUTE_MAX_VALUE : SKILL_MAX_VALUE;
  const value = Number.isNaN(parsed) ? oldValue : clamp(parsed, minValue, maxValue);

  if (type === "attribute") {
    state.attributes[name] = value;
    if (getSpentAttributes() > ATTRIBUTE_POOL) {
      state.attributes[name] = oldValue;
      input.value = String(oldValue);
      showMessage(references.rollResult, "Limite de pontos de atributos excedido.", true);
      return;
    }
  } else {
    state.skills[name] = value;
    state.skillCreationBase[name] = value;
    if (value !== oldValue) {
      state.skillProgress[name] = 0;
    }
    if (getSpentSkills() > SKILL_POOL) {
      state.skills[name] = oldValue;
      state.skillCreationBase[name] = oldValue;
      input.value = String(oldValue);
      showMessage(references.rollResult, "Limite de pontos de perícias excedido.", true);
      return;
    }

    renderSkillInputs();
  }

  input.value = String(value);
  updatePools();
}

function autoAdjustAttributeForSkill() {
  if (!references.testSkill) {
    return;
  }

  const selectedSkill = references.testSkill.value;
  if (!selectedSkill) {
    return;
  }

  const relatedAttribute = findAttributeForSkill(selectedSkill);
  if (relatedAttribute) {
    references.testAttribute.value = relatedAttribute;
  }
}

function onRoll() {
  if (!references.testAttribute || !references.testSkill) {
    return;
  }

  const selectedSkill = references.testSkill.value;
  const attributeName = selectedSkill ? findAttributeForSkill(selectedSkill) : references.testAttribute.value;
  rollTest(attributeName, selectedSkill);
}

function rollAttributeTest(attributeName) {
  if (references.testAttribute) {
    references.testAttribute.value = attributeName;
  }
  if (references.testSkill) {
    references.testSkill.value = "";
  }
  rollTest(attributeName, "");
}

function rollSkillTest(skillName) {
  const attributeName = findAttributeForSkill(skillName);
  if (references.testAttribute) {
    references.testAttribute.value = attributeName;
  }
  if (references.testSkill) {
    references.testSkill.value = skillName;
  }
  rollTest(attributeName, skillName);
}

function rollTest(attributeName, selectedSkill) {
  state.lastRollConfig = { mode: "attribute", attributeName, selectedSkill };
  const maxValue = 10;
  const diceToRoll = state.attributes[attributeName] || ATTRIBUTE_MIN_VALUE;
  const keepCount = selectedSkill ? (state.skills[selectedSkill] || SKILL_MIN_VALUE) : SKILL_MIN_VALUE;
  const rollData = rollMany(diceToRoll, 10);
  const rolls = rollData.allRolls;
  const maxBonusValues = rolls.filter((value) => value === maxValue);
  const nonMaxRolls = rolls.filter((value) => value !== maxValue);
  const keptValues = keepHighestValues(nonMaxRolls, keepCount);
  const maxBonusTotal = maxBonusValues.reduce((sum, value) => sum + value, 0);
  const total = keptValues.reduce((sum, value) => sum + value, 0) + maxBonusTotal;
  const criticalFailData = evaluateCriticalFail(rolls, keepCount, maxValue);
  const criticalFail = criticalFailData.isCriticalFail;
  const criticalSuccess = maxBonusValues.length >= 2;
  const criticalStatus = criticalFail
    ? '<span class="critical-fail">✖ Falha crítica.</span>'
    : (criticalSuccess ? '<span class="critical-success">◆ Sucesso crítico.</span>' : "");
  const skillEvolutionStatus = selectedSkill
    ? applySkillProgressOutcome(selectedSkill, { criticalFail, criticalSuccess })
    : "";
  const compactCount = rollData.explosionRolls.length;

  const summary = [
    `<strong>${selectedSkill ? "Teste de Perícia" : "Teste de Atributo"}</strong>`,
    `Atributo: ${displayName(attributeName)} (${diceToRoll}d10)`,
    selectedSkill ? `Perícia: ${displayName(selectedSkill)} (mantém ${keepCount})` : "Perícia: nenhuma (mantém 1)",
    `Rolagens: [${rolls.join(", ")}]`,
    `Conjuntos base rolados: ${diceToRoll}d10`,
    `Compactuação: ${compactCount > 0 ? `${compactCount} dado(s) extra gerado(s).` : "nenhuma."}`,
    `Bônus (10): ${maxBonusValues.length > 0 ? `[${maxBonusValues.join(", ")}] = ${maxBonusTotal}` : "nenhum"}`,
    `Mantidos: [${keptValues.join(", ")}]`,
    `Resultado total: <strong>${total}</strong>`
  ];

  if (skillEvolutionStatus) {
    summary.push(skillEvolutionStatus);
  }

  if (criticalStatus) {
    summary.push(criticalStatus);
  }

  references.rollResult.innerHTML = summary.join("<br>");
  openResultPopup();
}

function rollCharacteristicTest(characteristicName) {
  const diceToRoll = state.characteristics[characteristicName] || 0;
  if (diceToRoll <= 0) {
    showMessage(references.rollResult, `${displayName(characteristicName)} está em 0. Aumente os quadrados para rolar.`, true);
    openResultPopup();
    return;
  }

  state.lastRollConfig = { mode: "characteristic", characteristicName };

  const maxValue = 10;
  const keepCount = 1;
  const rollData = rollMany(diceToRoll, 10);
  const rolls = rollData.allRolls;
  const maxBonusValues = rolls.filter((value) => value === maxValue);
  const nonMaxRolls = rolls.filter((value) => value !== maxValue);
  const keptValues = keepHighestValues(nonMaxRolls, keepCount);
  const maxBonusTotal = maxBonusValues.reduce((sum, value) => sum + value, 0);
  const total = keptValues.reduce((sum, value) => sum + value, 0) + maxBonusTotal;
  const criticalFailData = evaluateCriticalFail(rolls, keepCount, maxValue);
  const criticalFail = criticalFailData.isCriticalFail;
  const criticalSuccess = maxBonusValues.length >= 2;
  const criticalStatus = criticalFail
    ? '<span class="critical-fail">✖ Falha crítica.</span>'
    : (criticalSuccess ? '<span class="critical-success">◆ Sucesso crítico.</span>' : "");
  const compactCount = rollData.explosionRolls.length;

  const summary = [
    "<strong>Teste de Característica</strong>",
    `Característica: ${displayName(characteristicName)} (${diceToRoll}d10)`,
    "Mantém: 1",
    `Rolagens: [${rolls.join(", ")}]`,
    `Conjuntos base rolados: ${diceToRoll}d10`,
    `Compactuação: ${compactCount > 0 ? `${compactCount} dado(s) extra gerado(s).` : "nenhuma."}`,
    `Bônus (10): ${maxBonusValues.length > 0 ? `[${maxBonusValues.join(", ")}] = ${maxBonusTotal}` : "nenhum"}`,
    `Mantidos: [${keptValues.join(", ")}]`,
    `Resultado total: <strong>${total}</strong>`
  ];

  if (criticalStatus) {
    summary.push(criticalStatus);
  }

  references.rollResult.innerHTML = summary.join("<br>");
  openResultPopup();
}

function onReroll() {
  if (!state.lastRollConfig) {
    showMessage(references.rollResult, "Nenhum teste anterior para re-rolar.", true);
    openResultPopup();
    return;
  }

  if (state.lastRollConfig.mode === "characteristic") {
    rollCharacteristicTest(state.lastRollConfig.characteristicName);
    return;
  }

  rollTest(state.lastRollConfig.attributeName, state.lastRollConfig.selectedSkill);
}

function onApplyXp() {
  if (!references.xpSkill || !references.xpAmount || !references.xpResult) {
    return;
  }

  const skill = references.xpSkill.value;
  let xp = Number.parseInt(references.xpAmount.value, 10);

  if (!skill || Number.isNaN(xp) || xp <= 0) {
    showMessage(references.xpResult, "Informe uma perícia e um valor de XP válido.", true);
    return;
  }

  let level = state.skills[skill];
  if (level >= SKILL_MAX_VALUE) {
    showMessage(references.xpResult, `${displayName(skill)} já está no máximo (${SKILL_MAX_VALUE}).`, true);
    return;
  }

  let raised = 0;
  while (xp > 0 && level < SKILL_MAX_VALUE) {
    const cost = getXpCost(level);
    if (xp < cost) {
      break;
    }
    xp -= cost;
    level += 1;
    raised += 1;
  }

  if (raised === 0) {
    showMessage(references.xpResult, `XP insuficiente. ${displayName(skill)} no nível ${level} precisa de ${getXpCost(level)} XP para subir.`, true);
    return;
  }

  state.skills[skill] = level;
  const field = document.getElementById(`skill-${skill}`);
  if (field) {
    field.value = String(level);
  }

  updatePools();
  const creationStatus = getSpentSkills() > SKILL_POOL
    ? "Acima do limite de criação (normal para evolução por XP)."
    : "Dentro do limite de criação.";
  showMessage(references.xpResult, `${displayName(skill)} subiu ${raised} nível(is). Nível atual: ${level}. XP restante: ${xp}. ${creationStatus}`);
}

function updatePools() {
  const spentAttributes = getSpentAttributes();
  const spentSkills = getSpentSkills();

  references.attributesPool.textContent = `Pontos gastos: ${spentAttributes}/${ATTRIBUTE_POOL} | Restantes: ${ATTRIBUTE_POOL - spentAttributes}`;
  references.skillsPool.textContent = `Pontos gastos: ${spentSkills}/${SKILL_POOL} | Restantes: ${SKILL_POOL - spentSkills}`;
}

function updateCharacteristicsCount() {
  const distributedLevels = Object.values(state.characteristics).reduce((sum, value) => sum + value, 0);
  const activeCharacteristics = Object.values(state.characteristics).filter((value) => value > 0).length;
  const remainingLevels = CHARACTERISTIC_POOL - distributedLevels;
  references.characteristicsCount.textContent = `Pontos distribuídos: ${distributedLevels}/${CHARACTERISTIC_POOL} | Restantes: ${remainingLevels} | Características ativas: ${activeCharacteristics}/${CHARACTERISTIC_NAMES.length}`;
}

function getSpentAttributes() {
  return Object.values(state.attributes).reduce((sum, value) => sum + (value - ATTRIBUTE_MIN_VALUE), 0);
}

function getSpentSkills() {
  return Object.values(state.skillCreationBase).reduce((sum, value) => sum + (value - SKILL_MIN_VALUE), 0);
}

function findAttributeForSkill(skill) {
  const fallbackAttribute = Object.values(attributeGroups).flat()[0] || "";
  const selectedAttribute = references.testAttribute ? references.testAttribute.value : fallbackAttribute;
  return Object.entries(skillGroups).find(([, skills]) => skills.includes(skill))?.[0] || selectedAttribute;
}

function getSkillRequiredProgress(skillName) {
  return 4 + (state.skills[skillName] || SKILL_MIN_VALUE);
}

function applySkillProgressOutcome(skillName, { criticalFail, criticalSuccess }) {
  const current = state.skillProgress[skillName] || 0;
  const required = getSkillRequiredProgress(skillName);
  let delta = 0;

  if (criticalFail) {
    delta = -1;
  } else if (criticalSuccess) {
    delta = 2;
  }

  if (delta === 0) {
    return "Evolução da perícia: sem alteração automática (preenchimento manual).";
  }

  const next = clamp(current + delta, 0, required);
  const appliedDelta = next - current;
  state.skillProgress[skillName] = next;
  renderSkillInputs();

  if (appliedDelta === 0) {
    return "Evolução da perícia: sem espaço para alteração automática.";
  }

  if (appliedDelta > 0) {
    return `Evolução da perícia: +${appliedDelta} quadrado(s).`;
  }

  return `Evolução da perícia: ${appliedDelta} quadrado(s).`;
}

function displayName(name) {
  return displayNames[name] || name;
}

function getXpCost(currentLevel) {
  return 4 + currentLevel;
}

function keepHighestValues(values, keepCount) {
  return [...values]
    .sort((a, b) => b - a)
    .slice(0, keepCount);
}

function evaluateCriticalFail(rolls, keptDiceCount = 1, maxValue = 10) {
  const ones = rolls.filter((value) => value === 1).length;
  const tens = rolls.filter((value) => value === maxValue).length;
  const baseRequiredOnes = Math.ceil((keptDiceCount + 1) / 2);
  const requiredOnesWithTens = tens > 0 ? tens + 1 : baseRequiredOnes;
  const requiredOnes = Math.max(baseRequiredOnes, requiredOnesWithTens);

  return {
    ones,
    tens,
    baseRequiredOnes,
    requiredOnes,
    isCriticalFail: ones >= requiredOnes
  };
}

function rollMany(count, dieSize) {
  const baseRolls = [];
  const allRolls = [];
  const explosionRolls = [];

  for (let index = 0; index < count; index += 1) {
    const result = rollExplodingDie(dieSize);
    baseRolls.push(result.rolls[0]);
    allRolls.push(...result.rolls);
    if (result.rolls.length > 1) {
      explosionRolls.push(...result.rolls.slice(1));
    }
  }

  return { baseRolls, allRolls, explosionRolls };
}

function rollExplodingDie(size) {
  const rolls = [];

  do {
    const value = rollDie(size);
    rolls.push(value);
  } while (rolls[rolls.length - 1] === size);

  return { rolls };
}

function rollDie(size) {
  return Math.floor(Math.random() * size) + 1;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function showMessage(target, message, isError = false) {
  target.innerHTML = isError ? `<strong>Erro:</strong> ${message}` : message;
}

function openResultPopup() {
  references.resultPopup.classList.add("is-open");
  references.resultPopup.setAttribute("aria-hidden", "false");
}

function closeResultPopup() {
  references.resultPopup.classList.remove("is-open");
  references.resultPopup.setAttribute("aria-hidden", "true");
}
