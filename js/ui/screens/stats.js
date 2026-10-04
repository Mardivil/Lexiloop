import { t } from '../../i18n/index.js';
import { bindKeys } from '../../platform/keys.js';
import { h } from '../dom.js';

/**
 * Shows the statistics of a finished session. They are not kept after this screen.
 *
 * @param {HTMLElement} root
 * @param {object} options
 * @param {ReturnType<import('../../core/stats.js').createStats>['snapshot']} options.stats
 * @param {string} options.subtitle  Mode and direction of the session.
 * @param {() => void} options.onNewSession
 * @param {(entryIds: string[]) => void} options.onRetryMistakes
 * @param {() => void} options.onMenu
 */
export function showStats(root, { stats, subtitle, onNewSession, onRetryMistakes, onMenu }) {
    const tile = (labelKey, value, modifier = '') =>
        h(
            'div',
            { class: `stat ${modifier}` },
            h('span', { class: 'stat-value', text: value }),
            h('span', { class: 'stat-label', text: t(labelKey) }),
        );

    let summary;
    if (stats.total === 0) {
        summary = h('p', { class: 'note', text: t('stats.noAnswers') });
    } else if (stats.mistakes.length === 0) {
        summary = h('p', { class: 'note note-good', text: t('stats.noMistakes') });
    } else {
        summary = h(
            'section',
            { class: 'card' },
            h('h2', { text: t('stats.mistakes') }),
            h(
                'ol',
                { class: 'mistakes' },
                stats.mistakes.map(({ card, count }) =>
                    h(
                        'li',
                        {},
                        h(
                            'span',
                            { class: 'mistake-words' },
                            h('span', { class: 'mistake-prompt', lang: card.promptLang, text: card.prompt }),
                            h('span', { class: 'mistake-answer', lang: card.answerLang, text: card.answer }),
                        ),
                        h('span', { class: 'mistake-count', text: t('stats.times', { count }) }),
                    ),
                ),
            ),
        );
    }

    const mistakeIds = stats.mistakes.map(({ card }) => card.entryId);
    const newSessionButton = h('button', {
        class: 'btn btn-primary',
        type: 'button',
        text: t('stats.newSession'),
        on: { click: onNewSession },
    });

    root.replaceChildren(
        h(
            'main',
            { class: 'page stats' },
            h('h1', { text: t('stats.title') }),
            h('p', { class: 'subtitle', text: subtitle }),
            h(
                'div',
                { class: 'stat-grid' },
                tile('stats.total', String(stats.total)),
                tile('stats.correct', String(stats.correct), 'stat-good'),
                tile('stats.wrong', String(stats.wrong), 'stat-bad'),
                tile('stats.accuracy', `${stats.accuracy}%`),
            ),
            summary,
            h(
                'div',
                { class: 'actions stack' },
                newSessionButton,
                mistakeIds.length > 0 &&
                    h('button', {
                        class: 'btn',
                        type: 'button',
                        text: t('stats.retryMistakes'),
                        on: { click: () => onRetryMistakes(mistakeIds) },
                    }),
                h('button', { class: 'btn btn-quiet', type: 'button', text: t('stats.menu'), on: { click: onMenu } }),
            ),
        ),
    );
    window.scrollTo(0, 0);
    bindKeys({ Escape: onMenu });
}
