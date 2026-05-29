export const LIFECYCLE_PHASE = {
  POST_CYCLE: "post_cycle",
};

export class SurfaceLifecycleHookRail {
  constructor() {
    this._hooks = {
      [LIFECYCLE_PHASE.POST_CYCLE]: [],
    };
  }

  register(phase, fn, id) {
    if (!this._hooks[phase]) return;
    const list = this._hooks[phase];
    const hookId = id || `hook_${phase}_${list.length + 1}`;
    list.push({ id: hookId, fn });
  }

  unregister(phase, id) {
    if (!this._hooks[phase]) return;
    this._hooks[phase] = this._hooks[phase].filter((h) => h.id !== id);
  }

  async runPostCycle(context) {
    const hooks = this._hooks[LIFECYCLE_PHASE.POST_CYCLE];
    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      await hook.fn(context);
    }
  }
}
