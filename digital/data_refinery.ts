// APP: Data Refinery Organ

export class DataRefinery {
  constructor(deps: {
    storage: any;      // append-only or time-series store
    classifier: any;   // rule-based or model-assisted classifier
  }) {
    this.storage = deps.storage;
    this.classifier = deps.classifier;
  }

  storage: any;
  classifier: any;

  // Ingest a raw event from an upstream organ
  ingest(event: any) {
    const normalized = this.normalize(event);
    const classified = this.classify(normalized);
    const enriched = this.enrich(classified);

    this.store(enriched);
    return enriched;
  }

  // Normalize upstream formats into a shared schema
  normalize(event: any) {
    return {
      timestamp: event.timestamp || Date.now(),
      correlation_id: event.correlation_id || null,
      source_organ: event.source_organ || "unknown",
      risk_score: event.risk_score ?? 0,
      classification: event.classification || "unclassified",
      feature_vector: event.feature_vector || null,
      decision_summary: event.decision_summary || null,

      metadata: {
        ip: event.ip || null,
        region: event.region || null,
        client_hints: event.client_hints || null,
        method: event.method || null,
        path: event.path || null,
        size_band: event.size_band || null,
        flags: event.flags || {}
      }
    };
  }

  // Apply rule-based or ML-assisted classification
  classify(event: any) {
    const label = this.classifier.classify(event);

    return {
      ...event,
      classification: label
    };
  }

  // Add derived fields, cluster IDs, rolling counts, etc.
  enrich(event: any) {
    return {
      ...event,
      derived: {
        cluster_id: this.deriveCluster(event),
        frequency_band: this.deriveFrequency(event)
      }
    };
  }

  deriveCluster(event: any) {
    if (event.risk_score > 0.8) return "high-risk-cluster";
    if (event.risk_score > 0.4) return "medium-cluster";
    return "low-cluster";
  }

  deriveFrequency(event: any) {
    if (event.metadata?.size_band === "large") return "heavy";
    if (event.metadata?.size_band === "medium") return "moderate";
    return "light";
  }

  // Write to append-only store
  store(event: any) {
    this.storage.append(event);
  }

  // Query interface for internal analysts and systems
  query(filters: any) {
    return this.storage.query(filters);
  }

  // Anomaly density for posture and flight director
  getAnomalyDensity() {
    return this.storage.computeAnomalyDensity();
  }

  // Campaign indicators for gyroscope
  getCampaignIndicators() {
    return this.storage.computeCampaignIndicators();
  }

  // Health surface
  health() {
    return {
      storage: this.storage.health(),
      classifier: this.classifier.health()
    };
  }
}
