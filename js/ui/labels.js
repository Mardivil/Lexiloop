import { Direction } from '../data/deck.js';
import { DEFAULT_IMPORT_PROFILE } from '../data/import-profiles.js';
import { t } from '../i18n/index.js';

/**
 * Name of one side of a word list: the studied language, or the translations. Translations are
 * always called by the generic name, whatever language the sheet holds.
 *
 * @param {import('../data/deck.js').Deck | null} deck
 * @param {'source' | 'target'} side
 */
export function sideLabel(deck, side) {
    const code = deck?.[`${side}Lang`] ?? DEFAULT_IMPORT_PROFILE[`${side}Lang`];
    return t(`lang.${code}`);
}

/**
 * "{from} -> {to}" for a study direction.
 * @param {import('../data/deck.js').Deck | null} deck
 * @param {string} direction One of `Direction`.
 */
export function directionLabel(deck, direction) {
    const [from, to] = direction === Direction.Forward ? ['source', 'target'] : ['target', 'source'];
    return t('start.direction.option', { from: sideLabel(deck, from), to: sideLabel(deck, to) });
}
