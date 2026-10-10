/**
 * Text to speech through the Web Speech API.
 *
 * Voices load asynchronously: `getVoices()` is often empty until `voiceschanged` fires, and
 * Safari on iOS may never fire it while still speaking fine when only `lang` is set. A language
 * therefore counts as speakable when a matching voice is listed or when no voice list is
 * available at all.
 */
export function createSpeech(synth = globalThis.speechSynthesis) {
    const supported = Boolean(synth && globalThis.SpeechSynthesisUtterance);
    let voices = [];

    function refresh() {
        try {
            voices = synth.getVoices() ?? [];
        } catch {
            voices = [];
        }
    }

    if (supported) {
        refresh();
        synth.addEventListener?.('voiceschanged', refresh);
    }

    /** Prefers an exact tag match, then any voice of the language; local voices before network ones. */
    function voiceFor(lang) {
        const base = lang.split('-')[0].toLowerCase();
        const candidates = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(base));
        const rank = (v) =>
            (v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase() ? 0 : 2) +
            (v.localService ? 0 : 1);
        return candidates.sort((a, b) => rank(a) - rank(b))[0] ?? null;
    }

    return {
        /** @param {string} lang BCP 47 tag, or '' for text that is never spoken. */
        canSpeak(lang) {
            if (!supported || !lang) {
                return false;
            }
            return voices.length === 0 || voiceFor(lang) !== null;
        },

        /**
         * Speaks `text`, cutting off anything still being spoken.
         * @param {string} text
         * @param {string} lang
         */
        speak(text, lang) {
            if (!this.canSpeak(lang)) {
                return;
            }
            try {
                synth.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = lang;
                const voice = voiceFor(lang);
                if (voice) {
                    utterance.voice = voice;
                }
                utterance.rate = 0.9;
                synth.speak(utterance);
            } catch {
                // Speech is an aid. A failure must never interrupt studying.
            }
        },

        cancel() {
            try {
                synth?.cancel();
            } catch {
                // See speak().
            }
        },
    };
}
