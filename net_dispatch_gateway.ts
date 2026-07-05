import { SignalPacket } from '../models/SignalPacket';

// >>>> CYBERCROWD‑NET: Dispatch Gateway
// >>>> NET dispatches packets to downstream consumers without mutation or interpretation.
// >>>> Pure transport, recording dispatch metadata.

export function netDispatch(packet: SignalPacket) {
  return {
    packetId: packet.id,
    lane: packet.lane,
    dispatchedAt: Date.now()
  };
}
