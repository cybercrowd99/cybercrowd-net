SOVEREIGN_GEOMETRY_COMPATIBILITY_METRIC  
Sovereign Geometry Compatibility Metric Specification

1. Purpose  
The Sovereign Geometry Compatibility Metric (SGCM) defines how well any entity fits inside the sovereign space. It replaces binary allow/deny with a graded geometric compatibility score that measures alignment, invasiveness, and predictability. SGCM is a sovereign‑level primitive used by auth organs, defense organs, surface engines, and capture‑net to determine privilege, routing, segmentation, and quarantine.

2. Geometry Model  
SGCM models both the entity (E) and the sovereign (S) using four vectors:

Policy Vector (P): normative vs effective behavior, data handling, jurisdiction, norms.  
Topology Vector (T): attachment points, reachability, adjacency to critical organs, blast radius.  
Dependency Vector (D): upstream vendors, downstream consumers, opacity, external leverage.  
Dynamism Vector (X): update volatility, governance hooks, rollback, adversarial sensitivity.

Each vector is evaluated independently and then combined into a unified compatibility score.

3. Metric Definition  
SGCM(E,S) ∈ [0,1] using sovereign‑defined weights wP, wT, wD, wX:

SGCM = wP·CP + wT·CT + wD·CD + wX·CX

CP (Policy Compatibility): penalizes hard conflicts, rewards constraint alignment.  
CT (Topology Compatibility): penalizes unsafe adjacency, rewards segmentation and observability.  
CD (Dependency Compatibility): penalizes opaque or externally controlled dependencies, rewards sovereign custody and redundancy.  
CX (Dynamism Compatibility): penalizes uncontrolled change, rewards governance and rollback.

Hard conflicts in policy, unsafe topology adjacency, opaque dependencies, and uncontrolled dynamism reduce compatibility.

4. CyberCrowd Integration  
Auth Organs: SGCM caps maximum privilege regardless of requested scope.  
Defense Organs: SGCM drives throttling, segmentation, and quarantine.  
Surface Engines: SGCM constrains reachable surfaces and allowable actions.  
Capture‑Net: SGCM attaches to files, flows, and producers/consumers.

SGCM updates on policy shifts, topology changes, dependency changes, and dynamism spikes. Runtime drift triggers segmentation or quarantine.

5. Extensions  
Temporal SGCM: track compatibility over time to detect drift.  
Scenario SGCM: evaluate compatibility under shocks (vendor outage, legal change, adversarial campaigns).  
Crowd‑Level SGCM: aggregate compatibility across cohorts to identify fragile regions of the sovereign geometry.  
Policy Feedback Loop: use SGCM distributions to refine sovereign constraints and topology.
</data>
