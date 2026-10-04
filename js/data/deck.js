import { fnv1a } from '../core/text.js';
import { language } from './languages.js';

/**
 * @typedef {object} Entry
 * @property {string} id           Stable across imports of the same word and translation.
 * @property {string} term         Studied word, in the deck's source language.
 * @property {string} translation  Its translation, in the deck's target language.
 */

/**
 * @typedef {object} Deck
 * @property {string} id
 * @property {string} profileId    Import profile the deck was read with.
 * @property {string} sourceLang
 * @property {string} targetLang
 * @property {string} [targetLabel]  Name of the translation language from the sheet's header, or ''.
 * @property {string} fileName
 * @property {string} [sourceUrl]  Link of the Google Sheets spreadsheet the deck was read from.
 * @property {string} importedAt   ISO 8601 timestamp.
 * @property {Entry[]} entries
 */

export const Direction = Object.freeze({
    /** Source language word as the prompt, translation as the answer. */
    Forward: 'forward',
    Reverse: 'reverse',
});

/**
 * Creates the id of an entry from its texts.
 * @param {string} term
 * @param {string} translation
 */
export function entryId(term, translation) {
    return fnv1a(`${term}\u0000${translation}`);
}

/**
 * Turns a deck's entries into session cards for one study direction.
 * @param {Deck} deck
 * @param {string} direction One of `Direction`.
 * @param {Entry[]} [entries] A subset of the deck's entries, all of them by default.
 * @returns {import('../core/session.js').Card[]}
 */
export function cardsFor(deck, direction, entries = deck.entries) {
    const forward = direction === Direction.Forward;
    const promptLang = language(forward ? deck.sourceLang : deck.targetLang);
    const answerLang = language(forward ? deck.targetLang : deck.sourceLang);
    return entries.map((entry) => {
        const prompt = forward ? entry.term : entry.translation;
        const answer = forward ? entry.translation : entry.term;
        return {
            entryId: entry.id,
            prompt,
            answer,
            promptKey: promptLang.normalize(prompt),
            answerKey: answerLang.normalize(answer),
            promptLang: promptLang.code,
            answerLang: answerLang.code,
        };
    });
}
