(function () {
  const state = {
    initialized: false,
    authReady: false,
    signingIn: false,
    recoveringSession: false,
    pendingSignOutTimer: null,
    explicitSignOutRequested: false,
    transientNullCount: 0,
    fallbackUser: null,
    currentUser: null,
    auth: null,
    db: null,
    persistenceMode: "unknown",
    lastCompatibilityIssue: "",
    lastGoogleCredential: null,
    lastSuccessfulAuthAt: 0,
    subscribers: [],
    waiters: []
  };

  const REDIRECT_FALLBACK_CODES = new Set([
    "auth/popup-blocked",
    "auth/cancelled-popup-request",
    "auth/operation-not-supported-in-this-environment",
    "auth/web-storage-unsupported"
  ]);

  const REQUIRED_CONFIG_KEYS = ["apiKey", "authDomain", "projectId", "appId"];
  const MAX_CHARACTERS = 20;
  const GOOGLE_ACCESS_TOKEN_STORAGE_KEY = "dvhGoogleAccessToken";
  const LAST_AUTH_AT_STORAGE_KEY = "dvhLastAuthAt";
  const FALLBACK_USER_STORAGE_KEY = "dvhFallbackUser";

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

  function updateCurrentUser(user) {
    state.currentUser = user || null;
    if (user) {
      state.fallbackUser = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || ""
      };
      state.transientNullCount = 0;
      try {
        window.localStorage.setItem(FALLBACK_USER_STORAGE_KEY, JSON.stringify(state.fallbackUser));
      } catch {
        // Ignore blocked browser storage.
      }
    }
    notifySubscribers();
  }

  function readFallbackUserFromStorage() {
    try {
      const raw = window.localStorage.getItem(FALLBACK_USER_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || !parsed.uid) {
        return null;
      }

      return {
        uid: String(parsed.uid),
        email: String(parsed.email || ""),
        displayName: String(parsed.displayName || ""),
        photoURL: String(parsed.photoURL || "")
      };
    } catch {
      return null;
    }
  }

  function writeLastSuccessfulAuthAt(timestamp) {
    state.lastSuccessfulAuthAt = timestamp;
    try {
      window.localStorage.setItem(LAST_AUTH_AT_STORAGE_KEY, String(timestamp));
    } catch {
      // Ignore blocked browser storage.
    }
  }

  function hydrateStoredSessionHints() {
    const storedFallbackUser = readFallbackUserFromStorage();
    if (storedFallbackUser) {
      state.fallbackUser = storedFallbackUser;
    }

    try {
      const rawTimestamp = window.localStorage.getItem(LAST_AUTH_AT_STORAGE_KEY);
      const parsedTimestamp = Number.parseInt(rawTimestamp || "", 10);
      if (Number.isFinite(parsedTimestamp) && parsedTimestamp > 0) {
        state.lastSuccessfulAuthAt = parsedTimestamp;
      }
    } catch {
      // Ignore blocked session storage.
    }
  }

  function clearPendingSignOutTimer() {
    if (!state.pendingSignOutTimer) {
      return;
    }

    window.clearTimeout(state.pendingSignOutTimer);
    state.pendingSignOutTimer = null;
  }

  function getOperaBrowserDetected() {
    return /\bOPR\//i.test(window.navigator?.userAgent || "");
  }

  async function configureBestPersistence() {
    const persistenceOptions = [
      { mode: "local", value: window.firebase.auth.Auth.Persistence.LOCAL },
      { mode: "session", value: window.firebase.auth.Auth.Persistence.SESSION },
      { mode: "none", value: window.firebase.auth.Auth.Persistence.NONE }
    ];

    for (const option of persistenceOptions) {
      try {
        await state.auth.setPersistence(option.value);
        state.persistenceMode = option.mode;
        state.lastCompatibilityIssue = option.mode === "local"
          ? ""
          : "Seu navegador limitou a persistência completa do login.";
        return;
      } catch {
        // Try the next persistence mode.
      }
    }

    state.persistenceMode = "failed";
    state.lastCompatibilityIssue = "Seu navegador bloqueou o armazenamento necessário para manter o login.";
  }

  function storeRecentGoogleCredential(result) {
    const hasUser = Boolean(result?.user);
    const credential = window.firebase.auth.GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || result?.credential?.accessToken || "";
    if (!credential && !accessToken && !hasUser) {
      return;
    }

    if (credential) {
      state.lastGoogleCredential = credential;
    } else if (accessToken) {
      state.lastGoogleCredential = window.firebase.auth.GoogleAuthProvider.credential(accessToken);
    }

    if (hasUser) {
      state.fallbackUser = {
        uid: result.user.uid,
        email: result.user.email || "",
        displayName: result.user.displayName || "",
        photoURL: result.user.photoURL || ""
      };
      try {
        window.localStorage.setItem(FALLBACK_USER_STORAGE_KEY, JSON.stringify(state.fallbackUser));
      } catch {
        // Ignore blocked browser storage.
      }
    }

    writeLastSuccessfulAuthAt(Date.now());

    if (accessToken) {
      try {
        window.localStorage.setItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY, accessToken);
      } catch {
        // Ignore blocked browser storage.
      }
    }
  }

  function shouldAttemptSessionRecovery() {
    if (state.recoveringSession || !state.auth) {
      return false;
    }

    if (!state.lastGoogleCredential) {
      try {
        const storedAccessToken = window.localStorage.getItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY);
        if (storedAccessToken) {
          state.lastGoogleCredential = window.firebase.auth.GoogleAuthProvider.credential(storedAccessToken);
        }
      } catch {
        // Ignore blocked browser storage.
      }
    }

    if (!state.lastGoogleCredential) {
      return false;
    }

    return Date.now() - state.lastSuccessfulAuthAt <= 15 * 60 * 1000;
  }

  async function recoverRecentGoogleSession() {
    if (!shouldAttemptSessionRecovery()) {
      return false;
    }

    state.recoveringSession = true;

    try {
      const result = await state.auth.signInWithCredential(state.lastGoogleCredential);
      if (result?.user) {
        updateCurrentUser(result.user);
        return true;
      }
    } catch {
      state.lastGoogleCredential = null;
      try {
        window.localStorage.removeItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY);
      } catch {
        // Ignore blocked browser storage.
      }
    } finally {
      state.recoveringSession = false;
    }

    return false;
  }

  function canUseOperaFallbackSession() {
    if (!getOperaBrowserDetected() || state.explicitSignOutRequested) {
      return false;
    }

    if (!state.fallbackUser?.uid) {
      return false;
    }

    // Keep a short grace window after successful login to absorb Opera auth flapping.
    return Date.now() - state.lastSuccessfulAuthAt <= 15 * 60 * 1000;
  }

  function setupSessionRecoveryHooks() {
    const tryRecover = async () => {
      if (state.currentUser || !getOperaBrowserDetected()) {
        return;
      }

      if (shouldAttemptSessionRecovery()) {
        await recoverRecentGoogleSession();
      }
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void tryRecover();
      }
    });

    window.addEventListener("focus", () => {
      void tryRecover();
    });
  }

  async function ensureDatabaseUser() {
    if (state.auth?.currentUser) {
      return state.auth.currentUser;
    }

    if (shouldAttemptSessionRecovery()) {
      await recoverRecentGoogleSession();
    }

    if (state.auth?.currentUser) {
      return state.auth.currentUser;
    }

    const error = new Error("Sessão do Google não está autenticada no momento.");
    error.code = "auth/unauthenticated";
    throw error;
  }

  async function ensureCloudSession() {
    if (state.auth?.currentUser) {
      return true;
    }

    if (shouldAttemptSessionRecovery()) {
      await recoverRecentGoogleSession();
    }

    return Boolean(state.auth?.currentUser);
  }

  async function getUserCollection() {
    if (!state.db) {
      throw new Error("Banco de dados indisponível.");
    }

    const user = await ensureDatabaseUser();
    return state.db.collection("users").doc(user.uid).collection("characters");
  }

  async function listCharacters() {
    const collection = await getUserCollection();
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
    const collection = await getUserCollection();
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

  async function saveCharacter(character) {
    const collection = await getUserCollection();
    const entryId = character?.id || `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ref = collection.doc(entryId);

    await ref.set({
      id: entryId,
      name: character?.name || "Personagem sem nome",
      className: character?.className || "",
      raceName: character?.raceName || "",
      originName: character?.originName || "",
      savedAt: character?.savedAt || new Date().toISOString(),
      data: character?.data || {}
    }, { merge: true });

    return entryId;
  }

  async function deleteCharacter(characterId) {
    if (!characterId) {
      return;
    }

    const collection = await getUserCollection();
    await collection.doc(characterId).delete();
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
      try {
        state.db.settings({
          experimentalAutoDetectLongPolling: true,
          useFetchStreams: false,
          merge: true
        });
      } catch {
        // Ignore settings errors after Firestore has already started.
      }
      hydrateStoredSessionHints();
      await configureBestPersistence();
      setupSessionRecoveryHooks();

      try {
        const redirectResult = await state.auth.getRedirectResult();
        if (redirectResult?.user) {
          storeRecentGoogleCredential(redirectResult);
          updateCurrentUser(redirectResult.user);
        }
      } catch {
        // Ignore redirect parsing errors on normal page loads.
      }

      state.auth.onAuthStateChanged(async (user) => {
        clearPendingSignOutTimer();

        if (user) {
          state.explicitSignOutRequested = false;
          updateCurrentUser(user);
          if (!state.authReady) {
            state.authReady = true;
            resolveWaiters();
          }
          return;
        }

        if (state.auth?.currentUser) {
          state.explicitSignOutRequested = false;
          updateCurrentUser(state.auth.currentUser);
          if (!state.authReady) {
            state.authReady = true;
            resolveWaiters();
          }
          return;
        }

        state.pendingSignOutTimer = window.setTimeout(async () => {
          if (canUseOperaFallbackSession()) {
            state.transientNullCount += 1;
            updateCurrentUser(state.fallbackUser);
            state.lastCompatibilityIssue = "Sessao instavel no Opera. Tentando reconectar automaticamente.";

            if (shouldAttemptSessionRecovery()) {
              await recoverRecentGoogleSession();
            }

            if (!state.authReady) {
              state.authReady = true;
              resolveWaiters();
            }
            return;
          }

          if (state.auth?.currentUser) {
            state.explicitSignOutRequested = false;
            updateCurrentUser(state.auth.currentUser);
          } else if (shouldAttemptSessionRecovery()) {
            const recovered = await recoverRecentGoogleSession();
            if (!recovered) {
              updateCurrentUser(null);
            }
          } else {
            updateCurrentUser(null);
          }

          if (!state.authReady) {
            state.authReady = true;
            resolveWaiters();
          }
        }, 1200);
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

    hasCloudSession() {
      return Boolean(state.auth?.currentUser);
    },

    async ensureCloudSession() {
      return ensureCloudSession();
    },

    getCurrentUser() {
      return state.currentUser;
    },

    getDiagnostics() {
      return {
        persistenceMode: state.persistenceMode,
        lastCompatibilityIssue: state.lastCompatibilityIssue,
        operaDetected: getOperaBrowserDetected()
      };
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

      if (state.persistenceMode === "failed") {
        const error = new Error("Armazenamento bloqueado pelo navegador.");
        error.code = "auth/web-storage-unsupported";
        throw error;
      }

      if (state.signingIn) {
        return;
      }

      state.signingIn = true;
      state.explicitSignOutRequested = false;

      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      try {
        try {
          const result = await state.auth.signInWithPopup(provider);
          if (result?.user) {
            storeRecentGoogleCredential(result);
            updateCurrentUser(result.user);
          }
        } catch (error) {
          if (REDIRECT_FALLBACK_CODES.has(error?.code)) {
            await state.auth.signInWithRedirect(provider);
            return;
          }

          throw error;
        }
      } finally {
        state.signingIn = false;
      }
    },

    async signOut() {
      if (!state.auth) {
        return;
      }

      state.explicitSignOutRequested = true;
      await state.auth.signOut();
      state.lastGoogleCredential = null;
      state.lastSuccessfulAuthAt = 0;
      state.fallbackUser = null;
      try {
        window.localStorage.removeItem(GOOGLE_ACCESS_TOKEN_STORAGE_KEY);
        window.localStorage.removeItem(LAST_AUTH_AT_STORAGE_KEY);
        window.localStorage.removeItem(FALLBACK_USER_STORAGE_KEY);
      } catch {
        // Ignore blocked browser storage.
      }
    },

    listCharacters,
    saveCharacter,
    deleteCharacter,
    replaceAllCharacters
  };

  window.DVHAuth = api;
  initializeAuth();
})();
