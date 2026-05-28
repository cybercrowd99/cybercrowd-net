export class EntropyTrap {
    constructor(env) {
        this.env = env;
    }

    async absorb(sessionId, payload) {
        await this.env.CAPTURE_NET_DB
            ?.prepare(
                `INSERT INTO entropy_sink (session_id, ts, entropy, raw)
                 VALUES (?1, ?2, ?3, ?4)`
            )
            .bind(
                sessionId,
                Date.now(),
                this.calculateEntropy(JSON.stringify(payload || {})),
                JSON.stringify(payload || {})
            )
            .run();
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

    async dump(sessionId) {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT ts, entropy, raw
                 FROM entropy_sink
                 WHERE session_id = ?1
                 ORDER BY ts ASC`
            )
            .bind(sessionId)
            .all();

        return rows?.results || [];
    }
}
