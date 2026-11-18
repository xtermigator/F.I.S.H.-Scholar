import { describe, it, expect } from 'vitest';
import { bodyDoubleReducer as reduce, newBodyDouble, focusSecondsLeft, checkInIsDue, readBodyDouble } from './bodyDouble';

function running() {
  const ready = reduce(newBodyDouble(10), { type: 'configure', patch: { goal: 'Read one paragraph' }, now: 0 });
  return reduce(ready, { type: 'start', now: 1000 });
}

describe('body double session', () => {
  it('requires the student to name a goal and starts without invented steps', () => {
    const ready = newBodyDouble();
    expect(ready.steps).toEqual([]);
    expect(reduce(ready, { type: 'start', now: 0 }).status).toBe('ready');
  });
  it('uses elapsed wall time after a suspended tab, not the number of timer ticks', () => {
    const session = running();
    expect(focusSecondsLeft(session, 91000)).toBe(510);
    expect(focusSecondsLeft(session, 9999999)).toBe(0);
  });
  it('pauses time and resumes with the correct remaining duration', () => {
    const paused = reduce(running(), { type: 'pause', now: 91000 });
    expect(focusSecondsLeft(paused, 900000)).toBe(510);
    const resumed = reduce(paused, { type: 'start', now: 900000 });
    expect(focusSecondsLeft(resumed, 905000)).toBe(505);
  });
  it('restores a running session with its original deadline and completes once', () => {
    const restored = readBodyDouble(JSON.parse(JSON.stringify(running())))!;
    expect(focusSecondsLeft(restored, 91000)).toBe(510);
    const completed = reduce(restored, { type: 'finish', now: 601000 });
    expect(reduce(completed, { type: 'finish', now: 602000 }).completedBlocks).toBe(1);
  });
  it('offers one check-in and schedules the next one from the actual elapsed time', () => {
    const session = running();
    expect(checkInIsDue(session, 300000)).toBe(false);
    expect(checkInIsDue(session, 301000)).toBe(true);
    const checked = reduce(session, { type: 'check-in', response: 'on-track', now: 310000 });
    expect(checkInIsDue(checked, 311000)).toBe(false);
    expect(checked.nextCheckIn).toBe(609);
  });
  it('pauses when stuck, defers without pausing, and honors check-ins off', () => {
    expect(reduce(running(), { type: 'check-in', response: 'stuck', now: 91000 }).status).toBe('paused');
    const deferred = reduce(running(), { type: 'check-in', response: 'later', now: 301000 });
    expect(deferred.status).toBe('running');
    expect(checkInIsDue(deferred, 360000)).toBe(false);
    expect(checkInIsDue(deferred, 361000)).toBe(true);
    const quiet = reduce(running(), { type: 'configure', patch: { checkInSeconds: 0 }, now: 301000 });
    expect(checkInIsDue(quiet, 500000)).toBe(false);
  });
  it('changes cadence relative to the current time rather than the original start', () => {
    const changed = reduce(running(), { type: 'configure', patch: { checkInSeconds: 120 }, now: 351000 });
    expect(changed.nextCheckIn).toBe(470);
    expect(checkInIsDue(changed, 400000)).toBe(false);
    expect(checkInIsDue(changed, 471000)).toBe(true);
  });
  it('protects the active goal from a changed selection and preserves steps on reset', () => {
    let session = reduce(running(), { type: 'configure', patch: { goal: 'Different task', assignmentId: 'new-course' }, now: 1001 });
    expect(session.goal).toBe('Read one paragraph');
    session = reduce(session, { type: 'add-step', id: 'one', text: 'Open notes' });
    session = reduce(session, { type: 'toggle-step', id: 'one' });
    session = reduce(session, { type: 'park', id: 'idea', text: 'Look at another source later' });
    const reset = reduce(session, { type: 'reset' });
    expect(reset.steps[0].completed).toBe(true);
    expect(reset.parked).toHaveLength(1);
    expect(reset.remainingSeconds).toBe(600);
  });
  it('rejects invalid persisted timers and incomplete stored structures', () => {
    expect(readBodyDouble({ ...running(), deadline: null })).toBeNull();
    expect(readBodyDouble({ ...running(), remainingSeconds: -1 })).toBeNull();
    expect(readBodyDouble({ ...running(), steps: [null] })).toBeNull();
    expect(readBodyDouble({ ...running(), tone: 'unknown' })).toBeNull();
  });
});
