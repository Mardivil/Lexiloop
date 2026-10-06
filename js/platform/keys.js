/**
 * Keyboard shortcuts bound by physical key (`KeyboardEvent.code`), so they work the same on a
 * Latin and a Cyrillic layout. One set of bindings is active at a time: each screen binds its
 * own and the previous set is dropped.
 */

/** Codes that trigger the same action as the key in the map. */
const ALIASES = {
    Numpad1: 'Digit1',
    Numpad2: 'Digit2',
    Numpad3: 'Digit3',
    Numpad4: 'Digit4',
    NumpadEnter: 'Enter',
};

let bindings = {};

function isTyping(target) {
    return (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    );
}

/** Space and Enter on a focused button keep their usual meaning: they press that button. */
function activatesFocusedControl(event, code) {
    return (
        (code === 'Space' || code === 'Enter') &&
        event.target instanceof HTMLElement &&
        event.target.closest('button, a[href], summary, label')
    );
}

document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.repeat || isTyping(event.target)) {
        return;
    }
    const code = ALIASES[event.code] ?? event.code;
    const handler = bindings[code];
    if (!handler || activatesFocusedControl(event, code)) {
        return;
    }
    // Stops Space from scrolling the page.
    event.preventDefault();
    handler(event);
});

/**
 * Replaces the active bindings.
 * @param {Record<string, (event: KeyboardEvent) => void>} map Handlers keyed by `KeyboardEvent.code`.
 */
export function bindKeys(map) {
    bindings = { ...map };
}
