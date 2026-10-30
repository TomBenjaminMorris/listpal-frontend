import { memo } from 'react';
import ThemeCard from './ThemeCard';
import { THEMES } from '../utils/themes';
import './ThemeSetter.css';

const ThemeCards = memo(({ userDetails, setUserDetails }) => (
  <div className="theme-card-outer-wrapper">
    {THEMES.map(({ id, label }) => (
      <ThemeCard
        key={id}
        id={id}
        label={label}
        setUserDetails={setUserDetails}
        highlight={userDetails?.Theme === id}
      />
    ))}
  </div>
));

const ThemeSetter = ({ userDetails, setUserDetails }) => {
  return (
    <div className="theme-setter-wrapper">
      <h2 className="settings-headers">Themes</h2>
      <hr className="settings-line" />
      <ThemeCards
        userDetails={userDetails}
        setUserDetails={setUserDetails}
      />
    </div>
  );
};

export default memo(ThemeSetter);
