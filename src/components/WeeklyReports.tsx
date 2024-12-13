import { CSSProperties, useEffect, useState } from 'react';
import PulseLoader from "react-spinners/PulseLoader";
import './HomePage.css';
import { getReports } from '../utils/apiGatewayClient';

const override: CSSProperties = {
  paddingTop: "50px",
  opacity: "0.8",
};

const WeeklyReports = ({ sidebarIsOpen, isLoading }) => {
  const [reports, setReports] = useState([{ SK: "default-id", Score: 0, Summary: [{ category: "", summary: "" }] }]);

  useEffect(() => {
    document.title = "ListPal | Weekly Reports";
    getReports().then((r) => {
      setReports(r.map(({ SK, Score, Summary }) => {
        const parsedSummary = JSON.parse(Summary);
        return { SK, Score, Summary: parsedSummary.summaries };
      }));
    });
  }, []);

  const renderReports = reports.map(({ SK, Score, Summary }) => (
    <div key={SK}>
      <div>Points This Week: {Score}</div>
      <h2>Summary</h2>
      {Summary.map(({ category, summary }) => (
        <div key={category}>
          <div>{category}</div>
          <div>{summary}</div>
        </div>
      ))}
    </div>
  ));

  const loader = (
    <div className="loadingWrapper">
      <PulseLoader
        cssOverride={override}
        size={12}
        color={"var(--text-colour)"}
        speedMultiplier={1}
        aria-label="Loading Spinner"
      />
    </div>
  );

  const content = (
    <div className="home-page-content-wrapper" style={{ paddingLeft: sidebarIsOpen ? "250px" : "80px" }}>
      <div className="home-page-content-sub-wrapper fadeUp-animation">
        <h2>Weekly Reports 📝</h2>
        {renderReports}
      </div>
    </div>
  );

  return <div className="wrapper">{isLoading ? loader : content}</div>;
};

export default WeeklyReports;


// import { CSSProperties, useEffect, useState } from 'react';
// import PulseLoader from "react-spinners/PulseLoader";
// import './HomePage.css'
// import { getReports } from '../utils/apiGatewayClient';

// const override: CSSProperties = {
//   paddingTop: "50px",
//   opacity: "0.8",
// };

// const WeeklyReports = ({ sidebarIsOpen, isLoading, setPromptConf, setAlertConf }) => {
//   const [reports, setReports] = useState([{ SK: "default-id", Score: 0, Summary: [{category: "", summary: ""}] }]);

//   useEffect(() => {
//     document.title = "ListPal | Weekly Reports";
//     loadReports()
//   }, [])

//   const loadReports = () => {
//     getReports().then((r) => {
//       setReports(r.map(tmpR => {
//         const tmpS = JSON.parse(tmpR.Summary)
//         return { SK: tmpR.SK, Score: tmpR.Score, Summary: tmpS.summaries }
//       }))
//     })
//   }

//   const reportsRendered = reports.map(function (r) {
//     return <div key={r.SK}>
//       <div>{r.Score}</div>
//       {r.Summary.map(rs => {
//         return <div>
//           <div>{rs.category}</div>
//           <div>{rs.summary}</div>
//         </div>
//       })}
//     </div>
//   });

//   const content = (
//     <>
//       <div className="home-page-content-wrapper" style={{ paddingLeft: `${sidebarIsOpen ? "250px" : "80px"}` }}>
//         <div className="home-page-content-sub-wrapper fadeUp-animation">
//           <h2>Weekly Reports 📝</h2>
//           {reportsRendered}
//         </div>
//       </div>
//     </>
//   )

//   const loader = (
//     <div className="loadingWrapper">
//       <PulseLoader
//         cssOverride={override}
//         size={12}
//         color={"var(--text-colour)"}
//         speedMultiplier={1}
//         aria-label="Loading Spinner"
//         data-testid="loader"
//       />
//     </div>
//   )

//   return (
//     <div className="wrapper">
//       {isLoading ? loader : content}
//     </div>
//   );
// };

// export default WeeklyReports;

