import { updateThemeAPI } from '../utils/apiGatewayClient';
import './ThemeCard.css';

const LOREM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris iaculis semper pharetra.";

const ThemeCard = ({ id, label, setUserDetails, highlight }) => {
  const handleChoice = () => {
    setUserDetails(current => {
      const updatedDetails = { ...current, Theme: id };
      localStorage.setItem('userDetails', JSON.stringify(updatedDetails));
      return updatedDetails;
    });

    updateThemeAPI(id).catch(error => {
      console.error('Failed to update theme:', error);
    });
  };

  return (
    <div className="theme-card-wrapper" data-theme={id} onClick={handleChoice}>
      <div className={`selected-indicator ${highlight ? "selected-indicator-display" : ""}`} />
      <h2>{label}</h2>
      <div className="theme-card-inner-wrapper">
        <p>{LOREM_TEXT}</p>
      </div>
    </div>
  );
};

export default ThemeCard;
