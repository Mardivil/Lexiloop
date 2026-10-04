import { UNDETERMINED } from './languages.js';

/**
 * @typedef {object} ImportProfile
 * @property {string} id
 * @property {string} sourceLang  Language of the studied words.
 * @property {string} targetLang  Language of their translations, `UNDETERMINED` when any.
 * @property {{ term: string, translation: string }} columns  Spreadsheet column letters.
 * @property {number} headerRows  Rows at the top of the sheet that are skipped.
 */

/** @type {Record<string, ImportProfile>} */
export const IMPORT_PROFILES = {
    // Japanese words with translations in whatever language the sheet uses.
    'ja-any': {
        id: 'ja-any',
        sourceLang: 'ja',
        targetLang: UNDETERMINED,
        columns: { term: 'B', translation: 'C' },
        headerRows: 1,
    },
};

export const DEFAULT_IMPORT_PROFILE = IMPORT_PROFILES['ja-any'];
