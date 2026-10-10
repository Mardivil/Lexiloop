import { htmlLang, language } from '../data/languages.js';
import { t } from '../i18n/index.js';

/**
 * Creates an element.
 *
 * `props` keys: `class`, `text`, `lang` (a language code), `dataset` (object), `on` (object of event handlers),
 * `attrs` (object of attributes); any other key is assigned as a property (`type`, `disabled`).
 * `null`, `undefined` and `false` children are skipped, strings become text nodes.
 *
 * @param {string} tag
 * @param {Record<string, any>} [props]
 * @param {...(Node | string | null | undefined | false)} children
 * @returns {HTMLElement}
 */
export function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === null) {
            continue;
        }
        switch (key) {
            case 'class':
                element.className = value;
                break;
            case 'text':
                element.textContent = value;
                break;
            case 'lang':
                element.lang = htmlLang(value);
                break;
            case 'dataset':
                Object.assign(element.dataset, value);
                break;
            case 'on':
                for (const [event, handler] of Object.entries(value)) {
                    element.addEventListener(event, handler);
                }
                break;
            case 'attrs':
                for (const [name, attr] of Object.entries(value)) {
                    if (attr !== false && attr !== null && attr !== undefined) {
                        element.setAttribute(name, attr === true ? '' : String(attr));
                    }
                }
                break;
            default:
                element[key] = value;
        }
    }
    for (const child of children.flat()) {
        if (child === null || child === undefined || child === false) {
            continue;
        }
        element.append(child);
    }
    return element;
}

/**
 * Size class for a word shown large: long phrases get a smaller font so they fit on the card.
 * @param {string} text
 */
export function lengthClass(text) {
    if (text.length > 30) {
        return 'is-very-long';
    }
    return text.length > 12 ? 'is-long' : '';
}

/** Speaker button that reads `text` aloud, or null when that language cannot be spoken. */
export function speakButton(ctx, text, lang) {
    const { speechLang } = language(lang);
    if (!ctx.speech.canSpeak(speechLang)) {
        return null;
    }
    const button = h('button', {
        class: 'speak',
        type: 'button',
        attrs: { 'aria-label': t('speak'), title: t('speak') },
        on: {
            click: (event) => {
                event.stopPropagation();
                ctx.speech.speak(text, speechLang);
            },
        },
    });
    button.innerHTML = SPEAKER_ICON;
    return button;
}

const SPEAKER_ICON =
    '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke-width="1.5"/>' +
    '<path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
