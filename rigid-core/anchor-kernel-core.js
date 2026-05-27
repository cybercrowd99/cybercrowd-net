import { integrityGate } from "./integrity-gate.js";
import { scalingGovernor } from "./scaling-governor.js";
import { anchorRoutingGate } from "./anchor-routing-gate.js";
import { anchorSystemState } from "./anchor-system-state.js";

export function anchorKernelCore(alpha, expected, Tp, Tf, loadGradient, routes) {
  // 1. check if the system is safe
  const integrityValue = integrityGate(alpha, expected);

  // 2. calculate how fast we should run
  const throttleValue = scalingGovernor(Tp, Tf, loadGradient);

  // 3. decide where we are allowed to send things
  const routingList = anchorRoutingGate(integrityValue, routes);

  // 4. combine everything into one final answer
  return anchorSystemState(integrityValue, throttleValue, routingList);
}
