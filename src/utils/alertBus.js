// Lets non-React code such as the API client raise the in-app Alert, which App owns
let listener = null;

export const setAlertListener = (fn) => {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
};

export const showAlert = (conf) => {
  if (listener) listener({ display: true, ...conf });
  else console.warn('Alert raised before App mounted:', conf);
};
