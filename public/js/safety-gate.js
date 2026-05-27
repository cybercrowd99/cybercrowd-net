// Global Safety Gate System
// Usage example:
//   const ok = await SafetyGate.confirm({
//     title: "Logout",
//     message: "Are you sure you want to log out?",
//     risk: "medium"
//   });
//   if (ok) { /* perform action */ }

const SafetyGate = (() => {
  let overlay, box, titleEl, messageEl, previewEl, confirmBtn, cancelBtn;

  function ensureElements() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.id = "safetyGateOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.style.display = "none";
    overlay.style.zIndex = "99999";

    box = document.createElement("div");
    box.style.background = "#222";
    box.style.color = "#fff";
    box.style.padding = "20px";
    box.style.width = "320px";
    box.style.margin = "20% auto";
    box.style.borderRadius = "8px";
    box.style.textAlign = "center";
    box.style.boxShadow = "0 0 10px rgba(0,0,0,0.8)";

    titleEl = document.createElement("h3");
    titleEl.style.marginTop = "0";

    messageEl = document.createElement("p");

    previewEl = document.createElement("div");
    previewEl.style.margin = "10px 0";

    confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Yes, continue";
    confirmBtn.style.margin = "10px";
    confirmBtn.style.padding = "10px 16px";
    confirmBtn.style.border = "none";
    confirmBtn.style.cursor = "pointer";

    cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.margin = "10px";
    cancelBtn.style.padding = "10px 16px";
    cancelBtn.style.border = "none";
    cancelBtn.style.cursor = "pointer";
    cancelBtn.style.background = "#444";
    cancelBtn.style.color = "#fff";

    box.appendChild(titleEl);
    box.appendChild(messageEl);
    box.appendChild(previewEl);
    box.appendChild(confirmBtn);
    box.appendChild(cancelBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  function setRiskStyle(risk) {
    let color = "#d33";
    if (risk === "low") color = "#2d8f2d";
    if (risk === "medium") color = "#e6a500";
    confirmBtn.style.background = color;
    confirmBtn.style.color = "#fff";
  }

  function buildPreview(preview) {
    previewEl.innerHTML = "";
    if (!preview) return;

    if (preview.text) {
      const p = document.createElement("p");
      p.textContent = preview.text;
      p.style.fontSize = "13px";
      p.style.opacity = "0.9";
      previewEl.appendChild(p);
    }

    if (preview.imageUrl) {
      const img = document.createElement("img");
      img.src = preview.imageUrl;
      img.style.maxWidth = "100%";
      img.style.maxHeight = "160px";
      img.style.display = "block";
      img.style.margin = "8px auto";
      previewEl.appendChild(img);
    }
  }

  function confirm(options = {}) {
    ensureElements();

    const {
      title = "Are you sure?",
      message = "This action cannot be undone.",
      risk = "high", // low | medium | high
      preview = null
    } = options;

    titleEl.textContent = title;
    messageEl.textContent = message;
    setRiskStyle(risk);
    buildPreview(preview);

    overlay.style.display = "block";

    return new Promise((resolve) => {
      const onConfirm = () => {
        cleanup();
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };

      function cleanup() {
        overlay.style.display = "none";
        confirmBtn.removeEventListener("click", onConfirm);
        cancelBtn.removeEventListener("click", onCancel);
        overlay.removeEventListener("click", outsideClick);
      }

      function outsideClick(e) {
        if (e.target === overlay) {
          onCancel();
        }
      }

      confirmBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);
      overlay.addEventListener("click", outsideClick);
    });
  }

  return { confirm };
})();

window.SafetyGate = SafetyGate;
