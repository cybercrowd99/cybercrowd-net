function createCyberCrowdEntryUIDLSignal(email) {
  return {
    type: "ENTRY_EMAIL",
    identity: {
      email: email
    }
  };
}
