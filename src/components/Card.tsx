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
            <div className="headingWrapper">
                <h2>{title}</h2>
                <h3 className="score">{"20"}</h3>
            </div>
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
