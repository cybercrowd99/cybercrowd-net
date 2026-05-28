export class HostileSessionAnalytics {
    constructor(env) {
        this.env = env;
    }

    async aggregate() {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT session_id, attributes
                 FROM hostile_catalog
                 ORDER BY ts ASC`
            )
            .all();

        const entries = (rows?.results || []).map(r => ({
            session_id: r.session_id,
            attributes: JSON.parse(r.attributes || "{}")
        }));

        const stats = {
            count: entries.length,
            riskScores: [],
            escalationLevels: {},
            containmentEvents: 0
        };

        for (const e of entries) {
            if (typeof e.attributes.risk === "number") {
                stats.riskScores.push(e.attributes.risk);
            }

            if (e.attributes.escalation) {
                const lvl = e.attributes.escalation;
                stats.escalationLevels[lvl] =
                    (stats.escalationLevels[lvl] || 0) + 1;
            }

            if (e.attributes.contained === true) {
                stats.containmentEvents++;
            }
        }

        return stats;
    }

    async clusterBy(attribute) {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT session_id, attributes
                 FROM hostile_catalog
                 ORDER BY ts ASC`
            )
            .all();

        const clusters = {};

        for (const r of rows?.results || []) {
            const attrs = JSON.parse(r.attributes || "{}");
            const key = attrs[attribute] ?? "undefined";

            if (!clusters[key]) clusters[key] = [];
            clusters[key].push(r.session_id);
        }

        return clusters;
    }

    async findRecurring(patternKey, patternValue) {
        const rows = await this.env.CAPTURE_NET_DB
            ?.prepare(
                `SELECT session_id, attributes
                 FROM hostile_catalog`
            )
            .all();

        return (rows?.results || [])
            .map(r => ({
                session_id: r.session_id,
                attributes: JSON.parse(r.attributes || "{}")
            }))
            .filter(e => e.attributes?.[patternKey] === patternValue)
            .map(e => e.session_id);
    }
}
