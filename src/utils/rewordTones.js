import { readStoredUserDetails } from './userDetails';

// Each id is a tone the reword route accepts and the value saved on the user record. A user who never picked one
// gets the default, here and on the server
export const DEFAULT_REWORD_TONE = 'casual';

// Hand-written to follow each tone's rules in the backend's src/reword_tones.js, and never fetched, so opening
// Settings costs no reword quota
export const REWORD_SAMPLE_TASK = 'email boss about friday off';

export const REWORD_TONES = [
  { id: 'casual', label: '😎 Casual', sample: 'Drop the boss an email about Friday off' },
  { id: 'concise', label: '✂️ Concise', sample: 'Email the boss about Friday off' },
  { id: 'formal', label: '👔 Formal', sample: 'Email the manager regarding leave on Friday' }
];

// Read when a reword starts rather than passed down through Board, which keeps userDetails out of every Card
export const storedRewordTone = () => readStoredUserDetails()?.RewordTone ?? DEFAULT_REWORD_TONE;
