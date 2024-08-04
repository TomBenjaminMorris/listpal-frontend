import Card from './Card';
import './CardList.css'

const CardList = ({ sortedTasks }) => {
    console.log("rendering: CardList")

    var cards = Object.keys(sortedTasks).map(function(key) {
        return <Card key={key} title={key} tasks={sortedTasks[key]}/>
    });

    /*eslint-enable*/
    return (
        <div className="card-list-container">
            { cards }
        </div>
    );
};

export default CardList;
