export const SESSION_EXPIRED = 'SESSION_EXPIRED';

// Turns a failed API call into an alert the user can act on. `action` completes "we couldn't ...",
// such as "load your boards". Raw axios messages ("Request failed with status code 500") mean nothing to users.
export const describeApiError = (err, action = 'complete that') => {
  const status = err?.response?.status;

  if (err?.code === SESSION_EXPIRED || status === 401) {
    return {
      title: 'Session expired 🔒',
      textValue: `You've been signed out, so we couldn't ${action}. Sign in again to carry on.`,
      signIn: true,
    };
  }

  // Anything else, such as a failed IndexedDB read, says nothing about the network
  if (!err?.isAxiosError) {
    return {
      title: 'Something went wrong 💀',
      textValue: `We couldn't ${action}. Please try again.`,
    };
  }

  if (!err.response) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return {
      title: offline ? "You're offline 📡" : 'Connection problem 📡',
      textValue: offline
        ? `We couldn't ${action} because you appear to be offline. Check your connection and try again.`
        : `We couldn't reach ListPal to ${action}. Check your connection and try again.`,
    };
  }

  if (status === 403) {
    return {
      title: 'Not allowed 🚫',
      textValue: `You don't have permission to ${action}. Try refreshing the page, or sign in again.`,
    };
  }

  if (status === 404) {
    return {
      title: 'Not found 🔍',
      textValue: `We couldn't ${action} because it no longer exists. It may have been deleted on another device. Try refreshing the page.`,
    };
  }

  if (status === 429) {
    return {
      title: 'Slow down ⏳',
      textValue: `Too many requests at once, so we couldn't ${action}. Wait a moment and try again.`,
    };
  }

  if (status >= 500) {
    return {
      title: 'Something went wrong 💀',
      textValue: `Something went wrong on our side and we couldn't ${action}. Please try again in a moment.`,
    };
  }

  return {
    title: 'Something went wrong 💀',
    textValue: `We couldn't ${action}. Please try again.`,
  };
};

// The /logout route clears the stale tokens and sends the user to the sign-in page. Queued edits live in
// IndexedDB, which logout leaves alone, so they are sent once the user is back.
export const apiErrorAlert = (err, action) => {
  const { signIn, ...conf } = describeApiError(err, action);
  if (!signIn) return conf;
  return { ...conf, actionLabel: 'Sign in', onAction: () => window.location.assign('/logout') };
};
