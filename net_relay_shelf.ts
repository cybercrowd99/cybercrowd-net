import { SignalPacket } from '../models/SignalPacket';

// >>>> CYBERCROWD‑NET: Relay Shelf
// >>>> NET provides a staging shelf for packets between outbound and adapters.
// >>>> No mutation, no interpretation, pure relay.

export function netRelay(packet: SignalPacket) {
  return {
    packetId: packet.id,
    lane: packet.lane,
    relayedAt: Date.now()
  };
}
