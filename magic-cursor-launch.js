// magic-cursor-launch.js
// CyberCrowd Magic Cursor — Launch Orchestrator
// Owns: the one-stop launch chain.
// Compliance → Pairing / cable bond → Mode template → Assigned surfaces → Heartbeat → Transport → Replay.
// Does not move OS cursor, access clipboard, control cameras, or bypass membership/update gates.

const MagicCursorLaunch = (() => {
  const STEP_IDLE = "idle";
  const STEP_COMPLIANCE = "compliance";
  const STEP_PAIRING = "pairing";
  const STEP_MODE = "mode";
  const STEP_SURFACES = "surfaces";
  const STEP_HEARTBEAT = "heartbeat";
  const STEP_TRANSPORT = "transport";
  const STEP_READY = "ready";
  const STEP_BLOCKED = "blocked";

  let launch = {
    launch_id: null,
    step: STEP_IDLE,
    status: "not_started",
    selected_mode: null,
    session_id: null,
    operator_id: null,
    device_id: null,
    surface_ids: [],
    created_at: null,
    updated_at: null,
    messages: []
  };

  function now() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function log(message, detail = {}) {
    launch.messages.push({
      timestamp: now(),
      message,
      detail
    });
  }

  function start({
    operatorId = "operator.demo",
    sessionId = makeId("mcSession"),
    deviceId = makeId("mcDevice")
  } = {}) {
    launch = {
      launch_id: makeId("mcLaunch"),
      step: STEP_COMPLIANCE,
      status: "started",
      selected_mode: null,
      session_id: sessionId,
      operator_id: operatorId,
      device_id: deviceId,
      surface_ids: [],
      created_at: now(),
      updated_at: now(),
      messages: []
    };

    log("Magic Cursor launch started.", {
      operatorId,
      sessionId,
      deviceId
    });

    return clone(launch);
  }

  function applyCompliance(report) {
    if (!launch.launch_id) {
      throw new Error("Launch has not started.");
    }

    launch.step = STEP_COMPLIANCE;
    launch.updated_at = now();

    if (!report || report.status === "blocked") {
      launch.status = "blocked";
      launch.step = STEP_BLOCKED;
      log("Compliance blocked Magic Cursor launch.", { report });
      return clone(launch);
    }

    launch.status = report.status === "limited" ? "limited" : "compliance_passed";
    launch.step = STEP_PAIRING;

    log("Compliance passed or limited. Pairing may continue.", { report });

    return clone(launch);
  }

  function applyPairing(pairingRecord) {
    if (!launch.launch_id) {
      throw new Error("Launch has not started.");
    }

    launch.step = STEP_PAIRING;
    launch.updated_at = now();

    if (!pairingRecord || pairingRecord.status !== "bonded") {
      launch.status = "blocked";
      launch.step = STEP_BLOCKED;
      log("Pairing blocked. Physical cable bond is required.", { pairingRecord });
      return clone(launch);
    }

    launch.device_id = pairingRecord.device_id;
    launch.status = "pairing_bonded";
    launch.step = STEP_MODE;

    log("Device physically bonded. Mode selection may continue.", { pairingRecord });

    return clone(launch);
  }

  function chooseMode(templateId) {
    if (!launch.launch_id) {
      throw new Error("Launch has not started.");
    }

    if (!templateId) {
      throw new Error("templateId is required.");
    }

    launch.selected_mode = templateId;
    launch.status = "mode_selected";
    launch.step = STEP_SURFACES;
    launch.updated_at = now();

    log("Magic Cursor mode selected.", { templateId });

    return clone(launch);
  }

  function applySurfaceAssignments(assignments = []) {
    if (!launch.launch_id) {
      throw new Error("Launch has not started.");
    }

    if (!Array.isArray(assignments)) {
      throw new Error("assignments must be an array.");
    }

    launch.surface_ids = assignments
      .map((item) => item.surface_id || item.assignment_id)
      .filter(Boolean);

    launch.status = "surfaces_assigned";
    launch.step = STEP_HEARTBEAT;
    launch.updated_at = now();

    log("Assigned surfaces loaded.", {
      surface_ids: launch.surface_ids,
      assignments
    });

    return clone(launch);
  }

  function applyHeartbeatResults(results = []) {
    if (!launch.launch_id) {
      throw new Error("Launch has not started.");
    }

    if (!Array.isArray(results)) {
      throw new Error("heartbeat results must be an array.");
    }

    const blocked = results.some((item) => item.allowed_to_move === false);

    launch.step = STEP_HEARTBEAT;
    launch.updated_at = now();

    if (blocked) {
      launch.status = "blocked";
      launch.step = STEP_BLOCKED;
      log("Heartbeat blocked launch because one or more assigned surfaces are not alive.", { results });
      return clone(launch);
    }

    launch.status = "heartbeat_alive";
    launch.step = STEP_TRANSPORT;

    log("Heartbeat verified assigned surface presence.", { results });

    return clone(launch);
  }

  function applyTransportHandshake(messages = []) {
    if (!launch.launch_id) {
      throw new Error("Launch has not started.");
    }

    if (!Array.isArray(messages)) {
      throw new Error("transport messages must be an array.");
    }

    const hasHello = messages.some((item) => item.type === "transport_hello");
    const hasReady = messages.some((item) => item.type === "transport_ready");

    launch.step = STEP_TRANSPORT;
    launch.updated_at = now();

    if (!hasHello || !hasReady) {
      launch.status = "blocked";
      launch.step = STEP_BLOCKED;
      log("Transport handshake incomplete.", {
        hasHello,
        hasReady,
        messages
      });
      return clone(launch);
    }

    launch.status = "ready";
    launch.step = STEP_READY;

    log("Magic Cursor launch ready. Operator may work.", { messages });

    return clone(launch);
  }

  function getLaunch() {
    return clone(launch);
  }

  function reset(reason = "manual_reset") {
    const previous = clone(launch);

    launch = {
      launch_id: null,
      step: STEP_IDLE,
      status: "not_started",
      selected_mode: null,
      session_id: null,
      operator_id: null,
      device_id: null,
      surface_ids: [],
      created_at: null,
      updated_at: null,
      messages: []
    };

    return {
      reset: true,
      reason,
      previous,
      timestamp: now()
    };
  }

  return {
    start,
    applyCompliance,
    applyPairing,
    chooseMode,
    applySurfaceAssignments,
    applyHeartbeatResults,
    applyTransportHandshake,
    getLaunch,
    reset
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorLaunch = MagicCursorLaunch;
}

export default MagicCursorLaunch;
