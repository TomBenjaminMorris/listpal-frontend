import { updateThemeAPI } from '../utils/apiGatewayClient';
import { saveUserSetting } from '../utils/userDetails';
import './ThemeCard.css';

const ThemeCard = ({ id, label, setUserDetails, highlight }) => {
  const handleChoice = () => saveUserSetting(setUserDetails, 'Theme', id, updateThemeAPI);

  return (
    <button className="theme-card-wrapper" data-theme={id} onClick={handleChoice} aria-pressed={highlight}>
      {highlight && <span className="selected-indicator" aria-hidden="true" />}
      <span className="theme-card-header">{label}</span>
      <span className="theme-card-preview" aria-hidden="true">
        <span className="theme-card-pills">
          <span className="theme-card-pill theme-card-pill-accent">Today</span>
          <span className="theme-card-pill theme-card-pill-accent-2">Week 44</span>
        </span>
        <span className="theme-card-figures">4 of 7 this week</span>
        <span className="theme-card-meter meter"><span /></span>
      </span>
    </button>
  );
};

export default ThemeCard;
