(function () {
  const params = new URLSearchParams(window.location.search);
  const parentId = params.get("parent") || "";
  const subId = params.get("id") || "";

  const subTitle = document.getElementById("subTitle");
  const subSummary = document.getElementById("subSummary");
  const subDescription = document.getElementById("subDescription");
  const subCover = document.getElementById("subCover");
  const subCoverImage = document.getElementById("subCoverImage");
  const profileName = document.getElementById("profileName");
  const profileAge = document.getElementById("profileAge");
  const profileAppearance = document.getElementById("profileAppearance");
  const profileRole = document.getElementById("profileRole");
  const detailsList = document.getElementById("detailsList");
  const extraSections = document.getElementById("extraSections");
  const backToParent = document.getElementById("backToParent");

  const parentHrefById = {
    "introducao-do-mundo": "info-introducao-do-mundo.html",
    "introducao-de-npcs": "info-indroducao-de-npcs.html",
    "documentos-nao-oficiais": "info-documentos-nao-oficiais.html",
    "mecanicas": "info-mecanicas.html"
  };

  function toRichHtml(value) {
    if (window.DVHCmsContent?.toRichHtml) {
      return window.DVHCmsContent.toRichHtml(value);
    }

    return String(value || "").replace(/\n/g, "<br>");
  }

  function stripRichText(value) {
    if (window.DVHCmsContent?.stripRichText) {
      return window.DVHCmsContent.stripRichText(value);
    }

    return String(value || "").trim();
  }

  function setFallback(message) {
    if (subSummary) {
      subSummary.textContent = message;
    }
  }

  function setText(element, value) {
    if (!element) {
      return;
    }

    element.textContent = value && String(value).trim() ? String(value).trim() : "-";
  }

  function setRichText(element, value, fallback) {
    if (!element) {
      return;
    }

    const content = String(value || "").trim();
    if (!content) {
      element.textContent = fallback || "-";
      return;
    }

    element.innerHTML = toRichHtml(content);
  }

  function renderDetails(details) {
    if (!detailsList) {
      return;
    }

    detailsList.innerHTML = "";
    const entries = Object.entries(details || {});

    if (!entries.length) {
      const empty = document.createElement("div");
      empty.className = "detail-line";
      empty.textContent = "Sem detalhes adicionais.";
      detailsList.appendChild(empty);
      return;
    }

    entries.forEach(([key, value]) => {
      const line = document.createElement("div");
      line.className = "detail-line";
      line.innerHTML = `<strong>${stripRichText(key)}</strong><br>${toRichHtml(value)}`;
      detailsList.appendChild(line);
    });
  }

  function renderSections(sections) {
    if (!extraSections) {
      return;
    }

    extraSections.innerHTML = "";
    const items = Array.isArray(sections) ? sections : [];

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "detail-line";
      empty.textContent = "Sem seções adicionais.";
      extraSections.appendChild(empty);
      return;
    }

    items.forEach((section) => {
      const field = document.createElement("div");
      field.className = "field";
      const safeTitle = stripRichText(section?.title || "Seção");
      const safeText = toRichHtml(section?.text || "");
      field.innerHTML = `<strong>${safeTitle}</strong><span>${safeText}</span>`;
      extraSections.appendChild(field);
    });
  }

  async function loadSubInfo() {
    if (!parentId || !subId) {
      setFallback("Sub-informação não especificada.");
      return;
    }

    if (backToParent) {
      backToParent.href = parentHrefById[parentId] || "info.html";
    }

    if (!window.DVHCmsContent?.getSubEntry) {
      setFallback("CMS indisponível nesta página.");
      return;
    }

    const entry = await window.DVHCmsContent.getSubEntry(parentId, subId);
    if (!entry) {
      setFallback("Sub-informação não encontrada.");
      return;
    }

    if (subTitle) {
      subTitle.textContent = entry.displayName || subId;
    }
    setRichText(subSummary, entry.summary, "Sem resumo.");
    setRichText(subDescription, entry.description, "Sem descrição.");

    if (subCover && subCoverImage && entry.coverImageUrl) {
      subCoverImage.src = entry.coverImageUrl;
      subCover.classList.remove("hidden");
    }

    setText(profileName, entry.profile?.name);
    setText(profileAge, entry.profile?.age);
    setRichText(profileAppearance, entry.profile?.appearance, "-");
    setText(profileRole, entry.profile?.role);

    renderDetails(entry.details);
    renderSections(entry.sections);
  }

  void loadSubInfo();
})();
