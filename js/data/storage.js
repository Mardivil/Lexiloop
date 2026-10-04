/**
 * Persistence of the word list. It is the only data the app keeps between visits.
 *
 * Every access is wrapped in try/catch: storage throws in some private browsing modes and when
 * site data is blocked, and the app must keep working without it.
 */

const STORAGE_KEY = 'lexiloop.v1';
const SCHEMA_VERSION = 1;

/**
 * @typedef {object} StoredState
 * @property {number} version
 * @property {string} activeDeckId
 * @property {import('./deck.js').Deck[]} decks
 */

/** @param {Storage | undefined} [storage] */
function resolve(storage) {
    if (storage) {
        return storage;
    }
    try {
        return globalThis.localStorage ?? null;
    } catch {
        return null;
    }
}

function isDeck(value) {
    return (
        value &&
        typeof value.id === 'string' &&
        typeof value.sourceLang === 'string' &&
        typeof value.targetLang === 'string' &&
        Array.isArray(value.entries) &&
        value.entries.every(
            (e) =>
                e &&
                typeof e.id === 'string' &&
                typeof e.term === 'string' &&
                typeof e.translation === 'string',
        )
    );
}

/**
 * Brings a stored state of any known version to the current shape.
 * @returns {StoredState | null} Null when the data is not recognised.
 */
function migrate(raw) {
    if (!raw || typeof raw !== 'object') {
        return null;
    }
    if (raw.version === SCHEMA_VERSION && Array.isArray(raw.decks) && raw.decks.every(isDeck)) {
        return raw;
    }
    return null;
}

/**
 * @param {Storage} [storage] Defaults to `localStorage`. Tests pass a stand-in.
 * @returns {import('./deck.js').Deck | null} The active deck, or null when none is stored or the
 *   stored data cannot be read.
 */
export function loadActiveDeck(storage) {
    const store = resolve(storage);
    if (!store) {
        return null;
    }
    try {
        const text = store.getItem(STORAGE_KEY);
        if (!text) {
            return null;
        }
        const state = migrate(JSON.parse(text));
        if (!state) {
            return null;
        }
        return state.decks.find((d) => d.id === state.activeDeckId) ?? state.decks[0] ?? null;
    } catch {
        return null;
    }
}

export const SaveResult = Object.freeze({
    Saved: 'saved',
    /** Storage is missing or refuses every write (private mode, blocked site data). */
    Unavailable: 'unavailable',
    /** The word list is larger than the space the browser gives the site. */
    Full: 'full',
});

function isQuotaError(error) {
    return (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
}

/**
 * Stores `deck` as the only deck, replacing the previous word list. When the write fails, the
 * previous list stays stored as it was.
 * @param {import('./deck.js').Deck} deck
 * @param {Storage} [storage]
 * @returns {string} One of `SaveResult`.
 */
export function saveActiveDeck(deck, storage) {
    const store = resolve(storage);
    if (!store) {
        return SaveResult.Unavailable;
    }
    /** @type {StoredState} */
    const state = { version: SCHEMA_VERSION, activeDeckId: deck.id, decks: [deck] };
    try {
        store.setItem(STORAGE_KEY, JSON.stringify(state));
        return SaveResult.Saved;
    } catch (error) {
        return isQuotaError(error) ? SaveResult.Full : SaveResult.Unavailable;
    }
}

/**
 * Calls `listener` when another tab of the app replaces the stored word list.
 * @param {() => void} listener
 */
export function onStoredDeckChange(listener) {
    globalThis.addEventListener?.('storage', (event) => {
        if (event.key === STORAGE_KEY || event.key === null) {
            listener();
        }
    });
}
