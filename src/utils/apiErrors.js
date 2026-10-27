export const SESSION_EXPIRED = 'SESSION_EXPIRED';

// Turns a failed API call into an alert the user can act on. `action` completes "we couldn't ...",
// such as "load your boards". Raw axios messages ("Request failed with status code 500") mean nothing to users.
export const describeApiError = (err, action = 'complete that') => {
  const status = err?.response?.status;

  if (err?.code === SESSION_EXPIRED || status === 401) {
    return {
      title: 'Session nodded off 😴',
      textValue: `You've been signed out, so we couldn't ${action}. Sign back in to carry on.`,
      signIn: true,
    };
  }

  // Anything else, such as a failed IndexedDB read, says nothing about the network
  if (!err?.isAxiosError) {
    return {
      title: 'Well, that was odd 🤔',
      textValue: `Something hiccuped and we couldn't ${action}. Give it another go.`,
    };
  }

  if (!err.response) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return {
      title: offline ? "You're offline 📡" : 'Connection hiccup 📡',
      textValue: offline
        ? `The internet seems to have wandered off, so we couldn't ${action}. Check your connection and give it another go.`
        : `We couldn't reach ListPal to ${action}. Check your connection and give it another go.`,
    };
  }

  if (status === 403) {
    return {
      title: 'Hold your horses 🚫',
      textValue: `You don't have permission to ${action}. Try refreshing the page, or signing in again.`,
    };
  }

  if (status === 404) {
    return {
      title: 'Vanished into thin air 🔍',
      textValue: `We couldn't ${action} because it no longer exists. It may have been deleted on another device, so try refreshing the page.`,
    };
  }

  if (status === 429) {
    return {
      title: 'Whoa, easy there ⏳',
      textValue: `Too many requests at once, so we couldn't ${action}. Take a breather and try again in a moment.`,
    };
  }

  if (status >= 500) {
    return {
      title: "Oops, that's on us 🛠️",
      textValue: `Something went wrong on our side and we couldn't ${action}. Give it another go in a moment.`,
    };
  }

  return {
    title: "Well, that didn't work 🙃",
    textValue: `We couldn't ${action}. Give it another go.`,
  };
};

// The /logout route clears the stale tokens and sends the user to the sign-in page. Queued edits live in
// IndexedDB, which logout leaves alone, so they are sent once the user is back.
export const apiErrorAlert = (err, action) => {
  const { signIn, ...conf } = describeApiError(err, action);
  if (!signIn) return conf;
  return { ...conf, actionLabel: 'Sign in', onAction: () => window.location.assign('/logout') };
};
