// civic/civic-transparency-dashboard.ts

import { CivicSignal } from "../sovereign/civic-signal-layer";

export interface DashboardWidget {
  id: string;
  title: string;
  description: string;
  render: (signal: CivicSignal) => any;
}

export class CivicTransparencyDashboard {
  widgets: DashboardWidget[] = [
    {
      id: "widget.class",
      title: "Signal Class",
      description: "Displays the civic signal class (INFO, ADVISORY, ALERT, CRITICAL)",
      render: (signal) => ({
        class: signal.class,
        timestamp: signal.timestamp
      })
    },
    {
      id: "widget.summary",
      title: "Summary",
      description: "Shows the high-level summary of the civic signal",
      render: (signal) => ({
        summary: signal.summary
      })
    },
    {
      id: "widget.vectors",
      title: "Public Vectors",
      description: "Displays the public-safe subset of threat vectors",
      render: (signal) => ({
        vectors: signal.publicVectors
      })
    },
    {
      id: "widget.timestamp",
      title: "Timestamp",
      description: "Shows when the civic signal was generated",
      render: (signal) => ({
        timestamp: signal.timestamp
      })
    }
  ];

  renderDashboard(signal: CivicSignal) {
    return this.widgets.map((w) => ({
      id: w.id,
      title: w.title,
      content: w.render(signal)
    }));
  }
}
