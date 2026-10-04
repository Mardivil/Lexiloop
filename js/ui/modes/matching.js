import { buildRound, isMatch, PAIRS_PER_ROUND } from '../../core/matching.js';
import { bindKeys } from '../../platform/keys.js';
import { clear, h } from '../dom.js';

/** How long a wrong pair stays marked. */
const WRONG_FLASH_MS = 600;
/** Pause after the last pair of a round before the next round appears. */
const ROUND_DONE_MS = 450;

/** Matching pairs: prompts on the left, answers on the right, tap one of each to pair them. */
export default {
    id: 'matching',
    titleKey: 'mode.matching',
    hintKey: 'mode.matching.hint',

    /**
     * @param {HTMLElement} root
     * @param {import('../screens/session.js').ModeContext} ctx
     */
    mount(root, ctx) {
        const { t } = ctx;
        /** @type {Map<string, import('../../core/session.js').Card>} */
        let cardsById = new Map();
        let round = { left: [], right: [] };
        let selected = { left: null, right: null };
        let matchedCount = 0;
        let busy = false;
        const timers = new Set();
        /** @type {Map<object, HTMLButtonElement>} */
        const buttons = new Map();
        let status = null;

        const view = h('div', { class: 'matching' });
        root.append(view);

        function later(fn, ms) {
            const id = window.setTimeout(() => {
                timers.delete(id);
                fn();
            }, ms);
            timers.add(id);
        }

        function nextRound() {
            const cards = ctx.session.nextBatch(PAIRS_PER_ROUND);
            cardsById = new Map(cards.map((card) => [card.entryId, card]));
            round = buildRound(cards, ctx.rng);
            selected = { left: null, right: null };
            matchedCount = 0;
            busy = false;
            render();
        }

        function select(side, item) {
            const button = buttons.get(item);
            if (busy || button.classList.contains('is-matched')) {
                return;
            }
            if (selected[side] === item) {
                selected[side] = null;
                button.classList.remove('is-selected');
                return;
            }
            if (selected[side]) {
                buttons.get(selected[side]).classList.remove('is-selected');
            }
            selected[side] = item;
            button.classList.add('is-selected');
            if (selected.left && selected.right) {
                resolve();
            }
        }

        function resolve() {
            const { left, right } = selected;
            const leftButton = buttons.get(left);
            const rightButton = buttons.get(right);
            const card = cardsById.get(left.entryId);
            selected = { left: null, right: null };
            leftButton.classList.remove('is-selected');
            rightButton.classList.remove('is-selected');

            if (isMatch(left, right)) {
                ctx.answer(card, true);
                for (const button of [leftButton, rightButton]) {
                    button.classList.add('is-matched');
                    button.setAttribute('aria-disabled', 'true');
                }
                status.textContent = t('matching.matched', { prompt: card.prompt, answer: card.answer });
                matchedCount++;
                if (matchedCount === round.left.length) {
                    busy = true;
                    later(nextRound, ROUND_DONE_MS);
                }
                return;
            }

            // The mistake is counted against the word on the prompt side.
            ctx.answer(card, false);
            status.textContent = t('matching.wrong');
            busy = true;
            leftButton.classList.add('is-wrong');
            rightButton.classList.add('is-wrong');
            later(() => {
                leftButton.classList.remove('is-wrong');
                rightButton.classList.remove('is-wrong');
                busy = false;
            }, WRONG_FLASH_MS);
        }

        function column(side, items, labelKey) {
            return h(
                'div',
                { class: `match-column match-${side}`, attrs: { role: 'group', 'aria-label': t(labelKey) } },
                items.map((item) => {
                    const button = h('button', {
                        class: 'match-item',
                        type: 'button',
                        lang: item.lang,
                        text: item.text,
                        on: { click: () => select(side, item) },
                    });
                    buttons.set(item, button);
                    return button;
                }),
            );
        }

        function render() {
            clear(view);
            buttons.clear();
            status = h('p', { class: 'visually-hidden', attrs: { role: 'status', 'aria-live': 'polite' } });
            view.append(
                h(
                    'div',
                    { class: 'match-board' },
                    column('left', round.left, 'matching.prompts'),
                    column('right', round.right, 'matching.answers'),
                ),
                status,
                h('p', { class: 'keys-hint', text: t('matching.keys') }),
            );
        }

        bindKeys({ Escape: ctx.finish });

        nextRound();

        return {
            unmount() {
                timers.forEach((id) => window.clearTimeout(id));
                timers.clear();
                view.remove();
            },
        };
    },
};
