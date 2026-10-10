/**
 * In-memory answer statistics of one session. Nothing here is persisted.
 */
export function createStats() {
    let correct = 0;
    let wrong = 0;
    /** @type {Map<string, { card: object, count: number }>} */
    const mistakes = new Map();

    return {
        /**
         * @param {{ entryId: string }} card
         * @param {boolean} isCorrect
         */
        record(card, isCorrect) {
            if (isCorrect) {
                correct++;
                return;
            }
            wrong++;
            const item = mistakes.get(card.entryId);
            if (item) {
                item.count++;
            } else {
                mistakes.set(card.entryId, { card, count: 1 });
            }
        },

        /**
         * @returns {{ total: number, correct: number, wrong: number, accuracy: number,
         *             mistakes: { card: object, count: number }[] }}
         *   `accuracy` is a whole percent, 0 when nothing was answered. `mistakes` is sorted by
         *   count, most first, then by the prompt text.
         */
        snapshot() {
            const total = correct + wrong;
            const list = [...mistakes.values()]
                .map((item) => ({ card: item.card, count: item.count }))
                .sort((a, b) => b.count - a.count || a.card.prompt.localeCompare(b.card.prompt));
            return {
                total,
                correct,
                wrong,
                accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
                mistakes: list,
            };
        },
    };
}
