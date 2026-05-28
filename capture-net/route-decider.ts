export class RouteDecider {
    constructor(env) {
        this.env = env;
    }

    async decide(sessionId, signal) {
        const entropy = this.calculateEntropy(JSON.stringify(signal || {}));
        const suspicious =
            entropy > 4.5 ||
            (signal?.attempts && signal.attempts > 5) ||
            (signal?.flags && signal.flags.includes("bruteforce"));

        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO routing_log (session_id, ts, entropy, suspicious)
                 VALUES (?1, ?2, ?3, ?4)`
            )
            .bind(sessionId, Date.now(), entropy, suspicious ? 1 : 0)
            .run();

        return suspicious ? "decoy" : "block";
    }

    calculateEntropy(str) {
        const freq = {};
        for (const c of str) freq[c] = (freq[c] || 0) + 1;

        const len = str.length;
        let entropy = 0;

        for (const c in freq) {
            const p = freq[c] / len;
            entropy -= p * Math.log2(p);
        }

        return entropy;
    }
}
