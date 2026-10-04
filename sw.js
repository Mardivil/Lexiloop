// Service worker: lets the app start offline and be installed to the home screen.
//
// Files keep their names from release to release (there is no build step to hash them), so every
// request goes to the network first and the cache is only the fallback. A slow network falls back
// to the cache after NETWORK_TIMEOUT_MS, so a weak signal does not leave the page blank.

importScripts('precache.js');

const CACHE_PREFIX = 'lexiloop-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const NETWORK_TIMEOUT_MS = 3000;

/** Absolute URLs of the app's own files. Only these are cached, so the cache cannot grow. */
const APP_FILES = new Set(self.PRECACHE_URLS.map((url) => new URL(url, self.registration.scope).href));

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(self.PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }))))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
                        .map((name) => caches.delete(name)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

async function fromCache(request) {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) {
        return hit;
    }
    // Any navigation inside the app's scope is served by its single page.
    if (request.mode === 'navigate') {
        return cache.match('./');
    }
    return undefined;
}

/**
 * Copies a response with `Cache-Control: no-cache`. GitHub Pages sends `max-age=600`, and Chrome
 * reuses such a response from its memory cache on a reload without asking this worker, so one
 * module of the previous release could load beside the others of the new one. The copy is also
 * not marked as redirected, which a navigation request would reject.
 */
function withNoCache(response) {
    if (!response || response.type !== 'basic') {
        return response;
    }
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-cache');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function networkFirst(request) {
    // 'no-cache' revalidates with the server instead of trusting the HTTP cache. GitHub Pages
    // allows caching for 10 minutes, and modules taken from two different releases can break
    // each other's imports.
    const network = fetch(request.url, { cache: 'no-cache', credentials: 'same-origin' }).then(async (response) => {
        if (response.ok && response.type === 'basic' && APP_FILES.has(request.url.split(/[?#]/)[0])) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
        }
        return response;
    });
    // When the cache answers first, a later network failure has nobody waiting for it.
    network.catch(() => {});

    const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));
    try {
        const first = await Promise.race([network, timeout]);
        if (first) {
            return first;
        }
        // The network is slow: answer from the cache when it can, otherwise keep waiting.
        return (await fromCache(request)) ?? (await network);
    } catch (error) {
        const cached = await fromCache(request);
        if (cached) {
            return cached;
        }
        throw error;
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
        return;
    }
    // Navigations are answered by the app's page even when their URL carries a query.
    if (!APP_FILES.has(request.url.split(/[?#]/)[0]) && request.mode !== 'navigate') {
        return;
    }
    event.respondWith(networkFirst(request).then(withNoCache));
});
