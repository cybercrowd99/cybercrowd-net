export function createSwarmIdentityContinuity(options = {}) {
  const identities = new Map();

  function register(identityId, data = {}) {
    const identity = {
      identityId,
      registeredAt: Date.now(),
      lastSeenAt: Date.now(),
      trustBand: "guest",
      status: "active",
      ...data
    };

    identities.set(identityId, identity);

    return identity;
  }

  function get(identityId) {
    return identities.get(identityId) || null;
  }

  function update(identityId, updates = {}) {
    const identity = identities.get(identityId);

    if (!identity) {
      return null;
    }

    Object.assign(identity, updates);
    identity.lastSeenAt = Date.now();

    return identity;
  }

  function touch(identityId) {
    const identity = identities.get(identityId);

    if (!identity) {
      return null;
    }

    identity.lastSeenAt = Date.now();

    return identity;
  }

  function remove(identityId) {
    return identities.delete(identityId);
  }

  function list() {
    return Array.from(identities.values());
  }

  function count() {
    return identities.size;
  }

  return {
    register,
    get,
    update,
    touch,
    remove,
    list,
    count
  };
}

export default createSwarmIdentityContinuity;
