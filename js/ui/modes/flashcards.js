import { t } from '../../i18n/index.js';
import { bindKeys } from '../../platform/keys.js';
import { h, lengthClass, speakButton } from '../dom.js';

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
                h(
                    'div',
                    { class: 'flash-inner' },
                    face(
                        'front',
                        h('span', {
                            class: `flash-text ${lengthClass(card.prompt)}`,
                            lang: card.promptLang,
                            text: card.prompt,
                        }),
                    ),
                    face(
                        'back',
                        h('span', {
                            class: `flash-text ${lengthClass(card.answer)}`,
                            lang: card.answerLang,
                            text: card.answer,
                        }),
                        h('span', { class: 'flash-sub', lang: card.promptLang, text: card.prompt }),
                    ),
                ),
            );
            speakers = h('div', { class: 'flash-speakers' }, speakButton(ctx, card.prompt, card.promptLang));
            footer = h('div', { class: 'flash-footer' }, h('p', { class: 'hint', text: t('flash.tapToFlip') }));
            view.append(
                h('div', { class: 'flash-stage' }, cardButton, speakers),
                footer,
                h('p', { class: 'keys-hint', text: t('flash.keys') }),
            );
        }

        bindKeys({
            Space: flip,
            Enter: flip,
            Digit1: () => grade(true),
            Digit2: () => grade(false),
            Escape: ctx.finish,
        });

        next();

        return {
            unmount() {
                view.remove();
            },
        };
    },
};
