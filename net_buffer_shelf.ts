import { SignalPacket } from '../models/SignalPacket';

// >>>> CYBERCROWD‑NET: Buffer Shelf
// >>>> NET provides a neutral buffer for packets before dispatch or adapter routing.
// >>>> No mutation, no interpretation, pure holding shelf.

export function netBuffer(packet: SignalPacket) {
  return {
    packetId: packet.id,
    lane: packet.lane,
    bufferedAt: Date.now()
  };
}
