import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getMessages } from "../controllers/messageController.js";

const router = express.Router();

// Get paginated messages for a channel
router.get("/:channelId", protect, getMessages);

export default router;
