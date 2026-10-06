import { shuffled } from './shuffle.js';

/** Pairs per matching round when the session has enough cards. */
export const PAIRS_PER_ROUND = 6;

/**
 * @typedef {object} MatchItem
 * @property {string} entryId
 * @property {string} text
 * @property {string} lang
 */

/**
 * Lays out one matching round: prompts in the left column, answers in the right one, each column
 * shuffled on its own. The cards come from `session.nextBatch`, which keeps their texts distinct,
 * so an item matches exactly the item with the same entry id.
 *
 * @param {import('./session.js').Card[]} cards
 * @param {() => number} [rng]
 * @returns {{ left: MatchItem[], right: MatchItem[] }}
 */
export function buildRound(cards, rng = Math.random) {
    return {
        left: shuffled(
            cards.map((c) => ({ entryId: c.entryId, text: c.prompt, lang: c.promptLang })),
            rng,
        ),
        right: shuffled(
            cards.map((c) => ({ entryId: c.entryId, text: c.answer, lang: c.answerLang })),
            rng,
        ),
    };
}
