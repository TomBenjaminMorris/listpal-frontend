import { memo } from 'react';
import ThemeCard from './ThemeCard';
import { THEMES } from '../utils/themes';

const ThemeCards = memo(({ userDetails, setUserDetails }) => (
  <div className="tile-grid">
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
    <section className="page-section">
      <div className="page-section-header">
        <h2>🎨 Themes</h2>
      </div>
      <ThemeCards
        userDetails={userDetails}
        setUserDetails={setUserDetails}
      />
    </section>
  );
};

export default memo(ThemeSetter);
