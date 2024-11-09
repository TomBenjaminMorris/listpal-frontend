import { updateBoardCategoryOrder } from "./apiGatewayClient";

/*eslint-disable*/
export function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

export function isTokenExpired() {
    if (sessionStorage.accessToken) {
        const accessToken = parseJwt(sessionStorage.accessToken.toString());
        const now = Math.floor(Date.now() / 1000);
        const expiry = accessToken.exp;
        return now > expiry;
    } else {
        console.log("isTokenExpired: token missing")
    }
}

export function calcPercents({ YTarget, MTarget, WTarget, WScore, MScore, YScore }) {
    const YP = (YScore / YTarget) * 100;
    const MP = MTarget ? (MScore / MTarget) * 100 : (MScore / (YTarget / 12)) * 100;
    const WP = WTarget ? (WScore / WTarget) * 100 : (WScore / (YTarget / 52)) * 100;
    return { Y: YP, M: MP, W: WP }
}

export function isAuthenticated() {
    const accessToken = sessionStorage.getItem('accessToken');
    return !!accessToken;
};

export function isUrlValid(userInput) {
    var res = userInput.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    if (res == null)
        return false;
    else
        return true;
}

export function getSortArray(boards) {
    let sortArr = []
    const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'))
    const boardID = getBoardIdFromUrl()

    if (ls_currentBoard && ls_currentBoard.CategoryOrder) {
        sortArr = ls_currentBoard.CategoryOrder;
    } else {
        boards.forEach(b => {
            if (b.SK === boardID) {
                sortArr = b.CategoryOrder
            }
        });
    }
    return sortArr;
}

export function updateCategoryOrder(sortArr, boards, setBoards) {
    let tmpBoards = [...boards]
    const boardID = getBoardIdFromUrl();
    tmpBoards.forEach(b => {
        if (b.SK === boardID) {
            let tmpBoard = b
            tmpBoard['CategoryOrder'] = sortArr;
            localStorage.setItem('activeBoard', JSON.stringify(tmpBoard));
            b['CategoryOrder'] = sortArr
            updateBoardCategoryOrder(boardID, JSON.stringify(sortArr));
        }
    });
    setBoards(tmpBoards);
}

export function getBoardIdFromUrl() {
    const url = window.location.href;
    const boardID = url.split('/').pop();
    return boardID;
}
