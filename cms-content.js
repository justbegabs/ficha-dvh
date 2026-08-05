(function () {
  const COLLECTION_ROOT = "cmsContent";
  let initialized = false;
  let initFailed = false;

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

  function normalizeEntry(id, data) {
    const safe = data && typeof data === "object" ? data : {};
    return {
      id,
      displayName: safe.displayName || id,
      summary: safe.summary || safe.description || "",
      description: safe.description || safe.summary || "",
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
      summary: safe.summary || safe.description || "",
      description: safe.description || safe.summary || "",
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
    getSubEntry
  };
})();
