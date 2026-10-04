import { createSession } from '../../core/session.js';
import { language } from '../../data/languages.js';
import { t } from '../../i18n/index.js';
import { clearKeys } from '../../platform/keys.js';
import { h } from '../dom.js';
import { modeById } from '../modes/registry.js';

/**
 * What a study mode gets from the session screen.
 * @typedef {object} ModeContext
 * @property {ReturnType<typeof createSession>} session
 * @property {import('../../core/session.js').Card[]} pool
 *   Every card of the word list, also when the session studies only some of them: wrong
 *   options for multiple choice come from here.
 * @property {typeof t} t
 * @property {ReturnType<typeof import('../../platform/speech.js').createSpeech>} speech
 * @property {() => number} rng
 * @property {(lang: string) => string} speechLangOf  Speech tag of a language code, '' if never spoken.
 * @property {(card: object, isCorrect: boolean) => void} answer  Records an answer.
 * @property {() => void} finish  Ends the session and opens the statistics.
 */

/**
 * Shows a running session of one study mode.
 *
 * @param {HTMLElement} root
 * @param {object} options
 * @param {import('../../core/session.js').Card[]} options.cards  Cards the session studies.
 * @param {import('../../core/session.js').Card[]} options.pool   All cards of the word list.
 * @param {string} options.modeId
 * @param {object} options.speech
 * @param {(stats: object) => void} options.onFinish
 * @returns {{ abort(): void }} Ends the session without calling `onFinish`.
 */
export function showSession(root, { cards, pool, modeId, speech, onFinish }) {
    const mode = modeById(modeId);
    const session = createSession({ cards });
    let finished = false;

    const score = h('span', { class: 'score', attrs: { 'aria-live': 'off' } });
    const finishButton = h('button', {
        class: 'btn btn-finish',
        type: 'button',
        text: t('session.finish'),
        on: { click: () => finish() },
    });
    const body = h('main', { class: 'session-body' });

    root.replaceChildren(
        h(
            'header',
            { class: 'session-header' },
            h('div', { class: 'session-title' }, h('span', { class: 'session-mode', text: t(mode.titleKey) }), score),
            finishButton,
        ),
        body,
    );

    function updateScore() {
        const stats = session.stats();
        score.textContent = `\u2713 ${stats.correct}  \u2717 ${stats.wrong}`;
        score.setAttribute('aria-label', t('session.score', { correct: stats.correct, wrong: stats.wrong }));
    }

    function stop() {
        if (finished) {
            return false;
        }
        finished = true;
        clearKeys();
        speech.cancel();
        mounted.unmount();
        return true;
    }

    function finish() {
        if (stop()) {
            onFinish(session.stats());
        }
    }

    const speechLangOf = (code) => language(code).speechLang;

    /** @type {ModeContext} */
    const ctx = {
        session,
        pool,
        t,
        speech,
        rng: Math.random,
        speechLangOf,
        answer(card, isCorrect) {
            session.record(card, isCorrect);
            updateScore();
        },
        finish,
    };

    updateScore();
    const mounted = mode.mount(body, ctx);
    return { abort: stop };
}
