/**
 * CyberCrowd-MDC — Signal Artifact V1
 *
 * Purpose:
 * - Convert bounded MDC signal interpretations into immutable MDC artifact records.
 * - Preserve NET→MDC lineage references for metadata audit and replay.
 * - Provide a sealed metadata artifact boundary for MDC processing.
 *
 * Does NOT:
 * - own identity
 * - create behavioral profiles
 * - mutate NET lineage
 * - mutate CORE state
 * - mutate OSAR state
 * - authorize behavior
 * - execute transactions
 */

import type { MdcSignalInterpretation } from "./MdcSignalInterpreter";

export type MdcSignalArtifactStatus =
  | "MDC_SIGNAL_ARTIFACT_CREATED"
  | "MDC_SIGNAL_ARTIFACT_INVALID";

export interface MdcSignalArtifact {
  readonly status: MdcSignalArtifactStatus;

  /**
   * Immutable MDC artifact anchor.
   */
  readonly artifactReference: string;

  /**
   * Source MDC interpretation reference.
   */
  readonly interpretedSignalReference: string;

  /**
   * Source NET signal binding reference.
   */
  readonly signalBindingReference: string;

  /**
   * MDC boundary reference.
   */
  readonly mdcReference: string;

  /**
   * Artifact creation timestamp.
   */
  readonly createdAt: string;
}

export interface CreateMdcSignalArtifactInput {
  readonly interpretation: MdcSignalInterpretation;
}

/**
 * Creates bounded MDC signal artifact.
 *
 * Structural artifact creation only.
 */
export const createMdcSignalArtifact = (
  input: CreateMdcSignalArtifactInput,
): MdcSignalArtifact => {

  if (!input.interpretation) {
    throw new Error("INVALID_MDC_SIGNAL_ARTIFACT_INPUT");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    status:
      "MDC_SIGNAL_ARTIFACT_CREATED",

    artifactReference:
      `mdc-signal-artifact:${crypto.randomUUID()}`,

    interpretedSignalReference:
      input.interpretation.interpretedSignalReference,

    signalBindingReference:
      input.interpretation.signalBindingReference,

    mdcReference:
      input.interpretation.mdcReference,

    createdAt:
      now,
  });
};

/**
 * Structural validation only.
 */
export const validateMdcSignalArtifact = (
  artifact: MdcSignalArtifact,
): boolean => {

  return (
    artifact.status === "MDC_SIGNAL_ARTIFACT_CREATED" &&
    Boolean(artifact.artifactReference) &&
    Boolean(artifact.interpretedSignalReference) &&
    Boolean(artifact.signalBindingReference) &&
    Boolean(artifact.mdcReference) &&
    Boolean(artifact.createdAt)
  );
};
