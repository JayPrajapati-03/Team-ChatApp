import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { getOnlineUsers } from "../utils/onlineUsers.js";
import { User } from "../models/User.js";

const router = express.Router();

// Get all users with online status
router.get("/", protect, async (req, res) => {
  try {
    const online = getOnlineUsers();

    const allUsers = await User.find({}).select("username email _id");
    const usersWithStatus = allUsers.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      isOnline: online.includes(user._id.toString())
    }));

    res.json({ onlineUsers: usersWithStatus });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching online users",
      error: error.message
    });
  }
});

export default router;
