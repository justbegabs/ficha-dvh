(function () {
  const root = document.querySelector("[data-info-id]");
  if (!root) {
    return;
  }

  const infoId = root.getAttribute("data-info-id");
  if (!infoId) {
    return;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (!element || typeof value !== "string" || !value.trim()) {
      return;
    }

    element.textContent = value.trim();
  }

  function setCoverImage(url) {
    const wrap = document.getElementById("infoCoverWrap");
    const image = document.getElementById("infoCoverImage");
    if (!wrap || !image) {
      return;
    }

    if (!url || typeof url !== "string") {
      wrap.classList.add("hidden");
      image.removeAttribute("src");
      return;
    }

    image.src = url;
    image.alt = "Capa da informação";
    wrap.classList.remove("hidden");
  }

  function renderSubInfos(items) {
    const list = document.getElementById("infoSubList");
    const status = document.getElementById("infoSubStatus");
    if (!list || !status) {
      return;
    }

    list.innerHTML = "";
    if (!items.length) {
      status.textContent = "Nenhuma sub-informação cadastrada.";
      return;
    }

    status.textContent = `${items.length} sub-informação(ões) cadastrada(s).`;

    items.forEach((item) => {
      const card = document.createElement("a");
      card.className = "sub-card";
      card.href = `info-sub.html?parent=${encodeURIComponent(infoId)}&id=${encodeURIComponent(item.id)}`;

      const cover = item.coverImageUrl
        ? `<div class="sub-card__cover"><img src="${item.coverImageUrl}" alt="Capa de ${item.displayName || item.id}" loading="lazy" /></div>`
        : "";

      card.innerHTML = `
        ${cover}
        <div class="sub-card__body">
          <strong>${item.displayName || item.id}</strong>
          <span>${item.summary || "Sem resumo."}</span>
        </div>
      `;

      list.appendChild(card);
    });
  }

  async function loadFixedInfoContent() {
    if (!window.DVHCmsContent?.getEntry) {
      return;
    }

    const entry = await window.DVHCmsContent.getEntry("informacoes", infoId);
    if (entry) {
      setText("infoPageTitle", entry.displayName);
      setText("infoPageSubtitle", entry.summary);
      setText("infoSectionTitleOne", entry.sectionTitleOne);
      setText("infoSectionTextOne", entry.description);
      setText("infoSectionTitleTwo", entry.sectionTitleTwo);
      setText("infoSectionTextTwo", entry.extraText);
      setCoverImage(entry.coverImageUrl);
    }

    if (window.DVHCmsContent?.getSubEntries) {
      const subInfos = await window.DVHCmsContent.getSubEntries(infoId);
      renderSubInfos(subInfos);
    }
  }

  void loadFixedInfoContent();
})();
