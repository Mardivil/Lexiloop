import { randomInt, shuffled } from './shuffle.js';
import { createStats } from './stats.js';

/** A card answered wrong comes back after this many further cards, chosen at random in the range. */
export const RETRY_GAP_MIN = 3;
export const RETRY_GAP_MAX = 6;

/**
 * A pass shorter than this is padded with filler cards. Studying one or two words alone makes no
 * sense: the same card would come again and again, and a matching round would hold a single pair.
 */
export const MIN_PASS_SIZE = 6;

/**
 * @typedef {object} Card
 * @property {string} entryId    Stable id of the word list entry.
 * @property {string} prompt     Text shown as the question.
 * @property {string} answer     Text expected as the answer.
 * @property {string} promptKey  Normalized prompt, used to compare texts.
 * @property {string} answerKey  Normalized answer, used to compare texts.
 * @property {string} promptLang Language code of the prompt.
 * @property {string} answerLang Language code of the answer.
 */

/**
 * An endless study session over a fixed set of cards.
 *
 * Cards are served in passes: every pass holds all cards in a fresh random order, and a new pass
 * starts when the previous one runs out. A card answered wrong is additionally scheduled to come
 * back a few cards later, and keeps coming back until it is answered right. A card that comes
 * back this way is not shown again later in the same pass.
 *
 * When there are fewer cards than `MIN_PASS_SIZE`, as when only the mistakes of a session are
 * studied again, every pass is padded with a fresh random choice of `fillers`. The studied cards
 * stay in every pass; fillers are answered and counted like any other card.
 *
 * @param {{ cards: Card[], fillers?: Card[], rng?: () => number }} options
 *   `fillers` must not repeat any of `cards`.
 */
export function createSession({ cards, fillers = [], rng = Math.random }) {
    if (cards.length === 0) {
        throw new Error('A session needs at least one card.');
    }

    const stats = createStats();
    /** @type {Map<string, Card>} */
    const cardsById = new Map([...cards, ...fillers].map((card) => [card.entryId, card]));
    const fillerCount = Math.min(fillers.length, Math.max(0, MIN_PASS_SIZE - cards.length));
    const passSize = cards.length + fillerCount;
    /** Remaining cards of the current pass, next card first. */
    let pass = [];
    /** Number of cards served so far, the clock that retry gaps are measured on. */
    let step = 0;
    let lastServedId = null;
    /** @type {Map<string, number>} entryId -> step at which the card is due again. */
    const retries = new Map();

    function startPass() {
        pass = shuffled([...cards, ...shuffled(fillers, rng).slice(0, fillerCount)], rng);
        // The first card of a new pass must not repeat the card just shown.
        if (pass.length > 1 && pass[0].entryId === lastServedId) {
            const j = randomInt(1, pass.length - 1, rng);
            [pass[0], pass[j]] = [pass[j], pass[0]];
        }
    }

    /** Due retries, earliest first. */
    function dueRetries() {
        return [...retries.entries()]
            .filter(([, due]) => due <= step)
            .sort((a, b) => a[1] - b[1])
            .map(([entryId]) => entryId);
    }

    function takeFromPass(isAcceptable) {
        if (pass.length === 0) {
            startPass();
        }
        const index = pass.findIndex(isAcceptable);
        if (index < 0) {
            return null;
        }
        return pass.splice(index, 1)[0];
    }

    function serve(card) {
        // Showing a card for any reason counts as its retry and as its place in the current pass.
        // A retried card left in the pass could otherwise be the only card remaining, and be
        // served twice in a row.
        retries.delete(card.entryId);
        const index = pass.indexOf(card);
        if (index >= 0) {
            pass.splice(index, 1);
        }
        lastServedId = card.entryId;
        step++;
        return card;
    }

    return {
        /** @returns {Card} The next card to ask. */
        next() {
            const dueId = dueRetries().find((id) => id !== lastServedId || passSize === 1);
            if (dueId !== undefined) {
                return serve(cardsById.get(dueId));
            }
            const card =
                takeFromPass((c) => c.entryId !== lastServedId) ?? takeFromPass(() => true);
            return serve(card);
        },

        /**
         * Picks up to `size` cards for one round where every card is on screen at once. No two
         * cards in a round share a prompt text or an answer text, so every pair is unambiguous.
         * Cards that would clash stay at the front of the pass for a later round.
         *
         * @param {number} size
         * @returns {Card[]}
         */
        nextBatch(size) {
            const batch = [];
            const promptKeys = new Set();
            const answerKeys = new Set();
            const fits = (card) =>
                !promptKeys.has(card.promptKey) && !answerKeys.has(card.answerKey);
            const add = (card) => {
                batch.push(serve(card));
                promptKeys.add(card.promptKey);
                answerKeys.add(card.answerKey);
            };

            for (const entryId of dueRetries()) {
                if (batch.length >= size) {
                    break;
                }
                const card = cardsById.get(entryId);
                if (fits(card)) {
                    add(card);
                }
            }

            const deferred = [];
            // Bounded so that a deck with fewer distinct pairs than `size` cannot loop forever.
            for (let attempts = 0; batch.length < size && attempts < passSize * 2; attempts++) {
                const card = takeFromPass(() => true);
                if (fits(card)) {
                    add(card);
                } else {
                    deferred.push(card);
                }
            }
            // A card skipped in this round must not be lost from its pass. If the pass was refilled
            // meanwhile, it already holds the card further back, so that copy is dropped.
            const skipped = [...new Set(deferred)].filter((card) => !batch.includes(card));
            pass = [...skipped, ...pass.filter((card) => !skipped.includes(card))];
            return batch;
        },

        /**
         * Records an answer for a card. A wrong answer schedules the card to come back.
         * @param {Card} card
         * @param {boolean} isCorrect
         */
        record(card, isCorrect) {
            stats.record(card, isCorrect);
            if (!isCorrect) {
                retries.set(card.entryId, step + randomInt(RETRY_GAP_MIN, RETRY_GAP_MAX, rng));
            }
        },

        /** Entry ids currently waiting for a retry. Exposed for tests. */
        pendingRetries() {
            return new Map(retries);
        },

        stats() {
            return stats.snapshot();
        },
    };
}
