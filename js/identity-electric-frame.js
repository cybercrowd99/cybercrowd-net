(() => {
  const room = document.getElementById("setupRoom");
  const password = document.getElementById("passwordInput");
  const confirm = document.getElementById("verifyInput");
  const activate = document.getElementById("activateButton");

  if (!room || !password || !confirm || !activate) return;

  const canvas = document.createElement("canvas");
  canvas.id = "identityElectricFrame";
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "14";
  canvas.style.pointerEvents = "none";

  room.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  let armed = false;
  let fired = false;

  function size() {
    canvas.width = room.clientWidth;
    canvas.height = room.clientHeight;
    draw();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function drawLineProgress(x1, y1, x2, y2, amount) {
    const p = clamp(amount, 0, 1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p);
    ctx.stroke();
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const p = password.value.length;
    const c = confirm.value.length;
    const total = clamp(p + c, 0, 38);
    const charge = total / 38;

    const match = password.value.length >= 8 && password.value === confirm.value;
    armed = match;

    const left = w * 0.18;
    const right = w * 0.82;
    const top = h * 0.18;
    const bottom = h * 0.86;

    ctx.lineWidth = fired ? 5 : 3;
    ctx.strokeStyle = match
      ? "rgba(118,255,168,0.95)"
      : "rgba(105,245,255,0.86)";
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = fired ? 32 : 14;

    drawLineProgress(left, top, right, top, charge);
    drawLineProgress(right, top, right, bottom, charge);
    drawLineProgress(right, bottom, left, bottom, charge);
    drawLineProgress(left, bottom, left, top, charge);

    ctx.font = `${Math.max(14, w * 0.022)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.shadowBlur = 16;

    ctx.fillText("CYBERCROWD", w / 2, top);
    ctx.fillText(armed ? "ACTIVATE READY" : "ACTIVATE", w / 2, bottom);

    ctx.shadowBlur = 0;
  }

  function update() {
    fired = false;
    draw();
  }

  password.addEventListener("input", update);
  confirm.addEventListener("input", update);

  activate.addEventListener("click", () => {
    if (!armed) return;
    fired = true;
    draw();
  });

  window.addEventListener("resize", size);
  size();
})();
