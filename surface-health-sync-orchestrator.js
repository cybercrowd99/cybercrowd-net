export class SurfaceHealthSyncOrchestrator {
  constructor({ livenessMonitor, responsivenessAnalyzer, healthAggregator, snapshotStore, router }) {
    this.livenessMonitor = livenessMonitor;
    this.responsivenessAnalyzer = responsivenessAnalyzer;
    this.healthAggregator = healthAggregator;
    this.snapshotStore = snapshotStore;
    this.router = router;
  }

  run() {
    const liveness = this.livenessMonitor.evaluate();
    const responsiveness = this.responsivenessAnalyzer.analyze(liveness);
    const unified = this.healthAggregator.aggregate(liveness, responsiveness);

    this.snapshotStore.update(unified);

    if (this.router && typeof this.router.broadcast === "function") {
      this.router.broadcast(unified);
    }

    return unified;
  }
}
