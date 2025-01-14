import { memo } from 'react';
import PulseLoader from 'react-spinners/PulseLoader';

const LOADER_STYLE = {
  paddingTop: '50px',
  opacity: '0.8',
};

const Loader = memo(({ sidebarIsOpen }) => (
  <div className={`loadingWrapper ${sidebarIsOpen ? 'with-sidebar' : 'without-sidebar'}`}>
    <PulseLoader
      cssOverride={LOADER_STYLE}
      size={12}
      color="var(--text-colour)"
      speedMultiplier={1}
      aria-label="Loading Spinner"
      data-testid="loader"
    />
  </div>
));

export default Loader;
