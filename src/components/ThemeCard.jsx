import { updateThemeAPI } from '../utils/apiGatewayClient';
import './ThemeCard.css';

const THEME_NAMES = {
  "purple-haze": "Purple Haze",
  "granite": "Granite",
  "aqua-mentos": "Aqua Mentos",
  "cherry-violet": "Cherry Violet"
};

const LOREM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris iaculis semper pharetra.";

const ThemeCard = ({ name, setUserDetails, highlight }) => {
  const styles = {
    wrapper: { backgroundColor: `var(--${name}-bg)`, color: `var(--${name}-text-colour)`, borderColor: `var(--${name}-accent-2)` },
    heading: { color: `var(--${name}-accent)` },
    inner: { backgroundColor: `var(--${name}-fg)`, color: `var(--${name}-text-colour)` }
  };

  const handleChoice = () => {
    setUserDetails(current => {
      const updatedDetails = { ...current, Theme: name };
      localStorage.setItem('userDetails', JSON.stringify(updatedDetails));
      return updatedDetails;
    });

    updateThemeAPI(name).catch(error => {
      console.error('Failed to update theme:', error);
    });
  };

  return (
    <div className="theme-card-wrapper" onClick={handleChoice} style={styles.wrapper}    >
      <div className={`selected-indicator ${highlight ? "selected-indicator-display" : ""}`} />
      <h2 style={styles.heading}>
        {THEME_NAMES[name]}
      </h2>
      <div className="theme-card-inner-wrapper" style={styles.inner}>
        <p>{LOREM_TEXT}</p>
      </div>
    </div>
  );
};

export default ThemeCard;
