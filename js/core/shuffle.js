/**
 * Returns a new array with the items of `items` in uniformly random order (Fisher-Yates).
 * @param {readonly T[]} items
 * @param {() => number} [rng] Returns a float in [0, 1), like Math.random.
 * @returns {T[]}
 * @template T
 */
export function shuffled(items, rng = Math.random) {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Returns a random integer in [min, max], both ends included.
 * @param {number} min
 * @param {number} max
 * @param {() => number} [rng]
 */
export function randomInt(min, max, rng = Math.random) {
    return min + Math.floor(rng() * (max - min + 1));
}
