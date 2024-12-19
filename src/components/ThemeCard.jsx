import { memo, useCallback, useMemo } from 'react';
import { updateThemeAPI } from '../utils/apiGatewayClient';
import './ThemeCard.css';

const THEME_NAMES = {
  "purple-haze": "Purple Haze",
  "granite": "Granite",
  "aqua-mentos": "Aqua Mentos",
  "cherry-violet": "Cherry Violet"
};

const LOREM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris iaculis semper pharetra.";

const ThemeCard = memo(({ name, setUserDetails, highlight }) => {
  // Memoize styles that depend on the theme name
  const styles = useMemo(() => ({
    wrapper: { backgroundColor: `var(--${name}-bg)`, color: `var(--${name}-text-colour)`, borderColor: `var(--${name}-accent-2)` },
    heading: { color: `var(--${name}-accent)` },
    inner: { backgroundColor: `var(--${name}-fg)`, color: `var(--${name}-text-colour)` }
  }), [name]);

  // Memoize the handler to prevent recreating on every render
  const handleChoice = useCallback(() => {
    setUserDetails(current => {
      const updatedDetails = { ...current, Theme: name };
      localStorage.setItem('userDetails', JSON.stringify(updatedDetails));
      return updatedDetails;
    });

    updateThemeAPI(name).catch(error => {
      console.error('Failed to update theme:', error);
    });
  }, [name, setUserDetails]);

  return (
    <div
      className="theme-card-wrapper"
      onClick={handleChoice}
      style={styles.wrapper}
    >
      <div className={`selected-indicator ${highlight ? "selected-indicator-display" : ""}`} />
      <h2 style={styles.heading}>
        {THEME_NAMES[name]}
      </h2>
      <div className="theme-card-inner-wrapper" style={styles.inner}      >
        <p>{LOREM_TEXT}</p>
      </div>
    </div>
  );
});

export default ThemeCard;
