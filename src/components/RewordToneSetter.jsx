import { memo } from 'react';
import { updateRewordToneAPI } from '../utils/apiGatewayClient';
import { DEFAULT_REWORD_TONE, REWORD_SAMPLE_TASK, REWORD_TONES } from '../utils/rewordTones';
import './ThemeCard.css';
import './RewordToneSetter.css';

const RewordToneSetter = ({ userDetails, setUserDetails }) => {
  const selected = userDetails?.RewordTone ?? DEFAULT_REWORD_TONE;

  const handleChoice = (tone) => {
    setUserDetails(current => {
      const updatedDetails = { ...current, RewordTone: tone };
      localStorage.setItem('userDetails', JSON.stringify(updatedDetails));
      return updatedDetails;
    });

    updateRewordToneAPI(tone).catch(error => {
      console.error('Failed to update reword tone:', error);
    });
  };

  return (
    <section className="page-section">
      <div className="page-section-header reword-tone-header">
        <h2>✨ AI reword tone</h2>
        <span>Sample task: “{REWORD_SAMPLE_TASK}”</span>
      </div>
      {/* The theme cards' look, without their data-theme, so these show the page's own theme */}
      <div className="theme-card-outer-wrapper">
        {REWORD_TONES.map(({ id, label, sample }) => (
          <button key={id} className="theme-card-wrapper" onClick={() => handleChoice(id)} aria-pressed={selected === id}>
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
