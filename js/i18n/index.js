import dictionary from './uk.js';

const LOCALE = 'uk';
const pluralRules = new Intl.PluralRules(LOCALE);

export function currentLocale() {
    return LOCALE;
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
