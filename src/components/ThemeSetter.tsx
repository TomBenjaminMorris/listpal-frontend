import './ThemeSetter.css'
import ThemeCard from './ThemeCard';

const ThemeSetter = ({ userDetails, setUserDetails }) => {
  // console.log("rendering: ThemeSetter")
  const themeOptions = ['purple-haze', 'granite', 'aqua-mentos', 'cherry-violet'];

  var themeCards = themeOptions.map(function (themeOption) {

    return <ThemeCard
      key={themeOption}
      name={themeOption}
      setUserDetails={setUserDetails}
      highlight={themeOption === userDetails.Theme}
    />
  });

  return (
    <div className="theme-setter-wrapper">
      <h2 className="settings-headers">Themes</h2>
      <hr className="settings-line" />
      <div className="theme-card-outer-wrapper">
        {themeCards}
      </div>
    </div>
  );
};

export default ThemeSetter;
