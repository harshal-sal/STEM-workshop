/**
 * LLM Bridge Component
 * Handles request streaming, history rolling buffer, and spoken fallback on failure.
 */
export class LLMBridge {
    constructor(config = {}) {
        this.endpoint = config.endpoint || '/api/chat';
        this.history = [];
        this.maxHistory = 6;
        this.currentAbortController = null;
    }

    async ask({ transcript, siteId, year, focusedHotspot, manifest }) {
        // Abort in-flight request if user initiates a new query
        if (this.currentAbortController) {
            this.currentAbortController.abort();
        }

        this.currentAbortController = new AbortController();

        // Build system context
        const systemPrompt = `You are a heritage guide persona: ${manifest.guide.persona}. ` +
            `Location: ${manifest.name}. Current Era Year: ${year}. ` +
            `Say you don't know rather than invent dates or names. Keep responses under 50 words.`;

        const payload = {
            system: systemPrompt,
            transcript: transcript,
            contextHotspot: focusedHotspot,
            history: this.history.slice(-this.maxHistory)
        };

        try {
            // Attempt request with timeout
            const timeoutId = setTimeout(() => this.currentAbortController.abort(), 8000);
            
            // Stubbed network call for prototype demonstration
            const responseText = await this.mockNetworkStream(payload, this.currentAbortController.signal);
            clearTimeout(timeoutId);

            // Update rolling history
            this.history.push({ role: 'user', content: transcript });
            this.history.push({ role: 'assistant', content: responseText });

            return responseText;
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log("LLM request aborted.");
                return null;
            }
            console.warn("LLM bridge error or timeout. Using spoken fallback line.", err);
            return "Forgive me, the echoes of time are unclear right now. Please ask me again.";
        }
    }

    mockNetworkStream(payload, signal) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                if (signal.aborted) {
                    reject(new DOMException('Aborted', 'AbortError'));
                } else {
                    resolve("The Basilica of Bom Jesus holds rich history from the 16th century in Goa.");
                }
            }, 1000);

            signal.addEventListener('abort', () => {
                clearTimeout(timer);
                reject(new DOMException('Aborted', 'AbortError'));
            });
        });
    }
}
