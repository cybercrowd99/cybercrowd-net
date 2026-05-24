// DEBUG EMAIL ENDPOINT — CLEANED OF RESEND REFERENCES

export default {
    async fetch(request, env) {
        return new Response(
            JSON.stringify({
                status: "ok",
                message: "Debug email placeholder — Resend removed."
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
};
