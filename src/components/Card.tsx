import { useReducer, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Task from './Task';
import './Card.css'

const fakeApi = (titleEdited) => console.log('Renaming title to: ' + titleEdited)

const Card = ({ title, tasks, setActiveTasks, activeTasks }) => {
    // console.log("rendering: Card")
    const [titleEdited, setTitleEdited] = useState(title);
    const [timer, setTimer] = useState(null);
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    const tasksRendered = tasks.map((task) => {
        return (
            <Task key={task.SK} task={task} activeTasks={activeTasks} setActiveTasks={setActiveTasks}></Task>
        )
    });

    const handleEditTitle = e => {
        setTitleEdited(e.target.value)
        clearTimeout(timer)
        const newTimer = setTimeout(() => {
            fakeApi(e.target.value)
            renameCategory(e.target.value)
        }, 4000)
        setTimer(newTimer);
    }

    const renameCategory = (newTitle) => {
        const activeTasksTmp = activeTasks.map((t) => {
            if (t.Category === title) {
                t.Category = newTitle;
            }
            return t
        });
        setActiveTasks(activeTasksTmp);
    }

    const handleNewTask = async () => {
        // console.log("TTT triggered: handleNewTask")
        const emptyTask = {
            "CreatedDate": Date.now(),
            "SK": "t#" + uuidv4(),
            "GSI1-SK": "nil",
            "GSI1-PK": "b#12345",
            "ExpiryDate": "nil",
            "Description": "new task...",
            "CompletedDate": "nil",
            "PK": "u#365202d4-0091-708b-eafe-0027f8ef9007",
            "Category": title,
            "EntityType": "Task"
        }
        let tmpActiveTasks = activeTasks;
        tmpActiveTasks.push(emptyTask);
        tasks.push(emptyTask);
        setActiveTasks(tmpActiveTasks);
        forceUpdate();
    }

    return (
        <div className="card-container">
            <div className="headingWrapper">
                <input className="edit-title-input" type="text" value={titleEdited} onChange={handleEditTitle} />
                {/* <h2 onClick={handleEditTitle}>{title}</h2> */}
                {/* <h3 className="score">{"0"}</h3> */}
            </div>
            <hr />
            {tasksRendered}
            <div className="task-container">
                <div onClick={handleNewTask} id="addTask">+</div>
            </div>
        </div>
    );
};

export default Card;
