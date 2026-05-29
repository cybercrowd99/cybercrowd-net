import { heartbeat } from './surface-heartbeat.js';
import { applyContinuity } from './surface-continuity-engine.js';
import { renderFrame } from './surface-render-pipeline.js';
import { emitFrame } from './surface-output-driver.js';
import { runLifecycleHooks } from './surface-lifecycle-hooks.js';

export class SurfaceLifecycle {
    constructor() {
        this.lastTick = 0;
        this.running = false;
    }

    start() {
        if (this.running) return;
        this.running = true;

        heartbeat.onTick((ts) => {
            this.lastTick = ts;

            const continuityState = applyContinuity(ts);
            const renderedFrame = renderFrame(continuityState);
            emitFrame(renderedFrame);

            runLifecycleHooks(ts, continuityState, renderedFrame);
        });
    }

    stop() {
        if (!this.running) return;
        this.running = false;
        heartbeat.stop();
    }
}

export const surfaceLifecycle = new SurfaceLifecycle();
surfaceLifecycle.start();
