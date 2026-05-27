import { integrityGate } from "./integrity-gate.js";
import { scalingGovernor } from "./scaling-governor.js";
import { anchorRoutingGate } from "./anchor-routing-gate.js";
import { anchorSystemState } from "./anchor-system-state.js";

export function anchorKernel(alpha, expected, Tp, Tf, loadGradient, routes) {
  // 1. integrity check
  const integrityValue = integrityGate(alpha, expected);

  // 2. throttle prediction
  const throttleValue = scalingGovernor(Tp, Tf, loadGradient);

  // 3. routing permission
  const routingList = anchorRoutingGate(integrityValue, routes);

  // 4. final combined state
  return anchorSystemState(integrityValue, throttleValue, routingList);
}
