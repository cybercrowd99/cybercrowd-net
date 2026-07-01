// moment-packet-shaping.js
// CyberCrowd Mobile Physics Prototype
// Moment Packet Shaper
//
// Owns:
// - shaping discrete packets into time-aware flows
// - rate limiting
// - burst smoothing
// - windowed emission control
// - queue inspection
// - emitted-window inspection
// - normalized continuity metadata
//
// Does NOT own:
// - touch physics math
// - vessel activation state
// - visual effects
// - identity authority
// - login authority
// - server session authority
// - EAT minting
// - cookie creation
// - KV writes

/**
 * MomentPacketShaper
 * Shapes discrete packets, events, samples, or frames into time-aware flows.
 */
export class MomentPacketShaper {
  constructor(options = {}) {
    const {
      maxRatePerSecond = 60,
      burstSize = 10,
      windowMs = 1000,
      now = () => Date.now(),
    } = options;

    this.maxRatePerSecond = maxRatePerSecond;
    this.burstSize = burstSize;
    this.windowMs = windowMs;
    this.now = now;

    this._queue = [];
    this._emitted = [];
  }

  /**
   * Push a packet into the shaper.
   * Packet can be any payload; it is wrapped with a timestamp.
   */
  push(packet) {
    const wrapped = {
      t: this.now(),
      payload: packet,
    };

    this._queue.push(wrapped);
    return wrapped;
  }

  /**
   * Compute which packets are allowed to emit right now
   * based on rate, burst, and window.
   */
  emit() {
    const tNow = this.now();
    const windowStart = tNow - this.windowMs;

    // Drop old emitted records outside the active window.
    this._emitted = this._emitted.filter((p) => p.momentAt >= windowStart);

    const allowedInWindow =
      this.maxRatePerSecond * (this.windowMs / 1000);

    const remainingCapacity = Math.max(
      0,
      allowedInWindow - this._emitted.length
    );

    if (remainingCapacity <= 0) return [];

    const toEmitCount = Math.min(
      remainingCapacity,
      this.burstSize,
      this._queue.length
    );

    const packets = this._queue.splice(0, toEmitCount);

    const lastEmitted = this._emitted[this._emitted.length - 1] || null;

    const emittedNow = packets.map((p, index) => {
      const previousRawTime =
        index > 0
          ? packets[index - 1].t
          : lastEmitted
            ? lastEmitted.rawTime
            : null;

      const lastIndex =
        index > 0
          ? index - 1
          : lastEmitted
            ? lastEmitted.index
            : null;

      const fresh = previousRawTime === null;
      const dt = fresh ? 0 : p.t - previousRawTime;

      return {
        momentAt: tNow,
        rawTime: p.t,
        index,
        total: toEmitCount,
        fresh,
        continuity: {
          dt,
          lastIndex,
        },
        payload: p.payload,
      };
    });

    this._emitted.push(...emittedNow);

    return emittedNow;
  }

  /**
   * Peek at queued packets without emitting.
   */
  peekQueue() {
    return [...this._queue];
  }

  /**
   * Peek at emitted packets still inside the active window.
   */
  peekEmitted() {
    return [...this._emitted];
  }

  /**
   * Read current shaper counts.
   */
  getStats() {
    const tNow = this.now();
    const windowStart = tNow - this.windowMs;

    const activeEmitted = this._emitted.filter(
      (p) => p.momentAt >= windowStart
    );

    return {
      queueLength: this._queue.length,
      emittedInWindow: activeEmitted.length,
      maxRatePerSecond: this.maxRatePerSecond,
      burstSize: this.burstSize,
      windowMs: this.windowMs,
      checkedAt: tNow,
    };
  }

  /**
   * Clear all internal state.
   */
  reset() {
    this._queue = [];
    this._emitted = [];

    return {
      ok: true,
      resetAt: this.now(),
    };
  }
}
