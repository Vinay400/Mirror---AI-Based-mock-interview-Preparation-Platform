import express from "express";
import { register, login } from "../controller/authController.js";
import protect from "../middleware/authMiddleware.js"
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/check", protect, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});
export default router;