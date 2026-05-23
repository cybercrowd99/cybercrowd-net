// LEGACY VERIFY ENDPOINT — CLEANED OF RESEND REFERENCES

export default {
    async fetch(request, env) {
        return new Response(
            JSON.stringify({
                status: "ok",
                message: "Legacy verification placeholder — Resend removed."
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
};
