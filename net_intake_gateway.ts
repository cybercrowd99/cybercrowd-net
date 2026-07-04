import { SignalPacket } from '../models/SignalPacket';

// >>>> CYBERCROWD‑NET: Intake Gateway
// >>>> NET receives packets but does not mutate or interpret them.
// >>>> This file provides the entry point for all packet flow into NET.

export function netIntake(packet: SignalPacket) {
  return {
    packetId: packet.id,
    lane: packet.lane,
    receivedAt: Date.now()
  };
}
