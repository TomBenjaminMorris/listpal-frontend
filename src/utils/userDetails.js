// The user record from GET /user, kept so a reload shows the user's theme before the record arrives
const STORAGE_KEY = 'userDetails';

// Null when nothing usable is stored, or storage is blocked
export const readStoredUserDetails = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

export const storeUserDetails = details => localStorage.setItem(STORAGE_KEY, JSON.stringify(details));

const applyUserSetting = (setUserDetails, field, value) => setUserDetails(current => {
  const updated = { ...current, [field]: value };
  storeUserDetails(updated);
  return updated;
});

// A setting such as the theme applies at once, and a failed save is only logged, as it still holds on this device
export const saveUserSetting = (setUserDetails, field, value, save) => {
  applyUserSetting(setUserDetails, field, value);
  save(value).catch(error => console.error(`Failed to update ${field}:`, error));
};

// For a setting the server enforces, such as the AI opt-out, where the device must not show a value the server never
// got. It still applies at once, but a failed save puts back the value from before. Settles either way
export const saveEnforcedUserSetting = async (setUserDetails, field, value, previous, save) => {
  applyUserSetting(setUserDetails, field, value);
  try {
    await save(value);
  } catch (error) {
    console.error(`Failed to update ${field}:`, error);
    applyUserSetting(setUserDetails, field, previous);
  }
};
