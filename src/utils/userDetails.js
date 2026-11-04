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

// A setting such as the theme applies at once, and a failed save is only logged, as it still holds on this device
export const saveUserSetting = (setUserDetails, field, value, save) => {
  setUserDetails(current => {
    const updated = { ...current, [field]: value };
    storeUserDetails(updated);
    return updated;
  });
  save(value).catch(error => console.error(`Failed to update ${field}:`, error));
};
