import './DatePills.css';

// Determine the current ISO week of the year
const getWeek = (date) => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() != 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
};

// Days left after today in the current year
const getDaysRemaining = (date) => {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfYear = new Date(date.getFullYear(), 11, 31);
  return Math.round((endOfYear - today) / 86400000);
};

// Pills showing the week of the year and the days remaining in it
const DatePills = () => {
  const now = new Date();

  return (
    <div className="date-pills">
      <div className="date-pill">
        {`Week of the Year: ${getWeek(now)}`}
      </div>
      <div className="date-pill date-pill-days-remaining">
        {`Days Remaining: ${getDaysRemaining(now)}`}
      </div>
    </div>
  );
};

export default DatePills;
