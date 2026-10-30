import { describe, it, expect } from 'vitest';
import { applyManualScore, parseScoreInput } from './utils';

describe('parseScoreInput', () => {
  it.each([['05', '5'], ['0100', '100'], ['0234', '234'], ['00', '0']])('strips leading zeros from %s', (input, expected) => {
    expect(parseScoreInput(input)).toBe(expected);
  });

  it.each(['0', '', '7', '100'])('keeps %j as it is', input => {
    expect(parseScoreInput(input)).toBe(input);
  });

  it.each(['-5', 'abc', '1.5', '1e3', ' 5', '5a'])('rejects %j', input => {
    expect(parseScoreInput(input)).toBeNull();
  });
});

const scores = (WScore, MScore, YScore) => ({ WScore, MScore, YScore });

describe('applyManualScore', () => {
  it('lifts monthly and yearly when weekly is raised above them', () => {
    expect(applyManualScore(scores(0, 0, 0), 'WScore', '5')).toEqual(scores('5', 5, 5));
  });

  it('lifts only yearly when monthly is raised above it, leaving weekly alone', () => {
    expect(applyManualScore(scores(0, 0, 0), 'MScore', '5')).toEqual(scores(0, '5', 5));
  });

  it('lifts only the periods that are below the new score', () => {
    expect(applyManualScore(scores(0, 3, 20), 'WScore', '5')).toEqual(scores('5', 5, 20));
  });

  it('leaves the other scores alone when a score is lowered', () => {
    expect(applyManualScore(scores(5, 5, 5), 'WScore', '3')).toEqual(scores('3', 5, 5));
  });

  it('never changes a shorter period when yearly is edited', () => {
    expect(applyManualScore(scores(5, 5, 5), 'YScore', '2')).toEqual(scores(5, 5, '2'));
  });

  it('compares numerically, as a saved score can be a string', () => {
    expect(applyManualScore(scores(0, '10', '9'), 'WScore', '9')).toEqual(scores('9', '10', '9'));
  });
});
