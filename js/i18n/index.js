import uk from './uk.js';

/** Interface strings per UI language. Only Ukrainian exists for now. */
const DICTIONARIES = { uk };

let locale = 'uk';
let dictionary = DICTIONARIES[locale];
let pluralRules = new Intl.PluralRules(locale);

/** @param {string} code */
export function setLocale(code) {
    if (!DICTIONARIES[code]) {
        throw new Error(`No interface strings for: ${code}`);
    }
    locale = code;
    dictionary = DICTIONARIES[code];
    pluralRules = new Intl.PluralRules(code);
}

export function currentLocale() {
    return locale;
}

/**
 * Returns the interface string for `key` with `{name}` placeholders replaced from `params`.
 * A string given as an object of plural forms (one, few, many, other) is chosen by `params.count`.
 *
 * @param {string} key
 * @param {Record<string, string | number>} [params]
 */
export function t(key, params = {}) {
    let value = dictionary[key];
    if (value === undefined) {
        return key;
    }
    if (typeof value === 'object') {
        const form = pluralRules.select(Number(params.count ?? 0));
        value = value[form] ?? value.other;
    }
    return value.replace(/\{(\w+)\}/gu, (match, name) =>
        name in params ? String(params[name]) : match,
    );
}
