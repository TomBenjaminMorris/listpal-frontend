import { memo } from 'react';
import './Prompt.css';
import './AccountSettings.css';

// A placeholder until ListPal has a real inbox
const FEEDBACK_EMAIL = 'feedback@example.com';
const FEEDBACK_HREF = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('ListPal feedback')}`;

const FeedbackSettings = () => (
  <section className="page-section">
    <div className="page-section-header">
      <h2>💬 Feedback</h2>
    </div>
    <div className="account-rows">
      <div className="account-row feedback-row">
        <div className="account-row-summary">
          <div className="account-row-text">
            <span className="account-row-label">Send feedback</span>
            <span className="account-row-value">Found a bug or have an idea? Email us at {FEEDBACK_EMAIL}.</span>
          </div>
          <a className="prompt-button-cancel account-row-button account-row-link" href={FEEDBACK_HREF}>Email us</a>
        </div>
      </div>
    </div>
  </section>
);

export default memo(FeedbackSettings);
