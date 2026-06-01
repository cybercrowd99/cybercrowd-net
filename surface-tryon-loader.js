export const TryOnLoader = {
    init: async function () {
        console.log("[TryOnLoader] Initializing TryOn Surface…");

        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" }
        }).catch(err => {
            console.error("[TryOnLoader] Camera access denied:", err);
            throw new Error("Camera permission required for TryOn surface.");
        });

        // Attach stream to video element
        const video = document.getElementById("tryon-video");
        if (!video) {
            throw new Error("[TryOnLoader] Missing #tryon-video element.");
        }
        video.srcObject = stream;
        await video.play();

        // WDIG handshake placeholder
        console.log("[TryOnLoader] WDIG session initializing…");
        const wdigSession = {
            camera: true,
            continuity: true,
            device: "unknown"
        };

        // Prepare render environment
        const canvas = document.getElementById("tryon-canvas");
        const ctx = canvas.getContext("2d");

        console.log("[TryOnLoader] Render environment ready.");

        // Hand off to kernel
        window.TryOnKernel.ready({
            video,
            canvas,
            ctx,
            wdigSession
        });
    }
};
