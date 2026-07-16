// net/auth-echo.route.js

import authEcho from '../functions/auth-echo'; // your file

export default async function AuthEchoRoute(req) {
  const result = await authEcho({ request: req });

  return {
    lane: 'AuthEchoMoment',
    surface: 'auth',
    timestamp: Date.now(),
    payload: await result.json()
  };
}
