import { useState, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createRandomString } from '../utils/utils';
import Card from './Card';
import './CardList.css'

const CardList = ({ activeTasks, sortedTasks, setActiveTasks }) => {
    // console.log("rendering: CardList")
    const [cardList, setCardList] = useState(sortedTasks);
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    var cards = Object.keys(cardList).map(function (key) {
        return <Card key={key} title={key} tasks={sortedTasks[key]} setActiveTasks={setActiveTasks} activeTasks={activeTasks} />
    });

    const handleNewCard = () => {
        let cardListTmp = cardList;
        const tmpName = createRandomString(9);
        const newCardDefaultTask = {
            "CreatedDate": Date.now(),
            "SK": "t#" + uuidv4(),
            "GSI1-SK": "nil",
            "GSI1-PK": "b#12345",
            "ExpiryDate": "nil",
            "Description": "new task...",
            "CompletedDate": "nil",
            "PK": "u#365202d4-0091-708b-eafe-0027f8ef9007",
            "Category": tmpName,
            "EntityType": "Task"
        }
        cardListTmp[tmpName] = [newCardDefaultTask];
        setCardList(cardListTmp);
        const activeTasksTmp = activeTasks;
        activeTasksTmp.push(newCardDefaultTask);
        setActiveTasks(activeTasksTmp);
        forceUpdate();
    }

    return (
        <div className="card-list-container">
            {cards}
            <div id="addCardButton" onClick={handleNewCard}>+</div>
        </div>
    );
};

export default CardList;
