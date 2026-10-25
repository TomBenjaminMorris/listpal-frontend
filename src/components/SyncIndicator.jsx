import { memo, useEffect, useRef, useState } from 'react';
import { useSyncStatus } from '../utils/syncEngine';
import syncIcon from '../assets/icons8-sync-64.png';
import tickIcon from '../assets/icons8-tick-64.png';

const BACK_ONLINE_DURATION = 3000;

// Owns the sync status subscription so a status change re-renders only this, not the board
const SyncIndicator = memo(() => {
  const syncStatus = useSyncStatus();
  const [showBackOnline, setShowBackOnline] = useState(false);
  const offlineSinceLastSave = useRef(false); // Survives a "Couldn't save" in between, e.g. a flaky reconnect

  // Confirm recovery once queued edits from an offline spell have actually reached the server
  useEffect(() => {
    if (syncStatus.lastError) {
      if (syncStatus.lastError === "Offline") offlineSinceLastSave.current = true;
      setShowBackOnline(false);
      return;
    }
    if (!offlineSinceLastSave.current) return;
    offlineSinceLastSave.current = false;
    setShowBackOnline(true);
    const timer = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_DURATION);
    return () => clearTimeout(timer);
  }, [syncStatus.lastError]);

  return (
    <>
      {syncStatus.lastError && syncStatus.pending > 0 && (
        <div className="sync-pill sync-pill-error fadeIn-animation" role="status">
          {syncStatus.lastError === "Offline" ? "Offline" : "Couldn't save"}, retrying...
        </div>
      )}
      {showBackOnline && !syncStatus.lastError && (
        <div className="sync-pill sync-pill-ok fadeIn-animation" role="status">
          Back online
        </div>
      )}
      <div
        className={`board-local-sync-indicator-wrapper ${syncStatus.lastError ? "sync-error" : ""}`}
        title={syncStatus.lastError ? `${syncStatus.lastError}, will retry...` : syncStatus.pending ? "Saving..." : "Saved"}
      >
        {/* Both icons stay mounted so they load up front; swapping src would fetch the sync icon only once offline */}
        <img className="sync-status-icon spin" src={syncIcon} alt="" hidden={!syncStatus.pending} />
        <img className="sync-status-icon" src={tickIcon} alt="" hidden={!!syncStatus.pending} />
      </div>
    </>
  );
});

export default SyncIndicator;
