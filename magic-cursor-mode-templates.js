// magic-cursor-mode-templates.js
// CyberCrowd Magic Cursor — Mode Template Core
// Owns: reusable mode/job templates that assign surfaces,
// permissions, controls, and operator-ready layouts.
// Does not transport events, move OS cursor, pair devices, or control cameras/drone directly.

const MagicCursorModeTemplates = (() => {
  const templates = {
    walkaround: {
      template_id: "walkaround",
      name: "Walkaround",
      description: "Two camera surfaces and one drone surface for mobile inspection or guided walkthrough.",
      required_membership: true,
      surfaces: [
        { role: "operator", type: "laptop", name: "Operator Surface", required: true },
        { role: "camera_primary", type: "phone", name: "Primary Camera Surface", required: true },
        { role: "camera_secondary", type: "phone", name: "Secondary Camera Surface", required: true },
        { role: "drone_observer", type: "drone", name: "Drone Observer Surface", required: false }
      ],
      permissions: [
        "surface_view",
        "surface_assign",
        "cursor_authority_transfer",
        "camera_view",
        "drone_observe"
      ],
      controls: [
        "switch_camera",
        "request_focus",
        "mark_attention",
        "freeze_session",
        "return_authority"
      ],
      privacy_rules: [
        "session_visibility_only",
        "no_public_release_without_approval"
      ]
    },

    dj: {
      template_id: "dj",
      name: "DJ / Live Room",
      description: "Multi-camera live-room mode for music, performance, crowd view, and operator switching.",
      required_membership: true,
      surfaces: [
        { role: "operator", type: "laptop", name: "DJ Operator Surface", required: true },
        { role: "room_camera", type: "phone", name: "Room Camera Surface", required: true },
        { role: "crowd_camera", type: "phone", name: "Crowd Camera Surface", required: false },
        { role: "deck_camera", type: "phone", name: "Deck Camera Surface", required: false },
        { role: "broadcast_display", type: "monitor", name: "Broadcast Display Surface", required: false }
      ],
      permissions: [
        "surface_view",
        "surface_assign",
        "cursor_authority_transfer",
        "camera_view",
        "broadcast_view",
        "audio_control_placeholder"
      ],
      controls: [
        "switch_camera",
        "highlight_surface",
        "mark_attention",
        "freeze_session",
        "return_authority"
      ],
      privacy_rules: [
        "performer_control_required",
        "viewer_access_must_be_scoped"
      ]
    },

    car_detail: {
      template_id: "car_detail",
      name: "Car Detail",
      description: "Car-only service mode with license plate privacy and limited camera scope.",
      required_membership: true,
      surfaces: [
        { role: "operator", type: "laptop", name: "Service Operator Surface", required: true },
        { role: "vehicle_camera", type: "phone", name: "Vehicle Camera Surface", required: true }
      ],
      permissions: [
        "surface_view",
        "surface_assign",
        "cursor_authority_transfer",
        "camera_view",
        "privacy_mask_placeholder"
      ],
      controls: [
        "mark_before",
        "mark_after",
        "request_focus",
        "freeze_session",
        "return_authority"
      ],
      privacy_rules: [
        "license_plate_must_be_covered",
        "camera_scope_vehicle_only",
        "no_house_or_neighbor_capture"
      ]
    },

    janet: {
      template_id: "janet",
      name: "Janet Attention / Panic",
      description: "Assigned attention surface for a worker who needs fast routing to the correct responder.",
      required_membership: true,
      surfaces: [
        { role: "worker_attention", type: "phone", name: "Worker Attention Surface", required: true },
        { role: "manager_observer", type: "laptop", name: "Manager Observer Surface", required: true },
        { role: "specialist_route", type: "dashboard", name: "Specialist Routing Surface", required: false }
      ],
      permissions: [
        "attention_event",
        "manager_notify",
        "specialist_route",
        "heartbeat_required",
        "replay_required"
      ],
      controls: [
        "panic",
        "mark_attention",
        "route_inventory_specialist",
        "route_safety",
        "freeze_session"
      ],
      privacy_rules: [
        "attention_event_not_public",
        "manager_scope_only",
        "replay_for_review_only"
      ]
    },

    ian: {
      template_id: "ian",
      name: "Ian Assigned Surface",
      description: "Family-safe assigned surface mode for approved child audio, video, and attention moments.",
      required_membership: true,
      surfaces: [
        { role: "guardian_operator", type: "laptop", name: "Guardian Operator Surface", required: true },
        { role: "child_surface", type: "phone", name: "Child Assigned Surface", required: true }
      ],
      permissions: [
        "guardian_route",
        "approved_audio",
        "approved_video",
        "surface_view",
        "freeze_session"
      ],
      controls: [
        "play_approved_audio",
        "send_attention_cue",
        "pause_surface",
        "freeze_session"
      ],
      privacy_rules: [
        "guardian_authority_required",
        "child_surface_private",
        "no_public_release"
      ]
    }
  };

  let activeTemplate = null;

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function requireTemplate(templateId) {
    if (!templateId || !templates[templateId]) {
      throw new Error("Unknown Magic Cursor mode template.");
    }

    return templates[templateId];
  }

  function listTemplates() {
    return clone(Object.values(templates));
  }

  function getTemplate(templateId) {
    return clone(requireTemplate(templateId));
  }

  function chooseTemplate(templateId, { sessionId = null, operatorId = null } = {}) {
    const template = requireTemplate(templateId);

    activeTemplate = {
      ...clone(template),
      session_id: sessionId,
      operator_id: operatorId,
      chosen_at: now(),
      status: "chosen"
    };

    return clone(activeTemplate);
  }

  function buildAssignments(templateId, { sessionId = null, operatorId = null } = {}) {
    const template = requireTemplate(templateId);

    return clone({
      template_id: template.template_id,
      name: template.name,
      session_id: sessionId,
      operator_id: operatorId,
      generated_at: now(),
      assignments: template.surfaces.map((surface, index) => ({
        assignment_id: `${template.template_id}.surface.${index + 1}`,
        session_id: sessionId,
        operator_id: operatorId,
        role: surface.role,
        type: surface.type,
        name: surface.name,
        required: surface.required,
        status: "pending_surface"
      })),
      permissions: template.permissions,
      controls: template.controls,
      privacy_rules: template.privacy_rules
    });
  }

  function getActiveTemplate() {
    return activeTemplate ? clone(activeTemplate) : null;
  }

  function clearActive(reason = "manual_clear") {
    const previous = activeTemplate;
    activeTemplate = null;

    return {
      cleared: Boolean(previous),
      previous_template_id: previous ? previous.template_id : null,
      reason,
      timestamp: now()
    };
  }

  return {
    listTemplates,
    getTemplate,
    chooseTemplate,
    buildAssignments,
    getActiveTemplate,
    clearActive
  };
})();

if (typeof window !== "undefined") {
  window.MagicCursorModeTemplates = MagicCursorModeTemplates;
}

export default MagicCursorModeTemplates;
