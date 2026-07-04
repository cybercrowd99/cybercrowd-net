import { SignalPacket } from '../models/SignalPacket';
import { setBlink, advanceToFire, advanceToTakeover, advanceToArchive } 
  from '../core/blink_state_engine';

// >>>> CYBERCROWD-NET: Blink Gateway
// >>>> NET never mutates ritual state directly.
// >>>> NET requests transitions; CORE performs them.

export function netSetBlink(packet: SignalPacket, state: string) {
  return setBlink(packet, state);
}

export function netAdvanceFire(packet: SignalPacket) {
  return advanceToFire(packet);
}

export function netAdvanceTakeover(packet: SignalPacket) {
  return advanceToTakeover(packet);
}

export function netAdvanceArchive(packet: SignalPacket) {
  return advanceToArchive(packet);
}
