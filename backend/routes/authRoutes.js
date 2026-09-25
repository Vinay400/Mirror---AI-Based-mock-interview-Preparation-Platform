import express from "express";
import {
    register,
    login,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
} from "../controller/authController.js";
import protect from "../middleware/authMiddleware.js"
import { authLimiter, emailLimiter } from "../middleware/rateLimiters.js";
const router = express.Router();

// The limiters go on the routes rather than the router so that /check — which
// is called on every page load — isn't caught by the credential-stuffing cap.
router.post("/register", emailLimiter, register);
router.post("/login", authLimiter, login);
router.post("/verify-email/:token", authLimiter, verifyEmail);
router.post("/resend-verification", emailLimiter, resendVerification);
router.post("/forgot-password", emailLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);
router.get("/check", protect, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});
export default router;
