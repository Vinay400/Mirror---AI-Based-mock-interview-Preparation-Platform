import crypto from "crypto";

// Tokens for email-driven flows (account verification, password reset).
// The raw value is what gets emailed; only its SHA-256 hash is ever stored, so
// a database dump yields no usable links. Not to be confused with
// utils/generateToken.js, which signs session JWTs.

export const createSecureToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

export const hashSecureToken = (rawToken) => {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
};

// Verification links are valid for a day; reset links are deliberately tighter
// since an intercepted reset link is an immediate account takeover.
export const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
export const RESET_TTL_MS = 30 * 60 * 1000;
