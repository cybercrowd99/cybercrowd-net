export function createSwarmSessionOrchestrator(options = {}) {
  const sessions = new Map();

  function createSession(sessionId, data = {}) {
    const session = {
      sessionId,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      currentWindow: "index.html",
      state: "active",
      ...data
    };

    sessions.set(sessionId, session);

    return session;
  }

  function getSession(sessionId) {
    return sessions.get(sessionId) || null;
  }

  function updateWindow(sessionId, windowName) {
    const session = sessions.get(sessionId);

    if (!session) {
      return null;
    }

    session.currentWindow = windowName;
    session.lastSeenAt = Date.now();

    return session;
  }

  function updateState(sessionId, state) {
    const session = sessions.get(sessionId);

    if (!session) {
      return null;
    }

    session.state = state;
    session.lastSeenAt = Date.now();

    return session;
  }

  function removeSession(sessionId) {
    return sessions.delete(sessionId);
  }

  function listSessions() {
    return Array.from(sessions.values());
  }

  function count() {
    return sessions.size;
  }

  return {
    createSession,
    getSession,
    updateWindow,
    updateState,
    removeSession,
    listSessions,
    count
  };
}

export default createSwarmSessionOrchestrator;
