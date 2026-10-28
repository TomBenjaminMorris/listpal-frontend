import { memo } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';

const LOADER_STYLE = {
  paddingTop: '50px',
  opacity: '0.8',
};

// No top padding here, or the dots sit below the sign-in logo they replace
const FULL_SCREEN_LOADER_STYLE = {
  opacity: '0.8',
};

const Loader = memo(({ fullScreen = false }) => (
  <div className={fullScreen ? 'loadingWrapper fullScreen' : 'loadingWrapper'}>
    <PulseLoader
      cssOverride={fullScreen ? FULL_SCREEN_LOADER_STYLE : LOADER_STYLE}
      size={12}
      color="var(--text-colour)"
      speedMultiplier={1}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  </div>
));

export default Loader;
