import { updateThemeAPI } from '../utils/apiGatewayClient';
import './ThemeCard.css'

const ThemeCard = ({ name, setUserDetails, highlight }) => {
  // console.log("rendering: ThemeCard")
  const nameMap = {
    "purple-haze": "Purple Haze",
    "granite": "Granite",
    "aqua-mentos": "Aqua Mentos",
    "cherry-violet": "Cherry Violet"
  }

  const handleChoice = () => {
    setUserDetails(current => {
      let tmpUserDetails = { ...current };
      tmpUserDetails.Theme = name;
      return tmpUserDetails
    });
    updateThemeAPI(name).then(() => {
    })
  };

  return (
    <div
      className="theme-card-wrapper"
      onClick={handleChoice}
      style={{
        backgroundColor: `var(--${name}-bg)`,
        color: `var(--${name}-text-colour)`,
        borderColor: `var(--${name}-accent-2)`
      }}
    >
      <div className={`selected-indicator ${highlight ? "selected-indicator-display" : null}`}></div>
      <h2 style={{ color: `var(--${name}-accent)` }}>{nameMap[name]}</h2>
      <div className="theme-card-inner-wrapper" style={{ backgroundColor: `var(--${name}-fg)`, color: `var(--${name}-text-colour)` }}>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris iaculis semper pharetra.</p>
      </div>
    </div>
  );
};

export default ThemeCard;
