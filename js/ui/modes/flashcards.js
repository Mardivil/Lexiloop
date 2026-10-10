import { t } from '../../i18n/index.js';
import { h, lengthClass, speakButton } from '../dom.js';
import { createReview } from '../review.js';

/** Flashcards: the prompt side first, a tap reveals the answer, then the learner grades themself. */
export default {
    id: 'flashcards',
    titleKey: 'mode.flashcards',
    hintKey: 'mode.flashcards.hint',

    /**
     * @param {HTMLElement} root
     * @param {import('../screens/session.js').ModeContext} ctx
     */
    mount(root, ctx) {
        let card = null;
        let flipped = false;
        let cardButton = null;
        let speakers = null;
        let footer = null;

        const view = h('div', { class: 'flash' });
        root.append(view);
        const review = createReview({
            root,
            view,
            keys: {
                Space: flip,
                Enter: flip,
                Digit1: () => grade(true),
                Digit2: () => grade(false),
                Escape: ctx.finish,
            },
        });

        function flip() {
            if (flipped) {
                return;
            }
            flipped = true;
            // The card element is kept, so the CSS transition animates the turn.
            cardButton.classList.add('is-flipped');
            cardButton.setAttribute('aria-label', `${card.prompt} \u2014 ${card.answer}`);
            speakers.append(speakButton(ctx, card.answer, card.answerLang) ?? '');
            footer.replaceChildren(gradeButtons());
        }

        function grade(known) {
            if (!flipped) {
                return;
            }
            ctx.answer(card, known);
            const graded = card;
            review.setPrevious((continueButton) => previousView(graded, continueButton));
            next();
        }

        function next() {
            card = ctx.session.next();
            flipped = false;
            render();
        }

        function face(side, ...content) {
            return h('div', { class: `flash-face flash-${side}` }, ...content);
        }

        function faces(shown) {
            return h(
                'div',
                { class: 'flash-inner' },
                face(
                    'front',
                    h('span', {
                        class: `flash-text ${lengthClass(shown.prompt)}`,
                        lang: shown.promptLang,
                        text: shown.prompt,
                    }),
                ),
                face(
                    'back',
                    h('span', {
                        class: `flash-text ${lengthClass(shown.answer)}`,
                        lang: shown.answerLang,
                        text: shown.answer,
                    }),
                    h('span', { class: 'flash-sub', lang: shown.promptLang, text: shown.prompt }),
                ),
            );
        }

        /** The graded card turned to its answer side, with both texts to listen to. */
        function previousView(graded, continueButton) {
            return h(
                'div',
                { class: 'flash' },
                review.emptyBar(),
                h(
                    'div',
                    { class: 'flash-stage' },
                    h(
                        'div',
                        {
                            class: 'flash-card is-flipped',
                            attrs: { role: 'group', 'aria-label': `${graded.prompt} \u2014 ${graded.answer}` },
                        },
                        faces(graded),
                    ),
                    h(
                        'div',
                        { class: 'flash-speakers' },
                        speakButton(ctx, graded.prompt, graded.promptLang),
                        speakButton(ctx, graded.answer, graded.answerLang),
                    ),
                ),
                h('div', { class: 'flash-footer' }, continueButton),
                review.keysHint(),
            );
        }

        function gradeButtons() {
            return h(
                'div',
                { class: 'actions two' },
                h('button', {
                    class: 'btn btn-bad',
                    type: 'button',
                    text: t('flash.dontKnow'),
                    on: { click: () => grade(false) },
                }),
                h('button', {
                    class: 'btn btn-good',
                    type: 'button',
                    text: t('flash.know'),
                    on: { click: () => grade(true) },
                }),
            );
        }

        function render() {
            view.replaceChildren();
            cardButton = h(
                'button',
                {
                    class: 'flash-card',
                    type: 'button',
                    attrs: { 'aria-label': card.prompt },
                    on: { click: flip },
                },
                faces(card),
            );
            speakers = h('div', { class: 'flash-speakers' }, speakButton(ctx, card.prompt, card.promptLang));
            footer = h('div', { class: 'flash-footer' }, h('p', { class: 'hint', text: t('flash.tapToFlip') }));
            view.append(
                review.bar,
                h('div', { class: 'flash-stage' }, cardButton, speakers),
                footer,
                h('p', { class: 'keys-hint', text: t('flash.keys') }),
            );
        }

        next();

        return {
            unmount() {
                review.unmount();
                view.remove();
            },
        };
    },
};
