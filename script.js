const ATTRIBUTE_POOL = 15;
const SKILL_POOL = 20;
const CHARACTERISTIC_POOL = 15;
const ATTRIBUTE_MIN_VALUE = 1;
const ATTRIBUTE_MAX_VALUE = 3;
const SKILL_MIN_VALUE = 1;
const SKILL_MAX_VALUE = 3;
const CHARACTERISTIC_SLOTS = 5;
const CHARACTERISTIC_NAMES = ["Crenca", "Fortuna", "Legado", "Improviso", "Perseveranca"];

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
  characteristics: {},
  lastRollConfig: null
};

const references = {
  attributesPool: document.getElementById("attributesPool"),
  characteristicsCount: document.getElementById("characteristicsCount"),
  skillsPool: document.getElementById("skillsPool"),
  attributesList: document.getElementById("attributesList"),
  characteristicsList: document.getElementById("characteristicsList"),
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

initialize();

function initialize() {
  initializeValues();
  renderAttributeInputs();
  renderCharacteristicsInputs();
  renderSkillInputs();
  renderSelectors();
  updatePools();
  updateCharacteristicsCount();
  bindEvents();
}

function initializeValues() {
  Object.values(attributeGroups).flat().forEach((name) => {
    state.attributes[name] = ATTRIBUTE_MIN_VALUE;
  });

  Object.values(skillGroups).flat().forEach((name) => {
    state.skills[name] = SKILL_MIN_VALUE;
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
    value.textContent = `${state.characteristics[name] || 0}/${CHARACTERISTIC_SLOTS}`;

    row.append(label, track, value);
    references.characteristicsList.appendChild(row);
  });
}

function renderAttributeInputs() {
  references.attributesList.innerHTML = "";

  Object.entries(attributeGroups).forEach(([groupName, names]) => {
    const title = document.createElement("h3");
    title.className = "group-title";
    title.textContent = displayName(groupName);
    references.attributesList.appendChild(title);

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

function renderSelectors() {
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

function createOption(value, label = value) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label === value ? displayName(value) : label;
  return option;
}

function bindEvents() {
  references.rollButton.addEventListener("click", onRoll);
  references.xpButton.addEventListener("click", onApplyXp);
  references.testSkill.addEventListener("change", autoAdjustAttributeForSkill);
  references.rerollButton.addEventListener("click", onReroll);
  references.closeResultPopup.addEventListener("click", closeResultPopup);
  references.resultPopup.addEventListener("click", (event) => {
    if (event.target === references.resultPopup) {
      closeResultPopup();
    }
  });

  document.querySelectorAll(".damage").forEach((button) => {
    button.addEventListener("click", () => {
      const dieSize = Number(button.dataset.die);
      const result = rollExplodingDie(dieSize);
      const total = result.rolls.reduce((sum, value) => sum + value, 0);
      references.damageResult.innerHTML = `<strong>D${dieSize}</strong>: [${result.rolls.join(", ")}] = ${total}${result.rolls.length > 1 ? " <br>Explosão separada em novos dados." : ""}`;
    });
  });
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
    if (getSpentSkills() > SKILL_POOL) {
      state.skills[name] = oldValue;
      input.value = String(oldValue);
      showMessage(references.rollResult, "Limite de pontos de perícias excedido.", true);
      return;
    }
  }

  input.value = String(value);
  updatePools();
}

function autoAdjustAttributeForSkill() {
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
  const selectedSkill = references.testSkill.value;
  const attributeName = selectedSkill ? findAttributeForSkill(selectedSkill) : references.testAttribute.value;
  rollTest(attributeName, selectedSkill);
}

function rollAttributeTest(attributeName) {
  references.testAttribute.value = attributeName;
  references.testSkill.value = "";
  rollTest(attributeName, "");
}

function rollSkillTest(skillName) {
  const attributeName = findAttributeForSkill(skillName);
  references.testAttribute.value = attributeName;
  references.testSkill.value = skillName;
  rollTest(attributeName, skillName);
}

function rollTest(attributeName, selectedSkill) {
  state.lastRollConfig = { mode: "attribute", attributeName, selectedSkill };
  const maxValue = 10;
  const diceToRoll = state.attributes[attributeName] || ATTRIBUTE_MIN_VALUE;
  const keepCount = selectedSkill ? state.skills[selectedSkill] : SKILL_MIN_VALUE;
  const rollData = rollMany(diceToRoll, 10);
  const rolls = rollData.allRolls;
  const maxBonusValues = rolls.filter((value) => value === maxValue);
  const nonMaxRolls = rolls.filter((value) => value !== maxValue);
  const keptValues = keepHighestValues(nonMaxRolls, keepCount);
  const maxBonusTotal = maxBonusValues.reduce((sum, value) => sum + value, 0);
  const total = keptValues.reduce((sum, value) => sum + value, 0) + maxBonusTotal;
  const criticalFailData = evaluateCriticalFail(rolls, keepCount, maxValue);
  const criticalFail = criticalFailData.isCriticalFail;
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
    `Resultado total: <strong>${total}</strong>`,
    criticalFail ? '<span class="critical-fail">Falha crítica ativada.</span>' : "Sem falha crítica."
  ];

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
    `Resultado total: <strong>${total}</strong>`,
    criticalFail ? '<span class="critical-fail">Falha crítica ativada.</span>' : "Sem falha crítica."
  ];

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
  return Object.values(state.skills).reduce((sum, value) => sum + (value - SKILL_MIN_VALUE), 0);
}

function findAttributeForSkill(skill) {
  return Object.entries(skillGroups).find(([, skills]) => skills.includes(skill))?.[0] || references.testAttribute.value;
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
