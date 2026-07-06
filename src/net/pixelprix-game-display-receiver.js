// src/net/pixelprix-game-display-receiver.js
// CyberCrowd NET — PixelPrix Game Display Receiver
// Department: CyberCare
// Room: CyberCade
// Game/App: PixelPrix
// Owns: receiving share-safe PixelPrix progress summaries and preparing
// CyberCade display cards for mode, score, time, items, routine,
// competition, parent approval, and no-chat/no-child-identity status.
// Rule: CyberCade displays the game. PixelPrix shows the chore result.
// Scores can move. Children cannot be exposed.
// Chat stays off. Parent approval stays on.
// Does not: expose child identity, publish kid names, show child faces,
// expose address/school/parent identity, store raw private room photos,
// create child chat, direct message, public child profile,
// shame children, punish children, replace parenting, sell child data,
// or make unsafe chores.

const PixelPrixGameDisplayReceiver = (() => {
  const receivedDisplays = [];

  const DISPLAY_STATES = [
    "progress_display",
    "completion_display",
    "competition_display",
    "routine_display",
    "reward_display",
    "parent_check_display",
    "blocked_display",
    "unknown",
  ];

  function now() {
    return new Date().toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId(prefix) {
    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }

  function requireObject(value, errorCode) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(errorCode);
    }

    return value;
  }

  function requireText(value, errorCode) {
    if (!value || typeof value !== "string" || !value.trim()) {
      throw new Error(errorCode);
    }

    return value.trim();
  }

  function normalizeText(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    return value.trim();
  }

  function normalizeBoolean(value) {
    return value === true;
  }

  function normalizeNumber(value, fallback = 0) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return number;
  }

  function normalizeList(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  function normalizeSafeReference(value) {
    const clean = normalizeText(value);

    if (!clean) {
      return "";
    }

    return clean
      .replace(/[<>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function sanitizeSafeText(value) {
    const clean = normalizeText(value);

    if (!clean) {
      return "";
    }

    return clean
      .replace(/\bpassword\b/gi, "credential")
      .replace(/\btoken\b/gi, "credential")
      .replace(/\bsecret\b/gi, "protected detail")
      .replace(/\bprivate proof\b/gi, "private verification")
      .replace(/\bidentity evidence\b/gi, "verification detail")
      .replace(/\bhome address\b/gi, "protected location detail")
      .replace(/\bphone number\b/gi, "protected contact detail")
      .replace(/\baddress\b/gi, "protected location detail")
      .replace(/\bschool\b/gi, "protected location detail")
      .replace(/\braw uIDL\b/gi, "protected uIDL")
      .replace(/\bfull uIDL\b/gi, "protected uIDL")
      .replace(/\bchild identity\b/gi, "protected child detail")
      .replace(/\bminor identity\b/gi, "protected child detail")
      .replace(/\bkid name\b/gi, "protected player detail")
      .replace(/\bchild name\b/gi, "protected player detail")
      .replace(/\bface photo\b/gi, "protected image detail")
      .replace(/\bprivate room\b/gi, "protected room detail")
      .replace(/\bparent identity\b/gi, "protected adult detail");
  }

  function normalizeMode(mode = {}) {
    if (!mode || typeof mode !== "object" || Array.isArray(mode)) {
      return {
        mode_id: "",
        display_name: "",
        item_min: 0,
        item_max: 0,
        age_band: "",
        reading_required: false,
        parent_guided: true,
        description: "",
      };
    }

    return {
      mode_id: normalizeSafeReference(mode.mode_id),
      display_name: sanitizeSafeText(mode.display_name),
      item_min: normalizeNumber(mode.item_min, 0),
      item_max: normalizeNumber(mode.item_max, 0),
      age_band: normalizeSafeReference(mode.age_band),
      reading_required: false,
      parent_guided: mode.parent_guided !== false,
      description: sanitizeSafeText(mode.description),
    };
  }

  function normalizeCompletion(completion = {}) {
    if (!completion || typeof completion !== "object" || Array.isArray(completion)) {
      return {
        completion_id: "",
        completed: false,
        completed_at: "",
        progress_state: "",
        chore_id: "",
        chore_label: "Room Reset",
        item_count: 0,
        items_completed: 0,
        completion_percent: 0,
        parent_checked: false,
        parent_approved: false,
        parent_attention_required: true,
        reward_ready: false,
        no_shame: true,
      };
    }

    return {
      completion_id: normalizeSafeReference(completion.completion_id),
      completed: normalizeBoolean(completion.completed),
      completed_at: normalizeText(completion.completed_at),
      progress_state: normalizeSafeReference(completion.progress_state),
      chore_id: normalizeSafeReference(completion.chore_id),
      chore_label: sanitizeSafeText(completion.chore_label) || "Room Reset",
      item_count: normalizeNumber(completion.item_count, 0),
      items_completed: normalizeNumber(completion.items_completed, 0),
      completion_percent: normalizeNumber(completion.completion_percent, 0),
      parent_checked: normalizeBoolean(completion.parent_checked),
      parent_approved: normalizeBoolean(completion.parent_approved),
      parent_attention_required: completion.parent_attention_required !== false,
      reward_ready: normalizeBoolean(completion.reward_ready),
      no_shame: completion.no_shame !== false,
    };
  }

  function normalizeScore(score = {}) {
    if (!score || typeof score !== "object" || Array.isArray(score)) {
      return {
        score_id: "",
        mode_id: "",
        mode_name: "",
        item_count: 0,
        items_completed: 0,
        completion_percent: 0,
        digital_seconds: 0,
        real_seconds: 0,
        beat_digital_time: false,
        best_time_seconds: 0,
        score_label: "",
        score_is_progress_not_child_worth: true,
      };
    }

    return {
      score_id: normalizeSafeReference(score.score_id),
      scored_at: normalizeText(score.scored_at),
      mode_id: normalizeSafeReference(score.mode_id),
      mode_name: sanitizeSafeText(score.mode_name),
      item_count: normalizeNumber(score.item_count, 0),
      items_completed: normalizeNumber(score.items_completed, 0),
      completion_percent: normalizeNumber(score.completion_percent, 0),
      digital_seconds: normalizeNumber(score.digital_seconds, 0),
      real_seconds: normalizeNumber(score.real_seconds, 0),
      beat_digital_time: normalizeBoolean(score.beat_digital_time),
      best_time_seconds: normalizeNumber(score.best_time_seconds, 0),
      score_label: sanitizeSafeText(score.score_label),
      score_is_progress_not_child_worth: score.score_is_progress_not_child_worth !== false,
    };
  }

  function normalizeRoutine(routine = {}) {
    if (!routine || typeof routine !== "object" || Array.isArray(routine)) {
      return {
        routine_id: "",
        routine_name: "",
        routine_state: "",
        progress_state: "",
        completion_id: "",
        completion_percent: 0,
        routine_shareable: false,
        routine_ping_allowed: false,
        parent_approval_required: true,
        chat_allowed: false,
        child_identity_allowed: false,
      };
    }

    return {
      routine_id: normalizeSafeReference(routine.routine_id),
      routine_name: sanitizeSafeText(routine.routine_name),
      routine_state: normalizeSafeReference(routine.routine_state),
      progress_state: normalizeSafeReference(routine.progress_state),
      completion_id: normalizeSafeReference(routine.completion_id),
      completion_percent: normalizeNumber(routine.completion_percent, 0),
      routine_shareable: normalizeBoolean(routine.routine_shareable),
      routine_ping_allowed: normalizeBoolean(routine.routine_ping_allowed),
      parent_approval_required: routine.parent_approval_required !== false,
      chat_allowed: false,
      child_identity_allowed: false,
    };
  }

  function normalizeCompetition(competition = {}) {
    if (!competition || typeof competition !== "object" || Array.isArray(competition)) {
      return {
        competition_id: "",
        competition_enabled: false,
        competition_type: "",
        competition_room: "CyberCade",
        game_name: "PixelPrix",
        mode_id: "",
        mode_name: "",
        anonymous_player_tag: "",
        challenge_label: "Beat the chore",
        winning_time_seconds: 0,
        item_count: 0,
        items_picked_up: 0,
        completion_percent: 0,
        can_compete: false,
        chat: "OFF",
        child_identity: "OFF",
        parent_approval: "ON",
      };
    }

    return {
      competition_id: normalizeSafeReference(competition.competition_id),
      competition_enabled: normalizeBoolean(competition.competition_enabled),
      competition_type: normalizeSafeReference(competition.competition_type),
      competition_room: "CyberCade",
      game_name: "PixelPrix",
      mode_id: normalizeSafeReference(competition.mode_id),
      mode_name: sanitizeSafeText(competition.mode_name),
      anonymous_player_tag: sanitizeSafeText(competition.anonymous_player_tag),
      challenge_label: sanitizeSafeText(competition.challenge_label) || "Beat the chore",
      winning_time_seconds: normalizeNumber(competition.winning_time_seconds, 0),
      item_count: normalizeNumber(competition.item_count, 0),
      items_picked_up: normalizeNumber(competition.items_picked_up, 0),
      completion_percent: normalizeNumber(competition.completion_percent, 0),
      can_compete: normalizeBoolean(competition.can_compete),
      chat: "OFF",
      child_identity: "OFF",
      parent_approval: "ON",
      no_child_identity_touches_anything: true,
      no_chat_surface: true,
    };
  }

  function normalizeShareSafePing(ping = {}) {
    if (!ping || typeof ping !== "object" || Array.isArray(ping)) {
      return {
        ping_id: "",
        ping_type: "",
        department: "CyberCare",
        room: "CyberCade",
        game_name: "PixelPrix",
        mode_name: "",
        routine_name: "",
        challenge: "Beat the chore",
        winning_time_seconds: 0,
        winning_time_display: "00:00",
        items_picked_up: 0,
        completion_percent: 0,
        badge: "",
        anonymous_player_tag: "",
        shareable: false,
        parent_approval_required: true,
        chat: "OFF",
        child_identity: "OFF",
        safe_card_copy: {},
      };
    }

    return {
      ping_id: normalizeSafeReference(ping.ping_id),
      created_at: normalizeText(ping.created_at),
      ping_type: normalizeSafeReference(ping.ping_type),
      department: "CyberCare",
      room: "CyberCade",
      game_name: "PixelPrix",
      mode_name: sanitizeSafeText(ping.mode_name),
      routine_name: sanitizeSafeText(ping.routine_name),
      challenge: sanitizeSafeText(ping.challenge) || "Beat the chore",
      winning_time_seconds: normalizeNumber(ping.winning_time_seconds, 0),
      winning_time_display: normalizeText(ping.winning_time_display) || formatSeconds(ping.winning_time_seconds),
      items_picked_up: normalizeNumber(ping.items_picked_up, 0),
      completion_percent: normalizeNumber(ping.completion_percent, 0),
      badge: sanitizeSafeText(ping.badge),
      anonymous_player_tag: sanitizeSafeText(ping.anonymous_player_tag),
      shareable: normalizeBoolean(ping.shareable),
      parent_approval_required: ping.parent_approval_required !== false,
      chat: "OFF",
      child_identity: "OFF",
      parent_identity: "OFF",
      private_photo: "OFF",
      raw_child_identity: "OFF",
      public_child_profile: "OFF",
      safe_card_copy: normalizeSafeCardCopy(ping.safe_card_copy),
    };
  }

  function normalizeSafeCardCopy(copy = {}) {
    if (!copy || typeof copy !== "object" || Array.isArray(copy)) {
      return {
        title: "PIXELPRIX ROOM RESET",
        mode: "",
        difficulty: "",
        winning_time: "00:00",
        items_picked_up: 0,
        completion: "0%",
        badge: "",
        challenge: "Beat the chore",
        reading_required: "NO",
        voice_help: "ON",
        chat: "OFF",
        child_identity: "OFF",
        parent_approval: "ON",
      };
    }

    return {
      title: sanitizeSafeText(copy.title) || "PIXELPRIX ROOM RESET",
      mode: sanitizeSafeText(copy.mode),
      difficulty: sanitizeSafeText(copy.difficulty),
      winning_time: normalizeText(copy.winning_time) || "00:00",
      items_picked_up: normalizeNumber(copy.items_picked_up, 0),
      completion: normalizeText(copy.completion) || "0%",
      badge: sanitizeSafeText(copy.badge),
      challenge: sanitizeSafeText(copy.challenge) || "Beat the chore",
      reading_required: "NO",
      voice_help: "ON",
      chat: "OFF",
      child_identity: "OFF",
      parent_approval: "ON",
    };
  }

  function normalizeCompetitionCard(card = {}) {
    if (!card || typeof card !== "object" || Array.isArray(card)) {
      return {
        card_id: "",
        title: "PIXELPRIX ROOM RESET",
        mode: "",
        difficulty: "",
        winning_time: "00:00",
        items_picked_up: 0,
        completion: "0%",
        challenge: "Beat the chore",
        badge: "",
        reading_required: "NO",
        voice_help: "ON",
        chat: "OFF",
        child_identity: "OFF",
        parent_approval: "ON",
        display_copy: "",
      };
    }

    return {
      card_id: normalizeSafeReference(card.card_id),
      title: sanitizeSafeText(card.title) || "PIXELPRIX ROOM RESET",
      mode: sanitizeSafeText(card.mode),
      difficulty: sanitizeSafeText(card.difficulty),
      winning_time: normalizeText(card.winning_time) || "00:00",
      items_picked_up: normalizeNumber(card.items_picked_up, 0),
      completion: normalizeText(card.completion) || "0%",
      challenge: sanitizeSafeText(card.challenge) || "Beat the chore",
      badge: sanitizeSafeText(card.badge),
      reading_required: "NO",
      voice_help: "ON",
      chat: "OFF",
      child_identity: "OFF",
      parent_approval: "ON",
      display_copy: sanitizeSafeText(card.display_copy),
    };
  }

  function normalizeParentAttentionCard(card = {}) {
    if (!card || typeof card !== "object" || Array.isArray(card)) {
      return {
        card_id: "",
        title: "PARENT CHECK",
        body: "",
        parent_checked: false,
        parent_approved: false,
        reward_ready: false,
        required_before_reward: true,
        no_shame: true,
        does_not_replace_parenting: true,
      };
    }

    return {
      card_id: normalizeSafeReference(card.card_id),
      title: sanitizeSafeText(card.title) || "PARENT CHECK",
      body: sanitizeSafeText(card.body),
      parent_checked: normalizeBoolean(card.parent_checked),
      parent_approved: normalizeBoolean(card.parent_approved),
      reward_ready: normalizeBoolean(card.reward_ready),
      required_before_reward: card.required_before_reward !== false,
      no_shame: card.no_shame !== false,
      does_not_replace_parenting: card.does_not_replace_parenting !== false,
    };
  }

  function normalizeLedgerEntry(status = {}) {
    const cleanStatus = requireObject(status, "PIXELPRIX_STATUS_REQUIRED");

    return {
      entry_id: normalizeSafeReference(cleanStatus.entry_id),
      recorded_at: normalizeText(cleanStatus.recorded_at),
      department: "CyberCare",
      room: "CyberCade",
      game_name: "PixelPrix",
      route_id: normalizeSafeReference(cleanStatus.route_id),
      signal_id: normalizeSafeReference(cleanStatus.signal_id),
      chore_id: normalizeSafeReference(cleanStatus.chore_id),
      household_tag: normalizeSafeReference(cleanStatus.household_tag),
      anonymous_player_tag: sanitizeSafeText(cleanStatus.anonymous_player_tag),
      mode: normalizeMode(cleanStatus.mode),
      progress_state: normalizeSafeReference(cleanStatus.progress_state),
      chore_name: sanitizeSafeText(cleanStatus.chore_name),
      chore_area: sanitizeSafeText(cleanStatus.chore_area),
      room_label: sanitizeSafeText(cleanStatus.room_label),
      item_count: normalizeNumber(cleanStatus.item_count, 0),
      items_completed: normalizeNumber(cleanStatus.items_completed, 0),
      digital_seconds: normalizeNumber(cleanStatus.digital_seconds, 0),
      real_seconds: normalizeNumber(cleanStatus.real_seconds, 0),
      parent_checked: normalizeBoolean(cleanStatus.parent_checked),
      parent_approved: normalizeBoolean(cleanStatus.parent_approved),
      parent_attention_required: cleanStatus.parent_attention_required !== false,
      reward_ready: normalizeBoolean(cleanStatus.reward_ready),
      reward_claimed: normalizeBoolean(cleanStatus.reward_claimed),
      reward_type: sanitizeSafeText(cleanStatus.reward_type),
      reward_label: sanitizeSafeText(cleanStatus.reward_label),
      voice_help: cleanStatus.voice_help !== false,
      icon_help: cleanStatus.icon_help !== false,
      reading_required: false,
      no_chat: true,
      score: normalizeScore(cleanStatus.score),
      completion: normalizeCompletion(cleanStatus.completion),
      routine: normalizeRoutine(cleanStatus.routine),
      competition: normalizeCompetition(cleanStatus.competition),
      share_safe_ping: normalizeShareSafePing(cleanStatus.share_safe_ping),
      competition_card: normalizeCompetitionCard(cleanStatus.competition_card),
      parent_attention_card: normalizeParentAttentionCard(cleanStatus.parent_attention_card),
      safe_summary: normalizeSafeSummary(cleanStatus.safe_summary),
      paper_ladder_row: cleanStatus.paper_ladder_row || {},
      boundaries: cleanStatus.boundaries || {},
    };
  }

  function normalizeSafeSummary(summary = {}) {
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
      return {
        headline: "",
        body: "",
        mode: "",
        progress_state: "",
        completion_percent: 0,
        competition_enabled: false,
        safe_tags: [],
      };
    }

    return {
      headline: sanitizeSafeText(summary.headline),
      body: sanitizeSafeText(summary.body),
      mode: sanitizeSafeText(summary.mode),
      progress_state: normalizeSafeReference(summary.progress_state),
      completion_percent: normalizeNumber(summary.completion_percent, 0),
      competition_enabled: normalizeBoolean(summary.competition_enabled),
      safe_tags: normalizeList(summary.safe_tags).map(sanitizeSafeText),
    };
  }

  function receiveStatus(status = {}) {
    const normalized = normalizeLedgerEntry(status);
    const displayState = deriveDisplayState(normalized);

    const display = {
      received_id: makeId("pixelPrixGameDisplay"),
      received_at: now(),
      source: "core.kid-chore-game-progress-ledger",
      department: "CyberCare",
      room: "CyberCade",
      game_name: "PixelPrix",
      entry_id: normalized.entry_id,
      route_id: normalized.route_id,
      signal_id: normalized.signal_id,
      chore_id: normalized.chore_id,
      display_state: displayState,
      mode: clone(normalized.mode),
      score: clone(normalized.score),
      completion: clone(normalized.completion),
      routine: clone(normalized.routine),
      competition: clone(normalized.competition),
      share_safe_ping: clone(normalized.share_safe_ping),
      cybercade_display_card: buildCyberCadeDisplayCard(normalized, displayState),
      competition_card: buildCompetitionDisplayCard(normalized),
      routine_card: buildRoutineDisplayCard(normalized),
      parent_approval_card: buildParentApprovalDisplayCard(normalized),
      mode_card: buildModeDisplayCard(normalized),
      safety_card: buildSafetyDisplayCard(normalized),
      display_cards: [],
      paper_ladder_row: null,
      boundaries: buildBoundaries(),
    };

    display.display_cards = buildDisplayCards(display);
    display.paper_ladder_row = buildPaperLadderRow(display);

    receivedDisplays.push(clone(display));

    return clone(display);
  }

  function deriveDisplayState(entry) {
    if (entry.progress_state === "blocked_unsafe") {
      return "blocked_display";
    }

    if (entry.competition.competition_enabled || entry.competition.can_compete) {
      return "competition_display";
    }

    if (entry.completion.completed && entry.parent_approved && entry.reward_ready) {
      return "reward_display";
    }

    if (entry.completion.completed && !entry.parent_approved) {
      return "parent_check_display";
    }

    if (entry.routine.routine_shareable || entry.routine.routine_state === "completed") {
      return "routine_display";
    }

    if (entry.completion.completed) {
      return "completion_display";
    }

    if (entry.progress_state) {
      return "progress_display";
    }

    return "unknown";
  }

  function buildCyberCadeDisplayCard(entry, displayState) {
    const safeCopy = entry.share_safe_ping.safe_card_copy;

    return {
      card_id: makeId("cyberCadePixelPrixCard"),
      card_type: "CYBERCADE_PIXELPRIX_DISPLAY",
      display_state: displayState,
      title: safeCopy.title || buildDefaultTitle(entry),
      department: "CyberCare",
      room: "CyberCade",
      game_name: "PixelPrix",
      mode: safeCopy.mode || entry.mode.display_name,
      difficulty: safeCopy.difficulty || buildDifficultyLabel(entry.mode),
      score: entry.score.score_label,
      winning_time: safeCopy.winning_time || formatSeconds(entry.score.best_time_seconds),
      digital_time: formatSeconds(entry.score.digital_seconds),
      real_time: formatSeconds(entry.score.real_seconds),
      items_picked_up: safeCopy.items_picked_up || entry.completion.items_completed,
      item_count: entry.completion.item_count,
      completion: safeCopy.completion || `${entry.completion.completion_percent}%`,
      routine: entry.routine.routine_name,
      challenge: safeCopy.challenge || "Beat the chore",
      reading_required: "NO",
      voice_help: "ON",
      icon_help: entry.icon_help ? "ON" : "OFF",
      chat: "OFF",
      child_identity: "OFF",
      parent_approval: "ON",
      shareable: entry.share_safe_ping.shareable,
      display_copy: buildCyberCadeDisplayCopy(entry, safeCopy),
    };
  }

  function buildDefaultTitle(entry) {
    const chore = entry.completion.chore_label || entry.chore_name || "Room Reset";
    return `PIXELPRIX ${chore.toUpperCase()}`;
  }

  function buildDifficultyLabel(mode) {
    if (!mode || !mode.item_min) {
      return "";
    }

    if (mode.item_min === mode.item_max) {
      return `${mode.item_min} Items`;
    }

    return `${mode.item_min}-${mode.item_max} Items`;
  }

  function buildCyberCadeDisplayCopy(entry, safeCopy) {
    const lines = [
      safeCopy.title || buildDefaultTitle(entry),
      `Mode: ${safeCopy.mode || entry.mode.display_name}`,
      `Difficulty: ${safeCopy.difficulty || buildDifficultyLabel(entry.mode)}`,
      `Winning Time: ${safeCopy.winning_time || formatSeconds(entry.score.best_time_seconds)}`,
      `Items Picked Up: ${safeCopy.items_picked_up || entry.completion.items_completed}`,
      `Completion: ${safeCopy.completion || `${entry.completion.completion_percent}%`}`,
      `Challenge: ${safeCopy.challenge || "Beat the chore"}`,
      "Reading Required: NO",
      "Voice Help: ON",
      "Chat: OFF",
      "Child Identity: OFF",
      "Parent Approval: ON",
    ];

    return lines.join("\n");
  }

  function buildCompetitionDisplayCard(entry) {
    return {
      card_id: makeId("pixelPrixCompetitionDisplayCard"),
      card_type: "PIXELPRIX_COMPETITION",
      title: entry.competition_card.title || buildDefaultTitle(entry),
      mode: entry.competition_card.mode || entry.mode.display_name,
      difficulty: entry.competition_card.difficulty || buildDifficultyLabel(entry.mode),
      winning_time: entry.competition_card.winning_time || formatSeconds(entry.competition.winning_time_seconds),
      items_picked_up: entry.competition_card.items_picked_up || entry.competition.items_picked_up,
      completion: entry.competition_card.completion || `${entry.competition.completion_percent}%`,
      challenge: entry.competition_card.challenge || "Beat the chore",
      badge: entry.competition_card.badge || entry.score.score_label,
      competition_enabled: entry.competition.competition_enabled,
      can_compete: entry.competition.can_compete,
      anonymous_player_tag: entry.competition.anonymous_player_tag,
      chat: "OFF",
      child_identity: "OFF",
      parent_approval: "ON",
      safe_competition: true,
    };
  }

  function buildRoutineDisplayCard(entry) {
    return {
      card_id: makeId("pixelPrixRoutineDisplayCard"),
      card_type: "PIXELPRIX_ROUTINE",
      title: "PIXELPRIX ROUTINE",
      routine_name: entry.routine.routine_name || entry.completion.chore_label,
      routine_state: entry.routine.routine_state,
      completion_percent: `${entry.routine.completion_percent}%`,
      routine_shareable: entry.routine.routine_shareable,
      routine_ping_allowed: entry.routine.routine_ping_allowed,
      parent_approval_required: true,
      chat: "OFF",
      child_identity: "OFF",
    };
  }

  function buildParentApprovalDisplayCard(entry) {
    return {
      card_id: makeId("pixelPrixParentApprovalDisplayCard"),
      card_type: "PIXELPRIX_PARENT_APPROVAL",
      title: "PARENT CHECK",
      body: entry.parent_attention_card.body || "Parent attention closes the loop.",
      parent_checked: entry.parent_checked || entry.parent_attention_card.parent_checked,
      parent_approved: entry.parent_approved || entry.parent_attention_card.parent_approved,
      reward_ready: entry.reward_ready || entry.parent_attention_card.reward_ready,
      reward_label: entry.reward_label,
      required_before_reward: true,
      attention_is_reward: true,
      no_shame: true,
      does_not_replace_parenting: true,
    };
  }

  function buildModeDisplayCard(entry) {
    return {
      card_id: makeId("pixelPrixModeDisplayCard"),
      card_type: "PIXELPRIX_MODE",
      title: entry.mode.display_name,
      mode_id: entry.mode.mode_id,
      difficulty: buildDifficultyLabel(entry.mode),
      age_band: entry.mode.age_band,
      reading_required: "NO",
      voice_help: "ON",
      icon_help: entry.icon_help ? "ON" : "OFF",
      parent_guided: entry.mode.parent_guided,
      description: entry.mode.description,
    };
  }

  function buildSafetyDisplayCard(entry) {
    return {
      card_id: makeId("pixelPrixSafetyDisplayCard"),
      card_type: "PIXELPRIX_SAFETY",
      title: "SAFETY",
      chat: "OFF",
      child_identity: "OFF",
      parent_approval: "ON",
      reading_required: "NO",
      raw_private_photo: "OFF",
      public_child_profile: "OFF",
      direct_messages: "OFF",
      comments: "OFF",
      safe_text: "Compete the chore. Never expose the child. Never fall into chat here.",
    };
  }

  function buildDisplayCards(display) {
    const cards = [
      display.cybercade_display_card,
      display.mode_card,
    ];

    if (
      display.display_state === "competition_display" ||
      display.competition.competition_enabled ||
      display.competition.can_compete
    ) {
      cards.push(display.competition_card);
    }

    if (display.routine.routine_name || display.routine.routine_shareable) {
      cards.push(display.routine_card);
    }

    cards.push(display.parent_approval_card);
    cards.push(display.safety_card);

    return cards.map(clone);
  }

  function buildPaperLadderRow(display) {
    return {
      row_id: makeId("pixelPrixDisplayPaperRow"),
      received_id: display.received_id,
      received_at: display.received_at,
      department: "CyberCare",
      room: "CyberCade",
      game_name: "PixelPrix",
      display_state: display.display_state,
      mode: display.mode.display_name,
      score: display.score.score_label,
      winning_time: formatSeconds(display.score.best_time_seconds),
      item_count: display.completion.item_count,
      items_picked_up: display.completion.items_completed,
      completion_percent: display.completion.completion_percent,
      routine_present: Boolean(display.routine.routine_name),
      competition_enabled: display.competition.competition_enabled,
      shareable: display.share_safe_ping.shareable,
      chat_off: true,
      child_identity_off: true,
      parent_approval_on: true,
      boundary: "CYBERCADE_DISPLAYS_PIXELPRIX_SHARE_SCORE_NOT_CHILD_CHAT_OFF_PARENT_APPROVAL_ON",
    };
  }

  function formatSeconds(seconds) {
    const cleanSeconds = normalizeNumber(seconds, 0);

    if (cleanSeconds <= 0) {
      return "00:00";
    }

    const minutes = Math.floor(cleanSeconds / 60);
    const remainingSeconds = cleanSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function buildBoundaries() {
    return {
      cybercare_department: true,
      cybercade_game_room: true,
      pixelprix_game_app: true,
      cybercade_displays_the_game: true,
      pixelprix_shows_chore_result: true,
      scores_can_move: true,
      completions_can_move: true,
      routines_can_move: true,
      competitions_can_move: true,
      children_cannot_be_exposed: true,
      no_kid_identity_touches_anything: true,
      chat_stays_off: true,
      parent_approval_stays_on: true,
      no_kid_name: true,
      no_kid_face: true,
      no_address: true,
      no_school: true,
      no_parent_identity: true,
      no_public_child_profile: true,
      no_direct_messages: true,
      no_comments: true,
      no_friend_requests: true,
      no_public_feed: true,
      no_raw_private_photo_storage: true,
      no_shame: true,
      no_punishment_engine: true,
      does_not_replace_parenting: true,
    };
  }

  function listDisplays(filter = {}) {
    const cleanFilter = filter && typeof filter === "object" ? filter : {};
    const displayState = normalizeSafeReference(cleanFilter.display_state);
    const mode = normalizeSafeReference(cleanFilter.mode);
    const choreId = normalizeSafeReference(cleanFilter.chore_id);
    const competitionOnly = cleanFilter.competition_only === true;
    const shareableOnly = cleanFilter.shareable_only === true;

    return receivedDisplays
      .filter((display) => {
        if (displayState && display.display_state !== displayState) {
          return false;
        }

        if (mode && display.mode.mode_id !== mode && display.mode.display_name !== mode) {
          return false;
        }

        if (choreId && display.chore_id !== choreId) {
          return false;
        }

        if (competitionOnly && !display.competition.competition_enabled) {
          return false;
        }

        if (shareableOnly && !display.share_safe_ping.shareable) {
          return false;
        }

        return true;
      })
      .map(clone);
  }

  function latestDisplay() {
    if (!receivedDisplays.length) {
      return null;
    }

    return clone(receivedDisplays[receivedDisplays.length - 1]);
  }

  function listCyberCadeDisplayCards(filter = {}) {
    return listDisplays(filter).map((display) => clone(display.cybercade_display_card));
  }

  function listCompetitionCards(filter = {}) {
    return listDisplays(filter).map((display) => clone(display.competition_card));
  }

  function listRoutineCards(filter = {}) {
    return listDisplays(filter).map((display) => clone(display.routine_card));
  }

  function listPaperLadderRows(filter = {}) {
    return listDisplays(filter).map((display) => clone(display.paper_ladder_row));
  }

  function clearDisplays() {
    receivedDisplays.length = 0;
    return true;
  }

  return {
    receiveStatus,
    listDisplays,
    latestDisplay,
    listCyberCadeDisplayCards,
    listCompetitionCards,
    listRoutineCards,
    listPaperLadderRows,
    clearDisplays,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = PixelPrixGameDisplayReceiver;
}
