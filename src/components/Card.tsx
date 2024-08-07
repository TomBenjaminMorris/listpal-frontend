import Task from './Task';
import './Card.css'

const Card = ({ title, tasks }) => {
    // console.log("rendering: Card")
    const tasksRendered = tasks.map((task) => {
        return (
            <Task key={task.SK} task={task}></Task>
        )
    });

    return (
        <div className="card-container">
            <h2>{title}</h2>
            <hr />
            {tasksRendered}
            <div className="task-container">
                <div id="addTask">+</div>
            </div>
            {/* <button id="addTaskButton">+</button> */}
        </div>
    );
};

export default Card;
