import { getDaysRemaining, getWeek } from '../utils/utils';
import './DatePills.css';

// Pills showing the week of the year and the days remaining in it, and optionally today's date
const DatePills = ({ showDate = false }) => {
  const now = new Date();
  const daysRemaining = getDaysRemaining(now);

  return (
    <div className="date-pills">
      {showDate && (
        <div className="date-pill date-pill-date">
          <span>📅</span>
          {now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      )}
      <div className="date-pill date-pill-week">
        <span>🗓️</span>
        {`Week ${getWeek(now)}`}
      </div>
      <div className="date-pill date-pill-days">
        <span>⏳</span>
        {`${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left this year`}
      </div>
    </div>
  );
};

export default DatePills;
