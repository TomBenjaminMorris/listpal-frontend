import { useState } from 'react';
import './Task.css'

const Task = ({ task }) => {
    console.log("rendering: Task")
    const [value, setValue] = useState(task.Description);

    /*eslint-enable*/
    return (
        <div className="task-container">
            <label className="form-control">
                <input type="checkbox" name="checkbox" />
                <input className="task-text-box" type="text" value={value} onChange={(e) => setValue(e.target.value)} />
            </label>
        </div>
    );
};

export default Task;
