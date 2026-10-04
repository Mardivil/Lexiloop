import { Direction } from '../../data/deck.js';
import { currentLocale, t } from '../../i18n/index.js';
import { bindKeys } from '../../platform/keys.js';
import { h } from '../dom.js';
import { directionLabel } from '../labels.js';
import { MODES } from '../modes/registry.js';

const XLSX_ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** @param {string} iso */
function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return new Intl.DateTimeFormat(currentLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/**
 * @typedef {object} StartState
 * @property {import('../../data/deck.js').Deck | null} deck
 * @property {string} direction
 * @property {string} modeId
 * @property {boolean} busy        A file is being read.
 * @property {{ kind: 'ok' | 'error' | 'warning', lines: string[] } | null} message
 * @property {boolean} linkOpen    The form for a Google Sheets link is shown.
 * @property {string} [linkDraft]  Text typed into that form and not loaded yet.
 */

/**
 * Shows the start screen: the word list, the study direction, the mode and the start button.
 *
 * @param {HTMLElement} root
 * @param {object} options
 * @param {StartState} options.state
 * @param {(file: File) => void} options.onFile
 * @param {(link: string) => void} options.onLink     Loads a Google Sheets spreadsheet by its link.
 * @param {() => void} options.onRefresh              Loads the stored spreadsheet link again.
 * @param {(patch: Partial<StartState>) => void} options.onChange
 * @param {() => void} options.onStart
 */
export function showStart(root, { state, onFile, onLink, onRefresh, onChange, onStart }) {
    const { deck } = state;

    const fileInput = h('input', {
        type: 'file',
        accept: XLSX_ACCEPT,
        class: 'visually-hidden',
        id: 'file-input',
        attrs: { tabindex: '-1', 'aria-hidden': 'true' },
        on: {
            change: () => {
                const file = fileInput.files?.[0];
                // Cleared so that picking the same file again still fires `change`.
                fileInput.value = '';
                if (file) {
                    onFile(file);
                }
            },
        },
    });

    const loadButton = h('button', {
        class: deck ? 'btn' : 'btn btn-primary',
        type: 'button',
        disabled: state.busy,
        text: t(deck ? 'start.replace' : 'start.load'),
        on: { click: () => fileInput.click() },
    });

    const linkInput = h('input', {
        type: 'url',
        class: 'text-input',
        id: 'sheet-link',
        // A link that failed to load stays in the field after the screen is rebuilt.
        value: state.linkDraft ?? deck?.sourceUrl ?? '',
        placeholder: t('start.link.placeholder'),
        disabled: state.busy,
        attrs: {
            inputmode: 'url',
            autocomplete: 'off',
            autocapitalize: 'off',
            spellcheck: 'false',
            enterkeyhint: 'go',
        },
        on: { input: () => onChange({ linkDraft: linkInput.value }) },
    });
    const linkForm = h(
        'form',
        {
            class: 'link-form',
            hidden: !state.linkOpen,
            on: {
                submit: (event) => {
                    event.preventDefault();
                    if (!state.busy && linkInput.value.trim()) {
                        onLink(linkInput.value);
                    }
                },
                keydown: (event) => {
                    if (event.key === 'Escape') {
                        toggleLink(false);
                    }
                },
            },
        },
        h('label', { class: 'field-label', htmlFor: 'sheet-link', text: t('start.link.label') }),
        linkInput,
        h(
            'div',
            { class: 'actions' },
            h('button', { class: 'btn btn-primary', type: 'submit', disabled: state.busy, text: t('start.link.load') }),
            h('button', {
                class: 'btn btn-quiet',
                type: 'button',
                text: t('start.link.cancel'),
                on: { click: () => toggleLink(false) },
            }),
        ),
    );

    function toggleLink(open) {
        linkForm.hidden = !open;
        onChange({ linkOpen: open });
        if (open) {
            linkInput.focus();
        }
    }

    const linkButton = h('button', {
        class: 'btn',
        type: 'button',
        disabled: state.busy,
        text: t('start.link'),
        on: { click: () => toggleLink(linkForm.hidden) },
    });

    const refreshButton =
        deck?.sourceUrl &&
        h('button', {
            class: 'btn btn-primary',
            type: 'button',
            disabled: state.busy,
            text: t('start.refresh'),
            on: { click: onRefresh },
        });

    const message = state.busy
        ? h('div', { class: 'message message-info', attrs: { role: 'status' } }, h('p', { text: t('start.loading') }))
        : state.message &&
          h(
              'div',
              {
                  class: `message message-${state.message.kind}`,
                  attrs: { role: state.message.kind === 'error' ? 'alert' : 'status' },
              },
              state.message.lines.map((line) => h('p', { text: line })),
          );

    const listCard = h(
        'section',
        { class: 'card' },
        h('h2', { text: t('start.list.title') }),
        deck
            ? h(
                  'p',
                  { class: 'list-status' },
                  h('strong', { text: t('start.list.saved', { words: t('words', { count: deck.entries.length }) }) }),
                  h('span', {
                      class: 'file-name',
                      text: deck.sourceUrl
                          ? t('start.list.sheet', { date: formatDate(deck.importedAt) })
                          : t('start.list.file', { name: deck.fileName, date: formatDate(deck.importedAt) }),
                  }),
              )
            : h('p', { class: 'list-status', text: t('start.list.empty') }),
        message,
        refreshButton && h('div', { class: 'actions' }, refreshButton),
        h('div', { class: 'actions wrap' }, loadButton, linkButton),
        linkForm,
        fileInput,
    );

    const segmented = (name, options, current, onSelect, layout = '') =>
        h(
            'div',
            { class: `segmented ${layout}`, attrs: { role: 'radiogroup' } },
            options.map((option) =>
                h(
                    'label',
                    { class: 'segment' },
                    h('input', {
                        type: 'radio',
                        name,
                        value: option.value,
                        checked: option.value === current,
                        on: { change: () => onSelect(option.value) },
                    }),
                    h('span', { class: 'segment-body' }, option.content),
                ),
            ),
        );

    const directionCard = h(
        'section',
        { class: 'card' },
        h('h2', { text: t('start.direction') }),
        segmented(
            'direction',
            [Direction.Forward, Direction.Reverse].map((direction) => ({
                value: direction,
                content: directionLabel(deck, direction),
            })),
            state.direction,
            (direction) => onChange({ direction }),
            'two',
        ),
    );

    const modeCard = h(
        'section',
        { class: 'card' },
        h('h2', { text: t('start.mode') }),
        segmented(
            'mode',
            MODES.map((mode) => ({
                value: mode.id,
                content: [
                    h('span', { class: 'mode-title', text: t(mode.titleKey) }),
                    h('span', { class: 'mode-hint', text: t(mode.hintKey) }),
                ],
            })),
            state.modeId,
            (modeId) => onChange({ modeId }),
        ),
    );

    const startButton = h('button', {
        class: 'btn btn-primary btn-large',
        type: 'button',
        disabled: !deck || state.busy,
        text: t('start.begin'),
        on: { click: onStart },
    });

    root.replaceChildren(
        h(
            'main',
            { class: 'page start' },
            h(
                'header',
                { class: 'brand' },
                h('h1', { text: t('app.title') }),
                h('p', { class: 'subtitle', text: t('app.tagline') }),
            ),
            listCard,
            directionCard,
            modeCard,
            h('div', { class: 'start-bar' }, startButton),
        ),
    );

    bindKeys(deck && !state.busy ? { Enter: onStart } : {});
}
