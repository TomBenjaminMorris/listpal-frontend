import { useState } from 'react';
import './Task.css'
import binIcon from "../assets/icons8-bin-50.png"

const Task = ({ task }) => {
    // console.log("rendering: Task")
    const [value, setValue] = useState(task.Description);

    return (
        <div className="task-container">
            {/* <label className="form-control"> */}
            <input type="checkbox" name="checkbox" />
            <input className="task-text-box" type="text" value={value} onChange={(e) => setValue(e.target.value)} />
            <div className="deleteTask">
                <img className="deleteTask" src={binIcon} alt="delete icon" />
            </div>
            {/* </label> */}
        </div>
    );
};

export default Task;
