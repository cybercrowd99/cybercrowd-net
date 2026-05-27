export function integrityGate(alpha, expected) {
  if (!alpha || !expected) {
    return 0;
  }

  // strict deterministic comparison
  if (alpha === expected) {
    return 1;
  }

  return 0;
}
