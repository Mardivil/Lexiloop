import { collapseSpaces } from '../core/text.js';
import { entryId } from './deck.js';
import { DEFAULT_IMPORT_PROFILE } from './import-profiles.js';

const XLSX_SCRIPT = 'vendor/xlsx.full.min.js';

export const ImportErrorCode = Object.freeze({
    /** The file is not a zip container, so it cannot be an .xlsx workbook. */
    NotXlsx: 'not-xlsx',
    /** SheetJS could not read the workbook. */
    Unreadable: 'unreadable',
    NoSheet: 'no-sheet',
    NoRows: 'no-rows',
    LibraryMissing: 'library-missing',
});

export class ImportError extends Error {
    /** @param {string} code One of `ImportErrorCode`. */
    constructor(code, cause) {
        super(code, { cause });
        this.name = 'ImportError';
        this.code = code;
    }
}

let libraryPromise = null;

/**
 * Loads SheetJS on first use. It is close to 1 MB, so the start screen does not wait for it.
 * @returns {Promise<any>} The `XLSX` global.
 */
export function loadXlsxLibrary() {
    if (globalThis.XLSX) {
        return Promise.resolve(globalThis.XLSX);
    }
    if (!libraryPromise) {
        libraryPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = XLSX_SCRIPT;
            script.onload = () =>
                globalThis.XLSX
                    ? resolve(globalThis.XLSX)
                    : reject(new ImportError(ImportErrorCode.LibraryMissing));
            script.onerror = () => {
                libraryPromise = null;
                script.remove();
                reject(new ImportError(ImportErrorCode.LibraryMissing));
            };
            document.head.append(script);
        });
    }
    return libraryPromise;
}

/** Longest column header that is shown as the name of the translation language. */
const MAX_LABEL_LENGTH = 40;

/**
 * The header text of a column, used to name the translation language ("English", "Ukrainian").
 * @returns {string} '' when the cell is empty or its text is too long to be a name.
 */
function columnLabel(cell) {
    const text = collapseSpaces(String(cell?.w ?? cell?.v ?? ''));
    return text.length <= MAX_LABEL_LENGTH ? text : '';
}

/** Every .xlsx file is a zip archive, which starts with the local file header "PK\x03\x04". */
function isZip(bytes) {
    return (
        bytes.length >= 4 &&
        bytes[0] === 0x50 &&
        bytes[1] === 0x4b &&
        bytes[2] === 0x03 &&
        bytes[3] === 0x04
    );
}

/**
 * Reads a word list from the first sheet of an .xlsx workbook.
 *
 * @param {ArrayBuffer} buffer
 * @param {string} fileName
 * @param {object} XLSX The SheetJS library.
 * @param {import('./import-profiles.js').ImportProfile} [profile]
 * @returns {{ deck: import('./deck.js').Deck,
 *             report: { imported: number, incomplete: number, duplicates: number } }}
 * @throws {ImportError}
 */
export function parseWorkbook(buffer, fileName, XLSX, profile = DEFAULT_IMPORT_PROFILE) {
    const bytes = new Uint8Array(buffer);
    if (!isZip(bytes)) {
        throw new ImportError(ImportErrorCode.NotXlsx);
    }

    let workbook;
    try {
        // Only the first sheet is parsed: the others are ignored anyway.
        workbook = XLSX.read(bytes, { type: 'array', sheets: 0, cellHTML: false, cellFormula: false });
    } catch (error) {
        throw new ImportError(ImportErrorCode.Unreadable, error);
    }

    const sheet = workbook.SheetNames.length > 0 ? workbook.Sheets[workbook.SheetNames[0]] : null;
    if (!sheet) {
        throw new ImportError(ImportErrorCode.NoSheet);
    }

    const headerCell =
        profile.headerRows > 0 ? sheet[`${profile.columns.translation}${profile.headerRows}`] : null;

    // header: 'A' keys each row by column letter. A numeric range starts reading at that row
    // index, which skips the header rows. raw: false yields the text as Excel displays it.
    const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 'A',
        range: profile.headerRows,
        raw: false,
        defval: '',
        blankrows: false,
    });

    const entries = [];
    /** @type {Map<string, string>} id -> the texts it was made from. */
    const seen = new Map();
    let incomplete = 0;
    let duplicates = 0;
    for (const row of rows) {
        const term = String(row[profile.columns.term] ?? '').trim();
        const translation = String(row[profile.columns.translation] ?? '').trim();
        if (term === '' && translation === '') {
            continue;
        }
        if (term === '' || translation === '') {
            incomplete++;
            continue;
        }
        const texts = `${term}\u0000${translation}`;
        const baseId = entryId(term, translation);
        let id = baseId;
        // A 32-bit hash can collide for different texts. A numeric suffix keeps both entries.
        for (let n = 2; seen.has(id) && seen.get(id) !== texts; n++) {
            id = `${baseId}-${n}`;
        }
        if (seen.has(id)) {
            duplicates++;
            continue;
        }
        seen.set(id, texts);
        entries.push({ id, term, translation });
    }

    if (entries.length === 0) {
        throw new ImportError(ImportErrorCode.NoRows);
    }

    return {
        deck: {
            id: `deck-${Date.now().toString(36)}`,
            profileId: profile.id,
            sourceLang: profile.sourceLang,
            targetLang: profile.targetLang,
            targetLabel: columnLabel(headerCell),
            fileName,
            importedAt: new Date().toISOString(),
            entries,
        },
        report: { imported: entries.length, incomplete, duplicates },
    };
}
