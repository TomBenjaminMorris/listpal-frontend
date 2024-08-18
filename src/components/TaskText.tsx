// import { useRef, useState, useEffect } from "react";
// import "./TaskText.css";

// export default function TaskText({ initialValue, checked }) {
//   const [value, setValue] = useState(initialValue);
//   const textAreaRef = useRef<HTMLTextAreaElement>(null);

//   const useAutosizeTextArea = (
//     textAreaRef: HTMLTextAreaElement | null,
//     value: string
//   ) => {
//     useEffect(() => {
//       if (textAreaRef) {
//         textAreaRef.style.height = "0px";
//         const scrollHeight = textAreaRef.scrollHeight;
//         textAreaRef.style.height = scrollHeight + "px";
//       }
//     }, [textAreaRef, value]);
//   };

//   useAutosizeTextArea(textAreaRef.current, value);

//   const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const val = evt.target?.value;
//     setValue(val);
//   };

//   return (
//     <div className="TaskText">
//       <textarea
//         id="review-text"
//         // className="strikethrough"
//         onChange={handleChange}
//         // placeholder={value}
//         ref={textAreaRef}
//         rows={1}
//         value={value}
//         style={checked ? {
//           textDecoration: "line-through var(--red) 2px",
//           opacity: "0.7"
//         } : null}
//       />
//     </div>
//   );
// }
