export function scalingGovernor(Tp, Tf, loadGradient) {
  if (Tp <= 0 || Tf <= 0) {
    return 0;
  }

  // predict how heavy the next moment will be
  const predicted = Tp + loadGradient;

  // throttle value: 1 = full speed, lower numbers = slow down
  const gamma = Math.min(1, Tf / predicted);

  return gamma;
}
