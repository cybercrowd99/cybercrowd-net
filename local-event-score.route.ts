// net/local-event-score.route.ts

import { computeLocalEventScore } from '../organs/local-event-score-organ';

export default async function LocalEventScoreRoute(req) {
  const event = req.body.event;
  const history = req.body.history;
  const signals = req.body.signals;

  const packet = computeLocalEventScore(event, history, signals);

  return {
    lane: 'LESScoreMoment',
    surface: 'event-forecast',
    timestamp: Date.now(),
    payload: packet
  };
}
