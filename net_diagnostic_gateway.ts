import { SignalPacket } from '../models/SignalPacket';
import { triggerPing } from '../core/ping_diagnostic_core';

// >>>> CYBERCROWD-NET: Diagnostic Gateway
// >>>> NET never interprets diagnostics; it only exposes CORE’s diagnostic output.
// >>>> This file triggers Ping diagnostics and returns the artifact upward.

export function netDiagnostic(packet: SignalPacket) {
  return triggerPing(packet);
}
