import choice from './choice.js';
import flashcards from './flashcards.js';
import matching from './matching.js';

/**
 * @typedef {object} StudyMode
 * @property {string} id
 * @property {string} titleKey  Interface string key of the mode's name.
 * @property {string} hintKey   Interface string key of its one-line description.
 * @property {(root: HTMLElement, ctx: import('../screens/session.js').ModeContext)
 *            => { unmount(): void }} mount
 */

/** Study modes in the order the start screen lists them. @type {StudyMode[]} */
export const MODES = [flashcards, choice, matching];

/** @param {string} id */
export function modeById(id) {
    return MODES.find((mode) => mode.id === id) ?? MODES[0];
}
