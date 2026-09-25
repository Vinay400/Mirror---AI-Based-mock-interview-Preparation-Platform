import api from "./axios";

export const register = (userData) => {
    return api.post("/auth/register", userData);
}

export const login = (userData) => {
    return api.post("/auth/login", userData);
}

export const verifyEmail = (token) => {
    return api.post(`/auth/verify-email/${token}`);
}

export const resendVerification = (email) => {
    return api.post("/auth/resend-verification", { email });
}

export const forgotPassword = (email) => {
    return api.post("/auth/forgot-password", { email });
}

export const resetPassword = (token, password) => {
    return api.post(`/auth/reset-password/${token}`, { password });
}
