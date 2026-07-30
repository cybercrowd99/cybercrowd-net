/**
 * NET — Wheel Binding
 *
 * NetWheelBinding establishes the structural relationship between
 * the NET connection boundary and the WheelReactor meta-organ.
 *
 * This is a passive structural binding artifact.
 *
 * It does not:
 * - create authority
 * - evaluate identity
 * - correlate behavior
 * - route connections
 * - execute services
 * - modify sovereignty
 * - activate wheel behavior
 *
 * NetWheelBinding only preserves:
 * - NET terminal boundary
 * - WheelReactor presence
 * - structural binding state
 */

import { WheelReactor } from "../wheel/wheel-reactor";
import { NetConnectionTerminal } from "./net-connection-terminal";

export interface NetWheelBinding {
  /**
   * Governing NET wheel binding doctrine.
   */
  doctrine: "Net_WheelBinding";

  /**
   * Structural artifact discriminator.
   */
  status: "NET_WHEEL_BINDING";

  /**
   * Preserved NET terminal boundary.
   *
   * Never enriched.
   * Never interpreted.
   * Never mutated.
   */
  terminal: NetConnectionTerminal;

  /**
   * Preserved WheelReactor meta-organ.
   *
   * Never activated.
   * Never given authority.
   * Never interpreted.
   */
  wheel: WheelReactor;

  /**
   * Structural binding state.
   */
  bindingState: "BOUND";
}

/**
 * Bind WheelReactor into NET terminal boundary.
 *
 * Passive relationship only.
 *
 * It does not:
 * - create authority
 * - route connections
 * - execute operations
 * - modify NET state
 * - modify wheel state
 */
export function bindWheelIntoNetTerminal(
  wheel: WheelReactor,
  terminal: NetConnectionTerminal
): NetWheelBinding {
  const artifact: NetWheelBinding = {
    doctrine: "Net_WheelBinding",
    status: "NET_WHEEL_BINDING",

    terminal,
    wheel,

    bindingState: "BOUND",
  };

  return Object.freeze(artifact);
}
