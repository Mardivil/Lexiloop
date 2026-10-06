import { collapseSpaces } from '../core/text.js';

/** Code of a language that is not known in advance, such as the translations of a word list. */
export const UNDETERMINED = 'und';

/**
 * @typedef {object} LanguageProfile
 * @property {string} code        BCP 47 language code.
 * @property {string} htmlLang    Value of the `lang` attribute; '' marks the language as unknown.
 * @property {string} speechLang  BCP 47 tag for speech synthesis, or '' when the text is not spoken.
 * @property {(text: string) => string} normalize
 *   Maps a text to the form used to decide whether two texts are the same answer.
 */

/** Several apostrophe characters stand for the same letter separator, as U+2019 and U+02BC in Ukrainian. */
const unifyApostrophes = (text) => text.replace(/[\u2019\u02bc\u02b9\u0060\u00b4]/gu, "'");

/** @type {Record<string, LanguageProfile>} */
export const LANGUAGES = {
    ja: {
        code: 'ja',
        htmlLang: 'ja',
        speechLang: 'ja-JP',
        // NFKC folds half-width katakana and full-width Latin into their usual forms.
        normalize: (text) => collapseSpaces(text.normalize('NFKC')),
    },
    [UNDETERMINED]: {
        code: UNDETERMINED,
        htmlLang: '',
        speechLang: '',
        // Locale-neutral rules that hold for any language written with letter case.
        normalize: (text) => unifyApostrophes(collapseSpaces(text.normalize('NFKC')).toLowerCase()),
    },
};

/**
 * @param {string} code
 * @returns {LanguageProfile}
 */
export function language(code) {
    const profile = LANGUAGES[code];
    if (!profile) {
        throw new Error(`Unknown language: ${code}`);
    }
    return profile;
}

/**
 * The `lang` attribute for text in the language `code`.
 * @param {string} code
 */
export function htmlLang(code) {
    return LANGUAGES[code]?.htmlLang ?? code;
}
