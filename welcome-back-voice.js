/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: welcome-back-voice.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add welcome back voice experience
 * CONTEXT:
 * Speak one human-facing
 * welcome-back message.
 *
 * Current name source:
 * verified email name.
 *
 * Future additive:
 * optional personalized
 * welcome-back name.
 *
 * One rock.
 * One object.
 * One movement.
 * One function.
 * One entrance.
 * One exit.
 * One actual end.
 *
 * No authentication.
 * No session creation.
 * No password handling.
 * No verifier handling.
 * No identity mutation.
 * No email mutation.
 * No profile mutation.
 * No storage.
 * No routing.
 * No authorization.
 * No lane opening.
 */

/**
 * Speak:
 *
 * "Welcome back, <name>"
 *
 * Name priority:
 *
 * 1. personalizedWelcomeName
 * 2. email name before @
 * 3. generic "Welcome back"
 *
 * personalizedWelcomeName is
 * presentation only.
 *
 * It does not replace:
 *
 * - email
 * - root uIDL
 * - identity-active-id
 * - alias
 * - profile name
 * - login credentials
 */
export function speakWelcomeBack(
  email,
  personalizedWelcomeName = ""
) {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    typeof SpeechSynthesisUtterance ===
      "undefined"
  ) {
    return {
      ok: false,
      spokenText: null,
      reason:
        "SPEECH_SYNTHESIS_UNAVAILABLE",
    };
  }

  const cleanPersonalizedName =
    String(
      personalizedWelcomeName || ""
    )
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim()
      .slice(0, 64);

  const cleanEmail =
    String(
      email || ""
    )
      .trim()
      .toLowerCase();

  let emailName = "";

  if (
    cleanEmail &&
    cleanEmail.includes("@")
  ) {
    emailName =
      cleanEmail
        .split("@")[0]
        .replace(/[._+\-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 64);
  }

  const welcomeName =
    cleanPersonalizedName ||
    emailName;

  const spokenText =
    welcomeName
      ? `Welcome back, ${welcomeName}`
      : "Welcome back";

  const utterance =
    new SpeechSynthesisUtterance(
      spokenText
    );

  utterance.lang =
    document.documentElement.lang ||
    "en-US";

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.cancel();

  window.speechSynthesis.speak(
    utterance
  );

  return {
    ok: true,
    spokenText,
    reason:
      "WELCOME_BACK_SPOKEN",
  };
}
