/**
 * Collapses runs of whitespace into single spaces and trims the ends.
 * @param {string} text
 */
export function collapseSpaces(text) {
    return text.replace(/\s+/gu, ' ').trim();
}

/**
 * 32-bit FNV-1a hash of a string's UTF-16 code units, as 8 hex digits. Not cryptographic: used
 * only to give word list entries ids that stay the same across imports of the same file.
 * @param {string} text
 */
export function fnv1a(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}
