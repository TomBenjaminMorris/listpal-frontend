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

// export function createRandomString(length) {
//     const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     let result = "";
//     for (let i = 0; i < length; i++) {
//         result += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return result;
// }

export function calcPercents({ YTarget, MTarget, WTarget, WScore, MScore, YScore }) {
    // console.log("TTT triggered: calcPercents");
    const YP = (YScore / YTarget) * 100;
    const MP = MTarget ? (MScore / MTarget) * 100 : (MScore / (YTarget / 12)) * 100;
    const WP = WTarget ? (WScore / WTarget) * 100 : (WScore / (YTarget / 52)) * 100;
    return { Y: Math.round(YP), M: Math.round(MP), W: Math.round(WP) }
}
