import { cardsFor, Direction } from './data/deck.js';
import { downloadGoogleSheet } from './data/google-sheets.js';
import { ImportError, ImportErrorCode, loadXlsxLibrary, parseWorkbook } from './data/importer.js';
import { loadActiveDeck, onStoredDeckChange, saveActiveDeck, SaveResult } from './data/storage.js';
import { t } from './i18n/index.js';
import { createSpeech } from './platform/speech.js';
import { modeById } from './ui/modes/registry.js';
import { showSession } from './ui/screens/session.js';
import { showStart } from './ui/screens/start.js';
import { showStats } from './ui/screens/stats.js';
import { directionLabel } from './ui/labels.js';

const root = document.getElementById('app');
const speech = createSpeech();

/** History entry pushed while studying, so the browser's Back returns to the start screen. */
const STUDY_STATE = 'lexiloop-study';

/** @type {import('./ui/screens/start.js').StartState} */
const state = {
    deck: loadActiveDeck(),
    direction: Direction.Forward,
    modeId: 'flashcards',
    busy: false,
    message: null,
    linkOpen: false,
    listOpen: false,
};

let screen = 'start';
/** The running session's handle, while one runs. */
let activeSession = null;

function renderStart() {
    screen = 'start';
    showStart(root, {
        state,
        onFile: importFile,
        onLink: importLink,
        onRefresh: () => state.deck?.sourceUrl && importLink(state.deck.sourceUrl),
        // The controls already show the new value, so the screen is not rebuilt.
        onChange: (patch) => Object.assign(state, patch),
        onStart: () => startSession(),
    });
}

function importReport(report) {
    const lines = [t('import.ok', { words: t('words', { count: report.imported }) })];
    if (report.incomplete > 0) {
        lines.push(t('import.incomplete', { count: report.incomplete }));
    }
    if (report.duplicates > 0) {
        lines.push(t('import.duplicates', { count: report.duplicates }));
    }
    return lines;
}

/** @param {File} file */
function importFile(file) {
    return importWorkbook(() => file.arrayBuffer(), file.name, null);
}

/** @param {string} link Link of a Google Sheets spreadsheet shared by link. */
function importLink(link) {
    return importWorkbook(() => downloadGoogleSheet(link), t('lang.sheet'), link.trim());
}

/**
 * Reads a workbook, stores it as the word list and reports the result on the start screen.
 * @param {() => Promise<ArrayBuffer>} read
 * @param {string} fileName
 * @param {string | null} sourceUrl  The spreadsheet link, for a list that can be refreshed.
 */
async function importWorkbook(read, fileName, sourceUrl) {
    state.busy = true;
    state.message = null;
    renderStart();
    try {
        const [XLSX, buffer] = await Promise.all([loadXlsxLibrary(), read()]);
        let result;
        try {
            result = parseWorkbook(buffer, fileName, XLSX);
        } catch (error) {
            // Google answers a link it will not share with a web page, not with a workbook.
            const notAWorkbook = error instanceof ImportError && error.code === ImportErrorCode.NotXlsx;
            throw sourceUrl && notAWorkbook ? new ImportError(ImportErrorCode.NoAccess, error) : error;
        }
        const { deck, report } = result;
        if (sourceUrl) {
            deck.sourceUrl = sourceUrl;
        }
        state.linkOpen = false;
        state.linkDraft = undefined;
        const lines = importReport(report);
        let kind = 'ok';
        const saved = saveActiveDeck(deck);
        if (saved !== SaveResult.Saved) {
            lines.push(t(saved === SaveResult.Full ? 'storage.full' : 'storage.unavailable'));
            kind = 'warning';
        }
        state.deck = deck;
        state.message = { kind, lines };
        state.listOpen = false;
    } catch (error) {
        const lines = [t(`import.error.${error instanceof ImportError ? error.code : 'read'}`)];
        if (state.deck) {
            lines.push(t('import.kept'));
        }
        state.message = { kind: 'error', lines };
        // The loading controls stay at hand for another try.
        state.listOpen = true;
    } finally {
        state.busy = false;
        if (screen === 'start') {
            renderStart();
        }
    }
}

/**
 * @param {string[]} [entryIds] Restricts the session to these entries, all of them by default.
 */
function startSession(entryIds) {
    if (!state.deck || state.busy) {
        return;
    }
    const entries = entryIds
        ? state.deck.entries.filter((entry) => entryIds.includes(entry.id))
        : state.deck.entries;
    if (entries.length === 0) {
        return;
    }
    if (history.state !== STUDY_STATE) {
        history.pushState(STUDY_STATE, '');
    }
    state.message = null;
    screen = 'session';
    window.scrollTo(0, 0);
    activeSession = showSession(root, {
        cards: cardsFor(state.deck, state.direction, entries),
        pool: cardsFor(state.deck, state.direction),
        modeId: state.modeId,
        speech,
        onFinish: (stats) => {
            activeSession = null;
            renderStats(stats);
        },
    });
}

function renderStats(stats) {
    screen = 'stats';
    showStats(root, {
        stats,
        subtitle: `${t(modeById(state.modeId).titleKey)} \u00b7 ${directionLabel(state.deck, state.direction)}`,
        onNewSession: () => startSession(),
        onRetryMistakes: (entryIds) => startSession(entryIds),
        onMenu: backToMenu,
    });
}

/** Leaves the study screens. Going back in history keeps Back and the Menu button in step. */
function backToMenu() {
    if (history.state === STUDY_STATE) {
        history.back();
    } else {
        renderStart();
    }
}

window.addEventListener('popstate', () => {
    if (screen === 'start') {
        return;
    }
    // Back during a session drops it without statistics, like leaving a page.
    activeSession?.abort();
    activeSession = null;
    window.scrollTo(0, 0);
    renderStart();
});

// Another tab loaded a new word list.
onStoredDeckChange(() => {
    state.deck = loadActiveDeck() ?? state.deck;
    if (screen === 'start' && !state.busy) {
        renderStart();
    }
});

// A reload during a session keeps its history entry, but the app always opens on the menu.
if (history.state === STUDY_STATE) {
    history.replaceState(null, '');
}
renderStart();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    // Without a worker the app still runs; it only loses offline start.
    navigator.serviceWorker.register('sw.js').catch(() => {});
}
