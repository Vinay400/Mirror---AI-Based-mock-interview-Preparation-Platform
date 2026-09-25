import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import bcrypt from "bcrypt";
import {
    createSecureToken,
    hashSecureToken,
    VERIFICATION_TTL_MS,
    RESET_TTL_MS,
} from "../utils/secureToken.js";
import { validatePassword } from "../utils/validatePassword.js";
import {
    sendVerificationEmail,
    sendPasswordResetEmail,
} from "../services/emailService.js";

// Deliberately vague: these replies must be byte-identical whether or not the
// address belongs to an account, otherwise the API becomes a way to enumerate
// registered users.
const GENERIC_REGISTER_MESSAGE =
    "If that address is new, we've sent a verification link. Check your inbox to finish setting up.";
const GENERIC_RESET_MESSAGE =
    "If an account exists for that address, we've sent a password reset link.";
const GENERIC_RESENT_MESSAGE =
    "If that address needs verification, we've sent a fresh link.";
const GENERIC_INVALID_CREDENTIALS = "Invalid email or password.";

// Mints a fresh verification token, stores only its hash, and emails the raw
// value. Shared by register and resend-verification.
const issueVerification = async (user) => {
    const rawToken = createSecureToken();
    user.verificationTokenHash = hashSecureToken(rawToken);
    user.verificationTokenExpires = new Date(Date.now() + VERIFICATION_TTL_MS);
    await user.save();
    await sendVerificationEmail(user, rawToken);
};

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required!" });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            // Same response as a brand new signup. Only genuinely unverified
            // accounts get a new mail, so this can't be used to spam someone.
            if (!userExists.isVerified) {
                await issueVerification(userExists);
            }
            return res.status(201).json({ message: GENERIC_REGISTER_MESSAGE });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // The token is generated up front so the account and its verification
        // hash land in a single write.
        const rawToken = createSecureToken();
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            isVerified: false,
            verificationTokenHash: hashSecureToken(rawToken),
            verificationTokenExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
        });
        await newUser.save();

        await sendVerificationEmail(newUser, rawToken);

        // No session token here on purpose: handing one back for a new account
        // while withholding it for a duplicate would leak which emails exist.
        res.status(201).json({ message: GENERIC_REGISTER_MESSAGE });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        if (!token) {
            return res.status(400).json({ message: "Verification token is required." });
        }

        const user = await User.findOne({
            verificationTokenHash: hashSecureToken(token),
            verificationTokenExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                message: "This verification link is invalid or has expired. Request a new one below.",
                code: "INVALID_VERIFICATION_TOKEN",
            });
        }

        user.isVerified = true;
        // Clearing the fields makes the link single-use.
        user.verificationTokenHash = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        const sessionToken = generateToken(user);
        res.json({ token: sessionToken });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await User.findOne({ email });
        if (user && !user.isVerified) {
            await issueVerification(user);
        }

        res.json({ message: GENERIC_RESENT_MESSAGE });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, remember } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required!" });
        }

        // User retrieval in MongoDB
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: GENERIC_INVALID_CREDENTIALS });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: GENERIC_INVALID_CREDENTIALS });
        }

        // Only past this point is the caller proven to own the account, so it's
        // safe to explain what's actually wrong.
        if (user.isVerified === false) {
            return res.status(403).json({
                message: "Please verify your email address before signing in.",
                code: "EMAIL_NOT_VERIFIED",
            });
        }

        const token = generateToken(user, Boolean(remember));
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await User.findOne({ email });
        if (user) {
            const rawToken = createSecureToken();
            user.resetTokenHash = hashSecureToken(rawToken);
            user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
            await user.save();

            await sendPasswordResetEmail(user, rawToken);
        }

        // Identical whether or not the account exists.
        res.json({ message: GENERIC_RESET_MESSAGE });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Reset token is required." });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        const user = await User.findOne({
            resetTokenHash: hashSecureToken(token),
            resetTokenExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                message: "This reset link is invalid or has expired. Please request a new one.",
                code: "INVALID_RESET_TOKEN",
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        // Invalidate every session token issued before this moment.
        user.passwordChangedAt = new Date();
        // Completing a reset proves control of the inbox, so it doubles as
        // verification — otherwise a user who never clicked the original link
        // would reset successfully and still be unable to sign in.
        user.isVerified = true;
        user.resetTokenHash = undefined;
        user.resetTokenExpires = undefined;
        await user.save();

        res.json({ message: "Password updated. You can now sign in." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
