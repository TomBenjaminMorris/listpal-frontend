import Task from './Task';
import './Card.css'

const Card = ({ title, tasks }) => {
    console.log("rendering: Card")
    const tasksRendered = tasks.map((task) => {
        return (
            <Task key={task.SK} task={task}></Task>
        )
    });

    /*eslint-enable*/
    return (
        <div className="card-container">
            <h2>{title}</h2>
            { tasksRendered }
        </div>
    );
};

export default Card;
