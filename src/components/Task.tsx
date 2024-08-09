import { useState } from 'react';
import binIcon from "../assets/icons8-delete-24.png"
import './Task.css'
// const fakeApi = () => console.log('Api is called')

const Task = ({ task, activeTasks, setActiveTasks }) => {
    // console.log("rendering: Task")
    const [value, setValue] = useState(task.Description);
    const [checked, setChecked] = useState(task.CompletedDate != "nil");
    const [timer, setTimer] = useState(null);
    const [display, setDisplay] = useState(true);

    const handleCheckBox = () => {
        setChecked((checked) => !checked);
        updateActiveTaskChecked(!checked);
    }

    const handleTextUpdate = e => {
        setValue(e.target.value)
        clearTimeout(timer)
        const newTimer = setTimeout(() => {
            // fakeApi()
            updateActiveTaskDescription(e.target.value)
        }, 1000)
        setTimer(newTimer)
    }

    const updateActiveTaskDescription = (value) => {
        const activeTasksTmp = activeTasks.map(t => {
            if (t.SK === task.SK) {
                t.Description = value;
            }
            return t;
        })
        setActiveTasks(activeTasksTmp);
    }

    const updateActiveTaskChecked = (c) => {
        const activeTasksTmp = activeTasks.map(t => {
            if (t.SK === task.SK) {
                if (c) {
                    const today = new Date();
                    t.CompletedDate = Date.now();
                    t["GSI1-SK"] = today;
                    t.ExpiryDate = today.setDate(today.getDate() + 3);
                } else {
                    t.CompletedDate = "nil";
                    t["GSI1-SK"] = "nil";
                    t.ExpiryDate = "nil";
                }
            }
            return t;
        })
        setActiveTasks(activeTasksTmp);
    }

    const handleDeleteTask = () => {
        const activeTasksTmp = activeTasks.filter(t => t.SK !== task.SK);
        setActiveTasks(activeTasksTmp);
        setDisplay(false);
    }

    return (
        <div className="task-container" style={display ? null : { display: "none" }}>
            <input type="checkbox" name="checkbox" checked={checked} onChange={handleCheckBox} />
            <input className="task-text-box strikethrough" disabled={checked} type="text" value={value} onChange={handleTextUpdate} style={checked ? { textDecoration: "line-through", opacity: "0.4" } : null} />
            <div className="deleteTask">
                <img className="deleteTask" src={binIcon} alt="delete icon" onClick={handleDeleteTask} />
            </div>
        </div>
    );
};

export default Task;
