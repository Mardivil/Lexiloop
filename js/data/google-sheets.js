import { ImportError, ImportErrorCode } from './importer.js';

/**
 * The id of a Google Sheets spreadsheet named by a link, or null when the text is not such a link.
 * Accepts the forms the Share dialog and the browser's address bar produce, such as
 * `.../spreadsheets/d/<id>/edit?usp=sharing`, `.../spreadsheets/u/0/d/<id>/edit#gid=0` and
 * `.../d/<id>/htmlview`.
 * @param {string} text
 */
export function googleSheetId(text) {
    const match = /^https:\/\/docs\.google\.com\/spreadsheets\/(?:u\/\d+\/)?d\/([\w-]{20,})(?:[/?#]|$)/u.exec(
        text.trim(),
    );
    return match ? match[1] : null;
}

/**
 * Downloads a spreadsheet shared as "Anyone with the link can view", as .xlsx bytes.
 *
 * A spreadsheet that is not shared, deleted or never existed answers with an error status, or with
 * a redirect to the sign-in page that the browser reports as a network failure. Both are reported
 * as missing access unless the device is offline.
 *
 * @param {string} link
 * @param {{ fetch?: typeof fetch, isOnline?: () => boolean }} [env] Stand-ins for tests.
 * @returns {Promise<ArrayBuffer>}
 * @throws {ImportError}
 */
export async function downloadGoogleSheet(link, env = {}) {
    const fetchImpl = env.fetch ?? globalThis.fetch.bind(globalThis);
    const isOnline = env.isOnline ?? (() => globalThis.navigator?.onLine !== false);

    const id = googleSheetId(link);
    if (!id) {
        throw new ImportError(ImportErrorCode.BadLink);
    }

    let response;
    try {
        // The whole spreadsheet as an .xlsx file. Google answers it with CORS headers.
        response = await fetchImpl(`https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`, { cache: 'no-store', credentials: 'omit' });
    } catch (error) {
        throw new ImportError(isOnline() ? ImportErrorCode.NoAccess : ImportErrorCode.Network, error);
    }
    if (!response.ok) {
        throw new ImportError(ImportErrorCode.NoAccess);
    }
    try {
        return await response.arrayBuffer();
    } catch (error) {
        throw new ImportError(ImportErrorCode.Network, error);
    }
}
