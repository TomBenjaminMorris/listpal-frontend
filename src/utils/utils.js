import { queueBoardUpdate } from "./syncEngine";

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
        return true;
    }
    const now = Math.floor(Date.now() / 1000);
    return now > accessToken.exp;
}

export function calcPercents({ YTarget, MTarget, WTarget, WScore, MScore, YScore }) {
    const YP = (YScore / YTarget) * 100;
    const MP = MTarget ? (MScore / MTarget) * 100 : (MScore / (YTarget / 12)) * 100;
    const WP = WTarget ? (WScore / WTarget) * 100 : (WScore / (YTarget / 52)) * 100;
    return { Y: YP, M: MP, W: WP };
}

// Null rejects the whole edit rather than stripping characters, as a pasted 1.5 must not become 15
export function parseScoreInput(value) {
    return /^\d*$/.test(value) ? value.replace(/^0+(?=\d)/, '') : null;
}

const SCORE_FIELDS_SHORTEST_FIRST = ['WScore', 'MScore', 'YScore'];

// A week sits inside its month and year, so a longer period can't have scored less than a shorter one
export function applyManualScore(scores, field, value) {
    const updated = { ...scores, [field]: value };
    SCORE_FIELDS_SHORTEST_FIRST.slice(SCORE_FIELDS_SHORTEST_FIRST.indexOf(field) + 1).forEach(longer => {
        if (Number(value) > Number(scores[longer])) updated[longer] = Number(value);
    });
    return updated;
}

export function isAuthenticated() {
    return !!sessionStorage.getItem('accessToken');
}

export function isUrlValid(userInput) {
    const urlPattern = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/;
    return urlPattern.test(userInput);
}

export function updateCategoryOrder(sortArr, setBoards) {
    const boardID = getBoardIdFromUrl();
    setBoards(current => current.map(b => b.SK === boardID ? { ...b, CategoryOrder: sortArr } : b));
    queueBoardUpdate(boardID, { CategoryOrder: JSON.stringify(sortArr) });
}

export function getBoardIdFromUrl() {
    const url = window.location.href;
    const boardID = url.split('/').pop();
    return boardID || null;
}

// Large scores share a small space with other text, which has room for "9,999" but not "12,345"
export function formatScore(score) {
    return score < 10000
        ? score.toLocaleString()
        : score.toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 1 });
}

// The ISO week of the year
export function getWeek(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() != 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}

// Days left after today in the current year
export function getDaysRemaining(date) {
    const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfYear = new Date(date.getFullYear(), 11, 31);
    return Math.round((endOfYear - today) / 86400000);
}

export function getNextMondayAt5AM() {
    const today = new Date();
    const currentDay = today.getDay();
    const currentTime = today.getHours() * 100 + today.getMinutes(); // Time in HHMM format
    let daysUntilMonday = (1 - currentDay + 7) % 7;
    if (currentDay === 1 && currentTime >= 500) {
        daysUntilMonday = 7;
    }
    today.setDate(today.getDate() + daysUntilMonday);
    today.setHours(5, 0, 0, 0);
    return String(today.valueOf());
}

// Mirrors listpal-backend/src/score_periods.js so the optimistic score matches what the server will apply
export function periodsContaining(completedMs, nowMs) {
    if (!Number.isFinite(completedMs)) return [];
    const now = new Date(nowMs);
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const daysSinceMonday = (now.getUTCDay() + 6) % 7;
    const starts = {
        WScore: Date.UTC(year, month, now.getUTCDate() - daysSinceMonday),
        MScore: Date.UTC(year, month, 1),
        YScore: Date.UTC(year, 0, 1)
    };
    return Object.keys(starts).filter(field => completedMs >= starts[field]);
}
