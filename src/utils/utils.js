import { updateBoardCategoryOrder } from "./apiGatewayClient";

export function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Invalid JWT token", e);
        return null;
    }
}

export function isTokenExpired() {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
        console.log("isTokenExpired: token missing");
        return true;
    }
    const accessToken = parseJwt(token);
    if (!accessToken) {
        return true; // Invalid token
    }
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    return now > accessToken.exp;
}

export function calcPercents({ YTarget, MTarget, WTarget, WScore, MScore, YScore }) {
    const YP = (YScore / YTarget) * 100;
    const MP = MTarget ? (MScore / MTarget) * 100 : (MScore / (YTarget / 12)) * 100;
    const WP = WTarget ? (WScore / WTarget) * 100 : (WScore / (YTarget / 52)) * 100;
    return { Y: YP, M: MP, W: WP };
}

export function isAuthenticated() {
    return !!sessionStorage.getItem('accessToken');
}

export function isUrlValid(userInput) {
    const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
    return urlPattern.test(userInput);
}

export function getSortArray(boards) {
    const ls_currentBoard = JSON.parse(localStorage.getItem('activeBoard'));
    const boardID = getBoardIdFromUrl();
    if (ls_currentBoard?.CategoryOrder) {
        return ls_currentBoard.CategoryOrder;
    }
    const board = boards.find(b => b.SK === boardID);
    return board ? board.CategoryOrder : [];
}

export function updateCategoryOrder(sortArr, boards, setBoards) {
    const boardID = getBoardIdFromUrl();
    const updatedBoards = boards.map(b => {
        if (b.SK === boardID) {
            const updatedBoard = { ...b, CategoryOrder: sortArr };
            localStorage.setItem('activeBoard', JSON.stringify(updatedBoard));
            updateBoardCategoryOrder(boardID, JSON.stringify(sortArr));
            return updatedBoard;
        }
        return b;
    });
    setBoards(updatedBoards);
}

export function getBoardIdFromUrl() {
    const url = window.location.href;
    const boardID = url.split('/').pop();
    return boardID || null;
}
