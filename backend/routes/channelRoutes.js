import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createChannel,
  getChannels,
  joinChannel,
  leaveChannel,
  getChannelMembers,
  updateChannel,
  deleteChannel
} from "../controllers/channelController.js";

const router = express.Router();

// Create channel
router.post("/create", protect, createChannel);

// Get all channels
router.get("/", protect, getChannels);

// Join channel
router.post("/join", protect, joinChannel);

// Leave channel
router.post("/leave", protect, leaveChannel);

// Get members
router.get("/:channelId/members", protect, getChannelMembers);

// UPDATE (rename) channel
router.put("/update/:channelId", protect, updateChannel);

// DELETE channel
router.delete("/delete/:channelId", protect, deleteChannel);

export default router;
