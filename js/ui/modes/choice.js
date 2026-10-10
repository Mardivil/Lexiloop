import { buildOptions } from '../../core/choices.js';
import { t } from '../../i18n/index.js';
import { h, lengthClass, speakButton } from '../dom.js';
import { createReview } from '../review.js';

/** Delay before the next question after a right answer, long enough to see the confirmation. */
const CORRECT_ADVANCE_MS = 600;
/**
 * After a wrong answer, a tap on an option moves on only after this pause. Otherwise the second
 * tap of a quick double tap would skip the revealed right answer before it could be read.
 */
const REVEAL_GUARD_MS = 500;

/** Multiple choice: a prompt and up to four answers, one of them right. */
export default {
    id: 'choice',
    titleKey: 'mode.choice',
    hintKey: 'mode.choice.hint',

    /**
     * @param {HTMLElement} root
     * @param {import('../screens/session.js').ModeContext} ctx
     */
    mount(root, ctx) {
        let card = null;
        let options = [];
        let answered = false;
        let chosen = -1;
        let waitingForNext = false;
        let revealedAt = 0;
        let advanceTimer = 0;
        let optionButtons = [];
        let footer = null;
        let status = null;

        const view = h('div', { class: 'choice' });
        root.append(view);
        const review = createReview({
            root,
            view,
            keys: {
                Digit1: () => choose(0),
                Digit2: () => choose(1),
                Digit3: () => choose(2),
                Digit4: () => choose(3),
                Space: () => waitingForNext && next(),
                Enter: () => waitingForNext && next(),
                Escape: ctx.finish,
            },
        });

        function next() {
            window.clearTimeout(advanceTimer);
            advanceTimer = 0;
            if (answered) {
                const question = { card, options, chosen };
                // During the pause after a right answer "Back" would skip the card still on screen.
                review.setPrevious((continueButton) =>
                    advanceTimer ? null : previousView(question, continueButton),
                );
            }
            card = ctx.session.next();
            options = buildOptions(card, ctx.pool);
            answered = false;
            chosen = -1;
            waitingForNext = false;
            render();
        }

        function choose(index) {
            if (waitingForNext) {
                if (performance.now() - revealedAt >= REVEAL_GUARD_MS) {
                    next();
                }
                return;
            }
            if (answered || index >= options.length) {
                return;
            }
            answered = true;
            chosen = index;
            const isCorrect = options[index].correct;
            ctx.answer(card, isCorrect);

            optionButtons.forEach((button, i) => {
                button.setAttribute('aria-disabled', 'true');
                if (options[i].correct) {
                    button.classList.add('is-correct');
                } else if (i === index) {
                    button.classList.add('is-wrong');
                }
            });

            if (isCorrect) {
                status.textContent = t('choice.correct');
                advanceTimer = window.setTimeout(next, CORRECT_ADVANCE_MS);
                return;
            }
            status.textContent = t('choice.wrong', { answer: card.answer });
            waitingForNext = true;
            revealedAt = performance.now();
            const nextButton = h('button', {
                class: 'btn btn-primary',
                type: 'button',
                text: t('choice.next'),
                on: { click: next },
            });
            footer.replaceChildren(
                h('div', { class: 'actions' }, nextButton, speakButton(ctx, card.answer, card.answerLang)),
            );
            nextButton.focus({ preventScroll: true });
        }

        function optionContent(option, i, lang) {
            return [
                h('span', { class: 'option-key', attrs: { 'aria-hidden': 'true' }, text: String(i + 1) }),
                h('span', { class: 'option-text', lang, text: option.text }),
            ];
        }

        function promptBox(shown) {
            return h(
                'div',
                { class: 'prompt' },
                h('span', {
                    class: `prompt-text ${lengthClass(shown.prompt)}`,
                    lang: shown.promptLang,
                    text: shown.prompt,
                }),
                speakButton(ctx, shown.prompt, shown.promptLang),
            );
        }

        /** The answered question with the right option and a wrong choice marked. */
        function previousView(question, continueButton) {
            const marks = question.options.map((option, i) => {
                if (option.correct) {
                    return ' is-correct';
                }
                return i === question.chosen ? ' is-wrong' : '';
            });
            return h(
                'div',
                { class: 'choice is-review' },
                review.emptyBar(),
                promptBox(question.card),
                h(
                    'div',
                    { class: 'options' },
                    question.options.map((option, i) =>
                        h(
                            'div',
                            { class: `option${marks[i]}`, attrs: { 'aria-disabled': 'true' } },
                            optionContent(option, i, question.card.answerLang),
                        ),
                    ),
                ),
                h(
                    'div',
                    { class: 'choice-footer' },
                    h(
                        'div',
                        { class: 'actions' },
                        continueButton,
                        speakButton(ctx, question.card.answer, question.card.answerLang),
                    ),
                ),
                review.keysHint(),
            );
        }

        function render() {
            view.replaceChildren();
            optionButtons = options.map((option, i) =>
                h(
                    'button',
                    {
                        class: 'option',
                        type: 'button',
                        on: { click: () => choose(i) },
                    },
                    optionContent(option, i, card.answerLang),
                ),
            );
            footer = h('div', { class: 'choice-footer' });
            status = h('p', { class: 'visually-hidden', attrs: { role: 'status', 'aria-live': 'polite' } });
            view.append(
                review.bar,
                promptBox(card),
                h('div', { class: 'options' }, optionButtons),
                footer,
                status,
                h('p', { class: 'keys-hint', text: t('choice.keys', { count: options.length }) }),
            );
        }

        next();

        return {
            unmount() {
                window.clearTimeout(advanceTimer);
                review.unmount();
                view.remove();
            },
        };
    },
};
