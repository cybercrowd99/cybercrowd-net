import shadowIndex from "./shadow-index-worker";
import nullField from "./null-field-worker";
import blindRelay from "./blind-relay-worker";
import ballisticDummy from "./ballistic-dummy-worker";
import ballisticOrgan from "./ballistic-dummy-organ";
import epoxyWorker from "./epoxy-window-worker";
import epoxyOrgan from "./epoxy-analysis-organ";
import spongeLayer from "./sponge-layer-worker";
import dispositionOrgan from "./disposition-organ";
import trojanReflection from "./trojan-reflection-organ";

export default {
  /**
   * Organism Dispatcher
   * -------------------
   * Central routing brainstem for the defense organism.
   * Receives an event, passes it through each organ in sequence,
   * and returns the final transformed state.
   */

  async dispatch(event, env) {
    let current = event;

    current = shadowIndex.handle?.(current, env) ?? current;
    current = nullField.handle?.(current, env) ?? current;
    current = blindRelay.handle?.(current, env) ?? current;

    current = ballisticDummy.handle?.(current, env) ?? current;
    current = ballisticOrgan.handle?.(current, env) ?? current;

    current = await epoxyWorker.fetch?.(current, env) ?? current;
    current = await epoxyOrgan.analyze?.(current?.id, env) ?? current;

    current = spongeLayer.handle?.(current, env) ?? current;

    current = dispositionOrgan.route?.(current?.id, env) ?? current;

    current = trojanReflection.handle?.(current, env) ?? current;

    return current;
  }
};
