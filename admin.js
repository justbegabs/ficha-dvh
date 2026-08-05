(function () {
  const ADMIN_EMAILS = [
    "justbegabs@gmail.com"
  ];
  const ADMIN_UIDS = [
    // Opcional: adicione UIDs admins aqui para evitar depender apenas do claim de e-mail.
  ];

  const COLLECTION_ROOT = "cmsContent";

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

  function renderMainItems(section, docs) {
    if (!itemsList) {
      return;
    }

    itemsList.innerHTML = "";
    const activeDocs = docs.filter((doc) => doc.data()?.active === true);
    if (!activeDocs.length) {
      setStatus(itemsStatus, "Nenhum item principal cadastrado nesta seção.", "");
      return;
    }

    setStatus(itemsStatus, `${activeDocs.length} item(ns) principal(is).`, "ok");

    activeDocs.forEach((doc) => {
      const data = doc.data() || {};

      const item = document.createElement("article");
      item.className = "item";

      const title = document.createElement("strong");
      title.textContent = data.displayName || doc.id;

      const meta = document.createElement("div");
      meta.className = "item-meta";
      meta.textContent = `ID: ${doc.id} | Categoria: ${data.category || "-"}`;

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
        fillMainForm(section, doc.id, data);
        setStatus(formStatus, "Item principal carregado.", "ok");
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "danger";
      removeButton.textContent = "Remover";
      removeButton.addEventListener("click", async () => {
        fillMainForm(section, doc.id, data);
        await removeEntry();
      });

      actions.append(editButton, removeButton);
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
    setStatus(itemsStatus, "Carregando itens principais...", "");

    try {
      const snapshot = await db
        .collection(COLLECTION_ROOT)
        .doc(section)
        .collection("items")
        .get();

      renderMainItems(section, snapshot.docs);
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
