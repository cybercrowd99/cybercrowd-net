let activeDrag = null;

export function enableDashboardDrag(dashboardEl, onStop) {
    const handle = dashboardEl.querySelector(".header") || dashboardEl;

    handle.style.cursor = "move";

    handle.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;

        const rect = dashboardEl.getBoundingClientRect();

        activeDrag = {
            startX: e.clientX,
            startY: e.clientY,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top
        };

        dashboardEl.style.position = "fixed";
        dashboardEl.style.top = rect.top + "px";
        dashboardEl.style.left = rect.left + "px";
        dashboardEl.style.right = "auto";
        dashboardEl.style.bottom = "auto";

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);

        e.preventDefault();
    });

    function onMove(e) {
        if (!activeDrag) return;

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const rect = dashboardEl.getBoundingClientRect();

        let left = e.clientX - activeDrag.offsetX;
        let top = e.clientY - activeDrag.offsetY;

        left = Math.max(0, Math.min(left, vw - rect.width));
        top = Math.max(0, Math.min(top, vh - rect.height));

        dashboardEl.style.left = left + "px";
        dashboardEl.style.top = top + "px";
    }

    function onUp() {
        if (!activeDrag) return;
        activeDrag = null;

        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);

        if (typeof onStop === "function") {
            onStop();
        }

        const evt = new CustomEvent("dashboard:drag-stop");
        dashboardEl.dispatchEvent(evt);
    }
}
