(function () {
  const COLLECTION_ROOT = "cmsContent";
  let initialized = false;
  let initFailed = false;

  const ALLOWED_RICH_TAGS = new Set([
    "p",
    "div",
    "span",
    "strong",
    "em",
    "u",
    "s",
    "br",
    "ul",
    "ol",
    "li",
    "blockquote",
    "h3",
    "h4",
    "a"
  ]);

  const ALLOWED_STYLE_PROPS = new Set([
    "color",
    "background-color",
    "font-family",
    "font-size",
    "font-style",
    "font-weight",
    "text-decoration",
    "text-align",
    "line-height"
  ]);

  function hasSdk() {
    return Boolean(window.firebase?.initializeApp && window.firebase?.firestore);
  }

  function hasConfig() {
    const config = window.DVH_FIREBASE_CONFIG;
    return Boolean(config && typeof config === "object" && config.projectId && config.apiKey);
  }

  function ensureInitialized() {
    if (initialized || initFailed) {
      return initialized;
    }

    if (!hasSdk() || !hasConfig()) {
      initFailed = true;
      return false;
    }

    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(window.DVH_FIREBASE_CONFIG);
      }
      initialized = true;
      return true;
    } catch {
      initFailed = true;
      return false;
    }
  }

  function getDb() {
    if (!ensureInitialized()) {
      return null;
    }

    try {
      return window.firebase.firestore();
    } catch {
      return null;
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

  function isSafeStyleValue(property, value) {
    const safeValue = String(value || "").trim();
    if (!safeValue) {
      return false;
    }

    if (property === "color" || property === "background-color") {
      return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(safeValue)
        || /^(rgb|rgba|hsl|hsla)\(([^)]+)\)$/i.test(safeValue)
        || /^[a-z]+$/i.test(safeValue);
    }

    if (property === "font-family") {
      return /^[a-z0-9\-\s,'\"]+$/i.test(safeValue);
    }

    if (property === "font-size") {
      return /^\d+(\.\d+)?(px|em|rem|%)$/i.test(safeValue);
    }

    if (property === "font-style") {
      return /^(normal|italic|oblique)$/i.test(safeValue);
    }

    if (property === "font-weight") {
      return /^(normal|bold|bolder|lighter|[1-9]00)$/i.test(safeValue);
    }

    if (property === "text-decoration") {
      return /^(none|underline|line-through|overline)$/i.test(safeValue);
    }

    if (property === "text-align") {
      return /^(left|right|center|justify)$/i.test(safeValue);
    }

    if (property === "line-height") {
      return /^(normal|\d+(\.\d+)?(px|em|rem|%)?)$/i.test(safeValue);
    }

    return false;
  }

  function sanitizeInlineStyles(styleValue) {
    return String(styleValue || "")
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf(":");
        if (separator <= 0) {
          return null;
        }

        const property = entry.slice(0, separator).trim().toLowerCase();
        const value = entry.slice(separator + 1).trim();
        if (!ALLOWED_STYLE_PROPS.has(property) || !isSafeStyleValue(property, value)) {
          return null;
        }

        return `${property}: ${value}`;
      })
      .filter(Boolean)
      .join("; ");
  }

  function sanitizeRichText(value) {
    const source = String(value || "");
    if (!source.trim()) {
      return "";
    }

    const template = document.createElement("template");
    template.innerHTML = source;

    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);
    const elements = [];

    while (walker.nextNode()) {
      elements.push(walker.currentNode);
    }

    elements.forEach((node) => {
      let tag = node.tagName?.toLowerCase() || "";

      // Converte marcação legada (<font>) para span com estilo permitido.
      if (tag === "font") {
        const styleEntries = [];
        const colorAttr = node.getAttribute("color");
        const faceAttr = node.getAttribute("face");
        const sizeAttr = node.getAttribute("size");

        if (colorAttr) {
          styleEntries.push(`color: ${colorAttr}`);
        }
        if (faceAttr) {
          styleEntries.push(`font-family: ${faceAttr}`);
        }
        if (sizeAttr) {
          const sizeMap = {
            "1": "0.75rem",
            "2": "0.875rem",
            "3": "1rem",
            "4": "1.125rem",
            "5": "1.25rem",
            "6": "1.5rem",
            "7": "1.875rem"
          };
          const mappedSize = sizeMap[String(sizeAttr).trim()];
          if (mappedSize) {
            styleEntries.push(`font-size: ${mappedSize}`);
          }
        }

        const span = document.createElement("span");
        const existingStyle = node.getAttribute("style") || "";
        span.setAttribute("style", [existingStyle, ...styleEntries].filter(Boolean).join("; "));

        while (node.firstChild) {
          span.appendChild(node.firstChild);
        }

        const parent = node.parentNode;
        if (parent) {
          parent.replaceChild(span, node);
          node = span;
          tag = "span";
        }
      }

      if (!ALLOWED_RICH_TAGS.has(tag)) {
        const parent = node.parentNode;
        if (!parent) {
          return;
        }

        while (node.firstChild) {
          parent.insertBefore(node.firstChild, node);
        }
        parent.removeChild(node);
        return;
      }

      const attrs = [...node.attributes];
      attrs.forEach((attr) => {
        const attrName = attr.name.toLowerCase();
        if (attrName === "style") {
          const safeStyle = sanitizeInlineStyles(attr.value);
          if (safeStyle) {
            node.setAttribute("style", safeStyle);
          } else {
            node.removeAttribute("style");
          }
          return;
        }

        if (tag === "a" && (attrName === "href" || attrName === "target" || attrName === "rel")) {
          if (attrName === "href") {
            const hrefValue = String(attr.value || "").trim();
            const safeHref = /^(https?:|mailto:|tel:|\/|#)/i.test(hrefValue);
            if (!safeHref) {
              node.removeAttribute("href");
            }
          }
          return;
        }

        node.removeAttribute(attr.name);
      });
    });

    return template.innerHTML.trim();
  }

  function toRichHtml(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }

    const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(raw);
    const normalized = hasHtmlTag ? raw : escapeHtml(raw).replace(/\n/g, "<br>");
    return sanitizeRichText(normalized);
  }

  function stripRichText(value) {
    const safeHtml = toRichHtml(value);
    if (!safeHtml) {
      return "";
    }

    const template = document.createElement("template");
    template.innerHTML = safeHtml;
    return String(template.content.textContent || "").trim();
  }

  function normalizeEntry(id, data) {
    const safe = data && typeof data === "object" ? data : {};
    return {
      id,
      displayName: safe.displayName || id,
      summary: safe.summary || "",
      description: safe.description || "",
      extraText: safe.extraText || "",
      sectionTitleOne: safe.sectionTitleOne || "",
      sectionTitleTwo: safe.sectionTitleTwo || "",
      coverImageUrl: safe.coverImageUrl || "",
      category: safe.category || "",
      ageFactor: typeof safe.ageFactor === "number" ? safe.ageFactor : null,
      theme: safe.theme && typeof safe.theme === "object" ? safe.theme : {},
      section: safe.section || "",
      source: "cms"
    };
  }

  function normalizeSubEntry(id, data) {
    const safe = data && typeof data === "object" ? data : {};
    const profile = safe.profile && typeof safe.profile === "object" ? safe.profile : {};
    return {
      id,
      displayName: safe.displayName || id,
      summary: safe.summary || "",
      description: safe.description || "",
      coverImageUrl: safe.coverImageUrl || "",
      profile: {
        name: profile.name || "",
        age: profile.age || "",
        appearance: profile.appearance || "",
        role: profile.role || ""
      },
      details: safe.details && typeof safe.details === "object" ? safe.details : {},
      sections: Array.isArray(safe.sections) ? safe.sections : [],
      source: "cms"
    };
  }

  async function getEntries(section) {
    const db = getDb();
    if (!db || !section) {
      return [];
    }

    try {
      const snapshot = await db
        .collection(COLLECTION_ROOT)
        .doc(section)
        .collection("items")
        .where("active", "==", true)
        .get();

      return snapshot.docs.map((doc) => normalizeEntry(doc.id, doc.data()));
    } catch {
      return [];
    }
  }

  async function getEntry(section, entryId) {
    const db = getDb();
    if (!db || !section || !entryId) {
      return null;
    }

    try {
      const doc = await db
        .collection(COLLECTION_ROOT)
        .doc(section)
        .collection("items")
        .doc(entryId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() || {};
      if (data.active !== true) {
        return null;
      }

      return normalizeEntry(doc.id, data);
    } catch {
      return null;
    }
  }

  async function getSubEntries(parentInfoId) {
    const db = getDb();
    if (!db || !parentInfoId) {
      return [];
    }

    try {
      const snapshot = await db
        .collection(COLLECTION_ROOT)
        .doc("informacoes")
        .collection("items")
        .doc(parentInfoId)
        .collection("subitems")
        .where("active", "==", true)
        .get();

      return snapshot.docs.map((doc) => normalizeSubEntry(doc.id, doc.data()));
    } catch {
      return [];
    }
  }

  async function getSubEntry(parentInfoId, subId) {
    const db = getDb();
    if (!db || !parentInfoId || !subId) {
      return null;
    }

    try {
      const doc = await db
        .collection(COLLECTION_ROOT)
        .doc("informacoes")
        .collection("items")
        .doc(parentInfoId)
        .collection("subitems")
        .doc(subId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() || {};
      if (data.active !== true) {
        return null;
      }

      return normalizeSubEntry(doc.id, data);
    } catch {
      return null;
    }
  }

  window.DVHCmsContent = {
    getEntries,
    getEntry,
    getSubEntries,
    getSubEntry,
    sanitizeRichText,
    toRichHtml,
    stripRichText
  };
})();
