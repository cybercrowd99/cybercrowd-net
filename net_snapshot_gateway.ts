import { SignalPacket } from '../models/SignalPacket';
import { snapshotPing } from '../core/ping_snapshot';

// >>>> CYBERCROWD-NET: Snapshot Gateway
// >>>> NET never freezes ritual state directly.
// >>>> NET requests snapshotPing() from CORE and returns the artifact upward.

export function netSnapshot(packet: SignalPacket) {
  return snapshotPing(packet);
}
