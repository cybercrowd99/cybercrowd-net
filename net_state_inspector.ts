import { SignalPacket } from '../models/SignalPacket';

// >>>> CYBERCROWD-NET: State Inspector
// >>>> NET never interprets ritual state; it only exposes it upward.
// >>>> This file returns the packet’s current blink-state after CORE mutation.

export function netState(packet: SignalPacket) {
  return {
    packetId: packet.id,
    lane: packet.lane,
    state: packet.state,
    updatedAt: Date.now()
  };
}
