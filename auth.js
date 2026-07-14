(function () {
  const state = {
    initialized: false,
    authReady: false,
    currentUser: null,
    auth: null,
    db: null,
    subscribers: [],
    waiters: []
  };

  const REQUIRED_CONFIG_KEYS = ["apiKey", "authDomain", "projectId", "appId"];
  const MAX_CHARACTERS = 20;

  function isFilledValue(value) {
    return typeof value === "string" && value.trim() !== "" && !value.startsWith("YOUR_");
  }

  function isConfigValid(config) {
    if (!config || typeof config !== "object") {
      return false;
    }

    return REQUIRED_CONFIG_KEYS.every((key) => isFilledValue(config[key]));
  }

  function notifySubscribers() {
    state.subscribers.forEach((callback) => {
      try {
        callback(state.currentUser);
      } catch {
        // Ignore subscriber failures.
      }
    });
  }

  function resolveWaiters() {
    state.waiters.forEach((resolve) => resolve());
    state.waiters = [];
  }

  function getUserCollection() {
    if (!state.currentUser || !state.db) {
      throw new Error("Usuário não autenticado.");
    }

    return state.db.collection("users").doc(state.currentUser.uid).collection("characters");
  }

  async function listCharacters() {
    const collection = getUserCollection();
    const snapshot = await collection.orderBy("savedAt", "desc").get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      return {
        id: data.id || doc.id,
        name: data.name || "Personagem sem nome",
        className: data.className || "",
        raceName: data.raceName || "",
        originName: data.originName || "",
        savedAt: data.savedAt || "",
        data: data.data || {}
      };
    });
  }

  async function replaceAllCharacters(characters) {
    const collection = getUserCollection();
    const trimmed = Array.isArray(characters) ? characters.slice(0, MAX_CHARACTERS) : [];

    const existing = await collection.get();
    const batch = state.db.batch();

    existing.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    trimmed.forEach((character) => {
      const entryId = character.id || `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ref = collection.doc(entryId);
      batch.set(ref, {
        id: entryId,
        name: character.name || "Personagem sem nome",
        className: character.className || "",
        raceName: character.raceName || "",
        originName: character.originName || "",
        savedAt: character.savedAt || new Date().toISOString(),
        data: character.data || {}
      });
    });

    await batch.commit();
  }

  async function initializeAuth() {
    if (state.initialized) {
      return;
    }

    state.initialized = true;

    const config = window.DVH_FIREBASE_CONFIG;
    const hasSdk = Boolean(window.firebase?.initializeApp && window.firebase?.auth && window.firebase?.firestore);

    if (!hasSdk || !isConfigValid(config)) {
      state.authReady = true;
      resolveWaiters();
      return;
    }

    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(config);
      }

      state.auth = window.firebase.auth();
      state.db = window.firebase.firestore();

      state.auth.onAuthStateChanged((user) => {
        state.currentUser = user || null;
        state.authReady = true;
        resolveWaiters();
        notifySubscribers();
      });
    } catch {
      state.authReady = true;
      resolveWaiters();
    }
  }

  const api = {
    maxCharacters: MAX_CHARACTERS,

    isConfigured() {
      return Boolean(state.auth && state.db);
    },

    isLoggedIn() {
      return Boolean(state.currentUser);
    },

    getCurrentUser() {
      return state.currentUser;
    },

    waitForAuthReady() {
      return new Promise((resolve) => {
        if (state.authReady) {
          resolve();
          return;
        }

        state.waiters.push(resolve);
      });
    },

    onAuthStateChanged(callback) {
      if (typeof callback !== "function") {
        return function unsubscribe() {};
      }

      state.subscribers.push(callback);
      callback(state.currentUser);

      return function unsubscribe() {
        state.subscribers = state.subscribers.filter((entry) => entry !== callback);
      };
    },

    async signInWithGoogle() {
      if (!state.auth) {
        throw new Error("Firebase não configurado para login.");
      }

      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await state.auth.signInWithPopup(provider);
    },

    async signOut() {
      if (!state.auth) {
        return;
      }

      await state.auth.signOut();
    },

    listCharacters,
    replaceAllCharacters
  };

  window.DVHAuth = api;
  initializeAuth();
})();
