import { useState } from 'react';
import binIcon from "../assets/icons8-bin-50.png"
import './Task.css'

const Task = ({ task }) => {
    // console.log("rendering: Task")
    const [value, setValue] = useState(task.Description);
    const [checked, setChecked] = useState(task.CompletedDate != "nil");

    const handleCheckBox = () => {
        setChecked((checked) => !checked);
    }

    return (
        <div className="task-container">
            <input type="checkbox" name="checkbox" checked={checked} onChange={handleCheckBox} />
            <input className="task-text-box strikethrough" disabled={checked} type="text" value={value} onChange={(e) => setValue(e.target.value)} style={checked ? { textDecoration: "line-through", opacity: "0.4" } : null} />
            <div className="deleteTask">
                <img className="deleteTask" src={binIcon} alt="delete icon" />
            </div>
            {/* <div className="strikethrough">Favor packaging over toy</div> */}
        </div>
    );
};

export default Task;
