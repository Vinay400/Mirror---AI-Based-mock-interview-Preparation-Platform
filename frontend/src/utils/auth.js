export const getToken = () => {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export const setToken = (token, remember = false) => {
    // Remembered sessions persist for 30 days; otherwise the token
    // is tied to the browser session and cleared on tab close.
    if (remember) {
        sessionStorage.removeItem("token");
        localStorage.setItem("token", token);
    } else {
        localStorage.removeItem("token");
        sessionStorage.setItem("token", token);
    }
}

export const removeToken = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
}
