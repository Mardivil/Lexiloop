import { t } from '../i18n/index.js';
import { bindKeys } from '../platform/keys.js';
import { h } from './dom.js';

function arrowLabel(arrow, text, arrowFirst) {
    const glyph = h('span', { attrs: { 'aria-hidden': 'true' }, text: arrow });
    return arrowFirst ? [glyph, ' ', text] : [text, ' ', glyph];
}

/**
 * One step back in a study mode: shows the previous card again, read-only, and returns to the
 * current one. The current view stays in the page, only hidden, so its state and its pending
 * input survive the review untouched. Answers and scores are not affected.
 *
 * The review owns the keyboard bindings of the mode: `keys` while the current card is shown,
 * plus Left arrow for "Back".
 *
 * @param {object} options
 * @param {HTMLElement} options.root  Element the mode renders into.
 * @param {HTMLElement} options.view  The mode's current view, a child of `root`.
 * @param {Record<string, (event: KeyboardEvent) => void>} options.keys  The mode's own bindings.
 */
export function createReview({ root, view, keys }) {
    /** @type {((continueButton: HTMLElement) => HTMLElement | null) | null} */
    let buildPrevious = null;
    let shown = null;

    const backButton = h(
        'button',
        { class: 'btn btn-quiet btn-back', type: 'button', on: { click: open } },
        arrowLabel('\u2190', t('review.back'), true),
    );
    backButton.hidden = true;

    const currentKeys = { ...keys, ArrowLeft: open };
    const reviewKeys = { ArrowRight: close, Space: close, Enter: close, Escape: keys.Escape };

    function open() {
        if (shown || !buildPrevious) {
            return;
        }
        const continueButton = h(
            'button',
            { class: 'btn btn-primary', type: 'button', on: { click: close } },
            arrowLabel('\u2192', t('review.continue'), false),
        );
        shown = buildPrevious(continueButton);
        if (!shown) {
            return;
        }
        view.hidden = true;
        root.append(shown);
        bindKeys(reviewKeys);
        continueButton.focus({ preventScroll: true });
    }

    function close() {
        if (!shown) {
            return;
        }
        shown.remove();
        shown = null;
        view.hidden = false;
        bindKeys(currentKeys);
    }

    bindKeys(currentKeys);

    return {
        /** Bar with the "Back" button, placed by the mode above its card. */
        bar: h('div', { class: 'review-bar' }, backButton),

        /** Bar of the same height without a button, keeps the previous card where the current one is. */
        emptyBar() {
            return h('div', { class: 'review-bar' });
        },

        /** Keys hint of the review screen. */
        keysHint() {
            return h('p', { class: 'keys-hint', text: t('review.keys') });
        },

        /**
         * Sets how the previous card is drawn. `build` gets the "Continue" button to place in its
         * footer and returns the whole review view, or null to refuse the review for now.
         * Null instead of `build` hides "Back".
         * @param {((continueButton: HTMLElement) => HTMLElement | null) | null} build
         */
        setPrevious(build) {
            buildPrevious = build;
            backButton.hidden = !build;
        },

        /** Removes the review from the page without touching the keyboard bindings. */
        unmount() {
            shown?.remove();
        },
    };
}
