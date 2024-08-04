import './Task.css'

const Task = ({ task }) => {
    console.log("rendering: Task")

    /*eslint-enable*/
    return (
        <div className="task-container">
            <label className="form-control">
                <input type="checkbox" name="checkbox" />
                <input className="task-text-box" type="text" value={task.Description} />
            </label>
        </div>
    );
};

export default Task;
