export const MIN_PASSWORD_LENGTH = 8;

// Returns an error message, or null when the password is acceptable.
// Used by both register and reset-password so the two flows agree.
export const validatePassword = (password) => {
    if (typeof password !== "string" || password.length === 0) {
        return "Password is required.";
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    return null;
};
