import { memo, useEffect, useRef, useState } from 'react';
import { useSyncStatus } from '../utils/syncEngine';
import { CheckIcon, SyncIcon } from './Icons';

const BACK_ONLINE_DURATION = 3000;

const statusTitle = ({ lastError, pending }) => {
  if (lastError === "Offline") return "Offline: changes are kept on this device until you're back";
  if (lastError) return "Couldn't save just now, will retry...";
  return pending ? "Saving..." : "All saved";
};

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
          {syncStatus.lastError === "Offline" ? "Offline, will sync later" : "Save hiccup, retrying..."}
        </div>
      )}
      {showBackOnline && !syncStatus.lastError && (
        <div className="sync-pill sync-pill-ok fadeIn-animation" role="status">
          Back online, all caught up
        </div>
      )}
      <div
        className={`board-local-sync-indicator-wrapper ${syncStatus.lastError ? "sync-error" : ""}`}
        title={statusTitle(syncStatus)}
      >
        {syncStatus.pending
          ? <SyncIcon className="sync-status-icon spin" />
          : <CheckIcon className="sync-status-icon" />}
      </div>
    </>
  );
});

export default SyncIndicator;
