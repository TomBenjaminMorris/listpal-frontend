import { memo, useState } from 'react';
import { updateAIEnabledAPI } from '../utils/apiGatewayClient';
import { aiFeaturesEnabled } from '../utils/aiFeatures';
import { saveEnforcedUserSetting } from '../utils/userDetails';
import './AccountSettings.css';
import './AISettings.css';

const AISettings = ({ userDetails, setUserDetails }) => {
  const enabled = aiFeaturesEnabled(userDetails);
  // Locked until the save settles, so a second flip can't race the first and a failure flips back to a known value.
  // aria-disabled rather than disabled, which would drop keyboard focus from the switch mid-save
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    if (saving) return;
    setSaving(true);
    await saveEnforcedUserSetting(setUserDetails, 'AIEnabled', !enabled, enabled, updateAIEnabledAPI);
    setSaving(false);
  };

  return (
    <section className="page-section">
      <div className="page-section-header">
        <h2>🤖 AI features</h2>
      </div>
      <div className="account-rows">
        <div className="account-row ai-settings-row">
          <div className="account-row-summary">
            <div className="account-row-text">
              <span className="account-row-label" id="ai-features-label">Use AI features</span>
              <span className="account-row-value" id="ai-features-description">
                Such as rewording a task. The task's text, category and board name are sent to OpenAI.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              className="ai-switch"
              aria-checked={enabled}
              aria-labelledby="ai-features-label"
              aria-describedby="ai-features-description"
              aria-busy={saving}
              aria-disabled={saving}
              onClick={handleToggle}
            >
              <span className="ai-switch-thumb" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default memo(AISettings);
