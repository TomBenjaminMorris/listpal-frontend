import { describe, it, expect, vi } from 'vitest';

vi.mock('./syncEngine', () => ({ queueBoardUpdate: vi.fn() }));

import { queueBoardUpdate } from './syncEngine';
import { applyManualScore, parseScoreInput, nextRewordChoice, rewordToApply, newTask, saveBoardSettings, UNTICKED } from './utils';

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

describe('rewordToApply', () => {
  it('applies a different reply to unchanged text', () => {
    expect(rewordToApply('dentist thing', 'dentist thing', 'Book the dentist')).toBe('Book the dentist');
  });

  it('drops the reply if the text changed while it was in flight', () => {
    expect(rewordToApply('dentist thing', 'dentist thing and the vet', 'Book the dentist')).toBeNull();
  });

  it('drops a reply that is no different', () => {
    expect(rewordToApply('Call the dentist', 'Call the dentist', 'Call the dentist')).toBeNull();
  });

  it('drops an empty reply', () => {
    expect(rewordToApply('dentist thing', 'dentist thing', '')).toBeNull();
    expect(rewordToApply('dentist thing', 'dentist thing', undefined)).toBeNull();
  });
});

describe('nextRewordChoice', () => {
  it('reverts a first reword to the text that was sent', () => {
    expect(nextRewordChoice(null, 'Renew passport', 'Update passport details'))
      .toEqual({ original: 'Renew passport', reworded: 'Update passport details' });
  });

  it("keeps the user's own text through a second reword", () => {
    const first = { original: 'Renew passport', reworded: 'Update passport details' };
    expect(nextRewordChoice(first, 'Update passport details', 'Renew your passport'))
      .toEqual({ original: 'Renew passport', reworded: 'Renew your passport' });
  });

  it('starts afresh when the text no longer matches the last reword', () => {
    const stale = { original: 'Renew passport', reworded: 'Update passport details' };
    expect(nextRewordChoice(stale, 'Call the vet', 'Phone the vet'))
      .toEqual({ original: 'Call the vet', reworded: 'Phone the vet' });
  });

  it("offers nothing to revert when a reword gives back the user's own text", () => {
    const first = { original: 'Renew passport', reworded: 'Update passport details' };
    expect(nextRewordChoice(first, 'Update passport details', 'Renew passport')).toBeNull();
  });
});

describe('newTask', () => {
  it('has every field a task created through /sync has, unticked', () => {
    const task = newTask({ boardID: 'b#1', category: 'Home', emoji: '🏠' });
    expect(Object.keys(task).sort()).toEqual(['CompletedDate', 'CreatedDate', 'Description', 'Emoji', 'EntityType', 'ExpiryDate', 'ExpiryDateTTL', 'GSI1-PK', 'GSI1-SK', 'Important', 'Link', 'PK', 'SK', 'Category'].sort());
    expect(task).toMatchObject({ ...UNTICKED, 'GSI1-PK': 'b#1', Category: 'Home', Emoji: '🏠', Description: '', Link: '', Important: 'false', EntityType: 'Task' });
    expect(task.SK).toMatch(/^t#[0-9a-f-]{36}$/);
    expect(Number(task.CreatedDate)).toBeGreaterThan(0);
  });

  it("takes a split or duplicate's text, link, importance and place", () => {
    const task = newTask({ boardID: 'b#1', category: 'Home', emoji: '🏠', createdDate: '1.5', description: 'Call', link: 'https://x.dev', important: 'true' });
    expect(task).toMatchObject({ CreatedDate: '1.5', Description: 'Call', Link: 'https://x.dev', Important: 'true' });
  });

  it('gives every task its own ID', () => {
    expect(newTask({}).SK).not.toBe(newTask({}).SK);
  });
});

describe('saveBoardSettings', () => {
  const run = (fields) => {
    let boards = [{ SK: 'b#1', Board: 'Old' }, { SK: 'b#2', Board: 'Other' }];
    saveBoardSettings(update => { boards = update(boards); }, 'b#1', fields);
    return boards;
  };

  it('changes only that board on screen and queues the same fields', () => {
    expect(run({ Board: 'New', Emoji: '🎯' })).toEqual([{ SK: 'b#1', Board: 'New', Emoji: '🎯' }, { SK: 'b#2', Board: 'Other' }]);
    expect(queueBoardUpdate).toHaveBeenLastCalledWith('b#1', { Board: 'New', Emoji: '🎯' });
  });

  it('keeps the category order parsed on screen but queues it as the JSON string the server stores', () => {
    expect(run({ CategoryOrder: ['A', 'B'] })[0].CategoryOrder).toEqual(['A', 'B']);
    expect(queueBoardUpdate).toHaveBeenLastCalledWith('b#1', { CategoryOrder: '["A","B"]' });
  });
});
