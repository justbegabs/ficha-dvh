(function () {
  const ADMIN_EMAILS = [
    "justbegabs@gmail.com"
  ];
  const ADMIN_UIDS = [
    // Opcional: adicione UIDs admins aqui para evitar depender apenas do claim de e-mail.
  ];

  const COLLECTION_ROOT = "cmsContent";
  const EDITABLE_SECTIONS = ["informacoes", "races", "origens", "classes"];
  const BASE_IDS_BY_SECTION = {
    informacoes: [
      "introducao-do-mundo",
      "introducao-de-npcs",
      "documentos-nao-oficiais",
      "mecanicas"
    ],
    races: [
      "alien",
      "anao",
      "anjo",
      "anjocaido",
      "banshee",
      "bruxa",
      "ciborgue",
      "demonio",
      "elfo",
      "esqueleto",
      "fae",
      "humano",
      "kanima",
      "kitsune",
      "lobisomem",
      "metamorfo",
      "neko",
      "ninfa",
      "nogitsune",
      "satiro",
      "semideus",
      "sereia",
      "subuco",
      "vampiro",
      "veliria"
    ],
    origens: [
      "amnesico",
      "artista",
      "conspiracionista",
      "criancaperdida",
      "eremita",
      "escolhido",
      "exilado",
      "experimento",
      "forasteiro",
      "ginasta",
      "guerreiro",
      "herdeiro",
      "inventor",
      "jornalista",
      "militar",
      "motorista",
      "nomade",
      "profeta",
      "programador",
      "psicologo",
      "religioso",
      "servente",
      "universitario",
      "vingativo"
    ],
    classes: [
      "mago",
      "atirador",
      "armadilheiro",
      "combatente",
      "investigador",
      "curandeiro",
      "suporte",
      "tecnologico",
      "clerigo",
      "demonologista",
      "domador",
      "espiao",
      "carteado",
      "arsenalhumano"
    ]
  };

  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");
  const authStatus = document.getElementById("authStatus");
  const adminPanel = document.getElementById("adminPanel");

  const entryKind = document.getElementById("entryKind");
  const entrySection = document.getElementById("entrySection");
  const mainFields = document.getElementById("mainFields");
  const subFields = document.getElementById("subFields");

  const entryId = document.getElementById("entryId");
  const entryDisplayName = document.getElementById("entryDisplayName");
  const entryCategory = document.getElementById("entryCategory");
  const entrySummary = document.getElementById("entrySummary");
  const entryDescription = document.getElementById("entryDescription");
  const entryCoverImageUrl = document.getElementById("entryCoverImageUrl");
  const entrySectionTitleOne = document.getElementById("entrySectionTitleOne");
  const entryExtraText = document.getElementById("entryExtraText");
  const entrySectionTitleTwo = document.getElementById("entrySectionTitleTwo");
  const entryAgeFactor = document.getElementById("entryAgeFactor");

  const subParentInfoId = document.getElementById("subParentInfoId");
  const subId = document.getElementById("subId");
  const subDisplayName = document.getElementById("subDisplayName");
  const subSummary = document.getElementById("subSummary");
  const subDescription = document.getElementById("subDescription");
  const subCoverImageUrl = document.getElementById("subCoverImageUrl");
  const subName = document.getElementById("subName");
  const subAge = document.getElementById("subAge");
  const subAppearance = document.getElementById("subAppearance");
  const subRole = document.getElementById("subRole");
  const subDetails = document.getElementById("subDetails");
  const subSections = document.getElementById("subSections");

  const saveButton = document.getElementById("saveButton");
  const deleteButton = document.getElementById("deleteButton");
  const clearButton = document.getElementById("clearButton");
  const formStatus = document.getElementById("formStatus");

  const listKind = document.getElementById("listKind");
  const filterSection = document.getElementById("filterSection");
  const listParentInfoId = document.getElementById("listParentInfoId");
  const itemsStatus = document.getElementById("itemsStatus");
  const itemsList = document.getElementById("itemsList");

  let db = null;
  let auth = null;
  let currentUser = null;
  let isAuthorizedAdmin = false;
  const richEditorByField = new Map();
  const RICH_TEXT_FIELD_IDS = [
    "entrySummary",
    "entryDescription",
    "entryExtraText",
    "subSummary",
    "subDescription",
    "subAppearance"
  ];
  let activeRichEditor = null;

  function isEditableSection(section) {
    return EDITABLE_SECTIONS.includes(String(section || ""));
  }

  function getBaseFolderForSection(section) {
    if (section === "informacoes") {
      return "infos";
    }
    return section;
  }

  async function loadBaseMainItems(section) {
    const ids = BASE_IDS_BY_SECTION[section] || [];
    const folder = getBaseFolderForSection(section);

    const items = await Promise.all(
      ids.map(async (id) => {
        try {
          const response = await fetch(`${folder}/${id}.json`, { cache: "no-store" });
          if (!response.ok) {
            return null;
          }

          const payload = await response.json();
          return {
            id,
            payload: payload && typeof payload === "object" ? payload : {},
            source: "base"
          };
        } catch {
          return null;
        }
      })
    );

    return items.filter(Boolean);
  }

  function setStatus(element, message, kind) {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.remove("ok", "error");
    if (kind === "ok") {
      element.classList.add("ok");
    }
    if (kind === "error") {
      element.classList.add("error");
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeRichHtml(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }

    const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
    if (looksLikeHtml) {
      return raw;
    }

    return escapeHtml(raw).replace(/\n/g, "<br>");
  }

  function sanitizeRichHtml(value) {
    if (window.DVHCmsContent?.sanitizeRichText) {
      return window.DVHCmsContent.sanitizeRichText(value);
    }
    return String(value || "").trim();
  }

  function syncRichEditorFromTextarea(textareaId) {
    const source = document.getElementById(textareaId);
    const editor = richEditorByField.get(textareaId);
    if (!source || !editor) {
      return;
    }

    editor.innerHTML = sanitizeRichHtml(normalizeRichHtml(source.value || ""));
  }

  function syncAllRichEditorsFromTextarea() {
    RICH_TEXT_FIELD_IDS.forEach((textareaId) => {
      syncRichEditorFromTextarea(textareaId);
    });
  }

  function syncTextareaFromRichEditor(textareaId) {
    const source = document.getElementById(textareaId);
    const editor = richEditorByField.get(textareaId);
    if (!source || !editor) {
      return;
    }

    source.value = sanitizeRichHtml(editor.innerHTML || "").trim();
  }

  function syncAllTextareasFromRichEditor() {
    RICH_TEXT_FIELD_IDS.forEach((textareaId) => {
      syncTextareaFromRichEditor(textareaId);
    });
  }

  function applyRichEditorCommand(command, value) {
    if (!activeRichEditor) {
      return;
    }

    activeRichEditor.focus();
    document.execCommand(command, false, value);
    const targetField = activeRichEditor.dataset.fieldId || "";
    syncTextareaFromRichEditor(targetField);
  }

  function buildRichToolbar(textareaId) {
    const toolbar = document.createElement("div");
    toolbar.className = "rich-editor__toolbar";

    const commandButtons = [
      { label: "B", command: "bold", title: "Negrito" },
      { label: "I", command: "italic", title: "Itálico" },
      { label: "U", command: "underline", title: "Sublinhado" },
      { label: "Lista", command: "insertUnorderedList", title: "Lista" },
      { label: "Esq", command: "justifyLeft", title: "Alinhar à esquerda" },
      { label: "Centro", command: "justifyCenter", title: "Centralizar" },
      { label: "Dir", command: "justifyRight", title: "Alinhar à direita" }
    ];

    commandButtons.forEach((buttonConfig) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = buttonConfig.label;
      button.title = buttonConfig.title;
      button.addEventListener("click", () => {
        applyRichEditorCommand(buttonConfig.command);
      });
      toolbar.appendChild(button);
    });

    const fontSelect = document.createElement("select");
    fontSelect.innerHTML = [
      '<option value="">Fonte</option>',
      '<option value="Raleway">Raleway</option>',
      '<option value="Teko">Teko</option>',
      '<option value="Georgia">Georgia</option>',
      '<option value="Times New Roman">Times</option>',
      '<option value="Courier New">Courier</option>'
    ].join("");
    fontSelect.addEventListener("change", () => {
      if (fontSelect.value) {
        applyRichEditorCommand("fontName", fontSelect.value);
      }
      fontSelect.value = "";
    });
    toolbar.appendChild(fontSelect);

    const sizeSelect = document.createElement("select");
    sizeSelect.innerHTML = [
      '<option value="">Tamanho</option>',
      '<option value="2">Pequeno</option>',
      '<option value="3">Normal</option>',
      '<option value="4">Médio</option>',
      '<option value="5">Grande</option>',
      '<option value="6">Título</option>'
    ].join("");
    sizeSelect.addEventListener("change", () => {
      if (sizeSelect.value) {
        applyRichEditorCommand("fontSize", sizeSelect.value);
      }
      sizeSelect.value = "";
    });
    toolbar.appendChild(sizeSelect);

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.title = "Cor do texto";
    colorInput.value = "#eef5ff";
    colorInput.addEventListener("input", () => {
      applyRichEditorCommand("foreColor", colorInput.value);
    });
    toolbar.appendChild(colorInput);

    const clearStyleButton = document.createElement("button");
    clearStyleButton.type = "button";
    clearStyleButton.textContent = "Limpar";
    clearStyleButton.title = "Limpar formatação";
    clearStyleButton.addEventListener("click", () => {
      applyRichEditorCommand("removeFormat");
    });
    toolbar.appendChild(clearStyleButton);

    const htmlButton = document.createElement("button");
    htmlButton.type = "button";
    htmlButton.textContent = "HTML";
    htmlButton.title = "Editar HTML manualmente";
    htmlButton.addEventListener("click", () => {
      const source = document.getElementById(textareaId);
      if (!source) {
        return;
      }

      const nextValue = window.prompt("Edite o HTML deste campo:", source.value || "");
      if (nextValue == null) {
        return;
      }

      source.value = sanitizeRichHtml(nextValue);
      syncRichEditorFromTextarea(textareaId);
    });
    toolbar.appendChild(htmlButton);

    return toolbar;
  }

  function setupRichTextEditors() {
    RICH_TEXT_FIELD_IDS.forEach((textareaId) => {
      const textarea = document.getElementById(textareaId);
      if (!textarea || richEditorByField.has(textareaId)) {
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "rich-editor";

      const toolbar = buildRichToolbar(textareaId);
      const editor = document.createElement("div");
      editor.className = "rich-editor__content";
      editor.contentEditable = "true";
      editor.dataset.fieldId = textareaId;
      editor.setAttribute("role", "textbox");
      editor.setAttribute("aria-multiline", "true");
      editor.dataset.placeholder = textarea.getAttribute("placeholder") || "Digite aqui";

      editor.addEventListener("focus", () => {
        activeRichEditor = editor;
      });

      editor.addEventListener("input", () => {
        syncTextareaFromRichEditor(textareaId);
      });

      editor.addEventListener("blur", () => {
        syncTextareaFromRichEditor(textareaId);
      });

      wrapper.append(toolbar, editor);
      textarea.insertAdjacentElement("afterend", wrapper);
      richEditorByField.set(textareaId, editor);
      syncRichEditorFromTextarea(textareaId);
    });
  }

  function slugify(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function parseDetailLines(value) {
    return String(value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .reduce((acc, line) => {
        const separatorIndex = line.indexOf(":");
        if (separatorIndex <= 0) {
          return acc;
        }

        const key = line.slice(0, separatorIndex).trim();
        const text = line.slice(separatorIndex + 1).trim();
        if (!key || !text) {
          return acc;
        }

        acc[key] = text;
        return acc;
      }, {});
  }

  function parseSections(value) {
    return String(value || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf("::");
        if (separatorIndex <= 0) {
          return null;
        }

        const title = line.slice(0, separatorIndex).trim();
        const text = line.slice(separatorIndex + 2).trim();
        if (!title || !text) {
          return null;
        }

        return { title, text };
      })
      .filter(Boolean);
  }

  function serializeDetails(details) {
    if (!details || typeof details !== "object") {
      return "";
    }

    return Object.entries(details)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");
  }

  function serializeSections(sections) {
    if (!Array.isArray(sections)) {
      return "";
    }

    return sections
      .map((section) => `${section?.title || ""}::${section?.text || ""}`)
      .filter((line) => !line.startsWith("::"))
      .join("\n");
  }

  function ensureFirebase() {
    if (!window.firebase || !window.DVH_FIREBASE_CONFIG) {
      setStatus(authStatus, "Firebase não está configurado nesta página.", "error");
      return false;
    }

    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(window.DVH_FIREBASE_CONFIG);
      }
      auth = window.firebase.auth();
      db = window.firebase.firestore();
      return true;
    } catch {
      setStatus(authStatus, "Falha ao inicializar Firebase.", "error");
      return false;
    }
  }

  function isAdminEmail(email) {
    return ADMIN_EMAILS.includes(String(email || "").toLowerCase());
  }

  function isAdminUid(uid) {
    return ADMIN_UIDS.includes(String(uid || ""));
  }

  function updateModeUi() {
    const isSub = (entryKind?.value || "main") === "sub";
    mainFields?.classList.toggle("hidden", isSub);
    subFields?.classList.toggle("hidden", !isSub);
    entrySection?.toggleAttribute("disabled", isSub);
    if (isSub && entrySection) {
      entrySection.value = "informacoes";
    }

    const listIsSub = (listKind?.value || "main") === "sub";
    listParentInfoId?.toggleAttribute("disabled", !listIsSub);
    filterSection?.toggleAttribute("disabled", listIsSub);
    if (listIsSub && filterSection) {
      filterSection.value = "informacoes";
    }
  }

  function updateAuthUi() {
    if (!currentUser) {
      setStatus(authStatus, "Faça login para continuar.", "");
      loginButton?.classList.remove("hidden");
      logoutButton?.classList.add("hidden");
      adminPanel?.classList.add("hidden");
      isAuthorizedAdmin = false;
      return;
    }

    const email = currentUser.email || "";
    const uid = currentUser.uid || "";
    isAuthorizedAdmin = isAdminEmail(email) || isAdminUid(uid);

    if (!isAuthorizedAdmin) {
      setStatus(authStatus, `Acesso negado para ${email || "sem-email"}. UID: ${uid || "desconhecido"}.`, "error");
      loginButton?.classList.add("hidden");
      logoutButton?.classList.remove("hidden");
      adminPanel?.classList.add("hidden");
      return;
    }

    setStatus(authStatus, `Conectado como admin: ${email || "sem-email"} (UID: ${uid || "desconhecido"})`, "ok");
    loginButton?.classList.add("hidden");
    logoutButton?.classList.remove("hidden");
    adminPanel?.classList.remove("hidden");
    updateModeUi();
    void refreshItems();
  }

  function readMainForm() {
    syncAllTextareasFromRichEditor();

    const section = entrySection?.value || "informacoes";
    const id = slugify(entryId?.value || "");
    const displayName = String(entryDisplayName?.value || "").trim();
    const category = String(entryCategory?.value || "").trim();
    const summary = String(entrySummary?.value || "").trim();
    const description = String(entryDescription?.value || "").trim();
    const coverImageUrl = String(entryCoverImageUrl?.value || "").trim();
    const sectionTitleOne = String(entrySectionTitleOne?.value || "").trim();
    const extraText = String(entryExtraText?.value || "").trim();
    const sectionTitleTwo = String(entrySectionTitleTwo?.value || "").trim();
    const ageFactorRaw = String(entryAgeFactor?.value || "").trim();
    const ageFactor = ageFactorRaw === "" ? null : Number(ageFactorRaw);

    return {
      section,
      id,
      payload: {
        displayName: displayName || id,
        category,
        summary,
        description,
        coverImageUrl,
        sectionTitleOne,
        extraText,
        sectionTitleTwo,
        ageFactor: Number.isFinite(ageFactor) ? ageFactor : null,
        active: true,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser?.email || ""
      }
    };
  }

  function readSubForm() {
    syncAllTextareasFromRichEditor();

    const parentId = slugify(subParentInfoId?.value || "");
    const id = slugify(subId?.value || "");
    const displayName = String(subDisplayName?.value || "").trim();
    const summary = String(subSummary?.value || "").trim();
    const description = String(subDescription?.value || "").trim();
    const coverImageUrl = String(subCoverImageUrl?.value || "").trim();
    const profileName = String(subName?.value || "").trim();
    const profileAge = String(subAge?.value || "").trim();
    const profileAppearance = String(subAppearance?.value || "").trim();
    const profileRole = String(subRole?.value || "").trim();
    const details = parseDetailLines(subDetails?.value || "");
    const sections = parseSections(subSections?.value || "");

    return {
      parentId,
      id,
      payload: {
        displayName: displayName || id,
        summary,
        description,
        coverImageUrl,
        profile: {
          name: profileName,
          age: profileAge,
          appearance: profileAppearance,
          role: profileRole
        },
        details,
        sections,
        active: true,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser?.email || ""
      }
    };
  }

  function fillMainForm(section, id, payload) {
    if (entryKind) entryKind.value = "main";
    if (entrySection) entrySection.value = section;
    if (entryId) entryId.value = id;
    if (entryDisplayName) entryDisplayName.value = payload.displayName || "";
    if (entryCategory) entryCategory.value = payload.category || "";
    if (entrySummary) entrySummary.value = payload.summary || "";
    if (entryDescription) entryDescription.value = payload.description || "";
    if (entryCoverImageUrl) entryCoverImageUrl.value = payload.coverImageUrl || "";
    if (entrySectionTitleOne) entrySectionTitleOne.value = payload.sectionTitleOne || "";
    if (entryExtraText) entryExtraText.value = payload.extraText || "";
    if (entrySectionTitleTwo) entrySectionTitleTwo.value = payload.sectionTitleTwo || "";
    if (entryAgeFactor) entryAgeFactor.value = payload.ageFactor ?? "";
    syncAllRichEditorsFromTextarea();
    updateModeUi();
  }

  function fillSubForm(parentId, id, payload) {
    if (entryKind) entryKind.value = "sub";
    if (entrySection) entrySection.value = "informacoes";
    if (subParentInfoId) subParentInfoId.value = parentId;
    if (subId) subId.value = id;
    if (subDisplayName) subDisplayName.value = payload.displayName || "";
    if (subSummary) subSummary.value = payload.summary || "";
    if (subDescription) subDescription.value = payload.description || "";
    if (subCoverImageUrl) subCoverImageUrl.value = payload.coverImageUrl || "";
    if (subName) subName.value = payload.profile?.name || "";
    if (subAge) subAge.value = payload.profile?.age || "";
    if (subAppearance) subAppearance.value = payload.profile?.appearance || "";
    if (subRole) subRole.value = payload.profile?.role || "";
    if (subDetails) subDetails.value = serializeDetails(payload.details || {});
    if (subSections) subSections.value = serializeSections(payload.sections || []);
    syncAllRichEditorsFromTextarea();
    updateModeUi();
  }

  function clearForm() {
    if (entryId) entryId.value = "";
    if (entryDisplayName) entryDisplayName.value = "";
    if (entryCategory) entryCategory.value = "";
    if (entrySummary) entrySummary.value = "";
    if (entryDescription) entryDescription.value = "";
    if (entryCoverImageUrl) entryCoverImageUrl.value = "";
    if (entrySectionTitleOne) entrySectionTitleOne.value = "";
    if (entryExtraText) entryExtraText.value = "";
    if (entrySectionTitleTwo) entrySectionTitleTwo.value = "";
    if (entryAgeFactor) entryAgeFactor.value = "";

    if (subId) subId.value = "";
    if (subDisplayName) subDisplayName.value = "";
    if (subSummary) subSummary.value = "";
    if (subDescription) subDescription.value = "";
    if (subCoverImageUrl) subCoverImageUrl.value = "";
    if (subName) subName.value = "";
    if (subAge) subAge.value = "";
    if (subAppearance) subAppearance.value = "";
    if (subRole) subRole.value = "";
    if (subDetails) subDetails.value = "";
    if (subSections) subSections.value = "";

    syncAllRichEditorsFromTextarea();

    setStatus(formStatus, "", "");
  }

  async function saveEntry() {
    if (!isAuthorizedAdmin || !db) {
      setStatus(formStatus, "Acesso admin necessário para salvar.", "error");
      return;
    }

    const mode = entryKind?.value || "main";

    if (mode === "sub") {
      const { parentId, id, payload } = readSubForm();
      if (!parentId) {
        setStatus(formStatus, "Informe o ID da info pai.", "error");
        return;
      }
      if (!id) {
        setStatus(formStatus, "Informe um ID válido para sub-info.", "error");
        return;
      }

      try {
        await db
          .collection(COLLECTION_ROOT)
          .doc("informacoes")
          .collection("items")
          .doc(parentId)
          .collection("subitems")
          .doc(id)
          .set(payload, { merge: true });

        setStatus(formStatus, "Sub-info salva com sucesso.", "ok");
        await refreshItems();
      } catch (error) {
        const details = error?.code || error?.message || "erro desconhecido";
        setStatus(formStatus, `Não foi possível salvar a sub-info (${details}).`, "error");
      }
      return;
    }

    const { section, id, payload } = readMainForm();
    if (!isEditableSection(section)) {
      setStatus(formStatus, "Esta seção não pode ser editada neste painel.", "error");
      return;
    }

    if (!id) {
      setStatus(formStatus, "Informe um ID válido (slug).", "error");
      return;
    }

    try {
      await db
        .collection(COLLECTION_ROOT)
        .doc(section)
        .collection("items")
        .doc(id)
        .set(payload, { merge: true });

      setStatus(formStatus, "Item salvo com sucesso.", "ok");
      await refreshItems();
    } catch (error) {
      const details = error?.code || error?.message || "erro desconhecido";
      setStatus(formStatus, `Não foi possível salvar o item (${details}).`, "error");
    }
  }

  async function removeEntry() {
    if (!isAuthorizedAdmin || !db) {
      setStatus(formStatus, "Acesso admin necessário para remover.", "error");
      return;
    }

    const mode = entryKind?.value || "main";

    if (mode === "sub") {
      const parentId = slugify(subParentInfoId?.value || "");
      const id = slugify(subId?.value || "");
      if (!parentId || !id) {
        setStatus(formStatus, "Informe info pai e ID da sub-info para remover.", "error");
        return;
      }

      try {
        await db
          .collection(COLLECTION_ROOT)
          .doc("informacoes")
          .collection("items")
          .doc(parentId)
          .collection("subitems")
          .doc(id)
          .set(
            {
              active: false,
              updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
              updatedBy: currentUser?.email || ""
            },
            { merge: true }
          );

        setStatus(formStatus, "Sub-info removida com sucesso.", "ok");
        await refreshItems();
      } catch (error) {
        const details = error?.code || error?.message || "erro desconhecido";
        setStatus(formStatus, `Não foi possível remover a sub-info (${details}).`, "error");
      }
      return;
    }

    const section = entrySection?.value || "informacoes";
    const id = slugify(entryId?.value || "");
    if (!id) {
      setStatus(formStatus, "Informe o ID para remover.", "error");
      return;
    }

    try {
      await db
        .collection(COLLECTION_ROOT)
        .doc(section)
        .collection("items")
        .doc(id)
        .set(
          {
            active: false,
            updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser?.email || ""
          },
          { merge: true }
        );

      setStatus(formStatus, "Item removido com sucesso.", "ok");
      await refreshItems();
    } catch (error) {
      const details = error?.code || error?.message || "erro desconhecido";
      setStatus(formStatus, `Não foi possível remover o item (${details}).`, "error");
    }
  }

  function renderMainItems(section, entries) {
    if (!itemsList) {
      return;
    }

    itemsList.innerHTML = "";
    if (!entries.length) {
      setStatus(itemsStatus, "Nenhum item principal cadastrado nesta seção.", "");
      return;
    }

    setStatus(itemsStatus, `${entries.length} item(ns) principal(is).`, "ok");

    entries.forEach((entry) => {
      const id = entry.id;
      const data = entry.payload || {};
      const source = entry.source || "cms";

      const item = document.createElement("article");
      item.className = "item";

      const title = document.createElement("strong");
      title.textContent = data.displayName || id;

      const meta = document.createElement("div");
      meta.className = "item-meta";
      meta.textContent = `ID: ${id} | Categoria: ${data.category || "-"} | Fonte: ${source === "base" ? "JSON" : "Admin"}`;

      const summary = document.createElement("div");
      summary.className = "item-meta";
      summary.textContent = data.summary || "Sem resumo";

      const cover = document.createElement("div");
      cover.className = "item-meta";
      cover.textContent = data.coverImageUrl ? `Capa: ${data.coverImageUrl}` : "Capa: não definida";

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "secondary";
      editButton.textContent = "Editar";
      editButton.addEventListener("click", () => {
        fillMainForm(section, id, data);
        setStatus(formStatus, "Item principal carregado.", "ok");
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "danger";
      removeButton.textContent = "Remover";
      removeButton.addEventListener("click", async () => {
        fillMainForm(section, id, data);
        await removeEntry();
      });

      actions.append(editButton);
      if (source === "cms") {
        actions.append(removeButton);
      }
      item.append(title, meta, summary, cover, actions);
      itemsList.appendChild(item);
    });
  }

  function renderSubItems(parentId, docs) {
    if (!itemsList) {
      return;
    }

    itemsList.innerHTML = "";
    const activeDocs = docs.filter((doc) => doc.data()?.active === true);
    if (!activeDocs.length) {
      setStatus(itemsStatus, "Nenhuma sub-info cadastrada para este pai.", "");
      return;
    }

    setStatus(itemsStatus, `${activeDocs.length} sub-info(s).`, "ok");

    activeDocs.forEach((doc) => {
      const data = doc.data() || {};

      const item = document.createElement("article");
      item.className = "item";

      const title = document.createElement("strong");
      title.textContent = data.displayName || doc.id;

      const meta = document.createElement("div");
      meta.className = "item-meta";
      meta.textContent = `Pai: ${parentId} | ID: ${doc.id}`;

      const summary = document.createElement("div");
      summary.className = "item-meta";
      summary.textContent = data.summary || "Sem resumo";

      const profile = document.createElement("div");
      profile.className = "item-meta";
      profile.textContent = `Perfil: ${data.profile?.name || "-"} | ${data.profile?.age || "-"} | ${data.profile?.role || "-"}`;

      const actions = document.createElement("div");
      actions.className = "item-actions";

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "secondary";
      editButton.textContent = "Editar";
      editButton.addEventListener("click", () => {
        fillSubForm(parentId, doc.id, data);
        setStatus(formStatus, "Sub-info carregada.", "ok");
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "danger";
      removeButton.textContent = "Remover";
      removeButton.addEventListener("click", async () => {
        fillSubForm(parentId, doc.id, data);
        await removeEntry();
      });

      actions.append(editButton, removeButton);
      item.append(title, meta, summary, profile, actions);
      itemsList.appendChild(item);
    });
  }

  async function refreshItems() {
    if (!db || !isAuthorizedAdmin) {
      return;
    }

    updateModeUi();
    const mode = listKind?.value || "main";

    if (mode === "sub") {
      const parentId = slugify(listParentInfoId?.value || "");
      setStatus(itemsStatus, "Carregando sub-infos...", "");

      try {
        const snapshot = await db
          .collection(COLLECTION_ROOT)
          .doc("informacoes")
          .collection("items")
          .doc(parentId)
          .collection("subitems")
          .get();

        renderSubItems(parentId, snapshot.docs);
      } catch (error) {
        const details = error?.code || error?.message || "erro desconhecido";
        setStatus(itemsStatus, `Falha ao carregar sub-infos (${details}).`, "error");
      }
      return;
    }

    const section = filterSection?.value || "informacoes";
    if (!isEditableSection(section)) {
      setStatus(itemsStatus, "Esta seção não pode ser editada neste painel.", "error");
      return;
    }

    setStatus(itemsStatus, "Carregando itens principais...", "");

    try {
      const [snapshot, baseItems] = await Promise.all([
        db
        .collection(COLLECTION_ROOT)
        .doc(section)
        .collection("items")
        .get(),
        loadBaseMainItems(section)
      ]);

      const mergedById = new Map();

      baseItems.forEach((entry) => {
        mergedById.set(entry.id, entry);
      });

      snapshot.docs.forEach((doc) => {
        const data = doc.data() || {};
        if (data.active === false) {
          return;
        }

        mergedById.set(doc.id, {
          id: doc.id,
          payload: data,
          source: "cms"
        });
      });

      renderMainItems(section, [...mergedById.values()]);
    } catch (error) {
      const details = error?.code || error?.message || "erro desconhecido";
      setStatus(itemsStatus, `Falha ao carregar itens (${details}).`, "error");
    }
  }

  async function loginWithGoogle() {
    if (!auth) {
      return;
    }

    const provider = new window.firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await auth.signInWithPopup(provider);
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
    } catch (error) {
      const details = error?.code || error?.message || "erro desconhecido";
      setStatus(authStatus, `Não foi possível concluir o login Google (${details}).`, "error");
    }
  }

  async function logout() {
    if (!auth) {
      return;
    }

    try {
      await auth.signOut();
      clearForm();
    } catch {
      setStatus(authStatus, "Não foi possível sair agora.", "error");
    }
  }

  function bindEvents() {
    loginButton?.addEventListener("click", () => {
      void loginWithGoogle();
    });

    logoutButton?.addEventListener("click", () => {
      void logout();
    });

    saveButton?.addEventListener("click", () => {
      void saveEntry();
    });

    deleteButton?.addEventListener("click", () => {
      void removeEntry();
    });

    clearButton?.addEventListener("click", clearForm);

    entryKind?.addEventListener("change", () => {
      updateModeUi();
    });

    listKind?.addEventListener("change", () => {
      updateModeUi();
      void refreshItems();
    });

    filterSection?.addEventListener("change", () => {
      void refreshItems();
    });

    listParentInfoId?.addEventListener("change", () => {
      void refreshItems();
    });

    entrySection?.addEventListener("change", () => {
      if (filterSection && (listKind?.value || "main") === "main") {
        filterSection.value = entrySection.value;
      }
      void refreshItems();
    });

    entryDisplayName?.addEventListener("input", () => {
      if (!entryId?.value.trim()) {
        entryId.value = slugify(entryDisplayName.value);
      }
    });

    subDisplayName?.addEventListener("input", () => {
      if (!subId?.value.trim()) {
        subId.value = slugify(subDisplayName.value);
      }
    });
  }

  function bootstrap() {
    setupRichTextEditors();

    if (!ensureFirebase()) {
      return;
    }

    bindEvents();

    auth.onAuthStateChanged((user) => {
      currentUser = user || null;
      updateAuthUi();
    });
  }

  bootstrap();
})();
