// EMAIL FUNCTION — CLEANED OF RESEND REFERENCES

export default {
    async fetch(request, env) {
        return new Response(
            JSON.stringify({
                status: "ok",
                message: "Email function placeholder — Resend removed."
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
};
