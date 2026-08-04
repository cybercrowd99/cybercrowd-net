/**
 * Designation: CyberCrowd-MDC / Signal Packet V1
 *
 * Purpose:
 * - Define bounded signal packets entering the CyberCrowd Metadata Center (MDC).
 * - Preserve structured lane, blink, proximity, and action references.
 * - Provide immutable-compatible metadata intake structure for MDC processing.
 *
 * Does NOT:
 * - own identity
 * - authorize behavior
 * - mutate CORE state
 * - mutate OSAR state
 * - mutate NET lineage
 * - execute transactions
 * - create behavioral profiles
 */

export type LaneId =
  | 'PING'
  | 'SHOP'
  | 'SOCIAL'
  | 'PUBLIC'
  | 'PRIVATE'
  | 'NEEDS'
  | 'ICAN';

export type BlinkState =
  | 'ON'
  | 'READY'
  | 'FIRE'
  | 'TAKEOVER'
  | 'ARCHIVE';

export interface ProximityProfile {
  readonly surfaceId: string;
  readonly distanceMeters?: number;
  readonly cursorState?: 'IDLE' | 'FOCUSED' | 'RITUAL';
  readonly laneContext: LaneId;
}

export type UserAction =
  | 'OPEN'
  | 'IGNORE'
  | 'ARCHIVE'
  | 'BLOCK'
  | 'CLEAR'
  | 'PURCHASE';

export interface SignalPacket {
  readonly id: string;
  readonly originUserId: string;
  readonly lane: LaneId;
  readonly blink: BlinkState;
  readonly createdAt: string;
  readonly dormantAgeMs: number;
  readonly proximity?: ProximityProfile;
  readonly snapshotId?: string;
  readonly lastAction?: UserAction;
}
