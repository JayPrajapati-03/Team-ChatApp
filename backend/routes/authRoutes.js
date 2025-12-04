import express from "express";
import { register, login } from "../controllers/authController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Protected route
router.get("/me", protect, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});

export default router;
