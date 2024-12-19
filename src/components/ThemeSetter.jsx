import { memo } from 'react';
import ThemeCard from './ThemeCard';
import './ThemeSetter.css';

const THEME_OPTIONS = [
  'purple-haze',
  'granite',
  'aqua-mentos',
  'cherry-violet'
];

const ThemeCards = memo(({ userDetails, setUserDetails }) => (
  <div className="theme-card-outer-wrapper">
    {THEME_OPTIONS.map(theme => (
      <ThemeCard
        key={theme}
        name={theme}
        setUserDetails={setUserDetails}
        highlight={userDetails?.Theme === theme}
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
