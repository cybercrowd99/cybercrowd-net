import { SignalPacket } from '../models/SignalPacket';

// >>>> CYBERCROWD‑NET: Outbound Gateway
// >>>> NET forwards packets but does not mutate or interpret them.
// >>>> This file provides the exit point for packet flow leaving NET.

export function netOutbound(packet: SignalPacket) {
  return {
    packetId: packet.id,
    lane: packet.lane,
    forwardedAt: Date.now()
  };
}
