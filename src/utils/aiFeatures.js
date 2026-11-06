import { readStoredUserDetails } from './userDetails';

// One opt-out covers every AI feature, so each new one checks this before it shows. On unless the user turned it
// off, which matches the server's check in the backend's src/ai_features.js
export const aiFeaturesEnabled = userDetails => userDetails?.AIEnabled !== false;

// Read when an AI feature is offered, as storedRewordTone is, rather than passed down through Board to every Task
export const storedAIFeaturesEnabled = () => aiFeaturesEnabled(readStoredUserDetails());
