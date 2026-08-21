async function sendCyberCrowdEntryEmailToNet(email, netEndpoint) {
  return fetch(netEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: email
    })
  });
}
