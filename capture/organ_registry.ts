// capture/organ_registry.ts
// Capture-Net: Organ Registry

export interface CaptureOrgan {
  index: number;
  id: string;
  role: string;
  file: string;
  upstream: string[];
  downstream: string[];
}

export const CAPTURE_ORGAN_REGISTRY: CaptureOrgan[] = [
  { index: 1, id: "session_tagging", role: "assign behavioral tags to attacker sessions", file: "session-tagging.ts", upstream: [], downstream: ["session_risk_score"] },
  { index: 2, id: "session_risk_score", role: "compute risk scores for sessions", file: "session-risk-score.ts", upstream: ["session_tagging"], downstream: ["escalation_engine"] },
  { index: 3, id: "escalation_engine", role: "drive escalation decisions", file: "escalation-engine.ts", upstream: ["session_risk_score"], downstream: ["deep_containment"] },
  { index: 4, id: "deep_containment", role: "apply deep containment actions", file: "deep-containment.ts", upstream: ["escalation_engine"], downstream: ["final_lockdown"] },
  { index: 5, id: "final_lockdown", role: "perform final lockdown", file: "final-lockdown.ts", upstream: ["deep_containment"], downstream: ["immobilization_audit"] },
  { index: 6, id: "immobilization_audit", role: "record state transitions after final lockdown", file: "immobilization-audit.ts", upstream: ["final_lockdown"], downstream: ["hostile_session_report"] },
  { index: 7, id: "hostile_session_report", role: "generate hostile session reports", file: "hostile-session-report.ts", upstream: ["immobilization_audit"], downstream: ["hostile_session_export"] },
  { index: 8, id: "hostile_session_export", role: "export hostile session data", file: "hostile-session-export.ts", upstream: ["hostile_session_report"], downstream: ["hostile_session_archive"] },
  { index: 9, id: "hostile_session_archive", role: "archive hostile sessions", file: "hostile-session-archive.ts", upstream: ["hostile_session_export"], downstream: ["hostile_session_ledger"] },
  { index: 10, id: "hostile_session_ledger", role: "maintain hostile session ledger", file: "hostile-session-ledger.ts", upstream: ["hostile_session_archive"], downstream: ["hostile_session_registry"] },
  { index: 11, id: "hostile_session_registry", role: "register hostile sessions", file: "registry.ts", upstream: ["hostile_session_ledger"], downstream: ["hostile_session_catalog"] },
  { index: 12, id: "hostile_session_catalog", role: "catalog hostile sessions", file: "catalog.ts", upstream: ["hostile_session_registry"], downstream: ["hostile_session_analytics"] },
  { index: 13, id: "hostile_session_analytics", role: "analyze hostile sessions", file: "analytics.ts", upstream: ["hostile_session_catalog"], downstream: ["hostile_session_insights", "hostile_session_anomaly_detector"] },
  { index: 14, id: "hostile_session_insights", role: "derive insights from analytics", file: "insights.ts", upstream: ["hostile_session_analytics"], downstream: ["hostile_session_intel"] },
  { index: 15, id: "hostile_session_anomaly_detector", role: "detect anomalies in hostile sessions", file: "anomaly_detector.ts", upstream: ["hostile_session_analytics"], downstream: ["hostile_session_intel"] },
  { index: 16, id: "entropy_trap", role: "apply entropy-based traps", file: "entropy-trap.ts", upstream: ["hostile_session_analytics"], downstream: ["hostile_session_intel"] },
  { index: 17, id: "decoy_dashboard_generator", role: "generate decoy dashboards", file: "decoy-dashboard-generator.ts", upstream: ["hostile_session_analytics"], downstream: ["hostile_session_intel"] },
  { index: 18, id: "route_decider", role: "decide routing for hostile sessions", file: "route-decider.ts", upstream: ["hostile_session_analytics"], downstream: ["hostile_session_intel"] },
  { index: 19, id: "hostile_session_intel", role: "consolidate analytics into intelligence", file: "intel.ts", upstream: ["hostile_session_insights", "hostile_session_anomaly_detector", "entropy_trap", "decoy_dashboard_generator", "route_decider"], downstream: ["hostile_session_intelligence_export"] },
  { index: 20, id: "hostile_session_intelligence_export", role: "export unified intelligence packages", file: "intelligence_export.ts", upstream: ["hostile_session_intel"], downstream: ["hostile_session_intelligence_distributor"] },
  { index: 21, id: "hostile_session_intelligence_distributor", role: "distribute intelligence to active surfaces", file: "intelligence_distributor.ts", upstream: ["hostile_session_intelligence_export"], downstream: ["hostile_session_cross_session_correlator"] },
  { index: 22, id: "hostile_session_cross_session_correlator", role: "correlate hostile intelligence across sessions", file: "cross_session_correlator.ts", upstream: ["hostile_session_intelligence_distributor"], downstream: ["hostile_session_adversary_profiler"] },
  { index: 23, id: "hostile_session_adversary_profiler", role: "build adversary profiles", file: "adversary_profiler.ts", upstream: ["hostile_session_cross_session_correlator"], downstream: ["hostile_session_long_range_pattern_engine"] },
  { index: 24, id: "hostile_session_long_range_pattern_engine", role: "analyze long-range adversary patterns", file: "long_range_pattern_engine.ts", upstream: ["hostile_session_adversary_profiler"], downstream: ["hostile_session_threat_lineage_builder"] },
  { index: 25, id: "hostile_session_threat_lineage_builder", role: "build threat lineages", file: "threat_lineage_builder.ts", upstream: ["hostile_session_long_range_pattern_engine"], downstream: ["hostile_session_strategic_intelligence_synthesizer"] },
  { index: 26, id: "hostile_session_strategic_intelligence_synthesizer", role: "synthesize strategic intelligence", file: "strategic_intelligence_synthesizer.ts", upstream: ["hostile_session_threat_lineage_builder"], downstream: ["hostile_session_civilization_threat_map"] },
  { index: 27, id: "hostile_session_civilization_threat_map", role: "generate civilization-grade threat maps", file: "civilization_threat_map.ts", upstream: ["hostile_session_strategic_intelligence_synthesizer"], downstream: ["hostile_session_meta_signal_emitter"] },
  { index: 28, id: "hostile_session_meta_signal_emitter", role: "emit high-order meta-signals", file: "meta_signal_emitter.ts", upstream: ["hostile_session_civilization_threat_map"], downstream: ["hostile_session_overseer"] },
  { index: 29, id: "hostile_session_overseer", role: "produce global oversight signal", file: "overseer.ts", upstream: ["hostile_session_meta_signal_emitter"], downstream: [] }
];

export function getOrganById(id: string): CaptureOrgan | undefined {
  return CAPTURE_ORGAN_REGISTRY.find((o) => o.id === id);
}

export function getOrganByIndex(index: number): CaptureOrgan | undefined {
  return CAPTURE_ORGANISTRY.find((o) => o.index === index);
}
