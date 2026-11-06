import { memo } from 'react';
import { updateRewordToneAPI } from '../utils/apiGatewayClient';
import { aiFeaturesEnabled } from '../utils/aiFeatures';
import { DEFAULT_REWORD_TONE, REWORD_SAMPLE_TASK, REWORD_TONES } from '../utils/rewordTones';
import { saveUserSetting } from '../utils/userDetails';
import './ThemeCard.css';
import './RewordToneSetter.css';

const RewordToneSetter = ({ userDetails, setUserDetails }) => {
  const selected = userDetails?.RewordTone ?? DEFAULT_REWORD_TONE;
  // Still shown while AI is off, so the user can see the tone they'd get back if they turn it on
  const disabled = !aiFeaturesEnabled(userDetails);

  const handleChoice = (tone) => saveUserSetting(setUserDetails, 'RewordTone', tone, updateRewordToneAPI);

  return (
    <section className={`page-section ${disabled ? "reword-tone-disabled" : ""}`}>
      <div className="page-section-header reword-tone-header">
        <h2>✨ AI reword tone</h2>
        <span>Sample task: “{REWORD_SAMPLE_TASK}”</span>
      </div>
      {/* The theme cards' look, without their data-theme, so these show the page's own theme */}
      <div className="tile-grid">
        {REWORD_TONES.map(({ id, label, sample }) => (
          <button key={id} className="theme-card-wrapper" onClick={() => handleChoice(id)} aria-pressed={selected === id} disabled={disabled}>
            {selected === id && <span className="selected-indicator" aria-hidden="true" />}
            <span className="theme-card-header">{label}</span>
            <span className="theme-card-preview reword-tone-sample">{sample}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default memo(RewordToneSetter);
