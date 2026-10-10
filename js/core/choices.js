import { shuffled } from './shuffle.js';

/**
 * @typedef {object} Option
 * @property {string} text      Answer text as shown.
 * @property {string} key       Normalized answer text.
 * @property {boolean} correct  True for the answer of the asked card.
 */

/**
 * Builds the answer options for a multiple choice question: the correct answer plus up to
 * `count - 1` distractors drawn from the other answers of the same card set.
 *
 * A distractor is never equal to the correct answer, never repeats another option, and is never
 * an answer that is also right for the same prompt text: a word list may hold the same word twice
 * with different translations, and either translation must count as right.
 *
 * @param {import('./session.js').Card} card
 * @param {import('./session.js').Card[]} cards All cards of the session.
 * @param {{ count?: number, rng?: () => number }} [options]
 * @returns {Option[]} In random order. Fewer than `count` when the set has too few distinct answers.
 */
export function buildOptions(card, cards, { count = 4, rng = Math.random } = {}) {
    const validKeys = new Set(
        cards.filter((c) => c.promptKey === card.promptKey).map((c) => c.answerKey),
    );
    validKeys.add(card.answerKey);

    /** @type {Map<string, string>} answerKey -> first answer text with that key. */
    const candidates = new Map();
    for (const c of cards) {
        if (!validKeys.has(c.answerKey) && !candidates.has(c.answerKey)) {
            candidates.set(c.answerKey, c.answer);
        }
    }

    const distractors = shuffled([...candidates.entries()], rng)
        .slice(0, Math.max(0, count - 1))
        .map(([key, text]) => ({ text, key, correct: false }));

    return shuffled([{ text: card.answer, key: card.answerKey, correct: true }, ...distractors], rng);
}
