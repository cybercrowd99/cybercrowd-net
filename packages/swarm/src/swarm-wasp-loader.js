export function createSwarmWaspLoader(options = {}) {
  const registry = new Map();

  function register(name, loader) {
    if (typeof loader !== "function") {
      throw new Error(`WASP loader for ${name} must be a function.`);
    }

    registry.set(name, loader);
  }

  async function load(name, context = {}) {
    const loader = registry.get(name);

    if (!loader) {
      throw new Error(`Unknown WASP module: ${name}`);
    }

    const result = await loader(context);

    return {
      name,
      loadedAt: Date.now(),
      context,
      result
    };
  }

  function list() {
    return Array.from(registry.keys());
  }

  function exists(name) {
    return registry.has(name);
  }

  return {
    register,
    load,
    list,
    exists
  };
}

export default createSwarmWaspLoader;
