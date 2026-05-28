export class DecoyDashboardGenerator {
    constructor(env) {
        this.env = env;
    }

    async generate(sessionId) {
        return {
            session: sessionId,
            timestamp: Date.now(),
            widgets: [
                { id: "sys-load", value: this.fakeLoad() },
                { id: "auth-attempts", value: this.fakeAttempts() },
                { id: "net-traffic", value: this.fakeTraffic() }
            ]
        };
    }

    fakeLoad() {
        return Math.floor(Math.random() * 100);
    }

    fakeAttempts() {
        return Math.floor(Math.random() * 20);
    }

    fakeTraffic() {
        return Math.floor(Math.random() * 5000);
    }
}
